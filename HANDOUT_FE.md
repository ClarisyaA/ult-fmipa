# HANDOUT FE - ULT FMIPA Unpad

Dokumen ini adalah pegangan frontend untuk repo `ult-fmipa`. Isinya disusun dari route dan helper yang benar-benar ada di repo: `src/app`, `src/lib/legacy-services.ts`, `src/lib/service-upload-config.ts`, `src/lib/letters/*`, dan komponen frontend terkait.

## Daftar Isi

1. [Overview Project](#1-overview-project)
2. [Role Summary](#2-role-summary)
3. [Auth & Session](#3-auth--session)
4. [Public / Guest Frontend](#4-public--guest-frontend)
5. [Student Frontend](#5-student-frontend)
6. [Staff Frontend](#6-staff-frontend)
7. [Admin Frontend](#7-admin-frontend)
8. [Request Workflow](#8-request-workflow)
9. [SIK Special Workflow](#9-sik-special-workflow)
10. [Magang / KP / TA Special Flow](#10-magang--kp--ta-special-flow)
11. [Attachments & Files](#11-attachments--files)
12. [Official Letter / PDF Flow](#12-official-letter--pdf-flow)
13. [Email / Gmail Helper](#13-email--gmail-helper)
14. [CMS Frontend](#14-cms-frontend)
15. [Reports, Master Data, and System Admin](#15-reports-master-data-and-system-admin)
16. [API Error Handling](#16-api-error-handling)
17. [Frontend Implementation Notes](#17-frontend-implementation-notes)
18. [Local Setup Summary](#18-local-setup-summary)
19. [Developer QA Checklist](#19-developer-qa-checklist)

## 1. Overview Project

ULT FMIPA Unpad adalah aplikasi layanan terpadu berbasis Next.js App Router untuk katalog layanan publik, pengajuan mahasiswa, pemrosesan admin/staff, CMS konten, survei, surat resmi PDF, dan helper Gmail compose.

Stack utama:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui dan Radix UI
- Prisma 7
- MariaDB
- NextAuth v4
- `@react-pdf/renderer` untuk PDF surat resmi

Flow database lokal:

- `database/fmipa_sbpk.sql` adalah base legacy dump.
- Jalankan `pnpm db:prisma-migrate`.
- Jalankan `pnpm db:support-migrate`.
- Support migrations aktif ada di `database/migrations`.
- Jangan menjalankan `database/migrations_legacy_backup` sebagai migration aktif.

## 2. Role Summary

| Role | Area | Main Capabilities |
| --- | --- | --- |
| Public | `/`, `/layanan`, `/informasi`, `/profil`, `/survei` | Melihat konten publik, katalog layanan, informasi, profil, dan halaman survei |
| Student | `/layanan/[slug]/ajukan`, `/mahasiswa/riwayat` | Submit request, upload attachment, melihat riwayat, mengisi survei |
| Staff | `/staff/*` | Memproses request, verifikasi SIK, mengelola CMS staff, menyimpan Data Surat, mencetak PDF, membuka Gmail helper |
| Admin | `/admin/*` | Semua workflow request, CMS, master data, reports, users/system, printable letters |

## 3. Auth & Session

Auth memakai NextAuth di `GET/POST /api/auth/[...nextauth]`.

Provider yang ada:

- Development Credentials dari `.env`: `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, `DEV_STAFF_EMAIL`, `DEV_STAFF_PASSWORD`, `DEV_STUDENT_EMAIL`, `DEV_STUDENT_PASSWORD`.
- DB credential user melalui `authorizeDbCredentialUser`.
- PAUS bridge melalui `/auth/paus-bridge`.
- PAUS OAuth modern bila env OAuth tersedia.

Session memakai JWT. Field penting:

- `session.user.role`: `admin`, `staff`, atau `student`.
- `session.user.npm`: identitas mahasiswa bila tersedia.
- `session.user.nip`: identitas staff/admin bila tersedia.

Aturan FE:

- Protected API tidak boleh percaya NPM dari client sebagai identitas utama; backend memakai session.
- API admin/staff/student mengembalikan `401` bila belum login dan `403` bila role tidak sesuai.
- Halaman protected melakukan redirect/guard via server component/layout, bukan middleware global di repo ini.
- Endpoint PDF dan Data Surat hanya untuk admin/staff.

## 4. Public / Guest Frontend

### Pages

| Page | Purpose | Main API / Data |
| --- | --- | --- |
| `/` | Homepage ULT, hero, layanan, informasi, profil ringkas, kegiatan | `GET /api/home/activities`, `GET /api/home/links`, public helpers |
| `/layanan` | Katalog layanan publik | `GET /api/services` |
| `/layanan/[slug]` | Detail layanan | `GET /api/services/[slug]`, `GET /api/services/[slug]/links` |
| `/layanan/[slug]/ajukan` | Form submit layanan, login student dibutuhkan saat submit | `GET /api/services/[slug]`, `POST /api/services/[slug]/requests` |
| `/usulkan-layanan` | Form internal usulan layanan baru/pengembangan layanan | `POST /api/service-suggestions` |
| `/informasi` | List informasi publik | `GET /api/information` |
| `/informasi/[slug]` | Detail informasi publik | Server helper, tidak ada route `GET /api/information/[slug]` di repo ini |
| `/profil` | Profil organisasi dan lokasi | `GET /api/profile/organization`, `GET /api/profile/location` |
| `/survei` | Halaman survei mahasiswa | `GET /api/student/surveys/requests`, `POST /api/student/surveys` saat login student |

### Public APIs

| Method | Route | Response | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/services` | JSON katalog layanan | Public |
| `GET` | `/api/services/[slug]` | JSON detail layanan | Slug legacy tertentu dikanonisasi |
| `GET` | `/api/services/[slug]/links` | JSON link template layanan | Saat ini relevan untuk template rekomendasi beasiswa |
| `GET` | `/api/home/activities` | `{ data: PublicHomeActivity[] }` | Hanya activity aktif |
| `GET` | `/api/home/activities/images/[id]` | Image/blob atau 404 | UI harus fallback bila storage lokal hilang |
| `GET` | `/api/home/links` | JSON academic calendar link | Route sebenarnya bukan `/api/home/links/academic-calendar` untuk public |
| `GET` | `/api/information` | JSON list informasi publish | Tidak ada public detail API by slug |
| `GET` | `/api/information/images/[imageId]` | Image/blob atau 404 | Storage path tidak diekspos |
| `GET` | `/api/profile/organization` | JSON tree struktur aktif | Public |
| `GET` | `/api/profile/location` | JSON lokasi dan jam layanan aktif | Public |
| `GET` | `/api/profile/images/[type]/[id]` | Image/blob atau 404 | `type` sesuai implementasi profile image route |
| `POST` | `/api/service-suggestions` | `{ success: true, data: { id } }` | Submit usulan layanan internal; tidak memakai Google Form |

### Usulan Layanan Internal

Tombol `Usulkan Layanan` di homepage mengarah ke `/usulkan-layanan`, bukan Google Form eksternal. Form menyimpan data ke tabel `ult_service_suggestions`.

Field form:

- `Nama *`, maksimal 200 karakter.
- `NPM *`, maksimal 50 karakter.
- `Layanan yang ingin diajukan *`, maksimal 200 karakter.
- `Detail Layanan yang ingin diajukan *`, maksimal 2000 karakter.
- `Saran peningkatan layanan yang sudah ada` opsional, maksimal 2000 karakter.

Jika user login sebagai mahasiswa dan session menyediakan `session.user.npm`, NPM diprefill dan read-only. Backend tetap memakai NPM dari session mahasiswa bila tersedia.

Loading state: tampilkan skeleton atau fallback content. Empty state: tampilkan pesan netral seperti "Belum ada informasi." Error state: tampilkan pesan ramah; jangan tampilkan raw DB error.

Catatan storage:

- Seluruh file upload (attachment, gambar Informasi/Kegiatan Mahasiswa/Profil)
  disimpan di MinIO (object storage), bukan filesystem lokal. Lihat
  `README.md` § MinIO Object Storage dan `docs/minio-storage-deployment.md`.
- Missing object MinIO membuat API image return 404 secara aman; UI harus
  menampilkan placeholder/fallback, bukan crash.
- Khusus Informasi CMS, jika gambar lama hilang, buka admin Informasi edit
  page lalu unggah ulang gambar pengganti.
- Gunakan `pnpm storage:audit` untuk mengecek konsistensi metadata DB vs
  object MinIO.

## 5. Student Frontend

### 5.1 Submit Service Request

Page: `/layanan/[slug]/ajukan`.

API:

- `GET /api/services/[slug]`
- `POST /api/services/[slug]/requests`
- Khusus SIK final: `PATCH /api/services/surat-izin-kegiatan/requests/[id]/final`

Aturan form umum:

- `email` wajib untuk semua layanan.
- `bahasaSurat` wajib untuk semua layanan:
  - `id` = Bahasa Indonesia
  - `en` = Bahasa Inggris
- Field wajib tampil dengan `*`.
- Field opsional tampil dengan `Opsional`.
- Upload field tampil sebagai `Wajib` atau `Opsional`.
- Jika ada file, gunakan `FormData`; jangan set `Content-Type` manual.
- Email tersimpan ke tabel request dan dipakai Gmail helper.
- `BAHASA_SURAT` adalah preferensi mahasiswa; admin/staff tetap bisa mencetak Indo atau Inggris manual.

Field umum yang benar-benar dibaca form:

```text
npm
nama
programStudi
email
bahasaSurat
phone
description
attachments
```

Field layanan khusus:

```text
scholarshipName
semester
tahunAkademik
namaOrangTua
nipNrp
pangkatGolongan
instansi
pengantar
ditujukan
dasarSuratNo
dasarSuratPerihal
dasarSuratTgl
tempatLahir
tanggalLahir
tanggalLulus / tglLulus
ipk
yudisium
jumlahTranskrip
jumlahIjazah
jumlahTranslet
jenisPermohonan
kontakPerson
tempatPelaksanaan
tujuanSurat
alamatSurat
kecamatanKabupaten
kotaKabupaten
provinsi
tanggalMulai
tanggalSelesai
```

Success umum:

```json
{
  "data": {
    "id": "123",
    "requestId": "123",
    "serviceSlug": "kartu-prestasi-akademik",
    "serviceTitle": "Kartu Prestasi Akademik",
    "status": "pending",
    "attachmentCount": 1
  },
  "message": "Pengajuan layanan berhasil dikirim."
}
```

### 5.2 Student Request History

Pages:

- `/mahasiswa/riwayat`
- `/mahasiswa/riwayat/[serviceSlug]/[id]`

APIs:

- `GET /api/student/requests`
- `GET /api/student/requests/[serviceSlug]/[id]`
- `GET /api/attachments/[id]` untuk file milik mahasiswa tersebut.

Query list:

```text
page=1
limit=10
service={serviceSlug}
status=pending | inProgress | completed | delivered
```

Status label:

| API status | Label |
| --- | --- |
| `pending` | Menunggu |
| `inProgress` | Diproses |
| `completed` | Selesai |
| `delivered` | Diambil/Dikirim |

Detail menampilkan identitas request, service fields, attachments, status timeline, dan status survey jika pengajuan sudah selesai/dikirim.

### 5.3 Student Survey

APIs:

- `GET /api/student/surveys/requests`
- `GET /api/student/surveys/pending`
- `POST /api/student/surveys`
- `GET /api/student/requests/[serviceSlug]/[id]/survey`
- `POST /api/student/requests/[serviceSlug]/[id]/survey`

Payload:

```json
{
  "serviceSlug": "kartu-prestasi-akademik",
  "requestId": "123",
  "overallRating": 5,
  "ratingTangibility": 5,
  "ratingReliability": 5,
  "ratingResponsiveness": 4,
  "ratingAssurance": 5,
  "ratingEmpathy": 5,
  "comment": "Pelayanan cepat."
}
```

Rules:

- `overallRating` wajib.
- Rating 1-5.
- Komentar maksimal 500 karakter.
- Survey hanya untuk request milik mahasiswa dan status `completed` atau `delivered`.
- Satu request memiliki satu survey; submit berikutnya memperbarui data sesuai behavior endpoint.

### 5.4 Student Service List

| Service | Slug | Table | Upload | Printable | Special Notes |
| --- | --- | --- | --- | --- | --- |
| Kartu Prestasi Akademik | `kartu-prestasi-akademik` | `kpa` | Opsional, default 3 file, 5 MB | Tidak | Form umum |
| Kartu Kemajuan Studi | `kartu-kemajuan-studi` | `kks` | Opsional, default 3 file, 5 MB | Tidak | Form umum |
| Rekomendasi Beasiswa | `rekomendasi-beasiswa` | `beasiswa` | Wajib, 3 file, 5 MB | Tidak | Link template Google Docs dari `/api/services/[slug]/links` |
| Ket. Tunjangan Orang Tua | `ket-tunjangan-orang-tua` | `masih_kuliah` | Opsional | Ya | Field orang tua dan semester |
| Keterangan Masih Kuliah | `keterangan-masih-kuliah` | `masih_kuliah_aktif` | Opsional | Ya | Field semester, tahun akademik, alamat |
| Keterangan Kelakuan Baik | `keterangan-kelakuan-baik` | `kelakuan_baik` | Opsional | Ya | Field alamat |
| Surat Pengantar | `surat-pengantar` | `surat_pengantar` | Wajib, 3 file, 5 MB | Tidak | Field pengantar dan tujuan |
| Keterangan Lulus | `keterangan-lulus` | `keterangan_lulus` | Opsional | Ya | Field kelulusan, IPK, Yudisium |
| Penerbitan Transkrip | `penerbitan-transkrip` | `transkrip` | Opsional | Tidak | Field jumlah transkrip |
| Penerbitan Ijazah | `penerbitan-ijazah` | `ijazah` | Opsional | Tidak | Field jumlah ijazah |
| Legalisir Ijazah & Transkrip | `legalisir-ijazah-transkrip` | `legalisir` | Opsional | Tidak | Field jumlah ijazah/transkrip/terjemahan |
| Bebas Peminjaman | `bebas-peminjaman` | `bebas_pinjaman` | Opsional | Tidak | Perpustakaan |
| Unggah Karya Ilmiah | `unggah-karya-ilmiah` | `unggah_karya_ilmiah` | Opsional | Tidak | Perpustakaan |
| Cek Plagiarisme | `cek-plagiarisme` | `plagiarisme` | Opsional | Tidak | Perpustakaan |
| Referensi | `referensi` | `referensi` | Opsional | Tidak | Perpustakaan |
| Magang/KP/TA | `permohonan-magang-kerja-praktek-ta` | `permohonan_magang` | Wajib PDF, max 5 file, 10 MB | Ya | PDF surat permohonan dari prodi wajib |
| Surat Izin Kegiatan | `surat-izin-kegiatan` | `surat_izin_kegiatan` | Wajib per tahap SIK | Tidak | Workflow staged: approval proof lalu final SPIK |

Default upload rule: max 3 file, max 5 MB, PDF/JPG/PNG.

## 6. Staff Frontend

Pages:

- `/staff/dashboard`
- `/staff/requests`
- `/staff/requests/[serviceSlug]/[id]`
- `/staff/beranda/kegiatan`
- `/staff/beranda/kegiatan/tambah`
- `/staff/beranda/kegiatan/[id]/edit`
- `/staff/informasi`
- `/staff/informasi/tambah`
- `/staff/informasi/[id]/edit`
- `/staff/profil/struktur`
- `/staff/profil/lokasi`
- `/staff/surveys`
- `/staff/usulan-layanan`

Capabilities staff:

- Melihat dashboard dan ringkasan.
- Melihat dan filter list request.
- Membuka detail request.
- Update status: process, complete, deliver, dan cancel action yang tersedia.
- Verifikasi/reject SIK approval proof.
- Melihat/download attachment via `/api/attachments/[id]`.
- Menyimpan Data Surat untuk layanan printable.
- Mencetak `Cetak Surat Indo` dan `Cetak Surat Inggris`.
- Membuka Gmail compose helper.
- Mengelola CMS staff yang routenya tersedia: kegiatan beranda, informasi, profil struktur, profil lokasi, service links/home links.
- Melihat usulan layanan, membuka detail, menandai ditinjau, dan mengarsipkan usulan.

Restrictions staff:

- Tidak punya route `/staff/master/*` atau `/staff/system/*`.
- `DELETE /api/staff/requests/[serviceSlug]/[id]` ada tetapi return `403`; delete request efektif admin-only.
- Tidak ada CSV export staff; export route hanya `/api/admin/requests/export`.

Staff APIs utama:

- `GET /api/staff/summary`
- `GET /api/staff/notifications/requests`
- `GET /api/staff/requests`
- `GET /api/staff/requests/[serviceSlug]/[id]`
- `PATCH /api/staff/requests/[serviceSlug]/[id]/status`
- `PATCH /api/staff/requests/surat-izin-kegiatan/[id]/approval`
- `GET /api/staff/service-suggestions`
- `GET /api/staff/service-suggestions/[id]`
- `PATCH /api/staff/service-suggestions/[id]` dengan status `new`, `reviewed`, atau `archived`
- CMS staff routes di section CMS.

## 7. Admin Frontend

Pages:

- `/admin/dashboard`
- `/admin/requests`
- `/admin/requests/[serviceSlug]/[id]`
- `/admin/beranda/kegiatan`
- `/admin/beranda/kegiatan/tambah`
- `/admin/beranda/kegiatan/[id]/edit`
- `/admin/informasi`
- `/admin/informasi/tambah`
- `/admin/informasi/[id]/edit`
- `/admin/profil/struktur`
- `/admin/profil/lokasi`
- `/admin/master/mahasiswa`
- `/admin/alumni/tracer-study`
- `/admin/reports`
- `/admin/surveys`
- `/admin/usulan-layanan`
- `/admin/system/users`
- `/admin/system/levels`
- `/admin/system/units`
- `/admin/system/user-log`

Capabilities admin:

- Semua capability staff.
- Delete request jika source table termasuk rule delete backend.
- Export CSV request.
- Mengelola CMS.
- Mengelola master mahasiswa dan tracer alumni.
- Mengelola users, levels, units, dan user log.
- Mengelola service/home links.
- Melihat dan memperbarui status usulan layanan.
- Memproses semua request workflow.

### Admin Tutorial Overlay

Route trigger:

- Global admin tour: `/admin/dashboard?tour=admin&step=0`
- Page tutorial: `{current-admin-route}?tour=page&step=0`

Setiap halaman admin memiliki tombol `Tutorial` dari layout admin. Di dashboard, tombol membuka pilihan `Tutorial Lengkap Admin` atau `Tutorial Halaman Ini`. Di halaman admin lain, tombol langsung memulai tutorial khusus halaman tersebut.

Komponen utama:

- `src/components/tutorial/admin-tutorial-button.tsx`
- `src/components/tutorial/admin-dashboard-tutorial-button.tsx`
- `src/components/tutorial/admin-tutorial-overlay.tsx`
- `src/lib/admin-tutorial-steps.ts`
- `src/lib/admin-page-tutorial-steps.ts`
- `src/lib/tutorial-types.ts`

Perilaku:

- Tutorial tidak auto-open.
- Global tour memakai query `tour=admin&step=N` dan boleh berpindah antar halaman admin.
- Page tutorial memakai query `tour=page&step=N` dan tetap menjelaskan halaman yang sedang dibuka.
- Overlay dipasang di `src/app/admin/layout.tsx`, sehingga tetap aktif saat step berpindah route admin.
- Step menyimpan progres sementara di `localStorage` dengan key `ult-admin-tutorial-active`, `ult-admin-tutorial-step`, dan `ult-admin-tutorial-mode`.
- Global step memiliki `route` nyata, lalu overlay menavigasi ke route tersebut dan menyorot elemen `data-tour` jika tersedia.
- Page step diambil dari `getAdminPageTutorialSteps(pathname, searchParams)` dan tidak memaksa pindah halaman.
- Step request yang butuh panel detail dapat memakai `onCta: "open-first-request-preview"` dan `previewService` untuk membuka contoh detail dari row yang tersedia.
- Overlay mendukung `Lanjut`, `Sebelumnya`, `Lewati`, `Selesai`, tombol `X`, `Escape`, `ArrowRight`, dan `ArrowLeft`.
- Overlay memakai highlight ringan tanpa blur/dim gelap berat agar admin tetap bisa membaca halaman.
- Jika target preview/detail belum terlihat, overlay mencoba membuka contoh detail dari data row yang ada. Jika tidak ada data, tampil fallback: admin diminta klik `Detail` setelah ada pengajuan.
- `Selesai` menyimpan `ult-admin-tutorial-completed` di `localStorage`.
- Opsi `Jangan tampilkan lagi di browser ini` untuk global tour menyimpan `ult-admin-tutorial-dismissed`.
- Opsi yang sama untuk page tutorial menyimpan `ult-admin-page-tutorial-dismissed` dan key tambahan per pathname.

Pola target:

```tsx
data-tour="admin-sidebar-requests"
data-tour="admin-dashboard-summary"
data-tour="admin-requests-filters"
data-tour="admin-request-email-helper"
data-tour="admin-requests-row-detail-button"
data-tour="admin-preview-student-data"
```

Target yang dipakai sekarang mencakup dashboard summary/latest, tombol tutorial, filter pengajuan, status tabs, urutan terbaru/terlama, tabel pengajuan, tombol detail row, panel detail, data pemohon, data layanan, workflow, lampiran, download data, Data Surat, cetak PDF, Gmail helper, verifikasi SIK, usulan layanan, informasi, kegiatan, profil, survei, reporting, data mahasiswa, tracer alumni, data level, unit, user, user log, shortcut website publik, lonceng notifikasi, dan area akun/logout.

Target preview/detail request penting:

```tsx
data-tour="admin-requests-table"
data-tour="admin-requests-row-detail-button"
data-tour="admin-requests-preview-panel"
data-tour="admin-preview-student-data"
data-tour="admin-preview-request-data"
data-tour="admin-preview-attachments"
data-tour="admin-preview-status-actions"
data-tour="admin-preview-letter-metadata"
data-tour="admin-preview-print-buttons"
data-tour="admin-preview-email-helper"
data-tour="admin-preview-delete-action"
```

Aturan konten step:

- Judul pendek, idealnya maksimal sekitar 6 kata.
- Body 2-3 kalimat pendek.
- Bahasa ramah dan jelas, tidak terlalu birokratis.
- Untuk fitur pengajuan, tetap sebut alur penting: pilih layanan, urutkan terbaru/terlama, buka detail, isi Data Surat, cetak PDF Indo/Inggris, Gmail helper, dan verifikasi SIK.
- Untuk CMS dinamis, jelaskan tambah/edit konten, upload gambar, image fit `cover/contain`, status publikasi, dan cek halaman publik.
- Untuk reporting/data, jelaskan sumber data, filter sebelum download, dan pemakaian data secara bertanggung jawab.

Menambah tutorial halaman baru:

1. Tambahkan target `data-tour` pada elemen UI yang ingin disorot.
2. Tambahkan step di `src/lib/admin-page-tutorial-steps.ts`.
3. Jika step membutuhkan contoh detail request, gunakan `onCta: "open-first-request-preview"` dan isi `previewService` bila perlu.
4. Jaga overlay tetap ringan: tidak pakai backdrop blur dan tidak pakai dim gelap.

Preview URL pattern request:

```text
/admin/requests?service={slug}&previewService={slug}&previewId={id}
```

Admin APIs utama:

- `GET /api/admin/summary`
- `GET /api/admin/notifications/requests`
- `GET /api/admin/requests`
- `GET /api/admin/requests/[serviceSlug]/[id]`
- `PATCH /api/admin/requests/[serviceSlug]/[id]/status`
- `DELETE /api/admin/requests/[serviceSlug]/[id]`
- `GET /api/admin/requests/export`
- `PATCH /api/admin/requests/surat-izin-kegiatan/[id]/approval`
- `GET /api/admin/service-suggestions`
- `GET /api/admin/service-suggestions/[id]`
- `PATCH /api/admin/service-suggestions/[id]` dengan status `new`, `reviewed`, atau `archived`
- Master/system/CMS routes di section terkait.

### Usulan Layanan Admin/Staff

Tabel: `ult_service_suggestions`.

Kolom utama:

- `NAMA`, `NPM`, `LAYANAN_DIAJUKAN`, `DETAIL_LAYANAN`, `SARAN_PENINGKATAN`.
- `STATUS`: `new`, `reviewed`, `archived`.
- `ADMIN_NOTE`, `CREATED_AT`, `UPDATED_AT`.

Viewer tersedia di `/admin/usulan-layanan` dan `/staff/usulan-layanan`. Admin/staff dapat melihat list, membuka detail, menyimpan catatan, menandai ditinjau, dan mengarsipkan usulan.

## 8. Request Workflow

Workflow normal:

1. New/submitted: row dibuat, `PERMINTAAN_TGL` terisi.
2. Process: action `process`, `PROSES_TGL` terisi.
3. Complete: action `complete`, `SELESAI_TGL` terisi.
4. Deliver/Sent: action `deliver`, `DIKIRIM_TGL` terisi.

Cancel action yang tersedia di API status:

```text
cancelProcess
cancelComplete
cancelDeliver
```

Status APIs:

- `PATCH /api/admin/requests/[serviceSlug]/[id]/status`
- `PATCH /api/staff/requests/[serviceSlug]/[id]/status`

Body:

```json
{ "action": "process" }
```

```json
{ "action": "complete" }
```

```json
{ "action": "deliver" }
```

Backend juga menerima `staffName` jika dikirim UI.

Role action:

- Admin: process/complete/deliver/cancel/delete jika didukung.
- Staff: process/complete/deliver/cancel; delete request ditolak.
- Student: tidak bisa mengubah backend status.

## 9. SIK Special Workflow

Slug: `surat-izin-kegiatan`. Table: `surat_izin_kegiatan`.

Alur:

1. Mahasiswa upload bukti ACC Manajer Akademik dan Kemahasiswaan.
2. Admin/staff review bukti.
3. Admin/staff approve atau reject.
4. Jika rejected, alasan disimpan dan mahasiswa melihat reason.
5. Jika approved, form final SIK terbuka.
6. Mahasiswa submit form final + SPIK final.
7. Workflow normal baru berjalan: process, complete, deliver.

APIs:

- `POST /api/services/surat-izin-kegiatan/requests`
- `PATCH /api/admin/requests/surat-izin-kegiatan/[id]/approval`
- `PATCH /api/staff/requests/surat-izin-kegiatan/[id]/approval`
- `PATCH /api/services/surat-izin-kegiatan/requests/[id]/final`

Approve:

```json
{ "action": "approve" }
```

Reject:

```json
{
  "action": "reject",
  "reason": "Alasan penolakan..."
}
```

Final FormData fields:

```text
namaHimpunan
namaKegiatan
tanggalKegiatan
emailPengiriman
noHpWa
bahasaSurat
attachments
```

Upload rule SIK:

- Approval proof: key service rule `surat-izin-kegiatan:approval-proof`, wajib, max 5 file, 10 MB, PDF/JPG/PNG.
- Final SPIK: key service rule `surat-izin-kegiatan:final-spik`, wajib, max 5 file, 10 MB, PDF/JPG/PNG.

Error penting:

- `400`: action invalid atau reason terlalu panjang.
- `409`: state tidak sesuai, misalnya final belum boleh dikirim.
- `503`: database unavailable.

## 10. Magang / KP / TA Special Flow

Slug: `permohonan-magang-kerja-praktek-ta`. Table: `permohonan_magang`.

Required upload:

- PDF surat permohonan dari program studi.
- Max 5 file.
- Max 10 MB per file.
- PDF only.
- Attachment type: `program_study_request_letter`.

Fields:

```text
JENIS_PERMOHONAN
KONTAK_PERSON
TEMPAT_PELAKSANAAN
TUJUAN_SURAT
ALAMAT_SURAT
KECAMATAN_KABUPATEN
KOTA_KABUPATEN
PROVINSI
TANGGAL_MULAI
TANGGAL_SELESAI
EMAIL
BAHASA_SURAT
```

Behavior:

- Printable PDF tersedia.
- Data Surat wajib lengkap sebelum print.
- PDF route mendukung Indo/Inggris.
- Workflow status normal seperti layanan printable lain.

## 11. Attachments & Files

Routes file:

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/attachments/[id]` | Student owner/admin/staff | File attachment, bukan JSON |
| `GET` | `/api/home/activities/images/[id]` | Public untuk active, admin/staff untuk nonactive | Image activity |
| `GET` | `/api/information/images/[imageId]` | Public/admin/staff | Image informasi |
| `GET` | `/api/profile/images/[type]/[id]` | Public/admin/staff | Image profile |

Security notes:

- Jangan tampilkan internal storage path.
- Jangan tampilkan `PERMINTAAN_IP`.
- Official document attachment tidak menerima SVG; default hanya PDF/JPG/PNG.
- CMS image upload bisa menerima SVG, tetapi validasi safe SVG harus lolos.
- Missing local files boleh return 404; UI wajib fallback.

## 12. Official Letter / PDF Flow

Printable services:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`
- `permohonan-magang-kerja-praktek-ta`

Data Surat routes:

- `GET /api/requests/[serviceSlug]/[id]/letter-metadata`
- `PATCH /api/requests/[serviceSlug]/[id]/letter-metadata`

PDF routes:

- `GET /api/requests/[serviceSlug]/[id]/pdf?lang=id`
- `GET /api/requests/[serviceSlug]/[id]/pdf?lang=en`
- `GET /api/requests/[serviceSlug]/[id]/pdf` fallback ke `BAHASA_SURAT`, lalu `id`.

Invalid language returns `400` with:

```text
Bahasa surat tidak valid.
```

Missing required Data Surat returns `422`.

Data Surat common fields:

```text
TTD_NO_SURAT
TTD_TANGGAL
TTD_TEMPAT
TTD_PANGKAT_GOLONGAN
TTD_JABATAN
TTD_NAMA
TTD_NIP
BAHASA_SURAT
```

Additional fields:

```text
// keterangan-lulus
TEMPAT_LAHIR
TGL_LAHIR
TGL_LULUS
IPK
YUDISIUM
DASAR_SURAT_NO
DASAR_SURAT_PERIHAL
DASAR_SURAT_TGL
TTD_TANGGAL_BERLAKU
TTD_AN

// magang
TTD_AN
TTD_PANGKAT_GOLONGAN
```

UI Data Surat:

- `Simpan` adalah primary action.
- `Cetak Surat Indo` dan `Cetak Surat Inggris` adalah secondary/outline.
- Jika readiness belum lengkap, tampilkan: `Lengkapi Data Surat sebelum mencetak PDF resmi.`
- `BAHASA_SURAT` tetap preferensi mahasiswa; admin/staff bisa print manual dua bahasa.
- Signer picker tersedia bila data master penandatangan ada.

## 13. Email / Gmail Helper

API:

- `GET /api/requests/[serviceSlug]/[id]/email-draft`

Fitur ini Level 1:

- Hanya Gmail compose URL.
- Tidak ada SMTP.
- Tidak ada Gmail API.
- Tidak auto-send.
- Tidak auto-attach.
- Attachment/PDF harus dilampirkan manual oleh admin/staff.

Response fields:

```ts
type RequestEmailDraft = {
  recipientEmail: string | null;
  hasRecipientEmail: boolean;
  subject: string;
  body: string;
  gmailComposeUrl: string;
  serviceTitle: string;
  supportsGeneratedPdf: boolean;
  pdfUrl: string | null;
  attachmentInstruction: string;
};
```

Recipient priority current code:

1. Email di detail request: `EMAIL` atau `EMAIL_PENGIRIMAN`.
2. Khusus `keterangan_lulus`, fallback ke email alumni by NPM.
3. Jika tetap kosong, `recipientEmail = null` dan UI harus menampilkan warning.

Jika `supportsGeneratedPdf = true`, `pdfUrl` saat ini mengarah ke `/api/requests/{serviceSlug}/{id}/pdf`; admin/staff tetap membuka/unduh PDF dan melampirkan manual.

## 14. CMS Frontend

### Homepage Activities dan Links

Pages admin/staff:

- `/admin/beranda/kegiatan`
- `/admin/beranda/kegiatan/tambah`
- `/admin/beranda/kegiatan/[id]/edit`
- `/staff/beranda/kegiatan`
- `/staff/beranda/kegiatan/tambah`
- `/staff/beranda/kegiatan/[id]/edit`

APIs:

- `GET/POST /api/admin/home/activities`
- `GET/PATCH/DELETE /api/admin/home/activities/[id]`
- `GET/POST /api/staff/home/activities`
- `GET/PATCH/DELETE /api/staff/home/activities/[id]`
- `GET /api/admin/home/links`
- `PATCH /api/admin/home/links/academic-calendar`
- `GET /api/staff/home/links`
- `PATCH /api/staff/home/links/academic-calendar`

Activity fields:

```text
title
eyebrow
description
imageAlt
imageFit = cover | contain
isActive
sortOrder
image
```

### Information CMS

Pages admin/staff:

- `/admin/informasi`
- `/admin/informasi/tambah`
- `/admin/informasi/[id]/edit`
- `/staff/informasi`
- `/staff/informasi/tambah`
- `/staff/informasi/[id]/edit`

APIs:

- `GET/POST /api/admin/information`
- `GET/PATCH/DELETE /api/admin/information/[id]`
- `POST /api/admin/information/[id]/images`
- `PATCH/DELETE /api/admin/information/[id]/images/[imageId]`
- `POST /api/admin/information/[id]/images/[imageId]/cover`
- Staff equivalent under `/api/staff/information...`

Public list route is `/api/information`; public detail page does not use a public `[slug]` API route.

### Profile CMS

Pages:

- `/admin/profil/struktur`
- `/admin/profil/lokasi`
- `/staff/profil/struktur`
- `/staff/profil/lokasi`

APIs:

- `GET/POST /api/admin/profile/organization`
- `GET/PATCH/DELETE /api/admin/profile/organization/[id]`
- `GET/PATCH /api/admin/profile/location`
- `POST /api/admin/profile/location/hours`
- `PATCH/DELETE /api/admin/profile/location/hours/[id]`
- Staff equivalents under `/api/staff/profile/...`

Organization fields:

```text
parentId
name
positionTitle
roleLabel
photoAlt
colorVariant = emerald | red | amber
isActive
sortOrder
image
```

Current UI auto-fills `roleLabel` from `positionTitle`.

### Service Links

APIs:

- `GET /api/services/[slug]/links`
- `GET /api/admin/service-links`
- `PATCH /api/admin/service-links/rekomendasi-beasiswa/scholarship-recommendation-template`
- `GET /api/staff/service-links`
- `PATCH /api/staff/service-links/rekomendasi-beasiswa/scholarship-recommendation-template`

URL harus absolut `http://` atau `https://`.

## 15. Reports, Master Data, and System Admin

Admin-only pages/APIs:

| Feature | Page | APIs |
| --- | --- | --- |
| Reports | `/admin/reports` | Menggunakan summary/list/export yang sudah ada |
| Master Mahasiswa | `/admin/master/mahasiswa` | `POST /api/admin/master/mahasiswa`, `PATCH/DELETE /api/admin/master/mahasiswa/[npm]` |
| Tracer Alumni | `/admin/alumni/tracer-study` | `POST /api/admin/alumni/tracer-study`, `PATCH/DELETE /api/admin/alumni/tracer-study/[id]` |
| Levels | `/admin/system/levels` | `POST /api/admin/system/levels`, `PATCH/DELETE /api/admin/system/levels/[id]` |
| Units | `/admin/system/units` | `POST /api/admin/system/units`, `PATCH/DELETE /api/admin/system/units/[id]` |
| Users | `/admin/system/users` | `POST /api/admin/system/users`, `PATCH/DELETE /api/admin/system/users/[username]` |
| User Log | `/admin/system/user-log` | `GET /api/admin/system/user-log` |
| Surveys | `/admin/surveys` | `GET /api/admin/surveys/summary` |

Staff surveys:

- `/staff/surveys`
- `GET /api/staff/surveys/summary`

User management notes:

- Password tidak pernah dikirim balik ke FE.
- Password minimal 8 karakter dan konfirmasi harus cocok.
- Akun yang sedang login tidak boleh dinonaktifkan/diturunkan/dihapus.
- Delete user bisa diblokir bila masih punya activity; nonaktifkan sebagai fallback.

## 16. API Error Handling

Common statuses:

| Status | Meaning |
| --- | --- |
| `400` | Validasi/payload salah |
| `401` | Belum login |
| `403` | Role tidak sesuai |
| `404` | Data/route tidak ditemukan |
| `409` | Konflik atau butuh konfirmasi |
| `422` | Data surat/print belum lengkap |
| `503` | Database unavailable |

DB unavailable standard payload:

```json
{
  "success": false,
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
  }
}
```

Beberapa endpoint lama masih return:

```json
{ "error": "Pesan error" }
```

FE harus:

- Menampilkan pesan friendly.
- Tidak menampilkan raw SQL/stack trace.
- Tidak mengekspos internal storage path.
- Handle response file/blob berbeda dari JSON.

## 17. Frontend Implementation Notes

Loading pattern:

- Set `loading/saving` saat request.
- Disable button saat submit.
- Gunakan skeleton/placeholder untuk list dan card.

Empty state:

- Public informasi/kegiatan: tampilkan pesan kosong atau fallback content.
- Request list: tampilkan "Belum ada pengajuan".

Error state:

- Tampilkan alert/card error.
- Untuk DB down, tampilkan pesan standar dan tombol coba lagi.

Form validation:

- Wajib: `*`.
- Opsional: `Opsional`.
- Upload wajib: `Wajib`.
- Upload opsional: `Opsional`.
- Backend tetap sumber validasi final.

Image fallback:

- Missing local storage file bisa 404.
- Home activity, information, dan profile image harus punya placeholder/fallback.

Hydration:

- Root layout memakai `suppressHydrationWarning` untuk noise extension browser pada `html/body`.
- Jangan menutupi hydration bug aplikasi dengan random client-only rendering.

## 18. Local Setup Summary

Detail lengkap ada di `docs/local-setup.md`.

Ringkasan:

```powershell
pnpm install
docker compose up -d
Get-Content .\database\fmipa_sbpk.sql | docker exec -i ult-fmipa-db mariadb -u root -proot --init-command="SET SESSION sql_mode='NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'" fmipa_sbpk
pnpm prisma generate
pnpm db:prisma-migrate
pnpm db:support-migrate
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

Jangan jalankan `database/migrations_legacy_backup` sebagai migration aktif.

## 19. Developer QA Checklist

Public:

- [ ] `/` homepage load.
- [ ] `/layanan` list service.
- [ ] `/layanan/[slug]` detail service.
- [ ] `/informasi` dan `/informasi/[slug]`.
- [ ] `/profil`.
- [ ] Missing image menampilkan fallback.

Student:

- [ ] Login student.
- [ ] Submit request umum.
- [ ] Email wajib.
- [ ] Bahasa Surat wajib.
- [ ] Required/optional upload marker benar.
- [ ] Magang wajib PDF.
- [ ] SIK approval proof dan final flow.
- [ ] `/mahasiswa/riwayat`.
- [ ] Survey untuk request completed/delivered.

Staff:

- [ ] `/staff/requests` filter dan detail.
- [ ] Status workflow process/complete/deliver.
- [ ] SIK approve/reject.
- [ ] Data Surat save.
- [ ] `Cetak Surat Indo` dan `Cetak Surat Inggris`.
- [ ] Gmail helper compose-only.
- [ ] CMS staff: kegiatan, informasi, profil.

Admin:

- [ ] Semua checklist staff.
- [ ] Delete request admin-only.
- [ ] CMS CRUD.
- [ ] Master mahasiswa dan tracer.
- [ ] System users/levels/units/user-log.
- [ ] Reports/export.

Catatan user admin/staff:

- Admin dapat reset password akun admin/staff dari `/admin/system/users`.
- Reset password saat ini langsung mengisi password baru dan konfirmasi password,
  tanpa meminta password lama.
- Password tidak pernah ditampilkan ulang di UI; sistem hanya menyimpan hash
  legacy yang sama dengan mekanisme login.

Regression:

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build`
