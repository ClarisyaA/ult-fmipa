# Print Template Migration

Tanggal update: 13 Juli 2026

## Phase 1: Keterangan Lulus

Phase 1 menambahkan infrastruktur PDF aman dan satu pilot template:

- Layanan: `Keterangan Lulus`
- Slug: `keterangan-lulus`
- Table: `keterangan_lulus`
- Route: `GET /api/requests/keterangan-lulus/{id}/pdf`
- Filename: `skl_{NPM}.pdf`

Route mengembalikan PDF inline dengan header:

- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="skl_{NPM}.pdf"`
- `Cache-Control: no-store`

## Phase 2: Tiga Surat Resmi Legacy

Phase 2 menambahkan tiga template resmi yang sudah punya file cetak legacy jelas:

- Ket. Tunjangan Orang Tua / Masih Kuliah
  - Slug: `ket-tunjangan-orang-tua`
  - Table: `masih_kuliah`
  - Route: `GET /api/requests/ket-tunjangan-orang-tua/{id}/pdf`
  - Filename: `skmk_{NPM}.pdf`
  - Legacy source: `ULT-Lama/layanan_staf/masih_kuliah_cetak.php`
- Keterangan Masih Kuliah Aktif
  - Slug: `keterangan-masih-kuliah`
  - Table: `masih_kuliah_aktif`
  - Route: `GET /api/requests/keterangan-masih-kuliah/{id}/pdf`
  - Filename: `skmka_{NPM}.pdf`
  - Legacy source: `ULT-Lama/layanan_staf/masih_kuliah_aktif_cetak.php`
- Keterangan Kelakuan Baik
  - Slug: `keterangan-kelakuan-baik`
  - Table: `kelakuan_baik`
  - Route: `GET /api/requests/keterangan-kelakuan-baik/{id}/pdf`
  - Filename: `skkb_{NPM}.pdf`
  - Legacy source: `ULT-Lama/layanan_staf/kelakuan_baik_cetak.php`

Ketiga template membaca snapshot `TTD_*` dari row request dan tidak memakai master `surat_ttd` live.

## Phase 3: Editor Metadata Surat

Phase 3 menambahkan editor `Data Surat` di halaman detail pengajuan admin dan staff untuk empat layanan printable:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`

Editor ini memakai route:

- `GET /api/requests/{serviceSlug}/{id}/letter-metadata`
- `PATCH /api/requests/{serviceSlug}/{id}/letter-metadata`

Route hanya bisa diakses oleh role `admin` dan `staff`. Service di luar whitelist tetap tidak memiliki editor metadata dan route mengembalikan respons aman.

### Cara Mengisi Data Surat

1. Buka detail pengajuan dari halaman admin atau staff.
2. Pada section `Data Surat`, lengkapi nomor surat, tanggal surat, tempat surat, dan data penandatangan.
3. Lengkapi field layanan yang masih wajib untuk template tersebut.
4. Jika master `surat_ttd` tersedia, pilih penandatangan dari dropdown untuk mengisi snapshot nama, jabatan, pangkat/golongan, dan NIP.
5. Sesuaikan field hasil prefill bila perlu.
6. Klik `Simpan Data Surat`.
7. Status kesiapan cetak akan refresh dari server. Tombol `Cetak Surat` tetap memakai route PDF yang sama.

### Snapshot Rule

Picker penandatangan hanya membaca master `surat_ttd` untuk membantu pengisian form. Saat disimpan, data pejabat disalin ke kolom snapshot request:

- `TTD_JABATAN`
- `TTD_PANGKAT_GOLONGAN` jika tabel layanan memilikinya
- `TTD_NAMA`
- `TTD_NIP`
- `TTD_AN` untuk `keterangan_lulus` bila dipilih dari `JABATAN_AN`

PDF tetap membaca snapshot di row request. PDF tidak bergantung pada master `surat_ttd` terbaru, sehingga surat lama tetap reproducible walaupun master pejabat berubah.

### Field Yang Dapat Diedit

Common TTD fields:

- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN` untuk tiga template Phase 2
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Keterangan Lulus:

- `TTD_TANGGAL_BERLAKU`
- `TTD_AN`
- `TEMPAT_LAHIR`
- `TGL_LAHIR`
- `TGL_LULUS`
- `IPK`
- `YUDISIUM`
- `DASAR_SURAT_NO`
- `DASAR_SURAT_PERIHAL`
- `DASAR_SURAT_TGL`

Masih Kuliah / Ket. Tunjangan Orang Tua:

- `SEMESTER`
- `TAHUN_AKADEMIK`
- `NAMA_ORANG_TUA`
- `NIP_NRP`
- `PANGKAT_GOLONGAN`
- `INSTANSI`

Masih Kuliah Aktif:

- `SEMESTER`
- `TAHUN_AKADEMIK`
- `ALAMAT`
- `KEPERLUAN` untuk catatan operasional, tidak ditampilkan di PDF karena legacy template tidak mencetaknya

Kelakuan Baik:

- `ALAMAT`
- `KEPERLUAN` untuk catatan operasional, tidak ditampilkan di PDF karena legacy template tidak mencetaknya

### Validasi Metadata

Server hanya menerima field whitelist per layanan. Route metadata tidak memperbarui:

- `PERMINTAAN_IP`
- `PROSES_TGL`
- `SELESAI_TGL`
- `DIAMBIL_TGL`
- `DIKIRIM_TGL`
- kolom workflow/status lain

Text field di-trim, tanggal harus valid, `IPK` dan `SEMESTER` harus terlihat numerik bila diisi, dan panjang string dibatasi mengikuti schema saat memungkinkan. Save draft yang belum lengkap tetap boleh, tetapi kesiapan cetak tetap tidak ready sampai field wajib PDF lengkap.

## Phase 4: End-to-End QA Hardening

Phase 4 adalah tahap verifikasi sebelum penomoran otomatis atau template baru ditambahkan. Tidak ada perubahan schema, migration, wording PDF, atau template baru pada tahap ini.

### Scope QA

Uji empat layanan printable:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`

Untuk setiap layanan, pastikan:

- Halaman detail admin menampilkan `Data Surat`.
- Halaman detail staff menampilkan `Data Surat`.
- Halaman detail admin menampilkan `Cetak Surat`.
- Halaman detail staff menampilkan `Cetak Surat`.
- Metadata GET hanya mengembalikan field whitelist dan data picker penandatangan yang aman.
- Metadata PATCH hanya menerima field whitelist.
- Metadata PATCH menolak field asing seperti `PERMINTAAN_IP`, `PROSES_TGL`, `SELESAI_TGL`, `DIAMBIL_TGL`, atau field arbitrary lain.
- PDF membaca snapshot `TTD_*` dari row request.
- PDF tidak membaca live master `surat_ttd` saat render.
- Tidak ada password, token, secret, atau `PERMINTAAN_IP` yang tampil di UI/API metadata.

Untuk layanan unsupported, pastikan:

- `Data Surat` tidak muncul.
- `Cetak Surat` tidak muncul.
- Metadata route mengembalikan `404`.
- PDF route mengembalikan `404`.

### Browser Test Steps

1. Cari record lengkap dan belum lengkap memakai query di bagian `Manual Test Data Query` dan `Phase 2 Complete Record Queries`.
2. Buka detail admin untuk satu record supported.
3. Ubah satu field TTD yang aman untuk diuji di database lokal.
4. Klik `Simpan Data Surat`.
5. Pastikan tombol menampilkan loading dan tidak bisa diklik ganda saat request berjalan.
6. Pastikan pesan sukses muncul.
7. Pastikan readiness refresh dari server.
8. Klik `Cetak Surat`.
9. Pastikan PDF terbuka di tab baru dan memakai snapshot terbaru.
10. Ulangi di halaman staff.
11. Ulangi untuk semua layanan supported.

### Signer Snapshot Test

Jika `surat_ttd` berisi data:

1. Pilih penandatangan dari dropdown `Pilih Penandatangan`.
2. Pastikan field nama, jabatan, pangkat/golongan bila ada, dan NIP terisi.
3. Ubah salah satu field hasil picker secara manual.
4. Simpan metadata.
5. Generate PDF dan pastikan PDF memakai field manual yang tersimpan.
6. Jika aman di database lokal, ubah master `surat_ttd` setelah metadata tersimpan.
7. Generate PDF yang sama lagi.
8. Pastikan PDF tetap memakai snapshot request, bukan perubahan live master.

Jangan melakukan mutasi master penandatangan di production.

### Missing Data Test

Untuk record incomplete:

