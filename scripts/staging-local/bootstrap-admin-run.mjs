// Runs INSIDE the staging-local app container only (see
// scripts/staging-local/bootstrap-admin.mjs, which invokes this via
// `docker compose run`). Creates the first Admin account for the local
// staging rehearsal database. Not reachable from any HTTP route - there is
// no public registration endpoint, this is a one-off container command.
import { createHash } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function fail(message) {
  console.error(`Bootstrap admin failed: ${message}`);
  process.exit(1);
}

// --- Guard 1: this must be the local staging environment ---
if (process.env.STAGING_LOCAL !== "true") {
  fail(
    'STAGING_LOCAL must be exactly "true". Refusing to run against a non-staging-local environment.',
  );
}

// --- Guard 2: this must be the local staging database ---
if (process.env.DB_NAME !== "fmipa_sbpk_staging_local") {
  fail(
    `DB_NAME must be "fmipa_sbpk_staging_local", got "${process.env.DB_NAME ?? ""}". Refusing to run against a different database.`,
  );
}

const username = (process.env.STAGING_BOOTSTRAP_ADMIN_USERNAME ?? "").trim();
const email = (process.env.STAGING_BOOTSTRAP_ADMIN_EMAIL ?? "").trim();
const fullName = (process.env.STAGING_BOOTSTRAP_ADMIN_NAME ?? "").trim();
const password = process.env.STAGING_BOOTSTRAP_ADMIN_PASSWORD ?? "";
const accessCode = (process.env.STAGING_BOOTSTRAP_ADMIN_ACCESS_CODE || "SUPER_USER")
  .trim()
  .toUpperCase();
const unitIdRaw = process.env.STAGING_BOOTSTRAP_ADMIN_UNIT_ID;

// Same field-length/shape rules as prisma/schema.prisma's data_users model
// and the admin user-management API (src/app/api/admin/system/users/route.ts).
if (!username || username.length > 20) {
  fail("STAGING_BOOTSTRAP_ADMIN_USERNAME is required and must be at most 20 characters.");
}
if (!email || email.length > 50 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail("STAGING_BOOTSTRAP_ADMIN_EMAIL is required, must look like an email, and be at most 50 characters.");
}
if (!fullName || fullName.length > 50) {
  fail("STAGING_BOOTSTRAP_ADMIN_NAME is required and must be at most 50 characters.");
}
if (!password || password.length < 8) {
  fail("STAGING_BOOTSTRAP_ADMIN_PASSWORD is required and must be at least 8 characters. Plaintext is never logged.");
}

let unitId = null;
if (unitIdRaw) {
  try {
    unitId = BigInt(unitIdRaw);
  } catch {
    fail(`STAGING_BOOTSTRAP_ADMIN_UNIT_ID "${unitIdRaw}" is not a valid integer.`);
  }
}

// Same legacy SHA-1 storage convention as src/lib/auth-db-users.ts
// hashLegacyPassword. Duplicated intentionally (this script must not depend
// on TS path-aliased app code) - keep in sync if that helper ever changes.
function hashLegacyPassword(plaintext) {
  return createHash("sha1").update(plaintext, "utf8").digest("hex");
}

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "db",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME,
  connectionLimit: 3,
});
const prisma = new PrismaClient({ adapter });

try {
  const passwordHash = hashLegacyPassword(password);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.data_users.findFirst({
      where: { OR: [{ USER_NAME: username }, { EMAIL: email }] },
      select: { USER_NAME: true },
    });
    if (existing) {
      throw new Error(
        `A user with this username or email already exists ("${existing.USER_NAME}"). Bootstrap does not overwrite existing accounts - manage it via admin user management instead, or pick a different username/email.`,
      );
    }

    const access = await tx.data_access.findUnique({
      where: { ACCESS_CODE: accessCode },
      select: { ACCESS_CODE: true },
    });
    if (!access) {
      throw new Error(
        `ACCESS_CODE "${accessCode}" was not found in data_access. This table is normally populated by the legacy baseline import (pnpm staging:local:import-baseline) - run that first, or set STAGING_BOOTSTRAP_ADMIN_ACCESS_CODE to a value that already exists.`,
      );
    }

    let resolvedUnitId = unitId;
    if (resolvedUnitId !== null) {
      const unit = await tx.data_unit.findUnique({
        where: { UNIT_ID: resolvedUnitId },
        select: { UNIT_ID: true },
      });
      if (!unit) {
        throw new Error(`UNIT_ID ${unitIdRaw} was not found in data_unit.`);
      }
    } else {
      const unit = await tx.data_unit.findFirst({
        orderBy: { UNIT_ID: "asc" },
        select: { UNIT_ID: true },
      });
      if (!unit) {
        throw new Error(
          "data_unit has no rows. This table is normally populated by the legacy baseline import (pnpm staging:local:import-baseline) - run that first, or set STAGING_BOOTSTRAP_ADMIN_UNIT_ID explicitly.",
        );
      }
      resolvedUnitId = unit.UNIT_ID;
    }

    await tx.data_users.create({
      data: {
        USER_NAME: username,
        FULL_NAME: fullName,
        EMAIL: email,
        TELEPHONE: null,
        CONFIRMED: "1",
        PASSWORD: passwordHash,
        // data_users.UNIT_ID is Int while data_unit.UNIT_ID (its logical
        // reference) is BigInt - same Number(...) conversion as
        // src/app/api/admin/system/users/route.ts.
        UNIT_ID: Number(resolvedUnitId),
        ACCESS_CODE: accessCode,
        APP_ROLE: "ADMIN",
        TIME_INSERT: new Date(),
        TIME_UPDATE: new Date(),
      },
    });
  });

  console.log(
    `Admin bootstrap complete: username="${username}" APP_ROLE=ADMIN CONFIRMED=1. Password was not logged or persisted in plaintext.`,
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}
