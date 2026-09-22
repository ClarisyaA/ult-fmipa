import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { parse } from "dotenv";

const file = ".env.preview.local";
const values = parse(await readFile(file, "utf8"));
const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = required.filter((key) => !values[key]?.trim());

if (missing.length || !/^[a-z][a-z0-9_]*_preview$/.test(values.DB_NAME ?? "")) {
  throw new Error(
    `Konfigurasi database preview belum siap: ${missing.join(", ") || "DB_NAME"}`,
  );
}

const url = new URL(
  `mysql://${values.DB_HOST}:${values.DB_PORT}/${values.DB_NAME}`,
);
url.username = encodeURIComponent(values.DB_USER);
url.password = encodeURIComponent(values.DB_PASSWORD);
if (values.DB_SSL === "true") url.searchParams.set("sslaccept", "strict");
values.DATABASE_URL = url.toString();

const randomSecret = () => randomBytes(24).toString("base64url");
if (
  values.NEXTAUTH_SECRET === "change-this-to-a-secure-secret-key-in-production"
) {
  values.NEXTAUTH_SECRET = randomSecret();
}
if (values.PAUS_BRIDGE_SECRET === "change-this-bridge-secret-key") {
  values.PAUS_BRIDGE_SECRET = randomSecret();
}

const accounts = [
  ["ADMIN", "admin@gmail.com", "admin123", "admin@preview.test"],
  ["STAFF", "staff@gmail.com", "staff123", "staff@preview.test"],
  ["STUDENT", "student@gmail.com", "student123", "mahasiswa@preview.test"],
];
for (const [role, exampleEmail, examplePassword, previewEmail] of accounts) {
  if (values[`DEV_${role}_EMAIL`] === exampleEmail) {
    values[`DEV_${role}_EMAIL`] = previewEmail;
  }
  if (values[`DEV_${role}_PASSWORD`] === examplePassword) {
    values[`DEV_${role}_PASSWORD`] = randomSecret();
  }
}

if (values.DEV_STUDENT_NPM === "140810230017") {
  values.DEV_STUDENT_NPM = "999999999999";
}
if (values.DEV_STUDENT_NAME === "Mahasiswa ULT") {
  values.DEV_STUDENT_NAME = "Mahasiswa Preview";
}
values.DB_CONNECTION_LIMIT = "2";
values.MAX_UPLOAD_SIZE_MB = "4";

await writeFile(
  file,
  `${Object.entries(values)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n")}\n`,
  { mode: 0o600 },
);
console.log(
  "Konfigurasi preview tersimpan di .env.preview.local tanpa menampilkan rahasia.",
);
