# MinIO Storage Migration - Audit & Implementation Record

Status: **implemented** (local filesystem storage removed from the runtime
upload/delete/serve path; replaced with MinIO object storage). See
[`minio-storage-deployment.md`](./minio-storage-deployment.md) for
environment variables and per-environment deployment notes.

## 1. What was found (pre-migration state)

The entire filesystem-storage implementation funneled through **one
module**, `src/lib/storage-paths.ts`, which every upload/serve consumer
called into instead of touching `fs` paths directly. That made this a
much narrower migration than the folder count (5 storage areas, 8
consumer files) suggests.

### Filesystem implementations found

| File | Role |
| --- | --- |
| `src/lib/storage-paths.ts` | Central path/area resolution + traversal guard (`resolveStoredFilePath`) |
| `src/lib/file-upload.ts` | Generic request-attachment upload (PDF/JPG/PNG), `mkdir`+`writeFile`+`rm` |
| `src/lib/profile-image-upload.ts` | Profile org/location photo upload |
| `src/lib/information-image-upload.ts` | Information-post image upload |
| `src/lib/home-activity-image-upload.ts` | Home-activity image upload |
| `src/app/api/attachments/[id]/route.ts` | Serves request attachments (`createReadStream`) |
| `src/app/api/profile/images/[type]/[id]/route.ts` | Serves profile images (`readFile`) |
| `src/app/api/home/activities/images/[id]/route.ts` | Serves home-activity images (`readFile`) |
| `src/app/api/information/images/[imageId]/route.ts` | Serves information images (`readFile`) |
| `scripts/audit-storage-integrity.mjs` | Read-only DB-vs-disk integrity audit (uploads area only) |
| `Dockerfile` (line 41, pre-migration) | `mkdir -p` for all 5 storage subfolders in the runtime image |
| `docker-compose.yml` | Bind-mounted `./storage` (or `$ULT_STORAGE_HOST_PATH`) into `/app/storage` |
| `k8s/04-storage.yaml`, `k8s/06-app.yaml` | `PersistentVolumeClaim` mounted at `/app/storage` |

Everything else - `src/lib/request-attachments.ts`,
`src/lib/information-post-images.ts`, `src/lib/profile-cms.ts`,
`src/lib/home-activities.ts` - calls the four upload libs' `save*`/`delete*`
functions rather than touching storage directly, so **none of those
required changes**.

No Server Actions were found (`grep "use server"` over `src/` = 0 hits);
every upload/download path is a Route Handler under `app/api/**`.
`sharp` is a listed dependency but is not used anywhere in the upload
pipeline (only in a one-off build-time static-asset optimizer script) -
uploaded files are stored byte-for-byte after validation, no
resizing/transcoding to account for.

### Database reference format

Every file-bearing table stores **two separate fields**, not a filesystem
path:

- `STORED_NAME` (or `IMAGE_STORED_NAME` / `PHOTO_STORED_NAME`) - a
  collision-safe `randomUUID() + extension` filename. This is the field
  every serve route actually uses to locate the file.
- `STORAGE_PATH` (or `IMAGE_PATH` / `PHOTO_PATH`) - a relative reference
  string, e.g. `storage/uploads/<uuid>.pdf`. In the old code this was
  **only ever read via `path.basename(...)`** when deleting a file - the
  directory portion was always discarded. That is the property that made
  this migration safe without a bulk data rewrite (see §4).

Tables: `ult_request_attachments` (real Prisma model,
`prisma/schema.prisma:634-647`), plus three CMS tables accessed purely via
`prisma.$queryRaw`/`$executeRaw` (not Prisma models):
`ult_information_post_images`, `ult_home_activities`,
`ult_profile_organization_nodes` / `ult_profile_location_settings`.

## 2. Architecture decisions applied

1. **MinIO bucket is private.** `minio-init` (Compose) / the init Job
   (Kubernetes) explicitly runs `mc anonymous set none`, and nothing in
   the app ever issues presigned URLs or a public bucket policy.
