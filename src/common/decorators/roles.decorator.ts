import { SetMetadata } from '@nestjs/common';
import type { RolUsuario } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts a route (or controller) to the given roles. Enforced by RolesGuard. */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
