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
