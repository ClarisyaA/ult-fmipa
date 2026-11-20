/**
 * Inti sinkronisasi data master `mahasiswa` (modul murni, tanpa akses DB).
 *
 * Dipakai bersama oleh dua pintu masuk:
 *  - unggah Excel/CSV oleh Admin (/api/admin/master/mahasiswa/import)
 *  - sinkron otomatis dari sistem lain (/api/internal/mahasiswa-sync)
 *
 * Aturan (mengikuti sistem ULT lama):
 *  - Kunci data adalah NPM. NPM sudah ada -> diperbarui, belum ada -> ditambah.
 *  - Tidak pernah menghapus data.
 *  - Kolom kosong di sumber TIDAK menimpa data yang sudah ada.
 *
 * Catatan: file ini sengaja memakai sintaks TypeScript yang bisa di-strip
 * (tanpa enum / parameter property) agar bisa diuji langsung oleh test runner.
 */

export const MAX_IMPORT_ROWS = 50000;
export const MIN_ANGKATAN = 1950;

export class MahasiswaSyncError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "MahasiswaSyncError";
    this.statusCode = statusCode;
  }
}

export type MahasiswaField =
  | "npm"
  | "nama"
  | "kdPs"
  | "kdPa"
  | "programStudi"
  | "jenjang"
  | "angkatan"
  | "fak";

export type MahasiswaInput = {
  npm: string;
  nama: string;
  kdPs: string | null;
  kdPa: string | null;
  programStudi: string | null;
  jenjang: string | null;
  angkatan: number | null;
  fak: string | null;
};

export type RawRecord = {
  row: number;
  values: Partial<Record<MahasiswaField, unknown>>;
};

export type RowIssue = {
  row: number;
  npm: string;
  message: string;
};

export type ValidRecord = {
  row: number;
  data: MahasiswaInput;
};

export type ExistingMahasiswa = {
  nama: string | null;
  kdPs: string | null;
  kdPa: string | null;
  programStudi: string | null;
  jenjang: string | null;
  angkatan: number | null;
  fak: string | null;
};

export type MahasiswaDbData = {
  NAMA?: string;
  KD_PS?: string;
  KD_PA?: string;
  PROGRAM_STUDI?: string;
  JENJANG?: string;
  ANGKATAN?: number;
  FAK?: string;
};

export type SyncPlan = {
  inserts: MahasiswaInput[];
  updates: { npm: string; data: MahasiswaDbData }[];
  unchanged: number;
};

const FIELD_ALIASES: Record<MahasiswaField, string[]> = {
  npm: ["npm", "nim", "nomorpokokmahasiswa"],
  nama: ["nama", "namamahasiswa", "namalengkap"],
  kdPs: ["kodeprodi", "kdps", "kodeps", "kodeprogramstudi"],
  kdPa: ["kdpa", "kodepa"],
  programStudi: ["namaprodi", "programstudi", "prodi"],
  jenjang: ["jenjang", "namajenjang", "jenjangstudi"],
  angkatan: ["angkatan", "tahunmasuk"],
  fak: ["fak", "fakultas", "kodefakultas"],
};

// Urutan kolom template lama (A-F): NPM, Nama, Kode Prodi, Nama Prodi, Jenjang, Angkatan.
export const LEGACY_COLUMN_ORDER: MahasiswaField[] = [
  "npm",
  "nama",
  "kdPs",
  "programStudi",
  "jenjang",
  "angkatan",
];

// Judul kolom pada template lama (public/templates/temp_data_mahasiswa.xlsx, sheet "mhs").
export const TEMPLATE_HEADERS = [
  "NPM",
  "Nama",
  "Kode Prodi",
  "Nama Prodi",
  "Nama Jenjang",
  "Angkatan",
];

const MAX_LENGTH: Record<Exclude<MahasiswaField, "angkatan">, number> = {
  npm: 15,
  nama: 100,
  kdPs: 10,
  kdPa: 10,
  programStudi: 150,
  jenjang: 15,
  fak: 5,
};

const FIELD_LABEL: Record<MahasiswaField, string> = {
  npm: "NPM",
  nama: "Nama",
  kdPs: "Kode Prodi",
  kdPa: "Kode PA",
  programStudi: "Nama Prodi",
  jenjang: "Jenjang",
  angkatan: "Angkatan",
  fak: "Fakultas",
};

