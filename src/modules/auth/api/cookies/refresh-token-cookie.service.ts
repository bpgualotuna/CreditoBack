import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import {
  Environment,
  EnvironmentVariables,
} from '../../../../context/config/app.config';

export const REFRESH_TOKEN_COOKIE = 'crediflow_refresh_token';

/**
 * Writes / reads / clears the httpOnly refresh token cookie.
 */
@Injectable()
export class RefreshTokenCookieService {
  private readonly baseOptions: CookieOptions;
  private readonly persistent: boolean;

  constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const sameSite = configService.get('COOKIE_SAMESITE', { infer: true });
    const isProduction =
      configService.get('NODE_ENV', { infer: true }) === Environment.Production;

    this.persistent = configService.get('COOKIE_PERSISTENT', { infer: true });
    this.baseOptions = {
      httpOnly: true,
      // SameSite=None requires Secure; always Secure in production.
      secure: isProduction || sameSite === 'none',
      sameSite,
      path: configService.get('COOKIE_PATH', { infer: true }),
    };
  }

  set(response: Response, refreshToken: string, maxAgeMs: number): void {
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...this.baseOptions,
      ...(this.persistent ? { maxAge: maxAgeMs } : {}),
    });
  }

  read(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[REFRESH_TOKEN_COOKIE];
  }

  clear(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.baseOptions);
  }
}
