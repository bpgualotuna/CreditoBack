import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '@prisma/client';
import type {
  AuthSession,
  AuthUserProfile,
} from '../../domain/types/auth-user.type';

export class AuthUserResponseDto implements AuthUserProfile {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@crediflow.com' })
  email: string;

  @ApiProperty({ example: 'Laura Gomez' })
  nombreCompleto: string;

  @ApiProperty({ enum: RolUsuario })
  rol: RolUsuario;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  empresaId: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  sucursalId: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  avatarUrl: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (enviar como Bearer)' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({
    description: 'Vigencia del access token en segundos',
    example: 28800,
  })
  expiresIn: number;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;

  static fromSession(session: AuthSession): AuthResponseDto {
    return {
      accessToken: session.tokens.accessToken,
      tokenType: 'Bearer',
      expiresIn: session.tokens.accessTokenExpiresIn,
      user: session.user,
    };
  }
}
