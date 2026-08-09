# Repository Audit for New ULT Services

Catatan: audit ini bersifat read-only. Tidak ada file aplikasi yang perlu diubah untuk membaca dokumen ini, tidak ada migration yang dijalankan, dan tidak ada data database yang diubah. Dari audit database, tabel `permohonan_magang` dan `surat_izin_kegiatan` belum tersedia.

## 1. Current Service Architecture

Service publik saat ini dikontrol dari `src/lib/legacy-services.ts`. Setiap layanan memiliki `slug`, `title`, `category`, `description`, `requirements`, `processingTime`, dan `sourceTable`.

Submit layanan belum generic penuh. Alur submit masih per-table di `src/lib/legacy-request-submit.ts`, melalui whitelist `supportedSubmissionTables`, lalu `switch` berdasarkan `service.sourceTable`.

Form pengajuan ada di `src/components/services/service-request-form.tsx`. Saat ini form memakai conditional field berdasarkan slug layanan. Aturan upload masih global:

- Maksimal 3 file.
- Maksimal 5 MB per file.
- Tipe file PDF, JPEG, atau PNG.

API submit utama ada di `src/app/api/services/[slug]/requests/route.ts`. Endpoint ini hanya menerima role `student`, validasi form, validasi file, insert request ke tabel legacy, lalu menyimpan metadata attachment.

List admin/staff, detail request, status update, history mahasiswa, survei, dan delete request memakai metadata table masing-masing di file helper berbeda. Artinya, menambah layanan baru tidak cukup hanya menambah service catalog; semua helper yang punya whitelist/metadata tabel juga harus diperbarui.

## 2. Current Database Architecture

Legacy service memakai pola satu tabel per layanan, bukan satu tabel request universal. Tabel-tabel yang sudah ada umumnya memakai kolom workflow seperti:

```sql
ID,
NPM,
PERMINTAAN_TGL,
PERMINTAAN_ENTRY,
PERMINTAAN_IP,
PROSES_TGL,
PROSES_STAF,
SELESAI_TGL,
SELESAI_STAF,
DIAMBIL_TGL / DIKIRIM_TGL,
DIAMBIL_OLEH / DIKIRIM_OLEH
```

Attachment sudah dipusatkan di tabel `ult_request_attachments`. Kolom yang ada:

```sql
ID,
SERVICE_SLUG,
SOURCE_TABLE,
REQUEST_ID,
ORIGINAL_NAME,
STORED_NAME,
MIME_TYPE,
SIZE_BYTES,
STORAGE_PATH,
UPLOADED_BY,
UPLOADED_AT
```

Belum ada kolom `ATTACHMENT_TYPE`, sehingga sistem belum bisa membedakan jenis attachment seperti `surat prodi`, `bukti ACC`, atau `SPIK final`.

## 3. Files That Must Be Updated

| Area | File | Required Change | Risk |
|---|---|---|---|
| Service catalog | `src/lib/legacy-services.ts` | Tambah 2 layanan baru dan `sourceTable` masing-masing | Medium |
| Submit backend | `src/lib/legacy-request-submit.ts` | Tambah whitelist tabel, insert Magang, dan insert/stage SIK | High |
| Validation | `src/lib/service-request-validation.ts` | Tambah schema field Magang dan SIK | Medium |
| Form UI | `src/components/services/service-request-form.tsx` | Tambah field Magang, staged SIK UI, dan upload rules per layanan | High |
| Submit API | `src/app/api/services/[slug]/requests/route.ts` | Support field baru dan file rule per layanan | Medium |
| Upload config | `src/lib/file-upload.ts` | Buat aturan per-service: Magang PDF only, max 5 file, 10 MB/file | Medium |
| Attachment metadata | `src/lib/request-attachments.ts` | Tambah attachment type untuk workflow SIK | Medium |
| DB schema | `prisma/schema.prisma` | Tambah model tabel baru dan attachment type | High |
| Migration | `database/migrations/*` atau `prisma/migrations/*` | Buat tabel `permohonan_magang`, `surat_izin_kegiatan`, dan alter attachment | High |
| Admin/staff list | `src/lib/legacy-request-list.ts` | Tambah metadata dua tabel baru | Medium |
| Detail page | `src/lib/legacy-request-detail.ts` | Tampilkan detail field baru | Medium |
| Status update | `src/lib/legacy-request-status.ts` | Magang bisa normal; SIK butuh workflow khusus | High |
| Student history | `src/lib/student-request-history.ts` | Tambah metadata dua tabel baru | Medium |
| Delete request | `src/lib/legacy-request-delete.ts` | Tambah tabel baru ke whitelist delete | Medium |
| Staff filter | `src/app/staff/requests/page.tsx` | Ganti placeholder lama ke service asli | Low |
| Types | `src/types/*` | Tambah field Magang/SIK untuk submission, detail, dan history | Medium |
| E2E | `e2e/*` | Tambah test submit Magang, staged SIK, dan admin/staff verification | Medium |

