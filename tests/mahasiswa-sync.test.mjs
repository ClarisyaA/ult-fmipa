import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import {
  dbUserNameFromSessionUserId,
  isStaffFeatureKey,
  STAFF_FEATURE_KEYS,
} from "@/lib/feature-access-core";
import { parseMahasiswaImportFile } from "@/lib/mahasiswa-import-file";
import {
  MahasiswaSyncError,
  TEMPLATE_HEADERS,
  buildSyncPlan,
  mapHeaderRow,
  normalizeRecord,
  parseCsv,
  recordsFromMatrix,
  recordsFromObjects,
  validateRecords,
} from "@/lib/mahasiswa-sync-core";
import {
  LOGIN_ERROR_NPM_NOT_REGISTERED,
  LOGIN_ERROR_REGISTRY_UNAVAILABLE,
  getLoginErrorMessage,
  isRegisteredNpmRequired,
} from "@/lib/paus-login-policy";

const require = createRequire(import.meta.url);

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const YEAR = 2026;

// --- Template lama (public/templates/temp_data_mahasiswa.xlsx) ---

test("judul kolom template lama dikenali sebagai NPM, Nama, Kode Prodi, Nama Prodi, Jenjang, Angkatan", () => {
  assert.deepEqual(mapHeaderRow(TEMPLATE_HEADERS), [
    "npm",
    "nama",
    "kdPs",
    "programStudi",
    "jenjang",
    "angkatan",
  ]);
});

test("file lama dengan judul kolom berbeda tetap dibaca menurut urutan kolom A-F", () => {
  const matrix = [
    ["NPM", "Nama Mahasiswa", "KD", "Prodi", "Level", "Thn"],
    ["140810250001", "Budi", "081", "Matematika", "Sarjana", "2025"],
  ];
  const { records, usedLegacyOrder } = recordsFromMatrix(matrix);

  assert.equal(usedLegacyOrder, false);
  assert.equal(records.length, 1);
  assert.equal(records[0].values.kdPs, "081");
  assert.equal(records[0].values.programStudi, "Matematika");
  assert.equal(records[0].values.jenjang, "Sarjana");
  assert.equal(records[0].values.angkatan, "2025");
});

test("tanpa baris judul yang dikenali, urutan kolom template lama dipakai", () => {
  const matrix = [
    ["a", "b", "c", "d", "e", "f"],
    ["140810250001", "Budi", "081", "Matematika", "Sarjana", 2025],
  ];
  const { records, usedLegacyOrder } = recordsFromMatrix(matrix);

  assert.equal(usedLegacyOrder, true);
  assert.equal(records[0].values.npm, "140810250001");
  assert.equal(records[0].values.angkatan, 2025);
});

test("baris kosong dilewati dan nomor baris mengikuti nomor di Excel", () => {
  const matrix = [
    TEMPLATE_HEADERS,
    ["140810250001", "Budi", "081", "Matematika", "Sarjana", 2025],
    ["", "", "", "", "", ""],
    ["140810250002", "Siti", "081", "Matematika", "Sarjana", 2025],
  ];
  const { records } = recordsFromMatrix(matrix);

  assert.deepEqual(
    records.map((record) => record.row),
    [2, 4],
  );
});

test("file xlsx asli dari template lama bisa dibaca setelah diisi", async () => {
  const ExcelJS = require("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(
    fileURLToPath(new URL("../public/templates/temp_data_mahasiswa.xlsx", import.meta.url)),
  );
  const sheet = workbook.worksheets[0];
  sheet.getRow(2).values = ["140810260001", "Ani Contoh", "081", "Matematika", "Sarjana (S-1)", "2026"];
  sheet.getRow(3).values = ["140810260002", "Dedi Contoh", "082", "Fisika", "Sarjana (S-1)", "2026"];
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  const { records } = await parseMahasiswaImportFile({
    name: "mahasiswa.xlsx",
    size: buffer.length,
    buffer,
  });
  const { valid, issues } = validateRecords(records, YEAR);

  assert.equal(issues.length, 0);
  assert.equal(valid.length, 2);
  assert.equal(valid[0].data.npm, "140810260001");
  assert.equal(valid[0].data.jenjang, "Sarjana (S-1)");
  assert.equal(valid[1].data.programStudi, "Fisika");
});

