# Clean Support Migration Plan

Tanggal rencana: 2026-07-15

## Keputusan

`database/fmipa_sbpk.sql` tetap menjadi base legacy database dump. Clean support
migrations **bukan** pengganti dump legacy dan bukan script restore data manual.
Flow fresh setup yang dituju adalah:

```powershell
pnpm db:generate
pnpm db:prisma-migrate
pnpm db:support-migrate
```

Urutan aktualnya:

1. Import `database/fmipa_sbpk.sql`.
2. Jalankan Prisma migrations untuk tabel yang dimiliki Prisma.
3. Jalankan clean support migrations untuk tabel/kolom tambahan aplikasi Next.js.

Clean support migrations tetap SQL, idempotent, additive, dan aman dijalankan
setelah latest dump. Folder clean sudah menjadi active support migration folder.

## Folder Migration

Folder aktif saat ini:

```text
database/migrations
```

Folder backup old compatibility chain:

```text
database/migrations_legacy_backup
```

`pnpm db:support-migrate` membaca `database/migrations` melalui
`scripts/run-support-migrations.mjs`, sehingga command tersebut sekarang memakai
clean support migrations. Jangan jalankan `database/migrations_legacy_backup`
bersama clean migrations pada DB yang sama.

## Struktur Clean Support Migrations

| File aktif | Isi |
| --- | --- |
| `001_create_service_surveys.sql` | Final `ult_service_surveys`. |
| `002_create_information_cms.sql` | Final `ult_information_posts` dan `ult_information_post_images`, termasuk `IMAGE_FIT` sejak awal. |
| `003_create_homepage_cms.sql` | Final `ult_home_activities` termasuk `IMAGE_FIT`, final `ult_home_links`, seed kalender akademik. |
| `004_create_profile_cms.sql` | Final profile organization/location/hours dan seed default satu kali, tanpa repair seed terpisah. |
| `005_create_magang_sik_services.sql` | Final `permohonan_magang` termasuk `EMAIL`, `BAHASA_SURAT`, `TTD_*`; final `surat_izin_kegiatan` termasuk approval/final fields, `EMAIL_PENGIRIMAN`, `BAHASA_SURAT`. |
| `006_create_service_links.sql` | Final `ult_service_links`, seed template rekomendasi beasiswa. |
| `007_add_legacy_request_compat_columns.sql` | Kolom kompatibilitas untuk tabel layanan legacy dari dump dan `ult_request_attachments.ATTACHMENT_TYPE`. |

Folder ini melipat chain lama seperti `005 -> 011`, `008 -> 010`,
`012 -> 013`, dan `007 -> 014` untuk tabel support yang dibuat oleh Next.js app.

## Prinsip Schema

Clean support migrations hanya boleh:

- Membuat support tables baru yang dibutuhkan aplikasi Next.js.
- Menambah kolom kompatibilitas yang hilang pada tabel legacy dari dump.
- Menambah seed support data yang dibutuhkan aplikasi.
- Skip aman jika kolom/tabel sudah ada.

Clean support migrations tidak boleh:

- Membuat ulang semua legacy tables dari awal.
- Menghapus, rename, atau drop data.
- Mengasumsikan old support migrations sudah pernah berjalan.
- Menimpa data admin yang sudah diedit.

## Final Schema Yang Harus Ada

Support tables:

- `ult_service_surveys`
- `ult_information_posts`
- `ult_information_post_images`
- `ult_request_attachments` dari Prisma migration, plus `ATTACHMENT_TYPE`
- `ult_home_activities`
- `ult_home_links`
- `ult_profile_organization_nodes`
- `ult_profile_location_settings`
- `ult_profile_location_hours`
- `ult_service_links`
- `permohonan_magang`
- `surat_izin_kegiatan`

Kolom folded ke create-table clean migrations:

- `ult_home_activities.IMAGE_FIT`
- `ult_information_post_images.IMAGE_FIT`
- `permohonan_magang.EMAIL`
- `permohonan_magang.BAHASA_SURAT`
- `permohonan_magang.TTD_*`
- `surat_izin_kegiatan.EMAIL_PENGIRIMAN VARCHAR(150)`
- `surat_izin_kegiatan.BAHASA_SURAT`

Kolom kompatibilitas untuk legacy request tables:

