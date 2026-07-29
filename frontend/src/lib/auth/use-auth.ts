'use client';

import { useCallback } from 'react';
import { useAuthContext } from './provider';
import { getAuthService } from './supabase-auth';
import type { SignInParams, SignUpParams, AuthResult } from './types';

export function useAuth() {
  const { session, user, loading, isAuthenticated } = useAuthContext();
  const service = getAuthService();

  const signIn = useCallback(
    async (params: SignInParams): Promise<AuthResult> => {
      return service.signIn(params);
    },
    [service]
  );

  const signUp = useCallback(
    async (params: SignUpParams): Promise<AuthResult> => {
      return service.signUp(params);
    },
    [service]
  );

  const signOut = useCallback(async () => {
    await service.signOut();
  }, [service]);

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      return service.resetPassword(email);
    },
    [service]
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthResult> => {
      return service.updatePassword(newPassword);
    },
    [service]
  );

  return {
    session,
    user,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
}
