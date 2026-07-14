# Setup Local ULT FMIPA Unpad

Panduan ini menjelaskan cara menjalankan project ULT FMIPA Unpad di komputer
lokal setelah cleanup migration.

Flow database lokal yang benar:

1. Import `database/fmipa_sbpk.sql` sebagai base legacy database dump.
2. Jalankan Prisma migrations.
3. Jalankan clean support migrations aktif di `database/migrations`.
4. Jalankan Next.js dev server.

Jangan jalankan `database/migrations_legacy_backup`. Folder itu hanya arsip
migration lama.

## Prasyarat

Pastikan sudah tersedia:

- Git
- Node.js sesuai versi project
- pnpm
- Docker Desktop
- PowerShell

## Clone Project

```powershell
git clone <repo-url>
cd ULT\ult-fmipa
```

Sesuaikan path dengan lokasi clone di komputer masing-masing.

## Install Dependency

```powershell
pnpm install
```

Jika PowerShell menolak `pnpm` karena execution policy, gunakan:

```powershell
pnpm.cmd install
```

## Setup Environment

Buat file `.env` di root project `ult-fmipa`.

Contoh:

```dotenv
DATABASE_URL="mysql://ult_user:ult_password@127.0.0.1:13306/fmipa_sbpk"

DB_HOST="127.0.0.1"
DB_PORT="13306"
DB_USER="ult_user"
DB_PASSWORD="ult_password"
DB_NAME="fmipa_sbpk"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-development-secret"

DEV_STUDENT_NPM="140810230017"
DEV_STUDENT_PASSWORD="password"

DEV_ADMIN_EMAIL="admin@ult.local"
DEV_ADMIN_PASSWORD="password"

DEV_STAFF_EMAIL="staff@ult.local"
DEV_STAFF_PASSWORD="password"
```

Sesuaikan credential dev dengan yang benar di project. Jangan commit `.env`.

## Start Database Docker

```powershell
docker compose up -d
```

Cek container:

```powershell
docker ps
```

Pastikan container database `ult-fmipa-db` berjalan.

## Buat Database fmipa_sbpk

```powershell
docker exec -i ult-fmipa-db mariadb -u root -proot -e "CREATE DATABASE IF NOT EXISTS fmipa_sbpk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Grant user aplikasi:

```powershell
docker exec -i ult-fmipa-db mariadb -u root -proot -e "GRANT ALL PRIVILEGES ON fmipa_sbpk.* TO 'ult_user'@'%'; FLUSH PRIVILEGES;"
```

## Import Base Database fmipa_sbpk.sql

`database/fmipa_sbpk.sql` adalah base legacy dump. Dump ini berisi tabel legacy,
data user lama, data layanan lama, dan data referensi.

Import normal:

```powershell
Get-Content .\database\fmipa_sbpk.sql | docker exec -i ult-fmipa-db mariadb -u root -proot fmipa_sbpk
```

Jika import gagal karena strict mode atau data legacy lama seperti zero date atau
nilai terlalu panjang, ulangi dari database kosong atau database yang sudah
dibuat ulang, lalu gunakan mode kompatibel:

```powershell
Get-Content .\database\fmipa_sbpk.sql | docker exec -i ult-fmipa-db mariadb -u root -proot --init-command="SET SESSION sql_mode='NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'" fmipa_sbpk
```

Verifikasi tabel:

```powershell
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW TABLES;"
```

## Generate Prisma Client

```powershell
pnpm prisma generate
```

Atau:

```powershell
pnpm.cmd prisma generate
```

## Jalankan Prisma Migration

Prisma migration membuat tabel yang dimiliki Prisma, termasuk attachment.

```powershell
pnpm db:prisma-migrate
```

## Jalankan Support Migrations

Support migrations aktif berada di:

```text
database/migrations
```

Folder ini berisi clean support migration set:

```text
001_create_service_surveys.sql
002_create_information_cms.sql
003_create_homepage_cms.sql
004_create_profile_cms.sql
005_create_magang_sik_services.sql
006_create_service_links.sql
007_add_legacy_request_compat_columns.sql
008_create_service_suggestions.sql
```

Jalankan:

```powershell
pnpm db:support-migrate
```

Jangan jalankan:

```text
database/migrations_legacy_backup
```

Folder `database/migrations_legacy_backup` hanya arsip migration lama. Jangan
menjalankan folder backup dan folder aktif pada database yang sama.

## Verifikasi Kolom Penting

Jalankan perintah berikut:

```powershell
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM permohonan_magang LIKE 'EMAIL';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM permohonan_magang LIKE 'BAHASA_SURAT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM permohonan_magang LIKE 'TTD_NO_SURAT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM surat_izin_kegiatan LIKE 'EMAIL_PENGIRIMAN';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM surat_izin_kegiatan LIKE 'BAHASA_SURAT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM ult_home_activities LIKE 'IMAGE_FIT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM ult_information_post_images LIKE 'IMAGE_FIT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW COLUMNS FROM ult_request_attachments LIKE 'ATTACHMENT_TYPE';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk; SHOW TABLES LIKE 'ult_service_suggestions';"
```

Jika setiap command mengembalikan satu row kolom, hasil migration sudah benar.

## Jalankan Validasi Project

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

Jika PowerShell menolak `pnpm`, gunakan:

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd build
```

## Run Website Local

```powershell
pnpm run dev
```

Buka:

```text
http://localhost:3000
```

## Login Development

Gunakan credential development sesuai `.env` dan data project:

- Student: `DEV_STUDENT_NPM`
- Admin: `DEV_ADMIN_EMAIL`
- Staff: `DEV_STAFF_EMAIL`