- `kpa.EMAIL`, `kpa.BAHASA_SURAT`
- `kks.EMAIL`, `kks.BAHASA_SURAT`
- `beasiswa.EMAIL`, `beasiswa.BAHASA_SURAT`
- `bebas_pinjaman.EMAIL`, `bebas_pinjaman.BAHASA_SURAT`
- `masih_kuliah.EMAIL`, `masih_kuliah.BAHASA_SURAT`
- `masih_kuliah_aktif.EMAIL`, `masih_kuliah_aktif.BAHASA_SURAT`
- `kelakuan_baik.EMAIL`, `kelakuan_baik.BAHASA_SURAT`
- `surat_pengantar.EMAIL`, `surat_pengantar.BAHASA_SURAT`
- `keterangan_lulus.EMAIL`, `keterangan_lulus.BAHASA_SURAT`
- `transkrip.EMAIL`, `transkrip.BAHASA_SURAT`
- `ijazah.EMAIL`, `ijazah.BAHASA_SURAT`
- `legalisir.EMAIL`, `legalisir.BAHASA_SURAT`
- `unggah_karya_ilmiah.EMAIL`, `unggah_karya_ilmiah.BAHASA_SURAT`
- `plagiarisme.EMAIL`, `plagiarisme.BAHASA_SURAT`
- `referensi.EMAIL`, `referensi.BAHASA_SURAT`

## Seed Rules

Seed harus idempotent dan tidak overwrite edit admin.

- Academic calendar link: insert jika missing; jangan reset URL admin.
- Scholarship recommendation template link: insert jika missing; jangan reset URL admin.
- Profile location default: insert hanya jika belum ada setting.
- Profile organization default: seed hanya jika organization table kosong.
- Tidak ada repair migration yang mengubah user-edited organization tree.

## Backup Sebelum Eksperimen Local

Backup DB utama sebelum eksperimen reset lokal:

```powershell
docker exec ult-fmipa-db mariadb-dump -u root -proot --databases fmipa_sbpk --single-transaction --routines --triggers --events > backup_fmipa_sbpk_before_clean_migrations.sql
```

Restore penuh hanya untuk rollback:

```powershell
Get-Content .\backup_fmipa_sbpk_before_clean_migrations.sql | docker exec -i ult-fmipa-db mariadb -u root -proot
```

## Disposable Validation

Gunakan DB test terpisah:

```powershell
docker exec -i ult-fmipa-db mariadb -u root -proot -e "DROP DATABASE IF EXISTS fmipa_sbpk_clean_migration_test; CREATE DATABASE fmipa_sbpk_clean_migration_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Import latest dump:

```powershell
Get-Content .\database\fmipa_sbpk.sql | docker exec -i ult-fmipa-db mariadb -u root -proot fmipa_sbpk_clean_migration_test
```

Jika dump legacy gagal karena strict mode pada data lama, ulang dari DB test
kosong dengan session mode kompatibel:

```powershell
docker exec -i ult-fmipa-db mariadb -u root -proot -e "DROP DATABASE IF EXISTS fmipa_sbpk_clean_migration_test; CREATE DATABASE fmipa_sbpk_clean_migration_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content .\database\fmipa_sbpk.sql | docker exec -i ult-fmipa-db mariadb -u root -proot --init-command="SET SESSION sql_mode='NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'" fmipa_sbpk_clean_migration_test
```

Point migration scripts ke DB test. Catatan: `scripts/deploy-prisma-migrations.mjs`
menggunakan `DB_NAME`, bukan `DATABASE_URL`.

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="13306"
$env:DB_USER="ult_user"
$env:DB_PASSWORD="ult_password"
$env:DB_NAME="fmipa_sbpk_clean_migration_test"
pnpm db:prisma-migrate
```

Run active clean support migrations:

```powershell
pnpm db:support-migrate
```

Verify columns:

```powershell
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM permohonan_magang LIKE 'EMAIL';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM permohonan_magang LIKE 'BAHASA_SURAT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM permohonan_magang LIKE 'TTD_NO_SURAT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM surat_izin_kegiatan LIKE 'EMAIL_PENGIRIMAN';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM surat_izin_kegiatan LIKE 'BAHASA_SURAT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM ult_home_activities LIKE 'IMAGE_FIT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM ult_information_post_images LIKE 'IMAGE_FIT';"
docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM ult_request_attachments LIKE 'ATTACHMENT_TYPE';"
```

Verify legacy request compatibility columns:

```powershell
$tables = @(
  "kpa","kks","beasiswa","bebas_pinjaman","masih_kuliah",
  "masih_kuliah_aktif","kelakuan_baik","surat_pengantar",
  "keterangan_lulus","transkrip","ijazah","legalisir",
  "unggah_karya_ilmiah","plagiarisme","referensi"
)

foreach ($table in $tables) {
  docker exec -i ult-fmipa-db mariadb -u root -proot -e "USE fmipa_sbpk_clean_migration_test; SHOW COLUMNS FROM $table LIKE 'EMAIL'; SHOW COLUMNS FROM $table LIKE 'BAHASA_SURAT';"
}
```

