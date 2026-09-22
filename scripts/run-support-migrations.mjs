import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import mariadb from "mariadb";

const migrationsDir = path.join(process.cwd(), "database", "migrations");
const schemaOnly = process.argv.includes("--schema-only");

const connection = await mariadb.createConnection({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "ult_user",
  password: process.env.DB_PASSWORD ?? "ult_password",
  database: process.env.DB_NAME ?? "fmipa_sbpk",
  connectTimeout: 10000,
  multipleStatements: true,
  ...(process.env.DB_SSL === "true" ? { ssl: true } : {}),
});

try {
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    const statements = (schemaOnly ? sql.replace(/^\s*--.*$/gm, "") : sql)
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) =>
        schemaOnly ? /^(CREATE|ALTER)\b/i.test(statement) : Boolean(statement),
      );

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log(`Applied support migration: ${file}`);
  }
} finally {
  await connection.end();
}
