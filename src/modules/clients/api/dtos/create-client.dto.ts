import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateClientDto {
  @ApiProperty({ example: '1032456789' })
  @Transform(trim)
  @IsString()
  @Matches(/^[A-Za-z0-9-]{4,20}$/, {
    message: 'numeroDocumento debe tener 4-20 caracteres alfanumericos',
  })
  numeroDocumento: string;

  @ApiPropertyOptional({ example: 'CC', default: 'CC' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(10)
  tipoDocumento?: string;

  @ApiProperty({ example: 'Maria Fernanda' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiPropertyOptional({ example: 'Rodriguez Lopez' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  apellidos?: string;

  @ApiProperty({ example: '+573001234567' })
  @Transform(trim)
  @Matches(/^\+?[0-9\s-]{7,20}$/, { message: 'telefono no es valido' })
  telefono: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9\s-]{7,20}$/, { message: 'whatsapp no es valido' })
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'maria@correo.com' })
  @IsOptional()
  @Transform(trim)
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Cra 15 # 45-20' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  direccion: string;

  @ApiPropertyOptional({ example: 'Chapinero', default: 'Centro' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  barrioZona?: string;

  @ApiPropertyOptional({
    example: 4.6486,
    description: 'Latitud del domicilio',
  })
  @IsOptional()
  @IsLatitude()
  latitudDomicilio?: number;

  @ApiPropertyOptional({
    example: -74.0628,
    description: 'Longitud del domicilio',
  })
  @IsOptional()
  @IsLongitude()
  longitudDomicilio?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sucursalId?: string;
}
