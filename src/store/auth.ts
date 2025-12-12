import { create } from 'zustand';
import { authApi } from '@/lib/api';
import { tokenManager } from '@/lib/token';
import type { User, Profile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      // Check if we have tokens stored
      if (tokenManager.hasTokens()) {
        // Try to get current user from backend
        const user = await authApi.getMe();
        set({ user: user as User });
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid tokens
      tokenManager.clearTokens();
      set({ user: null, profile: null });
    } finally {
      set({ initialized: true });
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const profile = await authApi.getProfile();
      set({ profile: profile as Profile });
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const response = await authApi.signIn({ email, password });
      set({ user: response.user as User });
      await get().fetchProfile();
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ loading: true });
    try {
      const response = await authApi.signUp({ email, password, fullName });
      set({ user: response.user as User });
      await get().fetchProfile();
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await authApi.signOut();
      set({ user: null, profile: null });
    } finally {
      set({ loading: false });
    }
  },
}));