1. Buka detail supported service.
2. Pastikan readiness menampilkan warning.
3. Buka route PDF.
4. Pastikan respons `422` dengan pesan aman.
5. Pastikan PDF tidak dibuat dengan placeholder kosong, `undefined`, `null`, atau `Invalid Date`.

Pesan aman official letter:

`Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, data penandatangan, dan data utama layanan terlebih dahulu.`

### DB Stopped Test

1. Matikan database lokal.
2. Buka detail request supported.
3. Coba load `Data Surat`.
4. Coba simpan metadata.
5. Buka route PDF.
6. Pastikan API mengembalikan structured `503`.
7. Pastikan UI menampilkan pesan ramah database tidak tersedia.
8. Pastikan tidak ada stack trace atau raw Prisma/MariaDB error di browser.

### Access Control Test

1. Akses metadata route tanpa login dan pastikan `401`.
2. Akses metadata route sebagai student/public dan pastikan `403`.
3. Akses metadata route sebagai admin dan pastikan allowed.
4. Akses metadata route sebagai staff dan pastikan allowed.
5. Ulangi pola yang sama untuk route PDF.

### PDF Safety Checklist

Untuk setiap PDF supported, pastikan:

- Filename benar: `skl_{NPM}.pdf`, `skmk_{NPM}.pdf`, `skmka_{NPM}.pdf`, atau `skkb_{NPM}.pdf`.
- Logo tampil.
- Watermark hanya tampil pada template yang memakai watermark legacy.
- Tidak ada `undefined`.
- Tidak ada `null`.
- Tidak ada `Invalid Date`.
- Tidak ada raw JSON.
- Tidak ada stack trace.
- Tidak ada raw DB error.
- Long text seperti alamat tetap wrap dan tidak merusak tanda tangan.
- Wording official tidak berubah dari implementasi parity legacy.

### Regression Checklist

Setelah hardening, cek cepat:

- Admin request detail tetap terbuka.
- Staff request detail tetap terbuka.
- Tombol status proses/selesai/kirim tetap bekerja.
- SIK approval dan detail tidak berubah.
- Magang detail tidak berubah.
- Information CRUD tidak berubah.
- Survey pages tidak berubah.
- Admin user management tidak berubah.
- Existing PDF `keterangan-lulus` tetap bisa dibuka.

### Phase 4 Known Limitations

- Belum ada penomoran surat otomatis.
- Belum ada registry `surat_keluar` / `no_surat`.
- Belum ada CRUD master pejabat.
- Belum ada template PDF baru di luar empat layanan supported.
- Automated browser tests tidak ditambahkan karena belum ada fixture DB stabil yang aman untuk semua environment.

## Phase 5A: Audit Penomoran Surat

Phase 5A mendokumentasikan perilaku legacy penomoran surat di `docs/letter-numbering-audit.md`.

Finding utama:

- Empat layanan printable legacy memakai input manual `nomor_surat`.
- Nomor surat disimpan ke snapshot `TTD_NO_SURAT`.
- File cetak membaca `TTD_NO_SURAT`.
- Tidak ditemukan auto-numbering aktif, insert `surat_keluar`, integrasi `no_surat`, transaction lock, atau duplicate prevention pada flow empat layanan tersebut.

## Phase 5B: Manual Letter Numbering Safety Cleanup

Phase 5B tetap mempertahankan penomoran manual. Tidak ada generator, tidak ada write ke `surat_keluar`, tidak ada integrasi `no_surat`, dan tidak ada schema/migration baru.

Perubahan safety:

- `TTD_NO_SURAT` di-trim saat metadata disimpan.
- Format internal seperti slash, titik, dash, spasi, dan kode resmi tetap dipertahankan.
- Nomor surat tidak di-auto-format, tidak di-uppercase/lowercase otomatis, dan tidak diubah kecuali user menyimpan edit.
- Nilai kosong/whitespace disimpan sebagai belum lengkap.
- Nilai yang mengandung newline atau karakter kontrol ditolak.
- Duplicate number dicek advisory-only pada tabel printable whitelist:
  - `keterangan_lulus`
  - `masih_kuliah`
  - `masih_kuliah_aktif`
  - `kelakuan_baik`
- Duplicate warning tidak memblokir save dan tidak memblokir PDF jika field wajib lengkap.
- Jika record sudah punya `TTD_NO_SURAT` dan user menggantinya dengan nomor non-empty lain, server meminta konfirmasi overwrite (`409`) dan UI menampilkan konfirmasi sebelum submit ulang.
- Audit log mencatat perubahan nomor surat dengan aksi `Mengubah nomor surat {serviceSlug} #ID`.

