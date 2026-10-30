import type { AuthUser } from '../types/auth-user.type';

/** Port for reading users during authentication. */
export abstract class UserAuthRepositoryPort {
  abstract findByEmail(email: string): Promise<AuthUser | null>;
  abstract findById(id: string): Promise<AuthUser | null>;
}
