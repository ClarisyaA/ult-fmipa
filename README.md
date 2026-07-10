# ULT FMIPA Unpad

Website ULT SBAK/FMIPA Unpad adalah revitalisasi aplikasi layanan ULT berbasis
Next.js App Router. Aplikasi ini memakai database legacy MariaDB `fmipa_sbpk`
untuk data layanan lama, lalu menambahkan tabel support non-legacy untuk
lampiran, survei kepuasan, dan informasi/pengumuman.

README ini ditulis sebagai handout praktis untuk frontend developer dan anggota
tim yang perlu menjalankan, memahami route, dan memakai API aplikasi.

## Tech Stack

| Area | Teknologi |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, lucide-react |
| Auth | NextAuth Credentials Provider untuk admin/staff legacy DB dan development, PAUS OAuth disiapkan |
| Database | MariaDB/MySQL legacy `fmipa_sbpk` |
| ORM/DB Client | Prisma 7 dengan raw SQL untuk beberapa tabel support |
| Local infra | Docker Compose, Adminer |
| Testing/checks | `pnpm typecheck`, `pnpm lint`, `pnpm build`; Playwright dapat ditambahkan untuk E2E |

Package manager: `pnpm`.

## Core Features

- Katalog layanan publik ULT FMIPA.
- Pengajuan layanan oleh mahasiswa.
- Upload lampiran layanan: maksimal 3 file, PDF/JPG/PNG, 5 MB per file.
- Riwayat pengajuan mahasiswa.
- Dashboard admin/staff.
- List, detail, update status, dan delete pengajuan untuk admin.
- List, detail, dan update status pengajuan untuk staff.
- Survei kepuasan layanan untuk request yang selesai/diambil/dikirim.
- Ringkasan survei admin/staff.
- CRUD informasi/pengumuman untuk admin dan staff.
- Galeri gambar informasi: maksimal 5 gambar, WebP/PNG/JPG/JPEG, 2 MB per gambar.
- Status informasi: draft, published, archived, aktif/non-aktif, unggulan, dan jadwal tayang.

## User Roles

| Role | Akses utama |
| --- | --- |
| Guest | Halaman publik, katalog layanan, informasi, login |
| Student/Mahasiswa | Ajukan layanan, riwayat sendiri, lampiran sendiri, survei untuk request sendiri |
| Staff | Dashboard staff, request list/detail, update status request, CRUD informasi, summary survei |
| Admin | Semua akses staff plus delete pengajuan layanan dan dashboard admin |

Mahasiswa tidak boleh mengirim NPM manual untuk riwayat/survei. NPM selalu
dibaca dari session. Admin/staff tidak boleh melihat data master mahasiswa/alumni
mentah di UI.

## Local Development Setup

Requirements:

- Node.js 22 LTS
- pnpm
- Docker Desktop
- Git

```powershell
git clone <repo-url>
cd ult-fmipa
git checkout dev
pnpm install
Copy-Item .env.example .env
docker compose up -d
pnpm prisma generate
pnpm dev
```

Aplikasi: <http://localhost:3000>

Useful checks:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

## Environment Variables

Gunakan `.env.example` sebagai template. Jangan commit `.env` atau secret asli.

| Variable | Keterangan |
| --- | --- |
| `DATABASE_URL` | URL koneksi Prisma ke MariaDB lokal |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Konfigurasi database lokal |
| `NEXTAUTH_URL` | URL aplikasi, lokal biasanya `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret NextAuth lokal, isi dengan nilai development |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` | Credential admin development |
| `DEV_STAFF_EMAIL`, `DEV_STAFF_PASSWORD` | Credential staff development |
| `DEV_STUDENT_EMAIL`, `DEV_STUDENT_PASSWORD` | Credential mahasiswa development |
| `DEV_STUDENT_NAME`, `DEV_STUDENT_NPM`, `DEV_STUDENT_PHONE` | Profil mahasiswa development |
| `DB_ADMIN_ACCESS_CODES` | Mapping `data_users.ACCESS_CODE` legacy ke role admin, default `SUPER_USER` |
| `DB_STAFF_ACCESS_CODES` | Mapping `data_users.ACCESS_CODE` legacy ke role staff, default `ADMIN,OPERATOR,KRS,PIMPINAN` |
| `PAUS_MODE` | `modern` atau `legacy`; saat ini PAUS belum diaktifkan untuk production |
| `PAUS_CLIENT_ID`, `PAUS_CLIENT_SECRET` | Placeholder OAuth PAUS, jangan hardcode |
| `PAUS_AUTHORIZATION_URL`, `PAUS_TOKEN_URL`, `PAUS_USERINFO_URL`, `PAUS_SIGN_OUT_URL` | Endpoint PAUS |
| `PAUS_LEGACY_LOGIN_URL`, `PAUS_BRIDGE_SECRET`, `PAUS_BRIDGE_TOKEN_TTL_SECONDS` | Bridge PAUS legacy untuk testing |

