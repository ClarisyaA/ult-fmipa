# Non-Functional Test Plan

| Category | Objective | Method | Tool recommendation | Environment | Metric/target | Pass criteria | Priority |
|---|---|---|---|---|---|---|---|
| Security auth | Verify protected routes/APIs require session and role | negative API/E2E | Playwright + API tests | Docker test DB | 100% protected endpoints checked | 401/403/redirect; no data leak | P0 |
| IDOR | Prevent cross-student/admin object access | seeded cross-user tests | API tests | test DB | all owned resources checked | non-owner gets 404/403 | P0 |
| Source table whitelist | Reject arbitrary `sourceTable` | unit/API tampering | Vitest/API | host or test DB | all request libs | no raw table selection from client | P0 |
| Upload safety | Validate MIME/size/path traversal/SVG | file fixture tests | API + unit | test DB/storage | all upload helpers | invalid files rejected; safe SVG only for CMS | P0 |
| Error leakage | Hide Prisma/MariaDB/fs stack traces | forced failures | API tests | isolated env | all critical APIs | safe JSON/UI fallback | P0 |
| XSS/stored content | Validate CMS text rendering | manual + E2E malicious strings | Playwright/a11y | test DB | no script execution | escaped or harmless render | P1 |
| Password reset | Protect resets and hide passwords | API/E2E | Playwright/API | test DB | admin-only | no password in response/log | P0 |
| Performance public | Baseline homepage/catalog/detail | lab runs | Lighthouse/WebPageTest | prod-like | Proposed target, requires approval: LCP < 2.5s, CLS < 0.1, INP < 200ms | targets met or accepted | P2 |
| Performance admin | Request list/dashboard large data | seeded load | browser + DB query profiling | test DB | Proposed: initial admin list < 3s at 1k rows | no timeout; filters usable | P1 |
| PDF performance | Generate printable PDFs | timed API | API tests | test DB | Proposed: PDF < 5s | correct content-type and no timeout | P1 |
| Accessibility | Keyboard, focus, labels, contrast | manual + axe | axe, Playwright | host/Docker | Proposed WCAG 2.2 AA | no critical violations | P1 |
| Responsive | Fit priority pages | viewport screenshot matrix | Playwright screenshots | host/Docker | 320x568 through 1440x900 | no whole-page overflow or hidden actions | P1 |
| Reliability | DB/storage unavailable, failed upload/rollback | fault injection | API/manual | isolated env | all critical flows | graceful failure, no orphaned visible state | P0 |
| Data integrity | correct service table, status, cover uniqueness | DB assertions | API/integration | test DB | all CRUD/update flows | only intended row changes | P0 |
| Privacy | protect student data and `PERMINTAAN_IP` | UI/API inspection | API/E2E | test DB | all public/admin summaries | no sensitive field exposure | P0 |
| Operability | Docker build/run, persistent storage | Docker compose test | Docker | local Docker | app health and storage persistence | rebuild keeps storage files | P1 |
| Maintainability | stable selectors, centralized validation | code review/testability audit | static analysis | repo | gaps documented | future tests have stable hooks | P2 |

## Browser and Viewport Matrix

Browsers to target: Chromium (existing), Firefox (missing), WebKit (missing). Viewports: 320x568, 360x800, 375x667, 390x844, 430x932, 768x1024, 1024x768, 1366x768, 1440x900.

## Security-Specific Checks

- Auth/session expiration and CSRF-sensitive state changes.
- Role escalation across `/api/admin`, `/api/staff`, `/api/student`.
- Student NPM body tampering.
- Path traversal in storage and image routes.
- Unsafe SVG and stored XSS in CMS.
- SQL injection attempts in filters, ids, service slugs.
- Open redirect through callbackUrl.
- File access control for attachments.
- Dependency audit as separate security task.

