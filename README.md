# ULT FMIPA Unpad

Website Unit Layanan Terpadu (ULT) FMIPA Unpad - aplikasi layanan akademik dan
kemahasiswaan berbasis Next.js App Router. Aplikasi memakai database legacy
MariaDB `fmipa_sbpk` untuk data layanan/pengguna lama, ditambah tabel support
non-legacy untuk lampiran, survei, CMS informasi, CMS beranda, dan CMS profil.
Seluruh file yang diunggah pengguna (lampiran layanan, gambar kegiatan,
gambar informasi, foto profil) disimpan di **MinIO** (S3-compatible object
storage), bukan filesystem lokal.

Dokumen ini adalah referensi utama repository. Untuk langkah setup praktis
step-by-step, lihat [`SETUP.md`](./SETUP.md).

## 1. Project Overview

- **Tujuan**: portal layanan ULT FMIPA Unpad untuk mahasiswa (pengajuan
  layanan, riwayat, survei kepuasan), staff (proses pengajuan, CMS konten),
  dan admin (semua akses staff plus manajemen penuh).
- **Database**: MariaDB legacy `fmipa_sbpk` (tabel layanan/`data_users` lama)
  digabung dengan tabel support baru yang dikelola lewat migration runner
  kustom (bukan `prisma db push`).
- **Storage**: MinIO private bucket. Browser tidak pernah mengakses MinIO
  secara langsung - semua file diproksi lewat route API aplikasi.
- **Auth**: NextAuth Credentials Provider (login lokal untuk admin/staff/dev
  account) dengan fondasi PAUS OAuth (Unpad SSO) yang belum diaktifkan untuk
  production.

## 2. Main Features

- Katalog layanan publik dan pengajuan layanan oleh mahasiswa, dengan upload
  lampiran (PDF/JPG/PNG) ke MinIO.
- Riwayat pengajuan mahasiswa dan survei kepuasan untuk request yang selesai.
- Dashboard admin/staff: list, detail, update status, hapus (admin-only)
  pengajuan layanan; ringkasan survei.
- **CMS Informasi/Pengumuman** - draft/published/archived, jadwal tayang,
  galeri multi-gambar (maksimal 5 gambar) dengan cover, alt text, dan
  image-fit per gambar.
- **CMS Kegiatan Mahasiswa (Beranda)** - kegiatan dengan **multi-gambar**
  (maksimal 10 gambar per kegiatan), cover otomatis/manual, image-fit per
  gambar, ditampilkan sebagai carousel di homepage.
- **CMS Struktur Profil** - hierarki node organisasi (parent-child bebas,
  bukan tabel tetap), judul/subjudul section, item per node, dikelola dari
  admin/staff dan dirender rekursif di halaman publik `/profil`.
- **CMS Lokasi Profil** - jam layanan dan info lokasi ULT.
- Notifikasi request real-time (in-app) untuk admin/staff.
- Storage integrity audit read-only untuk membandingkan metadata database
  dengan object MinIO aktual.

## 3. Tech Stack

| Area | Teknologi |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, lucide-react |
| Auth | NextAuth v4 Credentials Provider (admin/staff/dev), fondasi PAUS OAuth |
| Database | MariaDB 11 (`fmipa_sbpk`), Prisma 7 (client + raw SQL untuk tabel support) |
| Object storage | MinIO (S3-compatible), private bucket |
| Local infra | Docker Compose (app, db, minio, minio-init, adminer) |
| Testing | `pnpm test:unit` (Node test runner, source-level checks), Playwright E2E (manual, tidak berjalan otomatis di CI) |
| Checks | `pnpm typecheck`, `pnpm lint`, `pnpm build` |

Package manager: **pnpm** (dipakai lewat Corepack, lihat [`Dockerfile`](./Dockerfile)).

## 4. Prerequisites

- Git
- Node.js 22 LTS (image runtime memakai `node:22-bookworm-slim`, lihat
  [`Dockerfile`](./Dockerfile))
- pnpm (aktifkan lewat `corepack enable` jika belum ada)
- Docker Desktop (untuk MariaDB, MinIO, dan Adminer lokal)

Cek cepat:

```powershell
node -v
pnpm -v
docker -v
docker compose version
git --version
```

## 5. Local Development Setup

Ringkasan singkat - untuk langkah detail per-step (termasuk penjelasan
lengkap dua mode) lihat [`SETUP.md`](./SETUP.md). Ada dua mode, jangan
dicampur:

- **Mode A - Host Development (direkomendasikan)**: Next.js jalan di host
  lewat `pnpm dev`, hanya service infra (`db`, `minio`, `minio-init`,
  `adminer`) yang jalan di Docker. Service `app` **tidak** dijalankan.
- **Mode B - Full Docker**: seluruh stack termasuk `app` jalan sebagai
  container (`docker compose up -d --build`), tidak perlu `pnpm dev`.

Ringkasan Mode A:

```powershell
git clone <repo-url>
cd ult-fmipa
pnpm install
Copy-Item .env.example .env
# isi/sesuaikan nilai di .env (lihat bagian Environment Variables)
docker compose up -d db minio minio-init adminer
pnpm prisma generate
pnpm db:prisma-migrate
pnpm db:support-migrate
pnpm dev
```