Run app validation with DB env still pointing to test:

```powershell
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm build
```

## Smoke Checklist

Run when practical:

- Submit request with email.
- Check Gmail helper detects request email.
- Check `Bahasa Surat` appears in forms.
- Check KPA/KKS optional attachment.
- Check Beasiswa dynamic Google Docs template link.
- Check Magang request detail.
- Check Magang Data Surat.
- Check Magang PDF.
- Check SIK approval.
- Check Informasi `imageFit`.
- Check Homepage activities `imageFit`.
- Check Profile organization/location.
- Check Survey.
- Check admin/staff request list/status.

## Disposable Clean Migration Validation Result

Tanggal validasi: 2026-07-15

DB disposable:

```text
fmipa_sbpk_clean_migration_test
```

Hasil:

- Disposable DB created: passed.
- Legacy dump import: initial normal import failed on strict-mode legacy data:
  `ERROR 1406 (22001) ... Data too long for column 'email_inst'`.
- Legacy dump import retry: passed after recreating the disposable DB and using
  session-only compatibility SQL mode:
  `SET SESSION sql_mode='NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'`.
- Prisma migration: initial run failed because `ult_user` did not yet have
  privileges on the newly-created disposable DB.
- Disposable DB grant: added only for `fmipa_sbpk_clean_migration_test`.
- Prisma migration retry: passed; applied
  `20260612000000_create_ult_request_attachments`.
- Clean support migrations from `database/migrations_baseline`: passed.
- Schema column checks: passed.
- `pnpm prisma generate`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed.

Checked required support columns:

- `permohonan_magang.EMAIL`
- `permohonan_magang.BAHASA_SURAT`
- `permohonan_magang.TTD_NO_SURAT`
- `surat_izin_kegiatan.EMAIL_PENGIRIMAN`
- `surat_izin_kegiatan.BAHASA_SURAT`
- `ult_home_activities.IMAGE_FIT`
- `ult_information_post_images.IMAGE_FIT`
- `ult_request_attachments.ATTACHMENT_TYPE`

Checked legacy request compatibility columns:

- `EMAIL` and `BAHASA_SURAT` exist on all target legacy request tables:
  `kpa`, `kks`, `beasiswa`, `bebas_pinjaman`, `masih_kuliah`,
  `masih_kuliah_aktif`, `kelakuan_baik`, `surat_pengantar`,
  `keterangan_lulus`, `transkrip`, `ijazah`, `legalisir`,
  `unggah_karya_ilmiah`, `plagiarisme`, and `referensi`.

Issues found:

- The latest legacy dump may need a compatibility SQL mode during import on the
  current local MariaDB because old data exceeds some legacy column widths.
- Newly-created disposable DBs need `ult_user` privileges before running app
  migration scripts.

Readiness:

- The clean support migration candidate passed pre-switch validation.
- Active migration switch was performed after explicit confirmation.
- Old compatibility migrations are preserved in `database/migrations_legacy_backup`.
- `scripts/run-support-migrations.mjs` was not changed because it already reads
  the active `database/migrations` folder.

## Active Clean Migration Switch Validation Result

Tanggal validasi: 2026-07-15

Active folder switched:

- Clean support migrations are active in `database/migrations`.
- Old compatibility migrations are preserved in `database/migrations_legacy_backup`.
- `database/migrations_baseline` was removed after its files became active.

DB disposable:

```text
fmipa_sbpk_active_clean_test
```

Hasil:

- Disposable DB created: passed.
- Latest legacy dump import: passed with session-only compatibility SQL mode:
  `SET SESSION sql_mode='NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'`.
- Disposable DB grant for `ult_user`: passed.
- Prisma migration: passed; applied
  `20260612000000_create_ult_request_attachments`.
- `pnpm db:support-migrate`: passed and ran the active clean migration set:
  `001_create_service_surveys.sql`,
  `002_create_information_cms.sql`,
  `003_create_homepage_cms.sql`,
  `004_create_profile_cms.sql`,
  `005_create_magang_sik_services.sql`,
  `006_create_service_links.sql`, and
  `007_add_legacy_request_compat_columns.sql`.
- Schema column checks: passed.
- `pnpm prisma generate`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed.

Checked required support columns:

