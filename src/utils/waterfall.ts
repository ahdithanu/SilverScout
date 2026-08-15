export interface CapitalStructureInput {
  purchasePrice: number;
  seniorDebtPct: number;       // e.g. 50%
  seniorDebtRate: number;      // e.g. 8.5%
  mezzanineDebtPct: number;    // e.g. 15%
  mezzanineDebtRate: number;   // e.g. 12.0% (PIK)
  sponsorEquityPct: number;    // e.g. 10%
  lpEquityPct: number;         // e.g. 25%
  holdYears: number;           // e.g. 5
  exitMultiple: number;        // e.g. 5.5x
  exitEbitda: number;          // e.g. $800,000
  hurdleRatePct: number;       // e.g. 8.0%
  gpCarryPct: number;          // e.g. 20.0%
}

export interface WaterfallDistributionTier {
  tierName: string;
  lpAmount: number;
  gpAmount: number;
  totalDistributed: number;
}

export interface SyndicationOutputs {
  seniorDebtAmount: number;
  mezzanineDebtAmount: number;
  sponsorEquityAmount: number;
  lpEquityAmount: number;
  totalEquityCheck: number;
  blendedWaccPct: number;
  exitEnterpriseValue: number;
  totalDebtAtExit: number;
  exitEquityValue: number;
  tiers: WaterfallDistributionTier[];
  lpTotalReturn: number;
  gpTotalReturn: number;
  lpMoic: number;
  gpMoic: number;
  lpIrr: number;
  gpIrr: number;
}

export function calculateSyndicationWaterfall(input: CapitalStructureInput): SyndicationOutputs {
  const seniorDebtAmount = Math.round(input.purchasePrice * (input.seniorDebtPct / 100));
  const mezzanineDebtAmount = Math.round(input.purchasePrice * (input.mezzanineDebtPct / 100));
  const sponsorEquityAmount = Math.round(input.purchasePrice * (input.sponsorEquityPct / 100));
  const lpEquityAmount = Math.round(input.purchasePrice * (input.lpEquityPct / 100));
  const totalEquityCheck = sponsorEquityAmount + lpEquityAmount;

  // Blended WACC calculation
  const totalCapital = input.purchasePrice;
  const seniorCost = (seniorDebtAmount / totalCapital) * (input.seniorDebtRate / 100);
  const mezzCost = (mezzanineDebtAmount / totalCapital) * (input.mezzanineDebtRate / 100);
  const equityCost = (totalEquityCheck / totalCapital) * 0.18; // 18% cost of equity target
  const blendedWaccPct = Number(((seniorCost + mezzCost + equityCost) * 100).toFixed(2));

  // Exit Values
  const exitEnterpriseValue = Math.round(input.exitEbitda * input.exitMultiple);
  // Mezzanine PIK compounding over hold period
  const mezzRemaining = Math.round(mezzanineDebtAmount * Math.pow(1 + input.mezzanineDebtRate / 100, input.holdYears));
  // Senior debt paying down 5% principal annually
  const seniorRemaining = Math.max(0, Math.round(seniorDebtAmount * (1 - 0.05 * input.holdYears)));
  const totalDebtAtExit = seniorRemaining + mezzRemaining;

  const exitEquityValue = Math.max(0, exitEnterpriseValue - totalDebtAtExit);

  // 4-Tier Distribution Waterfall
  let distributable = exitEquityValue;
  const tiers: WaterfallDistributionTier[] = [];

  // Tier 1: Return of Capital (Pro Rata)
  const tier1Amount = Math.min(distributable, totalEquityCheck);
  const lpRatio = totalEquityCheck > 0 ? lpEquityAmount / totalEquityCheck : 0.8;
  const gpRatio = totalEquityCheck > 0 ? sponsorEquityAmount / totalEquityCheck : 0.2;

  const tier1Lp = Math.round(tier1Amount * lpRatio);
  const tier1Gp = Math.round(tier1Amount * gpRatio);

  tiers.push({
    tierName: 'Tier 1: Return of Capital',
    lpAmount: tier1Lp,
    gpAmount: tier1Gp,
    totalDistributed: tier1Amount
  });
  distributable -= tier1Amount;

  // Tier 2: Preferred Return / Hurdle Rate
  const preferredReturnTarget = Math.round(totalEquityCheck * (Math.pow(1 + input.hurdleRatePct / 100, input.holdYears) - 1));
  const tier2Amount = Math.min(distributable, preferredReturnTarget);
  const tier2Lp = Math.round(tier2Amount * lpRatio);
  const tier2Gp = Math.round(tier2Amount * gpRatio);

  tiers.push({
    tierName: `Tier 2: Preferred Return (${input.hurdleRatePct}% Hurdle)`,
    lpAmount: tier2Lp,
    gpAmount: tier2Gp,
    totalDistributed: tier2Amount
  });
  distributable -= tier2Amount;

  // Tier 3: Sponsor Catch-up (GP receives 20% of profits distributed so far)
  const catchupTarget = Math.round((tier2Lp / (1 - input.gpCarryPct / 100)) * (input.gpCarryPct / 100));
  const tier3Amount = Math.min(distributable, catchupTarget);

  tiers.push({
    tierName: `Tier 3: Sponsor Catch-Up (${input.gpCarryPct}% GP)`,
    lpAmount: 0,
    gpAmount: tier3Amount,
    totalDistributed: tier3Amount
  });
  distributable -= tier3Amount;

  // Tier 4: Residual Carry Split
  const tier4Lp = Math.round(distributable * (1 - input.gpCarryPct / 100));
  const tier4Gp = Math.round(distributable * (input.gpCarryPct / 100));

  tiers.push({
    tierName: `Tier 4: Residual Carry (${100 - input.gpCarryPct}/${input.gpCarryPct} Split)`,
    lpAmount: tier4Lp,
    gpAmount: tier4Gp,
    totalDistributed: distributable
  });

  const lpTotalReturn = tier1Lp + tier2Lp + tier4Lp;
  const gpTotalReturn = tier1Gp + tier2Gp + tier3Amount + tier4Gp;

  const lpMoic = lpEquityAmount > 0 ? Number((lpTotalReturn / lpEquityAmount).toFixed(2)) : 0;
  const gpMoic = sponsorEquityAmount > 0 ? Number((gpTotalReturn / sponsorEquityAmount).toFixed(2)) : 0;

  const lpIrr = (lpEquityAmount > 0 && lpMoic > 0) ? Number(((Math.pow(lpMoic, 1 / input.holdYears) - 1) * 100).toFixed(1)) : 0;
  const gpIrr = (sponsorEquityAmount > 0 && gpMoic > 0) ? Number(((Math.pow(gpMoic, 1 / input.holdYears) - 1) * 100).toFixed(1)) : 0;

  return {
    seniorDebtAmount,
    mezzanineDebtAmount,
    sponsorEquityAmount,
    lpEquityAmount,
    totalEquityCheck,
    blendedWaccPct,
    exitEnterpriseValue,
    totalDebtAtExit,
    exitEquityValue,
    tiers,
    lpTotalReturn,
    gpTotalReturn,
    lpMoic,
    gpMoic,
    lpIrr,
    gpIrr
  };
}
