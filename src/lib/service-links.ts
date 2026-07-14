import { isDatabaseUnavailableError } from "@/lib/error-utils";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SCHOLARSHIP_TEMPLATE_URL,
  SCHOLARSHIP_SERVICE_SLUG,
  SCHOLARSHIP_TEMPLATE_LABEL,
  SCHOLARSHIP_TEMPLATE_LINK_KEY,
} from "@/lib/service-link-constants";

export type ServiceLink = {
  id: string;
  serviceSlug: string;
  key: string;
  label: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type PublicServiceLink = Pick<
  ServiceLink,
  "key" | "label" | "url" | "isActive"
>;

export type ServiceLinkInput = {
  url: string;
  isActive?: boolean | string | null;
  actor?: string | null;
};

type ServiceLinkRecord = {
  ID: bigint | number | string;
  SERVICE_SLUG: string;
  LINK_KEY: string;
  LABEL: string;
  URL: string;
  IS_ACTIVE: boolean | number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  UPDATED_BY: string | null;
};

export class ServiceLinkValidationError extends Error {
  statusCode = 400;
}

export class ServiceLinksTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(
      "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
    );
    this.name = "ServiceLinksTableUnavailableError";
  }
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toServiceLink(record: ServiceLinkRecord): ServiceLink {
  return {
    id: String(record.ID),
    serviceSlug: record.SERVICE_SLUG,
    key: record.LINK_KEY,
    label: record.LABEL,
    url: record.URL,
    isActive: Boolean(record.IS_ACTIVE),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    updatedBy: record.UPDATED_BY,
  };
}

function toPublicServiceLink(link: ServiceLink): PublicServiceLink {
  return {
    key: link.key,
    label: link.label,
    url: link.url,
    isActive: link.isActive,
  };
}

function isMissingServiceLinksTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("ult_service_links") &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnServiceLinksReadError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (error) {
      console.warn(message, error);
    } else {
      console.warn(message);
    }
  }
}

async function hasServiceLinksTable() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ult_service_links'
    `;

    if (Number(rows[0]?.tableCount ?? 0) > 0) {
      return true;
    }

    warnServiceLinksReadError(
      "Table link layanan belum tersedia. Jalankan migration 015_create_ult_service_links.sql."
    );
    return false;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      warnServiceLinksReadError("Database link layanan sementara tidak tersedia.", error);
      return false;
    }

    throw error;
  }
}

function normalizeBoolean(value: boolean | string | null | undefined, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }
  return fallback;
}

function normalizeUrl(value: string) {
  const url = value.trim();

  if (!url) {
    throw new ServiceLinkValidationError("Link template wajib diisi.");
  }

  if (url.length > 500) {
    throw new ServiceLinkValidationError("Link template maksimal 500 karakter.");
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new ServiceLinkValidationError("Link template harus berupa URL absolut.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new ServiceLinkValidationError(
      "Link template harus memakai http:// atau https://."
    );
  }

  return parsed.toString();
}

function normalizeInput(input: ServiceLinkInput, existing?: ServiceLink | null) {
  return {
    url: normalizeUrl(input.url),
    isActive: normalizeBoolean(input.isActive, existing?.isActive ?? true),
    actor: input.actor?.trim().slice(0, 100) || null,
  };
}

export function assertValidScholarshipTemplateInput(input: ServiceLinkInput) {
  normalizeInput(input);
}

export async function ensureServiceLinksTableAvailable() {
  if (!(await hasServiceLinksTable())) {
    throw new ServiceLinksTableUnavailableError();
  }
}

export function getDefaultScholarshipTemplateLink(): PublicServiceLink {
  return {
    key: SCHOLARSHIP_TEMPLATE_LINK_KEY,
    label: SCHOLARSHIP_TEMPLATE_LABEL,
    url: DEFAULT_SCHOLARSHIP_TEMPLATE_URL,
    isActive: true,
  };
}

export async function getServiceLinks(serviceSlug: string) {
  if (!(await hasServiceLinksTable())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<ServiceLinkRecord[]>`
      SELECT
        ID,
        SERVICE_SLUG,
        LINK_KEY,
        LABEL,
        URL,
        IS_ACTIVE,
        CREATED_AT,
        UPDATED_AT,
        UPDATED_BY
      FROM ult_service_links
      WHERE SERVICE_SLUG = ${serviceSlug}
      ORDER BY LINK_KEY ASC
    `;

    return rows.map(toServiceLink);
  } catch (error) {
    if (isMissingServiceLinksTableError(error) || isDatabaseUnavailableError(error)) {
      warnServiceLinksReadError("Link layanan tidak dapat dibaca.", error);
      return null;
    }

    throw error;
  }
}

export async function getScholarshipTemplateServiceLink() {
  const links = await getServiceLinks(SCHOLARSHIP_SERVICE_SLUG);
  return (
    links?.find((link) => link.key === SCHOLARSHIP_TEMPLATE_LINK_KEY) ?? null
  );
}

export async function getPublicScholarshipTemplateLink() {
  const link = await getScholarshipTemplateServiceLink();
  return link ? toPublicServiceLink(link) : getDefaultScholarshipTemplateLink();
}

export async function getPublicServiceTemplateLinks(serviceSlug: string) {
  if (serviceSlug !== SCHOLARSHIP_SERVICE_SLUG) {
    return {};
  }

  const link = await getPublicScholarshipTemplateLink();

  return {
    scholarshipRecommendation: link,
  };
}

export async function getServiceLinksState() {
  const tableAvailable = await hasServiceLinksTable();

  if (!tableAvailable) {
    return {
      scholarshipTemplate: null,
      unavailable: true,
    };
  }

  return {
    scholarshipTemplate: await getScholarshipTemplateServiceLink(),
    unavailable: false,
  };
}

export async function updateScholarshipTemplateServiceLink(input: ServiceLinkInput) {
  await ensureServiceLinksTableAvailable();

  const existing = await getScholarshipTemplateServiceLink();
  const data = normalizeInput(input, existing);

  await prisma.$executeRaw`
    INSERT INTO ult_service_links (
      SERVICE_SLUG,
      LINK_KEY,
      LABEL,
      URL,
      IS_ACTIVE,
      UPDATED_BY
    ) VALUES (
      ${SCHOLARSHIP_SERVICE_SLUG},
      ${SCHOLARSHIP_TEMPLATE_LINK_KEY},
      ${SCHOLARSHIP_TEMPLATE_LABEL},
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

  return getScholarshipTemplateServiceLink();
}
