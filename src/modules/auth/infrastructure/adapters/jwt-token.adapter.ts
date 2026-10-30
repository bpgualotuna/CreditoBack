import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { JwtPayload } from '../../../../common/interfaces/authenticated-request.interface';
import {
  durationToMs,
  durationToSeconds,
} from '../../../../common/utils/duration.util';
import { EnvironmentVariables } from '../../../../context/config/app.config';
import { TokenServicePort } from '../../domain/interfaces/token-service.port';
import type { AuthTokens, AuthUser } from '../../domain/types/auth-user.type';

type ExpiresIn = JwtSignOptions['expiresIn'];

/** `@nestjs/jwt` implementation of the TokenServicePort. */
@Injectable()
export class JwtTokenAdapter implements TokenServicePort {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService<EnvironmentVariables, true>,
  ) {
    this.accessSecret = configService.get('JWT_SECRET', { infer: true });
    this.refreshSecret =
      configService.get('JWT_REFRESH_SECRET', { infer: true }) ??
      this.accessSecret;
    this.accessExpiresIn = configService.get('JWT_EXPIRES_IN', { infer: true });
    this.refreshExpiresIn = configService.get('JWT_REFRESH_EXPIRES_IN', {
      infer: true,
    });
  }

  async issueTokens(user: AuthUser): Promise<AuthTokens> {
    const basePayload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      empresaId: user.empresaId,
      sucursalId: user.sucursalId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync<JwtPayload>(
        { ...basePayload, type: 'access' },
        {
          secret: this.accessSecret,
          expiresIn: this.accessExpiresIn as ExpiresIn,
        },
      ),
      this.jwtService.signAsync<JwtPayload>(
        { ...basePayload, type: 'refresh' },
        {
          secret: this.refreshSecret,
          expiresIn: this.refreshExpiresIn as ExpiresIn,
        },
      ),
    ]);

    return {
      accessToken,
      accessTokenExpiresIn: durationToSeconds(this.accessExpiresIn),
      refreshToken,
      refreshTokenMaxAgeMs: durationToMs(this.refreshExpiresIn),
    };
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.refreshSecret,
      });
      return payload.type === 'refresh' ? payload : null;
    } catch {
      return null;
    }
  }
}
