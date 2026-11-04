import type { EstadoPrestamo } from '@prisma/client';
import type { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import type {
  Loan,
  LoanDetail,
  LoanFilters,
  LoanStatusUpdate,
  NewLoan,
} from '../types/loan.type';

/**
 * Loan persistence port. All operations are constrained by the tenant scope.
 */
export abstract class LoanRepositoryPort {
  /**
   * Persists a loan assigning a per-tenant sequential reference code built by
   * `referenceFactory(sequence)`. Implementations must serialize concurrent
   * creations for the same tenant.
   */
  abstract create(
    data: NewLoan,
    referenceFactory: (sequence: number) => string,
  ): Promise<Loan>;

  /** Detail without the computed progress (added by the application layer). */
  abstract findById(
    id: string,
    scope: TenantScope,
  ): Promise<Omit<LoanDetail, 'progreso'> | null>;

  abstract findAll(
    scope: TenantScope,
    filters: LoanFilters,
  ): Promise<PaginatedResult<Loan>>;

  /**
   * Atomic status transition: only applies when the loan exists in the scope
   * and is currently in `expectedStatus`. Returns null otherwise.
   */
  abstract updateStatus(
    id: string,
    scope: TenantScope,
    expectedStatus: EstadoPrestamo,
    update: LoanStatusUpdate,
  ): Promise<Loan | null>;
}
