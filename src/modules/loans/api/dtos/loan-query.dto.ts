import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPrestamo } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dtos/pagination-query.dto';

export class LoanQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoPrestamo })
  @IsOptional()
  @IsEnum(EstadoPrestamo)
  estado?: EstadoPrestamo;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cobradorId?: string;
}