## Database Setup

Docker Compose menyediakan MariaDB dan Adminer.

| Item | Nilai |
| --- | --- |
| MariaDB container | `ult-fmipa-db` |
| Database | `fmipa_sbpk` |
| Local DB port | `13306` |
| Container DB port | `3306` |
| User | `ult_user` |
| Password | `ult_password` |
| Adminer | <http://localhost:8081> |

Adminer login:

```text
System: MySQL / MariaDB
Server: db
Username: ult_user
Password: ult_password
Database: fmipa_sbpk
```

Jika memiliki dump legacy lokal, letakkan di `database\fmipa_sbpk.sql`, lalu:

```powershell
cmd /c "docker exec -i ult-fmipa-db mariadb -u root -proot fmipa_sbpk < database\fmipa_sbpk.sql"
```

File dump bersifat sensitif dan tidak boleh masuk repository.

## Support Table Migrations

Jangan ubah SQL dump legacy. Tabel support aplikasi dibuat terpisah.

Attachment table `ult_request_attachments` berada di Prisma migration:

```powershell
pnpm prisma migrate deploy
```

Custom support tables di `database/migrations` dijalankan dengan command
PowerShell-safe berikut:

```powershell
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\002_create_ult_service_surveys.sql"
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\003_create_ult_information_posts.sql"
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\005_create_ult_information_post_images.sql"
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\006_alter_information_posts_schedule_archive.sql"
```

Setelah database siap:

```powershell
pnpm prisma generate
```

## Running the Project

```powershell
docker compose up -d
pnpm dev
```

## Full Docker Compose

Docker Compose can also run the full stack: Next.js app, MariaDB, and Adminer.

```powershell
docker compose build
docker compose up -d
docker compose exec app pnpm db:prisma-migrate
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm db:support-migrate
```

Services:

| Service | URL / Host |
| --- | --- |
| App | <http://localhost:3000> |
| Adminer | <http://localhost:8081> |
| MariaDB from host | `localhost:13306` |
| MariaDB from containers | `db:3306` |

The app container stores uploaded service attachments and information images in
the `ult_fmipa_storage` Docker volume mounted at `/app/storage`.

## Kubernetes Deployment

Kubernetes manifests are available in `k8s/`. They include:

- MariaDB `StatefulSet` with persistent storage.
- Next.js app `Deployment` and `Service`.
- Upload storage `PersistentVolumeClaim` mounted at `/app/storage`.
- `ConfigMap` and `Secret` for environment variables.
- One-off migration `Job` for Prisma migrations and support SQL migrations.
- NGINX `Ingress` template.

Build the app image first:

```powershell
docker build -t ult-fmipa:latest .
```

For a remote cluster, tag and push the image to your registry, then update the
image in `k8s/05-migration-job.yaml` and `k8s/06-app.yaml`.

Before production deploy, replace:

- `ult-fmipa.example.com` in `k8s/02-configmap.yaml` and `k8s/07-ingress.yaml`.
- Placeholder values in `k8s/01-secrets.yaml`.
- The MariaDB manifest with a managed database or a hardened StatefulSet if the
  deployment is not just for demo/internal use.

Apply in order:

```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-mariadb.yaml
kubectl apply -f k8s/04-storage.yaml
kubectl -n ult-fmipa wait --for=condition=ready pod -l app=ult-fmipa-mariadb --timeout=180s
kubectl apply -f k8s/05-migration-job.yaml
kubectl -n ult-fmipa wait --for=condition=complete job/ult-fmipa-migrate --timeout=180s
kubectl apply -f k8s/06-app.yaml
kubectl apply -f k8s/07-ingress.yaml
```