Jika login gagal, cek kembali `.env`, data user di dump, dan credential dev yang
dipakai project.

## Checklist Smoke Test

Student:

- Login sebagai student.
- Buka `/layanan`.
- Submit satu pengajuan layanan.
- Isi Email, misalnya `student@gmail.com`.
- Pilih Bahasa Surat.
- Pastikan submit berhasil.

Admin/staff:

- Buka detail pengajuan.
- Pastikan email tampil.
- Pastikan Bahasa Surat tampil.
- Buka email draft helper.
- Pastikan Gmail helper memakai email student.
- Pastikan tidak ada warning `Email tujuan belum tersedia`.

Printable services:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`
- `permohonan-magang-kerja-praktek-ta`

Konfirmasi:

- Data Surat terbuka.
- `Cetak Surat` muncul di sebelah `Simpan`.
- PDF terbuka.

SIK:

- Buat request SIK.
- Admin/staff dapat approve verification.
- Student dapat melanjutkan final form.
- Setelah final submit, workflow normal tampil.

CMS:

- Informasi `imageFit` berjalan.
- Kegiatan Beranda `imageFit` berjalan.
- Profile Struktur Organisasi/Lokasi berjalan.
- Survey berjalan.

## Troubleshooting

### Docker DB Belum Jalan

Cek container:

```powershell
docker ps
```

Jika belum jalan:

```powershell
docker compose up -d
```

### Port Database Bentrok

Project memakai port host `13306`. Jika bentrok, cek process/container lain yang
memakai port tersebut, lalu hentikan atau sesuaikan konfigurasi Docker lokal.

### Import fmipa_sbpk.sql Gagal

Jika gagal karena strict mode atau data lama, gunakan import kompatibel:

```powershell
Get-Content .\database\fmipa_sbpk.sql | docker exec -i ult-fmipa-db mariadb -u root -proot --init-command="SET SESSION sql_mode='NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'" fmipa_sbpk
```

### Prisma Unknown Field Error

Generate ulang Prisma Client:

```powershell
pnpm prisma generate
```

Lalu restart dev server.

### Next Cache Lama

Hapus cache:

```powershell
Remove-Item -Recurse -Force .next
pnpm dev
```

### pnpm db:support-migrate Duplicate Error

Pastikan yang dijalankan hanya folder aktif:

```text
database/migrations
```

Jangan menjalankan:

```text
database/migrations_legacy_backup
```

Jika error tetap terjadi, cek file SQL aktif yang gagal dan pastikan statement
bersifat idempotent.

### App Masih Connect ke DB Test

Cek `.env`:

```dotenv
DB_NAME="fmipa_sbpk"
DATABASE_URL="mysql://ult_user:ult_password@127.0.0.1:13306/fmipa_sbpk"
```

Tutup terminal lama dan buka terminal baru agar temporary env variables dari
validasi DB test hilang.

## Urutan Command Ringkas

```powershell
pnpm install

docker compose up -d

docker exec -i ult-fmipa-db mariadb -u root -proot -e "CREATE DATABASE IF NOT EXISTS fmipa_sbpk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "GRANT ALL PRIVILEGES ON fmipa_sbpk.* TO 'ult_user'@'%'; FLUSH PRIVILEGES;"

Get-Content .\database\fmipa_sbpk.sql | docker exec -i ult-fmipa-db mariadb -u root -proot --init-command="SET SESSION sql_mode='NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'" fmipa_sbpk

pnpm prisma generate
pnpm db:prisma-migrate
pnpm db:support-migrate

pnpm typecheck
pnpm lint
pnpm build

pnpm dev
```

## Catatan Penting

- `database/fmipa_sbpk.sql` adalah base legacy dump.
- `database/migrations` adalah clean support migrations aktif.
- `database/migrations_legacy_backup` hanya arsip. Jangan dijalankan.
- `.env` tidak boleh di-commit.
- File backup `.sql` tidak boleh di-commit.
- Jika memakai PowerShell dan `pnpm` diblokir, gunakan `pnpm.cmd`.

## Catatan Storage Lokal

File upload runtime tidak ikut di-commit ke repository. Pada fresh local setup,
beberapa baris database dari dump bisa menunjuk file yang tidak ada di laptop
lokal, sehingga gambar terlihat sebagai placeholder.

Folder yang biasanya berisi file runtime:

- `storage/home-activities`
- `storage/information`
- `storage/uploads`
- `storage/profile`

Jika gambar CMS hilang di local environment, unggah atau ganti gambar dari
halaman admin CMS terkait. Jangan commit file upload asli hanya untuk menutup
referensi lokal yang hilang.

## Catatan PDF Surat Bilingual

Route PDF surat resmi mendukung pilihan bahasa eksplisit:

- `/api/requests/{serviceSlug}/{id}/pdf?lang=id`
- `/api/requests/{serviceSlug}/{id}/pdf?lang=en`

Di Data Surat admin/staff, tombol `Cetak Surat Indo` dan `Cetak Surat Inggris`
selalu tersedia untuk layanan printable setelah data surat lengkap.
`BAHASA_SURAT` tetap menyimpan preferensi bahasa dari mahasiswa, tetapi
admin/staff tetap bisa mencetak salah satu bahasa secara manual.

Template Inggris tersedia untuk layanan printable:

- `keterangan-lulus`
- `ket-tunjangan-orang-tua`
- `keterangan-masih-kuliah`
- `keterangan-kelakuan-baik`
- `permohonan-magang-kerja-praktek-ta`