- `permohonan_magang.EMAIL`
- `permohonan_magang.BAHASA_SURAT`
- `permohonan_magang.TTD_NO_SURAT`
- `surat_izin_kegiatan.EMAIL_PENGIRIMAN`
- `surat_izin_kegiatan.BAHASA_SURAT`
- `ult_home_activities.IMAGE_FIT`
- `ult_information_post_images.IMAGE_FIT`
- `ult_request_attachments.ATTACHMENT_TYPE`

Checked legacy request compatibility columns:

- `EMAIL` and `BAHASA_SURAT` exist on all target legacy request tables:
  `kpa`, `kks`, `beasiswa`, `bebas_pinjaman`, `masih_kuliah`,
  `masih_kuliah_aktif`, `kelakuan_baik`, `surat_pengantar`,
  `keterangan_lulus`, `transkrip`, `ijazah`, `legalisir`,
  `unggah_karya_ilmiah`, `plagiarisme`, and `referensi`.

Issues found:

- No schema or build issues found during active clean migration validation.
- The latest legacy dump still needs compatibility SQL mode on the current local
  MariaDB because old legacy data can violate strict mode.
- Newly-created disposable DBs need `ult_user` privileges before app migration
  scripts can connect.

Final status:

- Active clean migration switch is validated.
- `pnpm db:support-migrate` now uses the clean migration set.
- Main `fmipa_sbpk` database was not dropped or reset.
- Backend/API/UI/Prisma schema were not changed.

## Main Local DB Clean Migration Validation Result

Tanggal validasi: 2026-07-15

DB utama:

```text
fmipa_sbpk
```

Backup:

```text
backup_fmipa_sbpk_before_active_clean_main_validation.sql
```

Backup result:

- Backup created before running active clean migrations on the main local DB.
- Backup file exists and is not empty.
- Backup size observed: `41430948` bytes.

Environment confirmation:

- `.env` points to `DB_NAME="fmipa_sbpk"`.
- `.env` uses `DB_HOST="localhost"`, `DB_PORT="13306"`,
  `DB_USER="ult_user"`, and `DB_PASSWORD="ult_password"`.
- No test DB env variables were present in the validation shell before running
  main DB validation.

Migration result:

- Initial `pnpm db:support-migrate` command through PowerShell shim failed due
  local PowerShell execution policy blocking `pnpm.ps1`.
- Retried with `pnpm.cmd db:support-migrate`: passed.
- Active clean migrations ran safely and idempotently on the existing main DB:
  `001_create_service_surveys.sql`,
  `002_create_information_cms.sql`,
  `003_create_homepage_cms.sql`,
  `004_create_profile_cms.sql`,
  `005_create_magang_sik_services.sql`,
  `006_create_service_links.sql`, and
  `007_add_legacy_request_compat_columns.sql`.
- Seed duplicate behavior was tightened after review: homepage and service link
  seed statements now use no-op duplicate-key updates so existing admin-edited
  labels/URLs are not overwritten by future migration reruns.
- Retried `pnpm.cmd db:support-migrate` after the seed no-op update: passed.

Schema check result:

- Required support columns exist:
  `permohonan_magang.EMAIL`,
  `permohonan_magang.BAHASA_SURAT`,
  `permohonan_magang.TTD_NO_SURAT`,
  `surat_izin_kegiatan.EMAIL_PENGIRIMAN`,
  `surat_izin_kegiatan.BAHASA_SURAT`,
  `ult_home_activities.IMAGE_FIT`,
  `ult_information_post_images.IMAGE_FIT`, and
  `ult_request_attachments.ATTACHMENT_TYPE`.
- `EMAIL` and `BAHASA_SURAT` exist on all target legacy request tables:
  `kpa`, `kks`, `beasiswa`, `bebas_pinjaman`, `masih_kuliah`,
  `masih_kuliah_aktif`, `kelakuan_baik`, `surat_pengantar`,
  `keterangan_lulus`, `transkrip`, `ijazah`, `legalisir`,
  `unggah_karya_ilmiah`, `plagiarisme`, and `referensi`.

App validation result:

- `pnpm.cmd prisma generate`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd lint`: passed.
- `pnpm.cmd build`: passed.

Manual smoke test result:

- Not executed in this pass.
- The requested smoke test requires an interactive logged-in browser/session and
  test submissions through student/admin/staff flows.
- Treat manual QA as pending before release if those flows need explicit
  confirmation beyond schema/build validation.

Issues found:

- No schema, migration idempotency, typecheck, lint, or build issues found.
- Local PowerShell blocks `pnpm.ps1`; use `pnpm.cmd` on this machine.
- Main local DB was not dropped or reset.