Quality checks:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

## E2E Testing

Playwright E2E saat ini tersedia untuk manual smoke testing, tetapi sengaja
tidak dijalankan otomatis di GitHub Actions, Husky pre-push, `build`, `lint`,
atau `typecheck`. FE masih dalam tahap polishing sehingga selector, route, dan
alur form dapat berubah cepat. E2E dapat diaktifkan kembali di CI setelah UI
routes, forms, dan buttons stabil.

1. **Default E2E (Smoke + Read-Only Matrix)**:
   Menjalankan test ringan yang memverifikasi halaman utama, login, riwayat, visual dashboard admin/staff, survey page, serta memverifikasi 15 service slug API dan route tanpa submit form data.
   Jalankan dengan:
   ```powershell
   pnpm test:e2e
   ```

2. **Full Service Submission E2E (Optional)**:
   Menjalankan pengujian POST submission data secara end-to-end untuk seluruh 15 service slug yang didukung. Test ini otomatis menghapus data pengajuan yang baru dibuat via admin API setelah assertion selesai.
   > [!WARNING]
   > Jangan jalankan full-service submission tests terhadap database production karena test ini menulis records pengajuan meskipun langsung dihapus kembali.
   Jalankan dengan:
   ```powershell
   pnpm test:e2e:full-services
   ```

3. **Playwright UI Mode**:
   Membuka visual runner UI Playwright untuk debugging dan inspection secara visual.
   Jalankan dengan:
   ```powershell
   pnpm test:e2e:ui
   ```

Perintah manual lain:

```powershell
pnpm test:e2e:headed
pnpm test:e2e:debug
pnpm test:e2e:trace
pnpm test:e2e:report
```

Sebelum menjalankan E2E, pastikan Docker DB aktif dan support migrations sudah diterapkan:

```powershell
docker compose up -d
pnpm prisma migrate deploy
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\002_create_ult_service_surveys.sql"
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\003_create_ult_information_posts.sql"
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\005_create_ult_information_post_images.sql"
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\006_alter_information_posts_schedule_archive.sql"
```

## Auth Accounts

Credential development dibaca dari `.env`.

| Role | Variable |
| --- | --- |
| Admin | `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` |
| Staff | `DEV_STAFF_EMAIL`, `DEV_STAFF_PASSWORD` |
| Student | `DEV_STUDENT_EMAIL`, `DEV_STUDENT_PASSWORD`, `DEV_STUDENT_NPM` |

Admin/staff juga dapat login memakai `USER_NAME` atau `EMAIL` dari tabel legacy
`data_users`, selama `CONFIRMED = 1` dan password cocok dengan hash legacy.
Mapping role default:

| Legacy `ACCESS_CODE` | Role aplikasi baru |
| --- | --- |
| `SUPER_USER` | Admin |
| `ADMIN`, `OPERATOR`, `KRS`, `PIMPINAN` | Staff |

Mahasiswa production tidak memakai password lokal aplikasi. Mahasiswa login
melalui PAUS/SIAT/Unpad SSO, lalu aplikasi memakai NPM dari session untuk
riwayat dan pengajuan layanan. Credential student di `.env` hanya untuk testing
lokal selama PAUS belum aktif.

## Folder Structure

| Path | Keterangan |
| --- | --- |
| `src/app/(public)` | Halaman publik: beranda, layanan, informasi, survei |
| `src/app/admin` | Dashboard, request, informasi, survei admin |
| `src/app/staff` | Dashboard, request, informasi, survei staff |
| `src/app/mahasiswa` | Riwayat pengajuan mahasiswa |
| `src/app/api` | Route handlers API App Router |
| `src/components` | Komponen UI, layout, request, service, informasi, survey |
| `src/lib` | Helper auth, legacy request, upload, survey, informasi, Prisma |
| `src/types` | TypeScript types shared |
| `src/constants` | Navigasi dan konstanta UI |
| `prisma` | Prisma schema/config dan migration attachment |
| `database/migrations` | SQL support table non-legacy |
| `storage/uploads` | File lampiran layanan lokal, ignored by git |
| `storage/information` | File gambar informasi lokal, ignored by git |

