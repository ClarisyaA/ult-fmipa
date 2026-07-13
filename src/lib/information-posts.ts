import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  normalizeInformationTitle,
  slugifyInformationTitle,
} from "@/lib/slug";

export type InformationPostStatus = "draft" | "published" | "archived";

export type InformationPost = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  summary: string | null;
  content: string;
  status: InformationPostStatus;
  featured: boolean;
  isActive: boolean;
  displayStartAt: string | null;
  displayEndAt: string | null;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type InformationPostInput = {
  title: string;
  slug?: string | null;
  category?: string | null;
  summary?: string | null;
  content: string;
  status: InformationPostStatus;
  featured?: boolean | string | null;
  isActive?: boolean | string | null;
  displayStartAt?: string | null;
  displayEndAt?: string | null;
  actor?: string | null;
};

type InformationPostRecord = {
  ID: bigint | number | string;
  TITLE: string;
  SLUG: string;
  CATEGORY: string | null;
  SUMMARY: string | null;
  CONTENT: string;
  STATUS: InformationPostStatus;
  IS_FEATURED: boolean | number;
  IS_ACTIVE: boolean | number;
  DISPLAY_START_AT: Date | string | null;
  DISPLAY_END_AT: Date | string | null;
  PUBLISHED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
};

type InformationTableCapabilities = {
  hasFeatured: boolean;
  hasIsActive: boolean;
  hasDisplayStartAt: boolean;
  hasDisplayEndAt: boolean;
};

export class InformationPostValidationError extends Error {
  statusCode = 400;
}

export class InformationTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(
      "Table informasi belum tersedia. Jalankan migration 003_create_ult_information_posts.sql."
    );
    this.name = "InformationTableUnavailableError";
  }
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toPost(record: InformationPostRecord): InformationPost {
  return {
    id: String(record.ID),
    title: record.TITLE,
    slug: record.SLUG,
    category: record.CATEGORY,
    summary: record.SUMMARY,
    content: record.CONTENT,
    status: record.STATUS,
    featured: Boolean(record.IS_FEATURED),
    isActive: Boolean(record.IS_ACTIVE),
    displayStartAt: toIso(record.DISPLAY_START_AT),
    displayEndAt: toIso(record.DISPLAY_END_AT),
    publishedAt: toIso(record.PUBLISHED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
  };
}

function isMissingInformationTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_information_posts") &&
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

function warnMissingInformationTable() {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "Table informasi belum tersedia. Jalankan migration 003_create_ult_information_posts.sql."
    );
  }
}

function warnInformationDatabaseUnavailable(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Database informasi sementara tidak tersedia.", error);
  }
}

function handleReadError(error: unknown) {
  if (isMissingInformationTableError(error)) {
    warnMissingInformationTable();
    return;
  }

  if (isDatabaseConnectionUnavailableError(error)) {
    warnInformationDatabaseUnavailable(error);
    return;
  }

  throw error;
}

async function hasInformationTable() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ult_information_posts'
    `;

    if (Number(rows[0]?.tableCount ?? 0) > 0) {
      return true;
    }

    warnMissingInformationTable();
    return false;
  } catch (error) {
    if (isDatabaseConnectionUnavailableError(error)) {
      warnInformationDatabaseUnavailable(error);
      return false;
    }

    throw error;
  }
}

async function getInformationTableCapabilities(): Promise<InformationTableCapabilities> {
  const rows = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ult_information_posts'
      AND COLUMN_NAME IN (
        'IS_FEATURED',
        'IS_ACTIVE',
        'DISPLAY_START_AT',
        'DISPLAY_END_AT'
      )
  `;
  const columns = new Set(rows.map((row) => row.COLUMN_NAME));

  return {
    hasFeatured: columns.has("IS_FEATURED"),
    hasIsActive: columns.has("IS_ACTIVE"),
    hasDisplayStartAt: columns.has("DISPLAY_START_AT"),
    hasDisplayEndAt: columns.has("DISPLAY_END_AT"),
  };
}

