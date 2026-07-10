# ULT FMIPA Kubernetes

These manifests run the Next.js app, MariaDB, persistent upload storage, and a
one-off migration job.

## Build image

```powershell
docker build -t ult-fmipa:latest .
```

For a remote cluster, tag and push the image to your registry, then replace
`ult-fmipa:latest` in `05-migration-job.yaml` and `06-app.yaml`.

## Configure

Before applying to production:

- Replace `ult-fmipa.example.com` in `02-configmap.yaml` and `07-ingress.yaml`.
- Replace placeholder secrets in `01-secrets.yaml`.
- Use a managed database or tune the MariaDB `StatefulSet` storage for real
  production traffic.

## Deploy

```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-mariadb.yaml
kubectl apply -f k8s/04-storage.yaml
kubectl -n ult-fmipa wait --for=condition=ready pod -l app=ult-fmipa-mariadb --timeout=180s
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
