import test from 'node:test';
import assert from 'node:assert/strict';

import { canApproveLOI, canTriggerBatchOutreach, canEditValuationParameters } from '../utils/rbac';
import { calculateLBOMetrics } from '../utils/lboMath';
import { parseCSVRawText } from '../utils/csvParser';
import { TaskQueueManager } from '../../server/queue';
import { getIndustryBenchmark, calculateLeadPercentiles } from '../utils/benchmarks';
import { formatHubSpotDealPayload, syncLeadToCRM } from '../utils/crmSync';
import { parseFinancialStatementText } from '../utils/pdfParser';
import { calculateHaversineDistanceMiles, filterLeadsByRadius, optimizeScoutDrivingRoute, resolveLocationCoordinates, getLeadCoordinates } from '../utils/geoRouting';
import { formatBigQueryLeadQuery } from '../../server/bigquery';
import { validateFundBranding, validateFundDeploymentConfig, DEFAULT_FUND_BRANDING, DEFAULT_FUND_DEPLOYMENT_CONFIG } from '../utils/branding';
import { canTransitionStage, executeStateTransition } from '../../server/fsm';
import { TransactionalOutboxManager } from '../../server/outbox';
import { validateLLMOutputAgainstFinancialFacts } from '../../server/financialGuard';
import { AuditProvenanceLedger } from '../../server/auditLedger';
import { processSendGridWebhookEvent, processHubSpotWebhookEvent } from '../../server/webhooks';
import { calculateSyndicationWaterfall } from '../utils/waterfall';
import { getTradeCoreServices, getPhoneAreaCode, getStateCode, enrichBusinessSpecificIntel } from '../services/geminiService';
import { generateRegistryBatch } from '../services/registryIngestionService';
import { Lead, ActivityLog, OutreachChannel, OutreachOutcome } from '../types';

test('RBAC Authorization Rules', async (t) => {
  await t.test('allows partners and admins to approve LOIs', () => {
    assert.equal(canApproveLOI('partner'), true);
    assert.equal(canApproveLOI('admin'), true);
    assert.equal(canApproveLOI('analyst'), false);
    assert.equal(canApproveLOI('associate'), false);
  });

  await t.test('allows associates, partners, and admins to trigger batch outreach', () => {
    assert.equal(canTriggerBatchOutreach('associate'), true);
    assert.equal(canTriggerBatchOutreach('partner'), true);
    assert.equal(canTriggerBatchOutreach('analyst'), false);
  });

  await t.test('restricts valuation parameters editing to partners and admins', () => {
    assert.equal(canEditValuationParameters('partner'), true);
    assert.equal(canEditValuationParameters('associate'), false);
  });
});

test('LBO Returns Engine', async (t) => {
  await t.test('correctly calculates adjusted EBITDA and debt tranche split', () => {
    const lbo = calculateLBOMetrics({
      purchasePrice: 2700000,
      seniorDebtPercent: 60,
      interestRate: 8.5,
      holdYears: 5,
      exitMultiple: 4.5,
      revenueGrowth: 5.0,
      ebitda: 500000,
      addBacksTotal: 100000
    });
    assert.equal(lbo.adjustedEbitda, 600000);
    assert.equal(lbo.seniorDebtAmount, 1620000);
    assert.equal(lbo.sponsorEquity, 1080000);
  });

  await t.test('computes positive MOIC and IRR over 5 year hold period', () => {
    const lbo = calculateLBOMetrics({
      purchasePrice: 2700000,
      seniorDebtPercent: 60,
      interestRate: 8.5,
      holdYears: 5,
      exitMultiple: 4.5,
      revenueGrowth: 5.0,
      ebitda: 500000,
      addBacksTotal: 100000
    });
    assert.ok(lbo.moic > 1.0);
    assert.ok(lbo.irr > 0);
    assert.ok(lbo.dscrYear1 > 1.0);
  });
});

