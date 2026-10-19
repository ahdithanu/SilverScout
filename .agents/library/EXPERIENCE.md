# Silver-Scout Transferable Experience Library

## Reflection Protocol
This document records evidence-backed operational lessons extracted during development and modernization tasks under the **Harness²** framework. Each entry documents the trigger context (`cue`), the concrete, checkable countermeasure (`lesson`), the specific trajectory contrast (`evidence`), and the intervention verdict.

---

### EXP-001: In-Process Route Dispatching for Sandboxed Test Suites
* **Verdict**: `helped`
* **Target Component**: `test/backendEndpoints.test.ts`, `server/index.ts`
* **Cue**: Running Node.js Express endpoint integration tests inside sandboxed container or runner environments where network socket allocation (`app.listen(0)`) triggers `listen EPERM` or `connect EPERM`.
* **Lesson**: Implement an in-memory Express route dispatcher (`dispatch(app, { method, url, headers, body })`) that navigates `(app as any)._router.stack` directly. Execute middleware chains, authentication handlers, and route controllers synchronously without binding TCP sockets.
* **Evidence**: Attempting to use `supertest` or HTTP client against localhost in the sandbox failed on connection setup. Replacing socket connections with direct router traversal allowed all 186 unit and integration test assertions to execute cleanly in under 4 seconds without bypassing the sandbox.

---

### EXP-002: Unit Multiplier Parsing Prior to Regex Stripping in Financial Guardrails
* **Verdict**: `helped`
* **Target Component**: `server/financialGuard.ts`
* **Cue**: Evaluating valuation multiples (e.g. EV/EBITDA, Revenue multiples) or financial figures produced by LLMs where numbers contain abbreviated unit suffixes (e.g., `$4.56M`, `$800k`, `2.5x`).
* **Lesson**: Parse and apply unit multipliers (`M` -> `* 1e6`, `k` -> `* 1e3`, `B` -> `* 1e9`) **before** running character-stripping regexes (such as `/[^0-9.]/g`).
* **Evidence**: In `server/financialGuard.ts`, running `text.replace(/[^0-9.]/g, '')` stripped `$4.56M` to `4.56` and `$800k` to `800`. The resulting calculated multiple of `4.56 / 800 = 0.0057x` erroneously triggered the "Multiple < 1.0x anomaly" guardrail. Extracting units prior to string stripping accurately computed `4,560,000 / 800,000 = 5.7x`, passing financial sanity validation.

---

### EXP-003: Dual-Engine Database Abstraction for Zero-Dependency Development & CI
* **Verdict**: `helped`
* **Target Component**: `server/db/index.ts`, `server/db/vectorStore.ts`
* **Cue**: Introducing enterprise relational persistence (PostgreSQL) and vector similarity search (pgvector) into a codebase where automated test pipelines or local developer environments may not have a live PostgreSQL daemon running.
* **Lesson**: Provide an automated dual-engine abstraction in `DatabaseManager` and `VectorStore`. Check connection availability during initialization; if `PGHOST` or `DATABASE_URL` is unreachable or rejected, automatically fallback to an in-memory SQL/vector mock store with cosine similarity calculation and tenant ACL filtering.
* **Evidence**: Allowed `npm test` to run 186 tests instantaneously in containerized CI environments without spinning up a live PostgreSQL container, while allowing production environments with Docker Compose or Cloud SQL/Spanner to use native pgvector without code modification.

---

### EXP-004: Node ES Module Path Resolution
* **Verdict**: `helped`
* **Target Component**: `server/db/index.ts`, `server/index.ts`
* **Cue**: Loading static files or migration SQL files in Node.js applications configured with `"type": "module"` in `package.json`.
* **Lesson**: Avoid referencing CommonJS globals `__dirname` or `__filename`, which trigger `ReferenceError: __dirname is not defined in ES module scope`. Resolve file paths using `path.resolve(process.cwd(), ...)` or `fileURLToPath(import.meta.url)`.
* **Evidence**: Migration SQL file loader threw `ReferenceError: __dirname is not defined` when executed via `tsx server/index.ts`. Switching to `path.resolve(process.cwd(), 'server/db/migrations/001_initial_schema.sql')` resolved the migration loading deterministically.

---

### EXP-005: Resilient Fallback Handling on Enterprise AI Proxy Endpoints
* **Verdict**: `helped`
* **Target Component**: `server/index.ts`
* **Cue**: Forwarding client requests to external foundation model APIs (e.g. Gemini 4 Argon or Vertex AI) that may experience network partitions, DNS resolution failures (`getaddrinfo ENOTFOUND`), or API rate limits.
* **Lesson**: Backend AI endpoints must never throw unhandled 500 exceptions or crash client frontends. Always encapsulate external LLM calls with try-catch fallback routines that return deterministic analysis, template memos, and financial audits tagged with a response header or metadata flag indicating fallback provenance.
* **Evidence**: When `GEMINI_API_KEY` was missing or external DNS failed during sandbox test execution, all AI endpoints (`/audit-cim`, `/analyze-leads`, `/ic-memo`, `/generate-cadence`, `/parse-financials`) returned well-formed JSON responses with deterministic financial calculations, preserving frontend functionality and test suite stability.

---

### EXP-006: Method Signature Polymorphism in Audit Logging Ledgers
* **Verdict**: `helped`
* **Target Component**: `server/auditLedger.ts`
* **Cue**: Calling an audit recording utility across varying layers of the system where older code passes positional arguments while newer code passes an object payload.
* **Lesson**: In core cross-cutting concerns (audit ledgers, telemetry, logging), structure method overloads to accept both `{ fundId, dealId, action, actorId, payload }` and positional arguments, normalizing input into a single internal representation and preventing `TypeError: Cannot read properties of undefined`.
* **Evidence**: Resolving parameter polymorphism in `AuditProvenanceLedger.recordEvent` eliminated subtle test failures when both `server/financialGuard.ts` and `server/sso/scim.ts` called audit recording with differing invocation styles.

---

### EXP-007: Strict Schema Formatting for SCIM 2.0 Identity Synchronization
* **Verdict**: `helped`
* **Target Component**: `server/sso/scim.ts`
* **Cue**: Integrating enterprise identity providers (Okta, Azure AD, Ping) via SCIM 2.0 (RFC 7643 / RFC 7644) for automated user lifecycle provisioning.
* **Lesson**: Identity providers fail provisioning synchronization if list endpoints do not wrap entities in an RFC 7644 ListResponse schema containing `schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"]`, `totalResults`, `startIndex`, and `itemsPerPage`.
* **Evidence**: Adding the canonical SCIM 2.0 schema structure to `server/sso/scim.ts` ensured standard identity compliance for enterprise automated tenant onboarding.
