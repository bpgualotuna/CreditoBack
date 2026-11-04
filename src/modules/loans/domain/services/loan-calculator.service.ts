import type { FrecuenciaPago } from '@prisma/client';
import type {
  Loan,
  LoanFinancials,
  LoanProgress,
  LoanSchedule,
} from '../types/loan.type';

export const REFERENCE_PREFIX = 'PREST';
export const REFERENCE_OFFSET = 1000;

export interface LoanCalculationInput {
  monto: number;
  tasaInteresPorcentaje: number;
  cuotasTotales: number;
}

/**
 * Pure financial domain service (no framework / IO dependencies).
 *
 * All arithmetic is done in integer cents to avoid floating point drift:
 * - interesTotal = monto * tasa / 100
 * - totalAPagar  = monto * (1 + tasa / 100)
 * - valorCuota   = totalAPagar / cuotasTotales (rounded half-up to cents;
 *   `saldoPendiente` remains the authoritative balance)
 */
export class LoanCalculatorService {
  calculate(input: LoanCalculationInput): LoanFinancials {
    const { monto, tasaInteresPorcentaje, cuotasTotales } = input;

    if (!Number.isFinite(monto) || monto <= 0) {
      throw new RangeError('El monto debe ser mayor a cero');
    }
    if (!Number.isInteger(cuotasTotales) || cuotasTotales < 1) {
      throw new RangeError(
        'cuotasTotales debe ser un entero mayor o igual a 1',
      );
    }
    if (
      !Number.isFinite(tasaInteresPorcentaje) ||
      tasaInteresPorcentaje < 0 ||
      tasaInteresPorcentaje > 100
    ) {
      throw new RangeError('La tasa de interes debe estar entre 0 y 100');
    }

    const principalCents = toCents(monto);
    const rateBasisPoints = Math.round(tasaInteresPorcentaje * 100);
    const interestCents = Math.round(
      (principalCents * rateBasisPoints) / 10_000,
    );
    const totalCents = principalCents + interestCents;
    const installmentCents = Math.round(totalCents / cuotasTotales);

    return {
      montoAprobado: fromCents(principalCents),
      tasaInteresPorcentaje: rateBasisPoints / 100,
      interesTotal: fromCents(interestCents),
      totalAPagar: fromCents(totalCents),
      valorCuota: fromCents(installmentCents),
      saldoPendiente: fromCents(totalCents),
      cuotasTotales,
      cuotasRestantes: cuotasTotales,
    };
  }

  /** First collection date and maturity date starting at the disbursement. */
  buildSchedule(
    fechaDesembolso: Date,
    frecuencia: FrecuenciaPago,
    cuotasTotales: number,
  ): LoanSchedule {
    return {
      proximoCobroFecha: addPeriods(fechaDesembolso, frecuencia, 1),
      fechaVencimiento: addPeriods(fechaDesembolso, frecuencia, cuotasTotales),
    };
  }

  /** `PREST-1001`, `PREST-1002`, ... for the n-th loan of a tenant. */
  generateReferenceCode(sequence: number): string {
    if (!Number.isInteger(sequence) || sequence < 1) {
      throw new RangeError('La secuencia debe ser un entero positivo');
    }
    return `${REFERENCE_PREFIX}-${REFERENCE_OFFSET + sequence}`;
  }

  progress(loan: Pick<Loan, 'totalAPagar' | 'saldoPendiente'>): LoanProgress {
    const totalCents = toCents(loan.totalAPagar);
    const paidCents = Math.max(0, totalCents - toCents(loan.saldoPendiente));
    const porcentaje = totalCents === 0 ? 0 : (paidCents / totalCents) * 100;

    return {
      montoPagado: fromCents(paidCents),
      porcentajePagado: Math.round(porcentaje * 100) / 100,
    };
  }
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

/** Adds `n` payment periods to a date-only value (UTC based). */
export function addPeriods(
  date: Date,
  frecuencia: FrecuenciaPago,
  n: number,
): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  switch (frecuencia) {
    case 'diario':
      result.setUTCDate(result.getUTCDate() + n);
      return result;
    case 'semanal':
      result.setUTCDate(result.getUTCDate() + 7 * n);
      return result;
    case 'quincenal':
      result.setUTCDate(result.getUTCDate() + 15 * n);
      return result;
    case 'mensual': {
      const day = result.getUTCDate();
      result.setUTCDate(1);
      result.setUTCMonth(result.getUTCMonth() + n);
      const lastDay = new Date(
        Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
      ).getUTCDate();
      result.setUTCDate(Math.min(day, lastDay));
      return result;
    }
  }
}
