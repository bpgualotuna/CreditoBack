import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectLoanDto {
  @ApiProperty({
    example:
      'Capacidad de endeudamiento insuficiente y mora activa en otro credito',
    minLength: 5,
    maxLength: 500,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(5, {
    message: 'El motivo de rechazo debe tener al menos 5 caracteres',
  })
  @MaxLength(500)
  motivoRechazo: string;
}