function informationPostSelect(caps: InformationTableCapabilities) {
  return Prisma.sql`
    ID,
    TITLE,
    SLUG,
    CATEGORY,
    SUMMARY,
    CONTENT,
    STATUS,
    ${caps.hasFeatured ? Prisma.sql`IS_FEATURED` : Prisma.sql`0`} AS IS_FEATURED,
    ${caps.hasIsActive ? Prisma.sql`IS_ACTIVE` : Prisma.sql`1`} AS IS_ACTIVE,
    ${caps.hasDisplayStartAt ? Prisma.sql`DISPLAY_START_AT` : Prisma.sql`NULL`} AS DISPLAY_START_AT,
    ${caps.hasDisplayEndAt ? Prisma.sql`DISPLAY_END_AT` : Prisma.sql`NULL`} AS DISPLAY_END_AT,
    PUBLISHED_AT,
    CREATED_BY,
    UPDATED_BY,
    CREATED_AT,
    UPDATED_AT
  `;
}

function normalizeOptionalText(value: string | null | undefined, max: number) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, max);
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new InformationPostValidationError("ID informasi tidak valid.");
  }
}

function assertValidStatus(status: string): asserts status is InformationPostStatus {
  if (status !== "draft" && status !== "published" && status !== "archived") {
    throw new InformationPostValidationError(
      "Status informasi harus draft, published, atau archived."
    );
  }
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

function normalizeOptionalDate(value: string | null | undefined, label: string) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    throw new InformationPostValidationError(`${label} tidak valid.`);
  }

  return date;
}