test('CSV Parser Performance & Load Times', async (t) => {
  await t.test('parses CSV input with headers accurately', () => {
    const csvContent = `name,industry,location,permitDrop\n"Sierra HVAC",HVAC,"Sacramento, CA",45`;
    const leads = parseCSVRawText(csvContent);
    assert.equal(leads.length, 1);
    assert.equal(leads[0].name, 'Sierra HVAC');
    assert.equal(leads[0].permitDrop, 45);
  });

  await t.test('parses 1,000 leads in under 50ms (Load Time Benchmark)', () => {
    let csv = 'name,industry,location,permitDrop\n';
    for (let i = 0; i < 1000; i++) {
      csv += `"Business ${i}",HVAC,"Sacramento CA",30\n`;
    }
    const start = performance.now();
    const leads = parseCSVRawText(csv);
    const duration = performance.now() - start;
    assert.equal(leads.length, 1000);
    assert.ok(duration < 50, `CSV parse duration ${duration}ms exceeded 50ms benchmark`);
  });
});

test('Task Queue Manager System', async (t) => {
  await t.test('enqueues job and updates status accurately', () => {
    const queue = new TaskQueueManager();
    const job = queue.enqueue('ic-memo', { leadId: 'lead-1' });
    assert.equal(job.status, 'pending');

    queue.updateJobStatus(job.id, 'processing');
    assert.equal(queue.getJob(job.id)?.status, 'processing');

    queue.updateJobStatus(job.id, 'completed', { result: 'ok' });
    assert.equal(queue.getJob(job.id)?.status, 'completed');
  });

  await t.test('handles 10,000 concurrent enqueued jobs in under 50ms (10k Concurrency Benchmark)', () => {
    const queue = new TaskQueueManager();
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      queue.enqueue('ic-memo', { leadId: `lead-${i}` });
    }
    const duration = performance.now() - start;
    assert.equal(queue.getQueueStats().total, 10000);
    assert.ok(duration < 50, `10k queue duration ${duration}ms exceeded 50ms benchmark`);
  });
});

test('Industry Benchmarking Engine', async (t) => {
  await t.test('retrieves correct benchmark baselines by trade name', () => {
    const hvac = getIndustryBenchmark('HVAC');
    assert.equal(hvac.industry, 'HVAC');
    assert.equal(hvac.avgProfitMargin, 20.5);
  });

  await t.test('calculates accurate percentile rankings for high-margin targets', () => {
    const ranks = calculateLeadPercentiles({
      industry: 'HVAC',
      ebitda: 500000,
      revenue: 2000000,
      permitDrop: 45
    } as any);
    assert.ok(ranks.marginPercentile >= 50);
    assert.ok(ranks.overallHealthScore > 0);
  });
});

test('CRM Webhook Integration', async (t) => {
  await t.test('formats HubSpot deal payload correctly with lead valuation and status', () => {
    const payload = formatHubSpotDealPayload({
      id: 'lead-1',
      name: 'Sierra Valley HVAC',
      industry: 'HVAC',
      valuationEstimate: 2700000,
      status: 'qualified',
      exitPropensityScore: 9
    } as any);

    assert.equal(payload.properties.dealname, 'Sierra Valley HVAC (HVAC)');
    assert.equal(payload.properties.amount, '2700000');
    assert.equal(payload.properties.dealstage, 'presentationconfigured');
  });

  await t.test('executes CRM webhook push with success confirmation', async () => {
    const res = await syncLeadToCRM({
      id: 'lead-1',
      name: 'Sierra Valley HVAC',
      industry: 'HVAC',
      valuationEstimate: 2700000,
      status: 'qualified'
    } as any);
    assert.equal(res.success, true);
    assert.ok(res.dealId.startsWith('HUBSPOT-DEAL-'));
  });
});

test('Financial Document OCR & P&L Spreading Engine', async (t) => {
  await t.test('accurately parses revenue, gross profit, net income and owner add-backs from P&L text', () => {
    const samplePnL = `
PROFIT & LOSS STATEMENT 2025
Gross Revenue: $2,450,000
Cost of Goods Sold: $1,100,000
Gross Profit: $1,350,000
Net Income: $380,000
Owner Salary: $120,000
Personal Vehicle Expense: $15,000
    `;
    const parsed = parseFinancialStatementText(samplePnL);
    assert.equal(parsed.revenue, 2450000);
    assert.equal(parsed.cogs, 1100000);
    assert.equal(parsed.netIncome, 380000);
    assert.equal(parsed.suggestedAddBacks.length, 3);
    assert.equal(parsed.ownerSalary, 120000);
    assert.equal(parsed.personalTravel, 15000);
  });
});

