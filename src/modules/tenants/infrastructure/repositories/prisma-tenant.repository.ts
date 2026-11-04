import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../context/database/prisma.service';
import { TenantRepositoryPort } from '../../domain/interfaces/tenant.repository.port';
import {
  DEFAULT_INTEREST_RATE,
  type Tenant,
} from '../../domain/types/tenant.type';

@Injectable()
export class PrismaTenantRepository implements TenantRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const empresa = await this.prisma.empresa.findUnique({
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
        configuracion: true,
      },
    });

    if (!empresa) {
      return null;
    }

    const { configuracion, ...tenant } = empresa;
    return {
      ...tenant,
      tasaInteresDefecto: this.readInterestRate(configuracion),
    };
  }

  private readInterestRate(configuracion: Prisma.JsonValue): number {
    if (
      configuracion &&
      typeof configuracion === 'object' &&
      !Array.isArray(configuracion)
    ) {
      const rate = Number(configuracion['tasa_interes_defecto']);
      if (Number.isFinite(rate) && rate >= 0) {
        return rate;
      }
    }
    return DEFAULT_INTEREST_RATE;
  }
}
