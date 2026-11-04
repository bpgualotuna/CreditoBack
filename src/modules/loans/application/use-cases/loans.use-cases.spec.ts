import { ConflictException } from '@nestjs/common';
import type { ClientRepositoryPort } from '../../../clients/domain/interfaces/client.repository.port';
import type { TenantAccessService } from '../../../tenants/application/services/tenant-access.service';
import type { CollectorDirectoryPort } from '../../domain/interfaces/collector-directory.port';
import type { LoanRepositoryPort } from '../../domain/interfaces/loan.repository.port';
import { LoanCalculatorService } from '../../domain/services/loan-calculator.service';
import type { LoanDetail } from '../../domain/types/loan.type';
import { LoanActorScopeService } from '../services/loan-actor-scope.service';
import { ApproveLoanUseCase } from './approve-loan.use-case';
import { GetLoanByIdUseCase } from './get-loan-by-id.use-case';
import { RejectLoanUseCase } from './reject-loan.use-case';
import { RequestLoanUseCase } from './request-loan.use-case';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const CLIENT_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ID = '33333333-3333-4333-8333-333333333333';

function buildPendingLoan(): Omit<LoanDetail, 'progreso'> {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    codigoReferencia: 'PREST-1001',
    empresaId: TENANT_ID,
    sucursalId: null,
    clienteId: CLIENT_ID,
    cobradorId: null,
    montoSolicitado: 500_000,
    montoAprobado: 500_000,
    tasaInteresPorcentaje: 15,
    interesTotal: 75_000,
    totalAPagar: 575_000,
    saldoPendiente: 575_000,
    valorCuota: 25_000,
    cuotasTotales: 23,
    cuotasPagadas: 0,
    cuotasRestantes: 23,
    frecuencia: 'diario',
    diasMora: 0,
    estado: 'Pendiente',
    origenSolicitud: 'web_admin',
    motivoRechazo: null,
    aprobadoPorUsuarioId: null,
    fechaDesembolso: null,
    fechaVencimiento: null,
    proximoCobroFecha: null,
    createdAt: new Date('2026-11-04T00:00:00Z'),
    updatedAt: new Date('2026-11-04T00:00:00Z'),
    cliente: {
      id: CLIENT_ID,
      nombres: 'Maria',
      apellidos: 'Lopez',
      numeroDocumento: '1032456789',
      telefono: '+573001234567',
    },
    cobrador: null,
    aprobadoPor: null,
    sucursalNombre: null,
  };
}

describe('Loans Use Cases', () => {
  let loanRepo: jest.Mocked<LoanRepositoryPort>;
  let clientRepo: jest.Mocked<ClientRepositoryPort>;
  let collectors: jest.Mocked<CollectorDirectoryPort>;
  let tenantAccess: jest.Mocked<
    Pick<TenantAccessService, 'assertTenantIsActive'>
  >;
  let calculator: LoanCalculatorService;
  let actorScope: LoanActorScopeService;

  beforeEach(() => {
    loanRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
    };
    clientRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByDocumento: jest.fn(),
      findByUsuarioId: jest.fn(),
      findAll: jest.fn(),
      updateKycStatus: jest.fn(),
      branchBelongsToTenant: jest.fn(),
    };
    collectors = {
      belongsToTenant: jest.fn(),
      findIdByUsuarioId: jest.fn(),
    };
    tenantAccess = {
      assertTenantIsActive: jest.fn().mockResolvedValue({
        id: TENANT_ID,
        tasaInteresDefecto: 15,
      }),
    };
    calculator = new LoanCalculatorService();
    actorScope = new LoanActorScopeService(clientRepo);
  });

  it('requests a loan in Pendiente state using the tenant default 15% interest', async () => {
    const useCase = new RequestLoanUseCase(
      loanRepo,
      clientRepo,
      collectors,
      tenantAccess as unknown as TenantAccessService,
      actorScope,
      calculator,
    );

    clientRepo.findById.mockResolvedValue({
      id: CLIENT_ID,
      sucursalId: null,
    } as never);

    loanRepo.create.mockImplementation((data, refFactory) =>
      Promise.resolve({
        ...buildPendingLoan(),
        ...data,
        codigoReferencia: refFactory(1),
      }),
    );

    const loan = await useCase.execute(
      TENANT_ID,
      {
        id: ADMIN_ID,
        email: 'admin@crediflow.com',
        rol: 'admin',
        empresaId: TENANT_ID,
        sucursalId: null,
      },
      {
        clienteId: CLIENT_ID,
        montoSolicitado: 500_000,
        cuotasTotales: 23,
      },
    );

    expect(loan.codigoReferencia).toBe('PREST-1001');
    expect(loan.estado).toBe('Pendiente');
    expect(loan.totalAPagar).toBe(575_000);
    expect(loan.valorCuota).toBe(25_000);
  });

  it('approves a pending loan setting fechaDesembolso, proximoCobroFecha and Activo status', async () => {
    const getById = new GetLoanByIdUseCase(loanRepo, calculator, actorScope);
    const approveUseCase = new ApproveLoanUseCase(
      loanRepo,
      collectors,
      calculator,
      getById,
    );

    const pending = buildPendingLoan();
    const active: Omit<LoanDetail, 'progreso'> = {
      ...pending,
      estado: 'Activo',
      aprobadoPorUsuarioId: ADMIN_ID,
    };

    loanRepo.findById
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(active);
    loanRepo.updateStatus.mockResolvedValue(active);

    const result = await approveUseCase.execute(pending.id, TENANT_ID, {
      approverUserId: ADMIN_ID,
      fechaDesembolso: new Date(Date.UTC(2026, 10, 4)),
    });

    expect(result.estado).toBe('Activo');
    expect(loanRepo.updateStatus.mock.calls[0]).toEqual([
      pending.id,
      TENANT_ID,
      'Pendiente',
      expect.objectContaining({
        estado: 'Activo',
        aprobadoPorUsuarioId: ADMIN_ID,
        proximoCobroFecha: new Date('2026-11-05T00:00:00.000Z'),
      }),
    ]);
  });

  it('prevents rejecting a loan that is already Activo', async () => {
    const rejectUseCase = new RejectLoanUseCase(loanRepo);
    loanRepo.findById.mockResolvedValue({
      ...buildPendingLoan(),
      estado: 'Activo',
    });

    await expect(
      rejectUseCase.execute('loan-id', TENANT_ID, 'Motivo de prueba'),
    ).rejects.toThrow(ConflictException);
  });
});
