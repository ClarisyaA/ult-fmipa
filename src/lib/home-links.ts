import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/error-utils";

export const ACADEMIC_CALENDAR_LINK_KEY = "academic_calendar";
export const ACADEMIC_CALENDAR_LABEL = "Kalender Akademik";
export const DEFAULT_ACADEMIC_CALENDAR_URL =
  "https://www.unpad.ac.id/pengumuman/kalender-kegiatan-akademik-universitas-padjadjaran-tahun-akademik-2026-2027/";

export type HomeLink = {
  id: string;
  linkKey: string;
  label: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type HomeLinkInput = {
  url: string;
  isActive?: boolean | string | null;
  actor?: string | null;
};

type HomeLinkRecord = {
  ID: bigint | number | string;
  LINK_KEY: string;
  LABEL: string;
  URL: string;
  IS_ACTIVE: boolean | number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  UPDATED_BY: string | null;
};

export class HomeLinkValidationError extends Error {
  statusCode = 400;
}

export class HomeLinksTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(
      "Table link beranda belum tersedia. Jalankan migration 009_create_ult_home_links.sql."
    );
    this.name = "HomeLinksTableUnavailableError";
  }
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toHomeLink(record: HomeLinkRecord): HomeLink {
  return {
    id: String(record.ID),
    linkKey: record.LINK_KEY,
    label: record.LABEL,
    url: record.URL,
    isActive: Boolean(record.IS_ACTIVE),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    updatedBy: record.UPDATED_BY,
  };
}

function isMissingHomeLinksTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_home_links") &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnHomeLinksReadError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (error) {
      console.warn(message, error);
    } else {
      console.warn(message);
    }
  }
}

function handleReadError(error: unknown) {
  if (isMissingHomeLinksTableError(error)) {
    warnHomeLinksReadError(
      "Table link beranda belum tersedia. Jalankan migration 009_create_ult_home_links.sql."
    );
    return;
  }

  if (isDatabaseUnavailableError(error)) {
    warnHomeLinksReadError("Database link beranda sementara tidak tersedia.", error);
    return;
  }

  throw error;
}

async function hasHomeLinksTable() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ult_home_links'
    `;

    if (Number(rows[0]?.tableCount ?? 0) > 0) {
      return true;
    }

    warnHomeLinksReadError(
      "Table link beranda belum tersedia. Jalankan migration 009_create_ult_home_links.sql."
    );
    return false;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      warnHomeLinksReadError("Database link beranda sementara tidak tersedia.", error);
      return false;
    }

    throw error;
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

function normalizeUrl(value: string) {
  const url = value.trim();

  if (!url) {
    throw new HomeLinkValidationError("Link Kalender Akademik wajib diisi.");
  }

  if (url.length > 500) {
    throw new HomeLinkValidationError("Link Kalender Akademik maksimal 500 karakter.");
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new HomeLinkValidationError("Link Kalender Akademik harus berupa URL absolut.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new HomeLinkValidationError("Link Kalender Akademik harus memakai http:// atau https://.");
  }

  return parsed.toString();
}

function normalizeInput(input: HomeLinkInput, existing?: HomeLink | null) {
  return {
    url: normalizeUrl(input.url),
    isActive: normalizeBoolean(input.isActive, existing?.isActive ?? true),
    actor: input.actor?.trim().slice(0, 100) || null,
  };
}

export function assertValidAcademicCalendarInput(input: HomeLinkInput) {
  normalizeInput(input);
}

export async function ensureHomeLinksTableAvailable() {
  if (!(await hasHomeLinksTable())) {
    throw new HomeLinksTableUnavailableError();
  }
}

export async function getAcademicCalendarLink() {
  if (!(await hasHomeLinksTable())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<HomeLinkRecord[]>`
      SELECT
        ID,
        LINK_KEY,
        LABEL,
        URL,
        IS_ACTIVE,
        CREATED_AT,
        UPDATED_AT,
        UPDATED_BY
      FROM ult_home_links
      WHERE LINK_KEY = ${ACADEMIC_CALENDAR_LINK_KEY}
      LIMIT 1
    `;

    return rows[0] ? toHomeLink(rows[0]) : null;
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

export async function getHomeLinksState() {
  const tableAvailable = await hasHomeLinksTable();

  if (!tableAvailable) {
    return {
      academicCalendar: null,
      unavailable: true,
    };
  }

  return {
    academicCalendar: await getAcademicCalendarLink(),
    unavailable: false,
  };
}

export async function updateAcademicCalendarLink(input: HomeLinkInput) {
  await ensureHomeLinksTableAvailable();

  const existing = await getAcademicCalendarLink();
  const data = normalizeInput(input, existing);

  await prisma.$executeRaw`
    INSERT INTO ult_home_links (
      LINK_KEY,
      LABEL,
      URL,
      IS_ACTIVE,
      UPDATED_BY
    ) VALUES (
      ${ACADEMIC_CALENDAR_LINK_KEY},
      ${ACADEMIC_CALENDAR_LABEL},
      ${data.url},
      ${data.isActive ? 1 : 0},
      ${data.actor}
    ) ON DUPLICATE KEY UPDATE
      LABEL = VALUES(LABEL),
      URL = VALUES(URL),
      IS_ACTIVE = VALUES(IS_ACTIVE),
      UPDATED_BY = VALUES(UPDATED_BY),
      UPDATED_AT = CURRENT_TIMESTAMP(3)
  `;

  return getAcademicCalendarLink();
}
