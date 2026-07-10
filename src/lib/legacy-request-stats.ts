import { Prisma } from "@prisma/client";

import { getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type {
  DashboardSummary,
  PendingDashboardRequestRow,
  ServiceRequestSummary,
} from "@/types/dashboard";

type NormalWorkflowMetadata = {
  workflow: "normal";
  processColumn: "PROSES_TGL";
  completeColumn: "SELESAI_TGL";
  deliveryColumn: "DIAMBIL_TGL" | "DIKIRIM_TGL";
};

type VerificationWorkflowMetadata = {
  workflow: "verification";
};

type RequestTableMetadata =
  | NormalWorkflowMetadata
  | VerificationWorkflowMetadata;

const requestTableMetadata = {
  masih_kuliah_aktif: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  masih_kuliah: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  keterangan_lulus: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  kpa: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  legalisir: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  transkrip: {
    workflow: "verification",
  },
  bebas_pinjaman: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
  },
  plagiarisme: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
  },
  referensi: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
  },
  unggah_karya_ilmiah: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
  },
  surat_pengantar: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  permohonan_magang: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
  },
  beasiswa: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  kelakuan_baik: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
  ijazah: {
    workflow: "verification",
  },
  kks: {
    workflow: "normal",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
  },
} satisfies Record<string, RequestTableMetadata>;

type RequestTableName = keyof typeof requestTableMetadata;

type ServiceWithRequestTable = {
  title: string;
  slug: string;
  category: string;
  sourceTable: RequestTableName;
};

type CountRow = {
  total: bigint | number | null;
  pending: bigint | number | null;
  inProgress: bigint | number | null;
  completed: bigint | number | null;
  delivered: bigint | number | null;
};

type PendingRequestRow = {
  id: string | bigint | number;
  serviceTitle: string;
  serviceSlug: string;
  serviceCategory: string;
  requesterName: string | null;
  programStudy: string | null;
  requestDate: Date | string | null;
};

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function toNumber(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function serializeRequestDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function isRequestTable(sourceTable: string): sourceTable is RequestTableName {
  return sourceTable in requestTableMetadata;
}

async function getNormalWorkflowSummary(
  sourceTable: RequestTableName,
  metadata: NormalWorkflowMetadata,
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const processColumn = Prisma.raw(quoteIdentifier(metadata.processColumn));
  const completeColumn = Prisma.raw(quoteIdentifier(metadata.completeColumn));
  const deliveryColumn = Prisma.raw(quoteIdentifier(metadata.deliveryColumn));

  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN ${processColumn} IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN ${processColumn} IS NOT NULL AND ${completeColumn} IS NULL THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN ${completeColumn} IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN ${deliveryColumn} IS NOT NULL THEN 1 ELSE 0 END) AS delivered
    FROM ${table}
  `;

  return rows[0];
}

async function getVerificationWorkflowSummary(sourceTable: RequestTableName) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));

  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NOT NULL AND \`DIAMBIL_TGL\` IS NULL THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN \`UNIVERSITAS_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN \`DIAMBIL_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS delivered
    FROM ${table}
  `;

  return rows[0];
}

function buildProgramStudySql() {
  return Prisma.sql`COALESCE(
    NULLIF(CONVERT(active_student.\`PROGRAM_STUDI\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
    NULLIF(CONVERT(archived_student.\`PROGRAM_STUDI\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
    NULLIF(CONVERT(CONCAT_WS(' ', alumni_profile.\`program\`, alumni_profile.\`prodi\`) USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
    CONVERT('Tidak diketahui' USING utf8mb3) COLLATE utf8mb3_unicode_ci
  )`;
}

function buildRequesterNameSql() {
  return Prisma.sql`COALESCE(
    NULLIF(CONVERT(active_student.\`NAMA\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
    NULLIF(CONVERT(archived_student.\`NAMA\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
    NULLIF(CONVERT(alumni_profile.\`nama\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
    CONVERT('Tidak diketahui' USING utf8mb3) COLLATE utf8mb3_unicode_ci
  )`;
}

function buildPendingCondition(metadata: RequestTableMetadata) {
  if (metadata.workflow === "normal") {
    const processColumn = Prisma.raw(quoteIdentifier(metadata.processColumn));

    return Prisma.sql`${processColumn} IS NULL`;
  }

  return Prisma.sql`\`VERIFIKASI_TGL\` IS NULL`;
}

