import { Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit-log";
import { getPrintableLetterService } from "@/lib/letters/letter-data";
import {
  getKeteranganLulusPrintReadiness,
  type KeteranganLulusPrintReadiness,
} from "@/lib/letters/keterangan-lulus-data";
import { getOfficialPrintReadiness } from "@/lib/letters/official-letter-data";
import type { OfficialLetterTemplate } from "@/lib/letters/letter-types";
import { prisma } from "@/lib/prisma";

type MetadataFieldType = "text" | "date" | "textarea";

export type LetterMetadataField = {
  name: string;
  label: string;
  type: MetadataFieldType;
  value: string;
  maxLength?: number;
};

export type LetterSignerOption = {
  id: number;
  name: string;
  nip: string;
  title: string;
  actingFor: string;
  rank: string;
};

export type LetterMetadataPayload = {
  serviceSlug: string;
  requestId: string;
  readiness: KeteranganLulusPrintReadiness | null;
  signerPickerAvailable: boolean;
  signerPickerMessage: string | null;
  signers: LetterSignerOption[];
  commonFields: LetterMetadataField[];
  serviceFields: LetterMetadataField[];
};

type FieldConfig = {
  name: string;
  label: string;
  type: MetadataFieldType;
  maxLength?: number;
  required?: boolean;
  numeric?: boolean;
};

type ServiceMetadataConfig = {
  sourceTable:
    | "keterangan_lulus"
    | "masih_kuliah"
    | "masih_kuliah_aktif"
    | "kelakuan_baik";
  template: OfficialLetterTemplate;
  commonFields: FieldConfig[];
  serviceFields: FieldConfig[];
};

const COMMON_TTD_FIELDS: FieldConfig[] = [
  { name: "TTD_NO_SURAT", label: "Nomor Surat", type: "text", maxLength: 30 },
  { name: "TTD_TANGGAL", label: "Tanggal Surat", type: "date" },
  { name: "TTD_TEMPAT", label: "Tempat Surat", type: "text", maxLength: 30 },
  {
    name: "TTD_PANGKAT_GOLONGAN",
    label: "Pangkat/Golongan Penandatangan",
    type: "text",
    maxLength: 50,
  },
  {
    name: "TTD_JABATAN",
    label: "Jabatan Penandatangan",
    type: "text",
    maxLength: 100,
  },
  {
    name: "TTD_NAMA",
    label: "Nama Penandatangan",
    type: "text",
    maxLength: 100,
  },
  { name: "TTD_NIP", label: "NIP Penandatangan", type: "text", maxLength: 30 },
];

const KETERANGAN_LULUS_COMMON_FIELDS: FieldConfig[] = [
  { name: "TTD_NO_SURAT", label: "Nomor Surat", type: "text", maxLength: 30 },
  { name: "TTD_TANGGAL", label: "Tanggal Surat", type: "date" },
  { name: "TTD_TEMPAT", label: "Tempat Surat", type: "text", maxLength: 30 },
  { name: "TTD_JABATAN", label: "Jabatan Penandatangan", type: "text", maxLength: 70 },
  { name: "TTD_NAMA", label: "Nama Penandatangan", type: "text", maxLength: 50 },
  { name: "TTD_NIP", label: "NIP Penandatangan", type: "text", maxLength: 30 },
];

const METADATA_CONFIG = {
  "keterangan-lulus": {
    sourceTable: "keterangan_lulus",
    template: "keterangan-lulus",
    commonFields: KETERANGAN_LULUS_COMMON_FIELDS,
    serviceFields: [
      { name: "TTD_TANGGAL_BERLAKU", label: "Tanggal Berlaku Surat", type: "date" },
      { name: "TTD_AN", label: "Atas Nama", type: "text", maxLength: 50 },
      { name: "TEMPAT_LAHIR", label: "Tempat Lahir", type: "text", maxLength: 100 },
      { name: "TGL_LAHIR", label: "Tanggal Lahir", type: "date" },
      { name: "TGL_LULUS", label: "Tanggal Lulus", type: "date", required: true },
      { name: "IPK", label: "IPK", type: "text", maxLength: 5, numeric: true },
      { name: "YUDISIUM", label: "Yudisium", type: "text", maxLength: 25 },
      { name: "DASAR_SURAT_NO", label: "Nomor Dasar Surat", type: "text", maxLength: 30 },
      {
        name: "DASAR_SURAT_PERIHAL",
        label: "Perihal Dasar Surat",
        type: "text",
        maxLength: 100,
      },
      { name: "DASAR_SURAT_TGL", label: "Tanggal Dasar Surat", type: "date" },
    ],
  },
  "ket-tunjangan-orang-tua": {
    sourceTable: "masih_kuliah",
    template: "masih-kuliah",
    commonFields: COMMON_TTD_FIELDS,
    serviceFields: [
      { name: "SEMESTER", label: "Semester", type: "text", maxLength: 25, numeric: true },
      { name: "TAHUN_AKADEMIK", label: "Tahun Akademik", type: "text", maxLength: 10 },
      { name: "NAMA_ORANG_TUA", label: "Nama Orang Tua/Wali", type: "text", maxLength: 100 },
      { name: "NIP_NRP", label: "NIP/NRP Orang Tua/Wali", type: "text", maxLength: 100 },
      {
        name: "PANGKAT_GOLONGAN",
        label: "Pangkat/Golongan Orang Tua/Wali",
        type: "text",
        maxLength: 100,
      },
      { name: "INSTANSI", label: "Instansi Orang Tua/Wali", type: "text", maxLength: 100 },
    ],
  },
  "keterangan-masih-kuliah": {
    sourceTable: "masih_kuliah_aktif",
    template: "masih-kuliah-aktif",
    commonFields: COMMON_TTD_FIELDS,
    serviceFields: [
      { name: "SEMESTER", label: "Semester", type: "text", maxLength: 11, numeric: true },
      { name: "TAHUN_AKADEMIK", label: "Tahun Akademik", type: "text", maxLength: 11 },
      { name: "ALAMAT", label: "Alamat", type: "textarea", maxLength: 200 },
      { name: "KEPERLUAN", label: "Keperluan", type: "text", maxLength: 100 },
    ],
  },
  "keterangan-kelakuan-baik": {
    sourceTable: "kelakuan_baik",
    template: "kelakuan-baik",
    commonFields: COMMON_TTD_FIELDS,
    serviceFields: [
      { name: "ALAMAT", label: "Alamat", type: "textarea", maxLength: 200 },
      { name: "KEPERLUAN", label: "Keperluan", type: "text", maxLength: 100 },
    ],
  },
} satisfies Record<string, ServiceMetadataConfig>;

type MetadataServiceSlug = keyof typeof METADATA_CONFIG;

export class LetterMetadataError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "LetterMetadataError";
    this.statusCode = statusCode;
  }
}

