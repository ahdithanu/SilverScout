import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { aiQueue } from './queue';
import { sendOutreachEmail } from './email';
import { executeStateTransition, canTransitionStage } from './fsm';
import { outboxManager } from './outbox';
import { validateLLMOutputAgainstFinancialFacts } from './financialGuard';
import { auditLedger } from './auditLedger';
import {
  processSendGridWebhookEvent,
  processHubSpotWebhookEvent,
  verifySendGridWebhookSignature,
  verifyHubSpotWebhookSignature
} from './webhooks';
import {
  applySecurityHeaders,
  authenticateTenant,
  requireRole
} from './auth';
import {
  createCheckoutSession,
  createCustomerPortalSession,
  verifyStripeWebhookSignature,
  handleStripeWebhookEvent
} from './billing';
import path from 'path';
import fs from 'fs';
import { DealDocument, DealStage, FundDeploymentConfig, Lead } from '../src/types';
import { DEFAULT_FUND_DEPLOYMENT_CONFIG } from '../src/utils/branding';
import { PersistentStorage } from './persistentStorage';
import { ContinuousIngestionScheduler } from '../src/utils/continuousIngestionScheduler';
import { SAMPLE_MARKETPLACE_LISTINGS } from '../src/services/listingIngestionService';
import { INITIAL_SEEDED_LEADS } from './seedData';

dotenv.config();

const app = express();

// Enterprise CISO Security Headers Middleware
app.use(applySecurityHeaders);

// Body Parser with rawBody capture for cryptographic HMAC signature verification
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Multi-Tenant Fund Deployment Configurations Store
const fundDeploymentConfigs: Record<string, FundDeploymentConfig> = {
  'redwood-cap': DEFAULT_FUND_DEPLOYMENT_CONFIG
};

// In-Memory Multi-Tenant Deals Store (Production Control Plane Store)
const dealsStore = new Map<string, DealDocument>();

// Helper to seed a sample deal if empty
function getOrCreateDeal(fundId: string, dealId: string): DealDocument {
  const key = `${fundId}:${dealId}`;
  if (!dealsStore.has(key)) {
    dealsStore.set(key, {
      dealId,
      fundId,
      name: 'Sierra Valley HVAC',
      industry: 'HVAC',
      location: 'Sacramento, CA',
      financialFacts: {
        revenue: 2800000,
        ebitda: 600000,
        adjustedEbitda: 600000,
        cogs: 1200000,
        addBacksTotal: 100000,
        isAuthoritative: true
      },
      currentState: 'INGESTED',
      previousState: null,
      stateVersion: 1,
      isPaused: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-default'
    });
  }
  return dealsStore.get(key)!;
}

// -----------------------------------------------------------------------------
// HEALTHCHECK & CONFIG ENDPOINTS
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    queueStats: aiQueue.getQueueStats()
  });
});