function buildPendingRequestSelect(service: ServiceWithRequestTable) {
  const metadata = requestTableMetadata[service.sourceTable];
  const table = Prisma.raw(quoteIdentifier(service.sourceTable));
  const requesterNameSql = buildRequesterNameSql();
  const programStudySql = buildProgramStudySql();
  const pendingCondition = buildPendingCondition(metadata);

  return Prisma.sql`
    SELECT
      CAST(requests.\`ID\` AS CHAR CHARACTER SET utf8mb3) COLLATE utf8mb3_unicode_ci AS id,
      CONVERT(${service.title} USING utf8mb3) COLLATE utf8mb3_unicode_ci AS serviceTitle,
      CONVERT(${service.slug} USING utf8mb3) COLLATE utf8mb3_unicode_ci AS serviceSlug,
      CONVERT(${service.category} USING utf8mb3) COLLATE utf8mb3_unicode_ci AS serviceCategory,
      ${requesterNameSql} AS requesterName,
      ${programStudySql} AS programStudy,
      requests.\`PERMINTAAN_TGL\` AS requestDate
    FROM ${table} requests
    LEFT JOIN \`mahasiswa\` active_student
      ON active_student.\`NPM\` COLLATE utf8mb3_unicode_ci =
        requests.\`NPM\` COLLATE utf8mb3_unicode_ci
    LEFT JOIN \`mahasiswa_sd_2015\` archived_student
      ON archived_student.\`NPM\` COLLATE utf8mb3_unicode_ci =
        requests.\`NPM\` COLLATE utf8mb3_unicode_ci
    LEFT JOIN (
      SELECT
        \`npm\`,
        MAX(\`nama\`) AS \`nama\`,
        MAX(\`program\`) AS \`program\`,
        MAX(\`prodi\`) AS \`prodi\`
      FROM \`alumni\`
      GROUP BY \`npm\`
    ) alumni_profile
      ON alumni_profile.\`npm\` COLLATE utf8mb3_unicode_ci =
        requests.\`NPM\` COLLATE utf8mb3_unicode_ci
    WHERE ${pendingCondition}
  `;
}

async function getServiceSummary(
  title: string,
  slug: string,
  sourceTable: RequestTableName,
): Promise<ServiceRequestSummary> {
  const metadata = requestTableMetadata[sourceTable];
  const row =
    metadata.workflow === "normal"
      ? await getNormalWorkflowSummary(sourceTable, metadata)
      : await getVerificationWorkflowSummary(sourceTable);

  return {
    title,
    slug,
    sourceTable,
    total: toNumber(row?.total),
    pending: toNumber(row?.pending),
    inProgress: toNumber(row?.inProgress),
    completed: toNumber(row?.completed),
    delivered: toNumber(row?.delivered),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const services: ServiceWithRequestTable[] = getPublicServices().flatMap(
    (service) => {
      if (!isRequestTable(service.sourceTable)) {
        return [];
      }

      return [
        {
          title: service.title,
          slug: service.slug,
          category: service.category,
          sourceTable: service.sourceTable,
        },
      ];
    },
  );

  const serviceSummaries: ServiceRequestSummary[] = [];

  for (const service of services) {
    const serviceSummary = await getServiceSummary(
      service.title,
      service.slug,
      service.sourceTable,
    );

    serviceSummaries.push(serviceSummary);
  }

  return serviceSummaries.reduce<DashboardSummary>(
    (summary, service) => ({
      totalServices: summary.totalServices,
      totalRequests: summary.totalRequests + service.total,
      totalPending: summary.totalPending + service.pending,
      totalInProgress: summary.totalInProgress + service.inProgress,
      totalCompleted: summary.totalCompleted + service.completed,
      totalDelivered: summary.totalDelivered + service.delivered,
      services: summary.services,
    }),
    {
      totalServices: serviceSummaries.length,
      totalRequests: 0,
      totalPending: 0,
      totalInProgress: 0,
      totalCompleted: 0,
      totalDelivered: 0,
      services: serviceSummaries,
    },
  );
}

export async function getLatestPendingDashboardRequests(): Promise<
  PendingDashboardRequestRow[]
> {
  const services: ServiceWithRequestTable[] = getPublicServices().flatMap(
    (service) => {
      if (!isRequestTable(service.sourceTable)) {
        return [];
      }

      return [
        {
          title: service.title,
          slug: service.slug,
          category: service.category,
          sourceTable: service.sourceTable,
        },
      ];
    },
  );

  if (services.length === 0) {
    return [];
  }

  const unionSql = Prisma.join(
    services.map((service) => buildPendingRequestSelect(service)),
    " UNION ALL ",
  );

  const rows = await prisma.$queryRaw<PendingRequestRow[]>`
    SELECT
      id,
      serviceTitle,
      serviceSlug,
      serviceCategory,
      requesterName,
      programStudy,
      requestDate
    FROM (${unionSql}) AS requests
    ORDER BY requestDate DESC, id DESC
    LIMIT 10
  `;

  return rows.map((row) => ({
    id: String(row.id),
    serviceTitle: row.serviceTitle,
    serviceSlug: row.serviceSlug,
    serviceCategory: row.serviceCategory,
    requesterName: row.requesterName || "Tidak diketahui",
    programStudy: row.programStudy || "Tidak diketahui",
    requestDate: serializeRequestDate(row.requestDate),
  }));
}
