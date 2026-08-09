import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

import { captureDocker, composeArgs, requireEnvFile, rootDir } from "./shared.mjs";

// Hardcoded (never read from ambient env) so this script can only ever
// target the local staging database, regardless of what is set on the host
// shell or in staging-local.env.
const TARGET_DB = "fmipa_sbpk_staging_local";
const baselinePath = path.join(rootDir, "prisma", "migrations", "fmipa_sbpk.sql");
const force = process.argv.includes("--force");

requireEnvFile();

if (!existsSync(baselinePath)) {
  console.error("BLOCKED - legacy database baseline required.");
  console.error(
    `Expected file not found: ${path.relative(rootDir, baselinePath)}`,
  );
  console.error(
    "See docs/local-staging-rehearsal.md (\"Import baseline\") for how to obtain it. " +
      "This command intentionally does not fabricate a baseline.",
  );
  process.exit(1);
}

const sizeMb = (statSync(baselinePath).size / (1024 * 1024)).toFixed(1);
console.log(
  `Baseline file found (${sizeMb} MB). Its contents are not read or printed by this script.`,
);

// Refuse to silently overwrite an already-populated staging-local database.
// `data_users` only exists once a baseline (or equivalent) has already been
// imported, so its presence is used as the "already has data" signal.
const check = await captureDocker([
  "exec",
  "-T",
  "db",
  "sh",
  "-c",
  `mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${TARGET_DB}' AND table_name='data_users'"`,
]);

if (check.code !== 0) {
  console.error(
    "Could not check the target database (is `pnpm staging:local:up` running?).",
  );
  process.exit(check.code);
}

const alreadyImported = check.stdout.trim().endsWith("1");
if (alreadyImported && !force) {
  console.error(
    `Refusing to import: ${TARGET_DB} already has a "data_users" table, which means a baseline was already imported. ` +
      "Re-run with --force to import anyway (this will run the dump's own statements against the existing schema/data - it does not drop the database first).",
  );
  process.exit(1);
}

console.log(
  `Importing baseline into ${TARGET_DB} via the db container's own mariadb client...`,
);

const importCode = await new Promise((resolve, reject) => {
  const child = spawn(
    "docker",
    composeArgs([
      "exec",
      "-T",
      "db",
      "sh",
      "-c",
      `mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" ${TARGET_DB}`,
    ]),
    { cwd: rootDir, stdio: ["pipe", "inherit", "inherit"] },
  );

  child.on("error", reject);
  child.on("exit", (code) => resolve(code ?? 1));

  const fileStream = createReadStream(baselinePath);
  fileStream.on("error", reject);
  fileStream.pipe(child.stdin);
});

if (importCode !== 0) {
  console.error("Baseline import failed.");
  process.exit(importCode);
}

console.log("Baseline import complete. Next: pnpm staging:local:migrate");
