# Panduan Setup ULT FMIPA di Laptop Baru (dari Nol Sampai Bisa Login)

Panduan ini untuk teman/anggota tim yang baru pertama kali setup project ini
di laptop baru, branch **`staging`**. Ikuti urut dari atas ke bawah, jangan
loncat langkah.

Untuk referensi tambahan yang sudah ada di repo (boleh dibaca sebagai
pelengkap, bukan pengganti): [`SETUP.md`](./SETUP.md) dan
[`README.md`](./README.md).

---

## 0. Penting: Ini Panduan Mode "Local Staging Rehearsal"

Branch `staging` ini dijalankan pakai simulasi production yang sudah
disiapkan di repo: `docker-compose.staging-local.yml` +
`staging-local.env` + `staging-local.bootstrap.env`. Bedanya dengan mode
dev biasa (`pnpm dev` + `.env`):

- **Mode dev biasa**: login pakai `DEV_ADMIN_*`/`DEV_STAFF_*`/`DEV_STUDENT_*`
  langsung dari `.env` (bypass, bukan akun database sungguhan).
- **Mode local staging rehearsal (dipakai panduan ini)**: `DEV_*` **di-hardcode
  kosong** oleh `docker-compose.staging-local.yml` - tidak bisa dipakai sama
  sekali. Login harus akun database asli. Akun Admin pertama dibuat lewat
  script `pnpm staging:local:bootstrap-admin`, dengan data (username/email/
  password) **kamu isi/tentukan sendiri** di `staging-local.bootstrap.env`
  (bukan "pakai yang sudah ada" - kamu bebas menentukan kredensial baru).
  Akun Staff dibuat belakangan lewat halaman admin user management setelah
  Admin berhasil login.

Detail lengkap ada di [`docs/local-staging-rehearsal.md`](./docs/local-staging-rehearsal.md) -
panduan ini adalah versi ringkas step-by-step untuk laptop baru.

## 1. File yang HARUS Diminta ke Clarisya (Tidak Ada di GitHub)

Karena alasan keamanan, beberapa file **sengaja tidak di-commit** ke GitHub
(lihat `.gitignore`). Tanpa file ini, project **tidak bisa jalan**.
Minta file berikut lewat jalur pribadi (WhatsApp/Drive/flashdisk) -
**jangan pernah upload/share ke tempat publik** (GitHub, grup umum, dsb),
karena berisi data legacy asli:

| File | Wajib? | Kenapa tidak ada di GitHub | Taruh di mana |
| --- | --- | --- | --- |
| `fmipa_sbpk.sql` | **Wajib** | File dump database legacy ±26 MB, `.gitignore` blok `*.sql` | `prisma/migrations/fmipa_sbpk.sql` (bukan folder `database/` - lihat Langkah 8) |
| `storage/uploads/*` (opsional) | Opsional | File lampiran lama sebelum migrasi ke MinIO, `.gitignore` blok isi `storage/uploads/` | Folder `storage/uploads/` |

`.env`, `staging-local.env`, dan `staging-local.bootstrap.env` **tidak perlu**
diminta ke Clarisya - semua secret di file-file itu memang harus di-generate
baru sendiri per laptop (lihat Langkah 5-7), bukan dipakai bersama/di-copy.

Selain `fmipa_sbpk.sql` (wajib) dan `storage/uploads/` (opsional), **tidak
ada** file lain yang perlu ditransfer manual - `node_modules/`, `.next/`,
hasil build, dsb akan ter-generate ulang otomatis di langkah instalasi.

---

## 1. Install Software Prasyarat

Install semua ini dulu di laptop baru:

1. **Git** - <https://git-scm.com/downloads>
2. **Node.js 22 LTS** - <https://nodejs.org> (pilih versi LTS 22.x)
3. **Docker Desktop** - <https://www.docker.com/products/docker-desktop/>
   (harus dinyalakan/running sebelum lanjut ke langkah database)
4. **VS Code** (opsional, editor) - <https://code.visualstudio.com>

Setelah Node.js terinstall, aktifkan `pnpm` lewat Corepack (sudah bundled di
Node 22+), buka PowerShell:

```powershell
corepack enable
```

Verifikasi semua terinstall dengan benar:

```powershell
git --version
node -v
pnpm -v
docker -v
docker compose version
```

Kalau PowerShell menolak menjalankan `pnpm` karena execution policy, ganti
`pnpm` dengan `pnpm.cmd` di semua command pada panduan ini.

---

## 2. Clone Repository (branch `staging`)

```powershell
git clone https://github.com/ClarisyaA/ult-fmipa.git
cd ult-fmipa
git checkout staging
```

