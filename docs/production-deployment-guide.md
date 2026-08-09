# Production Deployment Guide - ULT FMIPA Unpad

> **Versi dokumen**: 2026-08-03 (bagian storage direvisi setelah migrasi ke MinIO)
> **Dasar audit**: source code repository aktual, `docker-compose.yml`, `Dockerfile`, `.env.example`, `src/lib/auth.ts`, `src/lib/file-upload.ts`, `scripts/`, `prisma/`, `database/migrations/`, `k8s/`, `docs/vps-deployment-backup.md`  
> **Status dokumen**: Panduan siap pakai. Seluruh perintah diverifikasi terhadap file aktual di repository. Placeholder ditulis dalam format `<NAMA_PLACEHOLDER>`.

> [!IMPORTANT]
> **Storage sudah bermigrasi ke MinIO.** Dokumen ini awalnya ditulis untuk
> arsitektur storage bind-mount filesystem lokal (`STORAGE_ROOT`,
> `ULT_STORAGE_HOST_PATH`, `/app/storage`, `chown`/`chmod` UID-GID). Bagian
> **4** dan **5** sudah ditulis ulang mengikuti arsitektur MinIO aktual dan
> menjadi rujukan utama untuk topik storage. Beberapa referensi lama ke path
> bind-mount storage mungkin masih tersisa di bagian lain dokumen ini
> (checklist, ringkasan, contoh command) yang belum sempat diaudit satu per
> satu pada revisi ini - jika menemukan instruksi `mkdir /srv/ult-fmipa/storage`,
> `chown`/`chmod` pada path storage, atau env var `STORAGE_ROOT`/
> `ULT_STORAGE_HOST_PATH` di luar bagian 4-5, **abaikan dan rujuk ke bagian
> 4-5 serta [`docs/minio-storage-deployment.md`](./minio-storage-deployment.md)**
> sebagai sumber kebenaran storage yang aktual.

---

## 1. Ringkasan Eksekutif

### Status Kesiapan

| Area | Status | Keterangan |
|---|---|---|
| Development (local) | **Ready** | Build berhasil, unit test 17/17 pass, TypeCheck bersih |
| Staging | **Ready with conditions** | Butuh VPS, domain staging, PAUS credential staging, credential MinIO staging yang unik |
| Production | **Not ready** | PAUS credential production belum terkonfirmasi; tidak boleh go-live sebelum PAUS diuji di environment domain aktual |

### Blocker Utama Sebelum Go-Live Production

1. **PAUS OAuth credential belum tersedia** - `PAUS_CLIENT_ID` dan `PAUS_CLIENT_SECRET` untuk domain production belum dikonfirmasi oleh tim PAUS Unpad.
2. **Domain production belum ditetapkan** - `NEXTAUTH_URL` harus disesuaikan dengan domain resmi, dan redirect URI PAUS harus didaftarkan.
3. **VPS belum tersedia** - IP, OS, CPU/RAM/disk, dan akses SSH belum dikonfirmasi.
4. **Credential MinIO production belum ditetapkan** - `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` harus unik per environment, bukan nilai default development.
5. **Database local memiliki 4 metadata attachment tanpa file fisik** - Kondisi ini tidak boleh dibawa ke staging/production.

### Keputusan yang Harus Datang dari Tim Unpad

- Penyediaan dan akses VPS.
- Domain production dan domain staging.
- Akses DNS untuk A/AAAA record.
- PAUS client ID dan client secret untuk staging dan production.
- Redirect URI yang harus didaftarkan ke PAUS.
- Akun uji PAUS (mahasiswa dan staf).
- Reverse proxy pilihan (Nginx/Caddy) - tidak ada konfigurasi Nginx bawaan di repository.
- Policy backup dan retensi data.
- PIC deployment dan maintenance window.

### Rekomendasi Urutan Deployment

```
Local Development → Staging (domain uji, PAUS staging) → Production
```

**Apakah dapat langsung production?** Tidak, karena PAUS belum pernah diuji pada domain production-like. Lihat bagian 3 untuk detail.

**Risiko jika langsung production:** PAUS login bisa gagal total saat go-live, menyebabkan seluruh pengguna tidak bisa masuk. Rollback memerlukan downtime dan koordinasi.

---

## 2. Arsitektur Deployment yang Direkomendasikan

### Alur Request

```
Pengguna (Browser)
    ↓ HTTPS port 443
Reverse Proxy (Nginx/Caddy) - di Host VPS, bukan container
    ↓ HTTP port 3000 (internal)
Container Aplikasi: ult-fmipa-app (Next.js standalone, node server.js)
    ↓                                   ↓
Container Database: ult-fmipa-db    Container MinIO: ult-fmipa-minio
    (MariaDB 11)                        (object storage, API 9000)
    ↓                                   ↓
Named Volume: ult_fmipa_db_data     Named Volume: minio_data
    → /var/lib/mysql                    → /data
```

Tidak ada bind mount storage host untuk container `app` - semua file upload
mengalir lewat network internal Compose ke container `minio`, bukan lewat
filesystem host. Lihat bagian 4-5.

### Komponen dan Lokasinya

| Komponen | Lokasi | Keterangan |
|---|---|---|
| Aplikasi Next.js | Container `ult-fmipa-app` | Berjalan sebagai `node server.js` (standalone output), port 3000 |
| MariaDB 11 | Container `ult-fmipa-db` | Port internal 3306, exposed ke host port 13306 (sebaiknya tutup di production) |
| Adminer | Container `ult-fmipa-adminer` | Port 8081 - **nonaktifkan di production** |
| MinIO | Container `ult-fmipa-minio` | Object storage privat, API port 9000, console port 9001 (**jangan expose ke publik**) |
| Data storage file | Named volume Docker | `minio_data` → `/data` (di container MinIO) |
| Data database | Named volume Docker | `ult_fmipa_db_data` → `/var/lib/mysql` |
| Direktori backup | Host VPS | `/srv/backups/` (rekomendasi, lihat bagian 15) |
| Reverse proxy | Host VPS (luar container) | Nginx/Caddy - tidak ada file konfigurasi di repository |
| DNS | Layanan eksternal | A/AAAA record ke IP VPS |
| HTTPS/TLS | Host VPS | Let's Encrypt via Certbot atau Caddy otomatis |
| PAUS SSO | Layanan eksternal Unpad | `https://paus.unpad.ac.id/` |
| Email | Tidak ada SMTP di repository | Tidak digunakan untuk pengiriman email otomatis (hanya draft Gmail) |

> [!NOTE]
> Adminer (`ult-fmipa-adminer`, port 8081) **wajib dimatikan atau tidak diekspos ke publik** di production. Port 13306 database juga sebaiknya hanya dibuka untuk keperluan maintenance, bukan publik.

---

## 3. Apakah Staging Diperlukan?

**Jawaban tegas: Ya, staging sangat direkomendasikan dan tidak boleh dilewati dalam kondisi normal.**

### Mengapa Staging Wajib untuk Project Ini

1. **PAUS belum pernah diuji di environment dengan domain nyata.** Di local development, login mahasiswa menggunakan kredensial dummy (`DEV_STUDENT_*`). Login PAUS OAuth hanya aktif jika `PAUS_CLIENT_ID` dan `PAUS_CLIENT_SECRET` tersedia - keduanya belum pernah diuji.
2. **Callback PAUS bergantung domain.** Redirect URI `<NEXTAUTH_URL>/api/auth/callback/paus` harus terdaftar di PAUS Unpad dan harus cocok persis. Kesalahan kecil menyebabkan semua login gagal.
3. **Credential MinIO staging/production belum pernah diuji end-to-end di VPS.** Bucket, access key, dan secret key MinIO harus unik per environment dan divalidasi lewat `pnpm storage:audit -- --strict` sebelum go-live.
4. **Dua jalur migration (Prisma + Support SQL) belum diuji dari database kosong di luar lokal.** Skema legacy berukuran besar (`prisma/migrations/fmipa_sbpk.sql` - 26 MB).
5. **Rate limiter in-memory akan reset setiap container restart.** Perlu divalidasi apakah perilaku ini dapat diterima di production.

### Risiko Spesifik Jika Staging Dilewati

| Risiko | Dampak |
|---|---|
| PAUS callback URL salah | Seluruh mahasiswa tidak bisa login - downtime total |
| Permission storage salah | Upload gagal, file tidak bisa dibaca |
| Migration berurutan salah | Database corrupt atau tabel tidak terbuat |
| Cookie/session tidak secure di HTTPS | Session hilang atau tidak valid |
| Adminer atau port 13306 terbuka | Eksposur database ke publik |

---

### Opsi A - Staging Terpisah (VPS Berbeda)

**Setup:**
- VPS staging terpisah dari production.
- Domain staging: misal `ult-fmipa-staging.<subdomain-unpad>.ac.id` atau domain uji terpisah.
- Database staging terpisah (tidak terkait production).
- Storage staging terpisah.
- PAUS redirect URI staging terdaftar terpisah.

**Kelebihan:**
- Isolasi penuh - tidak ada risiko kontaminasi data production.
- Bisa melakukan tes destruktif (reset database, test rollback).
- Tim bisa bereksperimen bebas.

**Kekurangan:**
- Butuh anggaran VPS tambahan.
- Butuh registrasi PAUS dua kali (staging dan production).

**Kapan digunakan:** Jika tim Unpad menyediakan VPS terpisah atau dana tersedia.

---

### Opsi B - Staging pada VPS yang Sama (Dipisah Compose Project)

**Setup yang Aman:**

```bash
# Production - dijalankan dari folder /opt/ult-fmipa/production/
COMPOSE_PROJECT_NAME=ult-fmipa-prod

# Staging - dijalankan dari folder /opt/ult-fmipa/staging/
COMPOSE_PROJECT_NAME=ult-fmipa-staging
```

