// Supabase Edge Function — p24-create-payment
//
// Rejestruje transakcję w Przelewy24 dla istniejącego zamówienia i zwraca
// adres, na który trzeba przekierować klienta, żeby dokończył płatność.
//
// Deploy:  supabase functions deploy p24-create-payment
// Sekrety: supabase secrets set P24_MERCHANT_ID=12345
//          supabase secrets set P24_POS_ID=12345          (zwykle = merchant id)
//          supabase secrets set P24_CRC=xxxxxxxxxxxxxxxx
//          supabase secrets set P24_API_KEY=xxxxxxxxxxxxxxxx
//          supabase secrets set P24_SANDBOX=true            (false na produkcji)
//          supabase secrets set SITE_URL=https://twoja-domena.pl

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { p24BaseUrl, sha384Hex, p24BasicAuthHeader } from '../_shared/p24.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { orderId } = await req.json();
    if (!orderId) return jsonResponse({ error: 'Brak orderId.' }, 400);

    // JWT verification is disabled at the platform level (publishable keys are not JWTs),
    // so authenticate the caller explicitly.
    const authHeader = req.headers.get('Authorization') ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!accessToken) return jsonResponse({ error: 'Musisz być zalogowany.' }, 401);

    // Klient "jako użytkownik" (przekazujemy jego JWT dalej) — RLS samo pilnuje,
    // że dostanie tylko WŁASNE zamówienie. To jest kontrola dostępu tego endpointu.
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData.user) return jsonResponse({ error: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

    const { data: order, error: orderError } = await userClient
      .from('orders')
      .select('id, total_amount, status, profiles(email)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) return jsonResponse({ error: 'Zamówienie nie istnieje albo brak dostępu.' }, 404);
    if (order.status !== 'Pending') return jsonResponse({ error: 'To zamówienie nie oczekuje na płatność.' }, 400);

    const email = (order as any).profiles?.email;
    if (!email) return jsonResponse({ error: 'Brak adresu e-mail klienta.' }, 400);

    const merchantId = Number(Deno.env.get('P24_MERCHANT_ID'));
    const posId = Number(Deno.env.get('P24_POS_ID') || Deno.env.get('P24_MERCHANT_ID'));
    const crc = Deno.env.get('P24_CRC')!;
    const apiKey = Deno.env.get('P24_API_KEY')!;
    const sandbox = (Deno.env.get('P24_SANDBOX') ?? 'true') === 'true';
    const siteUrl = Deno.env.get('SITE_URL')!;
    const base = p24BaseUrl(sandbox);

    const amountGrosze = Math.round(Number(order.total_amount) * 100);
    // sessionId musi być unikalny per PRÓBA płatności — dopisujemy timestamp,
    // żeby ponowna próba za to samo zamówienie nie kolidowała z poprzednią.
    const sessionId = `order-${order.id}-${Date.now()}`;

    const sign = await sha384Hex(JSON.stringify({ sessionId, merchantId, amount: amountGrosze, currency: 'PLN', crc }));

    const registerRes = await fetch(`${base}/api/v1/transaction/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: p24BasicAuthHeader(String(posId), apiKey),
      },
      body: JSON.stringify({
        merchantId,
        posId,
        sessionId,
        amount: amountGrosze,
        currency: 'PLN',
        description: `Zamówienie #${order.id} — Szczyt`,
        email,
        country: 'PL',
        language: 'pl',
        urlReturn: `${siteUrl}/payment-return?orderId=${order.id}`,
        urlStatus: `${Deno.env.get('SUPABASE_URL')}/functions/v1/p24-webhook`,
        sign,
      }),
    });

    if (!registerRes.ok) {
      const errText = await registerRes.text();
      console.error('P24 register error:', errText);
      return jsonResponse({ error: 'Nie udało się zarejestrować płatności w Przelewy24.' }, 502);
    }

    const registerData = await registerRes.json();
    const token = registerData?.data?.token;
    if (!token) return jsonResponse({ error: 'Przelewy24 nie zwróciło tokenu płatności.' }, 502);

    const redirectUrl = `${base}/trnRequest/${token}`;

    // Service-role client — zapisujemy próbę płatności niezależnie od RLS,
    // to webhook (bez sesji użytkownika) będzie ją później aktualizował.
    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await adminClient.from('payments').upsert(
      {
        order_id: order.id,
        amount: order.total_amount,
        method: 'przelewy24',
        status: 'Pending',
        provider: 'przelewy24',
        provider_session_id: sessionId,
        redirect_url: redirectUrl,
      },
      { onConflict: 'order_id' }
    );

    return jsonResponse({ redirectUrl });
  } catch (err) {
    console.error('p24-create-payment error:', err);
    return jsonResponse({ error: 'Wystąpił błąd podczas inicjowania płatności.' }, 500);
  }
});