## Frontend Route Map

### Public

| Route | Keterangan |
| --- | --- |
| `/` | Beranda |
| `/profil` | Profil |
| `/layanan` | Katalog layanan |
| `/layanan/[slug]` | Detail layanan |
| `/layanan/[slug]/ajukan` | Form pengajuan layanan, student-only |
| `/informasi` | Daftar informasi published, aktif, dan dalam jadwal tayang |
| `/informasi/[slug]` | Detail informasi publik |
| `/survei` | Entry page survei |
| `/login` | Login development credentials dan PAUS placeholder |

### Student

| Route | Keterangan |
| --- | --- |
| `/mahasiswa/riwayat` | Riwayat pengajuan milik session mahasiswa |
| `/mahasiswa/riwayat/[serviceSlug]/[id]` | Detail pengajuan milik mahasiswa |
| `/survei` | Arahan survei; survei juga tersedia dari request selesai |

### Staff

| Route | Keterangan |
| --- | --- |
| `/staff/dashboard` | Dashboard agregat staff |
| `/staff/requests` | List pengajuan dan aksi status |
| `/staff/requests/[serviceSlug]/[id]` | Detail pengajuan |
| `/staff/informasi` | Kelola informasi |
| `/staff/informasi/tambah` | Tambah informasi |
| `/staff/informasi/[id]/edit` | Edit informasi |
| `/staff/surveys` | Summary survei |

### Admin

| Route | Keterangan |
| --- | --- |
| `/admin/dashboard` | Dashboard agregat admin |
| `/admin/requests` | List pengajuan, aksi status, dan hapus request |
| `/admin/requests/[serviceSlug]/[id]` | Detail pengajuan dan hapus request |
| `/admin/informasi` | Kelola informasi |
| `/admin/informasi/tambah` | Tambah informasi |
| `/admin/informasi/[id]/edit` | Edit informasi |
| `/admin/surveys` | Summary survei |

## API Documentation

Semua API berada di `src/app/api`. Response error umum:

```json
{ "error": "Pesan error" }
```

### Auth

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET/POST` | `/api/auth/[...nextauth]` | Public | NextAuth credentials dan PAUS provider |
| `GET` | `/api/health` | Public | Health check |

### Services

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/services` | Public | Daftar layanan publik |
| `GET` | `/api/services/[slug]` | Public | Detail layanan |
| `POST` | `/api/services/[slug]/requests` | Student | Buat pengajuan layanan |

`POST /api/services/[slug]/requests` memakai `multipart/form-data`.
NPM dan identitas student diambil dari session.

FormData penting:

```text
attachments: File[]  // optional, append dengan key sama
```

Rules lampiran:

- key FormData: `attachments`
- maksimal 3 file
- maksimal 5 MB per file
- format: PDF, JPG/JPEG, PNG

Contoh FE:

```ts
const formData = new FormData();
formData.append("description", "Keperluan administrasi");
files.forEach((file) => formData.append("attachments", file));

await fetch("/api/services/kartu-prestasi-akademik/requests", {
  method: "POST",
  body: formData,
});
```

Contoh response sukses:

```json
{
  "data": {
    "requestId": "123",
    "attachmentCount": 2
  },
  "message": "Pengajuan layanan berhasil dikirim."
}
```

Field FormData yang dibaca API pengajuan layanan:

```text
description
email
phone
scholarshipName
semester
tahunAkademik
namaOrangTua
nipNrp
pangkatGolongan
instansi
pengantar
ditujukan
dasarSuratNo
dasarSuratPerihal
dasarSuratTgl
tempatLahir
tanggalLahir
tanggalLulus
tglLulus
ipk
yudisium
jumlahTranskrip
jumlahIjazah
jumlahTranslet
```

Kirim hanya field yang relevan untuk layanan yang dipilih.

