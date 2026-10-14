import { create } from 'zustand';
import { User } from '../types/User';

interface AuthState {
  user: User | null;
  /** True once the initial Supabase session check on app load has finished. */
  initialized: boolean;
  setUser: (user: User | null) => void;
  setInitialized: (value: boolean) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

/**
 * Holds the current user for the UI. The actual auth token lives inside the
 * Supabase client's own session (persisted by supabase-js) — this store just
 * mirrors the derived profile so components can render without re-fetching.
 * See App.tsx for the session bootstrap + onAuthStateChange subscription.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (value) => set({ initialized: value }),
  logout: () => set({ user: null }),
  isAdmin: () => get().user?.role === 'Admin',
}));
