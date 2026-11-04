import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoKyc } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dtos/pagination-query.dto';

export class ClientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoKyc })
  @IsOptional()
  @IsEnum(EstadoKyc)
  kycEstado?: EstadoKyc;

  @ApiPropertyOptional({ example: 'Chapinero' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barrioZona?: string;

  @ApiPropertyOptional({
    description: 'Busca en nombres, apellidos, documento, telefono y email',
    example: 'maria',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;
}
