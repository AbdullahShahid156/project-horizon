export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface SignUpParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  session?: AuthSession;
}

export type AuthEventType =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export type AuthEventCallback = (event: AuthEventType, session?: AuthSession) => void;
