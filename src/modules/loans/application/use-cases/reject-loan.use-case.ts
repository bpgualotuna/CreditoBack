import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import { LoanRepositoryPort } from '../../domain/interfaces/loan.repository.port';
import type { Loan } from '../../domain/types/loan.type';

/** Rejects a `Pendiente` loan recording the reason. */
@Injectable()
export class RejectLoanUseCase {
  constructor(private readonly loanRepository: LoanRepositoryPort) {}

  async execute(id: string, scope: TenantScope, motivo: string): Promise<Loan> {
    const loan = await this.loanRepository.findById(id, scope);

    if (!loan) {
      throw new NotFoundException('Prestamo no encontrado');
    }

    if (loan.estado !== 'Pendiente') {
      throw new ConflictException(
        `Solo se pueden rechazar prestamos pendientes (estado actual: ${loan.estado})`,
      );
    }

    const updated = await this.loanRepository.updateStatus(
      id,
      loan.empresaId,
      'Pendiente',
      { estado: 'Rechazado', motivoRechazo: motivo.trim() },
    );

    if (!updated) {
      throw new ConflictException(
        'El prestamo fue modificado por otra operacion, intente nuevamente',
      );
    }

    return updated;
  }
}
