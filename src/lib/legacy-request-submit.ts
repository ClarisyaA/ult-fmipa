import { Prisma } from "@prisma/client";

import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type {
  CreateServiceRequestInput,
  CreateServiceRequestResult,
} from "@/types/submission";

type SupportedSubmissionTable =
  | "beasiswa"
  | "bebas_pinjaman"
  | "plagiarisme"
  | "referensi";

const supportedSubmissionTables = {
  beasiswa: "beasiswa",
  bebas_pinjaman: "bebas_pinjaman",
  plagiarisme: "plagiarisme",
  referensi: "referensi",
} satisfies Record<SupportedSubmissionTable, SupportedSubmissionTable>;

export class ServiceRequestSubmitError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ServiceRequestSubmitError";
    this.statusCode = statusCode;
  }
}

export function isSubmissionSupported(serviceSlug: string) {
  const service = getPublicServiceBySlug(serviceSlug);

  return Boolean(
    service &&
      service.sourceTable in supportedSubmissionTables &&
      service.slug === serviceSlug &&
      [
        "rekomendasi-beasiswa",
        "bebas-peminjaman",
        "cek-plagiarisme",
        "referensi",
      ].includes(service.slug)
  );
}

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function isSupportedTable(
  sourceTable: string
): sourceTable is SupportedSubmissionTable {
  return sourceTable in supportedSubmissionTables;
}

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

async function insertBeasiswa(
  sourceTable: SupportedSubmissionTable,
  input: CreateServiceRequestInput
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  await prisma.$executeRaw`
    INSERT INTO ${table}
      (\`NPM\`, \`BEASISWA\`, \`PERMINTAAN_TGL\`, \`PERMINTAAN_ENTRY\`, \`PERMINTAAN_IP\`)
    VALUES
      (${input.npm}, ${normalizeOptional(input.scholarshipName) ?? normalizeOptional(input.description)}, NOW(), ${"Website ULT"}, NULL)
  `;
  const rows = await prisma.$queryRaw<{ id: bigint | number | string }[]>`
    SELECT LAST_INSERT_ID() AS id
  `;

  return String(rows[0]?.id);
}

async function insertSimpleRequest(
  sourceTable: SupportedSubmissionTable,
  input: CreateServiceRequestInput
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  await prisma.$executeRaw`
    INSERT INTO ${table}
      (\`NPM\`, \`EMAIL\`, \`HP_WA\`, \`KETERANGAN\`, \`PERMINTAAN_TGL\`, \`PERMINTAAN_ENTRY\`, \`PERMINTAAN_IP\`)
    VALUES
      (${input.npm}, ${normalizeOptional(input.email)}, ${normalizeOptional(input.phone)}, ${normalizeOptional(input.description)}, NOW(), ${"Website ULT"}, NULL)
  `;
  const rows = await prisma.$queryRaw<{ id: bigint | number | string }[]>`
    SELECT LAST_INSERT_ID() AS id
  `;

  return String(rows[0]?.id);
}

export async function createServiceRequest(
  serviceSlug: string,
  input: CreateServiceRequestInput
): Promise<CreateServiceRequestResult> {
  const service = getPublicServiceBySlug(serviceSlug);

  if (!service) {
    throw new ServiceRequestSubmitError("Layanan tidak ditemukan.", 404);
  }

  if (!isSubmissionSupported(serviceSlug) || !isSupportedTable(service.sourceTable)) {
    throw new ServiceRequestSubmitError(
      "Pengajuan untuk layanan ini belum tersedia.",
      400
    );
  }

  const id =
    service.sourceTable === "beasiswa"
      ? await insertBeasiswa(service.sourceTable, input)
      : await insertSimpleRequest(service.sourceTable, input);

  return {
    id,
    serviceSlug: service.slug,
    serviceTitle: service.title,
    status: "pending",
  };
}