function isMetadataServiceSlug(slug: string): slug is MetadataServiceSlug {
  return slug in METADATA_CONFIG && Boolean(getPrintableLetterService(slug));
}

function assertValidRequest(serviceSlug: string, id: string) {
  if (!isMetadataServiceSlug(serviceSlug)) {
    throw new LetterMetadataError("Template surat tidak ditemukan.", 404);
  }

  if (!/^\d+$/.test(id)) {
    throw new LetterMetadataError("ID pengajuan tidak valid.", 400);
  }
}

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toFieldValue(value: unknown, type: MetadataFieldType) {
  if (type === "date") {
    return toDateInputValue(value as Date | string | null | undefined);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function buildFields(configs: FieldConfig[], row: Record<string, unknown>) {
  return configs.map((field) => ({
    name: field.name,
    label: field.label,
    type: field.type,
    value: toFieldValue(row[field.name], field.type),
    maxLength: field.maxLength,
  }));
}

async function getReadiness(serviceSlug: MetadataServiceSlug, id: string) {
  const config = METADATA_CONFIG[serviceSlug];

  if (config.template === "keterangan-lulus") {
    return getKeteranganLulusPrintReadiness(id);
  }

  return getOfficialPrintReadiness(config.template, id);
}

async function getMetadataRow(serviceSlug: MetadataServiceSlug, id: string) {
  const config = METADATA_CONFIG[serviceSlug];
  const columns = [
    "ID",
    ...new Set([
      ...config.commonFields.map((field) => field.name),
      ...config.serviceFields.map((field) => field.name),
    ]),
  ];
  const selectColumns = columns
    .map((column) => quoteIdentifier(column))
    .join(", ");
  const table = Prisma.raw(quoteIdentifier(config.sourceTable));
  const select = Prisma.raw(selectColumns);
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT ${select}
    FROM ${table}
    WHERE \`ID\` = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getLetterSigners(): Promise<LetterSignerOption[]> {
  const rows = await prisma.surat_ttd.findMany({
    orderBy: [{ NAMA: "asc" }, { ID: "asc" }],
    select: {
      ID: true,
      JABATAN: true,
      JABATAN_AN: true,
      PANGKAT_GOLONGAN: true,
      NAMA: true,
      NIP: true,
    },
  });

  return rows
    .filter((row) => row.NAMA || row.JABATAN || row.NIP)
    .map((row) => ({
      id: row.ID,
      name: row.NAMA ?? "",
      nip: row.NIP ?? "",
      title: row.JABATAN ?? "",
      actingFor: row.JABATAN_AN ?? "",
      rank: row.PANGKAT_GOLONGAN ?? "",
    }));
}

export async function getLetterMetadata(
  serviceSlug: string,
  id: string,
): Promise<LetterMetadataPayload> {
  assertValidRequest(serviceSlug, id);
  const slug = serviceSlug as MetadataServiceSlug;
  const config = METADATA_CONFIG[slug];
  const row = await getMetadataRow(slug, id);

  if (!row) {
    throw new LetterMetadataError("Pengajuan tidak ditemukan.", 404);
  }

  let signers: LetterSignerOption[] = [];

  try {
    signers = await getLetterSigners();
  } catch {
    signers = [];
  }

  return {
    serviceSlug,
    requestId: id,
    readiness: await getReadiness(slug, id),
    signerPickerAvailable: signers.length > 0,
    signerPickerMessage:
      signers.length > 0
        ? null
        : "Master penandatangan belum tersedia. Isi data penandatangan secara manual.",
    signers,
    commonFields: buildFields(config.commonFields, row),
    serviceFields: buildFields(config.serviceFields, row),
  };
}

function parseRequestDate(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new LetterMetadataError(`${label} tidak valid.`, 400);
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new LetterMetadataError(`${label} harus berupa tanggal valid.`, 400);
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new LetterMetadataError(`${label} harus berupa tanggal valid.`, 400);
  }

  return date;
}

function parseText(value: unknown, field: FieldConfig) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    throw new LetterMetadataError(`${field.label} tidak valid.`, 400);
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return null;
  }

  if (field.maxLength && trimmed.length > field.maxLength) {
    throw new LetterMetadataError(
      `${field.label} maksimal ${field.maxLength} karakter.`,
      400,
    );
  }

  if (field.numeric && !/^[0-9.,\s/-]+$/.test(trimmed)) {
    throw new LetterMetadataError(`${field.label} harus berupa angka.`, 400);
  }

  return trimmed;
}

function parseFieldValue(value: unknown, field: FieldConfig) {
  if (field.type === "date") {
    return parseRequestDate(value, field.label);
  }

  return parseText(value, field);
}

export async function updateLetterMetadata({
  serviceSlug,
  id,
  payload,
  actor,
  request,
}: {
  serviceSlug: string;
  id: string;
  payload: unknown;
  actor?: Parameters<typeof writeAuditLog>[0]["actor"];
  request?: Request;
}) {
  assertValidRequest(serviceSlug, id);

  if (typeof payload !== "object" || payload === null) {
    throw new LetterMetadataError("Payload tidak valid.", 400);
  }

  const slug = serviceSlug as MetadataServiceSlug;
  const config = METADATA_CONFIG[slug];
  const existing = await getMetadataRow(slug, id);

  if (!existing) {
    throw new LetterMetadataError("Pengajuan tidak ditemukan.", 404);
  }

  const input = payload as Record<string, unknown>;
  const allowedFields = [...config.commonFields, ...config.serviceFields];
  const data: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(input, field.name)) {
      data[field.name] = parseFieldValue(input[field.name], field);
    }
  }

  if (Object.keys(data).length === 0) {
    throw new LetterMetadataError("Tidak ada field surat yang dapat diperbarui.", 400);
  }

  if (config.sourceTable === "keterangan_lulus") {
    await prisma.keterangan_lulus.update({
      where: { ID: BigInt(id) },
      data,
    });
  } else if (config.sourceTable === "masih_kuliah") {
    await prisma.masih_kuliah.update({
      where: { ID: BigInt(id) },
      data,
    });
  } else if (config.sourceTable === "masih_kuliah_aktif") {
    await prisma.masih_kuliah_aktif.update({
      where: { ID: BigInt(id) },
      data,
    });
  } else {
    await prisma.kelakuan_baik.update({
      where: { ID: BigInt(id) },
      data,
    });
  }

  await writeAuditLog({
    actor,
    request,
    action: `Memperbarui data surat ${serviceSlug} #${id}`,
  });

  return getLetterMetadata(serviceSlug, id);
}
