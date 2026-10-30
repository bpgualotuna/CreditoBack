import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export const TENANT_HEADER = 'x-tenant-id';

/**
 * Strict multi-tenant isolation.
 *
 * - Non-superadmin users are always pinned to the `empresaId` in their JWT.
 *   Any `empresaId` supplied via route params, query string or body that
 *   differs from it is rejected with 403.
 * - Superadmins operate globally and may optionally scope a request to a
 *   tenant using the `x-tenant-id` header.
 *
 * The resolved scope is exposed as `request.tenant` (see `@CurrentTenant()`).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Contexto de autenticacion no disponible');
    }

    if (user.rol === 'superadmin') {
      const headerValue = request.headers[TENANT_HEADER];
      const scopedTenant = Array.isArray(headerValue)
        ? headerValue[0]
        : headerValue;

      if (scopedTenant && !isUUID(scopedTenant)) {
        throw new BadRequestException(
          `El header ${TENANT_HEADER} debe ser un UUID`,
        );
      }

      request.tenant = { empresaId: scopedTenant ?? null, isSuperAdmin: true };
      return true;
    }

    if (!user.empresaId) {
      throw new ForbiddenException('El usuario no pertenece a ninguna empresa');
    }

    const requestedTenants = this.extractRequestedTenantIds(request);
    const crossTenant = requestedTenants.some((id) => id !== user.empresaId);

    if (crossTenant) {
      throw new ForbiddenException(
        'No puede operar sobre recursos de otra empresa',
      );
    }

    request.tenant = { empresaId: user.empresaId, isSuperAdmin: false };
    return true;
  }

  private extractRequestedTenantIds(request: AuthenticatedRequest): string[] {
    const sources: unknown[] = [
      (request.params as Record<string, unknown> | undefined)?.empresaId,
      (request.query as Record<string, unknown> | undefined)?.empresaId,
      (request.body as Record<string, unknown> | undefined)?.empresaId,
    ];

    return sources.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
  }
}
