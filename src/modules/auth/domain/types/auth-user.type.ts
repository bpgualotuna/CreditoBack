import type { RolUsuario } from '@prisma/client';

/** User projection required by the authentication flows. */
export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  nombreCompleto: string;
  rol: RolUsuario;
  estaActivo: boolean;
  empresaId: string | null;
  sucursalId: string | null;
  avatarUrl: string | null;
}

/** Public (safe to expose) user profile. */
export type AuthUserProfile = Omit<AuthUser, 'passwordHash' | 'estaActivo'>;

export interface AuthTokens {
  accessToken: string;
  /** Access token lifetime in seconds. */
  accessTokenExpiresIn: number;
  refreshToken: string;
  /** Refresh token lifetime in milliseconds (used for the cookie maxAge). */
  refreshTokenMaxAgeMs: number;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: AuthUserProfile;
}

export function toAuthUserProfile(user: AuthUser): AuthUserProfile {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, estaActivo, ...profile } = user;
  return profile;
}
