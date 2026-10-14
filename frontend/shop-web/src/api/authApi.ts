import { supabase } from '../lib/supabaseClient';
import { User } from '../types/User';

/** Loads the profiles row for a user and maps it to the app's User shape. */
export async function loadProfile(userId: string, fallbackEmail: string): Promise<User> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error || !data) {
    // Rare race: the on-signup trigger that creates the profile row hasn't
    // committed yet. Fall back to a minimal profile rather than failing.
    return { id: userId, email: fallbackEmail, firstName: '', lastName: '', role: 'Customer' };
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    role: data.role,
  };
}

export const authApi = {
  register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { first_name: data.firstName, last_name: data.lastName } },
    });
    if (error) throw error;
    if (!signUpData.user) throw new Error('Rejestracja nie powiodła się.');

    if (!signUpData.session) {
      // Project has "Confirm email" enabled — account exists but isn't logged in yet.
      throw new Error('Konto utworzone! Sprawdź e-mail, aby potwierdzić rejestrację, a potem się zaloguj.');
    }

    const user = await loadProfile(signUpData.user.id, data.email);
    return { user };
  },

  login: async (data: { email: string; password: string }) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;

    const user = await loadProfile(signInData.user.id, data.email);
    return { user };
  },

  logout: () => supabase.auth.signOut(),
};
