# VPS Deployment, Storage & Backup Procedures — ULT-FMIPA

Dokumen ini berisi petunjuk operasional deployment, persistensi storage, manajemen izin berkas, dan prosedur backup/restore untuk staging dan production VPS Unpad.

---

## 1. Lokasi & Konfigurasi Storage

### Development (Lokal Non-Docker)
- Fallback storage path: `<project>/storage`
- Variabel lingkungan pada `.env`: `STORAGE_ROOT=./storage`

### Production VPS (Docker Compose)
- Host VPS path: `/srv/ult-fmipa/storage`
- Container path: `/app/storage`
- Variabel Compose: `ULT_STORAGE_HOST_PATH=/srv/ult-fmipa/storage`
- Mapping Volume Compose:
  ```yaml
  volumes:
    - ${ULT_STORAGE_HOST_PATH:-./storage}:/app/storage
  ```

---

## 2. Status Scope Staff & Arsitektur Akses Attachment

### Status Scope Staff
- **Kondisi Skema**: Pada skema database legacy saat ini, pengajuan mahasiswa (`masih_kuliah`, `permohonan_magang`, `surat_izin_kegiatan`, dll.) belum memiliki kolom relasi unit atau assignment per-staff. Oleh karena itu, **policy existing saat ini secara bisnis masih bersifat global untuk seluruh staf** di `/staff/requests`.
- **Extension Point**: Fungsi `evaluateStaffUnitOrAssignmentScope` pada `src/lib/attachment-authorization.ts` disiapkan sebagai **titik ekstensi**. Granular scope unit/layanan **belum aktif** sampai tim Unpad menentukan aturan mapping unit/layanan resmi.

### Arsitektur Akses Attachment
- File attachment disimpan di VPS pada `/srv/ult-fmipa/storage/uploads`.
- Komputer admin/staff **tidak memerlukan** folder storage lokal.
- Akses lampiran dilakukan melalui endpoint API server: `/api/attachments/[id]`.
- Response attachment menyertakan security headers:
  - `X-Content-Type-Options: nosniff`
  - `Cache-Control: private, no-store, max-age=0`
  - `Pragma: no-cache`
  - `Expires: 0`
  - `Content-Disposition: inline` (untuk PDF/gambar) atau `attachment` dengan RFC 5987 encoding.

---

## 3. Keamanan Reverse Proxy Nginx & Rate Limiting

- Rate limiter menggunakan *in-memory sliding window* yang cocok untuk **single-instance VPS** (reset saat proses Node restart).
- Untuk mencegah IP spoofing, reverse proxy (Nginx/Caddy) di VPS wajib menimpa header `X-Forwarded-For` dan `X-Real-IP` dari client:
  ```nginx
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Real-IP $remote_addr;
  ```

---

## 4. Panduan Permission Storage & Direktori Host

> [!CAUTION]
> **Peringatan Keamanan Izin Berkas**:
> 1. **Dilarang Menggunakan `chmod 777`**: Membuka izin penuh pada folder storage sangat berbahaya bagi keamanan server.
> 2. **Jangan Mengasumsikan UID/GID**: Jangan mengasumsikan UID/GID `1000:1000` sebelum memeriksa user runtime container.

### Langkah Pengaturan Permission yang Benar:
1. Periksa UID/GID dari user yang menjalankan container:
   ```bash
   docker compose exec app id
   ```
2. Sesuaikan kepemilikan direktori host VPS (`/srv/ult-fmipa/storage`) sesuai UID/GID aktual container:
   ```bash
   chown -R <CONTAINER_UID>:<CONTAINER_GID> /srv/ult-fmipa/storage
   ```
3. Set izin akses direktori storage ke **750** (`drwxr-x---`):
   ```bash
   find /srv/ult-fmipa/storage -type d -exec chmod 750 {} +
   ```
4. Set izin akses file privat lampiran ke **640** (`-rw-r-----`) atau lebih ketat:
   ```bash
   find /srv/ult-fmipa/storage -type f -exec chmod 640 {} +
   ```

---

## 5. Prosedur Operator Backup (VPS Production)

> [!NOTE]
> Backup database dan storage yang dijalankan secara terpisah tidak otomatis *atomic*. Untuk menjamin konsistensi data antara database dan file fisik, gunakan prosedur operator berikut:

1. **Buat Jendela Perawatan Singkat / Batasi Traffic Upload** (jika memungkinkan).
2. **Backup Database MariaDB** (menggunakan service name Compose `db` tanpa hardcode password di script):
   ```bash
   docker compose exec -T db sh -c 'exec mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > /srv/backups/db_$(date +%Y%m%d_%H%M%S).sql
   ```
3. **Backup Storage Directory**:
   ```bash
   tar -czvf /srv/backups/storage_$(date +%Y%m%d_%H%M%S).tar.gz -C /srv/ult-fmipa storage
   ```
4. **Buka Kembali Traffic Normal**.
5. **Jalankan Storage Audit Verification**:
   ```bash
   docker compose exec -T app pnpm storage:audit
   ```

---

## 6. Prosedur Restore (VPS Production)

1. **Restore Database MariaDB**:
   ```bash
   docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < /srv/backups/db_YYYYMMDD_HHMMSS.sql
   ```
2. **Restore Storage Directory**:
   ```bash
   mkdir -p /srv/ult-fmipa
   tar -xzvf /srv/backups/storage_YYYYMMDD_HHMMSS.tar.gz -C /srv/ult-fmipa
   ```
3. **Atur Ulang Permission**:
   ```bash
   chown -R <CONTAINER_UID>:<CONTAINER_GID> /srv/ult-fmipa/storage
   find /srv/ult-fmipa/storage -type d -exec chmod 750 {} +
   find /srv/ult-fmipa/storage -type f -exec chmod 640 {} +
   ```
4. **Verifikasi Integritas Pasca-Restore**:
   ```bash
   docker compose exec -T app pnpm storage:audit
   ```

---

## 7. Audit Integritas Storage

Jalankan auditintegritas *dry-run* (read-only) tanpa mengubah data:

```bash
pnpm storage:audit
```

Untuk integrasi CI atau verifikasi ketat yang memberikan exit code non-zero jika terdapat ketidakcocokan data:
```bash
pnpm storage:audit -- --strict
```
