import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("bootstrap-admin-run refuses to run outside STAGING_LOCAL=true", async () => {
  const script = await source("scripts/staging-local/bootstrap-admin-run.mjs");

  assert.match(script, /process\.env\.STAGING_LOCAL\s*!==\s*"true"/);
  assert.match(script, /fail\(/);
});

test("bootstrap-admin-run refuses to run against a non-staging-local database", async () => {
  const script = await source("scripts/staging-local/bootstrap-admin-run.mjs");

  assert.match(
    script,
    /process\.env\.DB_NAME\s*!==\s*"fmipa_sbpk_staging_local"/,
  );
});

test("bootstrap-admin-run never logs the plaintext password", async () => {
  const script = await source("scripts/staging-local/bootstrap-admin-run.mjs");

  // The only console.log referencing the outcome must not interpolate the
  // `password` variable itself.
  const logLines = script.match(/console\.log\([^;]*\);/gs) ?? [];
  for (const line of logLines) {
    assert.doesNotMatch(line, /\$\{password\}/);
  }
  assert.match(script, /Password was not logged/);

  const wrapper = await source("scripts/staging-local/bootstrap-admin.mjs");
  assert.match(wrapper, /is not printed/);
  assert.doesNotMatch(wrapper, /console\.(log|error)\([^)]*STAGING_BOOTSTRAP_ADMIN_PASSWORD/);
});

test("bootstrap-admin-run always creates the account with APP_ROLE ADMIN and CONFIRMED active", async () => {
  const script = await source("scripts/staging-local/bootstrap-admin-run.mjs");

  assert.match(script, /APP_ROLE:\s*"ADMIN"/);
  assert.match(script, /CONFIRMED:\s*"1"/);
});

test("bootstrap-admin-run does not silently overwrite an existing user", async () => {
  const script = await source("scripts/staging-local/bootstrap-admin-run.mjs");

  assert.match(script, /findFirst\(\{\s*where:\s*\{\s*OR:\s*\[\{\s*USER_NAME:\s*username\s*\},\s*\{\s*EMAIL:\s*email\s*\}\]/s);
  assert.match(script, /already exists/);
  assert.doesNotMatch(script, /data_users\.(update|upsert)\(/);
});

test("bootstrap-admin-run uses the app's own legacy SHA-1 password hashing convention", async () => {
  const script = await source("scripts/staging-local/bootstrap-admin-run.mjs");
  const authDbUsers = await source("src/lib/auth-db-users.ts");

  assert.match(script, /createHash\("sha1"\)\.update\(plaintext,\s*"utf8"\)\.digest\("hex"\)/);
  assert.match(authDbUsers, /createHash\("sha1"\)\.update\(password,\s*"utf8"\)\.digest\("hex"\)/);
});

test("bootstrap-admin-run runs the insert inside a transaction", async () => {
  const script = await source("scripts/staging-local/bootstrap-admin-run.mjs");

  assert.match(script, /prisma\.\$transaction\(async \(tx\) => \{/);
  assert.match(script, /tx\.data_users\.create\(/);
});

test("local staging compose overlay hard-disables DEV_* credentials regardless of host env", async () => {
  const overlay = await source("docker-compose.staging-local.yml");

  for (const key of [
    "DEV_ADMIN_EMAIL",
    "DEV_ADMIN_PASSWORD",
    "DEV_STAFF_EMAIL",
    "DEV_STAFF_PASSWORD",
    "DEV_STUDENT_EMAIL",
    "DEV_STUDENT_PASSWORD",
  ]) {
    assert.match(overlay, new RegExp(`${key}:\\s*""`));
  }

  assert.match(overlay, /STAGING_LOCAL:\s*"true"/);
  assert.match(overlay, /NODE_ENV:\s*production/);
});

test("database login path (used by staging-local) does not depend on DEV_* env vars", async () => {
  const authDbUsers = await source("src/lib/auth-db-users.ts");

  assert.doesNotMatch(authDbUsers, /DEV_ADMIN|DEV_STAFF|DEV_STUDENT/);
  assert.match(authDbUsers, /export async function authorizeDbCredentialUser/);
});

test("admin user-management API stays the only account-creation path and stays admin-gated", async () => {
  const createApi = await source("src/app/api/admin/system/users/route.ts");

  assert.match(createApi, /requireAdminApi\(\)/);
  assert.match(createApi, /normalizeStaffAppRole/);
  // Confirms the endpoint can only produce ADMIN or STAFF accounts, never a
  // public/self-serve registration path.
  assert.doesNotMatch(createApi, /MAHASISWA/);
});

test("local staging overlay never exposes db/adminer/minio ports beyond loopback", async () => {
  const overlay = await source("docker-compose.staging-local.yml");
  const portLines = overlay.match(/^\s*-\s*"[^"]*:\d+:\d+"\s*$/gm) ?? [];

  assert.ok(portLines.length > 0, "expected at least one non-app port mapping");
  for (const line of portLines) {
    if (line.includes("3100:3000")) continue; // app port is intentionally public
    assert.match(line, /127\.0\.0\.1:/);
  }
});

test("import-baseline never targets anything other than fmipa_sbpk_staging_local and never drops the database", async () => {
  const script = await source("scripts/staging-local/import-baseline.mjs");

  assert.match(script, /TARGET_DB\s*=\s*"fmipa_sbpk_staging_local"/);
  assert.doesNotMatch(script, /DROP DATABASE/i);
  assert.doesNotMatch(script, /DROP TABLE/i);
});
