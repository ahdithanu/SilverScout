import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  computeListingSignals, 
  deAnonymizeBlindListing, 
  SAMPLE_MARKETPLACE_LISTINGS 
} from '../services/listingIngestionService';
import { 
  computeInboundUrgencyScore, 
  transformInboundSubmissionToLead, 
  InboundSubmissionPayload 
} from '../services/inboundIntakeService';
import { Lead } from '../types';

describe('Marketplace Listing Signals & DOM Fatigue Engine', () => {
  it('correctly calculates asking multiple and multiple spread against industry baseline', () => {
    // $4.5M asking on $1.0M cash flow = 4.5x asking multiple. Baseline = 4.5x. Spread = 0.0x
    const signals = computeListingSignals(4500000, 1000000, 45, 0, 4.5);
    assert.strictEqual(signals.askingMultiple, 4.5);
    assert.strictEqual(signals.multipleSpread, 0.0);
    assert.strictEqual(signals.domFatigueScore, 1.0);
  });

  it('amplifies fatigue score for stale listings with Days on Market >= 180 and price cuts', () => {
    // Stale listing on market 200 days with 15% price cut
    const staleSignals = computeListingSignals(3600000, 900000, 200, 15, 4.5);
    assert.strictEqual(staleSignals.domFatigueScore, 1.5, 'DOM >= 180 should receive 1.5x fatigue multiplier');
    assert.ok(staleSignals.compositePropensityScore >= 8.5, 'Stale listing with price drop should have high propensity score');
  });

  it('rewards valuation arbitrage when asking multiple is below market median', () => {
    // Asking 3.0x on a 4.5x trade = underpriced arbitrage
    const arbitrageSignals = computeListingSignals(3000000, 1000000, 90, 10, 4.5);
    assert.ok(arbitrageSignals.multipleSpread < 0, 'Spread should be negative indicating discount');
    assert.ok(arbitrageSignals.compositePropensityScore >= 8.0, 'Discounted asking price boosts close probability');
  });
});

describe('AI Blind-Listing Entity De-Anonymization Engine', () => {
  const candidateLeads: Lead[] = [
    {
      id: 'lead-stockton-hvac',
      fundId: 'fund-1',
      name: 'Stockton Precision Air & Chiller Co.',
      industry: 'HVAC',
      location: 'Stockton, CA',
      registrationDate: '2005-04-12T00:00:00.000Z',
      agentName: 'Arthur Pendelton',
      isCorporateAgent: false,
      permitVolume2023_2025: 50,
      permitVolume2026: 25,
      permitDrop: 50,
      lastDigitalPostDate: 'Never',
      reviewVelocity: 0.1,
      exitPropensityScore: 8.5,
      aiThesis: 'High fatigue candidate',
      valuationEstimate: 4000000,
      status: 'qualified',
      revenue: 4400000,
      ebitda: 950000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test'
    },
    {
      id: 'lead-sacramento-plumbing',
      fundId: 'fund-1',
      name: 'Sacramento Master Pipe LLC',
      industry: 'Plumbing',
      location: 'Sacramento, CA',
      registrationDate: '2015-08-20T00:00:00.000Z',
      agentName: 'Jane Doe',
      isCorporateAgent: false,
      permitVolume2023_2025: 30,
      permitVolume2026: 28,
      permitDrop: 7,
      lastDigitalPostDate: 'Active',
      reviewVelocity: 2.5,
      exitPropensityScore: 4.2,
      aiThesis: 'Growth firm',
      valuationEstimate: 2000000,
      status: 'new',
      revenue: 2200000,
      ebitda: 420000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test'
    }
  ];

  it('de-anonymizes a blind broker teaser matching city, trade, revenue, and vintage', () => {
    const blindTeaser = {
      industry: 'HVAC',
      location: 'Stockton, CA',
      revenue: 4500000,
      cashFlow: 980000,
      establishedYear: 2005
    };

    const result = deAnonymizeBlindListing(blindTeaser, candidateLeads);
    assert.ok(result.matchedLead !== null, 'Should successfully match blind teaser to candidate');
    assert.strictEqual(result.matchedLead?.id, 'lead-stockton-hvac');
    assert.ok(result.confidenceScore >= 80, 'Match confidence should exceed 80%');
    assert.ok(result.matchRationale.includes('Exact municipal jurisdiction match'));
  });

  it('rejects candidate matches when geography and vertical conflict', () => {
    const blindTeaser = {
      industry: 'Solar',
      location: 'San Diego, CA',
      revenue: 8000000
    };

    const result = deAnonymizeBlindListing(blindTeaser, candidateLeads);
    assert.strictEqual(result.matchedLead, null, 'Should return null when no candidate matches');
    assert.ok(result.confidenceScore < 60, 'Confidence score should be low');
  });
});

describe('Inbound Founder Valuation Intake & Urgency Scoring', () => {
  it('computes high urgency score for immediate retirement / health-driven sellers', () => {
    const urgency = computeInboundUrgencyScore({
      targetTimeline: 'IMMEDIATE_0_3M',
      saleReason: 'BURNOUT_HEALTH',
      revenue: 3500000,
      ebitda: 750000,
      sellerExpectedValuation: 3300000 // 4.4x multiple (realistic)
    });

    assert.ok(urgency >= 8.5, 'Urgency score for immediate burnout seller should be >= 8.5');
  });

  it('penalizes urgency score when founder has an unrealistic valuation expectation', () => {
    const realisticScore = computeInboundUrgencyScore({
      targetTimeline: 'SHORT_3_6M',
      saleReason: 'RETIREMENT',
      revenue: 4000000,
      ebitda: 800000,
      sellerExpectedValuation: 3600000 // 4.5x
    });

    const unrealisticScore = computeInboundUrgencyScore({
      targetTimeline: 'SHORT_3_6M',
      saleReason: 'RETIREMENT',
      revenue: 4000000,
      ebitda: 800000,
      sellerExpectedValuation: 9000000 // 11.25x (inflated multiple)
    });

    assert.ok(realisticScore > unrealisticScore, 'Realistic valuation expectation should yield higher urgency/qualification');
  });

  it('transforms inbound submission payload into a valid institutional Lead', () => {
    const payload: InboundSubmissionPayload = {
      businessName: 'Valley Industrial Electric Systems Inc.',
      industry: 'Electrical',
      location: 'Fresno, CA',
      revenue: 4200000,
      ebitda: 920000,
      establishedYear: 2002,
      founderName: 'Frank Gallagher',
      founderEmail: 'frank@valleyelectric.com',
      founderPhone: '(559) 555-0199',
      targetTimeline: 'IMMEDIATE_0_3M',
      saleReason: 'RETIREMENT',
      sellerExpectedValuation: 4100000,
      notes: 'Ready to transition to full retirement within 90 days. Looking for ethical PE steward.'
    };

    const lead = transformInboundSubmissionToLead(payload, 'search-fund-alpha');
    assert.strictEqual(lead.dealSourceChannel, 'INBOUND_INTEREST');
    assert.strictEqual(lead.name, 'Valley Industrial Electric Systems Inc.');
    assert.strictEqual(lead.inboundInterestDetails?.founderName, 'Frank Gallagher');
    assert.strictEqual(lead.inboundInterestDetails?.targetTimeline, 'IMMEDIATE_0_3M');
    assert.strictEqual(lead.status, 'qualified');
    assert.ok(lead.exitPropensityScore >= 8.0);
    assert.ok(lead.aiThesis.includes('Frank Gallagher'));
  });
});
