// Supabase Edge Function — translate
//
// Admin-only helper behind the "Przetłumacz na EN" buttons in the admin panel.
// Receives { texts: { key: "polski tekst", ... } } and returns { translations: { key: "English text", ... } }.
// HTML tags, attributes and URLs inside the texts are preserved. Uses the provider/model configured
// for the support chat (chatbot_settings), with the same secrets as chat-support.
//
// Deploy:  supabase functions deploy translate --no-verify-jwt
// Secrets: ANTHROPIC_API_KEY (or OPENAI_API_KEY when the chat provider is OpenAI)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_TOTAL_CHARS = 20000;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

const SYSTEM_PROMPT =
  'You translate content for "Szczyt", a Polish online shop with mountain and outdoor gear, from Polish into natural, ' +
  'concise English. You receive a JSON object whose values are Polish texts. Return ONLY a JSON object with exactly the ' +
  'same keys and the English translations as values — no commentary, no code fences. Keep HTML tags, attributes, URLs, ' +
  'product model names and brand names unchanged; translate only the human-readable text. Keep empty values empty.';

async function callAnthropic(apiKey: string, model: string, payload: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 8000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: payload }] }),
  });
  if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
}

async function callOpenAI(apiKey: string, model: string, payload: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: payload }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/** Pulls the JSON object out of the model reply even if it was wrapped in a code fence. */
function parseJsonObject(raw: string): Record<string, string> {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Model returned no JSON.');
  return JSON.parse(raw.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    // JWT verification is off at the platform level (publishable keys are not JWTs), so authorise here:
    // only a signed-in user whose profile has role = 'Admin' may spend LLM tokens.
    const authHeader = req.headers.get('Authorization') ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!accessToken) return jsonResponse({ error: 'Musisz być zalogowany.' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData.user) return jsonResponse({ error: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: profile } = await admin.from('profiles').select('role').eq('id', userData.user.id).single();
    if (profile?.role !== 'Admin') return jsonResponse({ error: 'Brak uprawnień.' }, 403);

    const body = await req.json();
    const texts: Record<string, string> = {};
    for (const [k, v] of Object.entries(body?.texts ?? {})) if (typeof v === 'string' && v.trim()) texts[k] = v;
    if (Object.keys(texts).length === 0) return jsonResponse({ translations: {} });
    if (Object.values(texts).join('').length > MAX_TOTAL_CHARS) return jsonResponse({ error: 'Tekst jest zbyt długi.' }, 400);

    const { data: settings } = await admin.from('chatbot_settings').select('provider, model').eq('id', 1).single();
    const provider = settings?.provider === 'openai' ? 'openai' : 'anthropic';
    const model = settings?.model || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-5-5');
    const payload = JSON.stringify(texts);

    let raw: string;
    if (provider === 'openai') {
      const key = Deno.env.get('OPENAI_API_KEY');
      if (!key) throw new Error('Brak OPENAI_API_KEY w sekretach Edge Function.');
      raw = await callOpenAI(key, model, payload);
    } else {
      const key = Deno.env.get('ANTHROPIC_API_KEY');
      if (!key) throw new Error('Brak ANTHROPIC_API_KEY w sekretach Edge Function.');
      raw = await callAnthropic(key, model, payload);
    }

    const parsed = parseJsonObject(raw);
    const translations: Record<string, string> = {};
    for (const k of Object.keys(texts)) translations[k] = typeof parsed[k] === 'string' ? parsed[k] : '';
    return jsonResponse({ translations });
  } catch (err) {
    console.error('translate error:', err);
    // Admin-only endpoint, so it is safe to show the reason (missing secret, wrong model name, quota...).
    const reason = err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300);
    return jsonResponse({ error: `Tłumaczenie nie powiodło się: ${reason}` }, 500);
  }
});
