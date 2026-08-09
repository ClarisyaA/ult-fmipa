import { randomUUID } from "crypto";
import path from "path";

import { deleteObject, uploadObject } from "@/lib/minio-storage";
import { validateSafeSvgBuffer } from "@/lib/safe-svg";
import {
  extractStoredName,
  getStorageReference,
  resolveObjectKey,
} from "@/lib/storage-paths";

export type SavedHomeActivityImageMetadata = {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

const maxImageSizeBytes = 2 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);
const allowedExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".svg"]);
const extensionByMimeType: Record<string, string> = {
  "image/webp": ".webp",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/svg+xml": ".svg",
};

export class HomeActivityImageUploadError extends Error {
  statusCode = 400;
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function getExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function validateHomeActivityImage(file: File) {
  if (!file || file.size === 0) {
    throw new HomeActivityImageUploadError("Gambar kegiatan tidak ditemukan.");
  }

  if (file.size > maxImageSizeBytes) {
    throw new HomeActivityImageUploadError(
      `Gambar ${file.name} melebihi 2 MB.`
    );
  }

  if (
    !allowedMimeTypes.has(file.type) ||
    !allowedExtensions.has(getExtension(file.name))
  ) {
    throw new HomeActivityImageUploadError(
      "Format gambar tidak didukung. Gunakan WEBP, PNG, JPG, JPEG, atau SVG."
    );
  }
}

export async function saveHomeActivityImage(
  file: File
): Promise<SavedHomeActivityImageMetadata> {
  validateHomeActivityImage(file);

  const originalName = sanitizeFilename(file.name || "gambar-kegiatan");
  const extension = extensionByMimeType[file.type] ?? getExtension(originalName);
  const storedName = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "image/svg+xml" && !validateSafeSvgBuffer(buffer)) {
    throw new HomeActivityImageUploadError("File SVG mengandung konten yang tidak aman.");
  }

  const objectKey = getStorageReference("homeActivities", storedName);
  await uploadObject(objectKey, buffer, file.type);

  return {
    originalName,
    storedName,
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath: objectKey,
  };
}

export async function deleteHomeActivityImageFile(storagePath: string | null) {
  if (!storagePath) {
    return;
  }

  const objectKey = resolveObjectKey("homeActivities", extractStoredName(storagePath));

  if (!objectKey) {
    return;
  }

  await deleteObject(objectKey);
}
