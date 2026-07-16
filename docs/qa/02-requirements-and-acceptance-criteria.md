# Requirements and Acceptance Criteria

## Confirmed Requirements

| Req ID | Requirement | Source evidence | Priority |
|---|---|---|---|
| REQ-AUTH-001 | Admin, staff, and student routes/APIs are protected by server-side proxy/role checks. | `src/proxy.ts`, `src/lib/auth.ts` | P0 |
| REQ-SERVICE-001 | Public service slugs map to whitelisted legacy source tables. | `src/lib/legacy-services.ts`, request libs | P0 |
| REQ-STUDENT-001 | Student-owned APIs use `session.user.npm`. | student APIs, attachment API | P0 |
| REQ-SEC-001 | Database unavailability maps to safe JSON with `DATABASE_UNAVAILABLE`. | `src/lib/error-utils.ts` | P0 |
| REQ-UPLOAD-001 | Service attachments validate MIME and size; SVG is not accepted for official attachments. | `src/lib/file-upload.ts`, `service-upload-config.ts` | P0 |
| REQ-CMS-001 | CMS image uploads support safe SVG for configured CMS images. | `information-image-upload.ts`, `home-activity-image-upload.ts`, `safe-svg.ts` | P1 |
| REQ-PRINT-001 | Printable services support metadata and PDF in Indonesian/English. | `src/lib/letters/*`, PDF route | P1 |
| REQ-SIK-001 | SIK is staged: proof, review, approval/rejection, final form, normal workflow. | `src/lib/sik-requests.ts`, SIK routes | P0 |
| REQ-SUGGESTION-001 | Public service suggestions persist and are managed by admin/staff. | `service-suggestions.ts`, routes/pages | P1 |
| REQ-SURVEY-001 | Student surveys are tied to eligible requests and summarized for admin/staff. | `service-surveys.ts`, survey routes | P1 |
| REQ-SYSTEM-001 | Admin manages levels, units, users, password reset, and logs. | admin system routes/pages | P1 |

## Acceptance Criteria

| AC ID | Feature | Actor | Given/When/Then | Negative expectation | Priority | Proposed coverage |
|---|---|---|---|---|---|---|
| AC-AUTH-001 | Login redirect | Guest | Given a guest opens protected admin/staff/student route, when no token exists, then page redirects to `/login` or API returns 401. | No protected HTML/data is returned. | P0 | Playwright, API |
| AC-AUTH-002 | Role boundaries | Student/Staff/Admin | Given a user has role X, when accessing another role prefix, then UI redirects or API returns 403. | Staff cannot access `/admin`; student cannot access `/staff`. | P0 | Playwright, API |
| AC-AUTH-003 | Safe callback | All | Given login callbackUrl is external or wrong role, when login succeeds, then redirect uses role default. | No open redirect. | P0 | Unit |
| AC-SERVICE-001 | Service catalog | Guest | Given `/api/services`, when fetched, then 17 services return with slug, title, category, source table. | Unknown slug returns not found. | P1 | API, Playwright |
| AC-SERVICE-002 | Submission required fields | Student | Given service submission, when email or Bahasa Surat is missing, then validation prevents or rejects submit. | Invalid email/language is rejected. | P0 | Component, API, Playwright |
| AC-SERVICE-003 | Whitelisted source table | Student/Admin/Staff | Given any request/detail/status action, when service slug resolves, then source table comes from whitelist only. | Arbitrary `sourceTable` is ignored/rejected. | P0 | Unit, API |
| AC-STUDENT-001 | Student ownership | Student | Given a logged-in student, when requesting history/detail/attachment, then data is filtered by `session.user.npm`. | Body/query NPM tampering cannot expose other data. | P0 | API, Playwright |
| AC-REQUEST-001 | Admin/staff queue | Admin/Staff | Given requests exist, when opening list with filters, then rows show safe summary and actions by role. | `PERMINTAAN_IP` is not displayed. | P0 | Playwright, API |
| AC-REQUEST-002 | Status update | Admin/Staff | Given a valid request, when status is changed, then row/detail reflects status and timestamps. | Invalid status/service/id returns safe error. | P0 | API, Playwright |
| AC-PRINT-001 | Letter metadata | Admin/Staff | Given printable request, when metadata is saved, then Data Surat readiness updates. | Duplicate/invalid numbers are rejected. | P1 | API, Playwright |
| AC-PRINT-002 | PDF language | Admin/Staff/Student as authorized | Given printable request, when PDF is fetched with `lang=id` or `lang=en`, then correct language content renders. | Unauthorized access and bad ids are rejected. | P1 | API, Playwright, visual |
| AC-SIK-001 | Proof stage | Student | Given SIK service, when student uploads proof, then approval is pending and final form remains locked. | Invalid file or missing proof is rejected. | P0 | API, Playwright |
| AC-SIK-002 | Approval stage | Admin/Staff | Given pending proof, when approved, then final form unlocks; when rejected, it remains locked. | Unauthorized users cannot approve. | P0 | API, Playwright |
| AC-SIK-003 | Final submit | Student | Given approved proof, when final form is submitted, then normal request workflow continues. | Rejected/non-owner cannot final submit. | P0 | API, Playwright |
| AC-CMS-ACTIVITY-001 | Activity image | Admin/Staff | Given activity form, when image is selected or dropped, then preview appears and save persists image/fit/alt. | Oversized/unsafe type is rejected; missing stored file shows fallback. | P1 | Component, API, Playwright |
| AC-CMS-INFO-001 | Information CRUD | Admin/Staff | Given information form, when post and images are saved, then public list/detail show updated content. | Duplicate slug/invalid image returns safe error. | P1 | API, Playwright |
| AC-CMS-INFO-002 | Replace one image | Admin/Staff | Given saved information image, when `Ganti Gambar` then `Simpan Penggantian`, then only that image changes and public cache-busted URL updates. | Page must not navigate/blank on file selection. | P1 | Playwright, API |
| AC-CMS-PROFILE-001 | Profile CMS | Admin/Staff | Given organization/location managers, when data/images/hours are edited, then public `/profil` updates. | Missing image renders fallback. | P1 | API, Playwright |
| AC-SUGGESTION-001 | Suggest service | Guest/Student | Given `/usulkan-layanan`, when valid suggestion submits, then it persists for admin/staff review. | Missing required fields reject. | P1 | API, Playwright |
| AC-SURVEY-001 | Student survey | Student | Given eligible completed request, when survey submits, then duplicate submissions are blocked. | Other student cannot submit for request. | P1 | API, Playwright |
| AC-SYSTEM-001 | Password reset | Admin | Given admin resets a user password, when valid password is saved, then legacy hash login works. | Password is never returned/logged. | P0 | API, Playwright |
| AC-SEC-001 | Safe errors | All | Given DB/storage/API failure, when endpoint fails, then response is friendly JSON or UI fallback. | No stack trace, raw Prisma/MariaDB/filesystem path. | P0 | Unit, API |
| AC-NFR-001 | Responsive admin | Admin/Staff | Given priority admin pages at mobile widths, when viewed, then content fits and tables have appropriate containment. | No whole-page horizontal overflow. | P1 | Manual, Playwright screenshots |
| AC-NFR-002 | Accessibility basics | All | Given forms/modals/tutorials, when keyboard used, then focus is visible and controls have names. | No hidden focused element warning. | P1 | Manual, a11y scan |