Pemisahan yang diperlukan:

| Aspek | Production | Staging |
|---|---|---|
| Compose project name | `ult-fmipa-prod` | `ult-fmipa-staging` |
| Port aplikasi (host) | `3000:3000` | `3001:3000` |
| Port database (host) | `13306:3306` | `13307:3306` |
| Named volume database | `ult_fmipa_prod_db_data` | `ult_fmipa_staging_db_data` |
| Host storage path | `/srv/ult-fmipa/production/storage` | `/srv/ult-fmipa/staging/storage` |
| `NEXTAUTH_URL` | `https://<DOMAIN_PRODUCTION>` | `https://<DOMAIN_STAGING>` |
| PAUS redirect URI | `/api/auth/callback/paus` pada domain prod | `/api/auth/callback/paus` pada domain staging |
| Database name | `fmipa_sbpk_prod` (konfirmasi) | `fmipa_sbpk_staging` |

> [!CAUTION]
> Storage staging dan production **wajib menggunakan path host yang berbeda**. Jangan pernah menggunakan folder yang sama. Jika path tumpang tindih, file production bisa tertimpa atau terhapus oleh operasi staging.

**Kelebihan:** Hemat satu VPS, cocok untuk Unpad yang mungkin hanya punya satu server.

**Kekurangan:** Perlu disiplin dalam pemisahan konfigurasi. Risiko konfigurasi tumpang tindih jika tidak hati-hati.

---

### Opsi C - Tanpa Staging

**Apakah bisa dilewati?** Ya, hanya dalam kondisi sangat terbatas.

**Syarat Minimum Jika Terpaksa Langsung Production:**

- [ ] PAUS credential sudah dikonfirmasi dan akun uji tersedia.
- [ ] PAUS redirect URI sudah terdaftar di `https://<DOMAIN_PRODUCTION>`.
- [ ] Backup database awal sudah dibuat dan diuji restore-nya.
- [ ] Maintenance window ditetapkan - akses hanya untuk tim internal.
- [ ] Migration sudah di-review dan tidak ada langkah destruktif.
- [ ] Rollback image lama tersimpan dan siap dijalankan.
- [ ] Smoke test wajib dilakukan segera setelah deployment (lihat bagian 14).
- [ ] Person in charge standby selama minimal 4 jam pertama.
- [ ] Monitoring log aktif.

**Keputusan akhir:** Staging sangat direkomendasikan. **Tidak boleh dilewati jika PAUS belum pernah diuji pada domain production-like.**

---

### Perbandingan Opsi Staging

| Aspek | Opsi A (VPS Terpisah) | Opsi B (VPS Sama) | Opsi C (Tanpa Staging) |
|---|---|---|---|
| Keamanan isolasi | Sangat tinggi | Tinggi (jika dipisah benar) | Tidak ada |
| Biaya tambahan | Tinggi (VPS baru) | Rendah | Nol |
| Waktu setup | Lebih lama | Sedang | Minimal |
| Risiko downtime production | Sangat rendah | Rendah | Tinggi |
| Risiko data | Sangat rendah | Rendah (jika path terpisah) | Tinggi |
| Kemudahan rollback | Mudah | Mudah | Sulit |
| Rekomendasi | ⭐ Terbaik | ✅ Praktis | ⚠️ Darurat saja |

---

## 4. Kondisi Storage Saat Ini

> [!IMPORTANT]
> Bagian ini direvisi total. Arsitektur storage bind-mount filesystem lokal
> (`storage/`, `STORAGE_ROOT`, `ULT_STORAGE_HOST_PATH`, `/app/storage`) yang
> dijelaskan versi dokumen sebelumnya **sudah tidak berlaku**. Seluruh file
> upload sekarang tersimpan di **MinIO** (object storage S3-compatible),
> dijalankan sebagai service Docker Compose/Kubernetes terpisah - bukan
> volume/bind mount pada service `app`. Lihat
> [`docs/minio-storage-deployment.md`](./minio-storage-deployment.md) dan
> [`docs/minio-storage-audit.md`](./minio-storage-audit.md) untuk detail
> teknis lengkap; bagian ini merangkum implikasi operasionalnya untuk VPS.

### Peta Object Storage

| Konteks | `MINIO_ENDPOINT` | Keterangan |
|---|---|---|
| Local development, app di host | `localhost` | MinIO tetap di Docker, diakses lewat port `9000` yang di-publish ke host |
| Docker Compose (app + MinIO sama-sama service Compose) | `minio` | DNS internal Compose |
| VPS production (Docker Compose) | `minio` | Sama seperti Compose lokal - service `app` dan `minio` satu network Compose |
| Kubernetes | nama `Service` MinIO (`ult-fmipa-minio`) atau endpoint S3-compatible eksternal | Lihat `k8s/README.md` |

### Object prefix per fitur

```
uploads/                  ← file attachment mahasiswa (ult_request_attachments)
information/              ← gambar artikel informasi
home-activities/          ← gambar kegiatan beranda (multi-gambar per kegiatan)
profile/organization/     ← foto struktur organisasi (model lama, masih dipertahankan)
profile/location/         ← foto lokasi/fasilitas
```

### Cara Kerja Akses File

- Metadata (nama asli, nama tersimpan, MIME type, ukuran, dan untuk gambar
  CMS: alt text/image fit/cover/urutan) disimpan di MariaDB.
- Kolom `STORED_NAME`/`IMAGE_STORED_NAME` berisi nama object (UUID +
  ekstensi) - field inilah yang dipakai setiap route serve untuk
  mengambil object dari MinIO.
- Kolom `STORAGE_PATH`/`IMAGE_PATH` berisi object key MinIO, contoh
  `uploads/<uuid>.pdf` (bukan path filesystem).
- Object fisik tersimpan di bucket MinIO (`MINIO_BUCKET`, default
  `ult-fmipa`), **privat** - tidak ada akses anonim/publik.
- Akses file dilakukan melalui endpoint API, contoh: `GET /api/attachments/<id>`.
  Endpoint memverifikasi sesi pengguna dan otorisasi, lalu men-**stream**
  object dari MinIO ke client - bucket MinIO tidak pernah diakses langsung
  oleh browser.
- Security headers aktif: `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`, `Pragma: no-cache`, `Expires: 0`.

### Jawaban Langsung atas Pertanyaan Operasional

**Setelah mendapatkan VPS, file upload tersimpan di mana?**
Di volume Docker `minio_data` yang di-mount ke container `minio` - bukan di
filesystem host `app`. Lihat konfigurasi volume di `docker-compose.yml`.

**Apakah admin dari komputer berbeda bisa membuka file?**
Ya. File diakses via endpoint API (`/api/attachments/<id>`, dsb.) yang
dijalankan server dan men-stream dari MinIO. Komputer admin tidak perlu
memiliki file lokal maupun akses langsung ke MinIO.

**Apakah file bergantung pada komputer mahasiswa?**
Tidak. File tersimpan permanen di MinIO setelah upload berhasil.

**Apakah file bertahan setelah redeploy (`docker compose up -d --build`)?**
**Ya**, selama named volume `minio_data` tidak dihapus. Rebuild image `app`
tidak menyentuh volume `minio`.

**Apa yang terjadi jika `docker compose down` dijalankan?**
Semua container berhenti dan dihapus. Data MinIO **aman** (named volume
`minio_data`) dan database **aman** (named volume `ult_fmipa_db_data`) -
keduanya tidak ikut terhapus oleh `down` tanpa flag `-v`.

**Apa yang terjadi jika `docker compose down -v` dijalankan?**
**Kedua** named volume (`ult_fmipa_db_data` dan `minio_data`) ikut
terhapus → data database **dan** seluruh object file hilang permanen.
**Jangan pernah menjalankan `down -v` di production tanpa backup penuh
(database + MinIO) yang sudah diverifikasi.**

**Apa yang harus ikut dibackup?**
Dua komponen yang **harus dibackup secara terpisah** (lihat bagian 15):
1. Database MariaDB (named volume `ult_fmipa_db_data`).
2. Bucket MinIO (named volume `minio_data`, atau via `mc mirror` ke luar
   volume Docker untuk backup off-host).

---

### Catatan Penting: Kondisi Database Local

> [!CAUTION]
> `pnpm storage:audit` dapat melaporkan discrepancy (`MISSING_OBJECT`,
> `ORPHAN_OBJECT`, dsb.) pada database local jika object MinIO dan metadata
> DB sempat tidak sinkron (mis. saat migrasi dari storage lokal lama ke
> MinIO, atau data uji yang dibuat/dihapus manual).
>
> - Discrepancy semacam ini **tidak boleh dibawa ke staging atau production**.
> - Audit storage di staging/production harus menunjukkan `Integrity Status: CLEAN`
>   (`pnpm storage:audit -- --strict` exit code `0`) sebelum go-live.
> - **Jangan menghapus metadata production secara otomatis.** Selalu review manual.
> - Saat membuat database staging/production awal dari SQL dump, pastikan
>   object MinIO terkait juga ikut dipindahkan (`pnpm storage:migrate:minio`
>   jika sumbernya masih filesystem lama) atau di-restore dari backup MinIO
>   yang sesuai.

---

## 5. Setup MinIO pada VPS Unpad

### Langkah Rinci dari VPS Kosong

**Prasyarat:** Docker sudah terinstal, repository sudah di-clone ke VPS.

#### Langkah 1 - Tentukan Direktori Aplikasi

```bash
# Contoh: semua file aplikasi ada di /opt/ult-fmipa/
export APP_DIR=/opt/ult-fmipa
```

#### Langkah 2 - Set Credential MinIO Production

