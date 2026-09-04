import { Lead, ListingDetails, DealSourceChannel } from '../types';

export interface ListingSignalMetrics {
  askingMultiple: number;
  fairValuationMultiple: number;
  multipleSpread: number; // positive = overpriced, negative = discount/arbitrage
  domFatigueScore: number; // 1.0 - 1.5x multiplier based on Days on Market
  compositePropensityScore: number; // 1-10 exit/deal propensity
}

/**
 * Calculates listing-specific signals including DOM fatigue, price reduction velocity,
 * and asking multiple arbitrage.
 */
export function computeListingSignals(
  askingPrice: number,
  cashFlowOrSde: number,
  daysOnMarket: number = 60,
  priceDropPct: number = 0,
  industryBaselineMultiple: number = 4.5
): ListingSignalMetrics {
  const safeCashFlow = cashFlowOrSde > 0 ? cashFlowOrSde : 500000;
  const askingMultiple = Number((askingPrice / safeCashFlow).toFixed(2));
  const multipleSpread = Number((askingMultiple - industryBaselineMultiple).toFixed(2));

  // DOM Fatigue Multiplier: listings on market >120 days have substantially higher seller fatigue
  let domFatigueScore = 1.0;
  if (daysOnMarket >= 180) {
    domFatigueScore = 1.5;
  } else if (daysOnMarket >= 120) {
    domFatigueScore = 1.35;
  } else if (daysOnMarket >= 60) {
    domFatigueScore = 1.15;
  }

  // Base score starting around 6.5 for active listings (they explicitly want to sell)
  let rawScore = 6.5;

  // DOM bonus (+0.5 to +1.5 for stale listings)
  if (daysOnMarket >= 180) rawScore += 1.5;
  else if (daysOnMarket >= 120) rawScore += 1.0;
  else if (daysOnMarket >= 60) rawScore += 0.5;

  // Price drop bonus: demonstrates seller is willing to negotiate and reality is setting in
  if (priceDropPct >= 20) rawScore += 1.5;
  else if (priceDropPct >= 10) rawScore += 1.0;
  else if (priceDropPct >= 5) rawScore += 0.5;

  // Multiple discount bonus: if asking is below market multiple, high transaction probability
  if (multipleSpread < 0) {
    rawScore += Math.min(1.5, Math.abs(multipleSpread) * 0.8);
  } else if (multipleSpread > 2.5) {
    // Unrealistic seller expectation penalty
    rawScore -= 1.0;
  }

  const compositePropensityScore = Number(Math.min(9.9, Math.max(5.0, rawScore)).toFixed(1));

  return {
    askingMultiple,
    fairValuationMultiple: industryBaselineMultiple,
    multipleSpread,
    domFatigueScore,
    compositePropensityScore
  };
}

/**
 * Entity De-Anonymizer: Correlates blind broker teasers ("Established Central Valley HVAC Contractor")
 * against known registered entities in the Secretary of State database.
 */