test("file selain .xlsx/.csv, kosong, atau palsu ditolak", async () => {
  await assert.rejects(
    () => parseMahasiswaImportFile({ name: "a.txt", size: 3, buffer: Buffer.from("abc") }),
    MahasiswaSyncError,
  );
  await assert.rejects(
    () => parseMahasiswaImportFile({ name: "a.xlsx", size: 0, buffer: Buffer.alloc(0) }),
    MahasiswaSyncError,
  );
  await assert.rejects(
    () => parseMahasiswaImportFile({ name: "a.xlsx", size: 5, buffer: Buffer.from("bukan") }),
    MahasiswaSyncError,
  );
});

// --- CSV ---

test("parseCsv menangani BOM, kutip ganda, dan pemisah titik koma", () => {
  assert.deepEqual(parseCsv('﻿NPM,Nama\n1,"Budi, S.Si"\n'), [
    ["NPM", "Nama"],
    ["1", "Budi, S.Si"],
  ]);
  assert.deepEqual(parseCsv("NPM;Nama\r\n1;Siti\r\n"), [
    ["NPM", "Nama"],
    ["1", "Siti"],
  ]);
});

// --- Validasi ---

test("NPM angka dari Excel dan spasi dirapikan", () => {
  const result = normalizeRecord({ row: 2, values: { npm: 140810250001, nama: "  Budi   Santoso " } }, YEAR);

  assert.equal(result.ok, true);
  assert.equal(result.data.npm, "140810250001");
  assert.equal(result.data.nama, "Budi Santoso");
});

test("baris tanpa NPM/nama, NPM aneh, terlalu panjang, atau angkatan tidak masuk akal ditolak", () => {
  const cases = [
    [{ nama: "Budi" }, /NPM kosong/],
    [{ npm: "1408 10-25", nama: "Budi" }, /huruf dan angka/],
    [{ npm: "1234567890123456", nama: "Budi" }, /melebihi 15/],
    [{ npm: "14081025", nama: "" }, /Nama kosong/],
    [{ npm: "14081025", nama: "Budi", jenjang: "x".repeat(16) }, /Jenjang melebihi 15/],
    [{ npm: "14081025", nama: "Budi", angkatan: 2027 }, /Angkatan tidak valid/],
    [{ npm: "14081025", nama: "Budi", angkatan: "abcd" }, /Angkatan tidak valid/],
  ];

  for (const [values, message] of cases) {
    const result = normalizeRecord({ row: 2, values }, YEAR);
    assert.equal(result.ok, false);
    assert.match(result.message, message);
  }
});

test("angkatan boleh kosong", () => {
  const result = normalizeRecord({ row: 2, values: { npm: "14081025", nama: "Budi" } }, YEAR);

  assert.equal(result.ok, true);
  assert.equal(result.data.angkatan, null);
});

test("NPM ganda di file: baris pertama dipakai, sisanya dilaporkan", () => {
  const { valid, issues } = validateRecords(
    [
      { row: 2, values: { npm: "1", nama: "A" } },
      { row: 3, values: { npm: "2", nama: "B" } },
      { row: 4, values: { npm: "1", nama: "C" } },
    ],
    YEAR,
  );

  assert.equal(valid.length, 2);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].row, 4);
  assert.match(issues[0].message, /baris 2/);
});

// --- Rencana: tambah / ubah / tidak berubah ---

function valid(data) {
  return {
    row: 2,
    data: {
      npm: "1",
      nama: "A",
      kdPs: null,
      kdPa: null,
      programStudi: null,
      jenjang: null,
      angkatan: null,
      fak: null,
      ...data,
    },
  };
}

test("NPM baru ditambah, NPM lama diperbarui, yang sama tidak berubah", () => {
  const existing = new Map([
    ["2", { nama: "B", kdPs: "081", kdPa: null, programStudi: "Mat", jenjang: "S1", angkatan: 2020, fak: null }],
    ["3", { nama: "C", kdPs: null, kdPa: null, programStudi: null, jenjang: null, angkatan: null, fak: null }],
  ]);
  const plan = buildSyncPlan(
    [
      valid({ npm: "1", nama: "A" }),
      valid({ npm: "2", nama: "B Baru", kdPs: "081", programStudi: "Mat", jenjang: "S1", angkatan: 2020 }),
      valid({ npm: "3", nama: "C" }),
    ],
    existing,
  );

  assert.equal(plan.inserts.length, 1);
  assert.equal(plan.inserts[0].npm, "1");
  assert.equal(plan.updates.length, 1);
  assert.deepEqual(plan.updates[0], { npm: "2", data: { NAMA: "B Baru" } });
  assert.equal(plan.unchanged, 1);
});

