# VPS Deployment, Storage & Backup Procedures - ULT-FMIPA

Dokumen ini berisi petunjuk operasional deployment, persistensi storage,
dan prosedur backup/restore untuk staging dan production VPS Unpad.

> **Catatan revisi**: Dokumen ini awalnya ditulis untuk arsitektur storage
> bind-mount filesystem lokal (`/srv/ult-fmipa/storage` → `/app/storage`).
> Arsitektur itu **sudah digantikan sepenuhnya oleh MinIO** (object storage
> S3-compatible) - lihat `docker-compose.yml` (tidak ada lagi bind mount
> storage untuk service `app`) dan
> [`docs/minio-storage-deployment.md`](./minio-storage-deployment.md).
> Bagian storage di dokumen ini sudah direvisi mengikuti arsitektur MinIO
> aktual; jangan mengikuti prosedur `chown`/`chmod`/bind-mount storage lama
> dari versi dokumen sebelumnya.

---

## 1. Lokasi & Konfigurasi Storage (MinIO)

Tidak ada lagi folder storage lokal yang perlu di-mount ke VPS. Seluruh file
upload (attachment layanan, gambar Informasi/Kegiatan Mahasiswa/Profil)
tersimpan sebagai object di MinIO.

### Development (lokal)

- MinIO dijalankan lewat `docker compose up -d minio minio-init`.
- `MINIO_ENDPOINT=localhost` jika Next.js dijalankan di host; `minio` jika
  Next.js dijalankan sebagai service Compose (`app`).
- Data MinIO persist di named volume Docker `minio_data`.

### Production VPS (Docker Compose)

- MinIO dijalankan sebagai service `minio` di `docker-compose.yml`, dengan
  volume Docker persistent (`minio_data`) - **bukan** bind mount ke path
  host tertentu, kecuali VPS secara eksplisit dikonfigurasi untuk memetakan
  volume Docker ke direktori host (di luar cakupan konfigurasi default
  repository ini).
- Variabel environment yang wajib diset di VPS: `MINIO_ENDPOINT` (nama
  service Compose, mis. `minio`), `MINIO_PORT`, `MINIO_USE_SSL`,
  `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` - nilai
  `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` production **harus** unik, bukan
  nilai default development (`minioadmin`/`minioadmin123`).
- Bucket bersifat **privat** (`mc anonymous set none`, dijalankan otomatis
  oleh service `minio-init`) - jangan pernah mengubahnya jadi publik.
- **Jangan expose port MinIO ke publik.** Port API `9000` hanya boleh
  diakses dari service `app` dalam jaringan Compose/cluster yang sama; port
  console `9001` tidak boleh pernah keluar dari jaringan internal - jangan
  buat rule firewall/reverse-proxy yang mengekspornya.

Referensi lengkap: [`docs/minio-storage-deployment.md`](./minio-storage-deployment.md).

---

## 2. Status Scope Staff & Arsitektur Akses Attachment

### Status Scope Staff

- **Kondisi Skema**: Pada skema database legacy saat ini, pengajuan mahasiswa (`masih_kuliah`, `permohonan_magang`, `surat_izin_kegiatan`, dll.) belum memiliki kolom relasi unit atau assignment per-staff. Oleh karena itu, **policy existing saat ini secara bisnis masih bersifat global untuk seluruh staf** di `/staff/requests`.
- **Extension Point**: Fungsi `evaluateStaffUnitOrAssignmentScope` pada `src/lib/attachment-authorization.ts` disiapkan sebagai **titik ekstensi**. Granular scope unit/layanan **belum aktif** sampai tim Unpad menentukan aturan mapping unit/layanan resmi.

### Arsitektur Akses Attachment

- File attachment tersimpan sebagai object MinIO di bawah prefix `uploads/`
  (lihat [`docs/minio-storage-audit.md`](./minio-storage-audit.md) untuk
  format object key lengkap).
- Komputer admin/staff **tidak memerlukan** folder storage lokal apa pun -
  ini tetap benar setelah migrasi ke MinIO seperti sebelumnya.
- Akses lampiran dilakukan melalui endpoint API server: `/api/attachments/[id]`,
  yang men-stream object dari MinIO - browser tidak pernah mengakses MinIO
  secara langsung.
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

## 4. Prosedur Operator Backup (VPS Production)

> [!NOTE]
> Backup database dan backup object storage yang dijalankan secara terpisah
> tidak otomatis *atomic*. Untuk menjamin konsistensi antara metadata
> database dan object fisik di MinIO, gunakan prosedur operator berikut.

1. **Buat jendela perawatan singkat / batasi traffic upload** (jika memungkinkan).
2. **Backup database MariaDB** (menggunakan service name Compose `db` tanpa hardcode password di script):
   ```bash
   docker compose exec -T db sh -c 'exec mysqldump -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > /srv/backups/db_$(date +%Y%m%d_%H%M%S).sql
   ```
3. **Backup object MinIO** - gunakan `mc mirror` (image `minio/mc` sudah
   dipakai oleh service `minio-init`) untuk menyalin seluruh bucket ke
   direktori backup host:
   ```bash
   docker run --rm --network <compose-network-name> \
     -e MC_HOST_local="http://<MINIO_ACCESS_KEY>:<MINIO_SECRET_KEY>@minio:9000" \
     -v /srv/backups/minio_$(date +%Y%m%d_%H%M%S):/backup \
     minio/mc mirror local/<MINIO_BUCKET> /backup
   ```
   Ganti `<compose-network-name>` dengan nama network Docker Compose aktual
   (`docker compose ls`/`docker network ls`), dan `<MINIO_ACCESS_KEY>` /
   `<MINIO_SECRET_KEY>` / `<MINIO_BUCKET>` dengan nilai environment VPS yang
   sesungguhnya - jangan menuliskan credential asli di script yang
   di-commit ke repository.
4. **Buka kembali traffic normal**.
5. **Jalankan storage audit verification**:
   ```bash
   docker compose exec -T app pnpm storage:audit -- --strict
   ```

---

## 5. Prosedur Restore (VPS Production)

1. **Restore database MariaDB**:
   ```bash
   docker compose exec -T db sh -c 'exec mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < /srv/backups/db_YYYYMMDD_HHMMSS.sql
   ```
2. **Restore object MinIO** dari direktori backup, dengan `mc mirror` arah
   sebaliknya:
   ```bash
   docker run --rm --network <compose-network-name> \
     -e MC_HOST_local="http://<MINIO_ACCESS_KEY>:<MINIO_SECRET_KEY>@minio:9000" \
     -v /srv/backups/minio_YYYYMMDD_HHMMSS:/backup \
     minio/mc mirror /backup local/<MINIO_BUCKET>
   ```
3. **Verifikasi integritas pasca-restore**:
   ```bash
   docker compose exec -T app pnpm storage:audit -- --strict
   ```

---

## 6. Audit Integritas Storage

Jalankan audit integritas *dry-run* (read-only) tanpa mengubah data:

```bash
pnpm storage:audit
```

Untuk integrasi CI atau verifikasi ketat yang memberikan exit code non-zero jika terdapat ketidakcocokan data:

```bash
pnpm storage:audit -- --strict
```

Cakupan audit ini saat ini adalah tabel `ult_request_attachments` (prefix
`uploads/`) - lihat `scripts/audit-storage-integrity.mjs` untuk detail
sebelum mengasumsikan cakupan CMS lain (Informasi/Kegiatan Mahasiswa/Profil)
ikut teraudit oleh script yang sama.
