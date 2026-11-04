import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../context/database/prisma.service';
import { CollectorDirectoryPort } from '../../domain/interfaces/collector-directory.port';

@Injectable()
export class PrismaCollectorDirectory implements CollectorDirectoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async belongsToTenant(
    cobradorId: string,
    empresaId: string,
  ): Promise<boolean> {
    const count = await this.prisma.cobrador.count({
      where: { id: cobradorId, empresaId },
    });
    return count > 0;
  }

  async findIdByUsuarioId(
    usuarioId: string,
    empresaId: string,
  ): Promise<string | null> {
    const cobrador = await this.prisma.cobrador.findFirst({
      where: { usuarioId, empresaId },
      select: { id: true },
    });
    return cobrador?.id ?? null;
  }
}
