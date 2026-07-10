import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { deleteUploadedFile } from "@/lib/file-upload";
import { prisma } from "@/lib/prisma";
import { getStudentRequestDetail } from "@/lib/student-request-history";
import type { RequestAttachment, SavedUploadMetadata } from "@/types/attachment";

type AttachmentRecord = {
  ID: bigint;
  SERVICE_SLUG: string;
  SOURCE_TABLE: string;
  REQUEST_ID: bigint;
  ORIGINAL_NAME: string;
  STORED_NAME: string;
  MIME_TYPE: string;
  SIZE_BYTES: number;
  STORAGE_PATH: string;
  UPLOADED_BY: string | null;
  UPLOADED_AT: Date;
  ATTACHMENT_TYPE: string | null;
};

type SaveAttachmentInput = {
  serviceSlug: string;
  sourceTable: string;
  requestId: string;
  uploadedBy?: string | null;
  attachmentType?: string | null;
  file: SavedUploadMetadata;
};

function ensureWhitelistedService(serviceSlug: string, sourceTable: string) {
  const service = getPublicServiceBySlug(serviceSlug);

  if (!service || service.sourceTable !== sourceTable) {
    return null;
  }

  return service;
}

function toBigIntId(value: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error("ID pengajuan tidak valid.");
  }

  return BigInt(value);
}

function toAttachment(record: AttachmentRecord): RequestAttachment {
  return {
    id: String(record.ID),
    serviceSlug: record.SERVICE_SLUG,
    sourceTable: record.SOURCE_TABLE,
    requestId: String(record.REQUEST_ID),
    originalName: record.ORIGINAL_NAME,
    storedName: record.STORED_NAME,
    mimeType: record.MIME_TYPE,
    sizeBytes: record.SIZE_BYTES,
    attachmentType: record.ATTACHMENT_TYPE,
    uploadedBy: record.UPLOADED_BY,
    uploadedAt: record.UPLOADED_AT.toISOString(),
  };
}

export async function saveRequestAttachmentMetadata({
  serviceSlug,
  sourceTable,
  requestId,
  uploadedBy,
  attachmentType,
  file,
}: SaveAttachmentInput) {
  if (!ensureWhitelistedService(serviceSlug, sourceTable)) {
    throw new Error("Layanan lampiran tidak valid.");
  }

  const created = await prisma.ult_request_attachments.create({
    data: {
      SERVICE_SLUG: serviceSlug,
      SOURCE_TABLE: sourceTable,
      REQUEST_ID: toBigIntId(requestId),
      ORIGINAL_NAME: file.originalName,
      STORED_NAME: file.storedName,
      MIME_TYPE: file.mimeType,
      SIZE_BYTES: file.sizeBytes,
      STORAGE_PATH: file.storagePath,
      UPLOADED_BY: uploadedBy,
      ATTACHMENT_TYPE: attachmentType ?? null,
    },
  });

  return toAttachment(created);
}

export async function getRequestAttachments(
  serviceSlug: string,
  sourceTable: string,
  requestId: string
) {
  if (!ensureWhitelistedService(serviceSlug, sourceTable)) {
    return [];
  }

  const records = await prisma.ult_request_attachments.findMany({
    where: {
      SERVICE_SLUG: serviceSlug,
      SOURCE_TABLE: sourceTable,
      REQUEST_ID: toBigIntId(requestId),
    },
    orderBy: {
      UPLOADED_AT: "asc",
    },
  });

  return records.map(toAttachment);
}

export async function getStudentRequestAttachments(
  serviceSlug: string,
  sourceTable: string,
  requestId: string,
  npm: string
) {
  const detail = await getStudentRequestDetail(npm, serviceSlug, requestId);

  if (!detail || detail.sourceTable !== sourceTable) {
    return [];
  }

  return getRequestAttachments(serviceSlug, sourceTable, requestId);
}

export async function getAttachmentRecordById(id: string) {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  return prisma.ult_request_attachments.findUnique({
    where: {
      ID: BigInt(id),
    },
  });
}

export async function deleteRequestAttachmentsForRequest(
  serviceSlug: string,
  sourceTable: string,
  requestId: string
) {
  if (!ensureWhitelistedService(serviceSlug, sourceTable)) {
    throw new Error("Layanan lampiran tidak valid.");
  }

  const records = await prisma.ult_request_attachments.findMany({
    where: {
      SERVICE_SLUG: serviceSlug,
      SOURCE_TABLE: sourceTable,
      REQUEST_ID: toBigIntId(requestId),
    },
  });

  for (const record of records) {
    await deleteUploadedFile(record.STORAGE_PATH);
  }

  await prisma.ult_request_attachments.deleteMany({
    where: {
      SERVICE_SLUG: serviceSlug,
      SOURCE_TABLE: sourceTable,
      REQUEST_ID: toBigIntId(requestId),
    },
  });

  return records.length;
}

export async function deleteRequestAttachmentsByType(
  serviceSlug: string,
  sourceTable: string,
  requestId: string,
  attachmentType: string
) {
  if (!ensureWhitelistedService(serviceSlug, sourceTable)) {
    throw new Error("Layanan lampiran tidak valid.");
  }

  const records = await prisma.ult_request_attachments.findMany({
    where: {
      SERVICE_SLUG: serviceSlug,
      SOURCE_TABLE: sourceTable,
      REQUEST_ID: toBigIntId(requestId),
      ATTACHMENT_TYPE: attachmentType,
    },
  });

  for (const record of records) {
    await deleteUploadedFile(record.STORAGE_PATH);
  }

  await prisma.ult_request_attachments.deleteMany({
    where: {
      SERVICE_SLUG: serviceSlug,
      SOURCE_TABLE: sourceTable,
      REQUEST_ID: toBigIntId(requestId),
      ATTACHMENT_TYPE: attachmentType,
    },
  });

  return records.length;
}