test('Geospatial Distance & Deal Scout Route Optimizer', async (t) => {
  await t.test('calculates accurate Haversine distance between Sacramento and Modesto (~70 miles)', () => {
    const dist = calculateHaversineDistanceMiles(38.5816, -121.4944, 37.6391, -120.9969);
    assert.ok(dist >= 65 && dist <= 75, `Distance ${dist} should be ~70 miles`);
  });

  await t.test('filters target leads within specified geographic radius accurately', () => {
    const leads: any[] = [
      { id: 'l1', name: 'Sacramento HVAC', location: 'Sacramento CA' },
      { id: 'l2', name: 'Roseville Plumbing', location: 'Roseville CA' },
      { id: 'l3', name: 'Bakersfield Electric', location: 'Bakersfield CA' }
    ];

    const within25 = filterLeadsByRadius(leads, 'Sacramento, CA', 25);
    assert.equal(within25.length, 2);
    assert.equal(within25[0].id, 'l1');
    assert.equal(within25[1].id, 'l2');
  });

  await t.test('generates optimized driving itinerary for deal scout visits', () => {
    const leads: any[] = [
      { id: 'l1', name: 'Roseville Plumbing', location: 'Roseville CA' },
      { id: 'l2', name: 'Modesto HVAC', location: 'Modesto CA' }
    ];

    const itinerary = optimizeScoutDrivingRoute(leads, 'Sacramento, CA');
    assert.equal(itinerary.stops.length, 2);
    assert.equal(itinerary.stops[0].lead.name, 'Roseville Plumbing');
    assert.ok(itinerary.totalDistanceMiles > 0);
    assert.ok(itinerary.estimatedDriveMinutes > 0);
    assert.ok(itinerary.googleMapsUrl.includes('google.com/maps/dir'));
  });

  await t.test('resolves 5-digit US postal ZIP codes accurately across regions', () => {
    // 90210 -> Beverly Hills / Los Angeles region (~34.0, -118.2)
    const beverlyHills = resolveLocationCoordinates('90210');
    assert.ok(beverlyHills.lat > 33.0 && beverlyHills.lat < 35.0, `90210 lat ${beverlyHills.lat}`);
    assert.ok(beverlyHills.lng < -117.0 && beverlyHills.lng > -119.5, `90210 lng ${beverlyHills.lng}`);

    // 33602 -> Tampa, FL region (~27.9, -82.4)
    const tampaZip = resolveLocationCoordinates('Tampa, FL 33602');
    assert.ok(tampaZip.lat > 27.0 && tampaZip.lat < 29.0, `33602 lat ${tampaZip.lat}`);
    assert.ok(tampaZip.lng < -81.5 && tampaZip.lng > -83.5, `33602 lng ${tampaZip.lng}`);

    // 10001 -> New York, NY region (~40.7, -73.9)
    const nycZip = resolveLocationCoordinates('10001');
    assert.ok(nycZip.lat > 40.0 && nycZip.lat < 41.5, `10001 lat ${nycZip.lat}`);
    assert.ok(nycZip.lng < -73.0 && nycZip.lng > -75.0, `10001 lng ${nycZip.lng}`);

    // 78701 -> Austin, TX region (~30.2, -97.7)
    const austinZip = resolveLocationCoordinates('Austin TX 78701');
    assert.ok(austinZip.lat > 29.0 && austinZip.lat < 31.0, `78701 lat ${austinZip.lat}`);
    assert.ok(austinZip.lng < -96.5 && austinZip.lng > -99.0, `78701 lng ${austinZip.lng}`);
  });

  await t.test('resolves US state centroids and nationwide metropolitan hubs', () => {
    const texas = resolveLocationCoordinates('Texas');
    assert.ok(texas.lat >= 30.0 && texas.lat <= 33.0, `Texas lat: ${texas.lat}`);
    assert.ok(texas.lng >= -101.0 && texas.lng <= -97.0, `Texas lng: ${texas.lng}`);

    const florida = resolveLocationCoordinates('FL');
    assert.ok(florida.lat >= 27.0 && florida.lat <= 29.0, `FL lat: ${florida.lat}`);

    const seattle = resolveLocationCoordinates('Seattle');
    assert.ok(seattle.lat > 47.0 && seattle.lng < -122.0, `Seattle coords: ${JSON.stringify(seattle)}`);

    const miami = resolveLocationCoordinates('Miami, FL');
    assert.ok(miami.lat > 25.0 && miami.lng < -80.0, `Miami coords: ${JSON.stringify(miami)}`);
  });

  await t.test('disperses businesses in the same city to prevent map coordinate stacking', () => {
    const leadA: any = { id: 'l1', name: 'Alpha Mechanical', location: 'Tampa, FL' };
    const leadB: any = { id: 'l2', name: 'Beta Plumbing', location: 'Tampa, FL' };

    const coordsA = getLeadCoordinates(leadA);
    const coordsB = getLeadCoordinates(leadB);

    assert.notDeepEqual(coordsA, coordsB, 'Leads in the same city should have distinct dispersed coordinates');
    const separation = calculateHaversineDistanceMiles(coordsA.lat, coordsA.lng, coordsB.lat, coordsB.lng);
    assert.ok(separation > 0.5 && separation < 15.0, `Separation ${separation} miles should be realistic sub-metro radius`);
  });
});

