# Database Dump untuk Tim Unpad (Production)

## File yang diserahkan

**`fmipa_sbpk_for_production_20260908_203217.sql`** (~20.5 MB)

Import file ini, bukan `database/fmipa_sbpk.sql` di root repo. File itu adalah
baseline legacy mentah (belum ada tabel/kolom baru dari aplikasi ULT FMIPA
yang sekarang), kalau di-restore langsung ke production tanpa migration,
aplikasi akan error karena tabel seperti `ult_request_attachments` atau
kolom `data_users.APP_ROLE` belum ada.

## Cara file ini dibuat

1. Baseline legacy dump (`database/fmipa_sbpk.sql`, per 12 Agustus 2026)
   di-import ke database kosong.
2. Semua Prisma migration dijalankan di atasnya:
   - `20260612000000_create_ult_request_attachments`
   - `20260803000000_add_app_role_to_data_users`
3. Semua support migration (`database/migrations/001` s.d. `011`) dijalankan
   di atasnya (CMS, service surveys, service links, dll).
4. Hasil akhirnya di-dump dengan `mariadb-dump --single-transaction --routines
   --triggers --events`.

Jadi file ini = data lama (mahasiswa, ijazah, beasiswa, dst) + skema
terbaru yang dipakai aplikasi produksi saat ini, dalam satu file siap
restore.

## Cara restore

Ini dump **MariaDB** (dibuat dengan `mariadb-dump`, kompatibel dengan MySQL).
Pastikan target server MariaDB/MySQL, bukan Postgres atau engine lain.

```bash
mariadb -u <user> -p <nama_database> < fmipa_sbpk_for_production_20260908_203217.sql
```

Database tujuan harus sudah dibuat kosong terlebih dahulu (`CREATE DATABASE
... CHARACTER SET utf8mb4;`) sebelum restore.

## Hal penting yang perlu diketahui tim Unpad

1. **Password akun lama (`data_users`) memakai hash SHA-1** (konvensi legacy
   `hashLegacyPassword`), bukan bcrypt/modern hashing. Ini berlaku untuk ~40
   akun staff/admin yang ikut ter-dump. Kalau ini jadi masalah kebijakan
   keamanan, perlu didiskusikan dan direncanakan migrasi hash sebelum
   go-live (misalnya paksa reset password saat login pertama).
2. **Snapshot per 8 September 2026.** Kalau ada migration baru (Prisma atau
   support migration) yang dibuat setelah tanggal ini sebelum go-live,
   dump ini perlu di-generate ulang supaya skemanya tetap sinkron dengan
   aplikasi yang di-deploy.
3. **Berisi data pribadi mahasiswa** (nama, NPM, dan data akademik lain di
   tabel seperti `mahasiswa`, `ijazah`, `transkrip`, dst). Serahkan lewat
   kanal yang aman dan sesuai kebijakan data Unpad/FMIPA, jangan lewat
   channel publik/tidak terenkripsi.
4. **Environment variable production** (`DATABASE_URL`, `NEXTAUTH_SECRET`,
   `PAUS_*`, MinIO credentials, dll) tidak termasuk dalam file ini dan harus
   di-generate baru khusus untuk production — jangan reuse nilai dari
   environment lokal/staging manapun. Lihat
   `docs/local-staging-rehearsal.md` bagian 20 ("Delta when moving to real
   VPS staging") dan `docs/production-deployment-guide.md` untuk daftar
   lengkapnya.
5. Setelah restore data, jalankan migration Prisma + support migration
   sekali lagi di server production (`pnpm db:prisma-migrate && pnpm
   db:support-migrate`) untuk memastikan tabel `_prisma_migrations` tercatat
   benar di server tersebut — jangan asumsikan cukup dari isi dump saja.

## Ringkasan isi data (jumlah baris per tabel utama)

| Tabel | Jumlah baris |
|---|---|
| mahasiswa | 25.028 |
| mahasiswa_sd_2015 | 17.365 |
| log_users | 39.177 |
| kpa | 12.733 |
| masih_kuliah_aktif | 8.210 |
| legalisir | 6.125 |
| keterangan_lulus | 5.670 |
| beasiswa | 2.429 |
| bebas_pinjaman | 3.174 |
| unggah_karya_ilmiah | 1.659 |
| kks | 1.764 |
| surat_pengantar | 1.356 |
| ijazah | 1.063 |
| transkrip | 762 |
| alumni | 344 |
| plagiarisme | 308 |
| kelakuan_baik | 163 |
| data_users | 40 |

(Tabel lain seperti `ult_request_attachments`, `ult_information_posts`, dll
masih 0 baris karena memang belum ada data operasional di sistem baru per
tanggal dump ini.)
