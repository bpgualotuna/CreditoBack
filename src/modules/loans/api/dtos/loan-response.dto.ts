import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EstadoPrestamo,
  FrecuenciaPago,
  OrigenSolicitud,
} from '@prisma/client';
import { PaginationMetaDto } from '../../../../common/dtos/pagination-meta.dto';
import type {
  Loan,
  LoanApproverSummary,
  LoanClientSummary,
  LoanCollectorSummary,
  LoanDetail,
  LoanProgress,
} from '../../domain/types/loan.type';

export class LoanResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiPropertyOptional({ nullable: true, type: String, example: 'PREST-1001' })
  codigoReferencia: string | null;
  @ApiProperty({ format: 'uuid' }) empresaId: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  sucursalId: string | null;
  @ApiProperty({ format: 'uuid' }) clienteId: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  cobradorId: string | null;
  @ApiProperty({ example: 500000 }) montoSolicitado: number;
  @ApiProperty({ example: 500000 }) montoAprobado: number;
  @ApiProperty({ example: 15 }) tasaInteresPorcentaje: number;
  @ApiProperty({ example: 75000 }) interesTotal: number;
  @ApiProperty({ example: 575000 }) totalAPagar: number;
  @ApiProperty({ example: 575000 }) saldoPendiente: number;
  @ApiProperty({ example: 19166.67 }) valorCuota: number;
  @ApiProperty({ example: 30 }) cuotasTotales: number;
  @ApiProperty({ example: 0 }) cuotasPagadas: number;
  @ApiProperty({ example: 30 }) cuotasRestantes: number;
  @ApiProperty({ enum: FrecuenciaPago }) frecuencia: FrecuenciaPago;
  @ApiProperty({ example: 0 }) diasMora: number;
  @ApiProperty({ enum: EstadoPrestamo }) estado: EstadoPrestamo;
  @ApiProperty({ enum: OrigenSolicitud }) origenSolicitud: OrigenSolicitud;
  @ApiPropertyOptional({ nullable: true, type: String })
  motivoRechazo: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  aprobadoPorUsuarioId: string | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  fechaDesembolso: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  fechaVencimiento: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  proximoCobroFecha: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromDomain(loan: Loan): LoanResponseDto {
    return Object.assign(new LoanResponseDto(), loan);
  }
}

export class LoanClientSummaryDto implements LoanClientSummary {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombres: string;
  @ApiProperty() apellidos: string;
  @ApiProperty() numeroDocumento: string;
  @ApiProperty() telefono: string;
}

export class LoanCollectorSummaryDto implements LoanCollectorSummary {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() telefono: string;
}

export class LoanApproverSummaryDto implements LoanApproverSummary {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombreCompleto: string;
}

export class LoanProgressDto implements LoanProgress {
  @ApiProperty({ example: 0 }) montoPagado: number;
  @ApiProperty({ example: 0 }) porcentajePagado: number;
}

export class LoanDetailResponseDto extends LoanResponseDto {
  @ApiProperty({ type: LoanClientSummaryDto })
  cliente: LoanClientSummaryDto;

  @ApiPropertyOptional({ type: LoanCollectorSummaryDto, nullable: true })
  cobrador: LoanCollectorSummaryDto | null;

  @ApiPropertyOptional({ type: LoanApproverSummaryDto, nullable: true })
  aprobadoPor: LoanApproverSummaryDto | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  sucursalNombre: string | null;

  @ApiProperty({ type: LoanProgressDto })
  progreso: LoanProgressDto;

  static fromDetail(detail: LoanDetail): LoanDetailResponseDto {
    return Object.assign(new LoanDetailResponseDto(), detail);
  }
}

export class PaginatedLoansResponseDto {
  @ApiProperty({ type: [LoanResponseDto] })
  items: LoanResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
