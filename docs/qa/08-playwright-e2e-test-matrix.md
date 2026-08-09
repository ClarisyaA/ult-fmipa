# Playwright E2E Test Matrix

## Current Architecture

Existing config: `playwright.config.ts`, testDir `e2e`, Chromium only, one worker, trace on first retry, optional full-service test via `E2E_FULL_SERVICE`. Helper script: `scripts/run-e2e.mjs`.

## Recommended Architecture

- Projects: `chromium-desktop`, `firefox-desktop`, `webkit-desktop`, `chromium-mobile`.
- Auth states: `storageState/admin.json`, `storageState/staff.json`, `storageState/student.json`.
- Fixtures: users, services, uploaded files, request factory, CMS factory, cleanup tracker.
- Base URL: support host dev and Docker via `PLAYWRIGHT_BASE_URL`.
- Statefulness: run SIK, password reset, CMS image mutation, and full-service matrix serially.
- Evidence: screenshots on failure, traces on retry, PDF artifacts for printable services.

## E2E Matrix

| E2E ID | Route | Role | Preconditions | Actions | Assertions | Priority | Suggested spec |
|---|---|---|---|---|---|---|---|
| E2E-AUTH-001 | `/login` | all | users exist | login as student/staff/admin | correct redirect | P0 | `e2e/auth.spec.ts` |
| E2E-AUTH-002 | role prefixes | all | storage states | cross-role navigation | redirect/403 | P0 | `e2e/authz.spec.ts` |
| E2E-PUB-001 | `/`, public nav | Guest | app running | navigate header/footer/mobile | pages visible | P1 | `e2e/public-navigation.spec.ts` |
| E2E-SERVICE-001 | `/layanan` | Guest | services | search/select service | detail opens | P1 | `e2e/services.spec.ts` |
| E2E-SERVICE-002 | `/layanan/[slug]/ajukan` | Student | valid fixture | submit representative normal service | success and history row | P0 | `e2e/student-request.spec.ts` |
| E2E-SERVICE-003 | all slugs | Student | fixture factory | submit 17 slugs or route matrix | no crash; correct source table via API | P1 | `e2e/full-service-submission.spec.ts` |
| E2E-STUDENT-001 | `/mahasiswa/riwayat` | Student | request exists | open list/detail | owned detail only | P0 | `e2e/student-history.spec.ts` |
| E2E-ADMIN-001 | `/admin/requests` | Admin | seeded rows | filters/status/delete when allowed | table updates | P0 | `e2e/admin-requests.spec.ts` |
| E2E-STAFF-001 | `/staff/requests` | Staff | seeded rows | filters/status | no admin delete | P0 | `e2e/staff-requests.spec.ts` |
| E2E-PRINT-001 | request detail/PDF | Admin/Staff | printable rows | save metadata, open PDF id/en | data/language correct | P1 | `e2e/printable.spec.ts` |
| E2E-SIK-001 | SIK routes | Student/Admin/Staff | users | proof, approve/reject, final submit | staged behavior | P0 | `e2e/sik-workflow.spec.ts` |
| E2E-SUG-001 | `/usulkan-layanan` | Guest/Admin/Staff | none | submit, review, status/delete | persisted and authorized | P1 | `e2e/service-suggestions.spec.ts` |
| E2E-CMS-INFO-001 | `/admin/informasi/*`, `/staff/informasi/*` | Admin/Staff | CMS user | create/edit/image add/replace/delete/cover | public detail updates | P1 | `e2e/cms-information.spec.ts` |
| E2E-CMS-ACT-001 | `/admin/beranda/kegiatan/*`, staff equivalent | Admin/Staff | CMS user | create, drag/drop, replace, delete | homepage updates | P1 | `e2e/cms-activities.spec.ts` |
| E2E-CMS-PROFILE-001 | profile CMS | Admin/Staff | CMS user | edit structure/location/images | `/profil` updates | P1 | `e2e/cms-profile.spec.ts` |
| E2E-SURVEY-001 | surveys | Student/Admin/Staff | completed request | submit survey, view summary | duplicate blocked | P1 | `e2e/survey.spec.ts` |
| E2E-REPORT-001 | `/admin/reports` | Admin | data | load filters/export if present | no crash, values sane | P1 | `e2e/reports.spec.ts` |
| E2E-MASTER-001 | `/admin/master/mahasiswa` | Admin | seed | create/edit/delete/search | table updates | P1 | `e2e/master-mahasiswa.spec.ts` |
| E2E-ALUMNI-001 | `/admin/alumni/tracer-study` | Admin | seed | create/edit/delete/search | table updates | P1 | `e2e/alumni.spec.ts` |
| E2E-SYSTEM-001 | levels/units/users/log | Admin | seed | CRUD and password reset | auth and feedback | P0 | `e2e/system-admin.spec.ts` |
| E2E-TUTORIAL-001 | admin/staff pages | Admin/Staff | tutorial enabled | open tour, keyboard nav | focus visible/no console warnings | P1 | `e2e/tutorial.spec.ts` |
| E2E-RESP-001 | priority pages | Admin/Staff | storage states | view mobile widths | no clipped actions/overflow | P1 | `e2e/responsive.spec.ts` |
| E2E-NFR-001 | image missing fallback | Guest/Admin | missing file fixture | open public/admin previews | fallback visible | P1 | `e2e/storage-fallback.spec.ts` |

## Flaky-Test Prevention

- Use factories and cleanup ids.
- Avoid relying on animation timing; prefer stable data-testid or role/name selectors.
- Disable or wait through transitions where necessary.
- Keep full-service and SIK serial.
- Seed unique titles/emails with run id.

