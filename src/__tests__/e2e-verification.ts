import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  searchBusinessesByCity, 
  analyzeLeads, 
  generateICMemo, 
  generateLOIDocument, 
  generateOutreachLetter,
  scanDigitalHealthSignals,
  generateOutreachSequence
} from '../services/geminiService';
import { Lead } from '../types';

test('E2E City Search & Lead Flow: Stockton, CA', async () => {
  const results = await searchBusinessesByCity('Stockton, CA');
  assert.ok(results.length >= 5, 'City search must return at least 5 businesses');
  
  const first = results[0];
  assert.ok(first.name && first.name.length > 0, 'Business must have a name');
  assert.ok(first.industry && first.industry.length > 0, 'Business must have an industry');
  assert.ok(first.location.includes('Stockton'), 'Business location must match search city');
  assert.ok(typeof first.permitDrop === 'number', 'Must have permit drop metric');

  // Convert partial leads to full Lead objects for downstream pipeline
  const leads: Lead[] = results.map((r, idx) => ({
    id: `test-lead-${idx}`,
    name: r.name || 'Test Business',
    industry: r.industry || 'HVAC',
    location: r.location || 'Stockton, CA',
    registrationDate: r.registrationDate || '1995-05-12',
    agentName: r.agentName || 'John Doe',
    isCorporateAgent: r.isCorporateAgent ?? false,
    permitVolume2023_2025: r.permitVolume2023_2025 || 50,
    permitVolume2026: r.permitVolume2026 || 10,
    permitDrop: r.permitDrop || 65,
    lastDigitalPostDate: r.lastDigitalPostDate || '2023-01-01',
    reviewVelocity: r.reviewVelocity || 0.2,
    status: 'new',
    createdAt: new Date().toISOString(),
    createdBy: 'test-user',
    revenue: r.revenue || 3500000,
    ebitda: r.ebitda || 770000
  }));

  // Test Phase 2: Gemini Intelligence (Exit Propensity & AI Thesis)
  const analysis = await analyzeLeads(leads, [], { 'HVAC & Mechanical': 5.0 }, { defaultProfitMargin: 22 }, undefined, false, undefined, false);
  assert.ok(analysis.results.length === leads.length, 'Every lead must receive an analysis result');
  
  const lead1Result = analysis.results[0];
  assert.ok(typeof lead1Result.exitPropensityScore === 'number', 'Exit propensity score must be a number');
  assert.ok(lead1Result.exitPropensityScore! >= 1 && lead1Result.exitPropensityScore! <= 10, 'Score must be 1-10');
  assert.ok(lead1Result.aiThesis && lead1Result.aiThesis.length > 20, 'Must have detailed PE investment thesis');
  assert.ok(lead1Result.valuationEstimate! > 0, 'Valuation estimate must be positive');

  // Attach analyzed fields
  leads[0].exitPropensityScore = lead1Result.exitPropensityScore;
  leads[0].aiThesis = lead1Result.aiThesis;
  leads[0].valuationEstimate = lead1Result.valuationEstimate;

  // Test Phase 3: Deal Room & IC Memo Generation
  const icMemo = await generateICMemo(leads[0]);
  assert.ok(icMemo.dealSummary.length > 0, 'IC Memo must have deal summary');
  assert.ok(icMemo.investmentHighlights.length >= 3, 'Must have at least 3 investment highlights');
  assert.ok(icMemo.financialOverview.impliedMultiple.length > 0, 'Must have financial overview multiple');

  // Test Phase 4: LOI Generation
  const loi = await generateLOIDocument(leads[0], {
    purchasePrice: 3800000,
    upfrontCash: 2850000,
    sellerNote: 570000,
    earnoutAmount: 380000,
    rolloverEquityPercent: 10,
    workingCapitalPeg: 350000,
    exclusivityDays: 60
  });
  assert.ok(loi.title.includes('INTENT'), 'LOI must have proper legal title');
  assert.ok(loi.loiBody.includes('Working Capital'), 'LOI must include standard working capital clause');

  // Test Phase 5: Outreach Generation
  const outreach = await generateOutreachLetter(leads[0]);
  assert.ok(outreach.subject.length > 0, 'Outreach letter must have subject');
  assert.ok(outreach.letterBody.length > 50, 'Outreach letter must have body');

  // Test Phase 6: Digital Health Scan
  const digitalHealth = await scanDigitalHealthSignals(leads[0]);
  assert.ok(digitalHealth.domainStatus.length > 0, 'Must return domain status');
  assert.ok(digitalHealth.digitalFatigueScore >= 1, 'Must return digital fatigue score');

  // Test Phase 7: Multi-touch Outreach Sequence
  const sequence = await generateOutreachSequence(leads[0]);
  assert.ok(sequence.touch1_DirectMail.subject.length > 0, 'Touch 1 direct mail must exist');
  assert.ok(sequence.touch2_ColdEmail.subject.length > 0, 'Touch 2 cold email must exist');
  assert.ok(sequence.touch3_PhoneScript.body.length > 0, 'Touch 3 phone script must exist');
});

test('E2E City Search: Miami, FL', async () => {
  const results = await searchBusinessesByCity('Miami, FL');
  assert.ok(results.length >= 5, 'City search for Miami must return at least 5 businesses');
  assert.ok(results[0].location.includes('Miami'), 'Results must be for Miami');
});