Isi `.env` (atau secret manager VPS) dengan credential MinIO **unik untuk
production** - jangan pernah memakai nilai default development
(`minioadmin`/`minioadmin123`):

```bash
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=<GANTI_DENGAN_NILAI_UNIK>
MINIO_SECRET_KEY=<GANTI_DENGAN_NILAI_UNIK_KUAT>
MINIO_BUCKET=ult-fmipa
```

`MINIO_USE_SSL` tetap `false` selama trafik `app` ↔ `minio` terjadi di
dalam network Docker Compose internal (tidak melewati internet terbuka).
Jika MinIO di-expose lewat TLS terminating proxy sendiri, sesuaikan dengan
konfigurasi tersebut.

#### Langkah 3 - Jalankan Docker Compose

```bash
docker compose up -d
```

`app` menunggu `minio` sehat (healthy) dan `minio-init` selesai sukses
sebelum start - tidak ada langkah manual tambahan untuk membuat bucket.

#### Langkah 4 - Verifikasi Bucket Sudah Dibuat dan Privat

```bash
docker compose logs minio-init
# Harus diakhiri dengan: "MinIO bucket ready (private): ult-fmipa"

docker compose ps
# ult-fmipa-minio        healthy
# ult-fmipa-minio-init   Exited (0)
```

#### Langkah 5 - Upload File Uji

Buka website, login sebagai admin/staff, dan upload file test melalui UI
(contoh: gambar Kegiatan Mahasiswa atau lampiran layanan).

#### Langkah 6 - Verifikasi Object Tersimpan di MinIO

```bash
docker compose exec minio mc alias set local http://localhost:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
docker compose exec minio mc ls local/ult-fmipa/uploads/
```

#### Langkah 7 - Restart dan Rebuild Container, Verifikasi Object Masih Ada

```bash
docker compose restart app
docker compose exec minio mc ls local/ult-fmipa/uploads/

docker compose up -d --build app
# Object harus masih ada karena tersimpan di volume `minio_data`, terpisah
# dari lifecycle container `app`.
docker compose exec minio mc ls local/ult-fmipa/uploads/
```

#### Langkah 8 - Jalankan Storage Audit Strict

```bash
docker compose exec app pnpm storage:audit -- --strict
# Output harus: Integrity Status: CLEAN
# Exit code harus: 0
```

---

### Panduan Troubleshooting Storage

**Cara memastikan MinIO sehat dan bucket sudah ada:**
```bash
docker compose ps
docker compose logs minio
docker compose logs minio-init
```

**Cara mengecek object langsung di MinIO:**
```bash
docker compose exec minio mc alias set local http://localhost:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
docker compose exec minio mc ls local/ult-fmipa/uploads/
docker compose exec minio mc du local/ult-fmipa
```

**Cara mengecek konektivitas `app` → `minio`:**
```bash
docker compose exec app printenv | grep MINIO
# MINIO_ENDPOINT harus "minio" (nama service Compose), BUKAN "localhost",
# saat app berjalan sebagai container Compose.
```

**Cara menangani "MinIO is not configured" atau connection refused:**
```bash
# 1. Pastikan minio sehat
docker compose ps

# 2. Pastikan MINIO_ENDPOINT/MINIO_PORT/MINIO_ACCESS_KEY/MINIO_SECRET_KEY
#    terisi benar di environment container app
docker compose exec app printenv | grep MINIO

# 3. Pastikan app dan minio berada di network Compose yang sama
#    (default: benar selama satu docker-compose.yml, tidak perlu diubah manual)
```

---

## 6. Persiapan VPS dari Nol

### Checklist Persiapan VPS

> [!NOTE]
> Perintah di bawah menggunakan contoh Ubuntu/Debian. Sesuaikan dengan OS VPS yang dipilih oleh tim Unpad.

**Operating System:**
- [ ] OS yang didukung: Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9 (atau yang ditentukan tim Unpad)
- [ ] Update package: `sudo apt update && sudo apt upgrade -y` (Ubuntu/Debian)

**Timezone:**
- [ ] Set timezone: `sudo timedatectl set-timezone Asia/Jakarta`

**User Non-Root:**
- [ ] Buat user non-root: `sudo adduser <USERNAME_VPS>`
- [ ] Tambahkan ke grup docker: `sudo usermod -aG docker <USERNAME_VPS>`
- [ ] Nonaktifkan atau batasi root login SSH

**SSH Key:**
- [ ] Upload SSH public key ke VPS
- [ ] Nonaktifkan password authentication SSH: edit `/etc/ssh/sshd_config`, set `PasswordAuthentication no`
- [ ] Restart SSH: `sudo systemctl restart ssh`

**Firewall (UFW - contoh Ubuntu):**
- [ ] Install dan aktifkan UFW: `sudo apt install ufw && sudo ufw enable`
- [ ] Izinkan SSH: `sudo ufw allow ssh`
- [ ] Izinkan HTTP/HTTPS: `sudo ufw allow 80 && sudo ufw allow 443`
- [ ] **Blokir port 13306** (database tidak boleh terekspos publik di production)
- [ ] **Blokir port 8081** (Adminer tidak boleh terekspos publik di production)
- [ ] Review aturan: `sudo ufw status verbose`

**Fail2ban (disarankan):**
- [ ] Install fail2ban: `sudo apt install fail2ban`
- [ ] Aktifkan proteksi SSH

**Docker Engine:**
- [ ] Install Docker Engine (ikuti panduan resmi Docker untuk OS yang digunakan)
- [ ] Verifikasi: `docker --version`
- [ ] Aktifkan service: `sudo systemctl enable --now docker`

**Docker Compose Plugin:**
- [ ] Pastikan Docker Compose plugin tersedia: `docker compose version`

**Git:**
- [ ] Install Git: `sudo apt install git`
- [ ] Clone repository ke VPS: `git clone <REPO_URL> /opt/ult-fmipa/`

**Direktori Aplikasi dan Backup:**
- [ ] `mkdir -p /opt/ult-fmipa/` - direktori aplikasi (atau sesuai pilihan tim)
- [ ] `mkdir -p /srv/backups/` - direktori backup

**Log Rotation:**
- [ ] Konfigurasi logrotate untuk Docker container logs
- [ ] Verifikasi `/etc/logrotate.d/` atau gunakan `--log-opt max-size=50m --log-opt max-file=5` di Compose

**Disk Monitoring:**
- [ ] Pasang alert disk usage - minimal peringatan pada 80% penggunaan

---

## 7. Environment Production

> [!CAUTION]
> File `.env` production **tidak boleh di-commit ke Git**. File ini sudah terdaftar di `.gitignore`. Simpan di server dengan permission `600`:
> ```bash
> chmod 600 /opt/ult-fmipa/.env
> ```

### Tabel Environment Variable

