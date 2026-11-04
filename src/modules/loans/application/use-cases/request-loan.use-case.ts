import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  FrecuenciaPago,
  OrigenSolicitud,
  RolUsuario,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-request.interface';
import { ClientRepositoryPort } from '../../../clients/domain/interfaces/client.repository.port';
import { TenantAccessService } from '../../../tenants/application/services/tenant-access.service';
import { CollectorDirectoryPort } from '../../domain/interfaces/collector-directory.port';
import { LoanRepositoryPort } from '../../domain/interfaces/loan.repository.port';
import { LoanCalculatorService } from '../../domain/services/loan-calculator.service';
import type { Loan } from '../../domain/types/loan.type';
import { LoanActorScopeService } from '../services/loan-actor-scope.service';

export interface RequestLoanCommand {
  clienteId?: string;
  montoSolicitado: number;
  cuotasTotales: number;
  frecuencia?: FrecuenciaPago;
  /** Only staff roles may override the tenant default rate. */
  tasaInteresPorcentaje?: number;
  origenSolicitud?: OrigenSolicitud;
  cobradorId?: string;
}

const RATE_OVERRIDE_ROLES: readonly RolUsuario[] = [
  'superadmin',
  'admin',
  'supervisor',
];

/**
 * Creates a credit application in `Pendiente` status with a preliminary
 * financial breakdown based on the tenant interest rate (default 15%).
 *
 * Origin is enforced by role: `cliente` -> app_movil_cliente,
 * `cobrador` -> cobrador_campo, staff -> web_admin (or explicit value).
 */
@Injectable()
export class RequestLoanUseCase {
  constructor(
    private readonly loanRepository: LoanRepositoryPort,
    private readonly clientRepository: ClientRepositoryPort,
    private readonly collectors: CollectorDirectoryPort,
    private readonly tenantAccess: TenantAccessService,
    private readonly actorScope: LoanActorScopeService,
    private readonly calculator: LoanCalculatorService,
  ) {}

  async execute(
    empresaId: string,
    actor: AuthenticatedUser,
    command: RequestLoanCommand,
  ): Promise<Loan> {
    const tenant = await this.tenantAccess.assertTenantIsActive(empresaId);

    const clienteId = await this.resolveClientId(actor, command);
    const client = await this.clientRepository.findById(clienteId, empresaId);
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const cobradorId = await this.resolveCollectorId(actor, empresaId, command);

    if (
      command.tasaInteresPorcentaje !== undefined &&
      !RATE_OVERRIDE_ROLES.includes(actor.rol)
    ) {
      throw new ForbiddenException(
        'Solo administradores o supervisores pueden fijar la tasa de interes',
      );
    }

    const financials = this.calculator.calculate({
      monto: command.montoSolicitado,
      tasaInteresPorcentaje:
        command.tasaInteresPorcentaje ?? tenant.tasaInteresDefecto,
      cuotasTotales: command.cuotasTotales,
    });

    return this.loanRepository.create(
      {
        ...financials,
        empresaId,
        sucursalId: client.sucursalId,
        clienteId: client.id,
        cobradorId,
        montoSolicitado: financials.montoAprobado,
        frecuencia: command.frecuencia ?? 'diario',
        origenSolicitud: this.resolveOrigin(actor, command),
      },
      (sequence) => this.calculator.generateReferenceCode(sequence),
    );
  }

  private async resolveClientId(
    actor: AuthenticatedUser,
    command: RequestLoanCommand,
  ): Promise<string> {
    if (this.actorScope.isBorrower(actor)) {
      const ownClientId = await this.actorScope.resolveOwnClientId(actor);
      if (command.clienteId && command.clienteId !== ownClientId) {
        throw new ForbiddenException(
          'No puede solicitar creditos para otro cliente',
        );
      }
      return ownClientId;
    }

    if (!command.clienteId) {
      throw new BadRequestException('clienteId es obligatorio');
    }
    return command.clienteId;
  }

  private async resolveCollectorId(
    actor: AuthenticatedUser,
    empresaId: string,
    command: RequestLoanCommand,
  ): Promise<string | null> {
    if (command.cobradorId) {
      const valid = await this.collectors.belongsToTenant(
        command.cobradorId,
        empresaId,
      );
      if (!valid) {
        throw new BadRequestException(
          'El cobrador indicado no pertenece a la empresa',
        );
      }
      return command.cobradorId;
    }

    // Field requests are auto-assigned to the requesting collector.
    if (actor.rol === 'cobrador') {
      return this.collectors.findIdByUsuarioId(actor.id, empresaId);
    }

    return null;
  }

  private resolveOrigin(
    actor: AuthenticatedUser,
    command: RequestLoanCommand,
  ): OrigenSolicitud {
    switch (actor.rol) {
      case 'cliente':
        return 'app_movil_cliente';
      case 'cobrador':
        return 'cobrador_campo';
      default:
        return command.origenSolicitud ?? 'web_admin';
    }
  }
}