Buka <http://localhost:3000>. Jika port `3000` terpakai, Next.js biasanya
pindah otomatis ke `3001` (perhatikan port yang benar-benar tercetak di
terminal) - jika itu terjadi, **sesuaikan `NEXTAUTH_URL` di `.env`** ke port
aktual tersebut, karena login akan gagal callback jika `NEXTAUTH_URL` tidak
cocok dengan port yang sedang dipakai.

## 6. Environment Variables

Gunakan [`.env.example`](./.env.example) sebagai template. **Jangan pernah
commit `.env`** atau nilai secret asli - nilai di bawah ini semuanya
placeholder/nilai development yang sudah ada di repository (`docker-compose.yml`,
`.env.example`), bukan credential production.

### Application

| Variable | Wajib? | Contoh nilai aman | Keterangan |
| --- | --- | --- | --- |
| `NODE_ENV` | Optional | `development` / `production` | `.env.example` men-default `production`; untuk `pnpm dev` biarkan Next.js yang menentukan, tidak perlu diisi manual secara lokal. |
| `NEXTAUTH_URL` | Wajib | `http://localhost:3000` | Base URL aplikasi. Ganti ke `http://localhost:3001` jika port pindah. |
| `NEXTAUTH_SECRET` | Wajib | `local-dev-secret-change-me` | Secret sesi NextAuth. Placeholder saja untuk lokal; **wajib** nilai acak kuat di staging/production. |
| `MAX_UPLOAD_SIZE_MB` | Optional | `10` | Batas ukuran upload umum, dibaca `src/lib/service-upload-config.ts`. |
| `AUTH_DEBUG` | Optional | `true` / `false` | Aktifkan log debug NextAuth (`src/lib/auth.ts`). Default off. |
| `DB_CONNECTION_LIMIT` | Optional | `10` | Pool size Prisma (`src/lib/prisma.ts`), default `10` jika kosong. |
| `PRISMA_QUERY_LOG` | Optional | `true` / `false` | Log query Prisma ke console, default off. |

### Database

| Variable | Wajib? | Contoh nilai aman | Keterangan |
| --- | --- | --- | --- |
| `DATABASE_URL` | Wajib | `mysql://ult_user:ult_password@localhost:13306/fmipa_sbpk` | Dibaca `prisma.config.ts`. Host `localhost:13306` untuk app di host; `db:3306` untuk app di dalam Docker Compose. |
| `DB_HOST` | Wajib | `localhost` (host) / `db` (Compose) | Dipakai runner migration mandiri (`mariadb` client), bukan Prisma. |
| `DB_PORT` | Wajib | `13306` (host) / `3306` (Compose) | - |
| `DB_USER` | Wajib | `ult_user` | - |
| `DB_PASSWORD` | Wajib | `ult_password` | Placeholder dev di `docker-compose.yml`; ganti di staging/production. |
| `DB_NAME` | Wajib | `fmipa_sbpk` | - |

### Authentication

| Variable | Wajib? | Contoh nilai aman | Keterangan |
| --- | --- | --- | --- |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Wajib | Lihat di atas | - |
| `AUTH_DEBUG` | Optional | Lihat di atas | - |

### PAUS (Unpad SSO OAuth)

**PAUS hanya digunakan untuk login mahasiswa** (business rule final). Admin
dan Staff selalu login melalui Credentials Provider internal (`data_users`),
tidak pernah melalui PAUS - lihat
[`docs/paus-integration-audit.md`](docs/paus-integration-audit.md) Finding
S-1 untuk detail penegakan aturan ini di kode.

PAUS OAuth sudah punya fondasi kode (provider, callback bridge), tetapi
`PAUS_CLIENT_ID`/`PAUS_CLIENT_SECRET` di `.env.example` dan
`docker-compose.yml` masih kosong secara default. **Status aktivasi PAUS
pada staging/production perlu dikonfirmasi dengan tim Unpad** (credential,
redirect URI resmi). Development lokal memakai Credentials Provider biasa
lewat akun `DEV_*`. Audit lengkap implementasi PAUS saat ini (state/scope/
transport token, role mapping, security findings, dan pertanyaan yang perlu
dikonfirmasi DPSI) ada di
[`docs/paus-integration-audit.md`](docs/paus-integration-audit.md); checklist
siap-bawa ke DPSI ada di
[`docs/dpsi-paus-integration-checklist.md`](docs/dpsi-paus-integration-checklist.md).

| Variable | Wajib? | Contoh nilai aman | Keterangan |
| --- | --- | --- | --- |
| `PAUS_MODE` | Optional | `modern` | `modern` atau `legacy`. |
| `PAUS_CLIENT_ID` | Optional (wajib saat PAUS aktif) | *(kosongkan)* | Placeholder OAuth - jangan hardcode nilai asli. |
| `PAUS_CLIENT_SECRET` | Optional (wajib saat PAUS aktif) | *(kosongkan)* | Secret OAuth - jangan pernah commit nilai asli. |
| `PAUS_AUTHORIZATION_URL`, `PAUS_TOKEN_URL`, `PAUS_USERINFO_URL`, `PAUS_SIGN_OUT_URL` | Optional | `https://paus.unpad.ac.id/...` | Endpoint resmi PAUS, sudah diisi default di `.env.example`. |
| `PAUS_ISSUER` | Optional | *(sesuai konfigurasi PAUS)* | Diset di `src/lib/auth.ts` pada provider OAuth, tetapi saat ini **tidak berefek** karena provider bertipe `oauth` biasa (bukan `oidc`) dan tidak melakukan discovery - jangan diisi sebelum dikonfirmasi DPSI (lihat audit PAUS). |
| `PAUS_LEGACY_LOGIN_URL` | Optional | *(kosongkan)* | Bridge ke login PHP legacy jika masih dipakai. |
| `PAUS_BRIDGE_SECRET` | Optional | `local-bridge-secret-change-me` | Secret bridge PAUS legacy untuk testing. |
| `PAUS_BRIDGE_TOKEN_TTL_SECONDS` | Optional | `120` | TTL token bridge. |

