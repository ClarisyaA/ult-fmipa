import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/error-utils";
import {
  deleteHomeActivityImageFile,
  saveHomeActivityImage,
  type SavedHomeActivityImageMetadata,
} from "@/lib/home-activity-image-upload";
import { storedFileExists } from "@/lib/storage-paths";

export type HomeActivityImageFit = "cover" | "contain";

export type HomeActivityImage = {
  id: string;
  activityId: string;
  imagePath: string | null;
  imageOriginalName: string | null;
  imageStoredName: string | null;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  imageAlt: string | null;
  imageFit: HomeActivityImageFit;
  isCover: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

type ImageRecord = {
  ID: bigint | number | string;
  ACTIVITY_ID: bigint | number | string;
  IMAGE_PATH: string | null;
  IMAGE_ORIGINAL_NAME: string | null;
  IMAGE_STORED_NAME: string | null;
  IMAGE_MIME_TYPE: string | null;
  IMAGE_SIZE_BYTES: number | null;
  IMAGE_ALT: string | null;
  IMAGE_FIT: string | null;
  IS_COVER: boolean | number;
  SORT_ORDER: number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
};

export const MAX_HOME_ACTIVITY_IMAGES = 10;

export class HomeActivityImageError extends Error {
  statusCode = 400;
}

export class HomeActivityImageTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(
      "Tabel gambar kegiatan belum tersedia. Jalankan migration 011_create_home_activity_images.sql."
    );
    this.name = "HomeActivityImageTableUnavailableError";
  }
}

export function normalizeHomeActivityImageFit(
  value: string | null | undefined
): HomeActivityImageFit {
  if (value === undefined || value === null || value === "") {
    return "cover";
  }

  const normalized = String(value).trim();

  if (normalized === "cover" || normalized === "contain") {
    return normalized;
  }

  throw new HomeActivityImageError("Tampilan gambar tidak valid.");
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toImage(record: ImageRecord): HomeActivityImage {
  return {
    id: String(record.ID),
    activityId: String(record.ACTIVITY_ID),
    imagePath: record.IMAGE_PATH,
    imageOriginalName: record.IMAGE_ORIGINAL_NAME,
    imageStoredName: record.IMAGE_STORED_NAME,
    imageMimeType: record.IMAGE_MIME_TYPE,
    imageSizeBytes: record.IMAGE_SIZE_BYTES,
    imageAlt: record.IMAGE_ALT,
    imageFit: record.IMAGE_FIT === "contain" ? "contain" : "cover",
    isCover: Boolean(record.IS_COVER),
    sortOrder: Number(record.SORT_ORDER),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
  };
}

function isMissingImageTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_home_activity_images") &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnMissingImageTable() {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "Tabel gambar kegiatan belum tersedia. Jalankan migration 011_create_home_activity_images.sql."
    );
  }
}

function warnImageDatabaseUnavailable(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Database gambar kegiatan sementara tidak tersedia.", error);
  }
}

async function hasImageTable() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ult_home_activity_images'
    `;

    if (Number(rows[0]?.tableCount ?? 0) > 0) {
      return true;
    }

    warnMissingImageTable();
    return false;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      warnImageDatabaseUnavailable(error);
      return false;
    }

    throw error;
  }
}

function assertId(value: string, message: string) {
  if (!/^\d+$/.test(value)) {
    throw new HomeActivityImageError(message);
  }
}

function normalizeAlt(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 150) : null;
}

export async function getHomeActivityImages(activityId: string) {
  assertId(activityId, "ID kegiatan tidak valid.");

  if (!(await hasImageTable())) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<ImageRecord[]>`
      SELECT * FROM ult_home_activity_images
      WHERE ACTIVITY_ID = ${BigInt(activityId)}
      ORDER BY IS_COVER DESC, SORT_ORDER ASC, ID ASC
    `;

    return rows.map(toImage);
  } catch (error) {
    if (isMissingImageTableError(error)) {
      warnMissingImageTable();
      return [];
    }

    if (isDatabaseUnavailableError(error)) {
      warnImageDatabaseUnavailable(error);
      return [];
    }

    throw error;
  }
}

export async function getAvailableHomeActivityImages(activityId: string) {
  const images = await getHomeActivityImages(activityId);
  const available: HomeActivityImage[] = [];

  for (const image of images) {
    if (image.imageStoredName && (await storedFileExists("homeActivities", image.imageStoredName))) {
      available.push(image);
    }
  }

  return available;
}

export async function getHomeActivityCoverImage(activityId: string) {
  const images = await getHomeActivityImages(activityId);
  return images.find((image) => image.isCover) ?? images[0] ?? null;
}

export async function getHomeActivityImageRecordById(imageId: string) {
  assertId(imageId, "ID gambar tidak valid.");

  if (!(await hasImageTable())) {
    return null;
  }

  const rows = await prisma.$queryRaw<ImageRecord[]>`
    SELECT * FROM ult_home_activity_images WHERE ID = ${BigInt(imageId)} LIMIT 1
  `;

  return rows[0] ?? null;
}

async function countImages(activityId: string) {
  const rows = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT COUNT(*) AS total FROM ult_home_activity_images WHERE ACTIVITY_ID = ${BigInt(activityId)}
  `;

  return Number(rows[0]?.total ?? 0);
}

