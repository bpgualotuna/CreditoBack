import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-request.interface';
import { ClientRepositoryPort } from '../../../clients/domain/interfaces/client.repository.port';

/**
 * Resolves row-level restrictions for borrower accounts: a `cliente` user may
 * only see and request loans of their own client record.
 */
@Injectable()
export class LoanActorScopeService {
  constructor(private readonly clientRepository: ClientRepositoryPort) {}

  isBorrower(actor: AuthenticatedUser): boolean {
    return actor.rol === 'cliente';
  }

  /** Client id linked to a borrower account (throws if it has none). */
  async resolveOwnClientId(actor: AuthenticatedUser): Promise<string> {
    if (!actor.empresaId) {
      throw new ForbiddenException('El usuario no pertenece a ninguna empresa');
    }

    const client = await this.clientRepository.findByUsuarioId(
      actor.id,
      actor.empresaId,
    );

    if (!client) {
      throw new ForbiddenException(
        'La cuenta no esta vinculada a un expediente de cliente',
      );
    }

    return client.id;
  }
}
