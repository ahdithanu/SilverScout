export interface LBOInputs {
  purchasePrice: number;
  seniorDebtPercent: number;
  interestRate: number;
  holdYears: number;
  exitMultiple: number;
  revenueGrowth: number;
  ebitda: number;
  addBacksTotal: number;
}

export interface LBOOutputs {
  adjustedEbitda: number;
  seniorDebtAmount: number;
  sponsorEquity: number;
  exitEbitda: number;
  exitEnterpriseValue: number;
  remainingDebtAtExit: number;
  exitSponsorEquity: number;
  moic: number;
  irr: number;
  dscrYear1: number;
}

export function calculateLBOMetrics(inputs: LBOInputs): LBOOutputs {
  const adjustedEbitda = (inputs.ebitda || 0) + (inputs.addBacksTotal || 0);
  const seniorDebtAmount = Math.round(inputs.purchasePrice * (inputs.seniorDebtPercent / 100));
  const sponsorEquity = Math.max(0, inputs.purchasePrice - seniorDebtAmount);

  // Revenue & EBITDA growth over hold period
  const growthFactor = Math.pow(1 + inputs.revenueGrowth / 100, inputs.holdYears);
  const exitEbitda = Math.round(adjustedEbitda * growthFactor);
  const exitEnterpriseValue = Math.round(exitEbitda * inputs.exitMultiple);

  // Amortization assumption: 5% principal paid per year
  const annualInterest = seniorDebtAmount * (inputs.interestRate / 100);
  const annualPrincipalPaid = seniorDebtAmount * 0.05;
  const totalPrincipalPaid = Math.min(seniorDebtAmount, annualPrincipalPaid * inputs.holdYears);
  const remainingDebtAtExit = Math.max(0, seniorDebtAmount - totalPrincipalPaid);

  const exitSponsorEquity = Math.max(0, exitEnterpriseValue - remainingDebtAtExit);
  const moic = sponsorEquity > 0 ? Number((exitSponsorEquity / sponsorEquity).toFixed(2)) : 0;

  // Approximate IRR formula: (MOIC ^ (1 / holdYears)) - 1
  const irr = (sponsorEquity > 0 && moic > 0)
    ? Number(((Math.pow(moic, 1 / inputs.holdYears) - 1) * 100).toFixed(1))
    : 0;

  // Year 1 DSCR = Adjusted EBITDA / Annual Debt Service
  const annualDebtServiceYear1 = annualInterest + annualPrincipalPaid;
  const dscrYear1 = annualDebtServiceYear1 > 0
    ? Number((adjustedEbitda / annualDebtServiceYear1).toFixed(2))
    : 99;

  return {
    adjustedEbitda,
    seniorDebtAmount,
    sponsorEquity,
    exitEbitda,
    exitEnterpriseValue,
    remainingDebtAtExit,
    exitSponsorEquity,
    moic,
    irr,
    dscrYear1
  };
}
