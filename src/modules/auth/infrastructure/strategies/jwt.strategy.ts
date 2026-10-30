import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../../../../common/interfaces/authenticated-request.interface';
import { EnvironmentVariables } from '../../../../context/config/app.config';

/**
 * Validates Bearer access tokens and attaches the user to `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Tipo de token invalido');
    }

    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      empresaId: payload.empresaId,
      sucursalId: payload.sucursalId,
    };
  }
}
