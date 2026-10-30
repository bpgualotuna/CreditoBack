import type { EstadoSuscripcion, PlanSaas } from '@prisma/client';

/** Tenant (SaaS company) domain entity. */
export interface Tenant {
  id: string;
  codigoSlug: string;
  nombre: string;
  pais: string;
  moneda: string;
  simboloMoneda: string;
  colorPrimario: string;
  estadoSuscripcion: EstadoSuscripcion;
  plan: PlanSaas;
  maxCobradores: number;
}

/** Subscription states that allow users of the tenant to operate. */
export const OPERATIVE_SUBSCRIPTION_STATES: readonly EstadoSuscripcion[] = [
  'activa',
  'demo',
];

export function isTenantOperative(
  tenant: Pick<Tenant, 'estadoSuscripcion'>,
): boolean {
  return OPERATIVE_SUBSCRIPTION_STATES.includes(tenant.estadoSuscripcion);
}