Pastikan branch aktif benar:

```powershell
git branch --show-current
```

Harus menampilkan `staging`.

---

## 3. Install Dependency + Generate Prisma Client

```powershell
pnpm install
pnpm prisma generate
```

---

## 4. Taruh File Baseline Database

Copy file `fmipa_sbpk.sql` yang diminta di Langkah 1 ke path berikut
(perhatikan, **bukan** folder `database/`):

```
prisma/migrations/fmipa_sbpk.sql
```

(Opsional) Kalau dikasih isi `storage/uploads/`, copy ke folder
`storage/uploads/` di project.

---

## 5. Buat `staging-local.env`

```powershell
Copy-Item staging-local.env.example staging-local.env
```

Generate secret random (jalankan 3x, atau isi manual sendiri):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Buka `staging-local.env`, isi field yang masih `<...>` dengan nilai sendiri
(bebas asal bukan default), minimal:

- `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD` - bebas, contoh: `staging_user` / hasil generate di atas
- `NEXTAUTH_SECRET` - hasil generate di atas
- `PAUS_BRIDGE_SECRET` - hasil generate di atas (beda dari `NEXTAUTH_SECRET`)
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - bebas, contoh: `staginglocaladmin` / hasil generate

Biarkan `PAUS_CLIENT_ID`/`PAUS_CLIENT_SECRET`/dst kosong (tidak punya
kredensial PAUS asli = tidak apa-apa, login Admin/Staff tetap lewat
database, bukan PAUS).

File ini **jangan pernah** dikirim ke Clarisya atau siapa pun - generate
baru sendiri per laptop.

---

## 6. Buat `staging-local.bootstrap.env`

```powershell
Copy-Item staging-local.bootstrap.env.example staging-local.bootstrap.env
```

Buka file itu dan isi data akun Admin pertama - **kamu tentukan sendiri**,
bukan pakai akun yang sudah ada:

```dotenv
STAGING_BOOTSTRAP_ADMIN_USERNAME=admin_staging
STAGING_BOOTSTRAP_ADMIN_EMAIL=admin.staging@example.com
STAGING_BOOTSTRAP_ADMIN_NAME=Admin Staging Local
STAGING_BOOTSTRAP_ADMIN_PASSWORD=GantiPasswordIni123
```

Password minimal 8 karakter, jangan pakai `admin123` atau nilai default
lain yang gampang ditebak.

---

## 7. Pastikan Docker Desktop Sudah Nyala

```powershell
docker -v
docker compose version
```

---

## 8. Jalankan Urutan Command Local Staging Rehearsal

Jalankan satu per satu, dari root project:

```powershell
pnpm staging:local:config        # validasi config saja, belum start container
pnpm staging:local:up            # build + start stack (db, minio, app)
pnpm staging:local:ps            # pastikan container staging-local sehat
pnpm staging:local:import-baseline   # import prisma/migrations/fmipa_sbpk.sql
pnpm staging:local:migrate       # db:prisma-migrate + db:support-migrate
pnpm staging:local:bootstrap-admin   # bikin 1 akun Admin pertama
```

Kalau `staging:local:import-baseline` gagal dengan pesan
`BLOCKED - legacy database baseline required`, berarti file
`prisma/migrations/fmipa_sbpk.sql` di Langkah 4 belum ada/salah lokasi.

---

## 9. Jalankan Aplikasi & Cek Kesehatan

`pnpm staging:local:up` di Langkah 8 sudah menjalankan container `app`
(tidak perlu `pnpm dev` terpisah pada mode ini). Cek:

```powershell
curl.exe http://localhost:3100/api/health
```

Harus muncul `"status": "ok"`. Kalau error, cek `pnpm staging:local:ps` dan
`pnpm staging:local:logs -- db` / `-- minio`.

---

## 10. Login Admin

1. Buka <http://localhost:3100/login>.
2. Login pakai `STAGING_BOOTSTRAP_ADMIN_EMAIL` (atau username) dan
   `STAGING_BOOTSTRAP_ADMIN_PASSWORD` dari Langkah 6.

Ini akun database sungguhan (bukan bypass `.env`), sama seperti alur login
production.

---

## 11. Buat Akun Staff (dari dalam aplikasi, setelah login Admin)

