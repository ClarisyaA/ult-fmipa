import { prisma } from "@/lib/prisma";
import {
  deleteInformationImageFile,
  type SavedInformationImageMetadata,
} from "@/lib/information-image-upload";

export type InformationPostImage = {
  id: string;
  postId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
};

type ImageRecord = {
  ID: bigint | number | string;
  POST_ID: bigint | number | string;
  ORIGINAL_NAME: string;
  STORED_NAME: string;
  MIME_TYPE: string;
  SIZE_BYTES: number;
  STORAGE_PATH: string;
  ALT_TEXT: string | null;
  SORT_ORDER: number;
  IS_COVER: boolean | number;
  CREATED_AT: Date | string;
};

export class InformationPostImageError extends Error {
  statusCode = 400;
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toImage(record: ImageRecord): InformationPostImage {
  return {
    id: String(record.ID),
    postId: String(record.POST_ID),
    originalName: record.ORIGINAL_NAME,
    storedName: record.STORED_NAME,
    mimeType: record.MIME_TYPE,
    sizeBytes: record.SIZE_BYTES,
    altText: record.ALT_TEXT,
    sortOrder: record.SORT_ORDER,
    isCover: Boolean(record.IS_COVER),
    createdAt: toIso(record.CREATED_AT),
  };
}

function isMissingImageTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_information_post_images") &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function isDatabaseConnectionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("pool timeout") ||
    message.includes("failed to retrieve a connection") ||
    message.includes("45028") ||
    message.includes("Can't reach database") ||
    message.includes("ECONNREFUSED")
  );
}

function warnMissingImageTable() {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "Table gambar informasi belum tersedia. Jalankan migration 005_create_ult_information_post_images.sql."
    );
  }
}

function warnImageDatabaseUnavailable(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Database gambar informasi sementara tidak tersedia.", error);
  }
}

