import { LoanCalculatorService } from './loan-calculator.service';

describe('LoanCalculatorService', () => {
  let calculator: LoanCalculatorService;

  beforeEach(() => {
    calculator = new LoanCalculatorService();
  });

  describe('calculate', () => {
    it('computes 15% interest and exact installments in integer cents', () => {
      const result = calculator.calculate({
        monto: 500_000,
        tasaInteresPorcentaje: 15,
        cuotasTotales: 23,
      });

      expect(result).toEqual({
        montoAprobado: 500_000,
        tasaInteresPorcentaje: 15,
        interesTotal: 75_000,
        totalAPagar: 575_000,
        valorCuota: 25_000,
        saldoPendiente: 575_000,
        cuotasTotales: 23,
        cuotasRestantes: 23,
      });
    });

    it('rounds valorCuota to 2 decimals when totalAPagar is not divisible', () => {
      const result = calculator.calculate({
        monto: 500_000,
        tasaInteresPorcentaje: 15,
        cuotasTotales: 30,
      });

      expect(result.totalAPagar).toBe(575_000);
      expect(result.valorCuota).toBe(19_166.67);
    });

    it('rejects non-positive amounts or invalid installments', () => {
      expect(() =>
        calculator.calculate({
          monto: 0,
          tasaInteresPorcentaje: 15,
          cuotasTotales: 10,
        }),
      ).toThrow(RangeError);

      expect(() =>
        calculator.calculate({
          monto: 100_000,
          tasaInteresPorcentaje: 15,
          cuotasTotales: 0,
        }),
      ).toThrow(RangeError);
    });
  });

  describe('buildSchedule', () => {
    it('calculates proximoCobroFecha and fechaVencimiento for daily loans', () => {
      const desembolso = new Date(Date.UTC(2026, 10, 4));
      const schedule = calculator.buildSchedule(desembolso, 'diario', 30);

      expect(schedule.proximoCobroFecha.toISOString()).toBe(
        '2026-11-05T00:00:00.000Z',
      );
      expect(schedule.fechaVencimiento.toISOString()).toBe(
        '2026-12-04T00:00:00.000Z',
      );
    });
  });

  describe('generateReferenceCode', () => {
    it('produces PREST-1001 for sequence 1', () => {
      expect(calculator.generateReferenceCode(1)).toBe('PREST-1001');
      expect(calculator.generateReferenceCode(42)).toBe('PREST-1042');
    });
  });

  describe('progress', () => {
    it('returns montoPagado and porcentajePagado', () => {
      expect(
        calculator.progress({ totalAPagar: 575_000, saldoPendiente: 287_500 }),
      ).toEqual({
        montoPagado: 287_500,
        porcentajePagado: 50,
      });
    });
  });
});
