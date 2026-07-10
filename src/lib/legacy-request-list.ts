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
  serviceSlugs?: string[];
  status?: RequestStatus;
  q?: string;
  page?: number;
  limit?: number;
};

type NormalWorkflowMetadata = {
  workflow: "normal";
  deliveryColumn: "DIAMBIL_TGL" | "DIKIRIM_TGL";
  purposeColumns?: string[];
};

type VerificationWorkflowMetadata = {
  workflow: "verification";
};

type SikWorkflowMetadata = {
  workflow: "sik";
};

type RequestTableMetadata =
  | NormalWorkflowMetadata
  | VerificationWorkflowMetadata
  | SikWorkflowMetadata;

const requestTableMetadata = {
  masih_kuliah_aktif: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    purposeColumns: ["KEPERLUAN"],
  },
  masih_kuliah: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  keterangan_lulus: { workflow: "normal", deliveryColumn: "DIAMBIL_TGL" },
  kpa: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    purposeColumns: ["KEPERLUAN"],
  },
  legalisir: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    purposeColumns: ["KEPERLUAN"],
  },
  transkrip: { workflow: "verification" },
  bebas_pinjaman: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    purposeColumns: ["KETERANGAN"],
  },
  plagiarisme: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    purposeColumns: ["KETERANGAN"],
  },
  referensi: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    purposeColumns: ["KETERANGAN"],
  },
  unggah_karya_ilmiah: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    purposeColumns: ["KETERANGAN"],
  },
  surat_pengantar: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    purposeColumns: ["PENGANTAR", "DITUJUKAN"],
  },
  permohonan_magang: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    purposeColumns: [
      "JENIS_PERMOHONAN",
      "TEMPAT_PELAKSANAAN",
      "TUJUAN_SURAT",
      "TANGGAL_MULAI",
      "TANGGAL_SELESAI",
    ],
  },
  surat_izin_kegiatan: {
    workflow: "sik",
  },
  beasiswa: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    purposeColumns: ["BEASISWA"],
  },
  kelakuan_baik: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    purposeColumns: ["KEPERLUAN"],
  },
  ijazah: { workflow: "verification" },
  kks: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    purposeColumns: ["KEPERLUAN"],
  },
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
  purpose: string | null;
  requestDate: Date | string | null;
  status: RequestStatus;
};

const requestStatusLabels = {
  pending: "Menunggu",
  inProgress: "Diproses",
  completed: "Selesai",
  delivered: "Diambil/Dikirim",
  sikApprovalPending: "Menunggu Verifikasi",
  sikApprovalRejected: "Ditolak",
  sikApprovalVerified: "Terverifikasi",
  sikFinalSubmitted: "Form Final Terkirim",
} satisfies Record<RequestStatus, string>;

