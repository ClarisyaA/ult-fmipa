# ULT FMIPA Unpad

Website ULT FMIPA Unpad adalah aplikasi layanan berbasis Next.js App Router untuk kebutuhan halaman publik, survei, serta dashboard admin dan staff.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Prisma 7
- MariaDB
- Docker Compose
- Adminer

Package manager yang digunakan: `pnpm`.

## Requirements

Pastikan tools berikut sudah terpasang:

- Node.js 22 LTS
- pnpm
- Docker Desktop
- Git

## Setup Lokal Windows / PowerShell

1. Clone repository.

```powershell
git clone <repo-url>
cd ult-fmipa
```

2. Checkout branch `dev`.

```powershell
git checkout dev
```

3. Install dependency.

```powershell
pnpm install
```

4. Buat file environment lokal dari contoh yang sudah tersedia.

```powershell
Copy-Item .env.example .env
```

Isi atau sesuaikan nilai di `.env` jika diperlukan. File `.env` bersifat lokal dan tidak boleh di-commit.

5. Jalankan database lokal dan Adminer.

```powershell
docker compose up -d
```

Service database lokal:

- Container MariaDB: `ult-fmipa-db`
- Database legacy: `fmipa_sbpk`
- Host port: `13306`
- Container port: `3306`
- Adminer: <http://localhost:8081>

6. Import SQL legacy hanya jika developer memiliki file `fmipa_sbpk.sql` secara lokal.

Letakkan file dump di:

```text
database\fmipa_sbpk.sql
```

Lalu jalankan:

```powershell
cmd /c "docker exec -i ult-fmipa-db mariadb -u root -proot fmipa_sbpk < database\fmipa_sbpk.sql"
```

Jika tidak memiliki dump SQL, lewati langkah import dan minta file database melalui kanal internal tim. File dump bersifat sensitif dan tidak boleh masuk repository.

7. Tarik schema Prisma dari database legacy.

```powershell
pnpm prisma db pull
```

Schema Prisma dihasilkan dari introspeksi database legacy. Jangan edit `prisma/schema.prisma` sembarangan tanpa koordinasi.

8. Generate Prisma Client.

```powershell
pnpm prisma generate
```

9. Jalankan development server.

```powershell
pnpm dev
```

Aplikasi dapat dibuka di <http://localhost:3000>.

## Adminer

Adminer dapat digunakan untuk inspeksi database lokal:

- URL: <http://localhost:8081>
- System: `MySQL / MariaDB`
- Server: `db`
- Username: `ult_user`
- Password: `ult_password`
- Database: `fmipa_sbpk`

Jika Prisma Studio mengalami metadata error karena struktur database legacy, Prisma Studio boleh dilewati. Gunakan Adminer untuk inspeksi tabel dan data.

## Perintah Berguna

```powershell
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm prisma generate
pnpm prisma db pull
docker compose up -d
docker compose down
```

## Workflow Git

- `main` = branch stable
- `dev` = branch integration
- `feature/*` = branch untuk pengembangan fitur

Developer FE sebaiknya selalu membuat branch dari `dev`.

Contoh:

```powershell
git checkout dev
git pull origin dev
git checkout -b feature/nama-fitur
```

GitHub Actions CI sudah menjalankan `typecheck`, `lint`, dan `build`. Husky pre-push juga menjalankan pengecekan lokal sebelum push.

## Overview Route

- `/`
- `/profil`
- `/layanan`
- `/informasi`
- `/survei`
- `/admin/dashboard`
- `/staff/dashboard`
- `/api/health`

## Keamanan File Lokal

Jangan commit file berikut:

- `.env`
- `database/*.sql`
- `database/*.zip`

File `.env.example` sudah tersedia sebagai referensi konfigurasi environment yang aman untuk dibagikan.
