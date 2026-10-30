import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantRepositoryPort } from '../../domain/interfaces/tenant.repository.port';
import { isTenantOperative, type Tenant } from '../../domain/types/tenant.type';

/**
 * Shared application logic to ensure a tenant exists and its SaaS
 * subscription allows operation (`activa` or `demo`).
 */
@Injectable()
export class TenantAccessService {
  constructor(private readonly tenantRepository: TenantRepositoryPort) {}

  async assertTenantIsActive(empresaId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(empresaId);

    if (!tenant) {
      throw new NotFoundException('Empresa no encontrada');
    }

    if (!isTenantOperative(tenant)) {
      throw new ForbiddenException(
        'La suscripcion de la empresa se encuentra suspendida',
      );
    }

    return tenant;
  }
}
