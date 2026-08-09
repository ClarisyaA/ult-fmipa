import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import mariadb from "mariadb";

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

const connection = await mariadb.createConnection({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "ult_user",
  password: process.env.DB_PASSWORD ?? "ult_password",
  database: process.env.DB_NAME ?? "fmipa_sbpk",
  connectTimeout: 10000,
  multipleStatements: true,
});

async function ensurePrismaMigrationsTable() {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at DATETIME(3) NULL,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT NULL,
      rolled_back_at DATETIME(3) NULL,
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      applied_steps_count INT UNSIGNED NOT NULL DEFAULT 0
    )
  `);
}

async function isMigrationRecorded(migrationName) {
  const rows = await connection.query(
    "SELECT migration_name FROM _prisma_migrations WHERE migration_name = ? AND rolled_back_at IS NULL LIMIT 1",
    [migrationName]
  );

  return rows.length > 0;
}

try {
  await ensurePrismaMigrationsTable();

  const migrationNames = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migrationName of migrationNames) {
    if (await isMigrationRecorded(migrationName)) {
      console.log(`Prisma migration already recorded: ${migrationName}`);
      continue;
    }

    const sql = await readFile(
      path.join(migrationsDir, migrationName, "migration.sql"),
      "utf8"
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    const statements = sql
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    await connection.beginTransaction();

    try {
      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query(
        `INSERT INTO _prisma_migrations
          (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
         VALUES (?, ?, NOW(3), ?, NULL, NULL, NOW(3), ?)`,
        [randomUUID(), checksum, migrationName, statements.length]
      );

      await connection.commit();
      console.log(`Applied Prisma migration: ${migrationName}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
} finally {
  await connection.end();
}
