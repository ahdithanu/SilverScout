# Silver-Scout Enterprise SOC 2 Type II Pre-Audit & Disaster Recovery Runbook

## 1. SOC 2 Trust Services Criteria (TSC) Control Matrix

| Control ID | Category | Control Objective | Silver-Scout Technical Implementation | Verification Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **CC6.1** | Logical & Physical Access | Restrict logical access to authenticated tenant users with SSO & SCIM lifecycle enforcement. | `authenticateTenant` JWT verification (`server/auth.ts`), SAML/OIDC CSRF nonce (`server/sso/index.ts`), and RFC 7644 SCIM 2.0 provisioning (`server/sso/scim.ts`). | `GET /api/funds/:fundId/compliance/soc2` |
| **CC6.6** | Confidentiality & Boundary | Enforce strict logical isolation between multi-tenant funds across relational and vector stores. | Mandatory `fund_id` foreign keys (`001_initial_schema.sql`) and role-scoped RAG ACL vector search (`server/db/vectorStore.ts`). | `GET /api/funds/:fundId/compliance/soc2` |
| **CC7.2** | System Operations & Audit | Detect unauthorized modifications via tamper-evident cryptographic audit logs. | SHA-256 hash-chained provenance ledger (`server/auditLedger.ts`) with automated chain verification. | `GET /api/funds/:fundId/audit/verify` |
| **CC8.1** | Change Management & AI Integrity | Prevent hallucinated financial figures from entering investment decisions. | Deterministic EV/EBITDA multiple sanity guardrail (`server/financialGuard.ts`) on all Gemini 4 Argon outputs. | `POST /api/funds/:fundId/ai/audit-cim` |
| **A1.2** | Availability & Recovery | Ensure zero data loss across container restarts and support rapid point-in-time recovery. | Durable `TransactionalOutboxManager` (`server/outbox.ts`), Docker volume persistence (`server/persistentStorage.ts`), and cryptographic DR snapshots (`server/compliance/soc2AndDrEngine.ts`). | `POST /api/funds/:fundId/compliance/dr/snapshot` |

---

## 2. Disaster Recovery (DR) Objectives & Procedures

* **Recovery Point Objective (RPO)**: `< 5 minutes` (continuous write-through to persistent volume + transactional outbox).
* **Recovery Time Objective (RTO)**: `< 60 seconds` (automated snapshot verification and state hydration).

### 2.1 Creating an On-Demand Cryptographic Snapshot
```bash
curl -X POST https://api.silverscout.io/api/funds/redwood-cap/compliance/dr/snapshot \
  -H "Authorization: Bearer <PARTNER_JWT>"
```

### 2.2 Verifying & Restoring a Tenant Snapshot
```bash
curl -X POST https://api.silverscout.io/api/funds/redwood-cap/compliance/dr/restore \
  -H "Authorization: Bearer <PARTNER_JWT>"
```

### 2.3 Replaying Dead-Letter Outbox Events
```bash
curl -X POST https://api.silverscout.io/api/funds/redwood-cap/outbox/drain \
  -H "Authorization: Bearer <PARTNER_JWT>"
```
