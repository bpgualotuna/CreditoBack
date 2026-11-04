import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ApproveLoanDto {
  @ApiPropertyOptional({
    example: 500000,
    minimum: 1,
    description: 'Monto aprobado (por defecto igual al monto solicitado)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(999_999_999_999)
  montoAprobado?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Cobrador asignado a la ruta del prestamo',
  })
  @IsOptional()
  @IsUUID()
  cobradorId?: string;

  @ApiPropertyOptional({
    example: '2026-11-04',
    description: 'Fecha de desembolso (YYYY-MM-DD). Por defecto hoy.',
  })
  @IsOptional()
  @IsDateString()
  fechaDesembolso?: string;
}
