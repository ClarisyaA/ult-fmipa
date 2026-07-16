# Application Inventory

## Roles

| Role | Confirmed source | Main access |
|---|---|---|
| Guest/Public | public route group and public APIs | `/`, `/layanan`, `/informasi`, `/profil`, `/survei`, `/usulkan-layanan` |
| Student | NextAuth role `student`; proxy and student APIs | submission pages, `/mahasiswa/riwayat`, student APIs |
| Staff | NextAuth role `staff`; proxy and staff APIs | `/staff/*`, request handling, CMS subsets |
| Admin | NextAuth role `admin`; proxy and admin APIs | `/admin/*`, system/master/reporting, all operational CMS |

## Page Inventory

| Route | Actor | Purpose | Priority | Test levels |
|---|---|---|---|---|
| `/` | Guest | Public homepage, services, activities, information | P1 | Manual, Playwright, NFR |
| `/informasi` | Guest | Published information list/search/filter | P1 | Manual, Playwright |
| `/informasi/[slug]` | Guest | Information detail and gallery | P1 | Manual, Playwright |
| `/layanan` | Guest | Service catalog | P1 | Manual, Playwright |
| `/layanan/[slug]` | Guest | Service detail | P1 | Manual, Playwright |
| `/layanan/[slug]/ajukan` | Student/Admin/Staff | Service request submission | P0 | Manual, API, Playwright |
| `/profil` | Guest | Profile structure and location | P1 | Manual, Playwright, responsive |
| `/survei` | Guest/Student | Survey landing/pending access | P2 | Manual, Playwright |
| `/usulkan-layanan` | Guest/Student | Submit service suggestion | P1 | Manual, API, Playwright |
| `/login` | All | Development credentials and PAUS entry | P0 | Manual, Playwright |
| `/auth/paus-bridge` | PAUS bridge | Bridge-token login client | P1 | API/Playwright |
| `/mahasiswa/riwayat` | Student | Student request history | P0 | Manual, API, Playwright |
| `/mahasiswa/riwayat/[serviceSlug]/[id]` | Student | Student-owned request detail | P0 | Manual, API, Playwright |
| `/admin/dashboard` | Admin | Aggregate dashboard | P0 | Manual, API, responsive |
| `/admin/requests` | Admin | Request queue, filters, inline actions | P0 | Manual, API, Playwright |
| `/admin/requests/[serviceSlug]/[id]` | Admin | Request detail, status, letter metadata, SIK | P0 | Manual, API, Playwright |
| `/admin/usulan-layanan` | Admin | Service suggestion management | P1 | Manual, API |
| `/admin/informasi`, `/admin/informasi/tambah`, `/admin/informasi/[id]/edit` | Admin | Information CMS | P1 | Manual, API, Playwright |
| `/admin/beranda/kegiatan`, `/admin/beranda/kegiatan/tambah`, `/admin/beranda/kegiatan/[id]/edit` | Admin | Homepage activity CMS and links | P1 | Manual, API, Playwright |
| `/admin/profil/struktur`, `/admin/profil/lokasi` | Admin | Profile CMS | P1 | Manual, API, responsive |
| `/admin/surveys` | Admin | Survey summary | P1 | Manual, API |
| `/admin/reports` | Admin | Reporting | P1 | Manual, API, NFR |
| `/admin/master/mahasiswa` | Admin | Student master data | P1 | Manual, API, responsive |
| `/admin/alumni/tracer-study` | Admin | Alumni tracer data | P1 | Manual, API, responsive |
| `/admin/system/levels`, `/admin/system/units`, `/admin/system/users`, `/admin/system/user-log` | Admin | System administration and logs | P1 | Manual, API, security |
| `/staff/dashboard` | Staff | Staff dashboard | P0 | Manual, API, responsive |
| `/staff/requests`, `/staff/requests/[serviceSlug]/[id]` | Staff | Staff queue/detail without admin-only deletes | P0 | Manual, API, Playwright |
| `/staff/usulan-layanan` | Staff | Service suggestion viewing/status | P1 | Manual, API |
| `/staff/informasi`, `/staff/informasi/tambah`, `/staff/informasi/[id]/edit` | Staff | Information CMS | P1 | Manual, API |
| `/staff/beranda/kegiatan`, `/staff/beranda/kegiatan/tambah`, `/staff/beranda/kegiatan/[id]/edit` | Staff | Homepage activity CMS | P1 | Manual, API |
| `/staff/profil/struktur`, `/staff/profil/lokasi` | Staff | Profile CMS | P1 | Manual, API |
| `/staff/surveys` | Staff | Survey summary | P1 | Manual, API |

## API Inventory

All discovered API route files are in scope for API/integration coverage unless noted.