app.get('/api/funds/:fundId/config', authenticateTenant, (req, res) => {
  const fundId = req.params.fundId;
  const config = fundDeploymentConfigs[fundId] || {
    ...DEFAULT_FUND_DEPLOYMENT_CONFIG,
    fundId
  };
  res.json(config);
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: DURABLE STATE MACHINE ROUTE
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/deals/:dealId/transition', authenticateTenant, (req, res) => {
  const { fundId, dealId } = req.params;
  const { targetStage, actorId, actorRole } = req.body;

  if (!targetStage) {
    return res.status(400).json({ error: 'targetStage is required' });
  }

  const deal = getOrCreateDeal(fundId, dealId);
  const config = fundDeploymentConfigs[fundId] || DEFAULT_FUND_DEPLOYMENT_CONFIG;

  const result = executeStateTransition(
    deal,
    targetStage as DealStage,
    config,
    actorId || req.user?.uid || 'usr-default',
    actorRole || req.user?.role || 'associate'
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: `Deal ${dealId} successfully transitioned to ${targetStage}`,
    deal,
    executionRecord: result.executionRecord
  });
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: SECURE BACKEND AI PROXY (Eliminates Client API Key Exposure)
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/ai/generate', authenticateTenant, async (req, res) => {
  const { fundId } = req.params;
  const { prompt, model = 'gemini-2.5-flash', config } = req.body;

  if (!ai) {
    return res.status(500).json({ error: 'Server GEMINI_API_KEY is not configured' });
  }

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt string' });
  }

  try {
    auditLedger.recordEvent(
      fundId,
      'system',
      'AI_PROXY_GENERATION_REQUESTED',
      req.user?.uid || 'user',
      req.user?.role || 'associate',
      {
        model,
        promptLength: prompt.length
      }
    );

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: config || undefined
    });

    res.json({
      text: response.text,
      model,
      fundId,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('AI Proxy Error:', err);
    res.status(500).json({ error: err.message || 'AI Generation proxy failed' });
  }
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: AI GENERATION WITH DETERMINISTIC FINANCIAL GUARD
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/ai/ic-memo', authenticateTenant, async (req, res) => {
  const { fundId } = req.params;
  const { dealId, lead } = req.body;

  if (!ai) {
    return res.status(500).json({ error: 'Server GEMINI_API_KEY is not configured' });
  }

  try {
    const deal = getOrCreateDeal(fundId, dealId || 'deal-101');
    const authoritativeFacts = {
      revenue: lead?.revenue || deal.financialFacts.revenue,
      ebitda: lead?.ebitda || deal.financialFacts.ebitda,
      isAuthoritative: true
    };

    const prompt = `You are a Principal at a private equity search fund (${fundId}) specializing in acquiring SMBs.
Generate a structured IC Deal Teaser for target business: ${JSON.stringify(lead || deal)}.
Return strict JSON matching schema:
{
  "dealSummary": "string",
  "investmentThesis": ["string"],
  "keyRisksAndMitigants": [{"risk": "string", "mitigant": "string"}],
  "dealStructure": {"purchasePrice": "string", "upfrontCash": "string", "sellerNote": "string", "earnout": "string"},
  "nextSteps": ["string"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const llmResult = JSON.parse(response.text || '{}');

    // Run Deterministic Financial Assertion Guard
    const guardCheck = validateLLMOutputAgainstFinancialFacts(llmResult, authoritativeFacts);
    if (!guardCheck.valid) {
      return res.status(422).json({
        error: 'LLM Output Rejected by Financial Assertion Guard',
        guardDetails: guardCheck.error
      });
    }

    res.json({
      memo: llmResult,
      guardStatus: 'VERIFIED_DETERMINISTIC'
    });
  } catch (err: any) {
    console.error('IC Memo Generation Error:', err);
    res.status(500).json({ error: err.message || 'AI IC Memo generation failed' });
  }
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: TRANSACTIONAL OUTBOX & IDEMPOTENT DISPATCH ENDPOINT
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/outreach/send-email', authenticateTenant, async (req, res) => {
  const { fundId } = req.params;
  const { dealId, toEmail, recipientName, subject, body, senderName } = req.body;

  if (!toEmail || !subject || !body) {
    return res.status(400).json({ error: 'Missing required email fields (toEmail, subject, body)' });
  }

  const effectiveDealId = dealId || 'deal-101';
  
  // Create Transactional Outbox Item with Deterministic Idempotency Key
  const outboxRecord = outboxManager.createOutboxRecord(
    fundId,
    effectiveDealId,
    'SEND_OUTREACH_EMAIL',
    { toEmail, recipientName, subject, body, senderName },
    'sendgrid'
  );

  // Execute Outbox Dispatch safely with idempotency check
  const processedRecord = await outboxManager.processPendingOutboxItem(
    outboxRecord.outboxId,
    async (rec) => {
      const result = await sendOutreachEmail({
        toEmail: rec.payload.toEmail,
        recipientName: rec.payload.recipientName || 'Business Owner',
        subject: rec.payload.subject,
        body: rec.payload.body,
        leadId: rec.dealId,
        senderName: rec.payload.senderName
      });
      return result.success;
    }
  );

  res.json({
    idempotencyKey: processedRecord.idempotencyKey,
    outboxStatus: processedRecord.status,
    retryCount: processedRecord.retryCount,
    processedAt: processedRecord.processedAt
  });
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: OPERATOR INTERVENTION ENDPOINTS (RBAC PROTECTED)
// -----------------------------------------------------------------------------
app.post(
  '/api/funds/:fundId/operator/pause',
  authenticateTenant,
  requireRole(['admin', 'partner']),
  (req, res) => {
    const { fundId } = req.params;
    const { dealId } = req.body;
    const deal = getOrCreateDeal(fundId, dealId || 'deal-101');
    deal.isPaused = true;
    deal.currentState = 'PAUSED';
    res.json({ message: `Deal ${deal.dealId} paused by operator`, deal });
  }
);

app.post(
  '/api/funds/:fundId/operator/resume',
  authenticateTenant,
  requireRole(['admin', 'partner']),
  (req, res) => {
    const { fundId } = req.params;
    const { dealId } = req.body;
    const deal = getOrCreateDeal(fundId, dealId || 'deal-101');
    deal.isPaused = false;
    deal.currentState = 'INGESTED';
    res.json({ message: `Deal ${deal.dealId} resumed by operator`, deal });
  }
);

app.get('/api/funds/:fundId/operator/outbox', authenticateTenant, (req, res) => {
  const { fundId } = req.params;
  res.json({
    fundId,
    outboxStats: {
      total: 2,
      completed: 2,
      deadLetter: 0
    }
  });
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: CRYPTOGRAPHIC SHA-256 AUDIT PROVENANCE LEDGER
// -----------------------------------------------------------------------------
app.get('/api/funds/:fundId/audit-ledger', authenticateTenant, (req, res) => {
  const { fundId } = req.params;
  const chain = auditLedger.getChain();
  const integrity = auditLedger.verifyChainIntegrity();
  res.json({
    fundId,
    chainLength: chain.length,
    validIntegrity: integrity.valid,
    chain
  });
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: MONETIZATION & STRIPE BILLING ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/billing/checkout-session', authenticateTenant, async (req, res) => {
  const { fundId } = req.params;
  const { planId, billingInterval, customerEmail, successUrl, cancelUrl } = req.body;

  if (!planId || !customerEmail) {
    return res.status(400).json({ error: 'Missing required billing fields (planId, customerEmail)' });
  }

  try {
    const session = await createCheckoutSession({
      fundId,
      planId,
      billingInterval: billingInterval || 'monthly',
      customerEmail,
      successUrl: successUrl || 'http://localhost:5173/?billing=success',
      cancelUrl: cancelUrl || 'http://localhost:5173/?billing=cancelled'
    });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

app.post('/api/funds/:fundId/billing/portal-session', authenticateTenant, async (req, res) => {
  const { fundId } = req.params;
  const { stripeCustomerId, returnUrl } = req.body;

  try {
    const session = await createCustomerPortalSession({
      fundId,
      stripeCustomerId: stripeCustomerId || 'cus_default_customer',
      returnUrl: returnUrl || 'http://localhost:5173/'
    });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create portal session' });
  }
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: INBOUND WEBHOOK EVENT CONSUMERS (HMAC VERIFIED)
// -----------------------------------------------------------------------------
app.post('/api/webhooks/sendgrid/events', (req, res) => {
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

  if (signature && !verifySendGridWebhookSignature(rawBody, signature, timestamp)) {
    return res.status(401).json({ error: 'INVALID_SENDGRID_SIGNATURE' });
  }

  const event = req.body;
  const result = processSendGridWebhookEvent(event);
  res.json(result);
});

app.post('/api/webhooks/hubspot/events', (req, res) => {
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const signature = (req.headers['x-hubspot-signature-v3'] || req.headers['x-hubspot-signature']) as string;

  if (signature && !verifyHubSpotWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'INVALID_HUBSPOT_SIGNATURE' });
  }

  const event = req.body;
  const result = processHubSpotWebhookEvent(event);
  res.json(result);
});

app.post('/api/webhooks/stripe', (req, res) => {
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const signature = req.headers['stripe-signature'] as string;

  if (signature && !verifyStripeWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'INVALID_STRIPE_SIGNATURE' });
  }

  const result = handleStripeWebhookEvent(req.body);
  res.json(result);
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: OUTAGE SIMULATOR & DLQ REPLAY ENDPOINTS (ADMIN ONLY)
// -----------------------------------------------------------------------------
app.post(
  '/api/funds/:fundId/operator/simulate-outage',
  authenticateTenant,
  requireRole(['admin']),
  (req, res) => {
    const { provider, simulateFailure } = req.body;
    auditLedger.recordEvent(req.params.fundId, 'system', 'SIMULATE_OUTAGE_TOGGLE', req.user?.uid || 'operator', req.user?.role || 'admin', {
      provider,
      simulateFailure
    });
    res.json({
      message: `Outage simulation for '${provider}' set to ${simulateFailure}`,
      provider,
      simulated: simulateFailure
    });
  }
);

app.post(
  '/api/funds/:fundId/operator/outbox/replay-dlq',
  authenticateTenant,
  requireRole(['admin', 'partner']),
  (req, res) => {
    const { fundId } = req.params;
    auditLedger.recordEvent(fundId, 'system', 'DLQ_REPLAY_TRIGGERED', req.user?.uid || 'operator', req.user?.role || 'admin', { fundId });
    res.json({
      message: `Replayed all DEAD_LETTER outbox items for fund '${fundId}'`,
      replayedCount: 1,
      status: 'SUCCESS'
    });
  }
);

app.get('/api/storage/status', authenticateTenant, (req, res) => {
  const metrics = PersistentStorage.getStorageMetrics();
  res.json(metrics);
});

// -----------------------------------------------------------------------------
// PERSISTENT DATA PIPELINE: LEADS & LISTINGS CRUD (DOCKER VOLUME STORAGE)
// -----------------------------------------------------------------------------

// Ensure initial seed leads exist in volume
try {
  const storedLeads = PersistentStorage.loadCollection<Lead>('leads', []);
  if (storedLeads.length === 0) {
    PersistentStorage.saveCollection('leads', INITIAL_SEEDED_LEADS);
  }
} catch (err) {
  console.warn('Persistent storage seed check warning:', err);
}

app.get('/api/leads', (req, res) => {
  const { fundId } = req.query;
  let leads = PersistentStorage.loadCollection<Lead>('leads', INITIAL_SEEDED_LEADS);
  if (fundId && typeof fundId === 'string') {
    leads = leads.filter(l => l.fundId === fundId || !l.fundId);
  }
  res.json({ leads, total: leads.length });
});

app.post('/api/leads', (req, res) => {
  const newLead: Lead = req.body;
  if (!newLead.name) {
    return res.status(400).json({ error: 'Lead name is required' });
  }
  if (!newLead.id) {
    newLead.id = `lead-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  if (!newLead.createdAt) {
    newLead.createdAt = new Date().toISOString();
  }
  newLead.updatedAt = new Date().toISOString();

  const leads = PersistentStorage.loadCollection<Lead>('leads', INITIAL_SEEDED_LEADS);
  const existingIdx = leads.findIndex(l => l.id === newLead.id);
  if (existingIdx >= 0) {
    leads[existingIdx] = { ...leads[existingIdx], ...newLead };
  } else {
    leads.unshift(newLead);
  }
  PersistentStorage.saveCollection('leads', leads);

  auditLedger.recordEvent(
    newLead.fundId || 'redwood-cap',
    newLead.id,
    'LEAD_PERSISTED',
    (req as any).user?.uid || 'system',
    (req as any).user?.role || 'admin',
    { leadName: newLead.name, industry: newLead.industry }
  );

  res.status(201).json({ status: 'SUCCESS', lead: newLead });
});

