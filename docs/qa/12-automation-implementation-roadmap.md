# Automation Implementation Roadmap

## Phase 1: Foundation

Scope: install/configure unit and API test stack, add scripts, test DB strategy, fixture folders, storage temp root, auth helpers, CI-ready conventions.

Expected files: `vitest.config.ts`, `tests/setup.ts`, `tests/factories/*`, `tests/helpers/*`, `e2e/.auth/*`, `fixtures/files/*`.

Entry: QA docs approved. Exit: `pnpm test:unit`, `pnpm test:api`, and existing `pnpm test:e2e` commands defined and runnable. Commit boundary: "test foundation".

## Phase 2: Unit Tests

Scope: service mapping, auth redirects, error utils, upload/storage validation, safe SVG, password hash, PDF metadata validators, Gmail compose URL.

Dependencies: Phase 1. Exit: critical pure functions covered and coverage report generated. Commit boundary: "unit coverage for critical helpers".

## Phase 3: API/Integration Tests

Scope: auth/authorization, service submissions, student ownership, admin/staff request APIs, uploads, CMS image replacement, surveys, suggestions, password reset.

Dependencies: isolated Docker test DB, fixture cleanup. Exit: P0/P1 APIs have positive and negative tests. Commit boundary: "api integration coverage".

## Phase 4: Playwright Smoke

Scope: guest, student, staff, admin smoke journeys with storage states.

Dependencies: seeded test data and auth states. Exit: smoke suite runs in Chromium and produces traces/screenshots on failure. Commit boundary: "playwright smoke suite".

## Phase 5: Critical Regression

Scope: printable services, SIK, CMS image replacement/deletion/cover, profile CMS, password reset, reports, responsive admin.

Dependencies: PDF fixtures and stable selectors. Exit: critical regression suite documented and runnable. Commit boundary: "playwright critical regression".

## Phase 6: NFR Automation

Scope: a11y scans, Lighthouse/perf baseline, cross-browser projects, security negative checks, Docker persistence checks.

Dependencies: stable QA environment. Exit: NFR reports generated and linked to release-readiness template. Commit boundary: "nfr automation".

## Prompt-Ready Follow-Up Tasks

1. "Implement Phase 1 testing foundation only."
2. "Add unit tests for auth, service mapping, upload/storage, and error helpers."
3. "Add API integration tests for service submission and authorization."
4. "Create Playwright auth storage states and smoke suite."
5. "Add Playwright critical regression for SIK and CMS image replacement."