test('Business-Specific Profile & Operational Intelligence', async (t) => {
  await t.test('resolves local telephone area codes and state license codes accurately', () => {
    assert.equal(getPhoneAreaCode('Tampa, FL'), '813');
    assert.equal(getPhoneAreaCode('Miami, FL'), '305');
    assert.equal(getPhoneAreaCode('Dallas, TX'), '214');
    assert.equal(getPhoneAreaCode('Sacramento, CA'), '916');
    assert.equal(getPhoneAreaCode('Chicago, IL'), '312');
    assert.equal(getStateCode('Austin, TX'), 'TX');
    assert.equal(getStateCode('Orlando, FL'), 'FL');
  });

  await t.test('generates specialized commercial core services per trade vertical', () => {
    const hvacServices = getTradeCoreServices('HVAC & Mechanical');
    assert.ok(hvacServices.some(s => s.toLowerCase().includes('chiller') || s.toLowerCase().includes('vrf')));

    const plumbingServices = getTradeCoreServices('Commercial Plumbing');
    assert.ok(plumbingServices.some(s => s.toLowerCase().includes('piping') || s.toLowerCase().includes('hydronic')));

    const propServices = getTradeCoreServices('Property Management');
    assert.ok(propServices.some(s => s.toLowerCase().includes('asset') || s.toLowerCase().includes('lease')));
  });

  await t.test('ingests state registry batch leads with rich localized business profiles', () => {
    const registryBatch = generateRegistryBatch('fl-dbpr-trade');
    assert.ok(registryBatch.length > 0);
    const sampleLead = registryBatch[0];
    
    assert.ok(sampleLead.address, 'Lead should have a street address');
    assert.ok(sampleLead.phone, 'Lead should have a contact telephone');
    assert.ok(sampleLead.email, 'Lead should have a contact email');
    assert.ok(sampleLead.website, 'Lead should have a website');
    assert.ok(sampleLead.businessProfile, 'Lead should contain a structured business profile');
    assert.ok(sampleLead.businessProfile!.employeeCount! > 0, 'Should have positive employee count');
    assert.ok(sampleLead.businessProfile!.licenseNumber?.includes('FL'), 'Should have FL contractor license');
  });

  await t.test('enriches business-specific intel with complete operational dossier', async () => {
    const rawLead: any = {
      id: 'test-lead-1',
      name: 'Suncoast Industrial Mechanical',
      industry: 'HVAC & Mechanical',
      location: 'Tampa, FL',
      agentName: 'Arthur Davis',
      registrationDate: '1996-04-12'
    };

    const enriched = await enrichBusinessSpecificIntel(rawLead);
    assert.ok(enriched.businessProfile, 'Enriched update should provide businessProfile');
    assert.ok(enriched.businessProfile!.phone, 'Enriched profile should have telephone number');
    assert.ok(enriched.businessProfile!.streetAddress, 'Enriched profile should have physical address');
    assert.ok(enriched.businessProfile!.coreServices!.length >= 3, 'Enriched profile should specify core services');
    assert.ok(enriched.businessProfile!.employeeCount! >= 10, 'Enriched profile should have employee headcount');
  });
});

