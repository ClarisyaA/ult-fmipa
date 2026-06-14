import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

import type { SavedUploadMetadata } from "@/types/attachment";

const uploadDir = path.join(process.cwd(), "storage", "uploads");
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const maxFileSizeBytes = 5 * 1024 * 1024;

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

export function validateUploadedFile(file: File) {
  if (!file || file.size === 0) {
    throw new FileUploadError("File lampiran tidak ditemukan.");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new FileUploadError("Format lampiran harus PDF, JPG, atau PNG.");
  }

  if (file.size > maxFileSizeBytes) {
    throw new FileUploadError("Ukuran lampiran maksimal 5 MB.");
  }
}

export async function saveUploadedFile(file: File): Promise<SavedUploadMetadata> {
  validateUploadedFile(file);
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
    storagePath: path.join("storage", "uploads", storedName),
  };
}

export async function deleteUploadedFile(storagePath: string) {
  const storageRoot = path.resolve(process.cwd(), "storage", "uploads");
  const storedName = path.basename(storagePath);

  if (!storedName) {
    return;
  }

  const absolutePath = path.join(storageRoot, storedName);

  if (
    absolutePath === storageRoot ||
    !absolutePath.startsWith(`${storageRoot}${path.sep}`)
  ) {
    return;
  }

  await rm(absolutePath, { force: true });
}
