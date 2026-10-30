import type { Tenant } from '../types/tenant.type';

/**
 * Port for tenant persistence. Declared as an abstract class so it can be
 * used directly as a Nest DI token.
 */
export abstract class TenantRepositoryPort {
  abstract findById(id: string): Promise<Tenant | null>;
}
