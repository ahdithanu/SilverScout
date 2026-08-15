import { FundDeploymentConfig } from '../types';

export interface FundBrandingConfig {
  fundId?: string;
  fundName: string;
  fundTagline: string;
  logoUrl?: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  customDomain?: string;
  contactEmail: string;
}

export const DEFAULT_FUND_BRANDING: FundBrandingConfig = {
  fundId: 'redwood-cap',
  fundName: 'Redwood Capital Partners',
  fundTagline: 'Lower Middle Market Search Fund Specializing in California Trade SMBs',
  logoUrl: '',
  primaryColorHex: '#10b981',
  secondaryColorHex: '#0f172a',
  customDomain: 'scout.redwoodcapital.com',
  contactEmail: 'acquisitions@redwoodcapital.com'
};

export const DEFAULT_FUND_DEPLOYMENT_CONFIG: FundDeploymentConfig = {
  fundId: 'redwood-cap',
  fundName: 'Redwood Capital Partners',
  configVersion: 1,
  updatedAt: new Date().toISOString(),
  financialThresholds: {
    minRevenue: 1500000,
    minEbitda: 400000,
    minProfitMargin: 15.0,
    maxPermitDropPct: 25.0
  },
  underwritingAssumptions: {
    defaultSeniorDebtLtv: 60.0,
    interestRatePct: 8.5,
    defaultHoldYears: 5,
    minDscrThreshold: 1.25
  },
  scoringWeights: {
    permitDropWeight: 0.35,
    marginWeight: 0.35,
    entityAgeWeight: 0.15,
    digitalPostWeight: 0.15
  },
  integrations: {
    outreachProvider: 'sendgrid',
    crmProvider: 'hubspot',
    aiModel: 'gemini-2.5-flash'
  },
  approvalPolicy: {
    requirePartnerLOIApproval: true,
    requireICMemoValidation: true
  }
};

export function getStoredFundBranding(): FundBrandingConfig {
  try {
    const saved = localStorage.getItem('silver_scout_fund_branding');
    if (saved) return JSON.parse(saved);
  } catch (err) {
    // Fallback to default branding
  }
  return DEFAULT_FUND_BRANDING;
}

export function saveFundBranding(config: FundBrandingConfig): void {
  try {
    localStorage.setItem('silver_scout_fund_branding', JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save branding:", err);
  }
}

export function validateFundBranding(config: any): { valid: boolean; error?: string } {
  if (!config || !config.fundName || config.fundName.trim() === '') {
    return { valid: false, error: 'Fund Name is required' };
  }
  if (!config.primaryColorHex || !config.primaryColorHex.startsWith('#')) {
    return { valid: false, error: 'Valid Hex primary color required' };
  }
  return { valid: true };
}

export function validateFundDeploymentConfig(config: any): { valid: boolean; error?: string } {
  if (!config || !config.fundId) return { valid: false, error: 'fundId is required' };
  if (!config.financialThresholds || typeof config.financialThresholds.minEbitda !== 'number') {
    return { valid: false, error: 'Invalid financialThresholds' };
  }
  const weights = config.scoringWeights;
  if (!weights) return { valid: false, error: 'scoringWeights is required' };
  const sum = weights.permitDropWeight + weights.marginWeight + weights.entityAgeWeight + weights.digitalPostWeight;
  if (Math.abs(sum - 1.0) > 0.01) {
    return { valid: false, error: `Scoring weights must sum to 1.0 (got ${sum})` };
  }
  return { valid: true };
}
