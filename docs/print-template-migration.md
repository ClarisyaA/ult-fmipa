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

## UI

Tombol `Cetak Surat` ditambahkan di:

- Admin request detail
- Staff request detail

Tombol hanya muncul untuk `serviceSlug === "keterangan-lulus"` dan membuka PDF di tab baru.

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

## Asset

Asset legacy yang disalin untuk PDF:

- `public/letters/logo-unpad.png`
- `public/letters/watermark-a4.png`

PDF tetap tidak boleh bergantung pada hotlink eksternal.

## Limitasi Phase 1

Belum diimplementasikan:

- Template Masih Kuliah / Ket. Tunjangan Orang Tua
- Template Masih Kuliah Aktif
- Template Kelakuan Baik
- Template Surat Pengantar
- Penomoran surat otomatis
- Picker pejabat dari `surat_ttd`
- Form edit `TTD_*`
- Schema/migration baru

## Template Berikutnya

Urutan migrasi yang disarankan:

1. Masih Kuliah / Ket. Tunjangan Orang Tua
2. Masih Kuliah Aktif
3. Kelakuan Baik
