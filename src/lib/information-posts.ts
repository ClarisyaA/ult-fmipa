import { prisma } from "@/lib/prisma";
import {
  normalizeInformationTitle,
  slugifyInformationTitle,
} from "@/lib/slug";

export type InformationPostStatus = "draft" | "published";

export type InformationPost = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  summary: string | null;
  content: string;
  status: InformationPostStatus;
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
  PUBLISHED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
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

function warnMissingInformationTable() {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "Table informasi belum tersedia. Jalankan migration 003_create_ult_information_posts.sql."
    );
  }
}

function handleReadError(error: unknown) {
  if (isMissingInformationTableError(error)) {
    warnMissingInformationTable();
    return;
  }

  throw error;
}

async function hasInformationTable() {
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
  if (status !== "draft" && status !== "published") {
    throw new InformationPostValidationError(
      "Status informasi harus draft atau published."
    );
  }
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
  const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string; TITLE: string }>>`
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
    actor: input.actor?.trim() || null,
  };
}

export async function getPublishedInformationPosts() {
  if (!(await hasInformationTable())) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT *
      FROM ult_information_posts
      WHERE STATUS = 'published'
      ORDER BY PUBLISHED_AT DESC, CREATED_AT DESC, ID DESC
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
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT *
      FROM ult_information_posts
      WHERE SLUG = ${slug}
        AND STATUS = 'published'
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
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT *
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
    const rows = await prisma.$queryRaw<InformationPostRecord[]>`
      SELECT *
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

  try {
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
  const publishedAt =
    data.status === "published"
      ? existing.publishedAt
        ? new Date(existing.publishedAt)
        : new Date()
      : null;

  try {
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