| API group | Routes | Actor | Main behaviors |
|---|---|---|---|
| Auth/health | `/api/auth/[...nextauth]`, `/api/health` | All | providers/session callbacks, health response |
| Public services | `/api/services`, `/api/services/[slug]`, `/api/services/[slug]/links`, `/api/services/[slug]/requests`, `/api/services/surat-izin-kegiatan/requests/[id]/final` | Guest/Student | catalog, detail, links, submission, SIK final |
| Student | `/api/student/requests`, `/api/student/requests/[serviceSlug]/[id]`, `/api/student/requests/[serviceSlug]/[id]/survey`, `/api/student/surveys`, `/api/student/surveys/pending`, `/api/student/surveys/requests` | Student | owned history/detail/surveys |
| Requests shared | `/api/requests/[serviceSlug]/[id]/pdf`, `/api/requests/[serviceSlug]/[id]/letter-metadata`, `/api/requests/[serviceSlug]/[id]/email-draft`, `/api/attachments/[id]` | Auth scoped | PDFs, letter metadata, Gmail draft, attachment access |
| Admin requests | `/api/admin/requests`, `/api/admin/requests/export`, `/api/admin/requests/[serviceSlug]/[id]`, `/api/admin/requests/[serviceSlug]/[id]/status`, `/api/admin/requests/surat-izin-kegiatan/[id]/approval` | Admin | list/export/detail/delete/status/SIK approval |
| Staff requests | `/api/staff/requests`, `/api/staff/requests/[serviceSlug]/[id]`, `/api/staff/requests/[serviceSlug]/[id]/status`, `/api/staff/requests/surat-izin-kegiatan/[id]/approval` | Staff | list/detail/status/SIK approval |
| Public CMS reads | `/api/home/activities`, `/api/home/activities/images/[id]`, `/api/home/links`, `/api/information`, `/api/information/images/[imageId]`, `/api/profile/organization`, `/api/profile/location`, `/api/profile/images/[type]/[id]` | Guest | homepage/profile/information data and image delivery |
| Admin CMS | admin home, information, profile, service links endpoints | Admin | CRUD, upload, replace, delete, cover selection |
| Staff CMS | staff home, information, profile, service links endpoints | Staff | role-limited equivalents |
| Service suggestions | `/api/service-suggestions`, admin/staff suggestion routes | Guest/Admin/Staff | public create, staff/admin read/status/delete |
| Surveys | admin/staff survey summaries, student survey routes | Role-based | survey availability and result submission |
| Master/system | admin master mahasiswa, alumni tracer, system levels/units/users/user-log | Admin | CRUD, reset password, logs |
| Notifications | `/api/admin/notifications/requests`, `/api/staff/notifications/requests` | Admin/Staff | request notification counts/list |

## Service Inventory

| Slug | Title | Source table | Category | Special coverage |
|---|---|---|---|---|
| `kartu-prestasi-akademik` | Kartu Prestasi Akademik | `kpa` | Mahasiswa | card request |
| `kartu-kemajuan-studi` | Kartu Kemajuan Studi | `kks` | Mahasiswa | card request |
| `rekomendasi-beasiswa` | Rekomendasi Beasiswa | `beasiswa` | Mahasiswa | service link template |
| `ket-tunjangan-orang-tua` | Ket. Tunjangan Orang Tua | `masih_kuliah` | Mahasiswa | printable |
| `keterangan-masih-kuliah` | Keterangan Masih Kuliah | `masih_kuliah_aktif` | Mahasiswa | printable |
| `keterangan-kelakuan-baik` | Keterangan Kelakuan Baik | `kelakuan_baik` | Mahasiswa | printable |
| `surat-pengantar` | Surat Pengantar | `surat_pengantar` | Mahasiswa | normal workflow |
| `permohonan-magang-kerja-praktek-ta` | Permohonan Magang / Kerja Praktek / TA | `permohonan_magang` | Mahasiswa | printable, official template |
| `surat-izin-kegiatan` | Surat Izin Kegiatan | `surat_izin_kegiatan` | Mahasiswa | staged approval/final |
| `keterangan-lulus` | Keterangan Lulus | `keterangan_lulus` | Alumni | printable |
| `penerbitan-transkrip` | Penerbitan Transkrip | `transkrip` | Alumni | alumni |
| `penerbitan-ijazah` | Penerbitan Ijazah | `ijazah` | Alumni | alumni |
| `legalisir-ijazah-transkrip` | Legalisir Ijazah & Transkrip | `legalisir` | Alumni | alumni |
| `bebas-peminjaman` | Bebas Peminjaman | `bebas_pinjaman` | Perpustakaan | simple request |
| `unggah-karya-ilmiah` | Unggah Karya Ilmiah | `unggah_karya_ilmiah` | Perpustakaan | simple request |
| `cek-plagiarisme` | Cek Plagiarisme | `plagiarisme` | Perpustakaan | simple request |
| `referensi` | Referensi | `referensi` | Perpustakaan | simple request |

## CMS and Storage Inventory

- Homepage activities: `ult_home_activities`, storage `storage/home-activities`, safe SVG allowed, image fit `cover|contain`.
- Information: `ult_information_posts`, `ult_information_post_images`, storage `storage/information`, multi-image, cover, replace, delete, alt, image fit.
- Profile organization/location: profile CMS tables, storage `storage/profile/organization` and `storage/profile/location`, safe image rendering.
- Service links/home links: CMS-managed external URLs.
- Runtime upload attachments: `storage/uploads`, service-specific rules; official attachments do not accept SVG.

## PDF and Integration Inventory

- Printable PDF route: `/api/requests/[serviceSlug]/[id]/pdf?lang=id|en`.
- Printable services: `keterangan-lulus`, `ket-tunjangan-orang-tua`, `keterangan-masih-kuliah`, `keterangan-kelakuan-baik`, `permohonan-magang-kerja-praktek-ta`.
- Gmail helper: builds Gmail compose URL only; no SMTP/Gmail API, no auto-send, no auto-attach.
- PAUS integration: OAuth provider optional; bridge credentials provider exists.

