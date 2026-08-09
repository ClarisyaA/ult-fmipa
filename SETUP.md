# Setup Lokal - ULT FMIPA Unpad

Panduan praktis step-by-step untuk menjalankan project ini di komputer
developer baru. Untuk penjelasan arsitektur/fitur/deployment, lihat
[`README.md`](./README.md).

Semua command di bawah pakai `pnpm`. Jika PowerShell menolak menjalankan
`pnpm` karena execution policy, ganti dengan `pnpm.cmd` pada setiap command.

Ada **dua mode** menjalankan project secara lokal - pilih salah satu, jangan
campur keduanya:

- **[Mode A - Host Development](#mode-a--host-development-direkomendasikan)**
  (direkomendasikan untuk sehari-hari): Next.js jalan langsung di host lewat
  `pnpm dev` (hot reload cepat), sementara database dan MinIO tetap jalan di
  Docker. Container `app` **tidak** dijalankan pada mode ini.
- **[Mode B - Full Docker](#mode-b--full-docker)**: seluruh stack termasuk
  `app` dijalankan sebagai container. Tidak ada `pnpm dev` yang berjalan
  terpisah pada mode ini.

Jangan menjalankan `pnpm dev` dan container `app` secara bersamaan di port
yang sama - keduanya sama-sama mencoba memakai port `3000` dan environment
`MINIO_ENDPOINT`/`DB_HOST` yang berbeda konteks (lihat langkah 4).

---

## Mode A - Host Development (direkomendasikan)

### 1. Clone Repository

```powershell
git clone <repo-url>
cd ult-fmipa
```

### 2. Install Node.js dan pnpm

- Install **Node.js 22 LTS**.
- Aktifkan pnpm lewat Corepack (bundled dengan Node.js 22+):

  ```powershell
  corepack enable
  ```

- Verifikasi:

  ```powershell
  node -v
  pnpm -v
  ```

### 3. Salin `.env.example` menjadi `.env`

```powershell
Copy-Item .env.example .env
```

`.env` sudah di-`.gitignore` (`.env*` dengan exception `!.env.example`) -
`.env` asli tidak akan pernah ikut ter-commit, hanya `.env.example` yang
di-track Git.

### 4. Isi Environment Lokal

Buka `.env` dan pastikan minimal nilai berikut sesuai kebutuhan lokal
(lihat tabel lengkap di [`README.md` § Environment Variables](./README.md#6-environment-variables)):

```dotenv
DATABASE_URL="mysql://ult_user:ult_password@localhost:13306/fmipa_sbpk"
DB_HOST=localhost
DB_PORT=13306
DB_USER=ult_user
DB_PASSWORD=ult_password
DB_NAME=fmipa_sbpk

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-dev-secret-change-me

# Mode A (pnpm dev di host, MinIO tetap di Docker) → gunakan localhost:
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=ult-fmipa
```

> `minioadmin` / `minioadmin123` / `local-dev-secret-change-me` di atas
> adalah **development placeholder** - nilai yang sama persis dengan
> default `docker-compose.yml`, aman untuk lokal, tetapi **tidak boleh**
> dipakai di staging/production.

Tambahkan juga akun development (dipakai NextAuth Credentials Provider):

```dotenv
DEV_ADMIN_EMAIL=admin@gmail.com
DEV_ADMIN_PASSWORD=admin123
DEV_STAFF_EMAIL=staff@gmail.com
DEV_STAFF_PASSWORD=staff123
DEV_STUDENT_EMAIL=student@gmail.com
DEV_STUDENT_PASSWORD=student123
DEV_STUDENT_NAME=Mahasiswa ULT
DEV_STUDENT_NPM=140810230017
```

> `admin123` / `staff123` / `student123` di atas juga **development
> placeholder** (sama dengan default `docker-compose.yml`) - **jangan**
> dipakai di staging/production.

**Catatan penting soal `MINIO_ENDPOINT`** - nilainya beda tergantung di mana
Next.js berjalan. Jangan mencampur keduanya:

| Next.js dijalankan di | `MINIO_ENDPOINT` |
| --- | --- |
| Host, lewat `pnpm dev` (Mode A) | `localhost` |
| Container `app` di Docker Compose (Mode B) | `minio` |
| Kubernetes | nama `Service` MinIO (`ult-fmipa-minio`) atau endpoint object storage internal lain |

### 5. Install Dependency

```powershell
pnpm install
```

### 6. Pastikan Docker Desktop Aktif

```powershell
docker -v
docker compose version
```

### 7. Jalankan Hanya Service Infrastructure

**Jangan** menjalankan service `app` pada Mode A - cukup database, MinIO,
dan Adminer:

```powershell
docker compose up -d db minio minio-init adminer
```

### 8. Verifikasi Container

```powershell
docker compose ps -a
```

`ult-fmipa-minio` harus `healthy`, dan `ult-fmipa-minio-init` harus
`Exited (0)` (bukan error) - itu tandanya bucket privat sudah dibuat.
Tidak boleh ada container `ult-fmipa-app` berjalan di Mode A.

### 9. Generate Prisma Client

```powershell
pnpm prisma generate
```

### 10. Jalankan Migration Aktif

Pastikan database `fmipa_sbpk` legacy sudah tersedia (import dari
`database/fmipa_sbpk.sql` jika belum - lihat catatan di
[`README.md`](./README.md) atau minta dump dari tim), lalu:

```powershell
pnpm db:prisma-migrate
pnpm db:support-migrate
```

- `db:prisma-migrate` - menerapkan migration Prisma (tabel attachment,
  kolom `APP_ROLE`).
- `db:support-migrate` - menjalankan seluruh SQL di `database/migrations/`
  secara berurutan (CMS Informasi, CMS Beranda, CMS Profil, dst.). Idempoten,
  aman dijalankan berkali-kali.

**Jangan** menjalankan `database/migrations_legacy_backup/` - folder itu
arsip lama, bukan bagian dari alur aktif. **Jangan** menjalankan
`prisma db push` / `pnpm db:push` / `prisma migrate deploy` sebagai alur
normal - lihat [`README.md` § Database Migration](./README.md#8-database-migration).

### 11. Jalankan Aplikasi

```powershell
pnpm dev
```

Buka <http://localhost:3000>.

### 12. Verifikasi Health Endpoint

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Atau, jika `curl.exe` (bukan alias PowerShell) tersedia:

```powershell
curl.exe http://localhost:3000/api/health
```

Respons sukses:

```json
{ "status": "ok", "message": "Database connected", "result": [{ "ok": 1 }] }
```

Jika `status: "error"`, database belum terhubung - cek langkah 7-8 dan `.env`.

### 13. Login dengan Akun Development

Gunakan credential yang diisi di langkah 4:

| Role | Email | Password |
| --- | --- | --- |
| Admin | nilai `DEV_ADMIN_EMAIL` | nilai `DEV_ADMIN_PASSWORD` |
| Staff | nilai `DEV_STAFF_EMAIL` | nilai `DEV_STAFF_PASSWORD` |
| Mahasiswa | nilai `DEV_STUDENT_EMAIL` | nilai `DEV_STUDENT_PASSWORD` |

Login lewat <http://localhost:3000/login>. Kredensial ini hanya berfungsi
karena NextAuth Credentials Provider membaca langsung dari `.env` - bukan
akun PAUS/SSO sungguhan.

---

## Mode B - Full Docker

Alternatif Mode A: seluruh stack (termasuk `app`) berjalan sebagai
container. Cocok untuk memverifikasi build production-like sebelum deploy,
bukan untuk iterasi cepat sehari-hari (tidak ada hot reload).

```powershell
docker compose up -d --build
```

Yang perlu dipahami pada mode ini:

- Service `app` berjalan sebagai container hasil build `Dockerfile`
  (`node server.js`) - **developer tidak perlu menjalankan `pnpm dev`**.
- `MINIO_ENDPOINT` untuk container `app` adalah `minio` (bukan `localhost`)
  - nilai ini sudah di-set otomatis lewat `docker-compose.yml`, terpisah
  dari `.env` host; tidak perlu diubah manual.
- Endpoint database untuk container `app` adalah `db:3306` - juga sudah
  di-set otomatis lewat `docker-compose.yml`.
- **Jangan mencampur environment host dan container.** `.env` di host
  (dipakai `pnpm dev`/script CLI seperti `pnpm db:support-migrate`) memakai
  `localhost`; environment container `app` (di-set lewat `docker-compose.yml`,
  bukan dibaca dari `.env` host) memakai `minio`/`db`.
- Migration tetap harus sudah dijalankan lewat mekanisme yang benar
  (`pnpm db:prisma-migrate` + `pnpm db:support-migrate`, dijalankan dari
  host terhadap database yang sama) sebelum atau sesudah `app` container
  hidup - `docker compose up -d --build` **tidak** otomatis menjalankan
  migration.
- Cek status lewat:

  ```powershell
  docker compose ps -a
  docker compose logs app --tail 100
  ```

Buka <http://localhost:3000> setelah `ult-fmipa-app` berstatus `Up`.

---

## Langkah Bersama (Setelah Mode A atau Mode B Berjalan)

Langkah berikut berlaku untuk kedua mode, dijalankan dari host.

### Storage Migration (hanya jika ada file legacy)

Langkah ini **hanya perlu** jika komputer/repo lama masih menyimpan file
upload di folder `storage/` lokal (arsitektur sebelum migrasi ke MinIO).
Fresh clone biasanya tidak punya file ini - lewati langkah ini jika folder
`storage/` kosong atau tidak ada.

```powershell
pnpm storage:migrate:minio -- --dry-run
```

Jika hasil dry-run terlihat benar, jalankan sungguhan:

```powershell
pnpm storage:migrate:minio -- --execute
```

Script ini tidak pernah menghapus file lokal maupun menyentuh database -
aman dijalankan berulang kali (lihat [`README.md` § Legacy Storage
Migration](./README.md#10-legacy-storage-migration)).

### Storage Audit

```powershell
pnpm storage:audit
```

Untuk mode strict (exit code 1 jika ada discrepancy):

```powershell
pnpm storage:audit -- --strict
```

### Typecheck, Lint, Test, Build

```powershell
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

Standar sebelum push/PR: typecheck lulus, lint 0 error (warning existing
yang sudah ada sebelumnya boleh tetap dilaporkan, tidak wajib nol), unit
test lulus semua, build lulus.

---

## Troubleshooting Singkat

Untuk daftar troubleshooting lengkap (Docker belum jalan, MinIO tidak
healthy, port bentrok, certificate Git di Windows, dsb.), lihat
[`README.md` § Troubleshooting](./README.md#18-troubleshooting).

## Setelah Setup Berhasil

- Baca [`README.md`](./README.md) untuk overview fitur, struktur project,
  dan role.
- Baca [`docs/minio-storage-deployment.md`](docs/minio-storage-deployment.md)
  sebelum menyentuh apa pun yang berhubungan dengan upload file.
- Jangan commit `.env`, dump `.sql`, atau file di folder `storage/` lokal.