| Variable | Wajib | Fungsi | Contoh Aman | Sumber Nilai | Masuk Git? | Beda Staging/Prod? |
|---|---|---|---|---|---|---|
| `NODE_ENV` | Ya | Mode runtime Next.js | `production` | Developer | Tidak (via Compose) | Tidak |
| `DATABASE_URL` | Ya | Koneksi MariaDB untuk Prisma | `mysql://ult_user:<PASS>@db:3306/fmipa_sbpk` | Tim infra | **Tidak** | Ya (nama user/pass/host) |
| `DB_HOST` | Ya | Host database untuk script migration | `db` | `docker-compose.yml` | Tidak | Ya (jika nama container berbeda) |
| `DB_PORT` | Ya | Port database | `3306` | `docker-compose.yml` | Tidak | Tidak |
| `DB_USER` | Ya | Username database | `ult_user` | Tim infra | **Tidak** | Ya |
| `DB_PASSWORD` | Ya | Password database | `<generate-kuat>` | Tim infra | **Tidak** | Ya |
| `DB_NAME` | Ya | Nama database | `fmipa_sbpk` | Tim infra | **Tidak** | Ya (nama berbeda per env) |
| `NEXTAUTH_URL` | Ya | URL publik aplikasi (harus HTTPS di prod) | `https://<DOMAIN_PRODUCTION>` | Tim infra | **Tidak** | **Ya** |
| `NEXTAUTH_SECRET` | Ya | Secret untuk JWT/session NextAuth | `<generate-random-64-chars>` | Generate: `openssl rand -base64 48` | **Tidak** | **Ya (harus berbeda)** |
| `MINIO_ENDPOINT` | Ya | Hostname MinIO tanpa scheme | `minio` (Compose) | `docker-compose.yml` | Tidak | Tidak (nama service tetap sama) |
| `MINIO_PORT` | Ya | Port API MinIO | `9000` | `docker-compose.yml` | Tidak | Tidak |
| `MINIO_USE_SSL` | Ya | `"true"`/`"false"` | `false` (internal Compose network) | `docker-compose.yml` | Tidak | Tidak |
| `MINIO_ACCESS_KEY` | Ya | Access key MinIO | `<generate-unik>` | Tim infra | **Tidak** | **Ya (harus berbeda)** |
| `MINIO_SECRET_KEY` | Ya | Secret key MinIO | `<generate-unik-kuat>` | Tim infra | **Tidak** | **Ya (harus berbeda)** |
| `MINIO_BUCKET` | Ya | Nama bucket privat | `ult-fmipa` | `docker-compose.yml` | Tidak | Boleh sama, atau dipisah per env jika berbagi instance MinIO |
| `MAX_UPLOAD_SIZE_MB` | Tidak | Override batas ukuran upload (1–50 MB) | `10` | Developer/infra | Tidak (via .env) | Tidak |
| `DB_ADMIN_ACCESS_CODES` | Tidak | Kode akses legacy yang diperlakukan sebagai ADMIN | `SUPER_USER` | Tim Unpad | Tidak | Tidak |
| `DB_STAFF_ACCESS_CODES` | Tidak | Kode akses legacy yang diperlakukan sebagai STAFF | `ADMIN,OPERATOR,KRS,PIMPINAN` | Tim Unpad | Tidak | Tidak |
| `PAUS_MODE` | Ya | Mode PAUS: `modern` atau `legacy` | `modern` | Tim Unpad | Tidak | Tidak |
| `PAUS_CLIENT_ID` | Ya (prod) | OAuth Client ID dari PAUS Unpad | `<dari PAUS Unpad>` | Tim PAUS Unpad | **Tidak** | **Ya** |
| `PAUS_CLIENT_SECRET` | Ya (prod) | OAuth Client Secret dari PAUS Unpad | `<dari PAUS Unpad>` | Tim PAUS Unpad | **Tidak** | **Ya** |
| `PAUS_AUTHORIZATION_URL` | Tidak | URL otorisasi PAUS | `https://paus.unpad.ac.id/oauth` | `.env.example` | Tidak | Tidak |
| `PAUS_TOKEN_URL` | Tidak | URL token PAUS | `https://paus.unpad.ac.id/oauth/access-token` | `.env.example` | Tidak | Tidak |
| `PAUS_USERINFO_URL` | Tidak | URL userinfo PAUS | `https://paus.unpad.ac.id/api/` | `.env.example` | Tidak | Tidak |
| `PAUS_SIGN_OUT_URL` | Tidak | URL logout global PAUS | `https://paus.unpad.ac.id/oauth/sign-out` | `.env.example` | Tidak | Tidak |
| `PAUS_LEGACY_LOGIN_URL` | Tidak | URL login legacy PAUS (jika mode legacy) | Kosongkan jika modern | Tim PAUS Unpad | **Tidak** | Ya |
| `PAUS_BRIDGE_SECRET` | Ya | Secret untuk token bridge PAUS (HMAC-SHA256) | `<generate-random-48-chars>` | Generate: `openssl rand -base64 36` | **Tidak** | **Ya (harus berbeda)** |
| `PAUS_BRIDGE_TOKEN_TTL_SECONDS` | Tidak | TTL token bridge PAUS | `120` | Developer | Tidak | Tidak |
| `DEV_ADMIN_EMAIL` | Dev only | Email admin development | Kosongkan di production | Developer | **Tidak** | - |
| `DEV_ADMIN_PASSWORD` | Dev only | Password admin development | Kosongkan di production | Developer | **Tidak** | - |
| `DEV_STAFF_EMAIL` | Dev only | Email staff development | Kosongkan di production | Developer | **Tidak** | - |
| `DEV_STAFF_PASSWORD` | Dev only | Password staff development | Kosongkan di production | Developer | **Tidak** | - |
| `DEV_STUDENT_EMAIL` | Dev only | Email mahasiswa development | Kosongkan di production | Developer | **Tidak** | - |
| `DEV_STUDENT_PASSWORD` | Dev only | Password mahasiswa development | Kosongkan di production | Developer | **Tidak** | - |
| `DEV_STUDENT_NAME` | Dev only | Nama mahasiswa development | Kosongkan | Developer | Tidak | - |
| `DEV_STUDENT_NPM` | Dev only | NPM mahasiswa development | Kosongkan | Developer | **Tidak** | - |

> [!IMPORTANT]
> Di production, variabel `DEV_*` (admin, staff, student) **boleh dikosongkan atau dihapus dari .env production**. Provider `CredentialsProvider` untuk development login tetap ada di kode tetapi tidak dapat digunakan jika variabelnya kosong.

### Cara Menghasilkan Secret yang Aman

```bash
# NEXTAUTH_SECRET (minimal 32 karakter, disarankan 48+)
openssl rand -base64 48

# PAUS_BRIDGE_SECRET
openssl rand -base64 36
```

---

## 8. Setup Database MariaDB

### Konfigurasi Database Aktual

Berdasarkan `docker-compose.yml`:
- **Service name**: `db`
- **Container name**: `ult-fmipa-db`
- **Image**: `mariadb:11`
- **Database name**: `fmipa_sbpk`
- **User**: `ult_user`
- **Named volume**: `ult_fmipa_db_data`
- **Root password**: dikontrol via `MYSQL_ROOT_PASSWORD` environment
- **Port host (non-production)**: `13306`

### Dua Jalur Migration

Project menggunakan **dua jalur migration yang berbeda**:

#### Jalur 1 - Import SQL Baseline (Skema Legacy)

File: `prisma/migrations/fmipa_sbpk.sql` (26 MB - dump database legacy)

```bash
# Jalankan di dalam container database untuk initial setup dari database kosong
docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < prisma/migrations/fmipa_sbpk.sql
```

> [!IMPORTANT]
> Ini adalah langkah **sekali** untuk initial setup dari database kosong. Jangan jalankan ulang jika data sudah ada.

#### Jalur 2 - Support Migrations (Custom SQL)

Script: `pnpm db:support-migrate` → `scripts/run-support-migrations.mjs`  
Folder: `database/migrations/` (file SQL bernomor urut 001–009)

```bash
docker compose exec app pnpm db:support-migrate
```

> [!WARNING]
> `run-support-migrations.mjs` **tidak memiliki mekanisme idempotency** - script membaca dan menjalankan file SQL satu per satu tanpa mencatat apakah sudah pernah dijalankan. Pastikan SQL di folder `database/migrations/` menggunakan `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, atau guard yang setara agar aman dijalankan berulang.

#### Jalur 3 - Prisma Migrations (Fitur Baru)

Script: `pnpm db:prisma-migrate` → `scripts/deploy-prisma-migrations.mjs`  
Folder: `prisma/migrations/` (direktori bernomor timestamp)

```bash
docker compose exec app pnpm db:prisma-migrate
```

Script ini **memiliki idempotency** - memeriksa tabel `_prisma_migrations` sebelum menjalankan migration.

> [!NOTE]
> **Jangan gunakan** `prisma migrate dev`, `prisma migrate reset`, atau `prisma db push` di production. Gunakan hanya `pnpm db:prisma-migrate`.

---

### Urutan Setup Database yang Aman

**A. Database Kosong (Initial Setup)**

```bash
# 1. Pastikan container database berjalan dan sehat
docker compose up -d db
sleep 10
docker compose exec db mysqladmin -u root -p"$MYSQL_ROOT_PASSWORD" status

# 2. Import SQL baseline (HANYA SEKALI untuk database kosong)
docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < prisma/migrations/fmipa_sbpk.sql

# 3. Jalankan support migrations
docker compose exec app pnpm db:support-migrate

# 4. Jalankan Prisma migrations
docker compose exec app pnpm db:prisma-migrate

# 5. Jalankan aplikasi
docker compose up -d app

# 6. Verifikasi health check
curl http://localhost:3000/api/health
```

**B. Migration Setelah Aplikasi Sudah Live (Update)**

```bash
# 1. Backup database TERLEBIH DAHULU
docker compose exec -T db sh -c 'exec mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  > /srv/backups/db_before_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Hentikan aplikasi (opsional, tergantung sifat migration)
docker compose stop app

# 3. Jalankan support migrations (jika ada file baru)
docker compose exec app pnpm db:support-migrate

# 4. Jalankan Prisma migrations (jika ada migration baru)
docker compose exec app pnpm db:prisma-migrate

# 5. Jalankan aplikasi kembali
docker compose start app

# 6. Verifikasi
curl http://localhost:3000/api/health
```

**C. Rollback Jika Migration Gagal**

```bash
# 1. Hentikan aplikasi
docker compose stop app

# 2. Restore database dari backup
docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < /srv/backups/db_before_migration_YYYYMMDD_HHMMSS.sql

# 3. Rollback image aplikasi ke versi sebelumnya (lihat bagian 17)
# 4. Jalankan aplikasi
docker compose start app
```

> [!CAUTION]
> **Jangan jalankan** `prisma migrate dev`, `prisma migrate reset`, atau `prisma db push` di production. Ketiganya dapat merusak atau menghapus data.

---

## 9. Setup PAUS SSO

### Arsitektur PAUS yang Digunakan

Berdasarkan `src/lib/auth.ts`:

**Dua mode PAUS tersedia:**

| Mode | Keterangan | Aktif Jika |
|---|---|---|
| `modern` | OAuth 2.0 penuh dengan provider `paus` via NextAuth | `PAUS_MODE=modern` DAN `PAUS_CLIENT_ID` + `PAUS_CLIENT_SECRET` tersedia |
| `legacy` | Redirect ke URL login PAUS eksternal | `PAUS_MODE=legacy` dan `PAUS_LEGACY_LOGIN_URL` tersedia |
| Bridge | Token HMAC dari sistem PAUS ke NextAuth | Selalu aktif - digunakan oleh rute `/auth/paus-bridge` |

**Prioritas resolusi login:**
1. PAUS OAuth modern (jika `PAUS_CLIENT_ID` dan `PAUS_CLIENT_SECRET` tersedia)
2. PAUS Bridge (token dari sistem luar)
3. Database credentials (legacy admin/staff via `data_users`)
4. Dev credentials (hanya aktif jika variabel `DEV_*` terisi)

### Endpoint PAUS Aktual (dari source code)

| Endpoint | URL Default (dari .env.example/auth.ts) |
|---|---|
| Authorization | `https://paus.unpad.ac.id/oauth` |
| Token | `https://paus.unpad.ac.id/oauth/access-token` |
| Userinfo | `https://paus.unpad.ac.id/api/` |
| Sign-out | `https://paus.unpad.ac.id/oauth/sign-out` |
| Callback NextAuth (aplikasi) | `<NEXTAUTH_URL>/api/auth/callback/paus` |
| Sign-in page (aplikasi) | `/login` |

### Callback URL yang Harus Didaftarkan ke PAUS