function canonicalHeader(value: unknown) {
  return toText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function toText(value: unknown): string {
  if (value === null || typeof value === "undefined") return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Cocokkan baris judul dengan field. Mengembalikan null bila NPM & Nama tidak ketemu. */
export function mapHeaderRow(headerRow: unknown[]): (MahasiswaField | null)[] | null {
  const mapped = headerRow.map((cell) => {
    const key = canonicalHeader(cell);
    if (!key) return null;
    for (const field of Object.keys(FIELD_ALIASES) as MahasiswaField[]) {
      if (FIELD_ALIASES[field].includes(key)) return field;
    }
    return null;
  });

  if (!mapped.includes("npm") || !mapped.includes("nama")) {
    return null;
  }

  return mapped;
}

function isBlankRow(row: unknown[]) {
  return row.every((cell) => toText(cell) === "");
}

/**
 * Kolom A-F yang judulnya tidak dikenali tetap dibaca menurut urutan template
 * lama, selama field-nya belum dipakai kolom lain. Jadi file lama yang
 * judulnya sedikit berbeda tetap terbaca tanpa perlu diubah.
 */
function fillLegacyPositions(
  headerMap: (MahasiswaField | null)[],
): (MahasiswaField | null)[] {
  const columns = [...headerMap];

  LEGACY_COLUMN_ORDER.forEach((field, index) => {
    if (!columns[index] && !columns.includes(field)) {
      columns[index] = field;
    }
  });

  return columns;
}

/**
 * Ubah matriks (baris pertama = judul) menjadi record mentah.
 * Bila judul tidak dikenali, dipakai urutan kolom template lama.
 * Baris yang sepenuhnya kosong dilewati.
 */
export function recordsFromMatrix(matrix: unknown[][]): {
  records: RawRecord[];
  usedLegacyOrder: boolean;
} {
  if (matrix.length === 0) {
    return { records: [], usedLegacyOrder: false };
  }

  const headerMap = mapHeaderRow(matrix[0]);
  const usedLegacyOrder = headerMap === null;
  const columns: (MahasiswaField | null)[] = headerMap
    ? fillLegacyPositions(headerMap)
    : LEGACY_COLUMN_ORDER;
  const records: RawRecord[] = [];

  for (let index = 1; index < matrix.length; index++) {
    const row = matrix[index];
    if (isBlankRow(row)) continue;

    const values: Partial<Record<MahasiswaField, unknown>> = {};
    columns.forEach((field, columnIndex) => {
      if (field) values[field] = row[columnIndex];
    });
    records.push({ row: index + 1, values });
  }

  return { records, usedLegacyOrder };
}

/** Untuk sumber otomatis: objek { npm, nama, ... } atau memakai nama judul kolom. */
export function recordsFromObjects(objects: unknown[]): RawRecord[] {
  const records: RawRecord[] = [];

  objects.forEach((item, index) => {
    const values: Partial<Record<MahasiswaField, unknown>> = {};

    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
        const canonical = canonicalHeader(key);
        for (const field of Object.keys(FIELD_ALIASES) as MahasiswaField[]) {
          if (FIELD_ALIASES[field].includes(canonical)) values[field] = value;
        }
      }
    }

    records.push({ row: index + 1, values });
  });

  return records;
}

/** Parser CSV sederhana (kutip ganda, koma atau titik koma, BOM). */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const delimiter = semicolons > commas ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

type NormalizeResult =
  | { ok: true; data: MahasiswaInput }
  | { ok: false; npm: string; message: string };

function parseAngkatan(value: unknown, maxYear: number): number | null | "invalid" {
  const text = toText(value);
  if (text === "") return null;

  const number = Number(text);
  if (!Number.isInteger(number) || number < MIN_ANGKATAN || number > maxYear) {
    return "invalid";
  }

  return number;
}

