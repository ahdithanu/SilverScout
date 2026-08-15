# ⚡ SILVER SCOUT | Enterprise Multi-Tenant Deal Control Plane

**Silver Scout** is an autonomous, production-grade deal-sourcing, underwriting, and operator control plane designed for private equity search funds acquiring lower middle market trade SMBs (HVAC, Plumbing, Electrical, Manufacturing, Roofing, Solar, and Landscaping).

---

## 🌟 Control Plane & Enterprise Capabilities

### 1. ⚙️ Multi-Tenant Deployment Configuration (`FundDeploymentConfig`)
- Per-tenant deployment configuration (`funds/{fundId}/config/deployment`) governing financial screening thresholds, LBO leverage rules, scoring weights, and LOI approval policies.

### 2. 🛡️ Durable Finite State Machine & Execution Audit Trail (`server/fsm.ts`)
- Explicit state machine enforcing prerequisite guards across pipeline stages (`INGESTED` -> `ENRICHED` -> `SCORED` -> `UNDERWRITTEN` -> `IC_GENERATED` -> `APPROVAL_REQUIRED` -> `APPROVED` -> `OUTREACH_TRIGGERED` -> `CRM_SYNCED`).

### 3. 🔒 Cryptographic SHA-256 Audit Provenance Ledger (`server/auditLedger.ts`)
- SHA-256 hash-chained immutable event ledger (`previousHash` -> `currentHash`) for SOC2 Type II and SEC compliance verification.

### 4. 📬 Transactional Outbox & Inbound Webhooks (`server/outbox.ts` & `server/webhooks.ts`)
- Transactional outbox with deterministic idempotency keys (`fundId:dealId:OUTREACH:v1:sendgrid`).
- Bi-directional inbound webhook listeners for SendGrid email delivery events and HubSpot CRM mutations.

### 5. 📊 LP Equity Syndication & Blended WACC Modeler (`src/utils/waterfall.ts`)
- 4-Tier Distribution Waterfall (Return of Capital, Preferred Return, Sponsor Catch-up, Residual Carry) with Mezzanine PIK debt tranche modeling.

### 6. 🎛️ Operator Control Panel & Provider Outage Simulator (`OperatorControlPanel.tsx`)
- Operator dashboard featuring simulated provider outage toggles, DLQ 1-click replay, SHA-256 ledger inspector, and correlation logging (`x-correlation-id`).

---

## 🚀 Automated Test Suite (57/57 Passed)

Run native TypeScript test runner:
```bash
./node_modules/.bin/tsx --test --test-reporter=spec src/__tests__/run-tests.ts
```
