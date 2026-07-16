# Functional Test Scenarios

## Scenario Matrix

| TC ID | AC | Feature | Role | Priority | Level | Preconditions | Steps | Expected result | Evidence | Cleanup |
|---|---|---|---|---|---|---|---|---|---|---|
| TC-AUTH-001 | AC-AUTH-001 | Protected redirect | Guest | P0 | Playwright/API | No session | Open `/admin/dashboard`, `/staff/dashboard`, `/mahasiswa/riwayat`; call protected APIs | Pages redirect to login; APIs 401 | screenshot, response | none |
| TC-AUTH-002 | AC-AUTH-002 | Cross-role access | Student/Staff/Admin | P0 | Playwright/API | Valid role sessions | Try each other role prefix | Redirect or 403; no data leak | trace | logout |
| TC-AUTH-003 | AC-AUTH-003 | Callback safety | All | P0 | Unit/API | Login callbackUrl values | Test external, `//host`, wrong role, valid internal | Only allowed internal role paths used | assertion | none |
| TC-PUB-001 | AC-SERVICE-001 | Public navigation | Guest | P1 | Playwright | App running | Visit `/`, `/layanan`, `/informasi`, `/profil`, `/survei`, `/usulkan-layanan` | Pages load without crash and nav works | screenshots | none |
| TC-SERVICE-001 | AC-SERVICE-001 | Service catalog matrix | Guest | P1 | API/Playwright | Services available | For every service slug, open `/layanan/[slug]` and GET `/api/services/[slug]` | Valid slug returns detail; bad slug returns 404 | network log | none |
| TC-SERVICE-002 | AC-SERVICE-002 | Required submission fields | Student | P0 | Playwright/API | Student login | Submit without email, without Bahasa Surat, invalid email | Field/UI/API validation; no DB row | screenshot, response | delete created rows if any |
| TC-SERVICE-003 | AC-SERVICE-003 | Full service submission family | Student | P1 | API/Playwright | Student login; safe fixture data | Submit each of 17 service slugs with valid data | Row created in correct source table; success message | row id, screenshot | delete test rows |
| TC-STUDENT-001 | AC-STUDENT-001 | Student history isolation | Student | P0 | API/Playwright | Two student-like records | Student A attempts request owned by B | 404/forbidden; no detail/attachment | response | none |
| TC-REQUEST-001 | AC-REQUEST-001 | Admin request list | Admin | P0 | Playwright/API | Existing requests | Filter by status/service/date, open detail | Rows match filter; safe fields displayed | screenshot | none |
| TC-REQUEST-002 | AC-REQUEST-002 | Staff request list | Staff | P0 | Playwright/API | Existing requests | Staff filters and updates allowed status | Staff actions work; admin-only delete hidden | screenshot | revert status |
| TC-REQUEST-003 | AC-REQUEST-002 | Invalid request update | Admin/Staff | P0 | API | Valid session | PATCH invalid status, bad id, bad slug | 400/404 safe JSON | response | none |
| TC-PRINT-001 | AC-PRINT-001 | Printable metadata | Admin/Staff | P1 | Playwright/API | Printable request exists | Open detail, edit Data Surat | Readiness and saved values update | screenshot | restore metadata |
| TC-PRINT-002 | AC-PRINT-002 | PDF language matrix | Admin/Staff/Student | P1 | API/Manual | Printable requests exist | GET PDF `?lang=id` and `?lang=en` for 5 printable services | Correct content, auth, content-type | PDF files | none |
| TC-SIK-001 | AC-SIK-001 | SIK proof | Student | P0 | Playwright/API | Student login | Submit initial SIK proof | Approval pending; final locked | screenshot, row id | cleanup |
| TC-SIK-002 | AC-SIK-002 | SIK approval/rejection | Admin/Staff | P0 | Playwright/API | Pending SIK proof | Approve one, reject one | Approved unlocks; rejected remains locked | screenshot | cleanup |
| TC-SIK-003 | AC-SIK-003 | SIK final | Student | P0 | Playwright/API | Approved proof | Submit final form | Normal workflow row complete | screenshot | cleanup |
| TC-CMS-001 | AC-CMS-ACTIVITY-001 | Activity image CRUD | Admin/Staff | P1 | Playwright/API | CMS user | Create, edit, drag/drop image, replace, delete | Homepage renders; fallback on missing file | screenshot | delete item |
| TC-CMS-002 | AC-CMS-INFO-001 | Information CRUD | Admin/Staff | P1 | Playwright/API | CMS user | Create published info with images, edit text/alt/fit | Public list/detail update | screenshot | delete post |
| TC-CMS-003 | AC-CMS-INFO-002 | Information replace one image | Admin/Staff | P1 | Playwright/API | Saved info image | Click `Ganti Gambar`, select file, save replacement | Only selected image changes; page does not navigate on file selection | trace | delete post |
| TC-CMS-004 | AC-CMS-PROFILE-001 | Profile CMS | Admin/Staff | P1 | Playwright/API | CMS user | Edit org node, location image/hours | Public `/profil` reflects change | screenshot | restore |
| TC-SUGGESTION-001 | AC-SUGGESTION-001 | Service suggestion | Guest/Student/Admin/Staff | P1 | Playwright/API | App running | Submit suggestion, view as admin/staff, update status/delete | Persisted and role-controlled | screenshot | delete suggestion |
| TC-SURVEY-001 | AC-SURVEY-001 | Survey flow | Student/Admin/Staff | P1 | Playwright/API | Completed eligible request | Submit survey; check summaries | Duplicate blocked; summaries update | screenshot | none |
| TC-SYSTEM-001 | AC-SYSTEM-001 | Password reset | Admin | P0 | Playwright/API | Test user exists | Reset password; login with new password | Legacy hash compatible; no password returned | response | restore password |
| TC-SEC-001 | AC-SEC-001 | DB unavailable | All | P0 | API/Manual | Isolated env where DB stopped | Hit read/write endpoints | Friendly 503 JSON or safe UI fallback | response | restart DB |
| TC-NFR-001 | AC-NFR-001 | Responsive admin | Admin/Staff | P1 | Manual/Playwright | Role sessions | View priority pages at required viewports | No clipped content, usable tables/filters | screenshots | none |
| TC-NFR-002 | AC-NFR-002 | Tutorial/focus | Admin/Staff | P1 | Manual/Playwright | Tutorial enabled | Open global/page tours, keyboard through | Focus visible, no hidden focused warning | console + screenshots | reset local state |

## Data-Driven Service Matrix

Run TC-SERVICE-001 and TC-SERVICE-003 for every slug in the service inventory: `kartu-prestasi-akademik`, `kartu-kemajuan-studi`, `rekomendasi-beasiswa`, `ket-tunjangan-orang-tua`, `keterangan-masih-kuliah`, `keterangan-kelakuan-baik`, `surat-pengantar`, `permohonan-magang-kerja-praktek-ta`, `surat-izin-kegiatan`, `keterangan-lulus`, `penerbitan-transkrip`, `penerbitan-ijazah`, `legalisir-ijazah-transkrip`, `bebas-peminjaman`, `unggah-karya-ilmiah`, `cek-plagiarisme`, `referensi`.

## Negative and Boundary Conditions

- Empty table states for requests, information, activities, surveys, suggestions, master data, alumni, system logs.
- Double-click submit and browser refresh after submit.
- Direct URL access to edit/detail pages.
- Missing physical file for images and attachments.
- Oversized, unsupported, and unsafe SVG fixtures.
- Network failure during upload.
- Concurrent CMS update where second user sees stale data.
- Back/forward navigation after create/edit/delete.