async function slugExists(slug: string, exceptId?: string) {
  const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
    SELECT ID
    FROM ult_information_posts
    WHERE SLUG = ${slug}
      AND (${exceptId ?? null} IS NULL OR ID <> ${exceptId ? BigInt(exceptId) : null})
    LIMIT 1
  `;

  return Boolean(rows[0]);
}

async function assertUniqueSlug(slug: string, exceptId?: string) {
  if (await slugExists(slug, exceptId)) {
    throw new InformationPostValidationError(
      "Tautan informasi sudah digunakan. Gunakan judul yang lebih spesifik."
    );
  }
}

async function assertUniqueTitle(normalizedTitle: string, exceptId?: string) {
  const rows = await prisma.$queryRaw<
    Array<{ ID: bigint | number | string; TITLE: string }>
  >`
    SELECT ID, TITLE
    FROM ult_information_posts
  `;
  const duplicate = rows.find((row) => {
    if (exceptId && String(row.ID) === exceptId) {
      return false;
    }

    return normalizeInformationTitle(row.TITLE) === normalizedTitle;
  });

  if (duplicate) {
    throw new InformationPostValidationError(
      "Judul informasi sudah digunakan. Gunakan judul lain."
    );
  }
}

async function normalizeInput(
  input: InformationPostInput,
  options?: {
    id?: string;
    existing?: InformationPost;
  }
) {
  const title = input.title.trim();
  const content = input.content.trim();

  if (!title) {
    throw new InformationPostValidationError("Judul informasi wajib diisi.");
  }

  if (title.length > 200) {
    throw new InformationPostValidationError("Judul informasi maksimal 200 karakter.");
  }

  if (!content) {
    throw new InformationPostValidationError("Konten informasi wajib diisi.");
  }

  assertValidStatus(input.status);

  const displayStartAt = normalizeOptionalDate(input.displayStartAt, "Mulai tampil");
  const displayEndAt = normalizeOptionalDate(input.displayEndAt, "Selesai tampil");

  if (displayStartAt && displayEndAt && displayEndAt <= displayStartAt) {
    throw new InformationPostValidationError(
      "Selesai tampil harus setelah mulai tampil."
    );
  }

  const normalizedTitle = normalizeInformationTitle(title);
  await assertUniqueTitle(normalizedTitle, options?.id);

  const existing = options?.existing;
  const titleMatchesExisting =
    existing && normalizeInformationTitle(existing.title) === normalizedTitle;
  const slug = titleMatchesExisting
    ? existing.slug
    : slugifyInformationTitle(title);

  if (!slug) {
    throw new InformationPostValidationError(
      "Judul belum dapat dijadikan tautan. Gunakan judul yang lebih jelas."
    );
  }

  await assertUniqueSlug(slug, options?.id);

  return {
    title,
    slug,
    category: normalizeOptionalText(input.category, 100),
    summary: normalizeOptionalText(input.summary, 300),
    content,
    status: input.status,
    featured: normalizeBoolean(input.featured, existing?.featured ?? false),
    isActive: normalizeBoolean(input.isActive, existing?.isActive ?? true),
    displayStartAt,
    displayEndAt,
    actor: input.actor?.trim() || null,
  };
}

export function isInformationPostCurrentlyVisible(post: InformationPost) {
  const now = Date.now();

  if (post.status !== "published" || !post.isActive) {
    return false;
  }

  if (post.displayStartAt && new Date(post.displayStartAt).getTime() > now) {
    return false;
  }

  if (post.displayEndAt && new Date(post.displayEndAt).getTime() < now) {
    return false;
  }

  return true;
}

export async function getPublishedInformationPosts() {
  if (!(await hasInformationTable())) {
    return [];
  }

  try {
    const caps = await getInformationTableCapabilities();
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT ${informationPostSelect(caps)}
      FROM ult_information_posts
      WHERE STATUS = 'published'
        ${caps.hasIsActive ? Prisma.sql`AND IS_ACTIVE = 1` : Prisma.empty}
        ${caps.hasDisplayStartAt ? Prisma.sql`AND (DISPLAY_START_AT IS NULL OR DISPLAY_START_AT <= NOW(3))` : Prisma.empty}
        ${caps.hasDisplayEndAt ? Prisma.sql`AND (DISPLAY_END_AT IS NULL OR DISPLAY_END_AT >= NOW(3))` : Prisma.empty}
      ORDER BY
        ${caps.hasFeatured ? Prisma.sql`IS_FEATURED DESC,` : Prisma.empty}
        PUBLISHED_AT DESC,
        CREATED_AT DESC,
        ID DESC
    `;

    return rows.map(toPost);
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

export async function getPublishedInformationPostBySlug(slug: string) {
  if (!(await hasInformationTable())) {
    return null;
  }

  try {
    const caps = await getInformationTableCapabilities();
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT ${informationPostSelect(caps)}
      FROM ult_information_posts
      WHERE SLUG = ${slug}
        AND STATUS = 'published'
        ${caps.hasIsActive ? Prisma.sql`AND IS_ACTIVE = 1` : Prisma.empty}
        ${caps.hasDisplayStartAt ? Prisma.sql`AND (DISPLAY_START_AT IS NULL OR DISPLAY_START_AT <= NOW(3))` : Prisma.empty}
        ${caps.hasDisplayEndAt ? Prisma.sql`AND (DISPLAY_END_AT IS NULL OR DISPLAY_END_AT >= NOW(3))` : Prisma.empty}
      LIMIT 1
    `;

    return rows[0] ? toPost(rows[0]) : null;
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

export async function getAdminInformationPosts() {
  if (!(await hasInformationTable())) {
    return [];
  }

  try {
    const caps = await getInformationTableCapabilities();
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT ${informationPostSelect(caps)}
      FROM ult_information_posts
      ORDER BY CREATED_AT DESC, ID DESC
    `;

    return rows.map(toPost);
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

export async function getInformationPostById(id: string) {
  assertValidId(id);

  if (!(await hasInformationTable())) {
    return null;
  }

  try {
    const caps = await getInformationTableCapabilities();
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT ${informationPostSelect(caps)}
      FROM ult_information_posts
      WHERE ID = ${BigInt(id)}
      LIMIT 1
    `;

    return rows[0] ? toPost(rows[0]) : null;
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

export async function createInformationPost(input: InformationPostInput) {
  if (!(await hasInformationTable())) {
    throw new InformationTableUnavailableError();
  }

  const data = await normalizeInput(input);
  const caps = await getInformationTableCapabilities();

  try {
    if (
      caps.hasFeatured &&
      caps.hasIsActive &&
      caps.hasDisplayStartAt &&
      caps.hasDisplayEndAt
    ) {
      await prisma.$executeRaw`
        INSERT INTO ult_information_posts (
          TITLE,
          SLUG,
          CATEGORY,
          SUMMARY,
          CONTENT,
          STATUS,
          IS_FEATURED,
          IS_ACTIVE,
          DISPLAY_START_AT,
          DISPLAY_END_AT,
          PUBLISHED_AT,
          CREATED_BY
        ) VALUES (
          ${data.title},
          ${data.slug},
          ${data.category},
          ${data.summary},
          ${data.content},
          ${data.status},
          ${data.featured ? 1 : 0},
          ${data.isActive ? 1 : 0},
          ${data.displayStartAt},
          ${data.displayEndAt},
          ${data.status === "published" ? new Date() : null},
          ${data.actor}
        )
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO ult_information_posts (
          TITLE,
          SLUG,
          CATEGORY,
          SUMMARY,
          CONTENT,
          STATUS,
          PUBLISHED_AT,
          CREATED_BY
        ) VALUES (
          ${data.title},
          ${data.slug},
          ${data.category},
          ${data.summary},
          ${data.content},
          ${data.status},
          ${data.status === "published" ? new Date() : null},
          ${data.actor}
        )
      `;
    }

    const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
      SELECT ID
      FROM ult_information_posts
      WHERE SLUG = ${data.slug}
      LIMIT 1
    `;

    return rows[0] ? getInformationPostById(String(rows[0].ID)) : null;
  } catch (error) {
    if (isMissingInformationTableError(error)) {
      warnMissingInformationTable();
      throw new InformationTableUnavailableError();
    }

    throw error;
  }
}

export async function updateInformationPost(
  id: string,
  input: InformationPostInput
) {
  assertValidId(id);

  if (!(await hasInformationTable())) {
    throw new InformationTableUnavailableError();
  }

  const existing = await getInformationPostById(id);

  if (!existing) {
    return null;
  }

  const data = await normalizeInput(input, {
    id,
    existing,
  });
  const caps = await getInformationTableCapabilities();
  const publishedAt =
    data.status === "published"
      ? existing.publishedAt
        ? new Date(existing.publishedAt)
        : new Date()
      : null;

  try {
    if (
      caps.hasFeatured &&
      caps.hasIsActive &&
      caps.hasDisplayStartAt &&
      caps.hasDisplayEndAt
    ) {
      await prisma.$executeRaw`
        UPDATE ult_information_posts
        SET
          TITLE = ${data.title},
          SLUG = ${data.slug},
          CATEGORY = ${data.category},
          SUMMARY = ${data.summary},
          CONTENT = ${data.content},
          STATUS = ${data.status},
          IS_FEATURED = ${data.featured ? 1 : 0},
          IS_ACTIVE = ${data.isActive ? 1 : 0},
          DISPLAY_START_AT = ${data.displayStartAt},
          DISPLAY_END_AT = ${data.displayEndAt},
          PUBLISHED_AT = ${publishedAt},
          UPDATED_BY = ${data.actor},
          UPDATED_AT = CURRENT_TIMESTAMP(3)
        WHERE ID = ${BigInt(id)}
        LIMIT 1
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE ult_information_posts
        SET
          TITLE = ${data.title},
          SLUG = ${data.slug},
          CATEGORY = ${data.category},
          SUMMARY = ${data.summary},
          CONTENT = ${data.content},
          STATUS = ${data.status},
          PUBLISHED_AT = ${publishedAt},
          UPDATED_BY = ${data.actor},
          UPDATED_AT = CURRENT_TIMESTAMP(3)
        WHERE ID = ${BigInt(id)}
        LIMIT 1
      `;
    }

    return getInformationPostById(id);
  } catch (error) {
    if (isMissingInformationTableError(error)) {
      warnMissingInformationTable();
      throw new InformationTableUnavailableError();
    }

    throw error;
  }
}

export async function deleteInformationPost(id: string) {
  assertValidId(id);

  if (!(await hasInformationTable())) {
    throw new InformationTableUnavailableError();
  }

  try {
    await prisma.$executeRaw`
      DELETE FROM ult_information_posts
      WHERE ID = ${BigInt(id)}
      LIMIT 1
    `;
  } catch (error) {
    if (isMissingInformationTableError(error)) {
      warnMissingInformationTable();
      throw new InformationTableUnavailableError();
    }

    throw error;
  }
}
