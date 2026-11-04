import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { todayDateOnly } from '../../../../common/utils/date.util';
import type { TenantScope } from '../../../../common/utils/tenant-scope.util';
import { CollectorDirectoryPort } from '../../domain/interfaces/collector-directory.port';
import { LoanRepositoryPort } from '../../domain/interfaces/loan.repository.port';
import { LoanCalculatorService } from '../../domain/services/loan-calculator.service';
import type { LoanDetail } from '../../domain/types/loan.type';
import { GetLoanByIdUseCase } from './get-loan-by-id.use-case';

export interface ApproveLoanCommand {
  approverUserId: string;
  /** Defaults to the requested amount; cannot exceed it. */
  montoAprobado?: number;
  cobradorId?: string;
  /** Defaults to today. */
  fechaDesembolso?: Date;
}

/**
 * Approves a `Pendiente` loan: recalculates the financials for the approved
 * amount, optionally assigns a collector, fixes disbursement / first
 * collection / maturity dates and moves it to `Activo`.
 */
@Injectable()
export class ApproveLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepositoryPort,
    private readonly collectors: CollectorDirectoryPort,
    private readonly calculator: LoanCalculatorService,
    private readonly getLoanById: GetLoanByIdUseCase,
  ) {}

  async execute(
    id: string,
    scope: TenantScope,
    command: ApproveLoanCommand,
  ): Promise<LoanDetail> {
    const loan = await this.loanRepository.findById(id, scope);

    if (!loan) {
      throw new NotFoundException('Prestamo no encontrado');
    }

    if (loan.estado !== 'Pendiente') {
      throw new ConflictException(
        `Solo se pueden aprobar prestamos pendientes (estado actual: ${loan.estado})`,
      );
    }

    const montoAprobado = command.montoAprobado ?? loan.montoSolicitado;
    if (montoAprobado > loan.montoSolicitado) {
      throw new BadRequestException(
        'El monto aprobado no puede superar el monto solicitado',
      );
    }

    const cobradorId = command.cobradorId ?? loan.cobradorId;
    if (command.cobradorId) {
      const valid = await this.collectors.belongsToTenant(
        command.cobradorId,
        loan.empresaId,
      );
      if (!valid) {
        throw new BadRequestException(
          'El cobrador indicado no pertenece a la empresa',
        );
      }
    }

    const financials = this.calculator.calculate({
      monto: montoAprobado,
      tasaInteresPorcentaje: loan.tasaInteresPorcentaje,
      cuotasTotales: loan.cuotasTotales,
    });

    const fechaDesembolso = command.fechaDesembolso ?? todayDateOnly();
    const schedule = this.calculator.buildSchedule(
      fechaDesembolso,
      loan.frecuencia,
      loan.cuotasTotales,
    );

    const updated = await this.loanRepository.updateStatus(
      id,
      loan.empresaId,
      'Pendiente',
      {
        ...financials,
        estado: 'Activo',
        cobradorId,
        aprobadoPorUsuarioId: command.approverUserId,
        motivoRechazo: null,
        fechaDesembolso,
        ...schedule,
      },
    );

    if (!updated) {
      throw new ConflictException(
        'El prestamo fue modificado por otra operacion, intente nuevamente',
      );
    }

    return this.getLoanById.execute(id, loan.empresaId);
  }
}
