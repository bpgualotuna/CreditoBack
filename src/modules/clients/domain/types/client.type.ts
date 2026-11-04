import type { EstadoKyc, EstadoPrestamo } from '@prisma/client';

/** eKYC document URLs stored in `clientes.documentos_urls`. */
export interface ClientDocuments {
  cedulaFrontal?: string;
  cedulaReverso?: string;
  selfie?: string;
  comprobanteDomicilio?: string;
  [document: string]: string | undefined;
}

/** Client (borrower) domain entity. Money/score values as plain numbers. */
export interface Client {
  id: string;
  empresaId: string;
  sucursalId: string | null;
  usuarioId: string | null;
  numeroDocumento: string;
  tipoDocumento: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  whatsapp: string | null;
  email: string | null;
  direccion: string;
  barrioZona: string;
  latitudDomicilio: number | null;
  longitudDomicilio: number | null;
  kycEstado: EstadoKyc;
  porcentajeBiometria: number | null;
  scoreCrediticio: number;
  calificacionEstrellas: number;
  documentosUrls: ClientDocuments;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientLoanSummary {
  id: string;
  codigoReferencia: string | null;
  estado: EstadoPrestamo;
  montoAprobado: number;
  saldoPendiente: number;
  cuotasPagadas: number;
  cuotasTotales: number;
  createdAt: Date;
}

/** Full client file ("expediente"): client + branch + loan history. */
export interface ClientDetail extends Client {
  sucursalNombre: string | null;
  prestamos: ClientLoanSummary[];
}

export interface NewClient {
  empresaId: string;
  sucursalId?: string | null;
  usuarioId?: string | null;
  numeroDocumento: string;
  tipoDocumento?: string;
  nombres: string;
  apellidos?: string;
  telefono: string;
  whatsapp?: string | null;
  email?: string | null;
  direccion: string;
  barrioZona?: string;
  latitudDomicilio?: number | null;
  longitudDomicilio?: number | null;
}

export interface ClientFilters {
  kycEstado?: EstadoKyc;
  barrioZona?: string;
  /** Free text over names, document, phone and email. */
  search?: string;
  page: number;
  limit: number;
}

export interface KycUpdate {
  kycEstado: EstadoKyc;
  porcentajeBiometria?: number;
  documentosUrls?: ClientDocuments;
}