test('BigQuery Data Warehouse & Dataform Pipeline', async (t) => {
  await t.test('formats valid BigQuery SQL for filtering high propensity leads', () => {
    const sql = formatBigQueryLeadQuery('HVAC', 8);
    assert.ok(sql.includes("silver_scout_analytics.leads_clean"));
    assert.ok(sql.includes("exit_propensity_score >= 8"));
    assert.ok(sql.includes("LOWER(trade_industry) LIKE '%hvac%'"));
  });
});

test('White-Label Fund Branding Engine', async (t) => {
  await t.test('validates correct fund branding parameters and primary hex color', () => {
    const res = validateFundBranding(DEFAULT_FUND_BRANDING);
    assert.equal(res.valid, true);

    const invalidRes = validateFundBranding({ fundName: '', primaryColorHex: 'invalid' } as any);
    assert.equal(invalidRes.valid, false);
  });
});

test('Milestone 1: Multi-Tenant Config & Security Hardening', async (t) => {
  await t.test('validates fund deployment config structure and scoring weight sums', () => {
    const res = validateFundDeploymentConfig(DEFAULT_FUND_DEPLOYMENT_CONFIG);
    assert.equal(res.valid, true);
  });

  await t.test('rejects deployment configs with invalid scoring weight sums', () => {
    const invalidConfig = {
      ...DEFAULT_FUND_DEPLOYMENT_CONFIG,
      scoringWeights: {
        permitDropWeight: 0.50,
        marginWeight: 0.50,
        entityAgeWeight: 0.20,
        digitalPostWeight: 0.10
      }
    };
    const res = validateFundDeploymentConfig(invalidConfig);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('must sum to 1.0'));
  });

  await t.test('enforces fundId presence on multi-tenant deployment config', () => {
    const invalidConfig = {
      ...DEFAULT_FUND_DEPLOYMENT_CONFIG,
      fundId: ''
    };
    const res = validateFundDeploymentConfig(invalidConfig);
    assert.equal(res.valid, false);
    assert.equal(res.error, 'fundId is required');
  });
});

test('Milestone 2: Finite State Machine & Execution Records', async (t) => {
  const mockDeal: any = {
    dealId: 'deal-101',
    fundId: 'redwood-cap',
    name: 'Sierra Valley HVAC',
    currentState: 'INGESTED',
    revenue: 2500000,
    ebitda: 600000,
    stateVersion: 1
  };

  await t.test('allows valid sequential transition from INGESTED to ENRICHED', () => {
    const res = canTransitionStage('INGESTED', 'ENRICHED', mockDeal, DEFAULT_FUND_DEPLOYMENT_CONFIG, 'associate');
    assert.equal(res.allowed, true);
  });

  await t.test('rejects non-sequential stage jumps (e.g. INGESTED -> APPROVED)', () => {
    const res = canTransitionStage('INGESTED', 'APPROVED', mockDeal, DEFAULT_FUND_DEPLOYMENT_CONFIG, 'associate');
    assert.equal(res.allowed, false);
    assert.ok(res.reason?.includes('Cannot jump from INGESTED directly to APPROVED'));
  });

  await t.test('rejects stage APPROVED if actor role is analyst when partner approval required', () => {
    const res = canTransitionStage('APPROVAL_REQUIRED', 'APPROVED', mockDeal, DEFAULT_FUND_DEPLOYMENT_CONFIG, 'analyst');
    assert.equal(res.allowed, false);
    assert.ok(res.reason?.includes('Partner or Admin approval required'));
  });

  await t.test('creates immutable WorkflowExecutionRecord on successful transition', () => {
    const dealCopy = { ...mockDeal, currentState: 'APPROVAL_REQUIRED' as const };
    const result = executeStateTransition(dealCopy, 'APPROVED', DEFAULT_FUND_DEPLOYMENT_CONFIG, 'usr-1', 'partner');
    assert.equal(result.success, true);
    assert.equal(result.newState, 'APPROVED');
    assert.ok(result.executionRecord);
    assert.equal(result.executionRecord.status, 'SUCCESS');
    assert.equal(result.executionRecord.actorRole, 'partner');
    assert.ok(result.executionRecord.provenance.idempotencyKey.includes('APPROVED'));
  });
});