test("kolom kosong di file tidak menimpa data lama, dan tidak ada penghapusan", () => {
  const existing = new Map([
    ["1", { nama: "A", kdPs: "081", kdPa: "X", programStudi: "Mat", jenjang: "S1", angkatan: 2020, fak: "14" }],
  ]);
  const plan = buildSyncPlan([valid({ npm: "1", nama: "A" })], existing);

  assert.equal(plan.updates.length, 0);
  assert.equal(plan.unchanged, 1);
  assert.equal(plan.inserts.length, 0);
});

// --- Sumber otomatis ---

test("recordsFromObjects menerima nama field dengan berbagai penulisan", () => {
  const records = recordsFromObjects([
    { NPM: "1", Nama: "A", "Kode Prodi": "081", nama_prodi: "Mat", "Nama Jenjang": "S1", angkatan: 2025 },
    "bukan objek",
  ]);

  assert.deepEqual(records[0].values, {
    npm: "1",
    nama: "A",
    kdPs: "081",
    programStudi: "Mat",
    jenjang: "S1",
    angkatan: 2025,
  });
  assert.deepEqual(records[1].values, {});
});

// --- Akses fitur per staff ---

test("daftar fitur dan pemetaan id sesi ke USER_NAME", () => {
  assert.ok(STAFF_FEATURE_KEYS.includes("mahasiswa.import"));
  assert.equal(isStaffFeatureKey("mahasiswa.import"), true);
  assert.equal(isStaffFeatureKey("hapus.semua"), false);
  assert.equal(isStaffFeatureKey("toString"), false);
  assert.equal(dbUserNameFromSessionUserId("legacy-budi"), "budi");
  assert.equal(dbUserNameFromSessionUserId("paus-npm-123"), null);
  assert.equal(dbUserNameFromSessionUserId("legacy-"), null);
  assert.equal(dbUserNameFromSessionUserId(undefined), null);
});

test("API import Admin hanya untuk Admin, API Staff wajib punya akses fitur, keduanya memakai handler yang sama", async () => {
  const admin = await source("src/app/api/admin/master/mahasiswa/import/route.ts");
  const staff = await source("src/app/api/staff/master/mahasiswa/import/route.ts");

  assert.match(admin, /requireAdminApi\(\)/);
  assert.match(admin, /handleMahasiswaImportRequest/);
  assert.match(staff, /requireFeatureApi\("mahasiswa\.import"\)/);
  assert.match(staff, /handleMahasiswaImportRequest/);
  assert.doesNotMatch(staff, /requireAdminApi/);
});

test("halaman Staff import mengarahkan pergi bila tidak punya akses, dan menu hanya muncul bila diizinkan", async () => {
  const page = await source("src/app/staff/master/mahasiswa/page.tsx");
  const layout = await source("src/app/staff/layout.tsx");

  assert.match(page, /hasStaffFeatureAccess\(user, "mahasiswa\.import"\)/);
  assert.match(page, /redirect\("\/staff\/dashboard"\)/);
  assert.match(layout, /canImportMahasiswa/);
});

test("API pemberian akses: Admin saja, target harus akun Staff, fitur divalidasi, ada audit log", async () => {
  const route = await source("src/app/api/admin/system/access/route.ts");

  assert.match(route, /requireAdminApi\(\)/);
  assert.match(route, /isStaffFeatureKey\(feature\)/);
  assert.match(route, /role !== "STAFF"/);
  assert.match(route, /writeAuditLog/);
});

test("hasStaffFeatureAccess: Admin selalu boleh, Staff dicek ke tabel, gagal tertutup", async () => {
  const access = await source("src/lib/feature-access.ts");

  assert.match(access, /isRole\(user\.role, "ADMIN"\)\) return true/);
  assert.match(access, /isRole\(user\.role, "STAFF"\)\) return false/);
  assert.match(access, /ult_staff_feature_access/);
  assert.match(access, /catch \(error\) \{[\s\S]*return false;/);
});