const allowedStatuses = new Set<RequestStatus>([
  "pending",
  "inProgress",
  "completed",
  "delivered",
  "sikApprovalPending",
  "sikApprovalRejected",
  "sikApprovalVerified",
  "sikFinalSubmitted",
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

function getRequestServices(
  serviceSlug?: string,
  serviceSlugs?: string[],
): RequestService[] {
  const allowedServiceSlugs =
    serviceSlugs && serviceSlugs.length > 0 ? new Set(serviceSlugs) : null;

  return getPublicServices().flatMap((service) => {
    if (serviceSlug && service.slug !== serviceSlug) {
      return [];
    }

    if (
      !serviceSlug &&
      allowedServiceSlugs &&
      !allowedServiceSlugs.has(service.slug)
    ) {
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

function buildSikStatusSql() {
  return Prisma.sql`CASE
    WHEN \`DIKIRIM_TGL\` IS NOT NULL THEN 'delivered'
    WHEN \`SELESAI_TGL\` IS NOT NULL THEN 'completed'
    WHEN \`PROSES_TGL\` IS NOT NULL AND \`SELESAI_TGL\` IS NULL THEN 'inProgress'
    WHEN \`FINAL_SUBMITTED_TGL\` IS NOT NULL THEN 'sikFinalSubmitted'
    WHEN \`APPROVAL_STATUS\` = 'verified' THEN 'sikApprovalVerified'
    WHEN \`APPROVAL_STATUS\` = 'rejected' THEN 'sikApprovalRejected'
    ELSE 'sikApprovalPending'
  END`;
}

function buildPurposeSql(metadata: RequestTableMetadata) {
  if (metadata.workflow !== "normal" || !metadata.purposeColumns?.length) {
    return Prisma.sql`CONVERT(NULL USING utf8mb3) COLLATE utf8mb3_unicode_ci`;
  }

  const columns = metadata.purposeColumns.map((column) => {
    const identifier = Prisma.raw(quoteIdentifier(column));

    return Prisma.sql`NULLIF(CONVERT(${identifier} USING utf8mb3) COLLATE utf8mb3_unicode_ci, '')`;
  });

  return Prisma.sql`COALESCE(${Prisma.join(columns, ", ")})`;
}

function buildServiceSelect(service: RequestService) {
  const metadata = requestTableMetadata[service.sourceTable];
  const table = Prisma.raw(quoteIdentifier(service.sourceTable));
  const statusSql =
    metadata.workflow === "normal"
      ? buildNormalStatusSql(metadata.deliveryColumn)
      : metadata.workflow === "verification"
        ? buildVerificationStatusSql()
        : buildSikStatusSql();
  const purposeSql =
    metadata.workflow === "sik"
      ? Prisma.sql`COALESCE(
          NULLIF(CONVERT(\`NAMA_KEGIATAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
          NULLIF(CONVERT(\`NAMA_HIMPUNAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
          NULLIF(CONVERT(\`APPROVAL_STATUS\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, '')
        )`
      : buildPurposeSql(metadata);
  const requestDateSql =
    metadata.workflow === "sik"
      ? Prisma.sql`COALESCE(\`FINAL_SUBMITTED_TGL\`, \`PERMINTAAN_TGL\`)`
      : Prisma.sql`\`PERMINTAAN_TGL\``;

  return Prisma.sql`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      ${service.title} AS serviceTitle,
      ${service.slug} AS serviceSlug,
      ${service.sourceTable} AS sourceTable,
      \`NPM\` AS npm,
      ${purposeSql} AS purpose,
      ${requestDateSql} AS requestDate,
      ${statusSql} AS status
    FROM ${table}
  `;
}

function buildUnionSql(services: RequestService[]) {
  return Prisma.join(
    services.map((service) => buildServiceSelect(service)),
    " UNION ALL ",
  );
}

function buildWhereSql(options: RequestListOptions) {
  const conditions: Prisma.Sql[] = [];
  const normalizedQuery = options.q?.trim();

  if (options.status) {
    conditions.push(Prisma.sql`status = ${options.status}`);
  }

  if (normalizedQuery) {
    const query = `%${normalizedQuery}%`;
    const normalizedQuerySql = Prisma.sql`CONVERT(${query} USING utf8mb3) COLLATE utf8mb3_unicode_ci`;

    conditions.push(
      Prisma.sql`(
        requests.\`npm\` COLLATE utf8mb3_unicode_ci LIKE ${normalizedQuerySql}
        OR requests.\`npm\` COLLATE utf8mb3_unicode_ci IN (
          SELECT active_student.\`NPM\` COLLATE utf8mb3_unicode_ci
          FROM \`mahasiswa\` active_student
          WHERE active_student.\`NAMA\` COLLATE utf8mb3_unicode_ci LIKE ${normalizedQuerySql}
          UNION
          SELECT archived_student.\`NPM\` COLLATE utf8mb3_unicode_ci
          FROM \`mahasiswa_sd_2015\` archived_student
          WHERE archived_student.\`NAMA\` COLLATE utf8mb3_unicode_ci LIKE ${normalizedQuerySql}
          UNION
          SELECT alumni_profile.\`npm\` COLLATE utf8mb3_unicode_ci
          FROM \`alumni\` alumni_profile
          WHERE alumni_profile.\`nama\` COLLATE utf8mb3_unicode_ci LIKE ${normalizedQuerySql}
        )
      )`,
    );
  }

  if (conditions.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

function serializeRequestDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function toListItem(row: RequestRow): ServiceRequestListItem {
  return {
    id: String(row.id),
    serviceTitle: row.serviceTitle,
    serviceSlug: row.serviceSlug,
    sourceTable: row.sourceTable,
    maskedNpm: maskNpm(row.npm),
    purpose: row.purpose,
    requestDate: serializeRequestDate(row.requestDate),
    status: row.status,
    statusLabel: requestStatusLabels[row.status],
  };
}

export async function getServiceRequestList(
  options: RequestListOptions = {},
): Promise<PaginatedServiceRequests> {
  const page = normalizePage(options.page);
  const limit = normalizeLimit(options.limit);
  const offset = (page - 1) * limit;
  const services = getRequestServices(options.service, options.serviceSlugs);

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
  const whereSql = buildWhereSql(options);

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint | number }[]>`
      SELECT COUNT(*) AS total
      FROM (${unionSql}) AS requests
      ${whereSql}
    `,
    prisma.$queryRaw<RequestRow[]>`
      SELECT
        id,
        serviceTitle,
        serviceSlug,
        sourceTable,
        npm,
        purpose,
        requestDate,
        status
      FROM (${unionSql}) AS requests
      ${whereSql}
      ORDER BY requestDate DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
  ]);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

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
