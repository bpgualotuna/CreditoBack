import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HasherPort } from '../../domain/interfaces/hasher.port';
import { TokenServicePort } from '../../domain/interfaces/token-service.port';
import { UserAuthRepositoryPort } from '../../domain/interfaces/user-auth.repository.port';
import {
  type AuthSession,
  toAuthUserProfile,
} from '../../domain/types/auth-user.type';
import { AccountStatusService } from '../services/account-status.service';

export interface LoginCommand {
  email: string;
  password: string;
}

const INVALID_CREDENTIALS = 'Credenciales invalidas';

/**
 * Authenticates a user by email/password, validates the account and tenant
 * status, and issues a new access/refresh token pair.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserAuthRepositoryPort,
    private readonly hasher: HasherPort,
    private readonly tokenService: TokenServicePort,
    private readonly accountStatus: AccountStatusService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordMatches = await this.hasher.compare(
      command.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.accountStatus.assertCanAuthenticate(user);

    const tokens = await this.tokenService.issueTokens(user);
    return { tokens, user: toAuthUserProfile(user) };
  }
}
