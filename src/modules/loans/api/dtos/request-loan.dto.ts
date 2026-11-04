import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FrecuenciaPago, OrigenSolicitud } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RequestLoanDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'ID del cliente (obligatorio salvo cuando solicita un usuario con rol cliente)',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiProperty({ example: 500000, minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999_999_999_999)
  montoSolicitado: number;

  @ApiProperty({ example: 30, minimum: 1, maximum: 365 })
  @IsInt()
  @Min(1)
  @Max(365)
  cuotasTotales: number;

  @ApiPropertyOptional({
    enum: FrecuenciaPago,
    default: FrecuenciaPago.diario,
  })
  @IsOptional()
  @IsEnum(FrecuenciaPago)
  frecuencia?: FrecuenciaPago;

  @ApiPropertyOptional({
    example: 15,
    minimum: 0,
    maximum: 100,
    description:
      'Tasa de interes (%). Si se omite usa tasa_interes_defecto de la empresa (15%).',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  tasaInteresPorcentaje?: number;

  @ApiPropertyOptional({ enum: OrigenSolicitud })
  @IsOptional()
  @IsEnum(OrigenSolicitud)
  origenSolicitud?: OrigenSolicitud;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cobrador asignado inicialmente (opcional)',
  })
  @IsOptional()
  @IsUUID()
  cobradorId?: string;
}
