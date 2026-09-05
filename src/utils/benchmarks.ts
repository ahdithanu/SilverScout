import { Lead } from '../types';

export interface IndustryBenchmark {
  industry: string;
  avgProfitMargin: number;
  avgEvEbitdaMultiple: number;
  avgPermitDrop: number;
  avgPropensityScore: number;
  sampleCount: number;
}

export const TRADE_BENCHMARKS: Record<string, IndustryBenchmark> = {
  HVAC: {
    industry: 'HVAC',
    avgProfitMargin: 20.5,
    avgEvEbitdaMultiple: 5.8,
    avgPermitDrop: 28.0,
    avgPropensityScore: 7.2,
    sampleCount: 1420
  },
  Plumbing: {
    industry: 'Plumbing',
    avgProfitMargin: 22.0,
    avgEvEbitdaMultiple: 5.5,
    avgPermitDrop: 24.5,
    avgPropensityScore: 6.8,
    sampleCount: 1180
  },
  Electrical: {
    industry: 'Electrical',
    avgProfitMargin: 18.5,
    avgEvEbitdaMultiple: 5.2,
    avgPermitDrop: 22.0,
    avgPropensityScore: 6.5,
    sampleCount: 950
  },
  Manufacturing: {
    industry: 'Manufacturing',
    avgProfitMargin: 16.0,
    avgEvEbitdaMultiple: 6.2,
    avgPermitDrop: 32.0,
    avgPropensityScore: 7.5,
    sampleCount: 840
  },
  Roofing: {
    industry: 'Roofing',
    avgProfitMargin: 17.5,
    avgEvEbitdaMultiple: 4.8,
    avgPermitDrop: 30.0,
    avgPropensityScore: 7.0,
    sampleCount: 620
  },
  Solar: {
    industry: 'Solar',
    avgProfitMargin: 15.0,
    avgEvEbitdaMultiple: 6.5,
    avgPermitDrop: 35.0,
    avgPropensityScore: 8.0,
    sampleCount: 410
  },
  Landscaping: {
    industry: 'Landscaping',
    avgProfitMargin: 19.0,
    avgEvEbitdaMultiple: 4.5,
    avgPermitDrop: 18.0,
    avgPropensityScore: 6.0,
    sampleCount: 530
  },
  'Property Management': {
    industry: 'Property Management',
    avgProfitMargin: 24.5,
    avgEvEbitdaMultiple: 5.2,
    avgPermitDrop: 15.0,
    avgPropensityScore: 7.2,
    sampleCount: 920
  },
  'Multifamily Real Estate': {
    industry: 'Multifamily Real Estate',
    avgProfitMargin: 48.0,
    avgEvEbitdaMultiple: 8.5,
    avgPermitDrop: 22.0,
    avgPropensityScore: 7.8,
    sampleCount: 1150
  }
};

export function getIndustryBenchmark(industry: string): IndustryBenchmark {
  const normalized = Object.keys(TRADE_BENCHMARKS).find(
    key => key.toLowerCase() === (industry || '').toLowerCase() || (industry || '').toLowerCase().includes(key.toLowerCase())
  );
  return TRADE_BENCHMARKS[normalized || 'HVAC'];
}

export interface LeadPercentileAnalysis {
  marginPercentile: number;
  propensityPercentile: number;
  permitDropDelta: number;
  overallHealthScore: number;
  isOutperformingMargin: boolean;
}

export function calculateLeadPercentiles(lead: Lead): LeadPercentileAnalysis {
  const benchmark = getIndustryBenchmark(lead.industry);

  const margin = lead.profitMargin || (lead.revenue && lead.ebitda ? (lead.ebitda / lead.revenue) * 100 : benchmark.avgProfitMargin);
  const marginDiff = margin - benchmark.avgProfitMargin;
  const marginPercentile = Math.min(99, Math.max(5, Math.round(50 + marginDiff * 2.5)));

  const propensity = lead.exitPropensityScore || 5;
  const propensityDiff = propensity - benchmark.avgPropensityScore;
  const propensityPercentile = Math.min(99, Math.max(5, Math.round(50 + propensityDiff * 15)));

  const permitDropDelta = Number(((lead.permitDrop || 0) - benchmark.avgPermitDrop).toFixed(1));

  const overallHealthScore = Math.min(99, Math.round((marginPercentile * 0.4) + (propensityPercentile * 0.4) + (Math.min(100, (lead.permitDrop || 0) * 2) * 0.2)));

  return {
    marginPercentile,
    propensityPercentile,
    permitDropDelta,
    overallHealthScore,
    isOutperformingMargin: margin >= benchmark.avgProfitMargin
  };
}
