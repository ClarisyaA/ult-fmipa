import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const serviceSuggestionStatuses = ["new", "reviewed", "archived"] as const;
export const serviceSuggestionSortOptions = ["newest", "oldest"] as const;

export type ServiceSuggestionStatus =
  (typeof serviceSuggestionStatuses)[number];
export type ServiceSuggestionSort = (typeof serviceSuggestionSortOptions)[number];

export type ServiceSuggestion = {
  id: string;
  nama: string;
  npm: string;
  layananDiajukan: string;
  detailLayanan: string;
  saranPeningkatan: string | null;
  status: ServiceSuggestionStatus;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export type ServiceSuggestionInput = {
  nama: string;
  npm: string;
  layananDiajukan: string;
  detailLayanan: string;
  saranPeningkatan?: string | null;
};

export type ServiceSuggestionUpdateInput = {
  status: ServiceSuggestionStatus;
  adminNote?: string | null;
};

export type ServiceSuggestionListOptions = {
  sort?: ServiceSuggestionSort;
};

export class ServiceSuggestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceSuggestionValidationError";
  }
}

export class ServiceSuggestionNotFoundError extends Error {
  constructor() {
    super("Usulan layanan tidak ditemukan.");
    this.name = "ServiceSuggestionNotFoundError";
  }
}

type ServiceSuggestionRow = {
  ID: bigint | number | string;
  NAMA: string;
  NPM: string;
  LAYANAN_DIAJUKAN: string;
  DETAIL_LAYANAN: string;
  SARAN_PENINGKATAN: string | null;
  STATUS: string;
  ADMIN_NOTE: string | null;
  CREATED_AT: Date;
  UPDATED_AT: Date | null;
};

const serviceSuggestionListOptionsSchema = z
  .object({
    sort: z.enum(serviceSuggestionSortOptions).optional(),
  })
  .optional();

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown) {
  const text = normalizeText(value);
  return text ? text : null;
}

function assertMaxLength(field: string, value: string, maxLength: number) {
  if (value.length > maxLength) {
    throw new ServiceSuggestionValidationError(
      `${field} maksimal ${maxLength} karakter.`,
    );
  }
}

function assertRequired(field: string, value: string, maxLength: number) {
  if (!value) {
    throw new ServiceSuggestionValidationError(`${field} wajib diisi.`);
  }

  assertMaxLength(field, value, maxLength);
}

export function parseServiceSuggestionInput(
  input: Record<string, unknown>,
  sessionNpm?: string | null,
) {
  const nama = normalizeText(input.nama);
  const npm = normalizeText(sessionNpm || input.npm);
  const layananDiajukan = normalizeText(input.layananDiajukan);
  const detailLayanan = normalizeText(input.detailLayanan);
  const saranPeningkatan = normalizeOptionalText(input.saranPeningkatan);

  assertRequired("Nama", nama, 200);
  assertRequired("NPM", npm, 50);
  assertRequired("Layanan yang ingin diajukan", layananDiajukan, 200);
  assertRequired("Detail layanan", detailLayanan, 2000);

  if (saranPeningkatan) {
    assertMaxLength("Saran peningkatan", saranPeningkatan, 2000);
  }

  return {
    nama,
    npm,
    layananDiajukan,
    detailLayanan,
    saranPeningkatan,
  } satisfies ServiceSuggestionInput;
}

export function parseServiceSuggestionStatus(value: unknown) {
  const status = normalizeText(value);

  if (!serviceSuggestionStatuses.includes(status as ServiceSuggestionStatus)) {
    throw new ServiceSuggestionValidationError("Status usulan layanan tidak valid.");
  }

  return status as ServiceSuggestionStatus;
}

export function parseServiceSuggestionSort(value: unknown): ServiceSuggestionSort {
  const result = z.enum(serviceSuggestionSortOptions).safeParse(value);

  return result.success ? result.data : "newest";
}

export function parseServiceSuggestionId(value: string) {
  if (!/^\d+$/.test(value)) {
    throw new ServiceSuggestionValidationError("ID usulan layanan tidak valid.");
  }

  return BigInt(value);
}

export function parseServiceSuggestionUpdateInput(input: Record<string, unknown>) {
  const status = parseServiceSuggestionStatus(input.status);
  const adminNote = normalizeOptionalText(input.adminNote);

  if (adminNote) {
    assertMaxLength("Catatan admin/staff", adminNote, 2000);
  }

  return {
    status,
    adminNote,
  } satisfies ServiceSuggestionUpdateInput;
}

