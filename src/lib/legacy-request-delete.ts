import { Prisma } from "@prisma/client";

import { getRequestDetail } from "@/lib/legacy-request-detail";
import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import { deleteRequestAttachmentsForRequest } from "@/lib/request-attachments";

const deletableSourceTables = new Set([
  "masih_kuliah_aktif",
  "masih_kuliah",
  "keterangan_lulus",
  "kpa",
  "legalisir",
  "transkrip",
  "bebas_pinjaman",
  "plagiarisme",
  "referensi",
  "unggah_karya_ilmiah",
  "surat_pengantar",
  "permohonan_magang",
  "beasiswa",
  "kelakuan_baik",
  "ijazah",
  "kks",
]);

export class RequestDeleteError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RequestDeleteError";
    this.statusCode = statusCode;
  }
}

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new RequestDeleteError("ID pengajuan tidak valid.", 400);
  }
}

function isMissingSurveyTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_service_surveys") &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

async function hasSurveyTable() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM ult_service_surveys LIMIT 1`;
    return true;
  } catch (error) {
    if (isMissingSurveyTableError(error)) {
      return false;
    }

    throw error;
  }
}

async function deleteRequestSurveyRows(
  serviceSlug: string,
  sourceTable: string,
  requestId: string
) {
  if (!(await hasSurveyTable())) {
    return 0;
  }

  const deleted = await prisma.$executeRaw`
    DELETE FROM ult_service_surveys
    WHERE SERVICE_SLUG = ${serviceSlug}
      AND SOURCE_TABLE = ${sourceTable}
      AND REQUEST_ID = ${BigInt(requestId)}
  `;

  return Number(deleted);
}

export async function deleteServiceRequest(serviceSlug: string, id: string) {
  assertValidId(id);

  const service = getPublicServiceBySlug(serviceSlug);

  if (!service || !deletableSourceTables.has(service.sourceTable)) {
    throw new RequestDeleteError(
      "Layanan tidak valid atau tidak mendukung hapus pengajuan.",
      400
    );
  }

  const detail = await getRequestDetail(service.slug, id);

  if (!detail) {
    throw new RequestDeleteError("Pengajuan tidak ditemukan.", 404);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("Deleting service request", {
      serviceSlug: service.slug,
      requestId: id,
      sourceTable: service.sourceTable,
    });
  }

  await deleteRequestAttachmentsForRequest(
    service.slug,
    service.sourceTable,
    id
  );
  await deleteRequestSurveyRows(service.slug, service.sourceTable, id);

  const table = Prisma.raw(quoteIdentifier(service.sourceTable));

  await prisma.$executeRaw`
    DELETE FROM ${table}
    WHERE \`ID\` = ${BigInt(id)}
    LIMIT 1
  `;

  return {
    serviceSlug: service.slug,
    sourceTable: service.sourceTable,
    requestId: id,
  };
}
