import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenServicePort } from '../../domain/interfaces/token-service.port';
import { UserAuthRepositoryPort } from '../../domain/interfaces/user-auth.repository.port';
import {
  type AuthSession,
  toAuthUserProfile,
} from '../../domain/types/auth-user.type';
import { AccountStatusService } from '../services/account-status.service';

/**
 * Exchanges a valid refresh token (from the httpOnly cookie) for a new
 * token pair (rotation). Re-validates user and tenant status on every call.
 */
@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly userRepository: UserAuthRepositoryPort,
    private readonly tokenService: TokenServicePort,
    private readonly accountStatus: AccountStatusService,
  ) {}

  async execute(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    await this.accountStatus.assertCanAuthenticate(user);

    const tokens = await this.tokenService.issueTokens(user);
    return { tokens, user: toAuthUserProfile(user) };
  }
}