### Student Requests

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/student/requests` | Student | List request milik session mahasiswa |
| `GET` | `/api/student/requests/[serviceSlug]/[id]` | Student | Detail request milik session mahasiswa |
| `GET` | `/api/student/requests/[serviceSlug]/[id]/survey` | Student | Survey untuk request tertentu |
| `POST` | `/api/student/requests/[serviceSlug]/[id]/survey` | Student | Upsert survey dari detail request |
| `GET` | `/api/student/surveys/pending` | Student | Request selesai terbaru yang belum disurvei |
| `GET` | `/api/student/surveys/requests` | Student | Daftar request yang eligible/tersurvei |
| `POST` | `/api/student/surveys` | Student | Submit/update survey |

Catatan FE:

- Jangan kirim NPM dari client.
- Student tidak dapat membuka request NPM lain.
- Gunakan empty state saat list kosong.
- `GET /api/student/requests` mengembalikan `{ data, pagination }`.

### Admin Requests

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/summary` | Admin | Summary dashboard |
| `GET` | `/api/admin/requests` | Admin | List request dengan filter query |
| `GET` | `/api/admin/requests/[serviceSlug]/[id]` | Admin | Detail request |
| `PATCH` | `/api/admin/requests/[serviceSlug]/[id]/status` | Admin | Update status request |
| `DELETE` | `/api/admin/requests/[serviceSlug]/[id]` | Admin | Hapus request permanen |

Payload status:

```json
{
  "action": "process",
  "staffName": "Admin ULT"
}
```

Supported `action`:

- `process` -> Proses
- `complete` -> Selesai
- `deliver` -> Diambil/Dikirim

Delete request admin membersihkan metadata lampiran, file lokal lampiran,
survey terkait jika ada, lalu row request legacy dari tabel whitelisted.

Query params list admin:

```text
service=<serviceSlug>
status=pending | inProgress | completed | delivered
page=1
limit=10
```

Response list admin/staff berbentuk:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

### Staff Requests

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/staff/summary` | Staff | Summary dashboard |
| `GET` | `/api/staff/requests` | Staff | List request dengan filter query |
| `GET` | `/api/staff/requests/[serviceSlug]/[id]` | Staff | Detail request |
| `PATCH` | `/api/staff/requests/[serviceSlug]/[id]/status` | Staff | Update status request |
| `DELETE` | `/api/staff/requests/[serviceSlug]/[id]` | Staff | Selalu 403; jangan dipakai FE |

Staff dapat memproses, menyelesaikan, dan menandai diambil/dikirim untuk
workflow yang didukung. Staff tidak dapat menghapus service request. Jika
endpoint delete staff dipanggil, response adalah 403.

Query params list staff sama seperti admin:

```text
service=<serviceSlug>
status=pending | inProgress | completed | delivered
page=1
limit=10
```

### Attachments

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/attachments/[id]` | Admin/Staff/owning Student | Download/view lampiran |

Catatan:

- Path lokal tidak pernah diekspos ke client.
- Admin/staff dapat membuka lampiran operasional.
- Student hanya dapat membuka lampiran request miliknya sendiri.

### Surveys

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/surveys/summary` | Admin | Summary survei |
| `GET` | `/api/staff/surveys/summary` | Staff | Summary survei |
| `GET` | `/api/student/surveys/pending` | Student | Pending survey modal |
| `GET` | `/api/student/surveys/requests` | Student | Request eligible/submitted |
| `POST` | `/api/student/surveys` | Student | Submit/update survey |
| `GET` | `/api/student/requests/[serviceSlug]/[id]/survey` | Student | Survey per request |
| `POST` | `/api/student/requests/[serviceSlug]/[id]/survey` | Student | Submit/update survey per request |

Payload survey:

```json
{
  "serviceSlug": "kartu-prestasi-akademik",
  "requestId": "123",
  "overallRating": 5,
  "ratingTangibility": 5,
  "ratingReliability": 5,
  "ratingResponsiveness": 4,
  "ratingAssurance": 5,
  "ratingEmpathy": 5,
  "comment": "Pelayanan cepat."
}
```

Rules:

- Rating integer 1 sampai 5.
- `overallRating` wajib.
- `comment` optional maksimal 500 karakter.
- Survey hanya untuk request milik student dan status selesai/diambil/dikirim.

### Information Posts

Admin:

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/information` | Admin | List semua informasi |
| `POST` | `/api/admin/information` | Admin | Buat informasi |
| `GET` | `/api/admin/information/[id]` | Admin | Detail informasi |
| `PATCH` | `/api/admin/information/[id]` | Admin | Update informasi |
| `DELETE` | `/api/admin/information/[id]` | Admin | Hapus informasi |

