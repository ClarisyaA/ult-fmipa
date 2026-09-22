import "dotenv/config";
import mariadb from "mariadb";

const required = [
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DEV_ADMIN_EMAIL",
  "DEV_ADMIN_PASSWORD",
  "DEV_STAFF_EMAIL",
  "DEV_STAFF_PASSWORD",
  "DEV_STUDENT_EMAIL",
  "DEV_STUDENT_PASSWORD",
  "DEV_STUDENT_NPM",
];

const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Konfigurasi preview belum lengkap: ${missing.join(", ")}`);
  process.exit(1);
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (
  databaseUrl.protocol !== "mysql:" ||
  databaseUrl.hostname !== process.env.DB_HOST ||
  Number(databaseUrl.port || 3306) !== Number(process.env.DB_PORT) ||
  decodeURIComponent(databaseUrl.username) !== process.env.DB_USER ||
  decodeURIComponent(databaseUrl.password) !== process.env.DB_PASSWORD ||
  decodeURIComponent(databaseUrl.pathname.slice(1)) !== process.env.DB_NAME
) {
  console.error(
    "DATABASE_URL dan DB_* harus mengarah ke database preview yang sama.",
  );
  process.exit(1);
}

const emails = ["DEV_ADMIN_EMAIL", "DEV_STAFF_EMAIL", "DEV_STUDENT_EMAIL"].map(
  (key) => process.env[key].trim().toLowerCase(),
);
if (new Set(emails).size !== 3) {
  console.error("Email ketiga akun uji harus berbeda.");
  process.exit(1);
}

const connection = await mariadb.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
});

try {
  const requiredTables = [
    "data_users",
    "mahasiswa",
    "masih_kuliah_aktif",
    "ult_information_posts",
    "ult_home_activities",
    "ult_profile_structure_nodes",
    "ult_request_attachments",
  ];
  for (const table of requiredTables) {
    const rows = await connection.query(
      "SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
      [process.env.DB_NAME, table],
    );
    if (Number(rows[0].total) !== 1) {
      throw new Error(`Tabel ${table} belum dibuat.`);
    }
  }

  const tables = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'",
    [process.env.DB_NAME],
  );
  for (const row of tables) {
    const table = row.table_name ?? row.TABLE_NAME;
    if (table === "_prisma_migrations") continue;
    const rows = await connection.query(
      `SELECT COUNT(*) AS total FROM \`${table}\``,
    );
    if (Number(rows[0].total) !== 0) {
      throw new Error(
        `Tabel ${table} berisi data; gunakan database preview baru yang kosong.`,
      );
    }
  }

  console.log(
    "Konfigurasi dan database preview siap. Seluruh tabel aplikasi kosong.",
  );
} finally {
  await connection.end();
}
