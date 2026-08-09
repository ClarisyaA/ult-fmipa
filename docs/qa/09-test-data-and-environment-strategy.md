# Test Data and Environment Strategy

## Environment Matrix

| Environment | Purpose | Data policy | Gap |
|---|---|---|---|
| Host development | fast manual/dev tests | do not reset shared DB | port confusion possible |
| Docker local | production-like app/storage path | use dedicated DB volume or throwaway project | seed/reset scripts need test mode |
| Test/QA | release validation | isolated database and storage | not confirmed |
| Production-like | final release sign-off | sanitized snapshot only | not confirmed |

## User Matrix

| User type | Required attributes | Provisioning |
|---|---|---|
| Student | role student, NPM, name, email | secure fixture credentials or PAUS bridge |
| Staff | role staff, access code allowed by config | secure fixture credentials |
| Admin | role admin, system access | secure fixture credentials |
| Unauthorized/expired | no token or invalid token | browser context without storage |

Do not document real passwords. Store secrets in local env/CI secrets.

## Required Data States

- No requests, one request, many requests.
- Every major status and pending/in process/complete states.
- Printable request for each printable service.
- SIK pending proof, approved proof, rejected proof, final submitted.
- Information with no image, one image, multiple images, missing physical image.
- Activity with valid image and missing physical image.
- Profile structure/location records and missing images.
- Service suggestion open/in review/resolved/rejected.
- Survey pending/submitted/duplicate.
- Student master and alumni tracer records.
- System users for admin/staff/student-like access.
- Database unavailable state.

## File Fixtures

- `fixtures/files/safe.png`, `safe.jpg`, `safe.svg`.
- `fixtures/files/invalid-script.svg`.
- `fixtures/files/oversized.bin` or generated oversize file.
- `fixtures/files/attachment.pdf`.
- `fixtures/files/unsupported.txt`.
- PDF expected snapshots for printable services after stakeholder approval.

## Seed Strategy

- Prefer a separate test database and idempotent seed script.
- Tag all generated records with a run id in titles/notes where schema allows.
- For legacy tables, store created ids for cleanup.
- Avoid destructive reset of the developer main DB.

## Cleanup Strategy

- Delete only run-id records.
- Remove uploaded files linked to created records.
- Restore shared CMS data if mutated.
- For password reset, restore original test hash or recreate test user.

## Docker/Host Differences

- File storage is MinIO (object storage, private bucket) for both host dev
  and Docker - there is no `/app/storage` filesystem mount anymore. See
  `docs/minio-storage-deployment.md`.
- `MINIO_ENDPOINT` differs by context: `localhost` when Next.js runs on the
  host (MinIO still in Docker), `minio` when the `app` service itself runs
  in Docker Compose. Do not mix the two.
- Docker exposes app `3000`, DB host `13306`, Adminer `8081`, MinIO API
  `9000`, MinIO console `9001`.
- Host and container servers can both run (not simultaneously against the
  same port); always record base URL and which `MINIO_ENDPOINT` was active.

