# Silver-Scout Workspace Operating Guidelines & Harness

## Workspace Invariants & Architecture
Silver-Scout is an enterprise search fund and private equity sourcing platform with an integrated AI pipeline (Gemini 4 Argon), zero-trust multi-tenancy, SAML/OIDC SSO, SCIM 2.0 provisioning, and dual-engine PostgreSQL/pgvector storage.

### 1. In-Process Test Dispatching (Sandbox Network Policy)
* In sandboxed Node test execution, binding raw TCP ports via `app.listen()` or `supertest(app)` can trigger `listen EPERM` or `connect EPERM`.
* Use in-process route dispatching (`dispatch(app, { method, url, headers, body })`) to traverse `(app as any)._router.stack`, verifying route handlers, middleware chains, and JSON status/bodies in memory without network sockets.

### 2. Node ES Module Path Resolution
* `package.json` specifies `"type": "module"`. Direct references to CommonJS globals (`__dirname`, `__filename`) throw `ReferenceError`.
* Always resolve filesystem paths with `path.resolve(process.cwd(), ...)` or `fileURLToPath(import.meta.url)`.

### 3. Dual-Engine Storage & Zero-Dependency Testing
* `server/db/index.ts` provides `DatabaseManager` with automatic fallback to an in-memory SQL mock store when `PGHOST` or `DATABASE_URL` is unreachable.
* Vector similarity operations (`server/db/vectorStore.ts`) support float cosine similarity and tenant/role ACL filtering both in Postgres pgvector and in-memory fallback.

### 4. Financial Unit Multiplier Parsing
* Financial text often formats numbers with abbreviated magnitude units (e.g., `$4.56M`, `$800k`, `2.5x`).
* Extract magnitude suffixes (`M` -> `* 1e6`, `k` -> `* 1e3`, `B` -> `* 1e9`) **before** running regex non-digit stripping (`/[^0-9.]/g`). Stripping letters first corrupts millions to units.

### 5. AI Proxy Endpoint Graceful Degradation
* Backend AI routes (`/api/funds/:fundId/ai/*`) must never return 500 when external LLMs suffer network partitions, rate limits, or DNS failures.
* Wrap AI client calls in structured error-handling with deterministic calculation engines and template fallbacks marked with fallback headers.

### 6. Zero-Trust Multi-Tenancy & SCIM 2.0 Compliance
* Every database query, vector search, and audit log write must be scoped to `fundId` (or `tenantId`).
* SSO callbacks require CSRF state parameter validation. SCIM 2.0 endpoints must adhere to RFC 7643/7644 with correct `urn:ietf:params:scim:api:messages:2.0:ListResponse` schemas.

---

## Skill Triggers
When converting Firebase Extensions into standalone Cloud Functions codebases or publishable npm packages, load the `extension_to_functions_codebase` skill.
When integrating Firebase AI Logic (Gemini API) into web applications, load the `firebase_ai_logic_basics` skill.
When deploying and configuring full-stack SSR web applications with Firebase App Hosting, load the `firebase_app_hosting_basics` skill.
When implementing Firebase Authentication, sign-in, user management, or auth-based access control, load the `firebase_auth_basics` skill.
When configuring Firebase CLI, projects, or downloading mobile configuration files (`google-services.json`, `GoogleService-Info.plist`), load the `firebase_basics` skill.
When adding crash reporting or integrating Firebase Crashlytics SDK, load the `firebase_crashlytics` skill.
When building and deploying PostgreSQL schemas, queries, and mutations with Firebase Data Connect (SQL Connect), load the `firebase_data_connect_basics` skill.
When modeling data, writing security rules, indexing, or querying Cloud Firestore, load the `firebase_firestore` skill.
When deploying static single-page apps or microservices to Firebase Hosting, load the `firebase_hosting_basics` skill.
When configuring Firebase Remote Config templates, feature flags, and client SDK fetching, load the `firebase_remote_config_basics` skill.
When auditing Firestore or Cloud Storage security rules for privilege escalation, data leakage, or role bypasses, load the `firebase_security_rules_auditor` skill.
When configuring Xcode projects (`.pbxproj`) or adding Swift package dependencies on macOS, load the `xcode_project_setup` skill.