function mapSuggestionRow(row: ServiceSuggestionRow): ServiceSuggestion {
  return {
    id: String(row.ID),
    nama: row.NAMA,
    npm: row.NPM,
    layananDiajukan: row.LAYANAN_DIAJUKAN,
    detailLayanan: row.DETAIL_LAYANAN,
    saranPeningkatan: row.SARAN_PENINGKATAN,
    status: serviceSuggestionStatuses.includes(row.STATUS as ServiceSuggestionStatus)
      ? (row.STATUS as ServiceSuggestionStatus)
      : "new",
    adminNote: row.ADMIN_NOTE,
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT,
  };
}

function normalizeListOptions(options?: ServiceSuggestionListOptions) {
  const result = serviceSuggestionListOptionsSchema.safeParse(options);

  return {
    sort: result.success ? (result.data?.sort ?? "newest") : "newest",
  };
}

function getSortOrder(sort: ServiceSuggestionSort) {
  return sort === "oldest"
    ? Prisma.sql`CREATED_AT ASC, ID ASC`
    : Prisma.sql`CREATED_AT DESC, ID DESC`;
}

export async function createServiceSuggestion(input: ServiceSuggestionInput) {
  const rows = await prisma.$transaction(async (tx) => {
    const affected = await tx.$executeRaw`
      INSERT INTO ult_service_suggestions
        (NAMA, NPM, LAYANAN_DIAJUKAN, DETAIL_LAYANAN, SARAN_PENINGKATAN)
      VALUES
        (${input.nama}, ${input.npm}, ${input.layananDiajukan}, ${input.detailLayanan}, ${input.saranPeningkatan})
    `;

    if (affected < 1) {
      throw new Error("Usulan layanan gagal disimpan.");
    }

    return tx.$queryRaw<Array<{ id: bigint | number | string }>>`
      SELECT LAST_INSERT_ID() AS id
    `;
  });

  return String(rows[0]?.id ?? "");
}

export async function getServiceSuggestions(options?: ServiceSuggestionListOptions) {
  const { sort } = normalizeListOptions(options);
  const orderBy = getSortOrder(sort);
  const rows = await prisma.$queryRaw<ServiceSuggestionRow[]>(
    Prisma.sql`
    SELECT
      ID,
      NAMA,
      NPM,
      LAYANAN_DIAJUKAN,
      DETAIL_LAYANAN,
      SARAN_PENINGKATAN,
      STATUS,
      ADMIN_NOTE,
      CREATED_AT,
      UPDATED_AT
    FROM ult_service_suggestions
    ORDER BY ${orderBy}
  `,
  );

  return rows.map(mapSuggestionRow);
}

export async function getServiceSuggestionById(id: bigint) {
  const rows = await prisma.$queryRaw<ServiceSuggestionRow[]>`
    SELECT
      ID,
      NAMA,
      NPM,
      LAYANAN_DIAJUKAN,
      DETAIL_LAYANAN,
      SARAN_PENINGKATAN,
      STATUS,
      ADMIN_NOTE,
      CREATED_AT,
      UPDATED_AT
    FROM ult_service_suggestions
    WHERE ID = ${id}
    LIMIT 1
  `;

  const suggestion = rows[0] ? mapSuggestionRow(rows[0]) : null;

  if (!suggestion) {
    throw new ServiceSuggestionNotFoundError();
  }

  return suggestion;
}

export async function updateServiceSuggestion(
  id: bigint,
  input: ServiceSuggestionUpdateInput,
) {
  const adminNoteValue =
    typeof input.adminNote === "undefined"
      ? Prisma.sql`ADMIN_NOTE`
      : Prisma.sql`${input.adminNote}`;

  const affected = await prisma.$executeRaw`
    UPDATE ult_service_suggestions
    SET STATUS = ${input.status}, ADMIN_NOTE = ${adminNoteValue}
    WHERE ID = ${id}
  `;

  if (affected < 1) {
    throw new ServiceSuggestionNotFoundError();
  }

  return getServiceSuggestionById(id);
}

export async function deleteServiceSuggestion(id: bigint) {
  const affected = await prisma.$executeRaw`
    DELETE FROM ult_service_suggestions
    WHERE ID = ${id}
  `;

  if (affected < 1) {
    throw new ServiceSuggestionNotFoundError();
  }
}
