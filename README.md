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

7. Buat tabel support aplikasi non-legacy untuk survei layanan.

```powershell
docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database/migrations/002_create_ult_service_surveys.sql
```

8. Buat tabel support aplikasi non-legacy untuk informasi/pengumuman.

```powershell
docker exec -i ult-fmipa-db mariadb -u ult_user -pult_password fmipa_sbpk < database/migrations/003_create_ult_information_posts.sql
```

9. Tarik schema Prisma dari database legacy.

```powershell
pnpm prisma db pull
```

Schema Prisma dihasilkan dari introspeksi database legacy. Jangan edit `prisma/schema.prisma` sembarangan tanpa koordinasi.

10. Generate Prisma Client.

```powershell
pnpm prisma generate
```

11. Jalankan development server.

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

## PAUS OAuth

Autentikasi production disiapkan menggunakan PAUS OAuth Unpad. Untuk saat ini, login lokal tetap menggunakan NextAuth Credentials Provider khusus development untuk role `admin`, `staff`, dan `student`.

PAUS OAuth belum aktif secara default di development. Provider PAUS hanya aktif jika `PAUS_CLIENT_ID` dan `PAUS_CLIENT_SECRET` tersedia. Jangan hardcode client ID atau client secret di source code.

Implementasi NextAuth memakai callback provider `paus`, sehingga redirect URI berbeda dari aplikasi PHP legacy. Jika client PAUS lama hanya terdaftar untuk redirect URI PHP, login NextAuth dapat gagal dengan `invalid_client`. Minta Unpad mendaftarkan callback URL NextAuth berikut sebelum production login diaktifkan.

Environment yang disiapkan di `.env.example`:

- `PAUS_CLIENT_ID`
- `PAUS_CLIENT_SECRET`
- `PAUS_AUTHORIZATION_URL`
- `PAUS_TOKEN_URL`
- `PAUS_USERINFO_URL`
- `PAUS_SIGN_OUT_URL`

Callback URL lokal:

```text
http://localhost:3000/api/auth/callback/paus
```

Callback URL production harus didaftarkan dan dikonfirmasi dengan Unpad, misalnya:

```text
https://<domain-production>/api/auth/callback/paus
```

Mapping profile PAUS sementara disiapkan untuk membaca `nama`, `npm`, `nip`, dan `paus_id` dari atribut PAUS legacy. Jika `npm` tersedia, user diperlakukan sebagai mahasiswa. Jika `nip` tersedia tanpa `npm`, user diperlakukan sebagai staff.

Token exchange mengikuti flow legacy PAUS: POST `application/x-www-form-urlencoded` ke token URL dengan `client_id`, `client_secret`, `grant_type=authorization_code`, `redirect_uri`, dan `code`. User info dibaca dari `PAUS_USERINFO_URL?access_token=...`.

## PAUS OAuth Modes

`PAUS_MODE` mendukung dua mode pengujian:

- `modern`: login PAUS langsung melalui NextAuth provider `paus`.
- `legacy`: user diarahkan ke flow login/callback PHP lama, lalu PHP redirect kembali ke aplikasi Next.js dengan signed bridge token.

Mode modern membutuhkan callback URI baru yang terdaftar di PAUS:

```text
http://localhost:3000/api/auth/callback/paus
```

Untuk production, callback URI harus dikonfirmasi dengan Unpad:

```text
https://<production-domain>/api/auth/callback/paus
```

Mode legacy bridge bersifat sementara untuk development/testing. Callback PHP lama harus menyelesaikan OAuth PAUS seperti biasa, mengambil profile PAUS, membuat token HMAC SHA-256 singkat, lalu redirect ke:

```text
http://localhost:3000/auth/paus-bridge?token=<signed-token>
```

`PAUS_BRIDGE_SECRET` harus sama di PHP bridge dan Next.js. Jangan commit secret asli.

Contoh konsep PHP bridge:

```php
<?php
// Setelah callback PHP lama sukses:
// 1. Tukar authorization code ke access token.
// 2. Ambil profile dari https://paus.unpad.ac.id/api/?access_token=...
// 3. Bentuk payload singkat.
$payload = [
  'name' => $profile['attributes']['nama']['attribute_value'] ?? null,
  'npm' => $profile['attributes']['npm']['attribute_value'] ?? null,
  'nip' => $profile['attributes']['nip']['attribute_value'] ?? null,
  'pausId' => $profile['attributes']['paus_id']['attribute_value'] ?? null,
  'email' => $profile['email'] ?? null,
  'iat' => time(),
  'exp' => time() + 120,
];

$payloadJson = json_encode($payload);
$payloadPart = rtrim(strtr(base64_encode($payloadJson), '+/', '-_'), '=');
$signature = hash_hmac('sha256', $payloadPart, getenv('PAUS_BRIDGE_SECRET'), true);
$signaturePart = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
$token = $payloadPart . '.' . $signaturePart;

header('Location: http://localhost:3000/auth/paus-bridge?token=' . urlencode($token));
exit;
```

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