2. **Browser never talks to MinIO directly.** The existing app routes
   (`/api/attachments/[id]`, `/api/profile/images/...`,
   `/api/home/activities/images/[id]`, `/api/information/images/[imageId]`)
   remain the only file-serving surface; they stream bytes from MinIO
   through the Next.js server. Frontend code is unchanged - it never knew
   about local disk paths and doesn't know about MinIO either.
3. **Database stores an object key, not a filesystem path, URL, or
   presigned link.** New writes to `STORAGE_PATH`/`IMAGE_PATH`/`PHOTO_PATH`
   now contain the current object key format (§3). `STORED_NAME` is
   unchanged (still the bare `uuid+ext` filename) since it was already the
   field every read path relies on.
4. **Folder → prefix mapping preserved 1:1** (§3).
5. **No bulk rewrite of existing database rows.** Old `STORAGE_PATH` values
   like `storage/uploads/<uuid>.pdf` are still readable: every consumer of
   that field already only ever extracted the basename, and the new
   `extractStoredName()` helper does the same extraction correctly
   cross-platform (including Windows backslashes and absolute legacy
   paths), then `resolveObjectKey()` re-validates and rebuilds a safe
   current-format object key from it. No migration of `STORAGE_PATH`
   string values in the database was necessary or performed.
