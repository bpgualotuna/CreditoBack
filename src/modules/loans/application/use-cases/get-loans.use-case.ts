import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-request.interface';
import type { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import { LoanRepositoryPort } from '../../domain/interfaces/loan.repository.port';
import type { Loan, LoanFilters } from '../../domain/types/loan.type';
import { LoanActorScopeService } from '../services/loan-actor-scope.service';

/**
 * Loan portfolio listing filtered by status, client and collector.
 * Borrower accounts are always restricted to their own loans.
 */
@Injectable()
export class GetLoansUseCase {
  constructor(
    private readonly loanRepository: LoanRepositoryPort,
    private readonly actorScope: LoanActorScopeService,
  ) {}

  async execute(
    scope: TenantScope,
    actor: AuthenticatedUser,
    filters: LoanFilters,
  ): Promise<PaginatedResult<Loan>> {
    const effectiveFilters = this.actorScope.isBorrower(actor)
      ? {
          ...filters,
          clienteId: await this.actorScope.resolveOwnClientId(actor),
        }
      : filters;

    return this.loanRepository.findAll(scope, effectiveFilters);
  }
}