Helper text pada editor `Data Surat` menegaskan bahwa nomor masih diisi manual sesuai format resmi fakultas dan sistem belum melakukan auto-numbering.

Known limitation Phase 5B:

- Belum ada tombol generate nomor surat.
- Belum ada preview auto-number.
- Belum ada transactional numbering.
- Belum ada registry `surat_keluar`.
- Belum ada integrasi `no_surat`.
- Duplicate warning bersifat advisory karena data legacy dapat mengandung duplikasi historis.

## Proteksi Akses

PDF hanya bisa diakses oleh user dengan role:

- `admin`
- `staff`

Respons akses:

- Belum login: `401`
- Login selain admin/staff: `403`
- Service tidak didukung: `404`
- ID tidak valid: `400`
- Data surat belum lengkap: `422`
- Database tidak tersedia: response aman dari `error-utils.ts`

## Data Rendering

Generator membaca snapshot data dari request `keterangan_lulus`, bukan dari master pejabat terbaru. Ini penting agar surat lama tetap reproducible.

Field request yang dibaca:

- `ID`
- `NPM`
- `TEMPAT_LAHIR`
- `TGL_LAHIR`
- `TGL_LULUS`
- `IPK`
- `YUDISIUM`
- `DASAR_SURAT_NO`
- `DASAR_SURAT_PERIHAL`
- `DASAR_SURAT_TGL`
- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TANGGAL_BERLAKU`
- `TTD_TEMPAT`
- `TTD_AN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Identitas mahasiswa dicari dari:

1. `mahasiswa`
2. `mahasiswa_sd_2015`
3. `alumni`

## Field Wajib Untuk Cetak

Route akan menolak render dengan status `422` jika field berikut kosong:

- `NPM`
- Nama mahasiswa
- `TGL_LULUS`
- `IPK`
- `YUDISIUM`
- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TANGGAL_BERLAKU`
- `TTD_TEMPAT`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Pesan aman:

`Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, dan data penandatangan terlebih dahulu.`

Untuk tiga template Phase 2, route mengembalikan `422` jika field utama layanan atau snapshot TTD tidak lengkap.

Pesan aman:

`Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, data penandatangan, dan data utama layanan terlebih dahulu.`

Field wajib Masih Kuliah / Ket. Tunjangan Orang Tua:

- `NPM`
- Nama mahasiswa
- `SEMESTER`
- `TAHUN_AKADEMIK`
- `NAMA_ORANG_TUA`
- `NIP_NRP`
- `PANGKAT_GOLONGAN`
- `INSTANSI`
- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Field wajib Masih Kuliah Aktif:

- `NPM`
- Nama mahasiswa
- `SEMESTER`
- `TAHUN_AKADEMIK`
- `ALAMAT`
- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Field wajib Kelakuan Baik:

- `NPM`
- Nama mahasiswa
- `ALAMAT`
- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

## UI

Tombol `Cetak Surat` ditambahkan di:

- Admin request detail
- Staff request detail

Tombol hanya muncul untuk `serviceSlug === "keterangan-lulus"` dan membuka PDF di tab baru.

Setelah Phase 2, tombol juga muncul untuk:

- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`

Detail page juga menampilkan indikator kesiapan cetak khusus untuk `keterangan-lulus`:

- `Data surat siap dicetak.` jika field wajib lengkap.
- `Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, masa berlaku, data kelulusan, dan penandatangan sebelum mencetak.` jika belum lengkap.

Tombol tetap terlihat walaupun data belum lengkap. Route PDF tetap melakukan validasi server-side dan akan mengembalikan `422` jika data wajib kosong.

## Manual Test Data Query

Gunakan query berikut untuk mencari record `keterangan_lulus` yang siap dipakai test PDF. Query ini hanya membaca data dan tidak mengubah database.

