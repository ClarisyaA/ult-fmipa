# MinIO Storage — Deployment Reference

This is the deployment-facing companion to
[`minio-storage-audit.md`](./minio-storage-audit.md). It documents the
environment variables every deployment target needs and how their values
differ.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `MINIO_ENDPOINT` | yes | Hostname only, no scheme (`localhost`, `minio`, or a cluster DNS name) |
| `MINIO_PORT` | yes | Integer, e.g. `9000` |
| `MINIO_USE_SSL` | yes | `"true"` or `"false"` only |
| `MINIO_ACCESS_KEY` | yes | Secret — never commit a production value |
| `MINIO_SECRET_KEY` | yes | Secret — never commit a production value |
| `MINIO_BUCKET` | yes | Defaults to `ult-fmipa` in this repo's tooling |

All five are validated together by `src/lib/minio-storage.ts` — a missing
or malformed value throws a `MinioConfigError` that names the missing
variable(s) without ever printing secret values.

## `MINIO_ENDPOINT` differs per environment

| Environment | `MINIO_ENDPOINT` | Why |
| --- | --- | --- |
| Next.js dev server on the host, MinIO in Docker | `localhost` | The app process is not in Docker's network namespace; it reaches MinIO through the published `9000` port on the host. |
| Docker Compose (app + MinIO both as Compose services) | `minio` | Compose's internal DNS resolves service names; containers must not use `localhost` to reach each other. |
| Kubernetes | the MinIO `Service` name (`ult-fmipa-minio` with the manifests in `k8s/`) or an external S3-compatible endpoint if object storage is provided by cluster infrastructure instead of being self-hosted | Same principle as Compose — resolve the peer via cluster DNS, not `localhost`. |

## Docker Compose

`docker-compose.yml` runs three storage-related services:

- `minio` — the object storage server, with a healthcheck (`mc ready local`) and a named volume (`minio_data`) so objects survive `docker compose down`/`up` and container restarts.
- `minio-init` — a one-shot `minio/mc` container that creates the `ult-fmipa` bucket if it doesn't exist and explicitly sets it to no anonymous/public access. It's idempotent: re-running `docker compose up` re-runs it harmlessly.
- `app` — depends on `minio` being healthy and `minio-init` having completed successfully before it starts.

Start everything:

```powershell
docker compose up -d
```

Or just storage, to develop the Next.js app on the host against Dockerized MinIO:

```powershell
docker compose up -d minio minio-init
```

Console: <http://localhost:9001> (local dev credentials only — never expose this port in production).

## Kubernetes

See `k8s/README.md` for the full apply order. Summary of what changed for this migration:

- `k8s/02-configmap.yaml` — dropped `STORAGE_ROOT`, added the non-secret `MINIO_ENDPOINT` / `MINIO_PORT` / `MINIO_USE_SSL` / `MINIO_BUCKET` keys.
- `k8s/01-secrets.yaml` — added `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` to `ult-fmipa-app-secret`, and a new `ult-fmipa-minio-secret` (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`) for the in-cluster MinIO server. **These two secrets' credential pairs must match** — the app authenticates to MinIO with the app-secret pair, which must equal the minio-secret's root credentials (or a dedicated MinIO user/policy you provision separately).
- `k8s/04-storage.yaml` — previously a bare `PersistentVolumeClaim` for the app's local `/app/storage` mount; now a `StatefulSet` + `Service` running MinIO itself with its own `volumeClaimTemplates`-backed PVC. The app no longer mounts any volume for uploads.
- `k8s/04b-minio-init-job.yaml` — new one-shot `Job` (mirrors `05-migration-job.yaml`'s pattern) that creates the bucket and sets it private. Safe to re-run.
- `k8s/06-app.yaml` — removed the `storage` volume/volumeMount; the app talks to MinIO over the network only.

If your cluster is provided an external S3-compatible object store (managed MinIO, AWS S3, etc.) instead of self-hosting it, skip `04-storage.yaml` and `04b-minio-init-job.yaml` entirely and point the `MINIO_*` variables at that service's endpoint/credentials instead.

**Never expose the MinIO console (port 9001) through an Ingress or a public Service/LoadBalancer.** Only the API port (9000) needs to be reachable, and only from inside the cluster.

## Local (non-Docker) development

Run `docker compose up -d minio minio-init` for storage, and use the host-facing `.env` values (`MINIO_ENDPOINT=localhost`, the rest matching the compose defaults) while running `pnpm dev` directly on the host.
