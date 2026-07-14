import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/error-utils";
import {
  deleteHomeActivityImageFile,
  type SavedHomeActivityImageMetadata,
} from "@/lib/home-activity-image-upload";

export type HomeActivity = {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string;
  imagePath: string | null;
  imageAlt: string | null;
  imageOriginalName: string | null;
  imageStoredName: string | null;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type PublicHomeActivity = {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string;
  image: string | null;
  imageAlt: string;
  sortOrder: number;
};

export type HomeActivityInput = {
  title: string;
  eyebrow?: string | null;
  description: string;
  imageAlt?: string | null;
  isActive?: boolean | string | null;
  sortOrder?: number | string | null;
  actor?: string | null;
};

type HomeActivityRecord = {
  ID: bigint | number | string;
  TITLE: string;
  EYEBROW: string | null;
  DESCRIPTION: string;
  IMAGE_PATH: string | null;
  IMAGE_ORIGINAL_NAME: string | null;
  IMAGE_STORED_NAME: string | null;
  IMAGE_MIME_TYPE: string | null;
  IMAGE_SIZE_BYTES: number | null;
  IMAGE_ALT: string | null;
  IS_ACTIVE: boolean | number;
  SORT_ORDER: number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
};

export class HomeActivityValidationError extends Error {
  statusCode = 400;
}

export class HomeActivityTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(
      "Table kegiatan beranda belum tersedia. Jalankan migration 008_create_ult_home_activities.sql."
    );
    this.name = "HomeActivityTableUnavailableError";
  }
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toActivity(record: HomeActivityRecord): HomeActivity {
  return {
    id: String(record.ID),
    title: record.TITLE,
    eyebrow: record.EYEBROW,
    description: record.DESCRIPTION,
    imagePath: record.IMAGE_PATH,
    imageAlt: record.IMAGE_ALT,
    imageOriginalName: record.IMAGE_ORIGINAL_NAME,
    imageStoredName: record.IMAGE_STORED_NAME,
    imageMimeType: record.IMAGE_MIME_TYPE,
    imageSizeBytes: record.IMAGE_SIZE_BYTES,
    isActive: Boolean(record.IS_ACTIVE),
    sortOrder: Number(record.SORT_ORDER),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
  };
}

function toPublicActivity(activity: HomeActivity): PublicHomeActivity {
  return {
    id: activity.id,
    title: activity.title,
    eyebrow: activity.eyebrow,
    description: activity.description,
    image: activity.imagePath ? `/api/home/activities/images/${activity.id}` : null,
    imageAlt: activity.imageAlt ?? activity.title,
    sortOrder: activity.sortOrder,
  };
}

function isMissingHomeActivitiesTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_home_activities") &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnHomeActivitiesReadError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (error) {
      console.warn(message, error);
    } else {
      console.warn(message);
    }
  }
}

function handleReadError(error: unknown) {
  if (isMissingHomeActivitiesTableError(error)) {
    warnHomeActivitiesReadError(
      "Table kegiatan beranda belum tersedia. Jalankan migration 008_create_ult_home_activities.sql."
    );
    return;
  }

  if (isDatabaseUnavailableError(error)) {
    warnHomeActivitiesReadError("Database kegiatan beranda sementara tidak tersedia.", error);
    return;
  }

  throw error;
}

