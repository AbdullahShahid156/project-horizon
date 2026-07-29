import type {
  AuthSession,
  AuthResult,
  SignUpParams,
  SignInParams,
  AuthEventCallback,
  AuthEventType,
} from './types';
import type { AuthService } from './service';

/**
 * Supabase Auth Service
 *
 * This is a placeholder implementation ready for Phase 16B.
 * Replace the TODO sections with actual Supabase client calls.
 */
export class SupabaseAuthService implements AuthService {
  private listeners: AuthEventCallback[] = [];

  async signUp(_params: SignUpParams): Promise<AuthResult> {
    // TODO Phase 16B: Implement with supabase.auth.signUp()
    return { success: false, error: 'Supabase Auth not configured yet' };
  }

  async signIn(_params: SignInParams): Promise<AuthResult> {
    // TODO Phase 16B: Implement with supabase.auth.signInWithPassword()
    return { success: false, error: 'Supabase Auth not configured yet' };
  }

  async signOut(): Promise<void> {
    // TODO Phase 16B: Implement with supabase.auth.signOut()
  }

  async getSession(): Promise<AuthSession | null> {
    // TODO Phase 16B: Implement with supabase.auth.getSession()
    return null;
  }

  async getUser(): Promise<AuthSession['user'] | null> {
    // TODO Phase 16B: Implement with supabase.auth.getUser()
    return null;
  }

  async refreshSession(): Promise<AuthSession | null> {
    // TODO Phase 16B: Implement with supabase.auth.refreshSession()
    return null;
  }

  onAuthStateChange(callback: AuthEventCallback): () => void {
    this.listeners.push(callback);
    // TODO Phase 16B: Implement with supabase.auth.onAuthStateChange()
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  async resetPassword(_email: string): Promise<AuthResult> {
    // TODO Phase 16B: Implement with supabase.auth.resetPasswordForEmail()
    return { success: false, error: 'Supabase Auth not configured yet' };
  }

  async updatePassword(_newPassword: string): Promise<AuthResult> {
    // TODO Phase 16B: Implement with supabase.auth.updateUser()
    return { success: false, error: 'Supabase Auth not configured yet' };
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