6. **Path traversal guard preserved and strengthened.**
   `resolveObjectKey(area, storedName)` rejects: empty/null, null bytes,
   a leading `/` or `\`, a Windows drive letter (`C:...`), and - critically
   - anything that isn't a single bare path segment (so `..`, `../x`,
   `sub/x`, `sub\x` are all rejected). This is stricter than the old
   filesystem check in one respect: the old code used `path.basename()`
   (POSIX-only splitting) for the *delete* path, which would not have
   correctly stripped a Windows-style path if this app ever ran on
   Windows; the new `extractStoredName()` splits on both separators
   before taking the last segment.
7. **Node.js runtime pinned** on all four MinIO-backed routes via
   `export const runtime = "nodejs"` - the MinIO SDK is Node-only and must
   never be reachable from an Edge runtime.
8. **Streaming, not buffering, for reads.** All four serve routes call
   `getObjectStream()` and pipe the resulting Node `Readable` straight into
   the `Response` via `Readable.toWeb()` - no full-file buffering. Uploads
   still buffer in memory before `putObject` (matching the pre-migration
   behavior, which already buffered the whole `File` via
   `arrayBuffer()`); given the existing 2 MB (images) / configurable up to
   50 MB (attachments) caps, this was judged acceptable and out of scope
   to change further.

## 3. Object key format (final)

```
uploads/<uuid>.<ext>
information/<uuid>.<ext>
home-activities/<uuid>.<ext>
profile/organization/<uuid>.<ext>
profile/location/<uuid>.<ext>
```

Always built with `/` via `getStorageReference()` /
`resolveObjectKey()` in `src/lib/storage-paths.ts` - never with
`path.join`, so the key is identical regardless of the OS the server runs
on.

### Local folder → MinIO prefix mapping

| Local directory (pre-migration) | MinIO object prefix |
| --- | --- |
| `storage/uploads/` | `uploads/` |
| `storage/information/` | `information/` |
| `storage/home-activities/` | `home-activities/` |
| `storage/profile/organization/` | `profile/organization/` |
| `storage/profile/location/` | `profile/location/` |

## 4. Files changed

**New:**
- `src/lib/minio-storage.ts` - MinIO client singleton, config validation, `uploadObject`/`getObjectStream`/`getObjectBuffer`/`statObject`/`deleteObject`/`objectExists`/`isObjectNotFoundError`.
- `scripts/migrate-local-storage-to-minio.ts` + `scripts/run-storage-migration.mjs` - one-time local→MinIO migration script (dry-run by default).
- `tests/storage-minio.test.mjs` - object-key normalization + MinIO config-validation unit tests.
- `docs/minio-storage-audit.md` (this file), `docs/minio-storage-deployment.md`.
- `k8s/04b-minio-init-job.yaml`.

**Rewritten:**
- `src/lib/storage-paths.ts` - filesystem path builders replaced with object-key builders/validators (`getStorageReference`, `resolveObjectKey`, `extractStoredName`, `normalizeStorageReference`); `storedFileExists` now checks MinIO via `objectExists`.
- `scripts/audit-storage-integrity.mjs` - now lists MinIO objects (`listObjectsV2`) instead of `readdir`-ing local disk.

**Edited (fs → MinIO client calls, validation/business logic untouched):**
- `src/lib/file-upload.ts`, `src/lib/profile-image-upload.ts`, `src/lib/information-image-upload.ts`, `src/lib/home-activity-image-upload.ts`
- `src/app/api/attachments/[id]/route.ts`, `src/app/api/profile/images/[type]/[id]/route.ts`, `src/app/api/home/activities/images/[id]/route.ts`, `src/app/api/information/images/[imageId]/route.ts`
- `src/lib/profile-cms.ts` (`getProfileImageRecord` now also returns `sizeBytes` so the serve route can set `Content-Length` from the DB record instead of an extra MinIO `statObject` round-trip)
- `Dockerfile` (dropped the local `storage/` `mkdir` step)
- `docker-compose.yml` (added `minio` + `minio-init` services and `minio_data` volume; removed the app's local storage bind mount and `STORAGE_ROOT`)
- `k8s/01-secrets.yaml`, `k8s/02-configmap.yaml`, `k8s/04-storage.yaml`, `k8s/06-app.yaml`, `k8s/README.md`
- `.env`, `.env.example` (removed `STORAGE_ROOT`/`ULT_STORAGE_HOST_PATH`, added `MINIO_*`)
- `package.json` (`minio` dependency, `storage:migrate:minio` script)
- `scripts/run-unit-tests.mjs` (registered the new test file)

## 5. Backward compatibility

Handled by `extractStoredName()` + `resolveObjectKey()` in
`src/lib/storage-paths.ts`, exercised by every `delete*` function in the
four upload libs and by `normalizeStorageReference()` for any future read
path that needs it:

| Legacy reference shape | Result |
| --- | --- |
| `abc.pdf` (bare name) | `<area>/abc.pdf` |
| `uploads/abc.pdf` (current format) | `uploads/abc.pdf` |
| `storage/uploads/abc.pdf` (old relative reference) | `uploads/abc.pdf` |
| `/storage/uploads/abc.pdf` (leading slash) | `uploads/abc.pdf` |
| `storage\uploads\abc.pdf` (Windows separator) | `uploads/abc.pdf` |
| `D:\...\storage\uploads\abc.pdf` (legacy absolute path) | `uploads/abc.pdf` |
| `""`, `null`, `..`, `../x`, embedded null byte | `null` (rejected, safely no-ops on delete / 404s on serve) |

No old `STORAGE_PATH` value in the database needs to be rewritten for this
to work - see decision 5 in §2. `STORED_NAME` values (the field every
serve route actually keys off) were never a path in the first place.

**Not implemented / intentionally left alone:** a bulk SQL script to
rewrite historical `STORAGE_PATH`/`IMAGE_PATH` string values into the new
object-key text format. The instructions this migration followed
explicitly call for *not* mass-rewriting old DB values when they can be
normalized at read time - which they can be here - and for putting any
future rewrite in a separate, non-automatic script if ever needed. Nothing
in the current codebase reads `STORAGE_PATH` as anything other than "the
input to basename extraction", so there is no functional reason to rewrite
it.

## 6. Data migration strategy

`scripts/migrate-local-storage-to-minio.ts` (run via
`pnpm storage:migrate:minio`):

- Scans the five known local directories directly (not the database), so a
  stale DB row pointing at a file that no longer exists locally can never
  fail the run.
- Defaults to dry-run; requires `--execute` to actually upload.
- Skips objects that already exist in MinIO unless `--overwrite` is passed
  - safe to re-run any number of times.
- Never deletes a local file and never touches the database.
- Prints a summary (found / uploaded / skipped-existing / unknown-extension
  / failed) and exits non-zero on `--execute` if any upload failed.

```powershell
pnpm storage:migrate:minio -- --dry-run
pnpm storage:migrate:minio -- --execute
```

## 7. Docker & Kubernetes

See [`minio-storage-deployment.md`](./minio-storage-deployment.md) for the
full breakdown. Summary: `docker-compose.yml` gained `minio` (server,
healthchecked, persistent `minio_data` volume) and `minio-init`
(idempotent private-bucket bootstrap via `mc`); the app service no longer
mounts any local storage volume. `k8s/04-storage.yaml` was repurposed from
"app's local-storage PVC" into a MinIO `StatefulSet` + `Service` (mirroring
the existing MariaDB `StatefulSet` pattern already in this repo), with a
new `k8s/04b-minio-init-job.yaml` bucket-bootstrap Job. Non-secret MinIO
config lives in `k8s/02-configmap.yaml`; credentials live in
`k8s/01-secrets.yaml` (app) and a new `ult-fmipa-minio-secret` (server) -
these two secrets' credential values must be kept in sync by whoever
deploys this.

## 8. What was deliberately not changed, and why

- **`STORED_NAME` column values** - already collision-safe, already the
  field every read path uses; renaming/reformatting them would be a
  pointless, risky bulk write with zero functional benefit.
- **`STORAGE_PATH`/`IMAGE_PATH`/`PHOTO_PATH` historical values in the
  database** - see §5. Normalizable at read time, so left alone per the
  "don't mass-rewrite when normalization at read time is possible"
  instruction.
- **Prisma schema** - no new columns were needed. The existing
  `STORAGE_PATH VARCHAR(500)` easily fits the (shorter) new object-key
  format.
- **`storage/` directory and its `.gitignore` entries** - left in place
  and still git-ignored (aside from `.gitkeep` placeholders). It's no
  longer read or written by the running app, but it remains the *input*
  to the local→MinIO migration script, so deleting it or its `.gitignore`
  rules would break that tool. Once a deployment's migration has been
  verified (via `pnpm storage:audit`), removing the directory, its Docker
  bind mount references, and these `.gitignore` entries is a safe
  follow-up in a separate change - not done here per the "don't delete
  legacy runtime files automatically" instruction.
- **`sharp` dependency** - confirmed unused in the upload pipeline both
  before and after this migration; not touched.
- **Uploads still buffer the whole file in memory before `putObject`** -
  matches pre-migration behavior (the old code already buffered the whole
  `File` via `arrayBuffer()` before `writeFile`), and the existing
  per-service size caps (2 MB images, up to 50 MB attachments via
  `MAX_UPLOAD_SIZE_MB`) keep this bounded. Only the *read* path (routes
  serving files back to clients) was changed to stream, per the
  "prefer streaming for large files" instruction - that's the side where
  file size is attacker-influenced only indirectly (through the same
  upload caps) but where avoiding a full in-memory buffer on every GET
  matters more for concurrent request handling.

## 9. Known gaps / follow-ups (not yet verified - see final report)

- No MinIO instance was available in this environment to run against, so
  `docker compose up -d minio minio-init`, the manual QA checklist, and an
  end-to-end run of the migration script against real files could not be
  executed here. See the final summary for exactly what was and wasn't
  run.
- Route-level and upload/delete-service MinIO interaction tests
  (mocking `putObject`/`removeObject`/`getObject`) were not added - only
  the pure object-key normalization and config-validation logic is unit
  tested (`tests/storage-minio.test.mjs`). The security-critical
  path-traversal guard is fully covered; the MinIO SDK call sites
  themselves are not mock-tested in this pass.
- The pre-existing 4 orphaned attachment DB records noted in
  `docs/production-deployment-guide.md` (rows with no matching physical
  file) are unaffected by this migration - they'll show up the same way in
  `pnpm storage:audit` against MinIO (as `MISSING_OBJECT`) since they were
  never on disk to migrate.