export type HomeActivityImageUploadItem = {
  file: File;
  altText?: string | null;
  imageFit?: string | null;
  isCover?: boolean;
};

export async function addHomeActivityImages(
  activityId: string,
  items: HomeActivityImageUploadItem[]
) {
  assertId(activityId, "ID kegiatan tidak valid.");

  if (items.length === 0) {
    return getHomeActivityImages(activityId);
  }

  if (!(await hasImageTable())) {
    throw new HomeActivityImageTableUnavailableError();
  }

  const existingCount = await countImages(activityId);

  if (existingCount + items.length > MAX_HOME_ACTIVITY_IMAGES) {
    throw new HomeActivityImageError(
      `Maksimal ${MAX_HOME_ACTIVITY_IMAGES} gambar per kegiatan.`
    );
  }

  const saved: Array<{ image: SavedHomeActivityImageMetadata; item: HomeActivityImageUploadItem }> = [];

  for (const item of items) {
    saved.push({ image: await saveHomeActivityImage(item.file), item });
  }

  const requestedCoverInBatchIndex = saved.findIndex(({ item }) => item.isCover);
  const shouldAutoCoverFirst = existingCount === 0 && requestedCoverInBatchIndex === -1;

  const insertedIds: string[] = [];

  for (const [index, { image, item }] of saved.entries()) {
    const sortOrder = existingCount + index;
    const isCover = requestedCoverInBatchIndex === index || (shouldAutoCoverFirst && index === 0);

    await prisma.$executeRaw`
      INSERT INTO ult_home_activity_images (
        ACTIVITY_ID, IMAGE_PATH, IMAGE_ORIGINAL_NAME, IMAGE_STORED_NAME,
        IMAGE_MIME_TYPE, IMAGE_SIZE_BYTES, IMAGE_ALT, IMAGE_FIT, IS_COVER, SORT_ORDER
      ) VALUES (
        ${BigInt(activityId)}, ${image.storagePath}, ${image.originalName}, ${image.storedName},
        ${image.mimeType}, ${image.sizeBytes}, ${normalizeAlt(item.altText)},
        ${normalizeHomeActivityImageFit(item.imageFit)}, ${isCover ? 1 : 0}, ${sortOrder}
      )
    `;

    const idRows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
      SELECT ID FROM ult_home_activity_images ORDER BY ID DESC LIMIT 1
    `;
    if (idRows[0]) insertedIds.push(String(idRows[0].ID));
  }

  if (requestedCoverInBatchIndex !== -1) {
    const coverId = insertedIds[requestedCoverInBatchIndex];
    if (coverId) {
      await setHomeActivityImageCover(activityId, coverId);
    }
  }

  return getHomeActivityImages(activityId);
}

export async function updateHomeActivityImageMetadata(
  imageId: string,
  input: {
    altText?: string | null;
    imageFit?: string | null;
    sortOrder?: number | string | null;
  }
) {
  assertId(imageId, "ID gambar tidak valid.");

  const existing = await getHomeActivityImageRecordById(imageId);
  if (!existing) {
    throw new HomeActivityImageError("Gambar kegiatan tidak ditemukan.");
  }

  const nextAlt = input.altText === undefined ? existing.IMAGE_ALT : normalizeAlt(input.altText);
  const nextFit =
    input.imageFit === undefined
      ? normalizeHomeActivityImageFit(existing.IMAGE_FIT)
      : normalizeHomeActivityImageFit(input.imageFit);
  const nextSortOrder =
    input.sortOrder === undefined || input.sortOrder === null
      ? existing.SORT_ORDER
      : Math.trunc(Number(input.sortOrder));

  if (!Number.isFinite(nextSortOrder)) {
    throw new HomeActivityImageError("Urutan harus berupa angka.");
  }

  await prisma.$executeRaw`
    UPDATE ult_home_activity_images
    SET IMAGE_ALT = ${nextAlt}, IMAGE_FIT = ${nextFit}, SORT_ORDER = ${nextSortOrder},
      UPDATED_AT = CURRENT_TIMESTAMP(3)
    WHERE ID = ${BigInt(imageId)}
    LIMIT 1
  `;

  const updated = await getHomeActivityImageRecordById(imageId);
  return updated ? toImage(updated) : null;
}

export async function replaceHomeActivityImage(
  activityId: string,
  imageId: string,
  file: File,
  input: { altText?: string | null; imageFit?: string | null } = {}
) {
  assertId(activityId, "ID kegiatan tidak valid.");
  assertId(imageId, "ID gambar tidak valid.");

  if (!(await hasImageTable())) {
    throw new HomeActivityImageTableUnavailableError();
  }

  const existing = await getHomeActivityImageRecordById(imageId);

  if (!existing || String(existing.ACTIVITY_ID) !== activityId) {
    throw new HomeActivityImageError("Gambar kegiatan tidak ditemukan.");
  }

  const savedImage = await saveHomeActivityImage(file);
  let databaseUpdated = false;
  const nextAlt = input.altText === undefined ? existing.IMAGE_ALT : normalizeAlt(input.altText);
  const nextFit =
    input.imageFit === undefined
      ? normalizeHomeActivityImageFit(existing.IMAGE_FIT)
      : normalizeHomeActivityImageFit(input.imageFit);

  try {
    await prisma.$executeRaw`
      UPDATE ult_home_activity_images
      SET
        IMAGE_PATH = ${savedImage.storagePath},
        IMAGE_ORIGINAL_NAME = ${savedImage.originalName},
        IMAGE_STORED_NAME = ${savedImage.storedName},
        IMAGE_MIME_TYPE = ${savedImage.mimeType},
        IMAGE_SIZE_BYTES = ${savedImage.sizeBytes},
        IMAGE_ALT = ${nextAlt},
        IMAGE_FIT = ${nextFit},
        UPDATED_AT = CURRENT_TIMESTAMP(3)
      WHERE ID = ${BigInt(imageId)}
        AND ACTIVITY_ID = ${BigInt(activityId)}
      LIMIT 1
    `;
    databaseUpdated = true;

    try {
      await deleteHomeActivityImageFile(existing.IMAGE_PATH);
    } catch (cleanupError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Gagal menghapus file gambar kegiatan lama setelah penggantian.",
          cleanupError
        );
      }
    }

    const updated = await getHomeActivityImageRecordById(imageId);
    return updated ? toImage(updated) : null;
  } catch (error) {
    if (!databaseUpdated) {
      await deleteHomeActivityImageFile(savedImage.storagePath);
    }

    throw error;
  }
}

export async function deleteHomeActivityImage(imageId: string) {
  assertId(imageId, "ID gambar tidak valid.");

  const record = await getHomeActivityImageRecordById(imageId);

  if (!record) {
    return null;
  }

  await prisma.$executeRaw`
    DELETE FROM ult_home_activity_images WHERE ID = ${BigInt(imageId)} LIMIT 1
  `;
  await deleteHomeActivityImageFile(record.IMAGE_PATH);

  const activityId = String(record.ACTIVITY_ID);
  const remaining = await getHomeActivityImages(activityId);

  if (remaining.length > 0 && !remaining.some((image) => image.isCover)) {
    await setHomeActivityImageCover(activityId, remaining[0].id);
  }

  return toImage(record);
}

export async function deleteHomeActivityImagesForActivity(activityId: string) {
  assertId(activityId, "ID kegiatan tidak valid.");

  if (!(await hasImageTable())) {
    return [];
  }

  const records = await prisma.$queryRaw<ImageRecord[]>`
    SELECT * FROM ult_home_activity_images WHERE ACTIVITY_ID = ${BigInt(activityId)}
  `;

  if (records.length === 0) {
    return [];
  }

  await prisma.$executeRaw`
    DELETE FROM ult_home_activity_images WHERE ACTIVITY_ID = ${BigInt(activityId)}
  `;

  for (const record of records) {
    try {
      await deleteHomeActivityImageFile(record.IMAGE_PATH);
    } catch (cleanupError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Gagal menghapus object MinIO saat penghapusan kegiatan.",
          cleanupError
        );
      }
    }
  }

  return records.map(toImage);
}

export async function setHomeActivityImageCover(activityId: string, imageId: string) {
  assertId(activityId, "ID kegiatan tidak valid.");
  assertId(imageId, "ID gambar tidak valid.");

  const images = await getHomeActivityImages(activityId);

  if (!images.some((image) => image.id === imageId)) {
    throw new HomeActivityImageError("Gambar kegiatan tidak ditemukan.");
  }

  await prisma.$executeRaw`
    UPDATE ult_home_activity_images SET IS_COVER = 0 WHERE ACTIVITY_ID = ${BigInt(activityId)}
  `;
  await prisma.$executeRaw`
    UPDATE ult_home_activity_images
    SET IS_COVER = 1
    WHERE ID = ${BigInt(imageId)} AND ACTIVITY_ID = ${BigInt(activityId)}
    LIMIT 1
  `;
}

export function getHomeActivityImageApiErrorStatus(error: unknown) {
  if (
    error instanceof HomeActivityImageError ||
    error instanceof HomeActivityImageTableUnavailableError
  ) {
    return { message: error.message, statusCode: error.statusCode };
  }

  return null;
}
