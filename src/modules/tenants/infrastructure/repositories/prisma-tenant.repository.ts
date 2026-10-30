import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../context/database/prisma.service';
import { TenantRepositoryPort } from '../../domain/interfaces/tenant.repository.port';
import type { Tenant } from '../../domain/types/tenant.type';

@Injectable()
export class PrismaTenantRepository implements TenantRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true,
        codigoSlug: true,
        nombre: true,
        pais: true,
        moneda: true,
        simboloMoneda: true,
        colorPrimario: true,
        estadoSuscripcion: true,
        plan: true,
        maxCobradores: true,
      },
    });
  }
}
