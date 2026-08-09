# ULT FMIPA Kubernetes

These manifests run the Next.js app, MariaDB, an in-cluster MinIO object
store for file uploads (private bucket, provisioned by a one-off init Job),
and a one-off database migration job.

File uploads are **not** stored on any pod-local or app-mounted volume.
The app talks to MinIO over the internal `ult-fmipa-minio` Service using the
`MINIO_*` env vars from `02-configmap.yaml` (non-secret) and
`01-secrets.yaml` (`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`, which must match
`ult-fmipa-minio-secret`'s `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`).

## Build image

```powershell
docker build -t ult-fmipa:latest .
```

For a remote cluster, tag and push the image to your registry, then replace
`ult-fmipa:latest` in `05-migration-job.yaml` and `06-app.yaml`.

## Configure

Before applying to production:

- Replace `ult-fmipa.example.com` in `02-configmap.yaml` and `07-ingress.yaml`.
- Replace placeholder secrets in `01-secrets.yaml`, including `MINIO_ACCESS_KEY`
  / `MINIO_SECRET_KEY` (must match `ult-fmipa-minio-secret`'s
  `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`).
- Use a managed database, or a managed/external S3-compatible object store,
  for real production traffic - the in-cluster MariaDB `StatefulSet` and
  MinIO `StatefulSet` here are sized for small deployments. If object
  storage is provided externally, skip `04-storage.yaml` and
  `04b-minio-init-job.yaml` and point `MINIO_ENDPOINT`/`MINIO_PORT`/
  `MINIO_USE_SSL` at that service instead.
- Never expose the MinIO console (port 9001) outside the cluster.

## Deploy

```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-mariadb.yaml
kubectl apply -f k8s/04-storage.yaml
kubectl -n ult-fmipa wait --for=condition=ready pod -l app=ult-fmipa-mariadb --timeout=180s
kubectl -n ult-fmipa wait --for=condition=ready pod -l app=ult-fmipa-minio --timeout=180s
kubectl apply -f k8s/04b-minio-init-job.yaml
kubectl -n ult-fmipa wait --for=condition=complete job/ult-fmipa-minio-init --timeout=120s
kubectl apply -f k8s/05-migration-job.yaml
kubectl -n ult-fmipa wait --for=condition=complete job/ult-fmipa-migrate --timeout=180s
kubectl apply -f k8s/06-app.yaml
kubectl apply -f k8s/07-ingress.yaml
```

## Inspect

```powershell
kubectl -n ult-fmipa get pods
kubectl -n ult-fmipa logs deployment/ult-fmipa-app
kubectl -n ult-fmipa logs job/ult-fmipa-migrate
```
