import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("role helper separates legacy positions from application roles", async () => {
  const roles = await source("src/lib/roles.ts");

  for (const position of ["ADMIN", "KRS", "OPERATOR", "PIMPINAN", "SUPER_USER"]) {
    assert.match(roles, new RegExp(`"${position}"`));
  }

  assert.match(roles, /PIMPINAN:\s*"ADMIN"/);
  assert.match(roles, /SUPER_USER:\s*"ADMIN"/);
  assert.match(roles, /ADMIN:\s*"ADMIN"/);
  assert.match(roles, /OPERATOR:\s*"STAFF"/);
  assert.match(roles, /KRS:\s*"STAFF"/);
  assert.match(roles, /export function normalizeUserPosition/);
  assert.match(roles, /export function normalizeAppRole/);
  assert.match(roles, /export function getDefaultAppRoleForPosition/);
});

test("NextAuth database login resolves APP_ROLE before ACCESS_CODE fallback", async () => {
  const authDbUsers = await source("src/lib/auth-db-users.ts");

  assert.match(authDbUsers, /APP_ROLE:\s*true/);
  assert.match(authDbUsers, /appRole:\s*user\.APP_ROLE/);
  assert.match(authDbUsers, /positionCode:\s*user\.ACCESS_CODE/);
  assert.match(authDbUsers, /positionCode:\s*user\.ACCESS_CODE/);
});

test("user management keeps position and app role as separate fields", async () => {
  const userActions = await source(
    "src/components/admin/master-actions/admin-master-actions.tsx",
  );
  const createApi = await source("src/app/api/admin/system/users/route.ts");
  const updateApi = await source(
    "src/app/api/admin/system/users/[username]/route.ts",
  );

  assert.match(userActions, /label="Posisi \/ Level"/);
  assert.match(userActions, /label="Akses Aplikasi"/);
  assert.match(userActions, /getDefaultAppRoleForPosition/);
  assert.match(userActions, /appRole:\s*form\.get\("appRole"\)/);

  assert.match(createApi, /data_access\.findUnique/);
  assert.match(createApi, /normalizeStaffAppRole/);
  assert.match(createApi, /ACCESS_CODE:\s*accessCode/);
  assert.match(createApi, /APP_ROLE:\s*appRole/);

  assert.match(updateApi, /data_access\.findUnique/);
  assert.match(updateApi, /normalizeStaffAppRole/);
  assert.match(updateApi, /ACCESS_CODE:\s*accessCode/);
  assert.match(updateApi, /APP_ROLE:\s*appRole/);
});

test("audit script plans APP_ROLE backfill without changing ACCESS_CODE", async () => {
  const audit = await source("scripts/audit-role-access.mjs");
  const backfill = await source("scripts/backfill-app-role.mjs");

  assert.match(audit, /Backfill plan for APP_ROLE only/);
  assert.match(audit, /PIMPINAN:\s*"ADMIN"/);
  assert.match(audit, /Dry-run only\. ACCESS_CODE and APP_ROLE were not changed\./);

  assert.match(backfill, /process\.argv\.includes\("--apply"\)/);
  assert.match(backfill, /data:\s*\{\s*APP_ROLE:\s*item\.appRole\s*\}/s);
  assert.doesNotMatch(backfill, /ACCESS_CODE:\s*item\.appRole/);
});
