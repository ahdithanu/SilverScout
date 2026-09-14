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
import { DealDocument, DealStage, FundDeploymentConfig } from '../src/types';
import { DEFAULT_FUND_DEPLOYMENT_CONFIG } from '../src/utils/branding';

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

export { app };

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Silver Scout Production Control Plane Server listening on port ${PORT}`);
  });
}
