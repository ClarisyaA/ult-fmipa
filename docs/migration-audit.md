# Migration Audit

Tanggal audit: 2026-07-15

## Keputusan

Riwayat `database/migrations` tidak 100% aman untuk di-rewrite, dihapus, atau
di-squash saat ini. Strategi yang dipilih adalah **Safe Forward-Compatible
Cleanup**:

- Pertahankan semua migration yang sudah ada.
- Jangan fold migration lama ke file `CREATE TABLE` sebelumnya.
- Jangan hapus migration additive seperti `010`, `011`, `014`, atau `016`.
- Jika ada perubahan schema berikutnya, buat migration baru yang additive dan
  idempotent.

Alasan:

- `pnpm db:support-migrate` menjalankan seluruh file `.sql` secara urut tanpa
  tabel pencatat migration yang sudah diterapkan.
- README mendokumentasikan support migrations sebagai bagian setup lokal,
  Docker, dan Kubernetes migration job.
- Beberapa migration adalah patch kompatibilitas untuk database yang sudah
  menjalankan versi migration lama.
- Banyak tabel layanan legacy tidak dibuat oleh support migrations ini, sehingga
  kolom kompatibilitas seperti `EMAIL` dan `BAHASA_SURAT` tetap perlu ditambah
  lewat migration additive.

## Audit File

| File | Fungsi | Dependensi/risiko | Keputusan |
| --- | --- | --- | --- |
| `002_create_ult_service_surveys.sql` | Membuat `ult_service_surveys`, unique key request/NPM, index service dan tanggal. | Dipakai fitur survei layanan. | Tetap. |
| `003_create_ult_information_posts.sql` | Membuat `ult_information_posts` dasar. | Diubah oleh `006`. | Tetap. |
| `005_create_ult_information_post_images.sql` | Membuat `ult_information_post_images`. | `IMAGE_FIT` ditambahkan oleh `011`; kode sudah membaca `IMAGE_FIT`. | Tetap. Jangan fold `011` kecuali history benar-benar belum pernah dipakai. |
| `006_alter_information_posts_schedule_archive.sql` | Menambah status `archived`, visibility fields, dan index. | Patch untuk tabel dari `003`. | Tetap. |
| `007_create_magang_sik_services.sql` | Membuat `permohonan_magang`, `surat_izin_kegiatan`, dan menambah `ATTACHMENT_TYPE`. | `permohonan_magang` dipatch oleh `014` dan `016`; SIK dipatch oleh `016`. | Tetap. |
| `008_create_ult_home_activities.sql` | Membuat `ult_home_activities`. | `IMAGE_FIT` ditambahkan oleh `010`; kode sudah membaca `IMAGE_FIT`. | Tetap. Jangan fold `010` kecuali history benar-benar belum pernah dipakai. |
| `009_create_ult_home_links.sql` | Membuat `ult_home_links` dan seed link kalender akademik. | Berbeda kontrak dengan `ult_service_links`. | Tetap. Jangan merge dengan `015`. |
| `010_add_image_fit_to_home_activities.sql` | Menambah dan menormalisasi `ult_home_activities.IMAGE_FIT`. | Dibutuhkan untuk DB yang sudah punya tabel dari `008` lama. | Tetap sebagai compatibility migration. |
| `011_add_image_fit_to_information_post_images.sql` | Menambah dan menormalisasi `ult_information_post_images.IMAGE_FIT`. | Dibutuhkan untuk DB yang sudah punya tabel dari `005` lama. | Tetap sebagai compatibility migration. |
| `012_create_profile_cms_tables.sql` | Membuat tabel profil organisasi/lokasi/jam dan seed default final. | Seed hanya saat organisasi kosong. | Tetap. |
| `013_seed_profile_organization_defaults.sql` | Repair seed organisasi lama dengan guard bentuk data legacy tertentu. | Berguna untuk DB yang pernah menjalankan `012` versi lama; tidak menyasar data user umum. | Tetap sebagai compatibility repair. |
| `014_add_magang_letter_metadata.sql` | Menambah field `TTD_*` untuk `permohonan_magang`. | Prisma dan PDF magang bergantung pada kolom ini. | Tetap sebagai compatibility migration. |
| `015_create_ult_service_links.sql` | Membuat `ult_service_links` dan seed template rekomendasi beasiswa. | Kontrak berbeda dari home link. | Tetap. |
| `016_add_email_and_language_to_requests.sql` | Menambah/memperlebar email dan bahasa surat untuk tabel request legacy, magang, dan SIK. | Banyak target table berasal dari dump legacy, bukan dibuat oleh support migrations. | Tetap sebagai compatibility migration. |

## Rekomendasi Cleanup

Cleanup yang aman untuk tahap sekarang adalah dokumentasi dan disiplin forward
migration:

- Jangan ubah isi migration yang mungkin sudah dijalankan di DB lokal, dev, atau
  deployment.
- Buat `017_...sql` untuk perubahan berikutnya daripada mengedit file lama.
- Pertahankan `CREATE TABLE IF NOT EXISTS` dan `ADD COLUMN IF NOT EXISTS`.
- Untuk seed, gunakan guard `WHERE NOT EXISTS` atau guard repair yang spesifik
  agar nilai editan admin tidak tertimpa.
- Jangan merge `ult_home_links` dan `ult_service_links`; backend memakai dua
  tabel dengan domain yang berbeda.
- Jika suatu hari ingin squash, lakukan hanya sebelum deployment/shared DB, atau
  setelah ada proses resmi: backup DB, migration tracking, fresh DB test, current
  DB test, dan sign-off eksplisit.

## Fresh DB dan Existing DB

Fresh DB tetap menjalankan:

```powershell
pnpm db:generate
pnpm db:prisma-migrate
pnpm db:support-migrate
```

Existing DB juga tetap menjalankan command yang sama. Karena runner tidak
menyimpan riwayat applied migration, setiap file harus tetap idempotent dan aman
diulang.

## Catatan Prisma

`prisma/schema.prisma` harus tetap selaras dengan hasil akhir migration,
terutama:

- `permohonan_magang.EMAIL`
- `permohonan_magang.BAHASA_SURAT`
- `permohonan_magang.TTD_*`
- `surat_izin_kegiatan.EMAIL_PENGIRIMAN`
- `surat_izin_kegiatan.BAHASA_SURAT`
- `IMAGE_FIT` pada CMS informasi dan kegiatan beranda

Jika schema Prisma berubah pada migration berikutnya, jalankan:

```powershell
pnpm prisma generate
```

## Validasi Audit Ini

Audit ini tidak mengubah file SQL migration, Prisma schema, backend runtime, atau
data database. Karena tidak ada migration/runtime yang diubah, validasi build
penuh tidak diwajibkan oleh audit ini. Validasi penuh tetap direkomendasikan
setelah perubahan schema berikutnya:

```powershell
pnpm db:support-migrate
pnpm typecheck
pnpm lint
pnpm build
```
