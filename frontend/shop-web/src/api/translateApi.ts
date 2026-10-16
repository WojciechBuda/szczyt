import { supabase } from '../lib/supabaseClient';

/**
 * Asks the admin-only `translate` Edge Function to translate Polish texts into English.
 * Keys are echoed back, so callers can send several fields in one request.
 */
export async function translateToEnglish(texts: Record<string, string>): Promise<Record<string, string>> {
  const { data, error } = await supabase.functions.invoke('translate', { body: { texts } });
  if (error) {
    // supabase-js only says "non-2xx status code"; the useful text is in the response body.
    const res = (error as { context?: Response }).context;
    let message = error.message;
    if (res && typeof res.json === 'function') {
      try {
        const body = await res.json();
        if (body?.error) message = `${body.error} (HTTP ${res.status})`;
        else message = `${message} (HTTP ${res.status})`;
      } catch { message = `${message} (HTTP ${res.status})`; }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return (data?.translations ?? {}) as Record<string, string>;
}
