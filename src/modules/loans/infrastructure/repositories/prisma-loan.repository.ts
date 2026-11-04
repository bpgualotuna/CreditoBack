import { Injectable } from '@nestjs/common';
import type { EstadoPrestamo, Prestamo, Prisma } from '@prisma/client';
import {
  buildPaginationMeta,
  toSkipTake,
  type PaginatedResult,
} from '../../../../common/interfaces/paginated-result.interface';
import {
  tenantWhere,
  type TenantScope,
} from '../../../../common/utils/tenant-scope.util';
import { PrismaService } from '../../../../context/database/prisma.service';
import { LoanRepositoryPort } from '../../domain/interfaces/loan.repository.port';
import type {
  Loan,
  LoanDetail,
  LoanFilters,
  LoanStatusUpdate,
  NewLoan,
} from '../../domain/types/loan.type';

@Injectable()
export class PrismaLoanRepository implements LoanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: NewLoan,
    referenceFactory: (sequence: number) => string,
  ): Promise<Loan> {
    const prestamo = await this.prisma.$transaction(async (tx) => {
      // Serializes reference generation per tenant until the tx commits.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${data.empresaId}::text))`;

      const sequence =
        (await tx.prestamo.count({ where: { empresaId: data.empresaId } })) + 1;

      return tx.prestamo.create({
        data: {
          codigoReferencia: referenceFactory(sequence),
          empresaId: data.empresaId,
          sucursalId: data.sucursalId,
          clienteId: data.clienteId,
          cobradorId: data.cobradorId,
          montoSolicitado: data.montoSolicitado,
          montoAprobado: data.montoAprobado,
          tasaInteresPorcentaje: data.tasaInteresPorcentaje,
          interesTotal: data.interesTotal,
          totalAPagar: data.totalAPagar,
          saldoPendiente: data.saldoPendiente,
          valorCuota: data.valorCuota,
          cuotasTotales: data.cuotasTotales,
          cuotasRestantes: data.cuotasRestantes,
          frecuencia: data.frecuencia,
          origenSolicitud: data.origenSolicitud,
          estado: 'Pendiente',
        },
      });
    });

    return this.toDomain(prestamo);
  }

  async findById(
    id: string,
    scope: TenantScope,
  ): Promise<Omit<LoanDetail, 'progreso'> | null> {
    const prestamo = await this.prisma.prestamo.findFirst({
      where: { id, ...tenantWhere(scope) },
      include: {
        cliente: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            numeroDocumento: true,
            telefono: true,
          },
        },
        cobrador: { select: { id: true, nombre: true, telefono: true } },
        aprobadoPor: { select: { id: true, nombreCompleto: true } },
        sucursal: { select: { nombre: true } },
      },
    });

    if (!prestamo) {
      return null;
    }

    const { cliente, cobrador, aprobadoPor, sucursal, ...base } = prestamo;
    return {
      ...this.toDomain(base),
      cliente,
      cobrador,
      aprobadoPor,
      sucursalNombre: sucursal?.nombre ?? null,
    };
  }

  async findAll(
    scope: TenantScope,
    filters: LoanFilters,
  ): Promise<PaginatedResult<Loan>> {
    const where: Prisma.PrestamoWhereInput = {
      ...tenantWhere(scope),
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.clienteId && { clienteId: filters.clienteId }),
      ...(filters.cobradorId && { cobradorId: filters.cobradorId }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.prestamo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(filters),
      }),
      this.prisma.prestamo.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      meta: buildPaginationMeta(filters, total),
    };
  }

  async updateStatus(
    id: string,
    scope: TenantScope,
    expectedStatus: EstadoPrestamo,
    update: LoanStatusUpdate,
  ): Promise<Loan | null> {
    const { count } = await this.prisma.prestamo.updateMany({
      where: { id, estado: expectedStatus, ...tenantWhere(scope) },
      data: update,
    });

    if (count === 0) {
      return null;
    }

    const updated = await this.prisma.prestamo.findFirst({
      where: { id, ...tenantWhere(scope) },
    });
    return updated ? this.toDomain(updated) : null;
  }

  private toDomain(prestamo: Prestamo): Loan {
    return {
      ...prestamo,
      montoSolicitado: prestamo.montoSolicitado.toNumber(),
      montoAprobado: prestamo.montoAprobado.toNumber(),
      tasaInteresPorcentaje: prestamo.tasaInteresPorcentaje.toNumber(),
      interesTotal: prestamo.interesTotal.toNumber(),
      totalAPagar: prestamo.totalAPagar.toNumber(),
      saldoPendiente: prestamo.saldoPendiente.toNumber(),
      valorCuota: prestamo.valorCuota.toNumber(),
    };
  }
}