## 4. Recommended Database Migration

Untuk layanan Permohonan Magang / Kerja Praktek / Tugas Akhir, rekomendasi tabel:

```sql
CREATE TABLE permohonan_magang (
  ID BIGINT AUTO_INCREMENT PRIMARY KEY,
  NPM VARCHAR(15),
  NAMA VARCHAR(100),
  PRODI VARCHAR(150),
  JENIS_PERMOHONAN VARCHAR(50),
  KONTAK_PERSON VARCHAR(100),
  TEMPAT_PELAKSANAAN VARCHAR(150),
  TUJUAN_SURAT VARCHAR(150),
  ALAMAT_SURAT VARCHAR(255),
  KECAMATAN_KABUPATEN VARCHAR(150),
  KOTA_KABUPATEN VARCHAR(100),
  PROVINSI VARCHAR(100),
  TANGGAL_MULAI DATE,
  TANGGAL_SELESAI DATE,
  PERMINTAAN_TGL TIMESTAMP NULL,
  PERMINTAAN_ENTRY VARCHAR(100),
  PERMINTAAN_IP VARCHAR(20),
  PROSES_TGL TIMESTAMP NULL,
  PROSES_STAF VARCHAR(100),
  SELESAI_TGL TIMESTAMP NULL,
  SELESAI_STAF VARCHAR(100),
  DIKIRIM_TGL TIMESTAMP NULL,
  DIKIRIM_OLEH VARCHAR(100),
  INDEX (NPM),
  INDEX (PERMINTAAN_TGL)
);
```

Nilai `JENIS_PERMOHONAN` disarankan dibatasi di level validasi aplikasi:

- `Magang Kerja`
- `Kerja Praktek Industri`
- `Magang Tugas Akhir`

Untuk layanan Surat Izin Kegiatan / SIK, rekomendasi tabel:

```sql
CREATE TABLE surat_izin_kegiatan (
  ID BIGINT AUTO_INCREMENT PRIMARY KEY,
  NPM VARCHAR(15),
  NAMA VARCHAR(100),
  PRODI VARCHAR(150),
  APPROVAL_STATUS VARCHAR(20) DEFAULT 'pending',
  APPROVAL_VERIFIKASI_TGL TIMESTAMP NULL,
  APPROVAL_VERIFIKASI_STAF VARCHAR(100),
  APPROVAL_REJECT_REASON TEXT,
  FINAL_SUBMITTED_TGL TIMESTAMP NULL,
  NAMA_HIMPUNAN VARCHAR(150),
  NAMA_KEGIATAN VARCHAR(200),
  TANGGAL_KEGIATAN DATE,
  EMAIL_PENGIRIMAN VARCHAR(100),
  NO_HP_WA VARCHAR(30),
  PERMINTAAN_TGL TIMESTAMP NULL,
  PERMINTAAN_ENTRY VARCHAR(100),
  PERMINTAAN_IP VARCHAR(20),
  PROSES_TGL TIMESTAMP NULL,
  PROSES_STAF VARCHAR(100),
  SELESAI_TGL TIMESTAMP NULL,
  SELESAI_STAF VARCHAR(100),
  DIKIRIM_TGL TIMESTAMP NULL,
  DIKIRIM_OLEH VARCHAR(100),
  INDEX (NPM),
  INDEX (APPROVAL_STATUS),
  INDEX (PERMINTAAN_TGL)
);
```

Untuk attachment, disarankan menambah kolom nullable:

```sql
ALTER TABLE ult_request_attachments
ADD COLUMN ATTACHMENT_TYPE VARCHAR(50) NULL;
```

Contoh nilai `ATTACHMENT_TYPE`:

- `program_study_request_letter`
- `manager_approval_proof`
- `final_spik_document`
- `supporting_document`

## 5. Recommended Backend Changes

Magang dapat menggunakan workflow normal seperti layanan surat lain:

1. Student submit request.
2. Staff/admin proses request.
3. Staff/admin tandai selesai.
4. Staff/admin tandai dikirim.

