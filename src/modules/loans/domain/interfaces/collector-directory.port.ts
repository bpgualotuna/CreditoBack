/**
 * Read-only port to resolve route collectors (cobradores) within a tenant.
 */
export abstract class CollectorDirectoryPort {
  abstract belongsToTenant(
    cobradorId: string,
    empresaId: string,
  ): Promise<boolean>;

  /** Collector record linked to a `cobrador` role user account. */
  abstract findIdByUsuarioId(
    usuarioId: string,
    empresaId: string,
  ): Promise<string | null>;
}
