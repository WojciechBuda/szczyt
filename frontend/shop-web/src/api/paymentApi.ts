import { supabase } from '../lib/supabaseClient';

export const paymentApi = {
  /** Rejestruje transakcję w Przelewy24 i zwraca adres, na który trzeba przekierować klienta. */
  createP24Payment: async (orderId: number): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('p24-create-payment', { body: { orderId } });
    if (error) {
      // supabase-js hides the real reason behind generic texts; recover it from the response body.
      const res = (error as { context?: Response }).context;
      if (res && typeof res.json === 'function') {
        try {
          const body = await res.json();
          if (body?.error) throw new Error(`${body.error} (HTTP ${res.status})`);
        } catch (inner) {
          if (inner instanceof Error && inner.message.includes('(HTTP')) throw inner;
        }
        throw new Error(`${error.message} (HTTP ${res.status})`);
      }
      // No response at all: the browser could not reach the function (not deployed, wrong URL, offline).
      throw new Error('Payment service unreachable. The p24-create-payment Edge Function is probably not deployed.');
    }
    if (data?.error) throw new Error(data.error);
    return data.redirectUrl as string;
  },
};
