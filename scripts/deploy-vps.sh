#!/usr/bin/env bash
# ==============================================================================
# Script Deploy VPS ULT FMIPA (Local Build -> Push Image -> Zero VPS Source Code)
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 1. Baca konfigurasi VPS dari sops secrets atau environment
SECRETS_FILE="$HOME/.config/secrets/secrets.sops.env"
if [ -f "$SECRETS_FILE" ]; then
  VPS_HOST="$(awk -F= '/^FMIPA_VPS_HOST=/{print $2}' "$SECRETS_FILE")"
  VPS_USER="$(awk -F= '/^FMIPA_VPS_USER=/{print $2}' "$SECRETS_FILE")"
  VPS_PASSWORD="$(awk -F= '/^FMIPA_VPS_PASSWORD=/{print substr($0,index($0,"=")+1)}' "$SECRETS_FILE")"
fi

VPS_HOST="${VPS_HOST:-10.9.40.30}"
VPS_USER="${VPS_USER:-iman}"
VPS_REMOTE_DIR="/home/iman/ult-fmipa"
IMAGE_NAME="ult-fmipa-app"

echo "=========================================================="
echo "  Deploy ULT FMIPA -> VPS $VPS_HOST (User: $VPS_USER)"
echo "  Arsitektur: Build Lokal -> Push Docker Image (No Source Code)"
echo "=========================================================="

# 2. Cek koneksi Docker lokal
if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "[-] ERROR: Docker lokal tidak aktif!"
  echo "    Pasang atau jalankan Docker Desktop / OrbStack:"
  echo "    brew install --cask orbstack"
  exit 1
fi

# 3. Cek koneksi VPN / SSH ke VPS
if ! ping -c 1 -W 2000 "$VPS_HOST" >/dev/null 2>&1; then
  echo "[-] ERROR: VPS $VPS_HOST tidak dapat dihubungi via ping."
  echo "    Pastikan tunnel WireGuard aktif:"
  echo "    sudo wg-quick up ~/.config/fmipa/wireguard/fmipa-vps.conf"
  exit 1
fi

# Setup SSH Wrapper
SSH_CMD=(ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no)
if [ -n "${VPS_PASSWORD:-}" ] && command -v sshpass >/dev/null 2>&1; then
  export SSHPASS="$VPS_PASSWORD"
  RUN_SSH() { sshpass -e "${SSH_CMD[@]}" "$VPS_USER@$VPS_HOST" "$@"; }
else
  RUN_SSH() { "${SSH_CMD[@]}" "$VPS_USER@$VPS_HOST" "$@"; }
fi

GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo "manual")"
TAG="$(date +%Y%m%d%H%M%S)-$GIT_SHA"

echo "[1/6] Memulai kompilasi Docker image lokal (Target: linux/amd64)..."
docker buildx build \
  --platform linux/amd64 \
  -t "$IMAGE_NAME:$TAG" \
  -t "$IMAGE_NAME:latest" \
  --target runner \
  .

echo "[2/6] Image berhasil dikompilasi lokal ($IMAGE_NAME:$TAG)."
echo "[3/6] Streaming image terkompresi ke VPS $VPS_HOST (docker save | gzip | docker load)..."
if [ -n "${VPS_PASSWORD:-}" ] && command -v sshpass >/dev/null 2>&1; then
  docker save "$IMAGE_NAME:latest" | gzip -1 | sshpass -e "${SSH_CMD[@]}" "$VPS_USER@$VPS_HOST" "docker load"
else
  docker save "$IMAGE_NAME:latest" | gzip -1 | "${SSH_CMD[@]}" "$VPS_USER@$VPS_HOST" "docker load"
fi

echo "[4/6] Mengupdate runtime compose di VPS..."
RUN_SSH "mkdir -p $VPS_REMOTE_DIR"
if [ -n "${VPS_PASSWORD:-}" ] && command -v sshpass >/dev/null 2>&1; then
  sshpass -e scp -o StrictHostKeyChecking=accept-new "$ROOT_DIR/docker-compose.prod.yml" "$VPS_USER@$VPS_HOST:$VPS_REMOTE_DIR/docker-compose.yml"
else
  scp -o StrictHostKeyChecking=accept-new "$ROOT_DIR/docker-compose.prod.yml" "$VPS_USER@$VPS_HOST:$VPS_REMOTE_DIR/docker-compose.yml"
fi

echo "[5/6] Menerapkan container baru di VPS & migrasi database..."
RUN_SSH "bash -s" <<REMOTE
set -e
cd "$VPS_REMOTE_DIR"
docker compose up -d --remove-orphans app

echo "Menjalankan migrasi database di dalam container..."
docker compose exec -T app npx prisma migrate deploy || echo "Migrasi database dilewati / sudah mutakhir."
REMOTE

echo "[6/6] Verifikasi probe kesehatan layanan..."
PROBE_OK=0
for i in {1..12}; do
  CODE=$(RUN_SSH "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || echo '000'")
  if [ "$CODE" = "200" ]; then
    PROBE_OK=1
    break
  fi
  echo "    Menunggu aplikasi ready ($i/12) - HTTP $CODE..."
  sleep 4
done

if [ "$PROBE_OK" -eq 1 ]; then
  echo "[+] Verifikasi SUKSES: ult.fmipa.unpad.ac.id (127.0.0.1:3000) -> HTTP 200"
  RUN_SSH "docker image prune -f >/dev/null 2>&1 || true"
  echo "=========================================================="
  echo "  DEPLOYMENT SELESAI: Image $IMAGE_NAME:$TAG aktif di VPS"
  echo "  (VPS tidak menyimpan source code, hanya compiled image)"
  echo "=========================================================="
else
  echo "[-] PERINGATAN: Probe HTTP tidak mengembalikan 200 dalam batas waktu."
  RUN_SSH "docker compose -f $VPS_REMOTE_DIR/docker-compose.yml logs --tail 30 app"
  exit 1
fi