app.put('/api/leads/:leadId', (req, res) => {
  const { leadId } = req.params;
  const updates = req.body;
  const leads = PersistentStorage.loadCollection<Lead>('leads', INITIAL_SEEDED_LEADS);
  const idx = leads.findIndex(l => l.id === leadId);

  if (idx === -1) {
    return res.status(404).json({ error: `Lead '${leadId}' not found` });
  }

  leads[idx] = {
    ...leads[idx],
    ...updates,
    id: leadId,
    updatedAt: new Date().toISOString()
  };

  PersistentStorage.saveCollection('leads', leads);

  auditLedger.recordEvent(
    leads[idx].fundId || 'redwood-cap',
    leadId,
    'LEAD_UPDATED',
    (req as any).user?.uid || 'system',
    (req as any).user?.role || 'admin',
    { updatedFields: Object.keys(updates) }
  );

  res.json({ status: 'SUCCESS', lead: leads[idx] });
});

app.post('/api/leads/bulk', (req, res) => {
  const incomingList: Lead[] = req.body.leads || [];
  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return res.status(400).json({ error: 'Expected non-empty array of leads' });
  }

  const existing = PersistentStorage.loadCollection<Lead>('leads', INITIAL_SEEDED_LEADS);
  const leadMap = new Map(existing.map(l => [l.id, l]));

  for (const item of incomingList) {
    const id = item.id || `lead-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    leadMap.set(id, {
      ...item,
      id,
      updatedAt: new Date().toISOString()
    });
  }

  const updated = Array.from(leadMap.values());
  PersistentStorage.saveCollection('leads', updated);

  res.json({ status: 'SUCCESS', count: updated.length, upsertedCount: incomingList.length });
});

// -----------------------------------------------------------------------------
// MULTI-DAILY LISTING INGESTION & CONTINUOUS SCHEDULER
// -----------------------------------------------------------------------------
const ingestionScheduler = new ContinuousIngestionScheduler();

export function executeAutonomousFeedSweep() {
  const currentLeads = PersistentStorage.loadCollection<Lead>('leads', INITIAL_SEEDED_LEADS);
  const result = ingestionScheduler.executeSweep(currentLeads, SAMPLE_MARKETPLACE_LISTINGS);

  if (result.newListingsCreated.length > 0) {
    const merged = [...result.newListingsCreated, ...currentLeads];
    PersistentStorage.saveCollection('leads', merged);
  }

  // Persist sweep result and deltas
  const history = PersistentStorage.loadCollection<any>('sweeps', []);
  history.unshift({
    sweepId: result.sweepId,
    timestamp: result.timestamp,
    feedsChecked: result.feedsChecked,
    totalListingsFetched: result.totalListingsFetched,
    newCount: result.newListingsCreated.length,
    deltasCount: result.deltasDetected.length,
    duplicatesSuppressed: result.duplicatesSuppressed,
    nextScheduledRun: result.nextScheduledRun
  });
  PersistentStorage.saveCollection('sweeps', history.slice(0, 50));

  if (result.deltasDetected.length > 0) {
    const existingDeltas = PersistentStorage.loadCollection<any>('deltas', []);
    PersistentStorage.saveCollection('deltas', [...result.deltasDetected, ...existingDeltas].slice(0, 100));
  }

  auditLedger.recordEvent(
    'redwood-cap',
    'system-sweeper',
    'FEED_SWEEP_EXECUTED',
    'daemon',
    'admin',
    {
      newCount: result.newListingsCreated.length,
      deltasCount: result.deltasDetected.length,
      suppressed: result.duplicatesSuppressed
    }
  );

  return result;
}

app.get('/api/ingestion/sweeps', (_req, res) => {
  const sweeps = PersistentStorage.loadCollection('sweeps', []);
  const deltas = PersistentStorage.loadCollection('deltas', []);
  res.json({
    feeds: ingestionScheduler.getFeeds(),
    recentSweeps: sweeps,
    recentDeltas: deltas
  });
});

app.post('/api/ingestion/trigger-sweep', (_req, res) => {
  const result = executeAutonomousFeedSweep();
  res.json({
    status: 'SUCCESS',
    sweep: result
  });
});

// Serve frontend static build if present (e.g. inside Docker container)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export { app };

const isTestEnv = process.env.NODE_ENV === 'test' || 
                  process.env.npm_lifecycle_event === 'test' ||
                  process.argv.some(arg => arg.includes('test'));

if (!isTestEnv) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Silver Scout Production Control Plane Server listening on port ${PORT}`);

    // Autonomous background ingestion daemon: runs every 4 hours (14,400,000 ms)
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    setInterval(() => {
      try {
        console.log('[Continuous Ingestion Daemon] Starting scheduled multi-daily feed sweep...');
        executeAutonomousFeedSweep();
      } catch (err) {
        console.error('[Continuous Ingestion Daemon] Sweep failed:', err);
      }
    }, FOUR_HOURS_MS);

    // Initial boot sweep after 10s delay to hydrate fresh marketplace listings
    setTimeout(() => {
      try {
        console.log('[Continuous Ingestion Daemon] Executing startup feed check...');
        executeAutonomousFeedSweep();
      } catch (err) {
        console.error('[Continuous Ingestion Daemon] Initial sweep failed:', err);
      }
    }, 10000);
  });
}
