import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

export type SavedHomeActivityImageMetadata = {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

const activityImageDir = path.join(process.cwd(), "storage", "home-activities");
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
      `Format gambar ${file.name} tidak didukung.`
    );
  }
}

export async function saveHomeActivityImage(
  file: File
): Promise<SavedHomeActivityImageMetadata> {
  validateHomeActivityImage(file);
  await mkdir(activityImageDir, { recursive: true });

  const originalName = sanitizeFilename(file.name || "gambar-kegiatan");
  const extension = extensionByMimeType[file.type] ?? getExtension(originalName);
  const storedName = `${randomUUID()}${extension}`;
  const absolutePath = path.join(activityImageDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return {
    originalName,
    storedName,
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath: path.join("storage", "home-activities", storedName),
  };
}

export async function deleteHomeActivityImageFile(storagePath: string | null) {
  if (!storagePath) {
    return;
  }

  const storageRoot = path.resolve(process.cwd(), "storage", "home-activities");
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