export function normalizeRecord(
  record: RawRecord,
  currentYear: number = new Date().getFullYear(),
): NormalizeResult {
  const npm = toText(record.values.npm).replace(/\s/g, "");

  if (!npm) {
    return { ok: false, npm: "", message: "NPM kosong." };
  }

  if (!/^[0-9A-Za-z]+$/.test(npm)) {
    return { ok: false, npm, message: "NPM hanya boleh berisi huruf dan angka." };
  }

  if (npm.length > MAX_LENGTH.npm) {
    return { ok: false, npm, message: `NPM melebihi ${MAX_LENGTH.npm} karakter.` };
  }

  const text: Record<Exclude<MahasiswaField, "angkatan">, string> = {
    npm,
    nama: toText(record.values.nama),
    kdPs: toText(record.values.kdPs),
    kdPa: toText(record.values.kdPa),
    programStudi: toText(record.values.programStudi),
    jenjang: toText(record.values.jenjang),
    fak: toText(record.values.fak),
  };

  if (!text.nama) {
    return { ok: false, npm, message: "Nama kosong." };
  }

  for (const field of Object.keys(MAX_LENGTH) as Exclude<MahasiswaField, "angkatan">[]) {
    if (text[field].length > MAX_LENGTH[field]) {
      return {
        ok: false,
        npm,
        message: `${FIELD_LABEL[field]} melebihi ${MAX_LENGTH[field]} karakter.`,
      };
    }
  }

  const angkatan = parseAngkatan(record.values.angkatan, currentYear);
  if (angkatan === "invalid") {
    return {
      ok: false,
      npm,
      message: `Angkatan tidak valid (harus tahun ${MIN_ANGKATAN}-${currentYear}).`,
    };
  }

  return {
    ok: true,
    data: {
      npm,
      nama: text.nama,
      kdPs: text.kdPs || null,
      kdPa: text.kdPa || null,
      programStudi: text.programStudi || null,
      jenjang: text.jenjang || null,
      angkatan,
      fak: text.fak || null,
    },
  };
}

/** Validasi semua record. NPM ganda di file: baris pertama dipakai, sisanya ditolak. */
export function validateRecords(
  records: RawRecord[],
  currentYear: number = new Date().getFullYear(),
): { valid: ValidRecord[]; issues: RowIssue[] } {
  const valid: ValidRecord[] = [];
  const issues: RowIssue[] = [];
  const firstRowByNpm = new Map<string, number>();

  for (const record of records) {
    const result = normalizeRecord(record, currentYear);

    if (!result.ok) {
      issues.push({ row: record.row, npm: result.npm, message: result.message });
      continue;
    }

    const firstRow = firstRowByNpm.get(result.data.npm);
    if (typeof firstRow === "number") {
      issues.push({
        row: record.row,
        npm: result.data.npm,
        message: `NPM ganda di file (sudah ada di baris ${firstRow}).`,
      });
      continue;
    }

    firstRowByNpm.set(result.data.npm, record.row);
    valid.push({ row: record.row, data: result.data });
  }

  return { valid, issues };
}

/**
 * Bandingkan data valid dengan isi tabel. Hanya kolom yang terisi di sumber
 * dan berbeda dari data lama yang dimasukkan ke pembaruan.
 */
export function buildSyncPlan(
  valid: ValidRecord[],
  existing: Map<string, ExistingMahasiswa>,
): SyncPlan {
  const plan: SyncPlan = { inserts: [], updates: [], unchanged: 0 };

  for (const { data } of valid) {
    const current = existing.get(data.npm);

    if (!current) {
      plan.inserts.push(data);
      continue;
    }

    const change: MahasiswaDbData = {};
    if (data.nama !== current.nama) change.NAMA = data.nama;
    if (data.kdPs !== null && data.kdPs !== current.kdPs) change.KD_PS = data.kdPs;
    if (data.kdPa !== null && data.kdPa !== current.kdPa) change.KD_PA = data.kdPa;
    if (data.programStudi !== null && data.programStudi !== current.programStudi) {
      change.PROGRAM_STUDI = data.programStudi;
    }
    if (data.jenjang !== null && data.jenjang !== current.jenjang) {
      change.JENJANG = data.jenjang;
    }
    if (data.angkatan !== null && data.angkatan !== current.angkatan) {
      change.ANGKATAN = data.angkatan;
    }
    if (data.fak !== null && data.fak !== current.fak) change.FAK = data.fak;

    if (Object.keys(change).length === 0) {
      plan.unchanged++;
    } else {
      plan.updates.push({ npm: data.npm, data: change });
    }
  }

  return plan;
}
