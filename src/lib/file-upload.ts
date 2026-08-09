import { randomUUID } from "crypto";
import path from "path";

import { deleteObject, uploadObject } from "@/lib/minio-storage";
import { defaultUploadRule, getServiceUploadRule } from "@/lib/service-upload-config";
import {
  extractStoredName,
  getStorageReference,
  resolveObjectKey,
} from "@/lib/storage-paths";
import type { SavedUploadMetadata } from "@/types/attachment";

const extensionByMimeType: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const mimeTypeByExtension: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const BANNED_EXECUTABLE_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".sh",
  ".cmd",
  ".ps1",
  ".vbs",
  ".scr",
  ".jar",
  ".php",
  ".phtml",
  ".php3",
  ".php4",
  ".php5",
  ".phps",
  ".js",
  ".py",
  ".pl",
  ".cgi",
  ".asp",
  ".aspx",
  ".jsp",
  ".dll",
  ".so",
  ".dylib",
  ".hvb",
  ".hta",
]);

export class FileUploadError extends Error {
  statusCode = 400;
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function getFileExtensions(filename: string): string[] {
  const parts = filename.toLowerCase().split(".").filter(Boolean);
  if (parts.length <= 1) {
    return [];
  }
  return parts.slice(1).map((ext) => `.${ext}`);
}

function hasExecutableOrSuspiciousExtension(filename: string): boolean {
  const exts = getFileExtensions(filename);
  for (const ext of exts) {
    if (BANNED_EXECUTABLE_EXTENSIONS.has(ext)) {
      return true;
    }
  }
  return false;
}

export function detectBufferSignatureMime(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 3) {
    return null;
  }

  // PDF check: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return "application/pdf";
  }

  // PNG check: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG check: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // WebP check: RIFF (bytes 0..3) + WEBP (bytes 8..11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function validateUploadedFile(file: File, serviceSlug?: string) {
  const uploadRule =
    typeof serviceSlug === "string"
      ? getServiceUploadRule(serviceSlug)
      : defaultUploadRule;

  if (!file || file.size === 0) {
    throw new FileUploadError("File lampiran tidak ditemukan.");
  }

  if (hasExecutableOrSuspiciousExtension(file.name)) {
    throw new FileUploadError("Ekstensi file tidak diizinkan.");
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

export function validateUploadedFileBuffer(
  file: File,
  buffer: Buffer,
  serviceSlug?: string
) {
  validateUploadedFile(file, serviceSlug);

  if (!buffer || buffer.length === 0) {
    throw new FileUploadError("Isi file lampiran kosong.");
  }

  const rawExt = path.extname(file.name).toLowerCase();
  const extMime = mimeTypeByExtension[rawExt];

  if (extMime && extMime !== file.type) {
    throw new FileUploadError(
      "Ekstensi file dan tipe MIME browser tidak konsisten."
    );
  }

  const uploadRule =
    typeof serviceSlug === "string"
      ? getServiceUploadRule(serviceSlug)
      : defaultUploadRule;

  const detectedMime = detectBufferSignatureMime(buffer);

  if (!detectedMime) {
    throw new FileUploadError(
      "Signature file tidak valid atau format tidak didukung."
    );
  }

  if (!uploadRule.allowedMimeTypes.includes(detectedMime)) {
    throw new FileUploadError(
      uploadRule.allowedMimeTypes.length === 1 &&
        uploadRule.allowedMimeTypes[0] === "application/pdf"
        ? "Format lampiran harus PDF."
        : "Format lampiran tidak diizinkan untuk layanan ini."
    );
  }

  if (detectedMime !== file.type) {
    throw new FileUploadError(
      "Tipe MIME file dipalsukan. Isi file tidak sesuai dengan deklarasi MIME."
    );
  }
}

export async function saveUploadedFile(
  file: File,
  serviceSlug?: string
): Promise<SavedUploadMetadata> {
  if (!file || file.size === 0) {
    throw new FileUploadError("File lampiran tidak ditemukan.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  validateUploadedFileBuffer(file, buffer, serviceSlug);

  const originalName = sanitizeFilename(file.name || "lampiran");
  const extension = extensionByMimeType[file.type] ?? path.extname(originalName);
  const storedName = `${randomUUID()}${extension}`;
  const objectKey = getStorageReference("uploads", storedName);

  await uploadObject(objectKey, buffer, file.type);

  return {
    originalName,
    storedName,
    mimeType: file.type,
    sizeBytes: buffer.length,
    storagePath: objectKey,
  };
}

export async function deleteUploadedFile(storagePath: string) {
  const objectKey = resolveObjectKey("uploads", extractStoredName(storagePath));

  if (!objectKey) {
    return;
  }

  await deleteObject(objectKey);
}
