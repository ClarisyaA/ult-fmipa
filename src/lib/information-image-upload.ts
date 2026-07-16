import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

import { validateSafeSvgBuffer } from "@/lib/safe-svg";
import {
  getStorageDirectory,
  getStorageReference,
  resolveStoredFilePath,
} from "@/lib/storage-paths";

export type SavedInformationImageMetadata = {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

const informationImageDir = getStorageDirectory("information");
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

export class InformationImageUploadError extends Error {
  statusCode = 400;
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function getExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function validateInformationImage(file: File) {
  if (!file || file.size === 0) {
    throw new InformationImageUploadError("Gambar informasi tidak ditemukan.");
  }

  if (file.size > maxImageSizeBytes) {
    throw new InformationImageUploadError(
      `Gambar ${file.name} melebihi 2 MB.`
    );
  }

  if (
    !allowedMimeTypes.has(file.type) ||
    !allowedExtensions.has(getExtension(file.name))
  ) {
    throw new InformationImageUploadError(
      "Format gambar tidak didukung. Gunakan WEBP, PNG, JPG, JPEG, atau SVG."
    );
  }
}

export async function saveInformationImage(
  file: File
): Promise<SavedInformationImageMetadata> {
  validateInformationImage(file);
  await mkdir(informationImageDir, { recursive: true });

  const originalName = sanitizeFilename(file.name || "gambar-informasi");
  const extension = extensionByMimeType[file.type] ?? getExtension(originalName);
  const storedName = `${randomUUID()}${extension}`;
  const absolutePath = path.join(informationImageDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "image/svg+xml" && !validateSafeSvgBuffer(buffer)) {
    throw new InformationImageUploadError("File SVG mengandung konten yang tidak aman.");
  }

  await writeFile(absolutePath, buffer);

  return {
    originalName,
    storedName,
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath: getStorageReference("information", storedName),
  };
}

export async function deleteInformationImageFile(storagePath: string) {
  const storedName = path.basename(storagePath);

  if (!storedName) {
    return;
  }

  const absolutePath = resolveStoredFilePath("information", storedName);

  if (!absolutePath) {
    return;
  }

  await rm(absolutePath, { force: true });
}
