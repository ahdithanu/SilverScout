# Silver-Scout Harness Experience Index

This index catalogs verified architectural insights, trajectory learnings, and operational heuristics discovered across implementation phases.

| ID | Domain / Component | Summary | Status |
| :--- | :--- | :--- | :--- |
| `EXP-001` | Sandboxed Testing / Express | In-process route dispatching avoids socket binding errors (`connect EPERM`) | Verified (`helped`) |
| `EXP-002` | Financial AI Guardrails | Parse abbreviation magnitude units (`M`/`k`/`B`) before stripping non-numeric chars | Verified (`helped`) |
| `EXP-003` | Persistence / Dual Engine | Dual-engine `DatabaseManager` pattern enables zero-dependency CI and local execution | Verified (`helped`) |
| `EXP-004` | Node / TypeScript Modules | ES module directory resolution requires `process.cwd()` instead of `__dirname` | Verified (`helped`) |
| `EXP-005` | AI Proxy / Reliability | Model proxy endpoints must catch upstream timeouts/errors and gracefully degrade | Verified (`helped`) |
| `EXP-006` | Audit Logging / Polymorphism | Audit ledger signatures must support both positional and dictionary parameter shapes | Verified (`helped`) |
| `EXP-007` | Enterprise SSO / SCIM 2.0 | RFC 7643/7644 compliance requires strict list container envelopes and CSRF tokens | Verified (`helped`) |

For full evidence, cues, and execution contrasts, see [EXPERIENCE.md](file:///Users/ahdithebomb/antigravity/Silver-Scout/.agents/library/EXPERIENCE.md).
