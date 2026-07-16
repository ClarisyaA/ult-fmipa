# Risk and Gap Register

## Risk Register

| Risk ID | Area | Evidence | Impact | Likelihood | Severity | Priority | Existing control | Missing coverage | Recommended follow-up |
|---|---|---|---|---|---|---|---|---|---|
| RISK-P0-001 | Authorization/IDOR | Role proxy and many object APIs | Data exposure | Medium | Critical | P0 | proxy, requireRole, session NPM checks | systematic API tampering tests | Build authz API suite |
| RISK-P0-002 | Legacy table whitelist | dynamic Prisma raw table usage through whitelisted services | SQL/data integrity | Medium | Critical | `legacy-services`, `isRequestTable` | unit tests for whitelist/tamper | Unit + integration whitelist suite |
| RISK-P0-003 | Student NPM trust | service request route uses `session.user.npm || body?.npm` for non-SIK path | wrong ownership if session npm absent | Medium | High | student API checks in several routes | explicit tamper tests | Validate submission ownership paths |
| RISK-P0-004 | Upload rollback/storage | runtime filesystem + DB writes | orphaned files/data loss | Medium | High | validation helpers, path resolver | failure injection | Storage transaction tests |
| RISK-P1-001 | Printable PDFs | multiple services and language modes | official document incorrect | Medium | High | letter modules | visual/content snapshots | PDF test phase |
| RISK-P1-002 | SIK staged workflow | multi-role state machine | final form unlock error | Medium | High | existing SIK spec | rejection/negative matrix | Expand SIK specs |
| RISK-P1-003 | CMS image cache | replaced image same public id | stale public images | Medium | Medium | cache-buster helpers | E2E regression | Add image replace tests |
| RISK-P1-004 | Missing files after setup | storage is runtime and gitignored | broken images/attachments | High | Medium | fallback components | missing-file fixture tests | Storage fallback suite |
| RISK-P1-005 | Responsive admin | prior mobile clipping concerns | unusable admin pages | Medium | High | responsive classes | viewport screenshots | Responsive E2E suite |
| RISK-P1-006 | Password reset | admin reset flow affects login security | account lockout/exposure | Medium | High | legacy hash helper | reset E2E/API | System admin tests |
| RISK-P2-001 | Turbopack warning | build warning from file-upload trace | runtime/build fragility | Medium | Medium | build passes | no targeted regression | Investigate build trace |
| RISK-P2-002 | Host/Docker port confusion | host dev and Docker both common | testing wrong server | High | Medium | baseURL env | environment reporting | Standardize QA env |
| RISK-P2-003 | Large data volumes | legacy tables can be large | slow admin reports/lists | Medium | Medium | pagination/filter helpers | performance baselines | Seeded load tests |
| RISK-P2-004 | Tutorial overlay a11y | focus/overlay complex | keyboard/accessibility issues | Medium | Medium | tutorial steps | no a11y automation | Add tour focus tests |

## Tooling Gaps

- No Vitest/Jest unit runner.
- No React Testing Library.
- No MSW/Supertest/route-handler helper.
- No dedicated test DB lifecycle.
- No browser storage-state fixtures.
- No CI workflow inspected for test execution.
- No coverage reports.
- No automated accessibility/performance/security scans.

## Testability Gaps

- Some UI actions lack stable `data-testid`.
- Dynamic legacy table behavior is centralized but still needs explicit test seams.
- PDF visual correctness needs approved baseline fixtures.
- Fault injection for DB/storage unavailable is not yet automated.
- Runtime uploaded files are gitignored, so tests need fixture storage setup.

