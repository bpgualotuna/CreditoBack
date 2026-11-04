import type { EstadoSuscripcion, PlanSaas } from '@prisma/client';

/** Default interest rate applied when the tenant has no explicit setting. */
export const DEFAULT_INTEREST_RATE = 15;

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
  /** `configuracion.tasa_interes_defecto` (percentage, e.g. 15 = 15%). */
  tasaInteresDefecto: number;
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
