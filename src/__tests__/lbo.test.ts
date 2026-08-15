import { describe, it, expect } from 'vitest';
import { calculateLBOMetrics } from '../utils/lboMath';

describe('LBO Returns Engine', () => {
  it('correctly calculates adjusted EBITDA and debt tranche split', () => {
    const res = calculateLBOMetrics({
      purchasePrice: 5000000,
      seniorDebtPercent: 60,
      interestRate: 8,
      holdYears: 5,
      exitMultiple: 5.5,
      revenueGrowth: 5,
      ebitda: 800000,
      addBacksTotal: 200000
    });

    expect(res.adjustedEbitda).toBe(1000000);
    expect(res.seniorDebtAmount).toBe(3000000);
    expect(res.sponsorEquity).toBe(2000000);
  });

  it('computes positive MOIC and IRR over 5 year hold period', () => {
    const res = calculateLBOMetrics({
      purchasePrice: 5000000,
      seniorDebtPercent: 60,
      interestRate: 8,
      holdYears: 5,
      exitMultiple: 5.5,
      revenueGrowth: 5,
      ebitda: 800000,
      addBacksTotal: 200000
    });

    expect(res.moic).toBeGreaterThan(1.5);
    expect(res.irr).toBeGreaterThan(10);
    expect(res.dscrYear1).toBeGreaterThan(1.0);
  });
});
