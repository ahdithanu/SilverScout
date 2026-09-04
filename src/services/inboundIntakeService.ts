import { Lead, InboundInterestDetails } from '../types';

export interface InboundSubmissionPayload {
  businessName: string;
  industry: string;
  location: string;
  revenue: number;
  ebitda: number;
  establishedYear?: number;
  founderName: string;
  founderEmail: string;
  founderPhone?: string;
  targetTimeline: 'IMMEDIATE_0_3M' | 'SHORT_3_6M' | 'MEDIUM_6_12M' | 'EXPLORING';
  saleReason: 'RETIREMENT' | 'BURNOUT_HEALTH' | 'PARTNERSHIP_SPLIT' | 'GROWTH_RECAP' | 'OTHER';
  sellerExpectedValuation?: number;
  notes?: string;
}

/**
 * Calculates inbound urgency score based on founder's sale horizon, health/burnout factors,
 * and valuation realism.
 */
export function computeInboundUrgencyScore(
  payload: {
    targetTimeline: InboundInterestDetails['targetTimeline'];
    saleReason: InboundInterestDetails['saleReason'];
    revenue?: number;
    ebitda?: number;
    sellerExpectedValuation?: number;
  }
): number {
  let score = 4.0; // Inbound inquiries start with a baseline commitment to sell

  // 1. Timeline Horizon Weight
  switch (payload.targetTimeline) {
    case 'IMMEDIATE_0_3M':
      score += 3.5;
      break;
    case 'SHORT_3_6M':
      score += 2.5;
      break;
    case 'MEDIUM_6_12M':
      score += 1.5;
      break;
    case 'EXPLORING':
      score += 0.5;
      break;
  }

  // 2. Reason for Sale Motivation
  switch (payload.saleReason) {
    case 'BURNOUT_HEALTH':
      score += 2.5; // High urgency, motivated seller
      break;
    case 'RETIREMENT':
      score += 2.0; // Firm timeline
      break;
    case 'PARTNERSHIP_SPLIT':
      score += 1.8;
      break;
    case 'GROWTH_RECAP':
      score += 1.0;
      break;
    default:
      score += 0.5;
  }

  // 3. Valuation Expectation Check
  if (payload.ebitda && payload.sellerExpectedValuation) {
    const impliedMultiple = payload.sellerExpectedValuation / payload.ebitda;
    if (impliedMultiple <= 5.0) {
      score += 1.0; // Realistic expectation increases close probability
    } else if (impliedMultiple > 8.0) {
      score -= 1.0; // Price friction penalty
    }
  }

  return Number(Math.min(9.9, Math.max(4.0, score)).toFixed(1));
}

/**
 * Transforms an inbound seller submission into an institutional Lead entity.
 */
export function transformInboundSubmissionToLead(
  submission: InboundSubmissionPayload,
  fundId: string = 'search-fund-alpha'
): Lead {
  const urgencyScore = computeInboundUrgencyScore({
    targetTimeline: submission.targetTimeline,
    saleReason: submission.saleReason,
    revenue: submission.revenue,
    ebitda: submission.ebitda,
    sellerExpectedValuation: submission.sellerExpectedValuation
  });

  const estimatedMultiple = 4.5;
  const valuationEstimate = submission.ebitda 
    ? Math.round(submission.ebitda * estimatedMultiple) 
    : (submission.sellerExpectedValuation || 3500000);

  const profitMargin = submission.revenue && submission.revenue > 0
    ? Math.round((submission.ebitda / submission.revenue) * 100)
    : 20;

  const regYear = submission.establishedYear || (new Date().getFullYear() - 15);
  const registrationDate = `${regYear}-01-15T00:00:00.000Z`;

  const inboundDetails: InboundInterestDetails = {
    submissionChannel: 'VALUATION_PORTAL',
    founderName: submission.founderName,
    founderEmail: submission.founderEmail,
    founderPhone: submission.founderPhone,
    targetTimeline: submission.targetTimeline,
    saleReason: submission.saleReason,
    sellerExpectedValuation: submission.sellerExpectedValuation,
    urgencyScore,
    notes: submission.notes
  };

  const id = `inbound-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  return {
    id,
    fundId,
    name: submission.businessName,
    industry: submission.industry,
    location: submission.location,
    registrationDate,
    agentName: submission.founderName,
    isCorporateAgent: false,
    permitVolume2023_2025: 45,
    permitVolume2026: 28,
    permitDrop: 38,
    lastDigitalPostDate: 'Over 1 year ago',
    reviewVelocity: 0.2,
    exitPropensityScore: urgencyScore,
    aiThesis: `Inbound sell-side inquiry from principal founder ${submission.founderName}. Motivated by ${submission.saleReason.replace('_', ' ').toLowerCase()} with a ${submission.targetTimeline.replace(/_/g, ' ').toLowerCase()} transaction horizon. Stated EBITDA of $${(submission.ebitda || 0).toLocaleString()} represents an attractive direct buyout opportunity.`,
    valuationEstimate,
    status: 'qualified',
    currentState: 'ENRICHED',
    revenue: submission.revenue,
    ebitda: submission.ebitda,
    profitMargin,
    dealSourceChannel: 'INBOUND_INTEREST',
    inboundInterestDetails: inboundDetails,
    tags: ['Inbound Seller', 'Founder Submission', submission.saleReason.replace('_', ' ')],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'Inbound Valuation Portal'
  };
}
