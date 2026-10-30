import { BadRequestException, Injectable } from '@nestjs/common';
import type { Tenant } from '../../domain/types/tenant.type';
import { TenantAccessService } from '../services/tenant-access.service';

/** Returns the tenant of the authenticated user, validating it is operative. */
@Injectable()
export class GetCurrentTenantUseCase {
  constructor(private readonly tenantAccess: TenantAccessService) {}

  async execute(empresaId: string | null): Promise<Tenant> {
    if (!empresaId) {
      throw new BadRequestException(
        'No hay una empresa en el contexto actual (use el header x-tenant-id)',
      );
    }

    return this.tenantAccess.assertTenantIsActive(empresaId);
  }
}
