'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { AuthSession } from './types';
import { getAuthService } from './supabase-auth';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthSession['user'] | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const serviceRef = useRef(getAuthService());

  useEffect(() => {
    const service = serviceRef.current;
    service.getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    const unsubscribe = service.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession ?? null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
