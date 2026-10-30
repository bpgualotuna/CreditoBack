import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * Injects the tenant id (`empresaId`) resolved by the TenantGuard.
 * Falls back to the JWT claim when the guard did not run.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.tenant?.empresaId ?? request.user?.empresaId ?? null;
  },
);