async function hasImageTable() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ult_information_post_images'
    `;

    if (Number(rows[0]?.tableCount ?? 0) > 0) {
      return true;
    }

    warnMissingImageTable();
    return false;
  } catch (error) {
    if (isDatabaseConnectionUnavailableError(error)) {
      warnImageDatabaseUnavailable(error);
      return false;
    }

    throw error;
  }
}

function assertId(value: string, message: string) {
  if (!/^\d+$/.test(value)) {
    throw new InformationPostImageError(message);
  }
}

export async function getInformationPostImages(postId: string) {
  assertId(postId, "ID informasi tidak valid.");

  if (!(await hasImageTable())) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<ImageRecord[]>`
      SELECT *
      FROM ult_information_post_images
      WHERE POST_ID = ${BigInt(postId)}
      ORDER BY SORT_ORDER ASC, ID ASC
    `;

    return rows.map(toImage);
  } catch (error) {
    if (isMissingImageTableError(error)) {
      warnMissingImageTable();
      return [];
    }

    if (isDatabaseConnectionUnavailableError(error)) {
      warnImageDatabaseUnavailable(error);
      return [];
    }

    throw error;
  }
}

export async function getInformationPostCoverImage(postId: string) {
  const images = await getInformationPostImages(postId);

  return images.find((image) => image.isCover) ?? images[0] ?? null;
}

export async function getInformationPostImageRecord(imageId: string) {
  assertId(imageId, "ID gambar tidak valid.");

  if (!(await hasImageTable())) {
    return null;
  }

  const rows = await prisma.$queryRaw<ImageRecord[]>`
    SELECT *
    FROM ult_information_post_images
    WHERE ID = ${BigInt(imageId)}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function countImages(postId: string) {
  const rows = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT COUNT(*) AS total
    FROM ult_information_post_images
    WHERE POST_ID = ${BigInt(postId)}
  `;

  return Number(rows[0]?.total ?? 0);
}

export async function addInformationPostImages(
  postId: string,
  images: SavedInformationImageMetadata[]
) {
  assertId(postId, "ID informasi tidak valid.");

  if (images.length === 0) {
    return [];
  }

  if (!(await hasImageTable())) {
    throw new InformationPostImageError("Tabel gambar informasi belum tersedia.");
  }

  const existingCount = await countImages(postId);

  if (existingCount + images.length > 5) {
    throw new InformationPostImageError("Maksimal 5 gambar per informasi.");
  }

  const inserted: InformationPostImage[] = [];

  for (const [index, image] of images.entries()) {
    const sortOrder = existingCount + index;
    const isCover = existingCount === 0 && index === 0 ? 1 : 0;

    await prisma.$executeRaw`
      INSERT INTO ult_information_post_images (
        POST_ID,
        ORIGINAL_NAME,
        STORED_NAME,
        MIME_TYPE,
        SIZE_BYTES,
        STORAGE_PATH,
        SORT_ORDER,
        IS_COVER
      ) VALUES (
        ${BigInt(postId)},
        ${image.originalName},
        ${image.storedName},
        ${image.mimeType},
        ${image.sizeBytes},
        ${image.storagePath},
        ${sortOrder},
        ${isCover}
      )
    `;
  }

  inserted.push(...(await getInformationPostImages(postId)));
  return inserted;
}

export async function updateInformationPostImageAltText(
  imageId: string,
  altText: string | null
) {
  assertId(imageId, "ID gambar tidak valid.");

  await prisma.$executeRaw`
    UPDATE ult_information_post_images
    SET ALT_TEXT = ${altText?.trim().slice(0, 200) || null}
    WHERE ID = ${BigInt(imageId)}
    LIMIT 1
  `;
}

export async function deleteInformationPostImage(imageId: string) {
  assertId(imageId, "ID gambar tidak valid.");

  const record = await getInformationPostImageRecord(imageId);

  if (!record) {
    return null;
  }

  await prisma.$executeRaw`
    DELETE FROM ult_information_post_images
    WHERE ID = ${BigInt(imageId)}
    LIMIT 1
  `;
  await deleteInformationImageFile(record.STORAGE_PATH);

  const remaining = await getInformationPostImages(String(record.POST_ID));

  if (remaining.length > 0 && !remaining.some((image) => image.isCover)) {
    await setInformationPostCoverImage(String(record.POST_ID), remaining[0].id);
  }

  return toImage(record);
}

export async function deleteInformationPostImagesForPost(postId: string) {
  assertId(postId, "ID informasi tidak valid.");

  if (!(await hasImageTable())) {
    return [];
  }

  const records = await prisma.$queryRaw<ImageRecord[]>`
    SELECT *
    FROM ult_information_post_images
    WHERE POST_ID = ${BigInt(postId)}
  `;

  if (records.length === 0) {
    return [];
  }

  await prisma.$executeRaw`
    DELETE FROM ult_information_post_images
    WHERE POST_ID = ${BigInt(postId)}
  `;

  for (const record of records) {
    await deleteInformationImageFile(record.STORAGE_PATH);
  }

  return records.map(toImage);
}

export async function setInformationPostCoverImage(
  postId: string,
  imageId: string
) {
  assertId(postId, "ID informasi tidak valid.");
  assertId(imageId, "ID gambar tidak valid.");

  const images = await getInformationPostImages(postId);

  if (!images.some((image) => image.id === imageId)) {
    throw new InformationPostImageError("Gambar informasi tidak ditemukan.");
  }

  await prisma.$executeRaw`
    UPDATE ult_information_post_images
    SET IS_COVER = 0
    WHERE POST_ID = ${BigInt(postId)}
  `;
  await prisma.$executeRaw`
    UPDATE ult_information_post_images
    SET IS_COVER = 1
    WHERE ID = ${BigInt(imageId)}
      AND POST_ID = ${BigInt(postId)}
    LIMIT 1
  `;
}

export async function reorderInformationPostImages(
  postId: string,
  orderedImageIds: string[]
) {
  assertId(postId, "ID informasi tidak valid.");

  for (const [index, imageId] of orderedImageIds.entries()) {
    assertId(imageId, "ID gambar tidak valid.");
    await prisma.$executeRaw`
      UPDATE ult_information_post_images
      SET SORT_ORDER = ${index}
      WHERE POST_ID = ${BigInt(postId)}
        AND ID = ${BigInt(imageId)}
      LIMIT 1
    `;
  }
}
