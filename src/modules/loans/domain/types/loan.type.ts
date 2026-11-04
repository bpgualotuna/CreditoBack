import type {
  EstadoPrestamo,
  FrecuenciaPago,
  OrigenSolicitud,
} from '@prisma/client';

/** Loan domain entity. Money values are plain numbers with 2 decimals. */
export interface Loan {
  id: string;
  codigoReferencia: string | null;
  empresaId: string;
  sucursalId: string | null;
  clienteId: string;
  cobradorId: string | null;
  montoSolicitado: number;
  montoAprobado: number;
  tasaInteresPorcentaje: number;
  interesTotal: number;
  totalAPagar: number;
  saldoPendiente: number;
  valorCuota: number;
  cuotasTotales: number;
  cuotasPagadas: number;
  cuotasRestantes: number;
  frecuencia: FrecuenciaPago;
  diasMora: number;
  estado: EstadoPrestamo;
  origenSolicitud: OrigenSolicitud;
  motivoRechazo: string | null;
  aprobadoPorUsuarioId: string | null;
  fechaDesembolso: Date | null;
  fechaVencimiento: Date | null;
  proximoCobroFecha: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanClientSummary {
  id: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  telefono: string;
}

export interface LoanCollectorSummary {
  id: string;
  nombre: string;
  telefono: string;
}

export interface LoanApproverSummary {
  id: string;
  nombreCompleto: string;
}

export interface LoanProgress {
  /** totalAPagar - saldoPendiente */
  montoPagado: number;
  /** 0-100 */
  porcentajePagado: number;
}

/** Full financial detail of a loan. */
export interface LoanDetail extends Loan {
  cliente: LoanClientSummary;
  cobrador: LoanCollectorSummary | null;
  aprobadoPor: LoanApproverSummary | null;
  sucursalNombre: string | null;
  progreso: LoanProgress;
}

/** Monetary breakdown produced by the LoanCalculatorService. */
export interface LoanFinancials {
  montoAprobado: number;
  tasaInteresPorcentaje: number;
  interesTotal: number;
  totalAPagar: number;
  valorCuota: number;
  saldoPendiente: number;
  cuotasTotales: number;
  cuotasRestantes: number;
}

export interface LoanSchedule {
  proximoCobroFecha: Date;
  fechaVencimiento: Date;
}

export interface NewLoan extends LoanFinancials {
  empresaId: string;
  sucursalId: string | null;
  clienteId: string;
  cobradorId: string | null;
  montoSolicitado: number;
  frecuencia: FrecuenciaPago;
  origenSolicitud: OrigenSolicitud;
}

export interface LoanFilters {
  estado?: EstadoPrestamo;
  clienteId?: string;
  cobradorId?: string;
  page: number;
  limit: number;
}

/** Fields that may change together with a status transition. */
export interface LoanStatusUpdate extends Partial<LoanFinancials> {
  estado: EstadoPrestamo;
  cobradorId?: string | null;
  aprobadoPorUsuarioId?: string | null;
  motivoRechazo?: string | null;
  fechaDesembolso?: Date | null;
  proximoCobroFecha?: Date | null;
  fechaVencimiento?: Date | null;
}
