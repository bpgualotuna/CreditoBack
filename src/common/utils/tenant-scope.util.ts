import { BadRequestException } from '@nestjs/common';

/**
 * Tenant scope for queries: a tenant id, or `null` for a superadmin operating
 * globally (no `x-tenant-id` header). Repositories MUST filter by it.
 */
export type TenantScope = string | null;

/** Prisma `where` fragment that enforces the tenant scope. */
export function tenantWhere(scope: TenantScope): { empresaId?: string } {
  return scope ? { empresaId: scope } : {};
}

/**
 * Mutations always need a concrete tenant. Superadmins must pick one with the
 * `x-tenant-id` header.
 */
export function requireTenantId(scope: TenantScope): string {
  if (!scope) {
    throw new BadRequestException(
      'Esta operacion requiere una empresa: envie el header x-tenant-id',
    );
  }
  return scope;
}
