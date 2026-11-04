import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoKyc, EstadoPrestamo } from '@prisma/client';
import { PaginationMetaDto } from '../../../../common/dtos/pagination-meta.dto';
import type {
  Client,
  ClientDetail,
  ClientDocuments,
  ClientLoanSummary,
} from '../../domain/types/client.type';

export class ClientResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) empresaId: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  sucursalId: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  usuarioId: string | null;
  @ApiProperty() numeroDocumento: string;
  @ApiProperty() tipoDocumento: string;
  @ApiProperty() nombres: string;
  @ApiProperty() apellidos: string;
  @ApiProperty() telefono: string;
  @ApiPropertyOptional({ nullable: true, type: String }) whatsapp:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) email: string | null;
  @ApiProperty() direccion: string;
  @ApiProperty() barrioZona: string;
  @ApiPropertyOptional({ nullable: true, type: Number })
  latitudDomicilio: number | null;
  @ApiPropertyOptional({ nullable: true, type: Number })
  longitudDomicilio: number | null;
  @ApiProperty({ enum: EstadoKyc }) kycEstado: EstadoKyc;
  @ApiPropertyOptional({ nullable: true, type: Number })
  porcentajeBiometria: number | null;
  @ApiProperty({ example: 680 }) scoreCrediticio: number;
  @ApiProperty({ example: 3.5 }) calificacionEstrellas: number;
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { selfie: 'https://storage.crediflow.com/kyc/selfie.jpg' },
  })
  documentosUrls: ClientDocuments;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromDomain(client: Client): ClientResponseDto {
    return Object.assign(new ClientResponseDto(), client);
  }
}

export class ClientLoanSummaryDto implements ClientLoanSummary {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiPropertyOptional({ nullable: true, type: String, example: 'PREST-1001' })
  codigoReferencia: string | null;
  @ApiProperty({ enum: EstadoPrestamo }) estado: EstadoPrestamo;
  @ApiProperty() montoAprobado: number;
  @ApiProperty() saldoPendiente: number;
  @ApiProperty() cuotasPagadas: number;
  @ApiProperty() cuotasTotales: number;
  @ApiProperty() createdAt: Date;
}

export class ClientDetailResponseDto extends ClientResponseDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  sucursalNombre: string | null;

  @ApiProperty({ type: [ClientLoanSummaryDto] })
  prestamos: ClientLoanSummaryDto[];

  static fromDetail(detail: ClientDetail): ClientDetailResponseDto {
    return Object.assign(new ClientDetailResponseDto(), detail);
  }
}

export class PaginatedClientsResponseDto {
  @ApiProperty({ type: [ClientResponseDto] })
  items: ClientResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
