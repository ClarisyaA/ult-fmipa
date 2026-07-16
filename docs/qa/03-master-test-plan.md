# Master Test Plan

## Objectives

- Verify public, student, staff, and admin workflows.
- Protect against regressions in legacy request tables, authorization, upload/storage, printable PDFs, CMS, and responsive admin UI.
- Establish traceable manual, unit, API/integration, Playwright, and NFR coverage.

## Scope

In scope: all discovered pages, all discovered API routes, 17 service slugs, service submissions, student ownership, admin/staff processing, SIK staged workflow, printable services, CMS modules, surveys, service suggestions, system/admin pages, storage and Docker runtime behavior.

Out of scope for this audit: implementing a full new automated suite, running migrations, resetting DB, modifying `database/migrations_legacy_backup`, validating production credentials, and real email sending.

## Test Approach

| Level | Purpose | Tool recommendation |
|---|---|---|
| Manual | release readiness, visual PDF, responsive, a11y judgement | browser, PDF viewer, templates |
| Unit | pure validators, mappings, storage, error normalization | Vitest recommended |
| Component | form state/validation and CMS widgets | React Testing Library recommended |
| API/integration | route handlers, auth, DB failure, uploads | route invocation + Docker test DB |
| Playwright | critical end-to-end journeys | existing Playwright, expanded fixtures |
| NFR | security, a11y, performance, resilience | axe, Lighthouse, OWASP checks, k6 later |

## Environments

- Host development: `pnpm dev`, MariaDB configured by `.env`.
- Docker local: `docker-compose.yml`, app on 3000, DB on host 13306, persistent `./storage`.
- QA/prod-like: gap; define before release sign-off.
- Test DB: gap; use isolated database rather than developer local DB.

## Entry Criteria

- Branch builds or known unrelated build issue is documented.
- Test database/environment selected.
- Test users provisioned securely for student/staff/admin.
- Required fixtures available: PDF, JPG/PNG, safe SVG, invalid SVG, oversized file, service request seed states.
- No destructive migration/reset against developer database.

## Exit Criteria

- Smoke suite complete with no P0/P1 open defects.
- Critical regression complete for changed area.
- P0 defects fixed and retested.
- P1 defects either fixed or explicitly accepted.
- Release-readiness template completed.

## Suspension and Resumption

Suspend testing for unavailable database, invalid test credentials, broken build, missing required seed data, or environment mismatch. Resume after environment is restored and blocker is documented.

## Defect Severity

- Critical: security bypass, data exposure, data loss, core workflow blocked.
- High: role workflow blocked, PDF incorrect, uploads broken, major responsive failure.
- Medium: noncritical feature failure with workaround.
- Low: cosmetic/content minor issue.

## Evidence

Use screenshots, traces, request/response snippets with secrets redacted, PDF artifacts, console logs, and database record identifiers when safe. Never attach private student data or credentials.

## Reporting

Use `templates/test-execution-report.md`, `templates/defect-report.md`, `templates/retest-and-regression-report.md`, and `templates/release-readiness-report.md`.