async function hasHomeActivitiesTable() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ult_home_activities'
    `;

    if (Number(rows[0]?.tableCount ?? 0) > 0) {
      return true;
    }

    warnHomeActivitiesReadError(
      "Table kegiatan beranda belum tersedia. Jalankan migration 008_create_ult_home_activities.sql."
    );
    return false;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      warnHomeActivitiesReadError("Database kegiatan beranda sementara tidak tersedia.", error);
      return false;
    }

    throw error;
  }
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new HomeActivityValidationError("ID kegiatan tidak valid.");
  }
}

function normalizeOptionalText(value: string | null | undefined, max: number) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, max);
}

function normalizeBoolean(value: boolean | string | null | undefined, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }

  return fallback;
}

function normalizeSortOrder(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed) {
    return 0;
  }

  const numeric = Number(trimmed);

  if (!Number.isFinite(numeric)) {
    throw new HomeActivityValidationError("Urutan harus berupa angka.");
  }

  return Math.trunc(numeric);
}

function normalizeInput(input: HomeActivityInput) {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    throw new HomeActivityValidationError("Judul kegiatan wajib diisi.");
  }

  if (title.length > 150) {
    throw new HomeActivityValidationError("Judul kegiatan maksimal 150 karakter.");
  }

  if (!description) {
    throw new HomeActivityValidationError("Deskripsi kegiatan wajib diisi.");
  }

  return {
    title,
    eyebrow: normalizeOptionalText(input.eyebrow, 80),
    description,
    imageAlt: normalizeOptionalText(input.imageAlt, 150),
    isActive: normalizeBoolean(input.isActive, true),
    sortOrder: normalizeSortOrder(input.sortOrder),
    actor: input.actor?.trim().slice(0, 100) || null,
  };
}

export function assertValidHomeActivityInput(input: HomeActivityInput) {
  normalizeInput(input);
}

export async function getPublicHomeActivities() {
  if (!(await hasHomeActivitiesTable())) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<HomeActivityRecord[]>`
      SELECT
        ID,
        TITLE,
        EYEBROW,
        DESCRIPTION,
        IMAGE_PATH,
        IMAGE_ORIGINAL_NAME,
        IMAGE_STORED_NAME,
        IMAGE_MIME_TYPE,
        IMAGE_SIZE_BYTES,
        IMAGE_ALT,
        IS_ACTIVE,
        SORT_ORDER,
        CREATED_AT,
        UPDATED_AT,
        CREATED_BY,
        UPDATED_BY
      FROM ult_home_activities
      WHERE IS_ACTIVE = 1
      ORDER BY SORT_ORDER ASC, CREATED_AT DESC, ID DESC
    `;

    return rows.map(toActivity).map(toPublicActivity);
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

export async function getAdminHomeActivities() {
  if (!(await hasHomeActivitiesTable())) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<HomeActivityRecord[]>`
      SELECT
        ID,
        TITLE,
        EYEBROW,
        DESCRIPTION,
        IMAGE_PATH,
        IMAGE_ORIGINAL_NAME,
        IMAGE_STORED_NAME,
        IMAGE_MIME_TYPE,
        IMAGE_SIZE_BYTES,
        IMAGE_ALT,
        IS_ACTIVE,
        SORT_ORDER,
        CREATED_AT,
        UPDATED_AT,
        CREATED_BY,
        UPDATED_BY
      FROM ult_home_activities
      ORDER BY SORT_ORDER ASC, CREATED_AT DESC, ID DESC
    `;

    return rows.map(toActivity);
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

export async function getHomeActivityById(id: string) {
  assertValidId(id);

  if (!(await hasHomeActivitiesTable())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<HomeActivityRecord[]>`
      SELECT
        ID,
        TITLE,
        EYEBROW,
        DESCRIPTION,
        IMAGE_PATH,
        IMAGE_ORIGINAL_NAME,
        IMAGE_STORED_NAME,
        IMAGE_MIME_TYPE,
        IMAGE_SIZE_BYTES,
        IMAGE_ALT,
        IS_ACTIVE,
        SORT_ORDER,
        CREATED_AT,
        UPDATED_AT,
        CREATED_BY,
        UPDATED_BY
      FROM ult_home_activities
      WHERE ID = ${BigInt(id)}
      LIMIT 1
    `;

    return rows[0] ? toActivity(rows[0]) : null;
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

export async function createHomeActivity(
  input: HomeActivityInput,
  image?: SavedHomeActivityImageMetadata | null
) {
  if (!(await hasHomeActivitiesTable())) {
    throw new HomeActivityTableUnavailableError();
  }

  const data = normalizeInput(input);

  try {
    await prisma.$executeRaw`
      INSERT INTO ult_home_activities (
        TITLE,
        EYEBROW,
        DESCRIPTION,
        IMAGE_PATH,
        IMAGE_ORIGINAL_NAME,
        IMAGE_STORED_NAME,
        IMAGE_MIME_TYPE,
        IMAGE_SIZE_BYTES,
        IMAGE_ALT,
        IS_ACTIVE,
        SORT_ORDER,
        CREATED_BY
      ) VALUES (
        ${data.title},
        ${data.eyebrow},
        ${data.description},
        ${image?.storagePath ?? null},
        ${image?.originalName ?? null},
        ${image?.storedName ?? null},
        ${image?.mimeType ?? null},
        ${image?.sizeBytes ?? null},
        ${data.imageAlt},
        ${data.isActive ? 1 : 0},
        ${data.sortOrder},
        ${data.actor}
      )
    `;

    const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
      SELECT ID
      FROM ult_home_activities
      ORDER BY ID DESC
      LIMIT 1
    `;

    return rows[0] ? getHomeActivityById(String(rows[0].ID)) : null;
  } catch (error) {
    if (isMissingHomeActivitiesTableError(error)) {
      throw new HomeActivityTableUnavailableError();
    }

    throw error;
  }
}

