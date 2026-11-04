import { Injectable, NotFoundException } from '@nestjs/common';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import { ClientRepositoryPort } from '../../domain/interfaces/client.repository.port';
import type { ClientDetail } from '../../domain/types/client.type';

/** Full client file. Clients of other tenants are reported as not found. */
@Injectable()
export class GetClientByIdUseCase {
  constructor(private readonly clientRepository: ClientRepositoryPort) {}

  async execute(id: string, scope: TenantScope): Promise<ClientDetail> {
    const client = await this.clientRepository.findById(id, scope);

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return client;
  }
}
