import { ForbiddenException, Injectable } from '@nestjs/common';
import { TenantAccessService } from '../../../tenants/application/services/tenant-access.service';
import type { AuthUser } from '../../domain/types/auth-user.type';

/**
 * Verifies that a user is allowed to hold a session: the account must be
 * active and (except for superadmins) its tenant subscription operative.
 */
@Injectable()
export class AccountStatusService {
  constructor(private readonly tenantAccess: TenantAccessService) {}

  async assertCanAuthenticate(user: AuthUser): Promise<void> {
    if (!user.estaActivo) {
      throw new ForbiddenException('La cuenta de usuario esta desactivada');
    }

    if (user.rol === 'superadmin') {
      return;
    }

    if (!user.empresaId) {
      throw new ForbiddenException('El usuario no esta asociado a una empresa');
    }

    await this.tenantAccess.assertTenantIsActive(user.empresaId);
  }
}