SIK sebaiknya tidak dipaksa ke workflow normal karena ada tahap verifikasi awal. Rekomendasi status khusus:

- `approval_pending`
- `approval_rejected`
- `approval_verified`
- `final_submitted`
- `processing`
- `completed`
- `delivered`

Endpoint yang disarankan:

```text
POST  /api/services/surat-izin-kegiatan/requests/approval-proof
PATCH /api/admin/requests/surat-izin-kegiatan/:id/approval
PATCH /api/services/surat-izin-kegiatan/requests/:id/final
```

Jika ingin tetap memakai endpoint existing, payload perlu membawa `stage`, misalnya `approval-proof` dan `final-submission`. Namun pendekatan endpoint terpisah lebih mudah dites dan lebih jelas secara workflow.

## 6. Recommended Frontend Changes

Untuk Magang, form dapat dibuat satu halaman dengan field:

- Nama
- NPM
- Prodi
- Perihal / Jenis Permohonan
- Kontak Person, jika ada
- Tempat Pelaksanaan
- Tujuan Surat
- Alamat Surat
- Kecamatan dan Kabupaten
- Kota / Kabupaten
- Provinsi, opsional
- Tanggal Mulai
- Tanggal Selesai
- Upload Surat Permohonan Dari Program Studi

Aturan upload Magang:

- PDF only.
- Maksimal 5 file.
- Maksimal 10 MB per file.

Untuk SIK, frontend perlu dibuat bertahap:

1. Tampilkan instruksi audiensi offline dengan Manajer Akademik dan Kemahasiswaan bersama koordinator.
2. Tampilkan upload bukti ACC.
3. Jika masih menunggu verifikasi, tampilkan status pending.
4. Jika ditolak, tampilkan alasan dan tombol upload ulang.
5. Jika disetujui, buka form final SIK.
6. Setelah final submit, tampilkan status proses sampai dikirim.

## 7. SIK Workflow Recommendation

Workflow yang disarankan:

1. Student membuka layanan SIK dan membaca instruksi.
2. Student melakukan audiensi offline sesuai prosedur.
3. Student upload bukti atau file yang sudah ACC.
4. Staff/admin memverifikasi bukti.
5. Jika bukti ditolak, student bisa upload ulang.
6. Jika bukti disetujui, form final SIK dibuka.
7. Student mengisi:
   - Nama Himpunan
   - Nama Kegiatan
   - Tanggal Kegiatan
   - Email Pengiriman SIK
   - Upload SPIK final
   - No HP WA Contact Person
8. Staff/admin memproses surat.
9. Surat izin dikirim ke email student.
10. Status menjadi selesai/dikirim.

## 8. Open Questions / Risks

Perlu diputuskan apakah hasil layanan Magang dikirim via email atau diambil langsung. Rekomendasi awal memakai `DIKIRIM_TGL` dan `DIKIRIM_OLEH` karena output surat kemungkinan dapat dikirim digital.

Untuk SIK, perlu dipastikan apakah file bukti ACC dan SPIK final selalu berbeda. Jika bisa berbeda, `ATTACHMENT_TYPE` wajib dipakai agar file tidak tercampur.

Risiko terbesar ada di status SIK. Existing status helper masih menganggap workflow linear: proses, selesai, lalu kirim. SIK punya tahap tambahan sebelum request final benar-benar masuk.

Upload rule saat ini masih global. Jika langsung dinaikkan ke 10 MB dan 5 file secara global, layanan lain ikut terdampak. Karena itu lebih aman dibuat konfigurasi per layanan.

Staff page saat ini memiliki placeholder filter untuk Magang dan SIK, tetapi belum terhubung ke layanan publik dan backend nyata. Placeholder ini perlu diganti setelah service resmi ditambahkan ke catalog.

## 9. Suggested Implementation Phases

1. Buat migration tabel `permohonan_magang`, `surat_izin_kegiatan`, dan alter `ult_request_attachments`.
2. Update Prisma schema dan generate client.
3. Tambah dua layanan baru ke service catalog.
4. Implement Magang dulu karena workflow-nya paling dekat dengan layanan existing.
5. Tambah upload config per layanan.
6. Tambah metadata list, detail, history, delete, dan survey eligibility.
7. Implement staged workflow SIK.
8. Tambah UI admin/staff untuk verifikasi bukti SIK.
9. Tambah E2E untuk Magang submit, SIK proof upload, admin/staff approval, final submit, complete, dan deliver.
10. Jalankan `pnpm.cmd test:e2e`, `pnpm.cmd build`, dan cek ulang Docker Compose.
