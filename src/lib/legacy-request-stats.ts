import { Prisma } from "@prisma/client";

import { getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type {
  DashboardSummary,
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
  sourceTable: RequestTableName;
};

type CountRow = {
  title: string;
  slug: string;
  sourceTable: RequestTableName;
  total: bigint | number | null;
  pending: bigint | number | null;
  inProgress: bigint | number | null;
  completed: bigint | number | null;
  delivered: bigint | number | null;
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

function isRequestTable(sourceTable: string): sourceTable is RequestTableName {
  return sourceTable in requestTableMetadata;
}

function isPoolTimeoutError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  return (
    error.code === "45028" &&
    typeof error.message === "string" &&
    error.message.includes("pool timeout")
  );
}

function getEmptyServiceSummary(
  service: ServiceWithRequestTable
): ServiceRequestSummary {
  return {
    title: service.title,
    slug: service.slug,
    sourceTable: service.sourceTable,
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    delivered: 0,
  };
}

function getEmptyDashboardSummary(
  services: ServiceWithRequestTable[]
): DashboardSummary {
  return {
    totalServices: services.length,
    totalRequests: 0,
    totalPending: 0,
    totalInProgress: 0,
    totalCompleted: 0,
    totalDelivered: 0,
    services: services.map(getEmptyServiceSummary),
  };
}

function getNormalWorkflowSummaryQuery(
  service: ServiceWithRequestTable,
  sourceTable: RequestTableName,
  metadata: NormalWorkflowMetadata
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const processColumn = Prisma.raw(quoteIdentifier(metadata.processColumn));
  const completeColumn = Prisma.raw(quoteIdentifier(metadata.completeColumn));
  const deliveryColumn = Prisma.raw(quoteIdentifier(metadata.deliveryColumn));

  return Prisma.sql`
    SELECT
      ${service.title} AS title,
      ${service.slug} AS slug,
      ${sourceTable} AS sourceTable,
      COUNT(*) AS total,
      SUM(CASE WHEN ${processColumn} IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN ${processColumn} IS NOT NULL AND ${completeColumn} IS NULL THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN ${completeColumn} IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN ${deliveryColumn} IS NOT NULL THEN 1 ELSE 0 END) AS delivered
    FROM ${table}
  `;
}

function getVerificationWorkflowSummaryQuery(
  service: ServiceWithRequestTable,
  sourceTable: RequestTableName
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));

  return Prisma.sql`
    SELECT
      ${service.title} AS title,
      ${service.slug} AS slug,
      ${sourceTable} AS sourceTable,
      COUNT(*) AS total,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NOT NULL AND \`DIAMBIL_TGL\` IS NULL THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN \`UNIVERSITAS_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN \`DIAMBIL_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS delivered
    FROM ${table}
  `;
}

function getServiceSummaryQuery(service: ServiceWithRequestTable) {
  const sourceTable = service.sourceTable;
  const metadata = requestTableMetadata[sourceTable];

  return metadata.workflow === "normal"
    ? getNormalWorkflowSummaryQuery(service, sourceTable, metadata)
    : getVerificationWorkflowSummaryQuery(service, sourceTable);
}

function mapServiceSummary(row: CountRow): ServiceRequestSummary {
  return {
    title: row.title,
    slug: row.slug,
    sourceTable: row.sourceTable,
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
          sourceTable: service.sourceTable,
        },
      ];
    }
  );

  let serviceSummaries: ServiceRequestSummary[];

  try {
    const query = Prisma.join(
      services.map((service) => getServiceSummaryQuery(service)),
      " UNION ALL "
    );

    const rows = await prisma.$queryRaw<CountRow[]>(query);
    serviceSummaries = rows.map(mapServiceSummary);
  } catch (error) {
    if (!isPoolTimeoutError(error)) {
      throw error;
    }

    console.error("[dashboard-summary] database pool timeout", error);
    serviceSummaries = getEmptyDashboardSummary(services).services;
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
    }
  );
}
