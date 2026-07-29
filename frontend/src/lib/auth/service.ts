import type {
  AuthSession,
  AuthResult,
  SignUpParams,
  SignInParams,
  AuthEventCallback,
} from './types';

export interface AuthService {
  signUp(params: SignUpParams): Promise<AuthResult>;
  signIn(params: SignInParams): Promise<AuthResult>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  getUser(): Promise<AuthSession['user'] | null>;
  refreshSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: AuthEventCallback): () => void;
  resetPassword(email: string): Promise<AuthResult>;
  updatePassword(newPassword: string): Promise<AuthResult>;
}
