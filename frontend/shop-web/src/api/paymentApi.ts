import { supabase } from '../lib/supabaseClient';

export const paymentApi = {
  /** Rejestruje transakcję w Przelewy24 i zwraca adres, na który trzeba przekierować klienta. */
  createP24Payment: async (orderId: number): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('p24-create-payment', { body: { orderId } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.redirectUrl as string;
  },
};
