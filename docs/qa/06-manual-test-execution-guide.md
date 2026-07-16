# Manual Test Execution Guide

## Environment Setup

1. Use a dedicated test or QA database. Do not reset the developer main local database.
2. Start either host dev (`pnpm dev`) or Docker (`docker compose up --build`); record which one.
3. Confirm `/api/health` and `/api/auth/providers`.
4. Provision test users securely for student, staff, admin, and expired/unauthorized cases.
5. Prepare fixtures: safe PNG/JPG, safe SVG, invalid SVG, oversized file, PDF attachment, missing-file state.

## Evidence Naming

Use `YYYYMMDD-suite-role-route-case-result.ext`, for example `20260716-smoke-admin-dashboard-TC-AUTH-002-pass.png`.

## Smoke Suite

Entry: app starts, DB reachable, test users available. Exit: all P0 smoke paths pass or release is blocked.

| Order | Case | Route/API | Role | Evidence |
|---|---|---|---|---|
| 1 | App loads | `/`, `/api/health` | Guest | screenshot/response |
| 2 | Login and redirects | `/login` | Student/Staff/Admin | screenshots |
| 3 | Public services | `/layanan`, `/layanan/[slug]` | Guest | screenshots |
| 4 | Student submit | `/layanan/[slug]/ajukan` | Student | request id |
| 5 | Student history | `/mahasiswa/riwayat` | Student | screenshot |
| 6 | Admin/staff request handling | `/admin/requests`, `/staff/requests` | Admin/Staff | screenshot |
| 7 | Critical CMS rendering | homepage activity + information images | Guest/Admin | screenshot |
| 8 | Storage image rendering | image APIs | Guest/Auth | response/screenshot |
| 9 | Database connectivity | dashboard/API | Admin | screenshot |
| 10 | Logout | auth session | All | screenshot |

## Critical Regression Suite

Covers all smoke items plus: all service families, printable PDFs, SIK, CMS create/update/replace/delete, password reset, reports, missing-image fallback, Docker storage persistence, and mobile responsive checks.

Entry: changed branch built, smoke passed. Exit: no open P0/P1 defects without approval.

## Full Regression Suite

Covers every scenario in `04-functional-test-scenarios.md` and all NFR categories in `05-non-functional-test-plan.md`. Use for release candidates or large refactors.

## Cleanup

- Delete only records created by the test run.
- Restore changed CMS/profile/system records if reused.
- Remove uploaded fixtures from test storage only.
- Do not run destructive DB resets against shared local/prod-like DB.

## Blocker Handling

If a P0 blocks further testing, create a defect, preserve evidence, stop affected suite, and continue unrelated areas only if data integrity is safe.

