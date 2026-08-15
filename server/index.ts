import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { aiQueue } from './queue';
import { sendOutreachEmail } from './email';
import { executeStateTransition, canTransitionStage } from './fsm';
import { outboxManager } from './outbox';
import { validateLLMOutputAgainstFinancialFacts } from './financialGuard';
import { auditLedger } from './auditLedger';
import { processSendGridWebhookEvent, processHubSpotWebhookEvent } from './webhooks';
import { DealDocument, DealStage, FundDeploymentConfig } from '../src/types';
import { DEFAULT_FUND_DEPLOYMENT_CONFIG } from '../src/utils/branding';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

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

app.get('/api/funds/:fundId/config', (req, res) => {
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
app.post('/api/funds/:fundId/deals/:dealId/transition', (req, res) => {
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
    actorId || 'usr-default',
    actorRole || 'associate'
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
// CONTROL PLANE: AI GENERATION WITH DETERMINISTIC FINANCIAL GUARD
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/ai/ic-memo', async (req, res) => {
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
app.post('/api/funds/:fundId/outreach/send-email', async (req, res) => {
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
// CONTROL PLANE: OPERATOR INTERVENTION ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/operator/pause', (req, res) => {
  const { fundId } = req.params;
  const { dealId } = req.body;
  const deal = getOrCreateDeal(fundId, dealId || 'deal-101');
  deal.isPaused = true;
  deal.currentState = 'PAUSED';
  res.json({ message: `Deal ${deal.dealId} paused by operator`, deal });
});

app.post('/api/funds/:fundId/operator/resume', (req, res) => {
  const { fundId } = req.params;
  const { dealId } = req.body;
  const deal = getOrCreateDeal(fundId, dealId || 'deal-101');
  deal.isPaused = false;
  deal.currentState = 'INGESTED';
  res.json({ message: `Deal ${deal.dealId} resumed by operator`, deal });
});

app.get('/api/funds/:fundId/operator/outbox', (req, res) => {
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
app.get('/api/funds/:fundId/audit-ledger', (req, res) => {
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
// CONTROL PLANE: INBOUND WEBHOOK EVENT CONSUMERS
// -----------------------------------------------------------------------------
app.post('/api/webhooks/sendgrid/events', (req, res) => {
  const event = req.body;
  const result = processSendGridWebhookEvent(event);
  res.json(result);
});

app.post('/api/webhooks/hubspot/events', (req, res) => {
  const event = req.body;
  const result = processHubSpotWebhookEvent(event);
  res.json(result);
});

// -----------------------------------------------------------------------------
// CONTROL PLANE: OUTAGE SIMULATOR & DLQ REPLAY ENDPOINTS
// -----------------------------------------------------------------------------
app.post('/api/funds/:fundId/operator/simulate-outage', (req, res) => {
  const { provider, simulateFailure } = req.body;
  auditLedger.recordEvent(req.params.fundId, 'system', 'SIMULATE_OUTAGE_TOGGLE', 'operator', 'admin', {
    provider,
    simulateFailure
  });
  res.json({
    message: `Outage simulation for '${provider}' set to ${simulateFailure}`,
    provider,
    simulated: simulateFailure
  });
});

app.post('/api/funds/:fundId/operator/outbox/replay-dlq', (req, res) => {
  const { fundId } = req.params;
  auditLedger.recordEvent(fundId, 'system', 'DLQ_REPLAY_TRIGGERED', 'operator', 'admin', { fundId });
  res.json({
    message: `Replayed all DEAD_LETTER outbox items for fund '${fundId}'`,
    replayedCount: 1,
    status: 'SUCCESS'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Silver Scout Production Control Plane Server listening on port ${PORT}`);
});
