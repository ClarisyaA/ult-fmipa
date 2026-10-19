# Workflow Deployment VPS ULT FMIPA (Local Build -> Immutable Image Push)

Dokumen ini mendokumentasikan workflow *best practice* deployment aplikasi **ULT FMIPA** ke VPS produksi (`10.9.40.30`).

## Prinsip Utama
1. **Zero Source Code on VPS**: VPS **tidak** menyimpan file `.git`, kode sumber (`.ts`, `.tsx`), `node_modules`, `database/`, atau `tests/`. VPS hanya menyimpan:
   * `docker-compose.yml` (runtime-only)
   * `.env` (kredensial produksi)
   * Image Docker hasil kompilasi lokal
   * Volume database / upload data
2. **Kompilasi Lokal (Build Parity)**: Proses *transpile* TypeScript, optimasi Next.js, dan packaging Docker dijalankan di mesin developer / CI lokal untuk arsitektur target `linux/amd64`.
3. **Immutability & Zero Server Load**: Server produksi tidak mengalami lonjakan beban CPU/RAM dan tidak menghasilkan build cache berlebih yang menghabiskan ruang disk.

---

## Arsitektur Deployment

```
[ Developer Mac / CI ]
  ├── 1. `pnpm run build` / `docker buildx`
  │      └── Compile Next.js standalone + Prisma Linux engine (linux/amd64)
  ├── 2. Stream Image over SSH:
  │      `docker save ult-fmipa-app:latest | gzip -1 | ssh iman@10.9.40.30 "docker load"`
  └── 3. Update runtime compose & exec reload

[ VPS fmipa-ult (10.9.40.30) ]
  ├── /home/iman/ult-fmipa/
  │    ├── docker-compose.yml  (image: ult-fmipa-app:latest)
  │    └── .env                (konfigurasi environment)
  └── Docker Engine
       ├── Container: ult-fmipa-app (Node 22 Standalone)
       ├── Container: ult-fmipa-db (MariaDB 11)
       └── Container: ult-fmipa-minio (MinIO)
```

---

## Cara Menjalankan Deployment

### Prasyarat
1. Docker aktif di mesin lokal (OrbStack atau Docker Desktop).
2. WireGuard split-tunnel aktif ke VPS (`sudo wg-quick up ~/.config/fmipa/wireguard/fmipa-vps.conf`).
3. Kredensial SSH VPS di `~/.config/secrets/secrets.sops.env` (atau ssh-agent).

### Eksekusi Satu Perintah
Jalankan dari root repositori:
```bash
pnpm deploy:vps
```
atau langsung jalankan skripnya:
```bash
./scripts/deploy-vps.sh
```

### Yang Dilakukan Skrip `deploy-vps.sh`:
1. Memeriksa ketersediaan Docker lokal dan konektivitas VPN ke `10.9.40.30`.
2. Mengompilasi image multi-stage Next.js untuk `linux/amd64` dengan tag timestamp + Git SHA.
3. Melakukan streaming image terkompresi langsung ke daemon Docker di VPS (`docker load`).
4. Memperbarui `docker-compose.yml` versi runtime di `/home/iman/ult-fmipa/`.
5. Menjalankan `docker compose up -d --remove-orphans app`.
6. Menjalankan migrasi database otomatis di dalam container (`npx prisma migrate deploy`).
7. Melakukan verifikasi probe HTTP (port 3000 -> HTTP 200).
8. Membersihkan image lama yang sudah tidak terpakai (`docker image prune -f`).
