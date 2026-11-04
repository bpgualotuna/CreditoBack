import { ApiProperty } from '@nestjs/swagger';
import { EstadoSuscripcion, PlanSaas } from '@prisma/client';
import type { Tenant } from '../../domain/types/tenant.type';

export class TenantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'crediflow-demo' })
  codigoSlug: string;

  @ApiProperty({ example: 'CrediFlow Demo S.A.S.' })
  nombre: string;

  @ApiProperty({ example: 'CO' })
  pais: string;

  @ApiProperty({ example: 'COP' })
  moneda: string;

  @ApiProperty({ example: '$' })
  simboloMoneda: string;

  @ApiProperty({ example: '#1E40AF' })
  colorPrimario: string;

  @ApiProperty({ enum: EstadoSuscripcion })
  estadoSuscripcion: EstadoSuscripcion;

  @ApiProperty({ enum: PlanSaas })
  plan: PlanSaas;

  @ApiProperty({ example: 15 })
  maxCobradores: number;

  @ApiProperty({ example: 15, description: 'Tasa de interes por defecto (%)' })
  tasaInteresDefecto: number;

  static fromDomain(tenant: Tenant): TenantResponseDto {
    return Object.assign(new TenantResponseDto(), tenant);
  }
}
