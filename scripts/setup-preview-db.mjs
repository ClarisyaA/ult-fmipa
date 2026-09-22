import "dotenv/config";
import { spawnSync } from "node:child_process";
import path from "node:path";

const keys = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = keys.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Konfigurasi database belum lengkap: ${missing.join(", ")}`);
  process.exit(1);
}

if (!/^[a-z][a-z0-9_]*_preview$/.test(process.env.DB_NAME)) {
  console.error(
    "DB_NAME harus bernama khusus preview dan berakhiran _preview.",
  );
  process.exit(1);
}

const databaseUrl = new URL(
  `mysql://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
);
databaseUrl.username = encodeURIComponent(process.env.DB_USER);
databaseUrl.password = encodeURIComponent(process.env.DB_PASSWORD);
if (process.env.DB_SSL === "true") {
  databaseUrl.searchParams.set("sslaccept", "strict");
}

const env = { ...process.env, DATABASE_URL: databaseUrl.toString() };
const commands = [
  ["scripts/create-preview-db.mjs"],
  [path.join("node_modules", "prisma", "build", "index.js"), "db", "push"],
  ["scripts/run-support-migrations.mjs", "--schema-only"],
];

for (const args of commands) {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Skema database preview selesai dibuat tanpa data contoh.");