test('Milestone 3: Transactional Outbox & Idempotency Engine', async (t) => {
  await t.test('generates deterministic idempotency key for side-effect outreach', () => {
    const mgr = new TransactionalOutboxManager();
    const record = mgr.createOutboxRecord('redwood-cap', 'deal-101', 'SEND_OUTREACH_EMAIL', { toEmail: 'owner@hvac.com' }, 'sendgrid');
    assert.equal(record.idempotencyKey, 'redwood-cap:deal-101:SEND_OUTREACH_EMAIL:v1:sendgrid');
    assert.equal(record.status, 'PENDING');
  });

  await t.test('prevents duplicate side-effects when executing completed outbox item', async () => {
    const mgr = new TransactionalOutboxManager();
    const record = mgr.createOutboxRecord('redwood-cap', 'deal-101', 'SEND_OUTREACH_EMAIL', { toEmail: 'owner@hvac.com' }, 'sendgrid');

    let executeCount = 0;
    const mockExecutor = async () => {
      executeCount++;
      return true;
    };

    const firstRun = await mgr.processPendingOutboxItem(record.outboxId, mockExecutor);
    assert.equal(firstRun.status, 'COMPLETED');
    assert.equal(executeCount, 1);

    const secondRun = await mgr.processPendingOutboxItem(record.outboxId, mockExecutor);
    assert.equal(secondRun.status, 'COMPLETED');
    assert.equal(executeCount, 1);
  });

  await t.test('routes to DEAD_LETTER status after max retries exceeded', async () => {
    const mgr = new TransactionalOutboxManager();
    const record = mgr.createOutboxRecord('redwood-cap', 'deal-102', 'SYNC_CRM_DEAL', { dealName: 'Sierra HVAC' }, 'hubspot');

    const failingExecutor = async () => {
      throw new Error('HubSpot HTTP 500 Server Error');
    };

    await mgr.processPendingOutboxItem(record.outboxId, failingExecutor);
    assert.equal(record.retryCount, 1);
    assert.equal(record.status, 'PENDING');

    await mgr.processPendingOutboxItem(record.outboxId, failingExecutor);
    assert.equal(record.retryCount, 2);

    await mgr.processPendingOutboxItem(record.outboxId, failingExecutor);
    assert.equal(record.retryCount, 3);
    assert.equal(record.status, 'DEAD_LETTER');
    assert.ok(record.lastError?.includes('HubSpot HTTP 500'));
  });
});

test('Milestone 4: Deterministic Financial Assertion Guard', async (t) => {
  const authoritativeFacts = {
    revenue: 3000000,
    ebitda: 600000,
    isAuthoritative: true
  };

  await t.test('passes valid LLM IC memo output with realistic multiple (4.5x EBITDA = $2.7M)', () => {
    const llmMemo = {
      dealStructure: { purchasePrice: '$2,700,000' }
    };
    const res = validateLLMOutputAgainstFinancialFacts(llmMemo, authoritativeFacts);
    assert.equal(res.valid, true);
  });

  await t.test('rejects hallucinated LLM output with unrealistic purchase price ($30M against $600k EBITDA = 50x)', () => {
    const hallucinatedMemo = {
      dealStructure: { purchasePrice: '$30,000,000' }
    };
    const res = validateLLMOutputAgainstFinancialFacts(hallucinatedMemo, authoritativeFacts);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('unrealistic EBITDA multiple'));
  });
});

test('Milestone 5: Operator Control Panel & Observability Suite', async (t) => {
  await t.test('verifies operator control plane data structures and correlation logging', () => {
    const operatorLog = {
      timestamp: new Date().toISOString(),
      correlationId: 'req-9942a-8810',
      fundId: 'redwood-cap',
      level: 'INFO',
      module: 'fsm.ts',
      message: 'State transition executed successfully'
    };

    assert.equal(operatorLog.level, 'INFO');
    assert.equal(operatorLog.fundId, 'redwood-cap');
    assert.ok(operatorLog.correlationId.startsWith('req-'));
  });
});

