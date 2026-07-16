# Unit and Integration Test Matrix

## Unit Test Targets

| Source file | Function/module | Responsibility | Cases | Mock dependencies | Priority | Suggested path |
|---|---|---|---|---|---|---|
| `src/lib/legacy-services.ts` | service mapping | slug redirects and 17 services | known slugs, legacy redirects, unknown | none | P0 | `src/lib/__tests__/legacy-services.test.ts` |
| `src/lib/legacy-request-submit.ts` | supported submissions | table whitelist and insert routing | each source table, unsupported source | Prisma | P0 | `src/lib/__tests__/legacy-request-submit.test.ts` |
| `src/lib/auth-redirect.ts` | callback safety | default redirects and role allowed paths | external, protocol-relative, wrong role | none | P0 | `src/lib/__tests__/auth-redirect.test.ts` |
| `src/lib/error-utils.ts` | DB unavailable mapping | friendly 503 JSON | Prisma-like errors, generic errors | none/NextResponse | P0 | `src/lib/__tests__/error-utils.test.ts` |
| `src/lib/file-upload.ts` | attachment validation | MIME, size, filename | PDF, JPG/PNG, SVG reject, oversize | fs mocked | P0 | `src/lib/__tests__/file-upload.test.ts` |
| `src/lib/safe-svg.ts` | SVG safety | reject script/event/foreignObject/remote refs | safe/unsafe buffers | none | P0 | `src/lib/__tests__/safe-svg.test.ts` |
| `src/lib/storage-paths.ts` | path resolution | storage root and traversal prevention | absolute path, `..`, slash, normal | env | P0 | `src/lib/__tests__/storage-paths.test.ts` |
| `src/lib/information-post-images.ts` | image fit/cover/replace | fit normalization, replace rollback | cover/contain/bad; DB fail | Prisma/fs | P1 | `src/lib/__tests__/information-post-images.test.ts` |
| `src/lib/home-activities.ts` | image fit/input normalization | activity validation and cache URL data | bad fit, active flags, sort | Prisma | P1 | `src/lib/__tests__/home-activities.test.ts` |
| `src/lib/profile-cms.ts` | profile image fit/form validation | contact/email/hours/image fit | invalid email, missing file | Prisma/fs | P1 | `src/lib/__tests__/profile-cms.test.ts` |
| `src/lib/letters/letter-data.ts` | printable map | 5 printable services | known/unknown slug | none | P1 | `src/lib/letters/__tests__/letter-data.test.ts` |
| `src/lib/letters/letter-metadata.ts` | metadata validation | date/number/numeric validation | duplicate, invalid date, decimal | Prisma | P1 | `src/lib/letters/__tests__/letter-metadata.test.ts` |
| `src/lib/requests/request-email-helper.ts` | Gmail compose | compose URL and recipient resolution | email valid/invalid, printable/nonprintable | Prisma/detail | P1 | `src/lib/requests/__tests__/request-email-helper.test.ts` |
| `src/lib/auth-db-users.ts` | legacy password | SHA1 compatibility and role mapping | valid/invalid hash/access code | Prisma | P0 | `src/lib/__tests__/auth-db-users.test.ts` |
| `src/lib/service-survey-validation.ts` | survey validation | rating/comment rules | min/max/duplicate shape | none | P1 | `src/lib/__tests__/service-survey-validation.test.ts` |
| `src/lib/slug.ts` | information slug | slug generation | spaces, punctuation, empty | none | P2 | `src/lib/__tests__/slug.test.ts` |

## API and Integration Matrix

| API group | Strategy | Key assertions | Priority |
|---|---|---|---|
| Auth/proxy | Playwright + direct API | redirects, 401/403, callback safety | P0 |
| Services and submissions | Docker test DB integration | valid create, missing email/language, unsupported slug, file validation | P0 |
| Student request APIs | Docker test DB | `session.user.npm` ownership, no body NPM trust | P0 |
| Admin/staff request APIs | Docker test DB | role auth, list filters, status update, delete permissions, export | P0 |
| Printable APIs | Docker test DB + PDF parse/snapshot | metadata readiness, `lang=id/en`, auth, 404 | P1 |
| SIK APIs | serial integration | proof upload, approve/reject, final submit, ownership | P0 |
| CMS APIs | mocked fs + test DB | create/edit/delete/upload/replace/missing file/cache headers | P1 |
| Profile APIs | test DB + storage fixtures | org/location CRUD, hours, image route | P1 |
| Service suggestions | test DB | public create, admin/staff status/delete | P1 |
| Surveys | test DB | pending, submit, duplicate, summaries | P1 |
| System users | test DB | create/update/delete/reset password, no password leak | P0 |

## Missing Infrastructure

- Add Vitest and optional React Testing Library.
- Add route-handler test utilities for Next Request/Response.
- Add Prisma test DB helpers and factory data.
- Add storage temp directory fixture.
- Add coverage scripts and CI job.

