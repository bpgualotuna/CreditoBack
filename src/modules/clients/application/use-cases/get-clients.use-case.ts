import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import { ClientRepositoryPort } from '../../domain/interfaces/client.repository.port';
import type { Client, ClientFilters } from '../../domain/types/client.type';

/** Paginated client listing filtered by KYC status, zone and free text. */
@Injectable()
export class GetClientsUseCase {
  constructor(private readonly clientRepository: ClientRepositoryPort) {}

  execute(
    scope: TenantScope,
    filters: ClientFilters,
  ): Promise<PaginatedResult<Client>> {
    return this.clientRepository.findAll(scope, filters);
  }
}