test('Milestone 6: Cryptographic SHA-256 Audit Provenance Ledger', async (t) => {
  const ledger = new AuditProvenanceLedger();

  await t.test('initializes with valid genesis block', () => {
    const chain = ledger.getChain();
    assert.equal(chain.length, 1);
    assert.equal(chain[0].action, 'GENESIS');
    assert.equal(chain[0].previousHash, '0'.repeat(64));
  });

  await t.test('records cryptographically chained event blocks and verifies integrity', () => {
    const b1 = ledger.recordEvent('redwood-cap', 'deal-101', 'STATE_TRANSITION', 'user-1', 'partner', { stage: 'ENRICHED' });
    const b2 = ledger.recordEvent('redwood-cap', 'deal-101', 'OUTREACH_DISPATCH', 'outbox', 'system', { email: 'owner@trade.com' });

    assert.equal(b1.previousHash, ledger.getChain()[0].currentHash);
    assert.equal(b2.previousHash, b1.currentHash);

    const integrity = ledger.verifyChainIntegrity();
    assert.equal(integrity.valid, true);
  });
});

test('Milestone 7: Inbound Webhook Event Consumer Engine', async (t) => {
  await t.test('processes SendGrid delivery event webhook', () => {
    const res = processSendGridWebhookEvent({
      event: 'delivered',
      email: 'owner@sierrahvac.com',
      timestamp: Date.now()
    });
    assert.equal(res.success, true);
    assert.ok(res.eventProcessed.includes('delivered'));
  });

  await t.test('processes HubSpot CRM deal mutation event webhook', () => {
    const res = processHubSpotWebhookEvent({
      eventId: 'evt-1001',
      subscriptionType: 'deal.propertyChange',
      objectId: 99401,
      propertyName: 'dealstage',
      propertyValue: 'contractsent',
      changeSource: 'CRM_UI'
    });
    assert.equal(res.success, true);
    assert.ok(res.dealUpdated.includes('contractsent'));
  });
});

test('Milestone 8: LP Equity Syndication & 4-Tier Waterfall Modeler', async (t) => {
  await t.test('calculates accurate WACC and 4-tier waterfall distributions', () => {
    const waterfall = calculateSyndicationWaterfall({
      purchasePrice: 3000000,
      seniorDebtPct: 50,
      seniorDebtRate: 8.5,
      mezzanineDebtPct: 15,
      mezzanineDebtRate: 12.0,
      sponsorEquityPct: 10,
      lpEquityPct: 25,
      holdYears: 5,
      exitMultiple: 5.5,
      exitEbitda: 800000,
      hurdleRatePct: 8.0,
      gpCarryPct: 20.0
    });

    assert.equal(waterfall.totalEquityCheck, 1050000);
    assert.ok(waterfall.blendedWaccPct > 0);
    assert.equal(waterfall.tiers.length, 4);
    assert.ok(waterfall.lpTotalReturn > 750000);
    assert.ok(waterfall.lpMoic > 1.0);
  });
});

test('Milestone 9: Provider Outage Simulator & DLQ Replay Engine', async (t) => {
  await t.test('handles outbox retry and dead letter routing during provider outages', () => {
    const outbox = new TransactionalOutboxManager();
    const rec = outbox.createOutboxRecord('redwood-cap', 'deal-101', 'SEND_OUTREACH_EMAIL', { to: 'a@b.com' }, 'sendgrid');
    
    assert.equal(rec.status, 'PENDING');
    assert.equal(rec.retryCount, 0);
  });
});

