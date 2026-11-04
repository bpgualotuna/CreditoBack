import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-request.interface';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import { LoanRepositoryPort } from '../../domain/interfaces/loan.repository.port';
import { LoanCalculatorService } from '../../domain/services/loan-calculator.service';
import type { LoanDetail } from '../../domain/types/loan.type';
import { LoanActorScopeService } from '../services/loan-actor-scope.service';

/**
 * Full financial detail: installments paid/remaining, outstanding balance and
 * repayment progress. Loans outside the scope are reported as not found.
 */
@Injectable()
export class GetLoanByIdUseCase {
  constructor(
    private readonly loanRepository: LoanRepositoryPort,
    private readonly calculator: LoanCalculatorService,
    private readonly actorScope: LoanActorScopeService,
  ) {}

  async execute(
    id: string,
    scope: TenantScope,
    actor?: AuthenticatedUser,
  ): Promise<LoanDetail> {
    const loan = await this.loanRepository.findById(id, scope);

    if (!loan) {
      throw new NotFoundException('Prestamo no encontrado');
    }

    if (actor && this.actorScope.isBorrower(actor)) {
      const ownClientId = await this.actorScope.resolveOwnClientId(actor);
      if (loan.clienteId !== ownClientId) {
        throw new NotFoundException('Prestamo no encontrado');
      }
    }

    return { ...loan, progreso: this.calculator.progress(loan) };
  }
}