```
# Staging:
https://<DOMAIN_STAGING>/api/auth/callback/paus

# Production:
https://<DOMAIN_PRODUCTION>/api/auth/callback/paus
```

> [!IMPORTANT]
> Redirect URI ini **harus terdaftar persis** di sistem PAUS Unpad. Perbedaan satu karakter pun akan menyebabkan semua login PAUS gagal dengan error `invalid_client` atau `redirect_uri_mismatch`.

### Pemetaan Profil PAUS ke Role Aplikasi

Berdasarkan `src/lib/paus-profile.ts`:

| Atribut PAUS | Field Sesi | Keterangan |
|---|---|---|
| `attributes.nama` | `user.name` | Nama lengkap |
| `attributes.npm` | `user.npm` | NPM mahasiswa |
| `attributes.nip` | `user.nip` | NIP staf/dosen |
| `attributes.paus_id` | `user.pausId` | ID PAUS |
| `email` | `user.email` | Email pengguna |
| `sub` / `id` | `user.id` | Identifier fallback |

**Logika resolusi role:**
```typescript
role: npm ? "MAHASISWA" : nip ? "STAFF" : "MAHASISWA"
```

> [!WARNING]
> Jika atribut PAUS tidak mengirimkan `npm` maupun `nip`, pengguna otomatis ditetapkan sebagai `MAHASISWA`. Konfirmasi ke tim PAUS apakah atribut ini selalu tersedia untuk semua tipe pengguna.

### Scope PAUS

Dari kode `src/lib/auth.ts`:
```
scope: "user.basic"
```

### Token Request Method

```
token_endpoint_auth_method: "client_secret_post"
```

### Checklist Koordinasi dengan Tim PAUS/Unpad

**Informasi yang harus diperoleh dari tim PAUS:**

- [ ] Client ID untuk staging
- [ ] Client Secret untuk staging
- [ ] Client ID untuk production
- [ ] Client Secret untuk production
- [ ] Redirect URI staging yang sudah didaftarkan: `https://<DOMAIN_STAGING>/api/auth/callback/paus`
- [ ] Redirect URI production yang sudah didaftarkan: `https://<DOMAIN_PRODUCTION>/api/auth/callback/paus`
- [ ] Logout redirect URI jika diperlukan
- [ ] Scope yang diizinkan (`user.basic`)
- [ ] Atribut yang dikirimkan: apakah `npm`, `nip`, `nama`, `paus_id` selalu tersedia?
- [ ] Apakah HTTPS wajib untuk redirect URI? (Ya - harus HTTPS untuk production)
- [ ] Apakah IP VPS perlu di-whitelist?
- [ ] Akun uji: minimal 1 akun mahasiswa dan 1 akun staf untuk testing
- [ ] Masa berlaku access token
- [ ] Timeout sesi

### Cara Pengujian PAUS di Staging

1. **Login mahasiswa valid** → Harusnya masuk ke `/mahasiswa/riwayat`
2. **Login staf valid** → Harusnya masuk ke `/staff/dashboard`
3. **Logout** → Sesi hilang, redirect ke `/login`
4. **User belum terdaftar di database** → Konfirmasi perilaku yang diharapkan (masih bisa login atau ditolak?)
5. **Token expired** → Session harus invalid, redirect ke login
6. **Session setelah restart container** → Session berbasis JWT disimpan di cookie, harus tetap valid
7. **Callback di balik reverse proxy** → `NEXTAUTH_URL` harus sudah disetel ke domain HTTPS
8. **Cookie secure pada HTTPS** → Verifikasi dengan browser DevTools → Application → Cookies

### Bagian Khusus: PAUS Belum Siap Saat Go-Live

Jika PAUS belum siap saat jadwal go-live tiba:

- **Jangan buka website ke publik** sebelum PAUS berfungsi - mahasiswa tidak akan bisa login.
- **Admin/staf masih dapat login** via database credentials (`data_users` tabel) selama tabel dan user tersebut ada dan terisi.
- **Jangan membuat bypass authentication baru** - ini menciptakan risiko keamanan.
- **Jangan menaruh credential dummy di production.**
- **Tunda go-live** sampai PAUS siap - ini lebih aman daripada membuka website setengah jadi.

---

## 10. Domain, DNS, HTTPS, dan Reverse Proxy

### Kebutuhan Infrastruktur

| Komponen | Kebutuhan | Keterangan |
|---|---|---|
| Domain production | `<DOMAIN_PRODUCTION>` | Ditentukan tim Unpad |
| Domain staging | `<DOMAIN_STAGING>` | Subdomain atau domain terpisah |
| DNS A record | IP VPS | Arahkan domain ke IP VPS |
| Reverse proxy | Nginx atau Caddy | Tidak ada konfigurasi di repository - perlu dibuat |
| TLS certificate | Let's Encrypt | Gratis via Certbot atau Caddy otomatis |
| Port publik | 80 (HTTP redirect), 443 (HTTPS) | |
| Port internal aplikasi | 3000 | Tidak boleh terekspos langsung ke publik |

### Nginx - Konfigurasi Konseptual (Belum Final)

> [!NOTE]
> Repository **tidak menyertakan konfigurasi Nginx**. Contoh berikut adalah panduan konseptual - tim infra harus menyesuaikan sesuai kondisi VPS.

```nginx
# /etc/nginx/sites-available/ult-fmipa
server {
    listen 80;
    server_name <DOMAIN_PRODUCTION>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name <DOMAIN_PRODUCTION>;

    ssl_certificate /etc/letsencrypt/live/<DOMAIN_PRODUCTION>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<DOMAIN_PRODUCTION>/privkey.pem;

    # Batas upload - sesuaikan dengan MAX_UPLOAD_SIZE_MB (default 10 MB + buffer)
    client_max_body_size 12m;

    # Timeout untuk upload PDF besar
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Header wajib untuk Next.js dan NextAuth
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket (jika diperlukan Hot Reload - tidak untuk production)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### Dampak Reverse Proxy terhadap Komponen Aplikasi

| Komponen | Dampak | Keterangan |
|---|---|---|
| NextAuth callback | `NEXTAUTH_URL` harus URL HTTPS lengkap | `https://<DOMAIN>/api/auth/callback/paus` |
| Secure cookies | Hanya aktif jika `NEXTAUTH_URL` menggunakan HTTPS | Pastikan reverse proxy meneruskan `X-Forwarded-Proto: https` |
| Rate limiter | Membaca `X-Forwarded-For` dari request | Nginx **wajib** menimpa header ini agar tidak bisa di-spoof oleh client |
| URL PDF | Link di halaman menggunakan URL relatif - aman | |
| PAUS redirect URI | Harus cocok dengan URL HTTPS domain | |

### Konfigurasi Upload di Kubernetes (Referensi Existing)

File `k8s/07-ingress.yaml` memiliki:
```yaml
nginx.ingress.kubernetes.io/proxy-body-size: "8m"
```

Untuk VPS dengan Nginx biasa, gunakan `client_max_body_size 12m` (sedikit lebih besar dari batas upload 10 MB untuk buffer header).

---

## 11. Docker Production Deployment

### Flow Deployment Lengkap

#### Referensi Komponen Docker

| Komponen | Nilai Aktual |
|---|---|
| Service aplikasi | `app` |
| Service database | `db` |
| Service adminer | `adminer` |
| Container aplikasi | `ult-fmipa-app` |
| Container database | `ult-fmipa-db` |
| Container adminer | `ult-fmipa-adminer` |
| Named volume database | `ult_fmipa_db_data` |
| Port aplikasi | `3000` |
| Port database host | `13306` |
| Port adminer host | `8081` |

#### Langkah 1 - Clone atau Pull Repository

```bash
# Clone (initial)
git clone <REPO_URL> /opt/ult-fmipa/
cd /opt/ult-fmipa/

# Pull update (redeploy)
git pull origin main
git checkout <TAG_ATAU_COMMIT>
```

#### Langkah 2 - Siapkan Environment

```bash
cp .env.example .env
# Edit .env dengan nilai production
nano .env
chmod 600 .env
```

#### Langkah 3 - Siapkan Credential MinIO

Tidak ada direktori host yang perlu dibuat - storage sekarang ditangani
sepenuhnya oleh service `minio` (lihat bagian 4-5). Pastikan `.env` sudah
berisi `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` production yang unik sebelum
lanjut ke langkah berikutnya.

#### Langkah 4 - Siapkan Database

```bash
docker compose up -d db
sleep 15
docker compose exec db mysqladmin -u root -p"${MYSQL_ROOT_PASSWORD}" status
```

#### Langkah 5 - Build Image

```bash
docker compose build
```

#### Langkah 6 - Jalankan Migration

```bash
# Initial setup (database kosong):
docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < prisma/migrations/fmipa_sbpk.sql

# Selalu jalankan ini (idempotent):
docker compose exec app pnpm db:support-migrate
docker compose exec app pnpm db:prisma-migrate
```

#### Langkah 7 - Start Semua Services

```bash
docker compose up -d
```

#### Langkah 8 - Periksa Logs

```bash
docker compose logs -f app
docker compose logs -f db
```

#### Langkah 9 - Health Check

```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","message":"Database connected",...}
```

#### Langkah 10 - Storage Audit

```bash
docker compose exec app pnpm storage:audit -- --strict
# Expected: Integrity Status: CLEAN
```

---

### Perbedaan Perintah Docker Compose