```sql
SELECT
  ID,
  NPM,
  TTD_NO_SURAT,
  TTD_TANGGAL,
  TTD_TANGGAL_BERLAKU,
  TTD_TEMPAT,
  TTD_JABATAN,
  TTD_NAMA,
  TTD_NIP,
  TGL_LULUS,
  IPK,
  YUDISIUM
FROM keterangan_lulus
WHERE
  NPM IS NOT NULL
  AND TTD_NO_SURAT IS NOT NULL
  AND TTD_TANGGAL IS NOT NULL
  AND TTD_TANGGAL_BERLAKU IS NOT NULL
  AND TTD_TEMPAT IS NOT NULL
  AND TTD_JABATAN IS NOT NULL
  AND TTD_NAMA IS NOT NULL
  AND TTD_NIP IS NOT NULL
  AND TGL_LULUS IS NOT NULL
  AND IPK IS NOT NULL
  AND YUDISIUM IS NOT NULL
ORDER BY ID DESC
LIMIT 10;
```

Untuk negative test, cari record yang belum lengkap:

```sql
SELECT
  ID,
  NPM,
  TTD_NO_SURAT,
  TTD_TANGGAL,
  TTD_TANGGAL_BERLAKU,
  TTD_TEMPAT,
  TTD_JABATAN,
  TTD_NAMA,
  TTD_NIP,
  TGL_LULUS,
  IPK,
  YUDISIUM
FROM keterangan_lulus
WHERE
  NPM IS NULL
  OR TTD_NO_SURAT IS NULL
  OR TTD_TANGGAL IS NULL
  OR TTD_TANGGAL_BERLAKU IS NULL
  OR TTD_TEMPAT IS NULL
  OR TTD_JABATAN IS NULL
  OR TTD_NAMA IS NULL
  OR TTD_NIP IS NULL
  OR TGL_LULUS IS NULL
  OR IPK IS NULL
  OR YUDISIUM IS NULL
ORDER BY ID DESC
LIMIT 10;
```

Jika query complete menghasilkan record tetapi PDF route tetap `422`, cek apakah NPM record tersebut punya identitas mahasiswa di salah satu sumber berikut:

- `mahasiswa`
- `mahasiswa_sd_2015`
- `alumni`

### Phase 2 Complete Record Queries

Masih Kuliah / Ket. Tunjangan Orang Tua:

```sql
SELECT
  ID,
  NPM,
  SEMESTER,
  TAHUN_AKADEMIK,
  NAMA_ORANG_TUA,
  NIP_NRP,
  PANGKAT_GOLONGAN,
  INSTANSI,
  TTD_NO_SURAT,
  TTD_TANGGAL,
  TTD_TEMPAT,
  TTD_PANGKAT_GOLONGAN,
  TTD_JABATAN,
  TTD_NAMA,
  TTD_NIP
FROM masih_kuliah
WHERE
  NPM IS NOT NULL AND NPM <> ''
  AND SEMESTER IS NOT NULL AND SEMESTER <> ''
  AND TAHUN_AKADEMIK IS NOT NULL AND TAHUN_AKADEMIK <> ''
  AND NAMA_ORANG_TUA IS NOT NULL AND NAMA_ORANG_TUA <> ''
  AND NIP_NRP IS NOT NULL AND NIP_NRP <> ''
  AND PANGKAT_GOLONGAN IS NOT NULL AND PANGKAT_GOLONGAN <> ''
  AND INSTANSI IS NOT NULL AND INSTANSI <> ''
  AND TTD_NO_SURAT IS NOT NULL AND TTD_NO_SURAT <> ''
  AND TTD_TANGGAL IS NOT NULL
  AND TTD_TEMPAT IS NOT NULL AND TTD_TEMPAT <> ''
  AND TTD_PANGKAT_GOLONGAN IS NOT NULL AND TTD_PANGKAT_GOLONGAN <> ''
  AND TTD_JABATAN IS NOT NULL AND TTD_JABATAN <> ''
  AND TTD_NAMA IS NOT NULL AND TTD_NAMA <> ''
  AND TTD_NIP IS NOT NULL AND TTD_NIP <> ''
ORDER BY ID DESC
LIMIT 10;
```

Masih Kuliah Aktif:

