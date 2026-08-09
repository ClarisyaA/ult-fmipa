# Local Staging Rehearsal

## 1. Purpose

This is an **isolated, production-like local environment** used to rehearse a
deployment before it goes to the real VPS staging server. It runs the app
from a **production build/container** (same `Dockerfile` `runner` stage as a
real deployment), against its own database and MinIO bucket, with the
development-only login bypass (`DEV_ADMIN_*`/`DEV_STAFF_*`/`DEV_STUDENT_*`)
hard-disabled.

It is **not** a remote deployment and does not replace testing on the real
VPS staging server (see [section 20](#20-delta-when-moving-to-real-vps-staging)).

## 2. Environment matrix

| | Local development | Local staging (this doc) | VPS staging | Production |
|---|---|---|---|---|
| App runtime | `pnpm dev` (hot reload) or dev Docker image | Production Docker image (`next build` + `node server.js`) | Same production image, on a VPS | Same production image |
| `NODE_ENV` | development (host) / production (Docker mode) | `production` | `production` | `production` |
| Compose project | default (`ult-fmipa`, from directory name) | `ult-fmipa-staging-local` | e.g. `ult-fmipa-staging` | e.g. `ult-fmipa-prod` |
| Database | `fmipa_sbpk` | `fmipa_sbpk_staging_local` | staging DB on the server | production DB |
| MinIO bucket | `ult-fmipa` | `ult-fmipa-staging-local` | staging bucket on the server | production bucket |
| App port | `3000` | `3100` | behind reverse proxy / HTTPS | behind reverse proxy / HTTPS |
| Admin/Staff login | DB accounts, or `DEV_ADMIN_*`/`DEV_STAFF_*` bypass | DB accounts only (`DEV_*` blank) | DB accounts / PAUS SSO | DB accounts / PAUS SSO |
| Network exposure | localhost | localhost, debug ports on `127.0.0.1` only | public via HTTPS + firewall | public via HTTPS + firewall |

## 3. Files used

| File | Tracked? | Purpose |
|---|---|---|
| `docker-compose.yml` | yes | Base service definitions (shared with local dev / prod) |
| `docker-compose.staging-local.yml` | yes | Overlay: container names, ports, volumes, staging DB/bucket names, production-like env |
| `staging-local.env.example` | yes | Safe placeholder template |
| `staging-local.env` | **no (gitignored)** | Actual local secrets/config, generated locally |
| `staging-local.bootstrap.env.example` | yes | Safe placeholder template for the one-time Admin bootstrap |
| `staging-local.bootstrap.env` | **no (gitignored)** | Actual bootstrap credentials, deleted after use |
| `scripts/staging-local/*.mjs` | yes | Command implementations behind `pnpm staging:local:*` |

## 4. Create `staging-local.env`

```powershell
Copy-Item staging-local.env.example staging-local.env
# Generate a secret, e.g.:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Paste generated values into DB_USER/DB_PASSWORD/DB_ROOT_PASSWORD,
# NEXTAUTH_SECRET, PAUS_BRIDGE_SECRET, MINIO_ACCESS_KEY/SECRET_KEY.
```

Never commit this file (it's gitignored: `staging-local.env`).

## 5. Create `staging-local.bootstrap.env`

```powershell
Copy-Item staging-local.bootstrap.env.example staging-local.bootstrap.env
# Edit the file and fill in:
#   STAGING_BOOTSTRAP_ADMIN_USERNAME (max 20 chars)
#   STAGING_BOOTSTRAP_ADMIN_EMAIL
#   STAGING_BOOTSTRAP_ADMIN_NAME
#   STAGING_BOOTSTRAP_ADMIN_PASSWORD (min 8 chars, not a default like "admin123")
```

Never commit this file (it's gitignored: `staging-local.bootstrap.env`).

## 6. Command sequence from zero

```powershell
pnpm install
pnpm prisma generate
pnpm staging:local:config        # validate compose config only, no containers
pnpm staging:local:up            # build + start the isolated stack
pnpm staging:local:ps            # confirm only staging-local containers/ports
pnpm staging:local:import-baseline   # see section 7 - required before migrate
pnpm staging:local:migrate       # db:prisma-migrate + db:support-migrate
pnpm staging:local:bootstrap-admin   # one-time Admin account
pnpm staging:local:audit         # storage integrity, --strict
```

Then open http://localhost:3100 and log in as the bootstrapped Admin.

## 7. Import baseline

`data_users`, `data_access`, and `data_unit` (and other legacy tables) are
**not** created by any Prisma or support migration - they only exist after
importing the legacy baseline dump. Support migration
`database/migrations/009_add_app_role_to_data_users.sql` assumes
`data_users` already exists, so **the baseline must be imported before
running migrations** on a fresh staging-local database.

The baseline file lives at `prisma/migrations/fmipa_sbpk.sql` (gitignore
already excludes `prisma/migrations/fmipa_sbpk.sql`; note it is a large
legacy dump - see the Security Review note in the final report about this
file's current tracked status in this repository, which predates this
change).

```powershell
pnpm staging:local:import-baseline
```

This command:
- Fails with `BLOCKED - legacy database baseline required` if the file is
  missing (it never fabricates a baseline).
- Always targets `fmipa_sbpk_staging_local` (hardcoded, not read from any
  environment variable).
- Refuses to run if the target database already has a `data_users` table,
  unless you pass `--force` (`pnpm staging:local:import-baseline --force`).
- Streams the dump directly into the `db` container's own `mariadb` client; it
  does not read, print, or copy the dump's contents anywhere else.

If the baseline file is not available, this step is `BLOCKED`. The rest of
the stack (compose, `up`, `config`) still works without it - only
`migrate`/`bootstrap-admin`/anything touching `data_users` needs it.

## 8. Run migrations

```powershell
pnpm staging:local:migrate
```

Runs `pnpm db:prisma-migrate && pnpm db:support-migrate` inside a one-shot
container built from the same production app image (`docker compose run`),
against the `db` service that `staging:local:up` already started. This does
**not** run `prisma migrate deploy`, `prisma db push`, or anything under
`database/migrations_legacy_backup/`.

## 9. Bootstrap the first Admin

```powershell
pnpm staging:local:bootstrap-admin
```

Creates exactly one Admin account, directly in `fmipa_sbpk_staging_local`,
inside a one-shot container (never in the long-running app container's
environment). See the final report's "Admin Bootstrap" section for the full
mechanism, guards, and field mapping.

## 10. Log in as Admin

1. Open http://localhost:3100/login.
2. Sign in with `STAGING_BOOTSTRAP_ADMIN_USERNAME` (or the email) and the
   password from `staging-local.bootstrap.env`.
3. This goes through the same database-credentials login path
   (`src/lib/auth-db-users.ts` `authorizeDbCredentialUser`) used in
   production - not a dev-only bypass.

## 11. Create a Staff account from user management

1. As Admin, open the admin user management screen
   (`src/app/admin/system/users/page.tsx`, e.g.
   http://localhost:3100/admin/system/users).
2. Create a new user with "Akses Aplikasi" = `STAFF`, a valid
   "Posisi / Level" (`ACCESS_CODE`), a Unit, and a password (min 8 chars).
3. This calls `POST /api/admin/system/users`
   (`src/app/api/admin/system/users/route.ts`), which is gated by
   `requireAdminApi()` and hashes the password with the same
   `hashLegacyPassword` (SHA-1) convention as bootstrap.

## 12. Log in as Staff

Sign in at http://localhost:3100/login with the new Staff account. Staff
should reach the Staff dashboard and must not be able to reach Admin-only
actions (user management, deleting requests that are Admin-only, etc.) -
`requireRole`/`requireAdminApi` enforce this the same way as in production.

## 13. Storage audit

```powershell
pnpm staging:local:audit
```

Runs `pnpm storage:audit -- --strict` inside the app container against the
staging-local database and bucket. Expect `Integrity Status: CLEAN`.

## 14. Restart / persistence test

```powershell
docker compose -p ult-fmipa-staging-local restart app db minio
```

(or stop/start individual services). After restart, confirm the Admin/Staff
accounts, any test data, and any uploaded file are still present, and
re-run `pnpm staging:local:audit`. Data persists in the named volumes
(`ult_fmipa_staging_local_db_data`, `ult_fmipa_staging_local_minio_data`),
which are never removed by `pnpm staging:local:down`.

## 15. Smoke test (quick)

- `curl.exe http://localhost:3100/api/health` -> `{"status":"ok",...}`
- Login page loads at `/login`.
- Admin can open user management and list/create a Staff account.
- Staff can log in and reach the Staff dashboard.
- One file upload + storage audit `CLEAN`.

## 16. View logs

```powershell
pnpm staging:local:logs            # app service (default)
pnpm staging:local:logs -- db      # any other service name
```

Only stdout/stderr of the chosen service is shown - not container
environment variables.

## 17. Stop the stack without deleting data

```powershell
pnpm staging:local:down
```

Removes staging-local containers and network only. Never passes `-v`, so
`ult_fmipa_staging_local_db_data` and `ult_fmipa_staging_local_minio_data`
are preserved. Local development containers/volumes are untouched (different
Compose project).

## 18. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `staging:local:*` commands say "Missing staging-local.env" | File not created yet | Section 4 |
| `staging:local:migrate` fails on migration 009 | Baseline not imported yet | Section 7 |
| `bootstrap-admin` fails with "ACCESS_CODE ... was not found" | Baseline not imported, `data_access` empty | Section 7 |
| `bootstrap-admin` fails with "data_unit has no rows" | Baseline not imported | Section 7 |
| `bootstrap-admin` fails with "already exists" | Re-running with the same username/email | Choose a different username/email, or manage the existing account via user management |
| App container unhealthy | DB/MinIO not healthy yet | `pnpm staging:local:ps`, check `pnpm staging:local:logs -- db` / `-- minio` |
| Port already in use | Something else is bound to 3100/23306/8181/19000/19001 on the host | Stop the conflicting process, or confirm you're not accidentally reusing dev ports |

## 19. Cleanup bootstrap credentials

Once the Admin account is confirmed working (you can log in), delete the
local bootstrap credential file so the plaintext password does not linger
on disk:

```powershell
Remove-Item staging-local.bootstrap.env
```

The bootstrap script never writes the plaintext password into the database,
logs, or any tracked file - only its SHA-1 hash (`hashLegacyPassword`
convention) is stored, in `data_users.PASSWORD`.

## 20. Delta when moving to real VPS staging

The application/Compose structure is the same; only environment-specific
values change:

1. **`NEXTAUTH_URL`**: `http://localhost:3100` -> `https://<DOMAIN_STAGING>`.
2. **Secrets**: generate new `NEXTAUTH_SECRET`, `PAUS_BRIDGE_SECRET`, DB
   passwords, MinIO keys on the server. Never copy local-staging secrets.
3. **Database**: real staging DB host/credentials/name. Never reuse
   `fmipa_sbpk_staging_local`.
4. **MinIO**: real staging endpoint/credentials/bucket and persistent VPS
   storage. Never reuse the `ult-fmipa-staging-local` bucket.
5. **Image**: build and push to a registry tagged with the commit SHA (not
   `latest`, not a locally built image) - see the `:latest` warning already
   in `k8s/05-migration-job.yaml` / README section 16.
6. **Network**: add a reverse proxy, HTTPS/TLS, DNS, firewall; block the DB,
   Adminer, MinIO API, and MinIO Console ports from the public internet
   (same requirement `docs/production-deployment-guide.md` already states).
7. **PAUS**: use the real PAUS staging client ID/secret/issuer and register
   the staging redirect URI with Unpad's PAUS team.
8. **Bootstrap**: use the same controlled one-time bootstrap procedure
   (adapted to run against the VPS staging database), then delete the
   bootstrap credential file on the server the same way as section 19.
9. **Backup**: enable database + MinIO backups and run a restore drill (see
   `docs/vps-deployment-backup.md`).

Local staging rehearsal reduces configuration drift, but it does **not**
replace testing domain routing, HTTPS/TLS, firewall rules, real network
conditions, or the real PAUS SSO integration - those can only be verified on
the actual VPS staging server.