test("migrasi tabel akses fitur idempoten", async () => {
  const migration = await source("database/migrations/013_create_staff_feature_access.sql");

  assert.match(migration, /CREATE TABLE IF NOT EXISTS `ult_staff_feature_access`/);
  assert.match(migration, /PRIMARY KEY \(`USER_NAME`, `FEATURE`\)/);
});

test("tab Role & Akses ada di halaman user", async () => {
  const users = await source("src/app/admin/system/users/page.tsx");
  const access = await source("src/app/admin/system/access/page.tsx");

  assert.match(users, /<SystemUsersTabs active="users" \/>/);
  assert.match(access, /<SystemUsersTabs active="access" \/>/);
});

// --- Pintu otomatis ---

test("endpoint sinkron otomatis mati tanpa token, wajib Bearer token, dan membandingkan token dengan aman", async () => {
  const route = await source("src/app/api/internal/mahasiswa-sync/route.ts");

  assert.match(route, /if \(!expected\) \{\s*return jsonError\("NOT_FOUND"/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /MIN_TOKEN_LENGTH = 32/);
  assert.match(route, /source: "otomatis"/);
  assert.doesNotMatch(route, /\bDELETE\b|\.delete\(/);
});

test("sinkronisasi tidak pernah menghapus data mahasiswa", async () => {
  const sync = await source("src/lib/mahasiswa-sync.ts");
  const core = await source("src/lib/mahasiswa-sync-core.ts");

  assert.doesNotMatch(sync, /\.delete(Many)?\(|DELETE\s+FROM|TRUNCATE\s+TABLE/i);
  assert.doesNotMatch(core, /delete/i);
});

// --- Cek NPM saat login PAUS ---

test("pesan error login: NPM belum terdaftar, data tidak bisa diperiksa, dan pesan umum", () => {
  assert.match(getLoginErrorMessage(LOGIN_ERROR_NPM_NOT_REGISTERED), /belum terdaftar.*hubungi ULT FMIPA/);
  assert.match(getLoginErrorMessage(LOGIN_ERROR_REGISTRY_UNAVAILABLE), /tidak dapat diperiksa/);
  assert.match(getLoginErrorMessage("AccessDenied"), /mahasiswa aktif dengan NPM yang valid/);
  assert.equal(getLoginErrorMessage(null), "");
});

test("pesan error login tidak pernah memuat NPM atau detail PAUS", () => {
  for (const code of [LOGIN_ERROR_NPM_NOT_REGISTERED, LOGIN_ERROR_REGISTRY_UNAVAILABLE, "AccessDenied"]) {
    assert.doesNotMatch(getLoginErrorMessage(code), /\d{6,}|token|secret/i);
  }
});

test("pemeriksaan NPM aktif secara default dan bisa dimatikan lewat PAUS_REQUIRE_REGISTERED_NPM=false", () => {
  assert.equal(isRegisteredNpmRequired({}), true);
  assert.equal(isRegisteredNpmRequired({ PAUS_REQUIRE_REGISTERED_NPM: "true" }), true);
  assert.equal(isRegisteredNpmRequired({ PAUS_REQUIRE_REGISTERED_NPM: "" }), true);
  assert.equal(isRegisteredNpmRequired({ PAUS_REQUIRE_REGISTERED_NPM: "false" }), false);
  assert.equal(isRegisteredNpmRequired({ PAUS_REQUIRE_REGISTERED_NPM: " FALSE " }), false);
});

test("pemeriksaan NPM ke tabel mahasiswa gagal tertutup dan hanya berlaku untuk login PAUS", async () => {
  const registry = await source("src/lib/mahasiswa-registry.ts");
  const auth = await source("src/lib/auth.ts");

  assert.match(registry, /prisma\.mahasiswa\.findUnique/);
  assert.match(registry, /LOGIN_ERROR_REGISTRY_UNAVAILABLE/);
  assert.match(auth, /checkPausStudentRegistered\(user\.npm\)/);
  // Login Admin/Staff (credentials) tidak terpengaruh.
  assert.match(auth, /async signIn\(\{ user, account, profile \}\) \{[\s\S]*return true;\s*\},\s*async jwt/);
});
