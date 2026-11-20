import type { Session } from "next-auth";

import { writeAuditLog } from "@/lib/audit-log";
import {
  MAX_IMPORT_ROWS,
  MahasiswaSyncError,
  buildSyncPlan,
  validateRecords,
  type ExistingMahasiswa,
  type RawRecord,
  type RowIssue,
  type SyncPlan,
} from "@/lib/mahasiswa-sync-core";
import { prisma } from "@/lib/prisma";

export type SyncSource = "excel" | "otomatis";

export type SyncSummary = {
  mode: "preview" | "apply";
  totalRows: number;
  validRows: number;
  toInsert: number;
  toUpdate: number;
  unchanged: number;
  failedRows: number;
  issues: RowIssue[];
  issuesTruncated: boolean;
  inserted: number;
  updated: number;
};

const LOOKUP_CHUNK = 1000;
const INSERT_CHUNK = 500;
const UPDATE_CHUNK = 100;
const MAX_ISSUES_RETURNED = 100;

export { MahasiswaSyncError };

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function loadExisting(npms: string[]) {
  const existing = new Map<string, ExistingMahasiswa>();

  for (const part of chunk(npms, LOOKUP_CHUNK)) {
    const rows = await prisma.mahasiswa.findMany({
      where: { NPM: { in: part } },
      select: {
        NPM: true,
        NAMA: true,
        KD_PS: true,
        KD_PA: true,
        PROGRAM_STUDI: true,
        JENJANG: true,
        ANGKATAN: true,
        FAK: true,
      },
    });

    for (const row of rows) {
      existing.set(row.NPM, {
        nama: row.NAMA,
        kdPs: row.KD_PS,
        kdPa: row.KD_PA,
        programStudi: row.PROGRAM_STUDI,
        jenjang: row.JENJANG,
        angkatan: row.ANGKATAN,
        fak: row.FAK,
      });
    }
  }

  return existing;
}

async function applyPlan(plan: SyncPlan) {
  let inserted = 0;
  let updated = 0;

  for (const part of chunk(plan.inserts, INSERT_CHUNK)) {
    const result = await prisma.mahasiswa.createMany({
      data: part.map((item) => ({
        NPM: item.npm,
        NAMA: item.nama,
        KD_PS: item.kdPs,
        KD_PA: item.kdPa,
        PROGRAM_STUDI: item.programStudi,
        JENJANG: item.jenjang,
        ANGKATAN: item.angkatan,
        FAK: item.fak,
      })),
      skipDuplicates: true,
    });
    inserted += result.count;
  }

  for (const part of chunk(plan.updates, UPDATE_CHUNK)) {
    await prisma.$transaction(
      part.map((item) =>
        prisma.mahasiswa.update({ where: { NPM: item.npm }, data: item.data }),
      ),
    );
    updated += part.length;
  }

  return { inserted, updated };
}

/**
 * Validasi, bandingkan dengan tabel, lalu (bila mode "apply") simpan.
 * Mode "preview" tidak mengubah data apa pun.
 */
export async function runMahasiswaSync({
  records,
  mode,
  source,
  actor,
  request,
}: {
  records: RawRecord[];
  mode: "preview" | "apply";
  source: SyncSource;
  actor?: Session["user"] | null;
  request?: Request;
}): Promise<SyncSummary> {
  if (records.length === 0) {
    throw new MahasiswaSyncError("Tidak ada baris data yang bisa dibaca.");
  }

  if (records.length > MAX_IMPORT_ROWS) {
    throw new MahasiswaSyncError(
      `Jumlah baris melebihi batas ${MAX_IMPORT_ROWS}.`,
      413,
    );
  }

  const { valid, issues } = validateRecords(records);
  const existing = await loadExisting(valid.map((item) => item.data.npm));
  const plan = buildSyncPlan(valid, existing);

  let inserted = 0;
  let updated = 0;

  if (mode === "apply") {
    ({ inserted, updated } = await applyPlan(plan));

    await writeAuditLog({
      actor,
      request,
      action: `Mahasiswa: Sinkron ${source} +${inserted} ~${updated} =${plan.unchanged} gagal:${issues.length}`,
    });
  }

  return {
    mode,
    totalRows: records.length,
    validRows: valid.length,
    toInsert: plan.inserts.length,
    toUpdate: plan.updates.length,
    unchanged: plan.unchanged,
    failedRows: issues.length,
    issues: issues.slice(0, MAX_ISSUES_RETURNED),
    issuesTruncated: issues.length > MAX_ISSUES_RETURNED,
    inserted,
    updated,
  };
}