| Perintah | Efek | Aman di Production? |
|---|---|---|
| `docker compose restart` | Restart container tanpa rebuild | ✅ Ya - data aman |
| `docker compose up -d` | Start/update container tanpa rebuild | ✅ Ya - data aman |
| `docker compose up -d --build` | Rebuild image lalu update container | ✅ Ya - data aman (named volume database + MinIO tetap) |
| `docker compose stop` | Hentikan container, data aman | ✅ Ya |
| `docker compose down` | Hentikan dan hapus container, **volume aman** | ✅ Ya - data aman |
| `docker compose down -v` | Hentikan, hapus container, **dan hapus named volume** | ❌ **BERBAHAYA** - database hilang |
| `docker compose down --rmi all` | Hapus container dan semua image | ⚠️ Hati-hati - image lama hilang |

> [!CAUTION]
> **JANGAN PERNAH jalankan `docker compose down -v` di production tanpa backup yang sudah diverifikasi.** Perintah ini menghapus volume database `ult_fmipa_db_data` secara permanen.

---

## 12. Staging Deployment Step-by-Step

### Prasyarat

- VPS tersedia (bisa VPS production atau terpisah - lihat Bagian 3)
- Domain staging: `<DOMAIN_STAGING>`
- PAUS redirect URI staging sudah didaftarkan

### Langkah

1. **Setup VPS** - ikuti Bagian 6
2. **Clone repository** ke `/opt/ult-fmipa-staging/`
3. **Buat `.env` staging** (lihat Bagian 7) - gunakan nilai yang berbeda dari production
4. **Buat storage direktori staging** (path berbeda dari production!)
   ```bash
   # dst...
   ```
5. **Set COMPOSE_PROJECT_NAME** di `.env`:
   ```
   COMPOSE_PROJECT_NAME=ult-fmipa-staging
   ```
6. **Set port berbeda** jika berbagi VPS dengan production - sesuaikan `ports` di `docker-compose.yml` atau gunakan override file.
7. **Jalankan migration** (ikuti urutan di Bagian 8)
8. **Setup reverse proxy** untuk `<DOMAIN_STAGING>` → port staging
9. **Setup HTTPS** untuk `<DOMAIN_STAGING>`
10. **Uji PAUS login** dengan akun uji mahasiswa dan staf
11. **Uji upload file** - pastikan file tersimpan di storage staging
12. **Restart container** - verifikasi file masih ada
13. **Rebuild container** - verifikasi file masih ada
14. **Jalankan `pnpm storage:audit -- --strict`** - harus CLEAN
15. **Backup pertama** - pastikan prosedur backup berjalan
16. **Uji restore** dari backup - restore ke environment terpisah dan verifikasi

---

### Checklist Staging Go/No-Go

- [ ] PAUS login mahasiswa berhasil
- [ ] PAUS login staf berhasil
- [ ] Upload file PDF berhasil
- [ ] Upload file palsu (spoof MIME) ditolak
- [ ] File dapat diakses oleh yang berhak
- [ ] File **tidak** dapat diakses oleh yang tidak berhak
- [ ] PDF surat dapat dicetak (untuk layanan yang mendukung)
- [ ] Restart container - file upload masih ada
- [ ] Rebuild container - file upload masih ada
- [ ] `pnpm storage:audit -- --strict` exit code 0 dengan Integrity Status: CLEAN
- [ ] Health check `/api/health` mengembalikan `{"status":"ok"}`
- [ ] HTTPS berjalan dengan sertifikat valid
- [ ] Cookie session valid di HTTPS
- [ ] Logout berfungsi
- [ ] Admin bisa melihat semua pengajuan
- [ ] Staff bisa melihat pengajuan
- [ ] Mahasiswa hanya bisa melihat pengajuan miliknya

---

## 13. Production Deployment Step-by-Step

### Sebelum Hari Deployment