```sql
SELECT
  ID,
  NPM,
  SEMESTER,
  TAHUN_AKADEMIK,
  ALAMAT,
  TTD_NO_SURAT,
  TTD_TANGGAL,
  TTD_TEMPAT,
  TTD_PANGKAT_GOLONGAN,
  TTD_JABATAN,
  TTD_NAMA,
  TTD_NIP
FROM masih_kuliah_aktif
WHERE
  NPM IS NOT NULL AND NPM <> ''
  AND SEMESTER IS NOT NULL AND SEMESTER <> ''
  AND TAHUN_AKADEMIK IS NOT NULL AND TAHUN_AKADEMIK <> ''
  AND ALAMAT IS NOT NULL AND ALAMAT <> ''
  AND TTD_NO_SURAT IS NOT NULL AND TTD_NO_SURAT <> ''
  AND TTD_TANGGAL IS NOT NULL
  AND TTD_TEMPAT IS NOT NULL AND TTD_TEMPAT <> ''
  AND TTD_PANGKAT_GOLONGAN IS NOT NULL AND TTD_PANGKAT_GOLONGAN <> ''
  AND TTD_JABATAN IS NOT NULL AND TTD_JABATAN <> ''
  AND TTD_NAMA IS NOT NULL AND TTD_NAMA <> ''
  AND TTD_NIP IS NOT NULL AND TTD_NIP <> ''
ORDER BY ID DESC
LIMIT 10;
```

Kelakuan Baik:

```sql
SELECT
  ID,
  NPM,
  ALAMAT,
  TTD_NO_SURAT,
  TTD_TANGGAL,
  TTD_TEMPAT,
  TTD_PANGKAT_GOLONGAN,
  TTD_JABATAN,
  TTD_NAMA,
  TTD_NIP
FROM kelakuan_baik
WHERE
  NPM IS NOT NULL AND NPM <> ''
  AND ALAMAT IS NOT NULL AND ALAMAT <> ''
  AND TTD_NO_SURAT IS NOT NULL AND TTD_NO_SURAT <> ''
  AND TTD_TANGGAL IS NOT NULL
  AND TTD_TEMPAT IS NOT NULL AND TTD_TEMPAT <> ''
  AND TTD_PANGKAT_GOLONGAN IS NOT NULL AND TTD_PANGKAT_GOLONGAN <> ''
  AND TTD_JABATAN IS NOT NULL AND TTD_JABATAN <> ''
  AND TTD_NAMA IS NOT NULL AND TTD_NAMA <> ''
  AND TTD_NIP IS NOT NULL AND TTD_NIP <> ''
ORDER BY ID DESC
LIMIT 10;
```

### Phase 2 Incomplete Record Queries

Gunakan query negative test ini untuk memastikan route mengembalikan `422`.

```sql
SELECT ID, NPM, SEMESTER, TAHUN_AKADEMIK, NAMA_ORANG_TUA, NIP_NRP, PANGKAT_GOLONGAN, INSTANSI, TTD_NO_SURAT, TTD_TANGGAL, TTD_TEMPAT, TTD_PANGKAT_GOLONGAN, TTD_JABATAN, TTD_NAMA, TTD_NIP
FROM masih_kuliah
WHERE NPM IS NULL OR NPM = '' OR SEMESTER IS NULL OR SEMESTER = '' OR TAHUN_AKADEMIK IS NULL OR TAHUN_AKADEMIK = '' OR NAMA_ORANG_TUA IS NULL OR NAMA_ORANG_TUA = '' OR NIP_NRP IS NULL OR NIP_NRP = '' OR PANGKAT_GOLONGAN IS NULL OR PANGKAT_GOLONGAN = '' OR INSTANSI IS NULL OR INSTANSI = '' OR TTD_NO_SURAT IS NULL OR TTD_NO_SURAT = '' OR TTD_TANGGAL IS NULL OR TTD_TEMPAT IS NULL OR TTD_TEMPAT = '' OR TTD_PANGKAT_GOLONGAN IS NULL OR TTD_PANGKAT_GOLONGAN = '' OR TTD_JABATAN IS NULL OR TTD_JABATAN = '' OR TTD_NAMA IS NULL OR TTD_NAMA = '' OR TTD_NIP IS NULL OR TTD_NIP = ''
ORDER BY ID DESC
LIMIT 10;
```

