// Supabase Edge Function — chat-support
//
// Proxies chat messages to an LLM (Anthropic Claude or OpenAI), keeping the
// provider API key server-side (set via `supabase secrets set`, never sent
// to the browser). Builds the system prompt from chatbot_settings + the
// visible FAQ list, both stored in Postgres and editable from the admin panel.
//
// Deploy:  supabase functions deploy chat-support --no-verify-jwt
//          (the browser sends a publishable key, not a JWT; see supabase/config.toml)
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//          supabase secrets set OPENAI_API_KEY=sk-...      (only if using OpenAI)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_HISTORY_MESSAGES = 12;
const RATE_LIMIT_PER_MINUTE = 10;

// Hard limit per visitor IP, stored in Postgres (chat_rate_check). Override without redeploying code:
//   supabase secrets set CHAT_LIMIT_PER_HOUR=10
const LIMIT_PER_HOUR = Number(Deno.env.get('CHAT_LIMIT_PER_HOUR') ?? '3');

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Cheap in-memory pre-filter (per isolate): stops bursts before they even reach the database.
const hits = new Map<string, number[]>();
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT_PER_MINUTE;
}
const MAX_MESSAGE_LENGTH = 2000;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const cleaned = raw
    .filter((m): m is ChatMessage => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));
  return cleaned.slice(-MAX_HISTORY_MESSAGES);
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, history: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: systemPrompt,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || 'Przepraszam, nie udało mi się wygenerować odpowiedzi.';
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, history: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      messages: [{ role: 'system', content: systemPrompt }, ...history.map((m) => ({ role: m.role, content: m.content }))],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Przepraszam, nie udało mi się wygenerować odpowiedzi.';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(clientIp)) {
    return jsonResponse({ error: 'Za dużo wiadomości — spróbuj za chwilę.' }, 429);
  }

  try {
    const body = await req.json();
    const history = sanitizeHistory(body?.messages);
    if (history.length === 0) {
      return jsonResponse({ error: 'Brak wiadomości.' }, 400);
    }

    // Service-role client: bypasses RLS so we can read the bot's full
    // configuration (system_prompt) and all visible FAQ entries in one go.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Hard hourly limit per IP. Only the hash is stored, never the address itself.
    // Checked before any LLM call so that blocked requests cost nothing.
    if (LIMIT_PER_HOUR > 0) {
      const { data: retryAfter, error: limitError } = await supabase.rpc('chat_rate_check', {
        p_key: await sha256Hex(`chat:${clientIp}`),
        p_limit: LIMIT_PER_HOUR,
        p_window_seconds: 3600,
      });
      // Fail closed: if the limiter is broken, do not spend tokens.
      if (limitError) throw limitError;
      if (retryAfter > 0) {
        return jsonResponse({ limited: true, retryAfterMinutes: Math.ceil(retryAfter / 60) });
      }
    }

    const [{ data: settings, error: settingsError }, { data: faqs, error: faqsError }] = await Promise.all([
      supabase.from('chatbot_settings').select('*').eq('id', 1).single(),
      supabase.from('faqs').select('question, answer, question_en, answer_en').eq('is_visible', true).order('order'),
    ]);

    if (settingsError || !settings) throw settingsError || new Error('Brak konfiguracji bota.');
    if (!settings.enabled) {
      return jsonResponse({ reply: 'Czat wsparcia jest obecnie wyłączony. Napisz do nas mailowo — odpowiemy najszybciej jak to możliwe.' });
    }
    if (faqsError) throw faqsError;

    // The storefront tells us which language the visitor picked; the model must answer in it.
    const english = body?.lang === 'en';

    const faqContext = (faqs || [])
      .map((f: { question: string; answer: string; question_en: string | null; answer_en: string | null }, i: number) =>
        english && f.question_en && f.answer_en
          ? `${i + 1}. Q: ${f.question_en}\n   A: ${f.answer_en}`
          : `${i + 1}. P: ${f.question}\n   O: ${f.answer}`)
      .join('\n\n');

    const languageRule = english
      ? '\n\nIMPORTANT: the customer is using the English version of the shop. Always answer in English, whatever language the instructions above are written in.'
      : '';

    const systemPrompt = `${settings.system_prompt}${languageRule}\n\n--- FAQ sklepu (wykorzystaj jako źródło wiedzy) ---\n${faqContext}`;

    let reply: string;
    if (settings.provider === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) throw new Error('Brak OPENAI_API_KEY w sekretach Edge Function.');
      reply = await callOpenAI(apiKey, settings.model, systemPrompt, history);
    } else {
      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) throw new Error('Brak ANTHROPIC_API_KEY w sekretach Edge Function.');
      reply = await callAnthropic(apiKey, settings.model, systemPrompt, history);
    }

    return jsonResponse({ reply });
  } catch (err) {
    console.error('chat-support error:', err);
    return jsonResponse({ error: 'Asystent jest chwilowo niedostępny. Spróbuj ponownie za chwilę.' }, 500);
  }
});
