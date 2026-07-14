# Official Letter Manual QA

Tanggal update: 13 Juli 2026

Dokumen ini adalah checklist manual untuk demo dan regression test alur surat resmi ULT FMIPA. Gunakan placeholder seperti `{SERVICE_SLUG}`, `{ID}`, dan `{NPM}`. Jangan commit PDF, screenshot, atau data mahasiswa nyata dari hasil pengujian.

## Scope

Layanan supported:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`

Untuk empat layanan ini, halaman detail admin dan staff harus merender:

- `Data Surat`
- print readiness indicator
- `Cetak Surat`

Pada daftar pengajuan admin/staff, layanan printable juga harus terlihat dari:

- ikon surat di nama/filter layanan
- tombol `Surat` di kolom `Aksi`

Route PDF:

- `/api/requests/{SERVICE_SLUG}/{ID}/pdf`

Route metadata:

- `GET /api/requests/{SERVICE_SLUG}/{ID}/letter-metadata`
- `PATCH /api/requests/{SERVICE_SLUG}/{ID}/letter-metadata`

Tidak termasuk scope:

- Auto-numbering
- Write ke `surat_keluar`
- Integrasi `no_surat`
- Schema/migration baru
- Template PDF baru
- Perubahan wording resmi

## 1. DB Running Checklist

1. Jalankan database lokal.
2. Jalankan aplikasi Next.js.
3. Login sebagai admin.
4. Buka detail salah satu supported service di `/admin/requests/{SERVICE_SLUG}/{ID}`.
5. Pastikan halaman tidak crash.
6. Pastikan `Data Surat` muncul.
7. Pastikan tombol `Cetak Surat` muncul.
8. Buka detail yang sama dari role staff di `/staff/requests/{SERVICE_SLUG}/{ID}`.
9. Pastikan `Data Surat` dan `Cetak Surat` juga muncul.
10. Pastikan unsupported service tidak menampilkan `Data Surat` atau `Cetak Surat`.

## 2. DB Stopped Checklist

1. Matikan database lokal.
2. Buka detail supported service.
3. Pastikan halaman menampilkan fallback aman atau error ramah, bukan raw Prisma/MariaDB stack trace.
4. Coba load `Data Surat`.
5. Pastikan API metadata mengembalikan response aman `503` jika koneksi database gagal.
6. Coba simpan `Data Surat`.
7. Pastikan UI menampilkan pesan gagal yang aman.
8. Buka `/api/requests/{SERVICE_SLUG}/{ID}/pdf`.
9. Pastikan response aman `503`.
10. Pastikan tidak ada raw DB error di browser.

## 3. Admin Access Checklist

1. Login sebagai admin.
2. Buka `/admin/requests/{SERVICE_SLUG}/{ID}` untuk semua supported services.
3. Pastikan tombol `Cetak Surat` mengarah ke `/api/requests/{SERVICE_SLUG}/{ID}/pdf`.
4. Pastikan tombol membuka tab baru (`target="_blank"`).
5. Pastikan editor `Data Surat` bisa load.
6. Ubah field aman di database lokal, misalnya `TTD_TEMPAT`.
7. Simpan.
8. Pastikan pesan sukses muncul.
9. Pastikan readiness refresh.
10. Klik `Cetak Surat` dan pastikan PDF terbuka.

## 4. Staff Access Checklist

1. Login sebagai staff.
2. Buka `/staff/requests/{SERVICE_SLUG}/{ID}` untuk semua supported services.
3. Pastikan tampilan `Data Surat` konsisten dengan admin.
4. Pastikan tombol `Cetak Surat` mengarah ke `/api/requests/{SERVICE_SLUG}/{ID}/pdf`.
5. Simpan perubahan metadata aman.
6. Pastikan readiness refresh.
7. Klik `Cetak Surat`.
8. Pastikan PDF terbuka.

## 5. Unauthorized Access Checklist

1. Logout.
2. Buka `/api/requests/{SERVICE_SLUG}/{ID}/letter-metadata`.
3. Pastikan response `401`.
4. Buka `/api/requests/{SERVICE_SLUG}/{ID}/pdf`.
5. Pastikan response `401`.
6. Login sebagai role selain admin/staff jika tersedia.
7. Buka metadata route.
8. Pastikan response `403`.
9. Buka PDF route.
10. Pastikan response `403`.

## 6. Per-Service Metadata Checklist

### Keterangan Lulus

Slug: `keterangan-lulus`

Common fields:

- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Service fields:

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

QA:

1. Isi semua field wajib.
2. Simpan.
3. Pastikan readiness siap cetak.
4. Cetak PDF.
5. Pastikan filename `skl_{NPM}.pdf`.

### Ket. Tunjangan Orang Tua / Masih Kuliah

Slug: `ket-tunjangan-orang-tua`

Common fields:

- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Service fields:

- `SEMESTER`
- `TAHUN_AKADEMIK`
- `NAMA_ORANG_TUA`
- `NIP_NRP`
- `PANGKAT_GOLONGAN`
- `INSTANSI`

QA:

1. Isi semua field wajib.
2. Simpan.
3. Pastikan readiness siap cetak.
4. Cetak PDF.
5. Pastikan filename `skmk_{NPM}.pdf`.

### Keterangan Masih Kuliah

Slug: `keterangan-masih-kuliah`

Common fields:

- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Service fields:

- `SEMESTER`
- `TAHUN_AKADEMIK`
- `ALAMAT`
- `KEPERLUAN`

QA:

1. Isi field wajib.
2. Simpan.
3. Pastikan alamat panjang tetap tersimpan.
4. Cetak PDF.
5. Pastikan filename `skmka_{NPM}.pdf`.

### Keterangan Kelakuan Baik

Slug: `keterangan-kelakuan-baik`

Common fields:

- `TTD_NO_SURAT`
- `TTD_TANGGAL`
- `TTD_TEMPAT`
- `TTD_PANGKAT_GOLONGAN`
- `TTD_JABATAN`
- `TTD_NAMA`
- `TTD_NIP`

Service fields:

- `ALAMAT`
- `KEPERLUAN`

QA:

1. Isi field wajib.
2. Simpan.
3. Cetak PDF.
4. Pastikan filename `skkb_{NPM}.pdf`.

## 7. Per-Service PDF Checklist

Untuk setiap supported service:

1. Buka detail admin.
2. Pastikan `Cetak Surat` muncul.
3. Buka detail staff.
4. Pastikan `Cetak Surat` muncul.
5. Klik `Cetak Surat`.
6. Pastikan tab baru terbuka.
7. Pastikan `Content-Type` adalah `application/pdf`.
8. Pastikan filename sesuai service.
9. Pastikan PDF tidak menampilkan `undefined`.
10. Pastikan PDF tidak menampilkan `null`.
11. Pastikan PDF tidak menampilkan `Invalid Date`.
12. Pastikan nomor surat sama dengan snapshot `TTD_NO_SURAT` yang tersimpan.
13. Pastikan PDF tidak membaca ulang data terbaru dari master `surat_ttd`.

## 8. Nomor Surat Duplicate And Overwrite Checklist

Manual numbering tetap dipakai. Sistem belum melakukan auto-numbering.

Trim test:

1. Isi `TTD_NO_SURAT` dengan leading/trailing spaces.
2. Simpan.
3. Load ulang metadata.
4. Pastikan value tersimpan tanpa spasi awal/akhir.
5. Pastikan slash, titik, dash, dan spasi internal tetap ada.

Invalid character test:

1. Isi `TTD_NO_SURAT` dengan newline.
2. Simpan.
3. Pastikan server menolak dengan pesan validasi aman.
4. Pastikan input user tidak hilang dari form sebelum reset/load ulang.

Duplicate warning test:

1. Pakai nomor surat yang sudah ada di salah satu request printable lain.
2. Simpan.
3. Pastikan warning duplicate muncul.
4. Pastikan save tidak diblokir hanya karena duplicate.
5. Pastikan PDF tetap bisa dicetak jika field wajib lengkap.

Overwrite confirmation test:

1. Buka record yang sudah punya `TTD_NO_SURAT`.
2. Ganti ke nomor non-empty lain.
3. Klik simpan.
4. Pastikan UI meminta konfirmasi.
5. Pilih batal.
6. Pastikan perubahan tidak tersimpan.
7. Klik simpan lagi.
8. Pilih lanjutkan.
9. Pastikan perubahan tersimpan.
10. Pastikan audit log mencatat perubahan nomor jika audit log tersedia.

## 9. Signer Picker Checklist

Jika `surat_ttd` memiliki data:

1. Buka editor `Data Surat`.
2. Pilih satu penandatangan.
3. Pastikan field snapshot terisi:
   - `TTD_JABATAN`
   - `TTD_PANGKAT_GOLONGAN` jika tersedia pada layanan
   - `TTD_NAMA`
   - `TTD_NIP`
   - `TTD_AN` untuk `keterangan-lulus` jika tersedia
4. Ubah manual salah satu field hasil picker.
5. Simpan.
6. Cetak PDF.
7. Pastikan PDF memakai nilai manual yang tersimpan.
8. Jika aman di database lokal, ubah master `surat_ttd` setelah save.
9. Cetak PDF lagi.
10. Pastikan PDF tetap memakai snapshot request, bukan master terbaru.

Jika `surat_ttd` kosong atau tidak tersedia:

1. Pastikan editor tetap load.
2. Pastikan helper text manual penandatangan muncul.
3. Isi field TTD manual.
4. Simpan.
5. Cetak PDF.

## 10. Missing-Field Checklist

1. Buka record supported service di database lokal.
2. Kosongkan `TTD_NO_SURAT` melalui editor.
3. Simpan.
4. Pastikan readiness menyebut nomor surat belum diisi jika hanya nomor yang kurang.
5. Buka PDF route.
6. Pastikan response `422`.
7. Kosongkan beberapa field wajib lain di database lokal.
8. Load detail.
9. Pastikan readiness memakai pesan belum lengkap yang lebih umum.
10. Buka PDF route.
11. Pastikan response `422`.
12. Pastikan tidak ada PDF rusak dengan placeholder kosong.

## 11. Unsupported Service Checklist

Gunakan service di luar empat supported services, misalnya `{UNSUPPORTED_SERVICE_SLUG}`.

1. Buka detail admin.
2. Pastikan `Data Surat` tidak muncul.
3. Pastikan `Cetak Surat` tidak muncul.
4. Buka detail staff.
5. Pastikan `Data Surat` tidak muncul.
6. Pastikan `Cetak Surat` tidak muncul.
7. Buka `/api/requests/{UNSUPPORTED_SERVICE_SLUG}/{ID}/letter-metadata`.
8. Pastikan response `404`.
9. Buka `/api/requests/{UNSUPPORTED_SERVICE_SLUG}/{ID}/pdf`.
10. Pastikan response `404`.

## 12. Safe SQL For Finding Test Records

Query berikut hanya membaca data. Jangan menjalankan `INSERT`, `UPDATE`, atau `DELETE` untuk QA manual kecuali di database lokal yang aman.

Keterangan Lulus:

```sql
SELECT ID, NPM, TTD_NO_SURAT, TTD_TANGGAL, TTD_TANGGAL_BERLAKU, TTD_TEMPAT, TTD_JABATAN, TTD_NAMA, TTD_NIP, TGL_LULUS, IPK, YUDISIUM
FROM keterangan_lulus
ORDER BY ID DESC
LIMIT 10;
```

Masih Kuliah:

```sql
SELECT ID, NPM, SEMESTER, TAHUN_AKADEMIK, NAMA_ORANG_TUA, NIP_NRP, PANGKAT_GOLONGAN, INSTANSI, TTD_NO_SURAT, TTD_TANGGAL, TTD_TEMPAT, TTD_PANGKAT_GOLONGAN, TTD_JABATAN, TTD_NAMA, TTD_NIP
FROM masih_kuliah
ORDER BY ID DESC
LIMIT 10;
```

Masih Kuliah Aktif:

```sql
SELECT ID, NPM, SEMESTER, TAHUN_AKADEMIK, ALAMAT, TTD_NO_SURAT, TTD_TANGGAL, TTD_TEMPAT, TTD_PANGKAT_GOLONGAN, TTD_JABATAN, TTD_NAMA, TTD_NIP
FROM masih_kuliah_aktif
ORDER BY ID DESC
LIMIT 10;
```

Kelakuan Baik:

```sql
SELECT ID, NPM, ALAMAT, TTD_NO_SURAT, TTD_TANGGAL, TTD_TEMPAT, TTD_PANGKAT_GOLONGAN, TTD_JABATAN, TTD_NAMA, TTD_NIP
FROM kelakuan_baik
ORDER BY ID DESC
LIMIT 10;
```

Duplicate nomor surat:

```sql
SELECT 'keterangan-lulus' AS service_slug, ID, NPM, TTD_NO_SURAT
FROM keterangan_lulus
WHERE TRIM(TTD_NO_SURAT) = '{NOMOR_SURAT}'
UNION ALL
SELECT 'ket-tunjangan-orang-tua' AS service_slug, ID, NPM, TTD_NO_SURAT
FROM masih_kuliah
WHERE TRIM(TTD_NO_SURAT) = '{NOMOR_SURAT}'
UNION ALL
SELECT 'keterangan-masih-kuliah' AS service_slug, ID, NPM, TTD_NO_SURAT
FROM masih_kuliah_aktif
WHERE TRIM(TTD_NO_SURAT) = '{NOMOR_SURAT}'
UNION ALL
SELECT 'keterangan-kelakuan-baik' AS service_slug, ID, NPM, TTD_NO_SURAT
FROM kelakuan_baik
WHERE TRIM(TTD_NO_SURAT) = '{NOMOR_SURAT}';
```

## 13. Regression Checklist

Setelah official letter QA, cek cepat area yang tidak boleh ikut berubah:

1. Admin dashboard terbuka.
2. Admin requests list terbuka.
3. Staff requests list terbuka.
4. Status proses/selesai/kirim masih bekerja.
5. Magang detail tetap tampil.
6. SIK approval flow tetap tampil.
7. Information CRUD tetap terbuka.
8. Survey pages tetap terbuka.
9. Admin user management tetap terbuka.
10. User log tetap terbuka jika database tersedia.
11. Public homepage tidak berubah.

## 14. Pass Criteria

Flow dianggap siap demo manual jika:

- Admin dan staff bisa mengisi `Data Surat`.
- Metadata save sukses dan readiness refresh.
- Manual nomor surat trim/duplicate/overwrite behavior bekerja.
- Signer picker hanya mengisi snapshot.
- PDF memakai snapshot request.
- Unsupported services tetap tidak punya UI/PDF.
- Missing required fields menghasilkan `422`.
- DB unavailable menghasilkan fallback aman.
- `pnpm typecheck`, `pnpm lint`, dan `pnpm build` pass.