export async function updateHomeActivity(
  id: string,
  input: HomeActivityInput,
  image?: SavedHomeActivityImageMetadata | null
) {
  assertValidId(id);

  if (!(await hasHomeActivitiesTable())) {
    throw new HomeActivityTableUnavailableError();
  }

  const existing = await getHomeActivityById(id);

  if (!existing) {
    return null;
  }

  const data = normalizeInput(input);

  try {
    if (image) {
      await prisma.$executeRaw`
        UPDATE ult_home_activities
        SET
          TITLE = ${data.title},
          EYEBROW = ${data.eyebrow},
          DESCRIPTION = ${data.description},
          IMAGE_PATH = ${image.storagePath},
          IMAGE_ORIGINAL_NAME = ${image.originalName},
          IMAGE_STORED_NAME = ${image.storedName},
          IMAGE_MIME_TYPE = ${image.mimeType},
          IMAGE_SIZE_BYTES = ${image.sizeBytes},
          IMAGE_ALT = ${data.imageAlt},
          IS_ACTIVE = ${data.isActive ? 1 : 0},
          SORT_ORDER = ${data.sortOrder},
          UPDATED_BY = ${data.actor},
          UPDATED_AT = CURRENT_TIMESTAMP(3)
        WHERE ID = ${BigInt(id)}
        LIMIT 1
      `;
      await deleteHomeActivityImageFile(existing.imagePath);
    } else {
      await prisma.$executeRaw`
        UPDATE ult_home_activities
        SET
          TITLE = ${data.title},
          EYEBROW = ${data.eyebrow},
          DESCRIPTION = ${data.description},
          IMAGE_ALT = ${data.imageAlt},
          IS_ACTIVE = ${data.isActive ? 1 : 0},
          SORT_ORDER = ${data.sortOrder},
          UPDATED_BY = ${data.actor},
          UPDATED_AT = CURRENT_TIMESTAMP(3)
        WHERE ID = ${BigInt(id)}
        LIMIT 1
      `;
    }

    return getHomeActivityById(id);
  } catch (error) {
    if (isMissingHomeActivitiesTableError(error)) {
      throw new HomeActivityTableUnavailableError();
    }

    throw error;
  }
}

export async function deleteHomeActivity(id: string) {
  assertValidId(id);

  if (!(await hasHomeActivitiesTable())) {
    throw new HomeActivityTableUnavailableError();
  }

  const existing = await getHomeActivityById(id);

  if (!existing) {
    return false;
  }

  try {
    await prisma.$executeRaw`
      DELETE FROM ult_home_activities
      WHERE ID = ${BigInt(id)}
      LIMIT 1
    `;
    await deleteHomeActivityImageFile(existing.imagePath);
    return true;
  } catch (error) {
    if (isMissingHomeActivitiesTableError(error)) {
      throw new HomeActivityTableUnavailableError();
    }

    throw error;
  }
}