```sql
SELECT ID, NPM, SEMESTER, TAHUN_AKADEMIK, ALAMAT, TTD_NO_SURAT, TTD_TANGGAL, TTD_TEMPAT, TTD_PANGKAT_GOLONGAN, TTD_JABATAN, TTD_NAMA, TTD_NIP
FROM masih_kuliah_aktif
WHERE NPM IS NULL OR NPM = '' OR SEMESTER IS NULL OR SEMESTER = '' OR TAHUN_AKADEMIK IS NULL OR TAHUN_AKADEMIK = '' OR ALAMAT IS NULL OR ALAMAT = '' OR TTD_NO_SURAT IS NULL OR TTD_NO_SURAT = '' OR TTD_TANGGAL IS NULL OR TTD_TEMPAT IS NULL OR TTD_TEMPAT = '' OR TTD_PANGKAT_GOLONGAN IS NULL OR TTD_PANGKAT_GOLONGAN = '' OR TTD_JABATAN IS NULL OR TTD_JABATAN = '' OR TTD_NAMA IS NULL OR TTD_NAMA = '' OR TTD_NIP IS NULL OR TTD_NIP = ''
ORDER BY ID DESC
LIMIT 10;
```

```sql
SELECT ID, NPM, ALAMAT, TTD_NO_SURAT, TTD_TANGGAL, TTD_TEMPAT, TTD_PANGKAT_GOLONGAN, TTD_JABATAN, TTD_NAMA, TTD_NIP
FROM kelakuan_baik
WHERE NPM IS NULL OR NPM = '' OR ALAMAT IS NULL OR ALAMAT = '' OR TTD_NO_SURAT IS NULL OR TTD_NO_SURAT = '' OR TTD_TANGGAL IS NULL OR TTD_TEMPAT IS NULL OR TTD_TEMPAT = '' OR TTD_PANGKAT_GOLONGAN IS NULL OR TTD_PANGKAT_GOLONGAN = '' OR TTD_JABATAN IS NULL OR TTD_JABATAN = '' OR TTD_NAMA IS NULL OR TTD_NAMA = '' OR TTD_NIP IS NULL OR TTD_NIP = ''
ORDER BY ID DESC
LIMIT 10;
```

## Manual QA Checklist

1. Start database dan Next.js dev server.
2. Cari record lengkap dengan query `Manual Test Data Query`.
3. Buka `/admin/requests/keterangan-lulus/{ID}`.
4. Pastikan tombol `Cetak Surat` muncul.
5. Pastikan indikator menampilkan `Data surat siap dicetak.`
6. Klik `Cetak Surat`.
7. Pastikan PDF terbuka di tab baru.
8. Pastikan URL button mengarah ke `/api/requests/keterangan-lulus/{ID}/pdf`.
9. Pastikan filename `skl_{NPM}.pdf`.
10. Pastikan PDF tidak menampilkan teks literal `undefined`, `null`, atau `Invalid Date`.
11. Pastikan logo dan watermark tampil.
12. Pastikan nama mahasiswa, NPM, tanggal lulus, IPK, yudisium, masa berlaku, jabatan, nama penandatangan, dan NIP tampil.
13. Buka `/staff/requests/keterangan-lulus/{ID}` dan pastikan tombol serta indikator juga muncul.
14. Buka detail service lain dan pastikan tombol `Cetak Surat` tidak muncul.
15. Buka route PDF record incomplete dan pastikan respons `422` berisi pesan aman.
16. Akses route PDF tanpa login dan pastikan `401`.
17. Akses route PDF sebagai student/public dan pastikan `403`.
18. Akses `/api/requests/kartu-prestasi-akademik/{ID}/pdf` dan pastikan `404`.
19. Akses `/api/requests/keterangan-lulus/not-a-number/pdf` dan pastikan `400`.
20. Stop database, buka route PDF, dan pastikan respons aman `503` tanpa stack trace atau raw Prisma/MariaDB error.

Phase 2 manual checklist tambahan:

1. Buka `/admin/requests/ket-tunjangan-orang-tua/{ID}` dan pastikan PDF terbuka sebagai `skmk_{NPM}.pdf`.
2. Buka `/admin/requests/keterangan-masih-kuliah/{ID}` dan pastikan PDF terbuka sebagai `skmka_{NPM}.pdf`.
3. Buka `/admin/requests/keterangan-kelakuan-baik/{ID}` dan pastikan PDF terbuka sebagai `skkb_{NPM}.pdf`.
4. Ulangi dari halaman staff untuk tiga service tersebut.
5. Bandingkan visual dengan PDF legacy jika memungkinkan: kop, judul, nomor surat, identitas penandatangan, identitas mahasiswa, body statement, dan blok tanda tangan.
6. Pastikan PDF tidak menampilkan `undefined`, `null`, atau `Invalid Date`.

Phase 3 manual checklist tambahan:

