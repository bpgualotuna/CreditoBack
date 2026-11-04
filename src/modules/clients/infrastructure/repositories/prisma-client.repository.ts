import { Injectable } from '@nestjs/common';
import type { Cliente, Prisma } from '@prisma/client';
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
import { ClientRepositoryPort } from '../../domain/interfaces/client.repository.port';
import type {
  Client,
  ClientDetail,
  ClientDocuments,
  ClientFilters,
  KycUpdate,
  NewClient,
} from '../../domain/types/client.type';

const LOAN_HISTORY_LIMIT = 50;

@Injectable()
export class PrismaClientRepository implements ClientRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: NewClient): Promise<Client> {
    const cliente = await this.prisma.cliente.create({
      data: {
        empresaId: data.empresaId,
        sucursalId: data.sucursalId ?? null,
        usuarioId: data.usuarioId ?? null,
        numeroDocumento: data.numeroDocumento,
        tipoDocumento: data.tipoDocumento,
        nombres: data.nombres,
        apellidos: data.apellidos,
        telefono: data.telefono,
        whatsapp: data.whatsapp ?? null,
        email: data.email ?? null,
        direccion: data.direccion,
        barrioZona: data.barrioZona,
        latitudDomicilio: data.latitudDomicilio ?? null,
        longitudDomicilio: data.longitudDomicilio ?? null,
      },
    });
    return this.toDomain(cliente);
  }

  async findById(id: string, scope: TenantScope): Promise<ClientDetail | null> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, ...tenantWhere(scope) },
      include: {
        sucursal: { select: { nombre: true } },
        prestamos: {
          orderBy: { createdAt: 'desc' },
          take: LOAN_HISTORY_LIMIT,
          select: {
            id: true,
            codigoReferencia: true,
            estado: true,
            montoAprobado: true,
            saldoPendiente: true,
            cuotasPagadas: true,
            cuotasTotales: true,
            createdAt: true,
          },
        },
      },
    });

    if (!cliente) {
      return null;
    }

    const { sucursal, prestamos, ...base } = cliente;
    return {
      ...this.toDomain(base),
      sucursalNombre: sucursal?.nombre ?? null,
      prestamos: prestamos.map((prestamo) => ({
        ...prestamo,
        montoAprobado: prestamo.montoAprobado.toNumber(),
        saldoPendiente: prestamo.saldoPendiente.toNumber(),
      })),
    };
  }

  async findByDocumento(
    empresaId: string,
    numeroDocumento: string,
  ): Promise<Client | null> {
    const cliente = await this.prisma.cliente.findUnique({
      where: { empresaId_numeroDocumento: { empresaId, numeroDocumento } },
    });
    return cliente ? this.toDomain(cliente) : null;
  }

  async findByUsuarioId(
    usuarioId: string,
    empresaId: string,
  ): Promise<Client | null> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { usuarioId, empresaId },
    });
    return cliente ? this.toDomain(cliente) : null;
  }

  async findAll(
    scope: TenantScope,
    filters: ClientFilters,
  ): Promise<PaginatedResult<Client>> {
    const where = this.buildWhere(scope, filters);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(filters),
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      meta: buildPaginationMeta(filters, total),
    };
  }

  async updateKycStatus(
    id: string,
    scope: TenantScope,
    data: KycUpdate,
  ): Promise<Client | null> {
    const where = { id, ...tenantWhere(scope) };

    const { count } = await this.prisma.cliente.updateMany({
      where,
      data: {
        kycEstado: data.kycEstado,
        ...(data.porcentajeBiometria !== undefined && {
          porcentajeBiometria: data.porcentajeBiometria,
        }),
        ...(data.documentosUrls && {
          documentosUrls: data.documentosUrls,
        }),
      },
    });

    if (count === 0) {
      return null;
    }

    const updated = await this.prisma.cliente.findFirst({ where });
    return updated ? this.toDomain(updated) : null;
  }

  async branchBelongsToTenant(
    sucursalId: string,
    empresaId: string,
  ): Promise<boolean> {
    const count = await this.prisma.sucursal.count({
      where: { id: sucursalId, empresaId },
    });
    return count > 0;
  }

  private buildWhere(
    scope: TenantScope,
    filters: ClientFilters,
  ): Prisma.ClienteWhereInput {
    const where: Prisma.ClienteWhereInput = { ...tenantWhere(scope) };

    if (filters.kycEstado) {
      where.kycEstado = filters.kycEstado;
    }

    if (filters.barrioZona) {
      where.barrioZona = { equals: filters.barrioZona, mode: 'insensitive' };
    }

    const search = filters.search?.trim();
    if (search) {
      const contains = { contains: search, mode: 'insensitive' as const };
      where.OR = [
        { nombres: contains },
        { apellidos: contains },
        { numeroDocumento: contains },
        { telefono: contains },
        { email: contains },
      ];
    }

    return where;
  }

  private toDomain(cliente: Cliente): Client {
    return {
      ...cliente,
      porcentajeBiometria: cliente.porcentajeBiometria?.toNumber() ?? null,
      calificacionEstrellas: cliente.calificacionEstrellas.toNumber(),
      documentosUrls: this.toDocuments(cliente.documentosUrls),
    };
  }

  private toDocuments(value: Prisma.JsonValue): ClientDocuments {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  }
}
