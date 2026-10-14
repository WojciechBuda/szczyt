// Supabase Edge Function — p24-webhook
//
// Przelewy24 woła ten adres server-to-server po tym, jak klient dokończy
// płatność na ich stronie (pole urlStatus przy rejestracji transakcji).
// Weryfikujemy podpis, potwierdzamy transakcję w P24 (transaction/verify),
// dopiero wtedy oznaczamy zamówienie jako opłacone.
//
// Deploy: supabase functions deploy p24-webhook --no-verify-jwt
// (--no-verify-jwt jest konieczne: P24 nie wysyła żadnego Supabase JWT,
//  autoryzacją tego endpointu jest wyłącznie poprawny podpis SHA384 poniżej)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { p24BaseUrl, sha384Hex, p24BasicAuthHeader } from '../_shared/p24.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await req.json();
    const { merchantId, posId, sessionId, amount, originAmount, currency, orderId: p24OrderId, methodId, statement, sign } = body;

    const crc = Deno.env.get('P24_CRC')!;
    const expectedSign = await sha384Hex(
      JSON.stringify({ merchantId, posId, sessionId, amount, originAmount, currency, orderId: p24OrderId, methodId, statement, crc })
    );

    if (sign !== expectedSign) {
      console.error('p24-webhook: nieprawidłowy podpis');
      return new Response('Invalid signature', { status: 400 });
    }

    // Nasz orderId siedzi w sessionId w formacie "order-{id}-{timestamp}".
    const ourOrderId = Number(String(sessionId).split('-')[1]);
    if (!ourOrderId) return new Response('Cannot parse order id', { status: 400 });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // The amount reported by P24 must match what we registered for this session.
    const { data: payment } = await admin
      .from('payments')
      .select('amount, provider_session_id')
      .eq('order_id', ourOrderId)
      .single();
    if (!payment || payment.provider_session_id !== sessionId || Math.round(Number(payment.amount) * 100) !== Number(amount)) {
      console.error('p24-webhook: session or amount mismatch', { ourOrderId, sessionId, amount });
      return new Response('Session or amount mismatch', { status: 400 });
    }

    const apiKey = Deno.env.get('P24_API_KEY')!;
    const sandbox = (Deno.env.get('P24_SANDBOX') ?? 'true') === 'true';
    const base = p24BaseUrl(sandbox);

    const verifySign = await sha384Hex(JSON.stringify({ sessionId, orderId: p24OrderId, amount, currency, crc }));

    const verifyRes = await fetch(`${base}/api/v1/transaction/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: p24BasicAuthHeader(String(posId), apiKey),
      },
      body: JSON.stringify({ merchantId, posId, sessionId, amount, currency, orderId: p24OrderId, sign: verifySign }),
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error('P24 verify error:', errText);
      // Zwracamy 500, żeby P24 spróbowało ponownie za jakiś czas — nie oznaczamy
      // płatności jako udanej, dopóki weryfikacja się nie powiedzie.
      return new Response('Verification failed', { status: 500 });
    }

    await admin
      .from('payments')
      .update({ status: 'Succeeded', transaction_ref: String(p24OrderId), paid_at: new Date().toISOString() })
      .eq('order_id', ourOrderId);

    // Only move Pending -> Paid, so a late webhook never overwrites Shipped/Cancelled.
    await admin.from('orders').update({ status: 'Paid' }).eq('id', ourOrderId).eq('status', 'Pending');

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('p24-webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
});