- [ ] Semua credential production tersedia (PAUS, database, NEXTAUTH_SECRET, PAUS_BRIDGE_SECRET)
- [ ] Domain production terdaftar di DNS dan mengarah ke IP VPS
- [ ] TLS certificate sudah disiapkan (Let's Encrypt atau lainnya)
- [ ] Reverse proxy sudah dikonfigurasi dan diuji
- [ ] PAUS redirect URI production sudah terdaftar
- [ ] Credential MinIO production (`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`) sudah unik dan `pnpm storage:audit -- --strict` clean
- [ ] Backup prosedur sudah diuji di staging
- [ ] Image/tag deployment sudah ditetapkan
- [ ] Rollback plan tersedia (image versi sebelumnya, backup database)
- [ ] PIC deployment dan standby telah ditetapkan
- [ ] Maintenance window dikomunikasikan ke stakeholder

### Saat Deployment

```bash
# 1. Aktifkan maintenance (opsional - batasi akses)
# 2. Backup database sebelum deploy
docker compose exec -T db sh -c 'exec mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  > /srv/backups/db_pre_deploy_$(date +%Y%m%d_%H%M%S).sql

# 3. Pull atau build image baru
git pull && docker compose build

# 4. Jalankan migration
docker compose exec app pnpm db:support-migrate
docker compose exec app pnpm db:prisma-migrate

# 5. Deploy
docker compose up -d

# 6. Periksa logs
docker compose logs --tail=100 app

# 7. Health check
curl https://<DOMAIN_PRODUCTION>/api/health

# 8. Storage audit
docker compose exec app pnpm storage:audit -- --strict

# 9. Smoke test (lihat Bagian 14)
# 10. PAUS test dengan akun uji
# 11. Upload test
# 12. Role test (admin, staff, mahasiswa)
```

### Setelah Deployment

- [ ] Monitoring log aktif (periksa error 5xx)
- [ ] Storage audit bersih
- [ ] Backup pertama pasca-deployment dibuat
- [ ] Cek kapasitas disk
- [ ] Konfirmasi ke pengguna utama (admin/staf)
- [ ] Dokumentasikan versi/commit yang di-deploy
- [ ] Tutup maintenance window
- [ ] Observasi minimal 2–4 jam pertama

---

## 14. Smoke Test Wajib

| No | Skenario | Role | Langkah | Expected Result | Severity Jika Gagal |
|---|---|---|---|---|---|
| 1 | Halaman utama terbuka | Publik | Buka `https://<DOMAIN>` | Halaman tampil, tidak ada error 500 | Critical |
| 2 | Login PAUS - mahasiswa | Mahasiswa | Klik Login PAUS, autentikasi | Berhasil masuk, redirect ke riwayat | Critical |
| 3 | Login PAUS - staf | Staf | Klik Login PAUS, autentikasi | Berhasil masuk, redirect ke staff dashboard | Critical |
| 4 | Login PAUS - admin | Admin | Login via credentials atau PAUS | Berhasil masuk, redirect ke admin dashboard | Critical |
| 5 | Logout | Semua | Klik logout | Sesi berakhir, redirect ke `/login` | Critical |
| 6 | Mahasiswa buat pengajuan | Mahasiswa | Pilih layanan, isi form, submit | Pengajuan tersimpan | Critical |
| 7 | Upload PDF valid | Mahasiswa | Upload file PDF ≤ batas size | File diterima dan tersimpan | Critical |
| 8 | Upload file palsu | Mahasiswa | Upload file `.pdf` yang isinya bukan PDF | Ditolak dengan pesan error | High |
| 9 | Mahasiswa buka file sendiri | Mahasiswa | Buka attachment pengajuan sendiri | File dapat dibuka | Critical |
| 10 | Mahasiswa coba file user lain | Mahasiswa | Akses URL attachment user lain secara langsung | Response 403 Forbidden | Critical |
| 11 | Staff buka request | Staff | Masuk ke `/staff/requests`, buka detail | Data tampil, attachment dapat dibuka | High |
| 12 | Admin buka request | Admin | Masuk ke `/admin/requests`, buka detail | Data tampil, attachment dapat dibuka | High |
| 13 | PDF surat di-preview | Admin/Staff | Klik Cetak Surat pada pengajuan yang datanya lengkap | PDF terbuka di tab baru | High |
| 14 | Download CSV | Admin | Ekspor data pengajuan | File CSV terunduh | Medium |
| 15 | Survei | Mahasiswa | Isi survei kepuasan | Survei tersimpan | Medium |
| 16 | Usulan layanan | Mahasiswa | Submit usulan layanan baru | Usulan tersimpan | Medium |
| 17 | Restart container - file masih ada | Admin | `docker compose restart app`, lalu buka file upload | File masih dapat diakses | Critical |
| 18 | Rebuild container - file masih ada | Admin/Infra | `docker compose up -d --build`, lalu buka file upload | File masih dapat diakses | Critical |
| 19 | Database persistence | Admin | Restart db, cek data pengajuan masih ada | Data intact | Critical |
| 20 | Storage audit strict | Infra | `docker compose exec app pnpm storage:audit -- --strict` | Exit code 0, Integrity Status: CLEAN | Critical |
| 21 | HTTPS valid | Publik | Buka URL dengan HTTPS | Sertifikat valid, tidak ada warning browser | Critical |
| 22 | HTTP redirect ke HTTPS | Publik | Buka URL dengan HTTP | Otomatis redirect ke HTTPS | High |
| 23 | Halaman error (404) | Publik | Buka URL yang tidak ada | Halaman 404 Next.js tampil | Low |
| 24 | Responsive mobile | Mahasiswa | Buka di browser mobile 375px | Layout tidak rusak, tombol dapat diklik | Medium |
| 25 | Health check endpoint | Infra | `curl https://<DOMAIN>/api/health` | `{"status":"ok","message":"Database connected"}` | Critical |

---

## 15. Backup dan Restore

> Dokumen ini mengacu dan memperluas `docs/vps-deployment-backup.md` yang sudah ada di repository.

### Backup MariaDB

```bash
docker compose exec -T db sh -c 'exec mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  > /srv/backups/db_$(date +%Y%m%d_%H%M%S).sql
```

### Backup Object MinIO

```bash
docker run --rm --network <compose-network-name> \
  -e MC_HOST_local="http://<MINIO_ACCESS_KEY>:<MINIO_SECRET_KEY>@minio:9000" \
  -v /srv/backups/minio_$(date +%Y%m%d_%H%M%S):/backup \
  minio/mc mirror local/<MINIO_BUCKET> /backup
```

Ganti `<compose-network-name>`, `<MINIO_ACCESS_KEY>`, `<MINIO_SECRET_KEY>`,
dan `<MINIO_BUCKET>` dengan nilai environment VPS aktual - jangan menuliskan
credential asli ke dalam script yang di-commit. Detail lengkap:
[`docs/vps-deployment-backup.md`](./vps-deployment-backup.md) § 4.

### Penamaan File Backup

Format: `db_YYYYMMDD_HHMMSS.sql` dan direktori `minio_YYYYMMDD_HHMMSS/`

### Retention dan Lokasi

- **Lokasi local**: `/srv/backups/`
- **Retention disarankan**: Minimal 7 hari daily backup, 4 minggu weekly backup
- **Off-server backup**: Sangat direkomendasikan - kirim ke cloud storage atau server backup Unpad. Detail bergantung pada infrastruktur Unpad.
- **Enkripsi backup**: Direkomendasikan jika backup berisi data sensitif - implementasi bergantung keputusan tim infra.

### Jadwal Backup (Rekomendasi)

```bash
# Crontab entry - backup harian jam 02:00. Repository ini tidak
# menyertakan script wrapper backup siap pakai; buat script host sendiri
# yang menjalankan kedua command berikut secara berurutan (backup DB, lalu
# `mc mirror` MinIO - lihat docs/vps-deployment-backup.md § 4 untuk contoh
# lengkap perintah `mc mirror`), lalu daftarkan script itu di crontab:
0 2 * * * /opt/ult-fmipa/scripts/backup-daily.sh   # <- buat script ini sendiri, belum ada di repo
```

### Prosedur Backup Atomic (Menjaga Konsistensi DB-Storage)

Backup database dan storage yang dijalankan terpisah **tidak atomic**. Untuk menjaga konsistensi:

1. Batasi atau hentikan traffic upload sementara (opsional - tergantung risk tolerance)
2. Backup database terlebih dahulu
3. Backup storage segera setelah database
4. Aktifkan kembali traffic normal
5. Jalankan storage audit untuk verifikasi

### Prosedur Restore

> [!CAUTION]
> **Jangan restore di production tanpa maintenance window dan persetujuan yang jelas.** Data baru yang masuk setelah backup akan hilang jika restore dilakukan.

```bash
# 1. Backup kondisi current sebelum restore
docker compose exec -T db sh -c 'exec mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  > /srv/backups/db_before_restore_$(date +%Y%m%d_%H%M%S).sql

# 2. Restore database
docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < /srv/backups/db_YYYYMMDD_HHMMSS.sql

# 3. Restore object MinIO dari backup (lihat docs/vps-deployment-backup.md § 5)
docker run --rm --network <compose-network-name> \
  -e MC_HOST_local="http://<MINIO_ACCESS_KEY>:<MINIO_SECRET_KEY>@minio:9000" \
  -v /srv/backups/minio_YYYYMMDD_HHMMSS:/backup \
  minio/mc mirror /backup local/<MINIO_BUCKET>

# 4. Verifikasi integritas
docker compose exec app pnpm storage:audit -- --strict
```

---

## 16. Monitoring dan Operasional

### Monitoring Wajib Sebelum Production

| Jenis Monitor | Cara | Tool Minimal |
|---|---|---|
| Container health | `docker compose ps` | Docker built-in |
| Health check endpoint | Cron: `curl https://<DOMAIN>/api/health` | curl + cron |
| Disk usage | `df -h /srv/ult-fmipa/` | cron + alert |
| Docker logs | `docker compose logs --tail=100 app` | Docker logs |
| Backup age | Cek timestamp file di `/srv/backups/` | Shell script |

### Monitoring Disarankan

| Jenis Monitor | Keterangan |
|---|---|
| CPU dan memory | `htop` atau `docker stats` |
| HTTP 5xx | Parse Nginx access log |
| MinIO bucket size | `docker compose exec minio mc du local/ult-fmipa` |
| Log rotation | Pastikan `/var/lib/docker/containers/` tidak penuh |
| Certificate expiry | `certbot renew --dry-run` atau monitoring Certbot |

### Monitoring Improvement Lanjutan

- Prometheus + Grafana untuk metrics container
- Alertmanager untuk notifikasi Slack/email
- ELK Stack atau Loki untuk log aggregation
- Uptime monitoring eksternal (UptimeRobot, BetterUptime)

---

## 17. Rollback Plan

### Rollback Application Image

```bash
# 1. Checkout commit/tag sebelumnya
git checkout <PREVIOUS_TAG>

# 2. Rebuild image versi lama
docker compose build

# 3. Restart aplikasi
docker compose up -d app

# 4. Verifikasi
curl https://<DOMAIN>/api/health
```

### Rollback Database

> [!CAUTION]
> Rollback database akan menghilangkan semua perubahan data setelah backup dibuat. Koordinasikan dengan stakeholder.

```bash
# Backup kondisi current sebelum rollback
docker compose exec -T db sh -c 'exec mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  > /srv/backups/db_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  < /srv/backups/db_YYYYMMDD_HHMMSS.sql
```

### Skenario Rollback

| Skenario | Tindakan | PIC |
|---|---|---|
| Image aplikasi gagal build | Checkout commit sebelumnya, build ulang | Developer |
| Migration gagal | Hentikan aplikasi, restore database dari backup pre-migration | Developer + Infra |
| PAUS gagal | Pastikan database credentials masih aktif, hubungi tim PAUS | Dev + Tim Unpad |
| Reverse proxy gagal | Periksa Nginx config, restart Nginx | Infra |
| MinIO tidak sehat / bucket tidak ditemukan | `docker compose logs minio minio-init`, pastikan credential MinIO cocok | Infra |
| Database connection gagal | Periksa container `db`, logs, environment `DATABASE_URL` | Infra + Developer |
| Attachment tidak bisa dibuka | Periksa storage mount, jalankan storage audit | Infra |
| Deployment menyebabkan 500 | Rollback image, periksa logs | Developer |

### Kapan Rollback Dipilih

- Health check `/api/health` terus gagal setelah 3 menit
- Error 500 pada lebih dari 10% request
- PAUS login gagal total
- Storage tidak dapat ditulis

### Siapa yang Menyetujui Rollback

PIC yang ditetapkan saat maintenance window, atau lead developer jika PIC tidak tersedia.

> [!NOTE]
> Rollback migration otomatis tidak aman kecuali migration tersebut didesain sebagai reversibel. Selalu lakukan restore database dari backup daripada mencoba "undo" migration.

---

## 18. Security Checklist

| Item | Status di Repository | Catatan |
|---|---|---|
| HTTPS wajib | ⬜ Belum divalidasi di production | Bergantung reverse proxy setup |
| Secret tidak di-Git | ✅ `.env` ada di `.gitignore` | Pastikan `.env` tidak pernah di-commit |
| NEXTAUTH_SECRET kuat | ⬜ Perlu generate saat setup | `openssl rand -base64 48` |
| Secure cookie | ⬜ Bergantung `NEXTAUTH_URL` HTTPS | Pastikan `NEXTAUTH_URL` menggunakan HTTPS |
| PAUS callback terdaftar | ⬜ Belum dilakukan | Koordinasi dengan tim PAUS |
| Storage file tidak publik | ✅ File diakses via API, bukan URL publik | Tidak ada `public/uploads/` |
| No public uploads | ✅ Upload tersimpan di bucket privat MinIO, tidak pernah di `public/` atau diakses langsung | |
| File signature validation | ✅ `detectBufferSignatureMime()` aktif | Verified di unit test |
| Upload size limit | ✅ `MAX_UPLOAD_SIZE_MB` + per-service rule | Default 5–10 MB |
| Ekstensi berbahaya diblokir | ✅ `BANNED_EXECUTABLE_EXTENSIONS` | Verified di unit test |
| Rate limiting upload | ✅ In-memory, 10 req/menit per IP | Reset saat restart - cocok single VPS |
| Reverse proxy header anti-spoof | ⬜ Belum ada Nginx config | Nginx wajib pakai `$proxy_add_x_forwarded_for` |
| Database tidak terekspos publik | ⬜ Port 13306 exposed di docker-compose.yml | **Blokir dengan firewall di production** |
| Adminer tidak terekspos publik | ⬜ Port 8081 exposed di docker-compose.yml | **Blokir dengan firewall atau hapus service adminer** |
| Firewall aktif | ⬜ Belum dikonfigurasi | UFW atau iptables |
| SSH key authentication | ⬜ Belum dikonfigurasi | Nonaktifkan password SSH |
| Permission storage 750/640 | ⬜ Belum dikonfigurasi | Ikuti Bagian 5 |
| Attachment authorization | ✅ `authorizeAttachmentAccess()` aktif | Mahasiswa hanya bisa akses file sendiri |
| Security headers attachment | ✅ `X-Content-Type-Options`, `Cache-Control: private, no-store` | |
| Audit log | ✅ `writeAuditLog()` aktif untuk login, logout, PDF print | |
| Backup permission | ⬜ Belum dikonfigurasi | Backup files harus 600, hanya readable root/operator |

---

## 19. Go/No-Go Production Checklist

### Infrastructure

- [ ] VPS tersedia dengan spesifikasi yang dikonfirmasi tim Unpad
- [ ] OS terpasang dan diupdate
- [ ] Docker Engine terinstal
- [ ] Docker Compose plugin terinstal
- [ ] User non-root terkonfigurasi
- [ ] SSH key authentication aktif, password SSH dinonaktifkan
- [ ] Firewall aktif - port 13306 dan 8081 **diblokir**

### Domain/HTTPS

- [ ] Domain production terdaftar dan DNS A record mengarah ke IP VPS
- [ ] Reverse proxy (Nginx/Caddy) terkonfigurasi
- [ ] TLS certificate valid untuk domain production
- [ ] HTTP otomatis redirect ke HTTPS
- [ ] `client_max_body_size` ≥ 12m di Nginx

### Environment

- [ ] File `.env` production dibuat dengan nilai yang benar
- [ ] File `.env` production bukan merupakan commit di Git
- [ ] Permission file `.env`: `600`
- [ ] `NEXTAUTH_URL` menggunakan HTTPS dengan domain production
- [ ] `NEXTAUTH_SECRET` dihasilkan secara random (minimal 32 karakter)
- [ ] `PAUS_BRIDGE_SECRET` dihasilkan secara random
- [ ] Variabel `DEV_*` dikosongkan atau tidak ada di production

### Database

- [ ] Container `ult-fmipa-db` berjalan sehat
- [ ] Database `fmipa_sbpk` terbuat dan terisi (baseline import)
- [ ] Support migrations dijalankan tanpa error
- [ ] Prisma migrations dijalankan tanpa error
- [ ] Named volume `ult_fmipa_db_data` terbuat

### Storage

- [ ] `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` production sudah unik (bukan nilai default dev)
- [ ] `docker compose logs minio-init` menunjukkan bucket privat berhasil dibuat
- [ ] Named volume `minio_data` terbuat (`docker volume ls`)
- [ ] `pnpm storage:audit -- --strict` menunjukkan Integrity Status: CLEAN
- [ ] Upload file test berhasil dan file muncul di host

### PAUS

- [ ] `PAUS_CLIENT_ID` production tersedia
- [ ] `PAUS_CLIENT_SECRET` production tersedia
- [ ] Redirect URI `https://<DOMAIN_PRODUCTION>/api/auth/callback/paus` terdaftar di PAUS
- [ ] Login mahasiswa via PAUS berhasil diuji (minimal di staging)
- [ ] Login staf via PAUS berhasil diuji (minimal di staging)

### Authentication & Authorization

- [ ] Login PAUS berfungsi
- [ ] Session valid setelah restart container
- [ ] Cookie `Secure` aktif di HTTPS
- [ ] Mahasiswa hanya dapat mengakses pengajuan dan file miliknya
- [ ] Staff dapat mengakses semua pengajuan (scope global)
- [ ] Admin dapat mengakses semua fitur

### Backup/Restore

- [ ] Backup database berhasil dijalankan
- [ ] Backup storage berhasil dijalankan
- [ ] Prosedur restore berhasil diuji di environment staging/non-production

### Testing

- [ ] Semua smoke test wajib (Bagian 14) lulus
- [ ] Storage audit `--strict` mengembalikan exit code 0 dan `Integrity Status: CLEAN`
- [ ] Health check `/api/health` mengembalikan `{"status":"ok"}`

### Monitoring

- [ ] Disk usage monitoring aktif
- [ ] Container health monitoring aktif
- [ ] Log rotation dikonfigurasi

### Rollback

- [ ] Image versi sebelumnya tersimpan atau commit lama dapat di-checkout
- [ ] Backup pre-deployment tersedia dan diverifikasi
- [ ] Prosedur rollback didokumentasikan dan dipahami PIC

### Approval

- [ ] Sign-off dari lead developer
- [ ] Sign-off dari tim infra Unpad
- [ ] PIC deployment standby selama maintenance window

---

## 20. Informasi yang Harus Dikonfirmasi ke Tim Unpad

| Informasi | Dibutuhkan Untuk | Prioritas |
|---|---|---|
| IP dan akses VPS (SSH) | Semua setup | **Kritis** |
| OS VPS | Persiapan VPS | **Kritis** |
| Spesifikasi VPS (CPU/RAM/disk) | Capacity planning | **Kritis** |
| Kapasitas disk yang dialokasikan untuk storage | Storage setup | **Kritis** |
| Folder mount yang diizinkan di VPS | Storage setup | **Kritis** |
| Domain production | DNS, NEXTAUTH_URL, PAUS redirect | **Kritis** |
| Domain staging | Staging setup | Tinggi |
| Akses DNS (control panel atau tim yang mengelola) | DNS record setup | **Kritis** |
| Reverse proxy pilihan (Nginx/Caddy/lainnya) | Proxy config | **Kritis** |
| TLS/certificate provider | HTTPS setup | Tinggi |
| PAUS Client ID - staging | Staging PAUS test | **Kritis** |
| PAUS Client Secret - staging | Staging PAUS test | **Kritis** |
| PAUS Client ID - production | Production go-live | **Kritis** |
| PAUS Client Secret - production | Production go-live | **Kritis** |
| Apakah IP VPS perlu di-whitelist di PAUS? | PAUS setup | Tinggi |
| Akun uji mahasiswa PAUS | PAUS testing | **Kritis** |
| Akun uji staf PAUS | PAUS testing | **Kritis** |
| Atribut yang dikirim PAUS (npm, nip, nama, paus_id) | Validasi mapping role | Tinggi |
| Policy scope staff (unit/layanan per-staf?) | Authorization | Sedang |
| Firewall rules yang diizinkan | Network setup | Tinggi |
| Backup policy infrastruktur Unpad | Backup planning | Sedang |
| Object storage internal Unpad (jika tersedia) | Off-server backup | Sedang |
| SMTP atau layanan email Unpad (jika diperlukan) | Notifikasi email | Rendah |
| PIC deployment (nama dan kontak) | Koordinasi | Tinggi |
| Maintenance window schedule | Deployment timing | Tinggi |
| Retensi data backup | Backup setup | Sedang |

---

## 21. Keputusan Akhir

| Aspek | Status |
|---|---|
| **Staging** | **Wajib** - PAUS belum pernah diuji pada domain aktual |
| **Staging dapat dilewati** | **Tidak** - risiko PAUS gagal total di go-live terlalu tinggi |
| **Syarat jika darurat tanpa staging** | PAUS credential + akun uji tersedia; backup diverifikasi; maintenance window; PIC standby; monitoring aktif; smoke test segera |
| **Production dapat dilakukan setelah** | Staging berjalan ≥1 minggu; semua smoke test lulus; PAUS terverifikasi; backup teruji; Go/No-Go checklist selesai |
| **Risiko residual yang diterima** | Rate limiter in-memory (reset saat restart) - diterima untuk single VPS |
| **Hal yang tidak bisa diputuskan tanpa tim Unpad** | VPS, domain, PAUS credential, credential MinIO production, scope staf per-unit |

---

## 22. Quick Start Checklist (Operator)

> Checklist ringkas untuk operator deployment. Detail ada di bagian masing-masing di atas.

### Persiapan VPS

- [ ] VPS tersedia, SSH dapat diakses
- [ ] Docker Engine + Docker Compose plugin terinstal
- [ ] Firewall dikonfigurasi (izinkan 80, 443; blokir 13306, 8081)
- [ ] User non-root terkonfigurasi dan masuk grup docker

### Clone/Build

- [ ] `git clone <REPO_URL> /opt/ult-fmipa/ && cd /opt/ult-fmipa/`
- [ ] `git checkout <TAG_TARGET>`
- [ ] `docker compose build`

### Environment

- [ ] `cp .env.example .env && nano .env`
- [ ] Set `NEXTAUTH_URL=https://<DOMAIN>`, `NEXTAUTH_SECRET`, `PAUS_*`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `PAUS_BRIDGE_SECRET`
- [ ] `chmod 600 .env`

### Storage

- [ ] `docker compose ps` → pastikan `minio` healthy dan `minio-init` Exited (0)
- [ ] Credential `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` production sudah unik
- [ ] `pnpm storage:audit -- --strict` exit code 0

### Database

- [ ] `docker compose up -d db && sleep 15`
- [ ] Import baseline: `docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < prisma/migrations/fmipa_sbpk.sql`

### PAUS

- [ ] Pastikan `PAUS_CLIENT_ID` dan `PAUS_CLIENT_SECRET` terisi di `.env`
- [ ] Konfirmasi redirect URI sudah terdaftar di PAUS Unpad

### Reverse Proxy

- [ ] Nginx/Caddy dikonfigurasi untuk domain → port 3000
- [ ] HTTPS aktif dengan sertifikat valid

### Migration

- [ ] `docker compose exec app pnpm db:support-migrate`
- [ ] `docker compose exec app pnpm db:prisma-migrate`

### Start

- [ ] `docker compose up -d`
- [ ] `docker compose logs -f app` (tunggu sampai server ready)

### Smoke Test

- [ ] `curl https://<DOMAIN>/api/health` → `{"status":"ok"}`
- [ ] Login PAUS mahasiswa → berhasil
- [ ] Login PAUS staf → berhasil
- [ ] Upload file → berhasil, object tersimpan di bucket MinIO (`docker compose exec minio mc ls local/ult-fmipa/uploads/`)
- [ ] `docker compose exec app pnpm storage:audit -- --strict` → exit code 0, CLEAN

### Backup

- [ ] Jalankan backup pertama secara manual (database + storage)
- [ ] Verifikasi file backup ada di `/srv/backups/`

### Go-live

- [ ] Semua item Go/No-Go checklist (Bagian 19) dicentang
- [ ] Sign-off dari developer dan tim infra
- [ ] Buka akses publik
- [ ] Monitor log selama 2–4 jam pertama

---

*Dokumen ini dibuat berdasarkan audit aktual repository pada 2026-08-03. Perbarui dokumen ini setiap kali ada perubahan signifikan pada konfigurasi, Dockerfile, atau prosedur deployment.*
