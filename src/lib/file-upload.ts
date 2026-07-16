import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

import { defaultUploadRule, getServiceUploadRule } from "@/lib/service-upload-config";
import {
  getStorageDirectory,
  getStorageReference,
  resolveStoredFilePath,
} from "@/lib/storage-paths";
import type { SavedUploadMetadata } from "@/types/attachment";

const uploadDir = getStorageDirectory("uploads");

const extensionByMimeType: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export class FileUploadError extends Error {
  statusCode = 400;
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function validateUploadedFile(file: File, serviceSlug?: string) {
  const uploadRule =
    typeof serviceSlug === "string"
      ? getServiceUploadRule(serviceSlug)
      : defaultUploadRule;

  if (!file || file.size === 0) {
    throw new FileUploadError("File lampiran tidak ditemukan.");
  }

  if (!uploadRule.allowedMimeTypes.includes(file.type)) {
    throw new FileUploadError(
      uploadRule.allowedMimeTypes.length === 1 &&
        uploadRule.allowedMimeTypes[0] === "application/pdf"
        ? "Format lampiran harus PDF."
        : "Format lampiran harus PDF, JPG, atau PNG."
    );
  }

  if (file.size > uploadRule.maxFileSizeBytes) {
    throw new FileUploadError(
      `Ukuran lampiran maksimal ${Math.floor(
        uploadRule.maxFileSizeBytes / (1024 * 1024)
      )} MB.`
    );
  }
}

export async function saveUploadedFile(
  file: File,
  serviceSlug?: string
): Promise<SavedUploadMetadata> {
  validateUploadedFile(file, serviceSlug);
  await mkdir(uploadDir, { recursive: true });

  const originalName = sanitizeFilename(file.name || "lampiran");
  const extension = extensionByMimeType[file.type] ?? path.extname(originalName);
  const storedName = `${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return {
    originalName,
    storedName,
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath: getStorageReference("uploads", storedName),
  };
}

export async function deleteUploadedFile(storagePath: string) {
  const storedName = path.basename(storagePath);

  if (!storedName) {
    return;
  }

  const absolutePath = resolveStoredFilePath("uploads", storedName);

  if (!absolutePath) {
    return;
  }

  await rm(absolutePath, { force: true });
}
