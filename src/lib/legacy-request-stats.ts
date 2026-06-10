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

async function getNormalWorkflowSummary(
  sourceTable: RequestTableName,
  metadata: NormalWorkflowMetadata
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

async function getServiceSummary(
  title: string,
  slug: string,
  sourceTable: RequestTableName
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
          sourceTable: service.sourceTable,
        },
      ];
    }
  );

  const serviceSummaries = await Promise.all(
    services.map((service) =>
      getServiceSummary(service.title, service.slug, service.sourceTable)
    )
  );

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
