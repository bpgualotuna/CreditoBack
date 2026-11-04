import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoKyc } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class KycDocumentsDto {
  @ApiPropertyOptional({
    example: 'https://storage.crediflow.com/kyc/cedula-frontal.jpg',
  })
  @IsOptional()
  @IsUrl()
  cedulaFrontal?: string;

  @ApiPropertyOptional({
    example: 'https://storage.crediflow.com/kyc/cedula-reverso.jpg',
  })
  @IsOptional()
  @IsUrl()
  cedulaReverso?: string;

  @ApiPropertyOptional({
    example: 'https://storage.crediflow.com/kyc/selfie.jpg',
  })
  @IsOptional()
  @IsUrl()
  selfie?: string;

  @ApiPropertyOptional({
    example: 'https://storage.crediflow.com/kyc/recibo.pdf',
  })
  @IsOptional()
  @IsUrl()
  comprobanteDomicilio?: string;
}

export class UpdateKycDto {
  @ApiProperty({ enum: EstadoKyc, example: EstadoKyc.verificado })
  @IsEnum(EstadoKyc)
  kycEstado: EstadoKyc;

  @ApiPropertyOptional({
    example: 96.5,
    minimum: 0,
    maximum: 100,
    description: 'Porcentaje de coincidencia biometrica',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  porcentajeBiometria?: number;

  @ApiPropertyOptional({
    type: KycDocumentsDto,
    description: 'Se combinan con los documentos ya registrados',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => KycDocumentsDto)
  documentosUrls?: KycDocumentsDto;
}