1. Sebagai Admin, buka halaman manajemen user
   (<http://localhost:3100/admin/system/users>).
2. Buat user baru: "Akses Aplikasi" = `STAFF`, isi Posisi/Level, Unit, dan
   password (min 8 karakter).
3. Logout, lalu login lagi di <http://localhost:3100/login> pakai akun
   Staff yang baru dibuat.

Tidak ada akun Mahasiswa lewat `DEV_*` di mode ini - login mahasiswa di
production/VPS staging memakai PAUS OAuth asli (student-only), bukan
kredensial database biasa.

---

## 12. Login sebagai Mahasiswa Uji Coba (Selagi PAUS Belum Siap)

PAUS OAuth belum bisa dipakai untuk uji coba, tapi ada jalur lain khusus
mahasiswa yang memang dirancang untuk ini: **PAUS Bridge**
(`src/app/auth/paus-bridge`). Jalur ini menerima token yang ditandatangani
pakai `PAUS_BRIDGE_SECRET` - nilai yang **kamu sendiri generate** di
Langkah 5, jadi kamu bisa bikin token uji coba sendiri tanpa PAUS asli.
Session mahasiswa yang terbentuk dari token ini isinya bebas kamu tentukan
(nama/NPM/email), bukan diambil dari `data_users`.

1. Buka file `staging-local.env`, salin nilai `PAUS_BRIDGE_SECRET`.
2. Jalankan (ganti `<PAUS_BRIDGE_SECRET_KAMU>` dengan nilai dari langkah 1,
   dan `npm`/`name`/`email` bebas diganti sesuai kebutuhan uji coba):

   ```powershell
   $env:BRIDGE_SECRET = "<PAUS_BRIDGE_SECRET_KAMU>"
   node -e "
   const crypto = require('crypto');
   const secret = process.env.BRIDGE_SECRET;
   const payload = {
     npm: '140810230099',
     name: 'Mahasiswa Uji Coba',
     email: 'mhs.ujicoba@test.local',
     iat: Math.floor(Date.now() / 1000),
     exp: Math.floor(Date.now() / 1000) + 3600
   };
   const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');
   const signature = crypto.createHmac('sha256', secret).update(payloadPart).digest('base64url');
   console.log(payloadPart + '.' + signature);
   "
   ```

3. Copy output token yang muncul (satu baris panjang), lalu buka di browser:

   ```
   http://localhost:3100/auth/paus-bridge?token=<TOKEN_HASIL_LANGKAH_2>
   ```

4. Otomatis login sebagai mahasiswa dengan NPM/nama sesuai yang diisi di
   `payload` pada langkah 2, dan diarahkan ke halaman layanan mahasiswa.

Token berlaku 1 jam (`exp` di payload) - ulangi langkah 2-3 kalau sudah
kedaluwarsa. Cara ini **hanya untuk uji coba lokal**, jangan pernah dipakai
di VPS staging/production sungguhan - di sana wajib PAUS OAuth asli.

---

## 13. (Opsional) Audit Storage & Import File Lampiran Lama

```powershell
pnpm staging:local:audit
```

Kalau di Langkah 4 dikasih isi `storage/uploads/`, migrasikan ke MinIO
lewat cara yang sama seperti dokumentasi migrasi storage di `README.md`
(§ Legacy Storage Migration) - jalankan dari host, arahkan ke database/
bucket staging-local. Kalau folder `storage/` kosong, lewati langkah ini.

---

## 14. Bersihkan Kredensial Bootstrap

Setelah dipastikan bisa login Admin, hapus file bootstrap supaya password
plaintext tidak nongkrong di disk:

```powershell
Remove-Item staging-local.bootstrap.env
```

## 15. Mematikan Stack (Tanpa Menghapus Data)

```powershell
pnpm staging:local:down
```

Data di database/MinIO tetap tersimpan di volume, aman dijalankan ulang
lain kali dengan `pnpm staging:local:up`.

---

## Troubleshooting Singkat

- **Docker belum jalan** - buka Docker Desktop, tunggu status running,
  ulangi Langkah 7.
- **Port bentrok (3000/13306/9000 dipakai app lain)** - matikan aplikasi
  lain yang pakai port itu, atau ubah port di `.env`/`docker-compose.yml`.
- **`pnpm` tidak dikenali** - pastikan `corepack enable` sudah dijalankan,
  buka ulang terminal.
- **`status: error` di `/api/health`** - cek `docker compose ps -a`
  (`db`/`minio` harus jalan), cek isi `.env` cocok dengan Langkah 5.
- Troubleshooting lengkap lain: lihat [`README.md` § Troubleshooting](./README.md#18-troubleshooting).

---

## Setelah Berhasil Jalan

- Baca [`README.md`](./README.md) untuk overview fitur dan struktur project.
- **Jangan** pernah commit `.env`, file `.sql`, atau isi folder `storage/`
  ke Git - semua itu sudah benar di-`.gitignore`, biarkan begitu.