### MinIO

| Variable | Wajib? | Contoh nilai aman | Keterangan |
| --- | --- | --- | --- |
| `MINIO_ENDPOINT` | Wajib | `localhost` (app di host) / `minio` (app di Docker Compose) | **Jangan dicampur** - lihat bagian [MinIO Object Storage](#9-minio-object-storage). |
| `MINIO_PORT` | Wajib | `9000` | Port API MinIO (bukan console `9001`). |
| `MINIO_USE_SSL` | Wajib | `false` (lokal) | `"true"` hanya jika MinIO/S3 endpoint sudah TLS. |
| `MINIO_ACCESS_KEY` | Wajib | `minioadmin` (dev) | Placeholder dev sudah ada di `docker-compose.yml`; **wajib** nilai unik di staging/production. |
| `MINIO_SECRET_KEY` | Wajib | `minioadmin123` (dev) | Sama seperti di atas - jangan pernah pakai nilai dev di production. |
| `MINIO_BUCKET` | Wajib | `ult-fmipa` | Nama bucket private. |

### Development Accounts

Dipakai NextAuth Credentials Provider untuk login lokal (lihat default di
`docker-compose.yml`, semuanya nilai dev/testing, bukan credential nyata).

| Variable | Wajib? (lokal) | Keterangan |
| --- | --- | --- |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` | Wajib untuk login admin lokal | Akun admin development. |
| `DEV_STAFF_EMAIL`, `DEV_STAFF_PASSWORD` | Wajib untuk login staff lokal | Akun staff development. |
| `DEV_STUDENT_EMAIL`, `DEV_STUDENT_PASSWORD` | Wajib untuk login mahasiswa lokal | Akun mahasiswa development (PAUS belum aktif). |
| `DEV_STUDENT_NAME`, `DEV_STUDENT_NPM`, `DEV_STUDENT_PHONE` | Optional | Profil mahasiswa dev; `DEV_STUDENT_PHONE` boleh kosong. |

> Catatan: `DB_ADMIN_ACCESS_CODES` dan `DB_STAFF_ACCESS_CODES` masih muncul
> di `docker-compose.yml` sebagai environment variable legacy, tetapi
> **sudah tidak dibaca oleh kode aplikasi manapun** di `src/`. Resolusi role
> admin/staff saat ini memakai kolom `APP_ROLE` pada `data_users` (lihat
> migration `009_add_app_role_to_data_users.sql` dan `src/lib/roles.ts`).
> Kedua variable itu aman diabaikan; jangan menganggapnya sebagai mekanisme
> role aktif saat menulis dokumentasi atau kode baru.

### Upload Limits

| Variable | Wajib? | Keterangan |
| --- | --- | --- |
| `MAX_UPLOAD_SIZE_MB` | Optional | Batas umum, default ditentukan di `src/lib/service-upload-config.ts`. Batas spesifik per fitur (contoh: gambar CMS 2 MB, maksimal 5 gambar Informasi, maksimal 10 gambar Kegiatan Mahasiswa) di-hardcode di masing-masing modul upload, bukan lewat environment variable. |

### `MINIO_ENDPOINT` per konteks eksekusi

**Jangan mencampurkan kedua nilai ini.**

| Konteks | `MINIO_ENDPOINT` | Alasan |
| --- | --- | --- |
| Next.js dev server di host, MinIO di Docker | `localhost` | App tidak berada di network namespace Docker; mengakses MinIO lewat port `9000` yang di-publish ke host. |
| Docker Compose (app dan MinIO sama-sama service Compose) | `minio` | DNS internal Compose me-resolve nama service; container tidak boleh memakai `localhost` untuk saling terhubung. |
| Kubernetes | nama `Service` MinIO (`ult-fmipa-minio`) atau endpoint S3-compatible eksternal | Sama seperti Compose - resolve lewat DNS cluster, bukan `localhost`. |

## 7. Docker Compose Setup

`docker-compose.yml` menjalankan 5 service:

| Service | Image | Peran |
| --- | --- | --- |
| `app` | build dari `Dockerfile` | Next.js standalone (`node server.js`), port `3000` |
| `db` | `mariadb:11` | Database `fmipa_sbpk`, port host `13306` → container `3306` |
| `minio` | `minio/minio:latest` | Object storage API `9000` + console `9001`, healthcheck `mc ready local` |
| `minio-init` | `minio/mc:latest` | One-shot job idempoten: membuat bucket privat lalu keluar |
| `adminer` | `adminer:latest` | UI database, port `8081` |

Untuk **Mode B (Full Docker)** - seluruh stack termasuk `app`:

```powershell
docker compose up -d --build
```

`app` menunggu (`depends_on`) `db` start, `minio` sehat (`healthy`), dan
`minio-init` selesai sukses (`service_completed_successfully`) sebelum jalan.
Pada mode ini **jangan** menjalankan `pnpm dev` terpisah - `app` sudah
melayani port `3000` dari dalam container.

| Akses | URL / Host |
| --- | --- |
| App | <http://localhost:3000> |
| Adminer | <http://localhost:8081> |
| MariaDB dari host | `localhost:13306` |
| MariaDB antar-container | `db:3306` |
| MinIO API | `localhost:9000` (host) / `minio:9000` (container) |
| MinIO Console | <http://localhost:9001> |

Untuk **Mode A (Host Development, direkomendasikan)** - hanya service
infra, Next.js jalan sendiri di host lewat `pnpm dev`:

```powershell
docker compose up -d db minio minio-init adminer
pnpm dev
```

Jangan menjalankan Mode A dan Mode B bersamaan pada port `3000` yang sama.

Volume Docker yang persist antar restart:

```yaml
volumes:
  ult_fmipa_db_data:   # data MariaDB
  minio_data:          # object MinIO
```

Tidak ada bind mount storage lokal (`./storage:/app/storage`) lagi - arsitektur
lama itu sudah digantikan sepenuhnya oleh MinIO. Lihat
[bagian 9](#9-minio-object-storage).

## 8. Database Migration

Aplikasi memakai **tiga lapis** skema database:

1. **Legacy dump** `database/fmipa_sbpk.sql` - tabel layanan dan `data_users`
   lama. File ini sensitif dan **tidak boleh** masuk repository (lihat
   `.gitignore`: `database/*.sql`).
2. **Prisma migrations** (`prisma/migrations/`) - saat ini berisi
   `20260612000000_create_ult_request_attachments` dan
   `20260803000000_add_app_role_to_data_users`. Dijalankan lewat:

   ```powershell
   pnpm db:prisma-migrate
   ```

   Script ini (`scripts/deploy-prisma-migrations.mjs`) menjalankan migration
   Prisma secara manual lewat koneksi `mariadb` langsung (bukan
   `prisma migrate deploy`), membuat tabel `_prisma_migrations` sendiri jika
   belum ada, dan idempoten - migration yang sudah tercatat akan dilewati.

3. **Support migrations aktif** di `database/migrations/` - SQL murni untuk
   tabel non-legacy (CMS, survei, dsb). Dijalankan lewat:

   ```powershell
   pnpm db:support-migrate
   ```

   Script (`scripts/run-support-migrations.mjs`) membaca semua file `*.sql`
   di `database/migrations/` **urut nama file**, lalu menjalankan setiap
   statement lewat koneksi `mariadb`. Runner ini **tidak** menyimpan riwayat
   applied-migration - setiap file harus idempoten sendiri (`CREATE TABLE IF
   NOT EXISTS`, `INSERT ... WHERE NOT EXISTS`, dst.) supaya aman dijalankan
   ulang di database yang sudah punya sebagian/seluruh tabelnya.

   Migration aktif saat ini (011 file, urut, mencakup CMS Informasi, CMS
   Beranda + multi-gambar Kegiatan Mahasiswa, CMS Profil + Struktur Profil
   hierarkis, dan kolom `APP_ROLE`):

   ```text
   001_create_service_surveys.sql
   002_create_information_cms.sql
   003_create_homepage_cms.sql
   004_create_profile_cms.sql
   005_create_magang_sik_services.sql
   006_create_service_links.sql
   007_add_legacy_request_compat_columns.sql
   008_create_service_suggestions.sql
   009_add_app_role_to_data_users.sql
   010_create_profile_structure_cms.sql
   011_create_home_activity_images.sql
   ```

### Aturan keras

- **Jangan** menjalankan `prisma db push` - walaupun script `db:push` ada di
  `package.json` untuk kebutuhan darurat/manual, jalur migration yang benar
  untuk workflow tim adalah `db:prisma-migrate` + `db:support-migrate` di
  atas.
- **Jangan** menjalankan file apa pun di `database/migrations_legacy_backup/`
  - folder itu murni arsip chain migration lama, bukan bagian dari alur aktif.
  Menjalankan folder backup dan folder aktif pada database yang sama bisa
  menimbulkan konflik skema.
- **Jangan** melakukan database reset pada database yang sudah berisi data
  nyata.

## 9. MinIO Object Storage

Seluruh file upload (lampiran layanan, gambar Kegiatan Mahasiswa, gambar
Informasi, foto profil) disimpan sebagai object MinIO, **bukan** di
filesystem container/host.

Fakta arsitektur yang harus dipahami:

- **Bucket bersifat privat.** `minio-init` menjalankan `mc anonymous set
  none` - tidak ada akses publik/anonim ke bucket, dan aplikasi tidak pernah
  menerbitkan presigned URL.
- **Browser tidak pernah mengakses MinIO secara langsung.** Semua file
  diserve lewat route API aplikasi (`/api/attachments/[id]`,
  `/api/profile/images/[type]/[id]`, `/api/home/activities/image/[imageId]`,
  `/api/information/images/[imageId]`, dst.), yang men-stream object dari
  MinIO ke client.
- **Metadata file** (nama asli, stored name, mime type, ukuran, alt text,
  image fit, cover flag, urutan) tersimpan di MariaDB. **Object file itu
  sendiri** tersimpan di MinIO. Keduanya harus tetap sinkron - lihat
  [bagian 11](#11-storage-integrity-audit).
- **Volume MinIO harus persistent.** Di Docker Compose ini adalah named
  volume `minio_data`; di Kubernetes ini adalah PVC lewat
  `volumeClaimTemplates` pada `StatefulSet` (`k8s/04-storage.yaml`).
- **`minio-init` idempoten** - aman dijalankan ulang setiap `docker compose
  up`, tidak menghapus/menimpa bucket yang sudah ada.
- **Console lokal** tersedia di <http://localhost:9001> saat Compose
  meng-expose port `9001` (default di `docker-compose.yml`).
- **Port MinIO tidak boleh dibuka publik di production** - baik port API
  `9000` maupun terutama console `9001`. Di Kubernetes, hanya `Service`
  internal cluster yang mengarah ke MinIO; jangan pernah membuat `Ingress`
  untuk console.

Referensi detail (object key format, mapping folder lama → prefix MinIO,
dan histori keputusan migrasi): [`docs/minio-storage-audit.md`](docs/minio-storage-audit.md)
dan [`docs/minio-storage-deployment.md`](docs/minio-storage-deployment.md).

## 10. Legacy Storage Migration

Jika ada file lama yang masih tersisa di filesystem lokal (dari sebelum
migrasi ke MinIO), pindahkan dengan `scripts/migrate-local-storage-to-minio.ts`
lewat:

```powershell
pnpm storage:migrate:minio -- --dry-run
```

Flag yang didukung script ini (lihat `scripts/migrate-local-storage-to-minio.ts`):

| Flag | Efek |
| --- | --- |
| *(tanpa flag, atau `--dry-run`)* | **Default.** Hanya menampilkan apa yang akan diunggah - tidak ada upload. |
| `--execute` | Benar-benar mengunggah file yang ditemukan ke MinIO. |
| `--overwrite` | Menimpa object yang sudah ada di MinIO (default: object yang sudah ada dilewati). |

Sifat script (baca sumbernya untuk detail lengkap):

- Memindai lima folder lokal langsung (`storage/uploads`,
  `storage/information`, `storage/home-activities`,
  `storage/profile/organization`, `storage/profile/location`) - bukan dari
  database, jadi baris DB yang menunjuk file yang sudah hilang tidak
  menggagalkan run.
- **Tidak pernah** menghapus file lokal.
- **Tidak pernah** menyentuh database.
- Melewati object yang sudah ada di MinIO kecuali `--overwrite` diberikan -
  aman dijalankan berulang kali.

Contoh alur lengkap:

```powershell
pnpm storage:migrate:minio -- --dry-run
pnpm storage:migrate:minio -- --execute
```

## 11. Storage Integrity Audit

Audit read-only yang membandingkan metadata `ult_request_attachments` di
database dengan object aktual di MinIO (prefix `uploads/`):

```powershell
pnpm storage:audit
```

Mode strict (exit code non-zero jika ada discrepancy - cocok untuk CI/gate
deployment):

```powershell
pnpm storage:audit -- --strict
```

Audit ini mendeteksi dan melaporkan:

- **Missing object** - baris DB ada, object MinIO tidak ada.
- **Orphan object** - object MinIO ada, tidak ada baris DB yang mengacu.
- **Size mismatch** - ukuran di DB dan di MinIO berbeda.
- **Invalid metadata path** - `STORED_NAME` mengandung karakter path yang
  tidak valid (`..`, `/`, `\`).

Script ini **read-only** - tidak pernah menghapus/menulis apa pun ke
database atau MinIO. Cakupannya saat ini adalah tabel `ult_request_attachments`
(prefix `uploads/`) - lihat `scripts/audit-storage-integrity.mjs` untuk
detail implementasi sebelum mengasumsikan cakupan yang lebih luas.

## 12. Available Scripts

Semua script berikut terdaftar di `package.json`:

| Command | Menjalankan | Keterangan |
| --- | --- | --- |
| `pnpm dev` | `node scripts/next-with-dist.mjs .next-dev dev` | Dev server Next.js |
| `pnpm build` | `next build` | Production build |
| `pnpm start` | `next start` | Jalankan hasil build |
| `pnpm lint` | `eslint .` | Lint |
| `pnpm typecheck` | `node scripts/typecheck.mjs` | Type-check project |
| `pnpm test:unit` | `node scripts/run-unit-tests.mjs` | Unit/source-level test (Node test runner) |
| `pnpm test:e2e` | `node scripts/run-e2e.mjs` | Playwright smoke test (manual, tidak di CI) |
| `pnpm test:e2e:full-services` | `node scripts/run-e2e.mjs --full-service` | Playwright full submission test tiap service (manual) |
| `pnpm test:e2e:ui` / `:headed` / `:debug` / `:trace` / `:report` | Playwright | Mode debugging Playwright |
| `pnpm storage:audit` | `node scripts/audit-storage-integrity.mjs` | Lihat bagian 11 |
| `pnpm storage:migrate:minio` | `node scripts/run-storage-migration.mjs` | Lihat bagian 10 |
| `pnpm db:generate` | `prisma generate` | Generate Prisma Client |
| `pnpm db:prisma-migrate` | `node scripts/deploy-prisma-migrations.mjs` | Lihat bagian 8 |
| `pnpm db:support-migrate` | `node scripts/run-support-migrations.mjs` | Lihat bagian 8 |
| `pnpm db:push` | `prisma db push` | **Jangan dipakai** untuk alur tim normal - lihat bagian 8 |
| `pnpm format` / `pnpm format:check` | `prettier --write .` / `prettier --check .` | Format kode |
| `pnpm optimize:home-hero` | `node scripts/optimize-home-hero-assets.mjs` | Build-time asset optimizer untuk hero homepage |

`pnpm prisma generate` (tanpa `db:` prefix) juga valid - memanggil binary
Prisma CLI langsung dan setara dengan `pnpm db:generate`.

## 13. Testing and Validation

Minimal sebelum push/PR:

```powershell
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

Standar lulus: typecheck tanpa error, lint 0 error (warning yang sudah ada
sebelumnya di luar perubahanmu boleh tetap dilaporkan - tidak wajib nol),
seluruh unit test lulus, build sukses.

CI (`.github/workflows/ci.yml`) saat ini menjalankan `pnpm typecheck`,
`pnpm lint`, dan `pnpm build` pada setiap push/PR ke `main`/`dev`/`feature/**`
- `pnpm test:unit` belum termasuk di job CI, jadi jalankan manual sebelum
push.

Jika migration baru ditambahkan di `database/migrations/`, jalankan juga:

```powershell
pnpm db:support-migrate
```

Playwright E2E tersedia untuk smoke testing manual tetapi **sengaja tidak
dijalankan otomatis** di CI/pre-push - UI masih dalam tahap polishing
sehingga selector/route/form dapat berubah cepat.

```powershell
docker compose up -d db minio minio-init adminer
pnpm db:prisma-migrate
pnpm db:support-migrate
pnpm test:e2e
```

Jika database Docker lokal sudah punya seluruh migration terpasang
(sudah pernah menjalankan langkah di [bagian 8](#8-database-migration)
sebelumnya), cukup:

```powershell
docker compose up -d db minio minio-init adminer
pnpm test:e2e
```

> [!WARNING]
> Jangan jalankan `pnpm test:e2e:full-services` terhadap database berisi
> data nyata - test ini menulis record pengajuan sungguhan (walaupun
> otomatis dihapus lagi via admin API setelah assertion selesai).

## 14. Project Structure

| Path | Keterangan |
| --- | --- |
| `src/app/(public)` | Halaman publik: beranda, profil, layanan, informasi, survei |
| `src/app/admin` | Dashboard dan CMS admin |
| `src/app/staff` | Dashboard dan CMS staff |
| `src/app/mahasiswa` | Riwayat pengajuan mahasiswa |
| `src/app/api` | Route handlers App Router - lihat subfolder `admin/`, `staff/`, `student/`, `home/`, `information/`, `profile/`, `requests/`, `services/`, `attachments/`, `auth/`, `health/` |
| `src/components` | Komponen UI, request, service, informasi, home-activities, profile, survey |
| `src/lib` | Helper: auth, roles, upload (per-domain), MinIO client, CMS (informasi/beranda/profil/struktur), storage-paths, Prisma client |
| `src/types` | TypeScript types shared |
| `src/constants` | Navigasi dan konstanta UI |
| `prisma/schema.prisma`, `prisma.config.ts` | Skema Prisma (introspeksi tabel legacy + model support) dan config |
| `prisma/migrations/` | Migration Prisma (attachment, `APP_ROLE`) |
| `database/migrations/` | SQL support table aktif - lihat bagian 8 |
| `database/migrations_legacy_backup/` | Arsip migration lama - **jangan dijalankan** |
| `k8s/` | Manifest Kubernetes (lihat [`k8s/README.md`](k8s/README.md)) |
| `docs/` | Dokumentasi tambahan (audit MinIO, deployment, QA, dsb.) |
| `tests/` | Test source-level (`*.test.mjs`, dijalankan `pnpm test:unit`) |
| `e2e/` | Test Playwright |

## 15. Role Overview

| Role | Akses utama |
| --- | --- |
| **Guest** | Halaman publik: beranda, profil, katalog layanan, informasi, login |
| **Mahasiswa** | Ajukan layanan, riwayat pengajuan sendiri, lampiran sendiri, survei untuk request sendiri. NPM selalu dibaca dari session, tidak pernah dari input client. |
| **Staff** | Dashboard staff, list/detail request, update status request, CRUD Informasi, CRUD Kegiatan Mahasiswa, CRUD Struktur/Lokasi Profil, ringkasan survei. Tidak bisa menghapus pengajuan layanan. |
| **Admin** | Semua akses Staff, plus hapus pengajuan layanan dan dashboard admin. |

Role aplikasi (`APP_ROLE`: `MAHASISWA` | `STAFF` | `ADMIN`) diselesaikan lewat
`src/lib/roles.ts`. Untuk user legacy dari `data_users`, role default
dipetakan dari kode posisi lama (`SUPER_USER`/`PIMPINAN`/`ADMIN` → Admin;
`OPERATOR`/`KRS`/`STAFF` → Staff) jika kolom `APP_ROLE` belum diisi eksplisit
- lihat `getDefaultAppRoleForPosition` di `src/lib/roles.ts` dan migration
`009_add_app_role_to_data_users.sql`.

## 16. Staging and Production Notes

> Bagian ini adalah **panduan**, bukan laporan status deployment.
> Konfigurasi/prosedur staging dan production di bawah **belum diverifikasi
> dalam perubahan dokumentasi ini** - harus divalidasi langsung pada
> environment staging aktual sebelum dianggap siap pakai.

Setiap environment (local / staging / production) **harus** punya:

- Database berbeda (nama database, credential, dan idealnya host berbeda).
- Bucket MinIO berbeda (atau prefix terisolasi jika terpaksa berbagi
  instance MinIO).
- Secret berbeda: `NEXTAUTH_SECRET`, `DB_PASSWORD`, `MINIO_ACCESS_KEY` /
  `MINIO_SECRET_KEY`, `PAUS_CLIENT_SECRET`, `PAUS_BRIDGE_SECRET` - **tidak
  boleh** memakai nilai dev (`minioadmin`, `change-me`, dsb.) di luar lokal.
- Domain berbeda per environment, dan `NEXTAUTH_URL` + redirect URI PAUS
  didaftarkan sesuai domain masing-masing.
- Persistent storage terpisah (volume database dan volume MinIO tidak boleh
  dibagi antar environment).
- Image container ditag berdasarkan commit SHA (bukan `:latest`) supaya
  rollback presisi.
- HTTPS di depan aplikasi (reverse proxy/ingress) - repository ini tidak
  menyertakan konfigurasi TLS/reverse proxy siap pakai.
- Prosedur backup dan rollback yang terdefinisi (database + object storage)
  sebelum menerima trafik nyata.

Placeholder yang **masih harus diisi tim** sebelum staging/production
berjalan (lihat juga bagian 17 dan `k8s/README.md`):

- Domain staging.
- Domain production.
- Container registry tujuan push image.
- Namespace Kubernetes final (manifest memakai `ult-fmipa`).
- Seluruh credential di `k8s/01-secrets.yaml` (nilai `change-me` di file itu
  adalah placeholder, bukan default yang aman dipakai).
- Image tag berbasis commit SHA di `k8s/05-migration-job.yaml` dan
  `k8s/06-app.yaml` (saat ini memakai `ult-fmipa:latest` sebagai contoh).
- Client ID/secret PAUS untuk staging dan production, plus redirect URI yang
  didaftarkan ke tim PAUS Unpad.

Untuk rehearsal sebelum deploy ke VPS staging, jalankan dulu **local staging
rehearsal** - stack terisolasi yang memakai production build/container,
database (`fmipa_sbpk_staging_local`) dan bucket
(`ult-fmipa-staging-local`) terpisah dari local development, tanpa
bergantung pada `DEV_ADMIN_*`/`DEV_STAFF_*`. Lihat
[`docs/local-staging-rehearsal.md`](docs/local-staging-rehearsal.md) untuk
command lengkap (`pnpm staging:local:*`) dan daftar delta saat pindah ke VPS
staging asli.

Detail arsitektur deployment (Docker Compose penuh, Kubernetes, VPS) ada di:

- [`k8s/README.md`](k8s/README.md) - apply order manifest Kubernetes.
- [`docs/minio-storage-deployment.md`](docs/minio-storage-deployment.md) -
  perbedaan `MINIO_ENDPOINT` per environment, detail Compose & Kubernetes.
- [`docs/production-deployment-guide.md`](docs/production-deployment-guide.md)
  dan [`docs/vps-deployment-backup.md`](docs/vps-deployment-backup.md) - catatan
  operasional VPS. **Peringatan:** kedua dokumen ini ditulis sebelum migrasi
  ke MinIO; bagian yang membahas bind-mount storage lokal (`STORAGE_ROOT`,
  `ULT_STORAGE_HOST_PATH`, `/app/storage`) sudah tidak berlaku - ikuti
  `docs/minio-storage-deployment.md` untuk topik storage, bukan bagian
  storage di dua dokumen tersebut.

## 17. Security Notes

- **Jangan commit** `.env`, dump `.sql`/`.zip`/`.dump`, atau file backup apa
  pun - semua sudah di-`.gitignore`.
- **Jangan** menaruh credential asli di dokumentasi, commit message, atau
  issue tracker. Gunakan placeholder (`<NAMA_PLACEHOLDER>`) di setiap
  panduan deployment.
- Bucket MinIO privat secara default (`mc anonymous set none`) - jangan
  pernah mengubahnya jadi publik atau menerbitkan presigned URL tanpa
  alasan kuat yang direview.
- Semua file diakses lewat route API aplikasi, bukan URL MinIO langsung -
  pertahankan pola ini untuk fitur baru yang menambah upload.
- Jangan expose port MinIO (`9000`/`9001`) ke publik di production;
  `9001` (console) khususnya tidak boleh pernah keluar dari jaringan
  internal/cluster.
- `NEXTAUTH_SECRET`, `MINIO_SECRET_KEY`, `PAUS_CLIENT_SECRET`,
  `PAUS_BRIDGE_SECRET`, dan `DB_PASSWORD` production harus unik per
  environment dan tidak pernah memakai nilai default yang ada di
  `docker-compose.yml`/`.env.example` (nilai-nilai itu murni untuk lokal).
- Mahasiswa tidak boleh mengirim NPM secara manual untuk riwayat/survei -
  NPM selalu dibaca dari session. Admin/staff tidak menampilkan data master
  mahasiswa/alumni mentah di UI.

## 18. Troubleshooting

### Docker Desktop belum berjalan

```powershell
docker compose up -d
```

Jika gagal dengan error koneksi ke Docker daemon, buka Docker Desktop
terlebih dahulu lalu ulangi.

### MinIO tidak healthy

```powershell
docker compose ps
docker compose logs minio
```

Healthcheck memakai `mc ready local`. Jika terus gagal, cek apakah volume
`minio_data` korup atau port `9000` konflik (lihat bagian port bentrok di
bawah), lalu `docker compose restart minio`.

### `minio-init` gagal

```powershell
docker compose logs minio-init
```

Job ini menunggu `minio` sehat dulu (`condition: service_healthy`). Jika
`minio` belum sehat, `minio-init` akan terus gagal/retry - perbaiki `minio`
dulu, baru jalankan ulang:

```powershell
docker compose up -d minio-init
```

### Bucket tidak ditemukan

Pastikan `minio-init` sudah selesai sukses (`docker compose ps` menunjukkan
`Exited (0)` untuk `ult-fmipa-minio-init`, bukan status error). Jika bucket
memang belum ada, jalankan ulang `minio-init` seperti di atas - perintahnya
idempoten (`mc mb ... || true`).

### Migration gagal

- Pastikan hanya menjalankan `database/migrations/` (aktif), **bukan**
  `database/migrations_legacy_backup/`.
- Cek apakah file SQL yang baru ditambahkan benar-benar idempoten - runner
  support migration tidak menyimpan riwayat applied migration, jadi statement
  yang gagal di-re-run harus aman dijalankan ulang.
- Untuk Prisma migration, cek `_prisma_migrations` di database (dibuat
  otomatis oleh `scripts/deploy-prisma-migrations.mjs`) untuk melihat migration
  mana yang sudah tercatat.

### Database unavailable

Beberapa halaman CMS menampilkan pesan "Koneksi database sedang tidak
tersedia" saat tabel support belum ada. Jalankan `pnpm db:support-migrate`
lalu refresh. Jika masih gagal, cek `docker compose logs db` dan pastikan
`.env`/`DATABASE_URL` mengarah ke host+port yang benar (lihat bagian
"penggunaan `localhost` yang salah" di bawah).

### File metadata ada tetapi object hilang / object orphan

Jalankan `pnpm storage:audit` (bagian 11) untuk mendeteksi `MISSING_OBJECT`
(baris DB tanpa object MinIO) dan `ORPHAN_OBJECT` (object MinIO tanpa baris
DB). Audit ini read-only - tidak memperbaiki apa pun secara otomatis;
tindak lanjuti secara manual sesuai kasus (upload ulang lewat CMS untuk
missing object, atau investigasi manual sebelum menghapus orphan object).

### Certificate Git di Windows

Jika `git clone`/`git pull` gagal dengan error SSL/certificate di Windows
(sering terjadi di jaringan kampus/korporat dengan proxy SSL-inspection):

```powershell
git config --global http.sslBackend schannel
```

Jangan menonaktifkan verifikasi SSL (`http.sslVerify=false`) sebagai
solusi permanen - itu membuka celah man-in-the-middle.

### Port `3000` / `9000` / `9001` / `13306` bentrok

Cek proses/container lain yang memakai port tersebut:

```powershell
netstat -ano | findstr :3000
```

Next.js otomatis pindah ke `3001` jika `3000` terpakai (sesuaikan
`NEXTAUTH_URL`). Untuk port lain, hentikan service yang bentrok atau ubah
mapping port di `docker-compose.yml` (ingat: mengubah port MinIO/DB berarti
`.env` lokal juga harus disesuaikan).

### `.env` tidak terbaca

- Pastikan file bernama persis `.env` (bukan `.env.txt` atau `.env.local`)
  di root project, sejajar dengan `package.json`.
- Restart dev server/terminal setelah mengubah `.env` - Next.js dan script
  Node lain membaca env var saat proses start, bukan live-reload.
- Untuk script mandiri (`scripts/*.mjs`), env dimuat lewat `dotenv/config` -
  pastikan menjalankan script dari root repository, bukan dari subfolder.

### Penggunaan `localhost` yang salah dari container

Gejala umum: app di dalam Docker Compose gagal konek ke MinIO atau database
dengan error connection refused meskipun service terlihat jalan. Penyebab
hampir selalu: `.env`/environment container memakai `MINIO_ENDPOINT=localhost`
atau `DB_HOST=localhost` padahal app berjalan **di dalam** Compose. Di dalam
Compose, gunakan nama service (`minio`, `db`), bukan `localhost` - lihat
tabel [`MINIO_ENDPOINT` per konteks eksekusi](#minio_endpoint-per-konteks-eksekusi)
di bagian 6.

---

Dokumentasi tambahan yang masih relevan (audit teknis, panduan operasional,
QA):

- [`SETUP.md`](./SETUP.md) - langkah setup lokal step-by-step.
- [`docs/minio-storage-audit.md`](docs/minio-storage-audit.md) - detail teknis
  migrasi storage ke MinIO.
- [`docs/minio-storage-deployment.md`](docs/minio-storage-deployment.md) -
  referensi environment variable dan deployment MinIO per environment.
- [`docs/homepage-content-management.md`](docs/homepage-content-management.md),
  [`docs/profile-content-management.md`](docs/profile-content-management.md) -
  catatan CMS Beranda/Kegiatan Mahasiswa dan CMS Profil.
- [`docs/qa/`](docs/qa) - catatan QA manual per fitur.
- [`k8s/README.md`](k8s/README.md) - deployment Kubernetes.

Untuk API route reference lengkap, baca langsung `src/app/api/**` - daftar
endpoint berubah cukup sering seiring fitur baru (CMS Struktur Profil,
multi-gambar Kegiatan Mahasiswa, dsb.) sehingga dokumen ini sengaja tidak
menduplikasi katalog endpoint yang mudah kedaluwarsa.