export function deAnonymizeBlindListing(
  blindListing: {
    industry: string;
    location: string;
    revenue?: number;
    cashFlow?: number;
    establishedYear?: number;
  },
  registryLeads: Lead[]
): { matchedLead: Lead | null; confidenceScore: number; matchRationale: string } {
  let bestMatch: Lead | null = null;
  let highestScore = 0;
  let bestRationale = '';

  for (const candidate of registryLeads) {
    let score = 0;
    const rationales: string[] = [];

    // 1. Geographic match (same city or same county/metro)
    const locA = (blindListing.location || '').toLowerCase();
    const locB = (candidate.location || '').toLowerCase();
    if (locA && locB && (locA.includes(locB) || locB.includes(locA))) {
      score += 35;
      rationales.push('Exact municipal jurisdiction match');
    }

    // 2. Industry vertical match
    const indA = (blindListing.industry || '').toLowerCase();
    const indB = (candidate.industry || '').toLowerCase();
    if (indA && indB && (indA.includes(indB) || indB.includes(indA))) {
      score += 30;
      rationales.push('Identical trade vertical');
    }

    // 3. Financial magnitude match (within 25% revenue / EBITDA)
    if (blindListing.revenue && candidate.revenue) {
      const revDiff = Math.abs(blindListing.revenue - candidate.revenue) / candidate.revenue;
      if (revDiff <= 0.20) {
        score += 25;
        rationales.push(`Revenue aligns within ${(revDiff * 100).toFixed(0)}%`);
      } else if (revDiff <= 0.35) {
        score += 15;
        rationales.push('Revenue within comparable operating band');
      }
    }

    // 4. Entity age / established year match
    if (blindListing.establishedYear && candidate.registrationDate) {
      const regYear = new Date(candidate.registrationDate).getFullYear();
      const yearDiff = Math.abs(blindListing.establishedYear - regYear);
      if (yearDiff <= 1) {
        score += 15;
        rationales.push(`Registration vintage matches (${regYear} vs est. ${blindListing.establishedYear})`);
      } else if (yearDiff <= 3) {
        score += 10;
        rationales.push(`Vintage aligns within ${yearDiff} years`);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = candidate;
      bestRationale = rationales.join(' • ');
    }
  }

  return {
    matchedLead: highestScore >= 60 ? bestMatch : null,
    confidenceScore: Math.min(99, highestScore),
    matchRationale: bestRationale || 'Insufficient correlation with existing registry targets'
  };
}

/**
 * Standardized institutional sample listings from BizBuySell, Axial, and Broker Networks
 */
export const SAMPLE_MARKETPLACE_LISTINGS: Partial<Lead>[] = [
  {
    name: 'Central Valley Commercial HVAC & Industrial Chiller Co.',
    industry: 'HVAC',
    location: 'Stockton, CA',
    revenue: 4500000,
    ebitda: 980000,
    valuationEstimate: 4100000,
    dealSourceChannel: 'ON_MARKET_LISTING',
    listingDetails: {
      sourcePlatform: 'BizBuySell',
      listingId: 'BBS-2026-98124',
      listingUrl: 'https://www.bizbuysell.com/listings/sample-hvac-stockton',
      askingPrice: 3950000,
      cashFlowOrSde: 980000,
      daysOnMarket: 175,
      priceDropPct: 12,
      isBlindTeaser: true,
      brokerName: 'David Sterling',
      brokerFirm: 'Pacific M&A Intermediaries',
      brokerEmail: 'dsterling@pacificma.com',
      teaserSummary: 'Commercial HVAC, packaged rooftop unit service & preventive maintenance contracts covering San Joaquin County.'
    }
  },
  {
    name: 'Northern California Precision Sheet Metal & CNC Fabricator',
    industry: 'Manufacturing',
    location: 'Sacramento, CA',
    revenue: 5800000,
    ebitda: 1250000,
    valuationEstimate: 5600000,
    dealSourceChannel: 'ON_MARKET_LISTING',
    listingDetails: {
      sourcePlatform: 'Axial',
      listingId: 'AXL-CA-7719',
      listingUrl: 'https://network.axial.net/deals/sample-metal-fab',
      askingPrice: 5200000,
      cashFlowOrSde: 1250000,
      daysOnMarket: 84,
      priceDropPct: 0,
      isBlindTeaser: false,
      brokerName: 'Marcus Vance, CEPA',
      brokerFirm: 'Vance Capital Advisors',
      brokerEmail: 'mvance@vanceadvisors.com',
      teaserSummary: 'AS9100 certified precision fabrication facility serving aerospace and industrial automation clients.'
    }
  },
  {
    name: 'Modesto Mechanical Plumbing & Backflow Protection Inc.',
    industry: 'Plumbing',
    location: 'Modesto, CA',
    revenue: 3200000,
    ebitda: 710000,
    valuationEstimate: 3100000,
    dealSourceChannel: 'ON_MARKET_LISTING',
    listingDetails: {
      sourcePlatform: 'Sunbelt',
      listingId: 'SBN-MOD-4401',
      listingUrl: 'https://www.sunbeltnetwork.com/sample-plumbing-modesto',
      askingPrice: 2800000,
      cashFlowOrSde: 710000,
      daysOnMarket: 210,
      priceDropPct: 18,
      isBlindTeaser: true,
      brokerName: 'Elena Rostova',
      brokerFirm: 'Sunbelt Business Brokers of Central CA',
      brokerEmail: 'erostova@sunbeltnetwork.com',
      teaserSummary: 'Turnkey commercial and light industrial plumbing contractor with 8 fleet vehicles and master plumber leadership.'
    }
  },
  {
    name: 'Bay Area Commercial Roofing & Waterproofing Systems',
    industry: 'Roofing',
    location: 'San Jose, CA',
    revenue: 7200000,
    ebitda: 1450000,
    valuationEstimate: 6500000,
    dealSourceChannel: 'ON_MARKET_LISTING',
    listingDetails: {
      sourcePlatform: 'BusinessesForSale',
      listingId: 'BFS-US-102941',
      listingUrl: 'https://us.businessesforsale.com/sample-roofing-sanjose',
      askingPrice: 6200000,
      cashFlowOrSde: 1450000,
      daysOnMarket: 145,
      priceDropPct: 8,
      isBlindTeaser: false,
      brokerName: 'Gregory Chen',
      brokerFirm: 'Beacon M&A Partners',
      brokerEmail: 'gchen@beaconmapartners.com',
      teaserSummary: 'High-margin commercial flat-roof membrane replacement contractor with Master Elite GAF certifications.'
    }
  }
];
