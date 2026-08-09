import { requireEnvFile, runDocker } from "./shared.mjs";

requireEnvFile();

console.log(
  "Running migrations in a one-shot container built from the same app image " +
    "(db:prisma-migrate then db:support-migrate). This requires " +
    "`pnpm staging:local:up` to already be running so the `db` service is reachable.",
);

// --no-deps: the app image has no mysql/mariadb CLI, and both migration
// scripts (scripts/deploy-prisma-migrations.mjs, scripts/run-support-migrations.mjs)
// talk to MariaDB directly via the `mariadb` JS driver, so only the `db`
// service needs to already be up - no need to also (re)trigger minio-init.
await runDocker([
  "run",
  "--rm",
  "--no-deps",
  "app",
  "sh",
  "-c",
  "pnpm db:prisma-migrate && pnpm db:support-migrate",
]);

console.log("Migrations complete: db:prisma-migrate + db:support-migrate.");
