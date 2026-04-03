import React, { createContext, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

interface User {
  id: string;
  displayName: string;
  familyId: string;
  familyName: string;
}

interface SessionState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  signIn: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },
  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userRaw = await SecureStore.getItemAsync(USER_KEY);
    const user = userRaw ? (JSON.parse(userRaw) as User) : null;
    set({ token, user, isLoading: false });
  },
}));

const SessionContext = createContext<{
  session: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
} | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const store = useSessionStore();

  useEffect(() => {
    store.hydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session: store.token,
        user: store.user,
        isLoading: store.isLoading,
        signIn: store.signIn,
        signOut: store.signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
