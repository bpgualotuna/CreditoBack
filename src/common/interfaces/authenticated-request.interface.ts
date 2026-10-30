import type { Request } from 'express';
import type { RolUsuario } from '@prisma/client';

/** Access token claims. `empresaId` is null only for platform superadmins. */
export interface JwtPayload {
  sub: string;
  email: string;
  rol: RolUsuario;
  empresaId: string | null;
  sucursalId: string | null;
  type: 'access' | 'refresh';
}

/** User attached to `request.user` by the JWT strategy. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: RolUsuario;
  empresaId: string | null;
  sucursalId: string | null;
}

/** Tenant scope resolved by the TenantGuard for the current request. */
export interface TenantContext {
  /** Effective tenant id. For superadmins it may be null (global scope). */
  empresaId: string | null;
  isSuperAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  tenant?: TenantContext;
}
