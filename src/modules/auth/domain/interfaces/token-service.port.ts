import type { JwtPayload } from '../../../../common/interfaces/authenticated-request.interface';
import type { AuthTokens, AuthUser } from '../types/auth-user.type';

/** Port for issuing and verifying access / refresh tokens. */
export abstract class TokenServicePort {
  abstract issueTokens(user: AuthUser): Promise<AuthTokens>;
  /** Returns the payload or null when the refresh token is invalid/expired. */
  abstract verifyRefreshToken(token: string): Promise<JwtPayload | null>;
}