1. Buka `/admin/requests/keterangan-lulus/{ID}` dan pastikan section `Data Surat` muncul.
2. Isi atau ubah common TTD fields dan field khusus Keterangan Lulus, lalu simpan.
3. Pastikan status kesiapan cetak berubah dari server setelah simpan.
4. Klik `Cetak Surat` dan pastikan PDF memakai snapshot terbaru dari row request.
5. Ulangi untuk `ket-tunjangan-orang-tua`, `keterangan-masih-kuliah`, dan `keterangan-kelakuan-baik`.
6. Jika master `surat_ttd` berisi data, pilih satu penandatangan dan pastikan field snapshot terisi.
7. Ubah manual salah satu field hasil picker, simpan, lalu pastikan PDF memakai nilai manual yang tersimpan.
8. Buka halaman staff untuk layanan yang sama dan pastikan editor juga bisa dipakai.
9. Buka detail service unsupported dan pastikan section `Data Surat` tidak muncul.
10. Akses API metadata sebagai student/public atau tanpa login dan pastikan ditolak aman.
11. Stop database, coba load atau simpan `Data Surat`, dan pastikan UI menampilkan pesan aman tanpa crash.

## Keterangan Lulus Legacy Parity Notes

Source of truth:

- `ULT-Lama/layanan_staf/keterangan_lulus_cetak.php`

Area parity yang sudah dicek dan diselaraskan:

- A4 portrait dan area margin mendekati FPDF legacy.
- Kop surat memakai logo Unpad, hierarchy font, dan garis tebal/tipis seperti legacy.
- Watermark memakai asset legacy `watermark_A4.png`.
- Judul dan nomor surat mengikuti struktur legacy.
- Urutan blok body mengikuti legacy: pembuka, identitas mahasiswa, pernyataan kelulusan, detail kelulusan, masa berlaku, dan tanda tangan.
- Field dinamis tetap memakai snapshot request, terutama `TTD_*`.
- `JENJANG` ditampilkan uppercase seperti legacy.
- Tanggal memakai formatter Indonesia deterministik.
- Filename tetap `skl_{NPM}.pdf`.

Phase 2 parity notes:

- Source of truth: `masih_kuliah_cetak.php`, `masih_kuliah_aktif_cetak.php`, dan `kelakuan_baik_cetak.php`.
- Ketiga template memakai kop surat shared, tanpa watermark, sesuai legacy.
- Judul, field order, signer identity block, student identity block, parent/guardian section, alamat, dan statement NAPZA mengikuti struktur legacy.
- Output tidak binary-perfect karena React PDF bukan FPDF koordinat manual, tetapi struktur visual dan semantik dibuat dekat dengan legacy.

Manual comparison checklist:

1. Generate PDF legacy dari aplikasi lama untuk satu record lokal non-sensitif jika memungkinkan.
2. Generate PDF baru dari Next.js untuk `ID` yang sama.
3. Bandingkan kop surat, logo, watermark, judul, nomor surat, blok identitas mahasiswa, pernyataan kelulusan, masa berlaku, blok tanda tangan, dan filename.
4. Pastikan tidak ada teks literal `undefined`, `null`, atau `Invalid Date`.
5. Jangan commit PDF hasil test atau screenshot yang berisi data mahasiswa nyata.

Known limitation:

- Implementasi baru memakai `@react-pdf/renderer`, sedangkan legacy memakai FPDF berbasis koordinat millimeter. Output tidak ditargetkan binary-perfect, tetapi struktur visual dan semantik dibuat sedekat mungkin. Jika kelak perlu posisi absolut yang benar-benar sama, `pdf-lib` atau renderer koordinat manual bisa dievaluasi untuk template tertentu.

## Asset

Asset legacy yang disalin untuk PDF:

- `public/letters/logo-unpad.png`
- `public/letters/watermark-a4.png`

PDF tetap tidak boleh bergantung pada hotlink eksternal.

## Limitasi Saat Ini

Belum diimplementasikan:

- Template Surat Pengantar
- Penomoran surat otomatis
- Registry `surat_keluar` / nomor surat keluar
- CRUD master pejabat / penandatangan
- Schema/migration baru

## Template Berikutnya

Urutan migrasi yang disarankan:

1. Masih Kuliah / Ket. Tunjangan Orang Tua
2. Masih Kuliah Aktif
3. Kelakuan Baik
