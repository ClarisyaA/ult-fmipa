# QA Audit Summary

## Executive Summary

The application is a Next.js 16 App Router system for ULT FMIPA Unpad with public pages, student submission/history flows, staff/admin operational dashboards, CMS modules, PDF/letter workflows, surveys, service suggestions, and legacy MariaDB-backed service tables. The repository already contains Playwright E2E coverage and scripts, but lacks unit-test and API/integration-test infrastructure. The highest-risk areas are role authorization, legacy service table whitelisting, file and image persistence, printable PDF correctness, SIK staged workflow, browser cache around replaced images, and responsive admin pages.

## Scope Inspected

Inspected: `package.json`, `pnpm-lock.yaml`, `playwright.config.ts`, `scripts/run-e2e.mjs`, `src/app`, `src/components`, `src/lib`, `src/types`, `database/migrations`, `docs`, `Dockerfile`, `docker-compose.yml`, `.gitignore`, `.dockerignore`, `next.config.ts`, auth/proxy logic, storage/upload helpers, PDF/email helper, service mapping, and existing E2E files.

Not inspected by design: `database/migrations_legacy_backup`.

## Calculated Counts

- Page files discovered: 46.
- API route files discovered: 89.
- Public service slugs discovered: 17.
- Database migration files in `database/migrations`: 8.
- Existing E2E spec files discovered: 9 spec files plus 3 helper files.
- Existing unit test files discovered: none confirmed outside Playwright specs.
- Test tooling: Playwright installed and configured; Vitest/Jest/RTL/MSW/Supertest not installed.

## Testing Tools Found

- `@playwright/test` installed.
- `playwright.config.ts` configured for Chromium only, workers `1`, `fullyParallel: false`, trace `on-first-retry`, base URL from `PLAYWRIGHT_BASE_URL`.
- Scripts: `test:e2e`, `test:e2e:full-services`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:debug`, `test:e2e:trace`, `test:e2e:report`.
- Existing E2E coverage: auth, public pages, information pages, admin/staff request tables, service catalog matrix, student request flow, SIK staged workflow, survey pages, optional full-service submission.

## Major Risks

- Authorization and IDOR risk across admin/staff/student APIs.
- Legacy service table selection must remain whitelisted; arbitrary `sourceTable` must never be accepted.
- Student NPM must come from `session.user.npm`, not request body.
- File upload and CMS image replacement must preserve storage and roll back on DB failure.
- Printable PDF workflows need language, metadata, and authorization checks.
- Docker/runtime storage differs from host development; missing files need safe fallbacks.
- `.dockerignore` excludes `docs` and `e2e`, which is fine for image size but means QA docs/specs are not inside production image.
- Turbopack warning around `src/lib/file-upload.ts` import trace remains a build warning to monitor.

## Major Coverage Gaps

- No unit-test runner/config.
- No API/integration harness for route handlers, Prisma, or a dedicated test database.
- Playwright only Chromium by default; no Firefox/WebKit projects.
- No auth storage-state fixtures; current E2E logs in through UI.
- No formal coverage reporting.
- No automated a11y, performance, or security scanning.
- No documented seed/reset strategy for isolated test DB.

## Recommended Next Task

Implement Automation Roadmap Phase 1: test foundation, scripts, test database strategy, fixtures, selectors, and CI-ready folder structure without expanding business behavior.

## Open Questions

- Which environments are official QA/prod-like targets?
- Which real roles/access codes should map to staff versus admin beyond defaults?
- What performance SLA should be approved for public pages and admin dashboards?
- Should PDF visual snapshots be approved against official faculty templates?
- Should Playwright run against Docker only, host dev only, or both?

