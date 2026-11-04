import type { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import type {
  Client,
  ClientDetail,
  ClientFilters,
  KycUpdate,
  NewClient,
} from '../types/client.type';

/**
 * Client persistence port. Every read/write is constrained by the tenant
 * scope (`empresaId`), so a financiera can never reach another one's clients.
 */
export abstract class ClientRepositoryPort {
  abstract create(data: NewClient): Promise<Client>;

  abstract findById(
    id: string,
    scope: TenantScope,
  ): Promise<ClientDetail | null>;

  abstract findByDocumento(
    empresaId: string,
    numeroDocumento: string,
  ): Promise<Client | null>;

  /** Client linked to a `cliente` role user account. */
  abstract findByUsuarioId(
    usuarioId: string,
    empresaId: string,
  ): Promise<Client | null>;

  abstract findAll(
    scope: TenantScope,
    filters: ClientFilters,
  ): Promise<PaginatedResult<Client>>;

  /** Returns null when the client does not exist inside the scope. */
  abstract updateKycStatus(
    id: string,
    scope: TenantScope,
    data: KycUpdate,
  ): Promise<Client | null>;

  abstract branchBelongsToTenant(
    sucursalId: string,
    empresaId: string,
  ): Promise<boolean>;
}
