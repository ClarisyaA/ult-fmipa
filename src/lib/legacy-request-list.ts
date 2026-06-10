import { Prisma } from "@prisma/client";

import { getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type {
  PaginatedServiceRequests,
  RequestStatus,
  ServiceRequestListItem,
} from "@/types/request";

type RequestListOptions = {
  service?: string;
  status?: RequestStatus;
  page?: number;
  limit?: number;
};

type NormalWorkflowMetadata = {
  workflow: "normal";
  deliveryColumn: "DIAMBIL_TGL" | "DIKIRIM_TGL";
};

type VerificationWorkflowMetadata = {
  workflow: "verification";
};

type RequestTableMetadata =
  | NormalWorkflowMetadata
  | VerificationWorkflowMetadata;

const requestTableMetadata = {
  masih_kuliah_aktif: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  masih_kuliah: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  keterangan_lulus: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  kpa: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  legalisir: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  transkrip: { workflow: "verification" },
  bebas_pinjaman: { workflow: "normal", deliveryColumn: "DIKIRIM_TGL" },
  plagiarisme: { workflow: "normal", deliveryColumn: "DIKIRIM_TGL" },
  referensi: { workflow: "normal", deliveryColumn: "DIKIRIM_TGL" },
  unggah_karya_ilmiah: { workflow: "normal", deliveryColumn: "DIKIRIM_TGL" },
  surat_pengantar: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  beasiswa: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  kelakuan_baik: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  ijazah: { workflow: "verification" },
  kks: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
} satisfies Record<string, RequestTableMetadata>;

type RequestTableName = keyof typeof requestTableMetadata;

type RequestService = {
  title: string;
  slug: string;
  sourceTable: RequestTableName;
};

type RequestRow = {
  id: string | number | bigint;
  serviceTitle: string;
  serviceSlug: string;
  sourceTable: string;
  npm: string | null;
  requestDate: Date | string | null;
  status: RequestStatus;
};

const requestStatusLabels = {
  pending: "Menunggu Proses",
  inProgress: "Sedang Diproses",
  completed: "Selesai",
  delivered: "Diambil/Dikirim",
} satisfies Record<RequestStatus, string>;

const allowedStatuses = new Set<RequestStatus>([
  "pending",
  "inProgress",
  "completed",
  "delivered",
]);

export function maskNpm(npm?: string | null): string {
  if (!npm) {
    return "-";
  }

  if (npm.length <= 8) {
    return npm;
  }

  return `${npm.slice(0, 4)}${"*".repeat(npm.length - 8)}${npm.slice(-4)}`;
}

export function parseRequestStatus(status?: string | null) {
  if (!status || !allowedStatuses.has(status as RequestStatus)) {
    return undefined;
  }

  return status as RequestStatus;
}

function isRequestTable(sourceTable: string): sourceTable is RequestTableName {
  return sourceTable in requestTableMetadata;
}

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function normalizePage(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function normalizeLimit(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) {
    return 10;
  }

  return Math.min(Math.floor(value), 50);
}

function getRequestServices(serviceSlug?: string): RequestService[] {
  return getPublicServices().flatMap((service) => {
    if (serviceSlug && service.slug !== serviceSlug) {
      return [];
    }

    if (!isRequestTable(service.sourceTable)) {
      return [];
    }

    return [
      {
        title: service.title,
        slug: service.slug,
        sourceTable: service.sourceTable,
      },
    ];
  });
}

function buildNormalStatusSql(deliveryColumn: string) {
  const delivery = Prisma.raw(quoteIdentifier(deliveryColumn));

  return Prisma.sql`CASE
    WHEN ${delivery} IS NOT NULL THEN 'delivered'
    WHEN \`SELESAI_TGL\` IS NOT NULL THEN 'completed'
    WHEN \`PROSES_TGL\` IS NOT NULL AND \`SELESAI_TGL\` IS NULL THEN 'inProgress'
    ELSE 'pending'
  END`;
}

function buildVerificationStatusSql() {
  return Prisma.sql`CASE
    WHEN \`DIAMBIL_TGL\` IS NOT NULL THEN 'delivered'
    WHEN \`UNIVERSITAS_TGL\` IS NOT NULL THEN 'completed'
    WHEN \`VERIFIKASI_TGL\` IS NOT NULL AND \`DIAMBIL_TGL\` IS NULL THEN 'inProgress'
    ELSE 'pending'
  END`;
}

function buildServiceSelect(service: RequestService) {
  const metadata = requestTableMetadata[service.sourceTable];
  const table = Prisma.raw(quoteIdentifier(service.sourceTable));
  const statusSql =
    metadata.workflow === "normal"
      ? buildNormalStatusSql(metadata.deliveryColumn)
      : buildVerificationStatusSql();

  return Prisma.sql`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      ${service.title} AS serviceTitle,
      ${service.slug} AS serviceSlug,
      ${service.sourceTable} AS sourceTable,
      \`NPM\` AS npm,
      \`PERMINTAAN_TGL\` AS requestDate,
      ${statusSql} AS status
    FROM ${table}
  `;
}

function buildUnionSql(services: RequestService[]) {
  return Prisma.join(
    services.map((service) => buildServiceSelect(service)),
    " UNION ALL "
  );
}

function serializeRequestDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toListItem(row: RequestRow): ServiceRequestListItem {
  return {
    id: String(row.id),
    serviceTitle: row.serviceTitle,
    serviceSlug: row.serviceSlug,
    sourceTable: row.sourceTable,
    maskedNpm: maskNpm(row.npm),
    requestDate: serializeRequestDate(row.requestDate),
    status: row.status,
    statusLabel: requestStatusLabels[row.status],
  };
}

export async function getServiceRequestList(
  options: RequestListOptions = {}
): Promise<PaginatedServiceRequests> {
  const page = normalizePage(options.page);
  const limit = normalizeLimit(options.limit);
  const offset = (page - 1) * limit;
  const services = getRequestServices(options.service);

  if (services.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const unionSql = buildUnionSql(services);
  const statusFilter = options.status
    ? Prisma.sql`WHERE status = ${options.status}`
    : Prisma.empty;

  const countRows = await prisma.$queryRaw<{ total: bigint | number }[]>`
    SELECT COUNT(*) AS total
    FROM (${unionSql}) AS requests
    ${statusFilter}
  `;

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const rows = await prisma.$queryRaw<RequestRow[]>`
    SELECT
      id,
      serviceTitle,
      serviceSlug,
      sourceTable,
      npm,
      requestDate,
      status
    FROM (${unionSql}) AS requests
    ${statusFilter}
    ORDER BY requestDate DESC, id DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return {
    data: rows.map(toListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
