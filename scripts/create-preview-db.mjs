import "dotenv/config";
import mariadb from "mariadb";

const database = process.env.DB_NAME?.trim();
const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD"];
const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length || !database) {
  console.error(
    `Konfigurasi database belum lengkap: ${[...missing, ...(!database ? ["DB_NAME"] : [])].join(", ")}`,
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9_]*_preview$/.test(database)) {
  console.error(
    "DB_NAME harus bernama khusus preview dan berakhiran _preview.",
  );
  process.exit(1);
}

const connection = await mariadb.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectTimeout: 10000,
  ...(process.env.DB_SSL === "true" ? { ssl: true } : {}),
});

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`Database ${database} siap.`);
} finally {
  await connection.end();
}