Staff:

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/staff/information` | Staff | List semua informasi |
| `POST` | `/api/staff/information` | Staff | Buat informasi |
| `GET` | `/api/staff/information/[id]` | Staff | Detail informasi |
| `PATCH` | `/api/staff/information/[id]` | Staff | Update informasi |
| `DELETE` | `/api/staff/information/[id]` | Staff | Hapus informasi |

Information create/update mendukung JSON dan `multipart/form-data`. Gunakan
FormData jika ada gambar.

FormData fields:

```text
title
category
summary
content
status          // draft | published | archived
featured        // true | false
isActive        // true | false
displayStartAt  // optional datetime-local
displayEndAt    // optional datetime-local
images          // File[], optional
```

Rules:

- Slug dibuat otomatis dari `title`.
- `title` wajib dan unik setelah normalisasi.
- `content` wajib.
- `archived`, non-active, dan scheduled-hidden tidak muncul di publik.
- `displayEndAt` harus setelah `displayStartAt`.
- gambar maksimal 5 per informasi.
- gambar maksimal 2 MB per file.
- format gambar: WebP, PNG, JPG/JPEG.
- SVG tidak diizinkan.

### Information Images

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/information/images/[imageId]` | Public if post visible, admin/staff for draft | Serve image aman |
| `POST` | `/api/admin/information/[id]/images` | Admin | Tambah gambar |
| `PATCH` | `/api/admin/information/[id]/images/[imageId]` | Admin | Update alt text |
| `DELETE` | `/api/admin/information/[id]/images/[imageId]` | Admin | Hapus gambar |
| `POST` | `/api/admin/information/[id]/images/[imageId]/cover` | Admin | Set cover |
| `POST` | `/api/staff/information/[id]/images` | Staff | Tambah gambar |
| `PATCH` | `/api/staff/information/[id]/images/[imageId]` | Staff | Update alt text |
| `DELETE` | `/api/staff/information/[id]/images/[imageId]` | Staff | Hapus gambar |
| `POST` | `/api/staff/information/[id]/images/[imageId]/cover` | Staff | Set cover |

Public pages `/informasi` dan `/informasi/[slug]` memakai server helper dan
route image aman. Storage path tidak diekspos.

## Service Request Flow

1. Student login.
2. Student membuka `/layanan`.
3. Student memilih layanan dan membuka `/layanan/[slug]`.
4. Student membuka `/layanan/[slug]/ajukan`.
5. Student submit form dan optional lampiran.
6. Success diarahkan ke `/mahasiswa/riwayat`.
7. Admin/staff memproses request dari dashboard request.
8. Jika request selesai/diambil/dikirim, student dapat mengisi survei.

## Attachment Upload Flow

- FE wajib memakai `FormData`.
- Append setiap file dengan key yang sama: `attachments`.
- Jangan membaca hanya `files[0]`.
- Tampilkan daftar file terpilih, ukuran, dan count.
- Backend tetap memvalidasi jumlah, tipe, dan ukuran file.

## Survey Flow

- Survey hanya untuk request milik student.
- Survey muncul untuk status selesai/diambil/dikirim.
- Student dapat submit dan update survey.
- Admin/staff melihat summary, rata-rata dimensi, komentar terbaru, dan breakdown layanan.

## Information/Pengumuman Flow

- Admin/staff membuat informasi dari `/admin/informasi/tambah` atau `/staff/informasi/tambah`.
- Slug otomatis dari judul.
- Editor dapat memilih draft/published/archived, aktif/non-aktif, unggulan, dan jadwal tayang.
- Gambar dapat ditambah, dihapus, diberi alt text, dan dipilih sebagai cover.
- Public hanya melihat informasi `published`, aktif, tidak archived, dan berada dalam jadwal tayang.

## Admin/Staff Workflow

Request table menampilkan tombol:

```text
Proses | Selesai | Diambil/Dikirim | Detail
```