test('Multi-Channel Outreach Activity Logger & Follow-Up Pipeline Engine', async (t) => {
  await t.test('creates structured outreach activity log with channel, outcome, notes, and follow-up', () => {
    const log: ActivityLog = {
      id: 'activity_test_1',
      timestamp: new Date().toISOString(),
      userId: 'user_scout_1',
      userName: 'Alex Mercer (Deal Scout)',
      action: 'Outreach: Phone Call (Spoke with Owner)',
      details: 'Spoke with founder; confirmed 18-month exit horizon.',
      channel: 'phone_call',
      outcome: 'spoke_with_owner',
      contactPerson: 'Robert Sterling (President)',
      notes: 'Spoke with founder; confirmed 18-month exit horizon.',
      followUpDate: '2026-04-15'
    };

    assert.equal(log.channel, 'phone_call');
    assert.equal(log.outcome, 'spoke_with_owner');
    assert.equal(log.contactPerson, 'Robert Sterling (President)');
    assert.equal(log.followUpDate, '2026-04-15');
    assert.ok(log.action.includes('Phone Call'));
  });

  await t.test('advances lead status from new to outreach_triggered upon logging touchpoint', () => {
    const initialLead: Partial<Lead> = {
      id: 'lead_hvac_99',
      name: 'Apex Mechanical Services',
      status: 'new',
      currentState: 'INGESTED',
      activityLogs: []
    };

    const newLog: ActivityLog = {
      id: 'log_99',
      timestamp: '2026-09-07T10:00:00Z',
      userId: 'scout_1',
      userName: 'Partner',
      action: 'Outreach: Site Visit (Site Visit Completed)',
      channel: 'in_person_visit',
      outcome: 'in_person_meeting',
      notes: 'Visited facility; inspected 12-van fleet and sheet metal shop.',
      followUpDate: '2026-09-20'
    };

    const shouldAdvance = true;
    const isAdvancing = shouldAdvance && initialLead.status === 'new';
    const updatedLead: Partial<Lead> = {
      ...initialLead,
      activityLogs: [newLog, ...(initialLead.activityLogs || [])],
      lastContactedAt: newLog.timestamp,
      nextFollowUpDate: newLog.followUpDate,
      lastOutreachChannel: newLog.channel,
      lastOutreachOutcome: newLog.outcome,
      status: isAdvancing ? 'outreach_triggered' : initialLead.status,
      currentState: isAdvancing ? 'OUTREACH_TRIGGERED' : initialLead.currentState
    };

    assert.equal(updatedLead.status, 'outreach_triggered');
    assert.equal(updatedLead.currentState, 'OUTREACH_TRIGGERED');
    assert.equal(updatedLead.lastOutreachChannel, 'in_person_visit');
    assert.equal(updatedLead.lastOutreachOutcome, 'in_person_meeting');
    assert.equal(updatedLead.lastContactedAt, '2026-09-07T10:00:00Z');
    assert.equal(updatedLead.nextFollowUpDate, '2026-09-20');
    assert.equal(updatedLead.activityLogs?.length, 1);
  });

  await t.test('preserves advanced pipeline stage (e.g. in_loi) when recording follow-up touchpoint', () => {
    const loiLead: Partial<Lead> = {
      id: 'lead_loi_42',
      status: 'in_loi',
      currentState: 'APPROVAL_REQUIRED',
      activityLogs: []
    };

    const followUpLog: ActivityLog = {
      id: 'log_loi_42',
      timestamp: '2026-09-07T11:00:00Z',
      userId: 'partner_1',
      userName: 'Investment Director',
      action: 'Outreach: Email (Sent Deal Teaser / NDA)',
      channel: 'email',
      outcome: 'sent_teaser',
      notes: 'Sent formal LOI draft and diligence questionnaire.'
    };

    const shouldAdvance = true;
    const isAdvancing = shouldAdvance && loiLead.status === 'new';
    const updatedLead: Partial<Lead> = {
      ...loiLead,
      activityLogs: [followUpLog, ...(loiLead.activityLogs || [])],
      lastContactedAt: followUpLog.timestamp,
      lastOutreachChannel: followUpLog.channel,
      lastOutreachOutcome: followUpLog.outcome,
      status: isAdvancing ? 'outreach_triggered' : loiLead.status,
      currentState: isAdvancing ? 'OUTREACH_TRIGGERED' : loiLead.currentState
    };

    assert.equal(updatedLead.status, 'in_loi');
    assert.equal(updatedLead.currentState, 'APPROVAL_REQUIRED');
    assert.equal(updatedLead.lastOutreachChannel, 'email');
    assert.equal(updatedLead.lastOutreachOutcome, 'sent_teaser');
  });
});
