import { supabase } from '../lib/supabaseClient';

/**
 * Asks the admin-only `translate` Edge Function to translate Polish texts into English.
 * Keys are echoed back, so callers can send several fields in one request.
 */
export async function translateToEnglish(texts: Record<string, string>): Promise<Record<string, string>> {
  const { data, error } = await supabase.functions.invoke('translate', { body: { texts } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.translations ?? {}) as Record<string, string>;
}