Admin request table menambahkan:

```text
Hapus
```

Rules status:

| Status saat ini | Aksi aktif |
| --- | --- |
| Menunggu | Proses |
| Diproses | Selesai |
| Selesai | Diambil/Dikirim |
| Diambil/Dikirim | Tidak ada aksi status aktif |

Untuk layanan yang workflow statusnya belum didukung, tombol status tetap
terlihat tetapi disabled. Detail tetap aktif.

## PAUS OAuth Status

PAUS OAuth foundation sudah ada tetapi belum diaktifkan untuk production karena
callback URI dan credential harus dikonfirmasi Unpad.

Development saat ini memakai NextAuth Credentials Provider.

Callback lokal yang harus didaftarkan untuk mode modern:

```text
http://localhost:3000/api/auth/callback/paus
```

Callback production harus dikonfirmasi oleh Unpad:

```text
https://<production-domain>/api/auth/callback/paus
```

Jika PAUS lama hanya mengenali callback PHP legacy, login NextAuth dapat gagal
dengan `invalid_client`. Jangan implementasikan PAUS lebih lanjut tanpa data
client ID, secret, dan callback URI resmi.

## Testing Checklist

Minimal sebelum push:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

Manual smoke test:

- Guest membuka `/`, `/layanan`, `/informasi`, `/survei`.
- Student submit request tanpa lampiran.
- Student submit request dengan 1-3 lampiran.
- Student melihat `/mahasiswa/riwayat`.
- Admin/staff membuka request list dan detail.
- Admin/staff menjalankan Proses, Selesai, Diambil/Dikirim.
- Admin menghapus request test.
- Student mengisi survei untuk request selesai.
- Admin/staff melihat survey summary.
- Admin/staff membuat, edit, archive, restore, delete informasi.
- Public hanya melihat informasi yang visible.

## Git Workflow

- `main`: branch stable.
- `dev`: branch integration.
- `feature/*`: branch fitur.

Alur umum:

```powershell
git checkout dev
git pull origin dev
git checkout -b feature/nama-fitur
pnpm typecheck
pnpm lint
pnpm build
```

Jangan commit:

- `.env`
- `database/*.sql`
- `database/*.zip`
- `storage/uploads`
- `storage/information`

## Notes for FE Developers

- Jangan panggil API admin/staff dari UI student.
- Jangan kirim NPM manual untuk riwayat/survei student.
- Gunakan `FormData` untuk upload file.
- Gunakan JSON untuk update status dan submit survey.
- Selalu handle empty state.
- Selalu tampilkan konfirmasi sebelum aksi destructive.
- Jangan tampilkan field teknis seperti `sourceTable` kepada user.
- `serviceSlug` boleh dipakai internal route/link, tetapi label UI harus memakai nama layanan.
- Jangan expose local storage path ke UI.
- Jangan render raw HTML dari informasi.

## Troubleshooting

### Docker daemon tidak berjalan

Jalankan Docker Desktop, lalu:

```powershell
docker compose up -d
```

### PowerShell error saat memakai `<` redirection

Gunakan `cmd /c`:

```powershell
cmd /c "docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database\migrations\003_create_ult_information_posts.sql"
```

### Prisma client model support table undefined

Beberapa support table sengaja diakses dengan raw SQL karena database legacy
diintrospeksi. Jalankan migration support table, lalu:

```powershell
pnpm prisma generate
```

### Missing custom support table migration

Gejala umum: halaman survei/informasi kosong atau warning table belum tersedia.
Jalankan SQL di `database/migrations` sesuai bagian Support Table Migrations.

### PAUS `invalid_client`

Callback URI atau credential PAUS belum cocok dengan NextAuth callback:

```text
http://localhost:3000/api/auth/callback/paus
```

Minta Unpad mengonfirmasi client ID, client secret, dan callback URI.

### Port `13306` conflict

Ubah mapping port di `docker-compose.yml` atau hentikan service lokal lain yang
memakai port tersebut.

### Build gagal karena halaman membaca database

Pastikan container database hidup dan migration support table sudah dijalankan.
Beberapa halaman memakai data DB saat build. Jalankan:

```powershell
docker compose up -d
pnpm build
```
