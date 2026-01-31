'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  businessType: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User, tenant: Tenant) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      _hasHydrated: false,
      setAuth: (token, user, tenant) => set({ token, user, tenant }),
      logout: () => set({ token: null, user: null, tenant: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'client-auth-storage',
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
    }
  )
);