import type {
  AuthSession,
  AuthResult,
  SignUpParams,
  SignInParams,
  AuthEventCallback,
  AuthEventType,
} from './types';
import type { AuthService } from './service';
import { createClient } from '@/lib/supabase/client';

export class SupabaseAuthService implements AuthService {
  private listeners: AuthEventCallback[] = [];

  private toAuthSession(supabaseSession: Record<string, unknown> | null): AuthSession | null {
    if (!supabaseSession) return null;
    const user = supabaseSession.user as Record<string, unknown> | undefined;
    if (!user) return null;
    const userMetadata = (user.user_metadata ?? {}) as Record<string, string>;
    return {
      user: {
        id: user.id as string,
        email: user.email as string,
        firstName: userMetadata.first_name ?? userMetadata.firstName ?? '',
        lastName: userMetadata.last_name ?? userMetadata.lastName ?? '',
        imageUrl: userMetadata.image_url ?? userMetadata.imageUrl ?? null,
      },
      accessToken: supabaseSession.access_token as string,
      expiresAt: supabaseSession.expires_at as number,
    };
  }

  async signUp(params: SignUpParams): Promise<AuthResult> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          first_name: params.firstName ?? '',
          last_name: params.lastName ?? '',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const session = this.toAuthSession(data.session as unknown as Record<string, unknown>);
    if (session) {
      this.notifyListeners('SIGNED_IN', session);
    }
    return { success: true, session: session ?? undefined };
  }

  async signIn(params: SignInParams): Promise<AuthResult> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const session = this.toAuthSession(data.session as unknown as Record<string, unknown>);
    if (session) {
      this.notifyListeners('SIGNED_IN', session);
    }
    return { success: true, session: session ?? undefined };
  }

  async signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    this.notifyListeners('SIGNED_OUT');
  }

  async getSession(): Promise<AuthSession | null> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return this.toAuthSession(data.session as unknown as Record<string, unknown> | null);
  }

  async getUser(): Promise<AuthSession['user'] | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  async refreshSession(): Promise<AuthSession | null> {
    const supabase = createClient();
    const { data } = await supabase.auth.refreshSession();
    const session = this.toAuthSession(data.session as unknown as Record<string, unknown> | null);
    if (session) {
      this.notifyListeners('TOKEN_REFRESHED', session);
    }
    return session;
  }

  onAuthStateChange(callback: AuthEventCallback): () => void {
    this.listeners.push(callback);
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      const session = this.toAuthSession(supabaseSession as unknown as Record<string, unknown> | null);
      let eventType: AuthEventType = 'SIGNED_IN';
      if (event === 'SIGNED_OUT') eventType = 'SIGNED_OUT';
      else if (event === 'TOKEN_REFRESHED') eventType = 'TOKEN_REFRESHED';
      else if (event === 'USER_UPDATED') eventType = 'USER_UPDATED';
      else if (event === 'PASSWORD_RECOVERY') eventType = 'PASSWORD_RECOVERY';
      callback(eventType, session ?? undefined);
    });
    return () => {
      data.subscription.unsubscribe();
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  async resetPassword(email: string): Promise<AuthResult> {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  protected notifyListeners(event: AuthEventType, session?: AuthSession) {
    this.listeners.forEach((cb) => cb(event, session));
  }
}

let authService: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authService) {
    authService = new SupabaseAuthService();
  }
  return authService;
}
