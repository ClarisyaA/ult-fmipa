import { Prisma } from "@prisma/client";

import { getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Whitelisted table metadata (same set as legacy-request-stats)
// ---------------------------------------------------------------------------

type NormalMeta = {
  workflow: "normal";
  requestDateColumn: string;
  processColumn: string;
  completeColumn: string;
  deliveryColumn: string;
  processStaffColumn: string;
  completeStaffColumn: string;
};

type VerificationMeta = {
  workflow: "verification";
  requestDateColumn: string;
};

type TableMeta = NormalMeta | VerificationMeta;

const tableMeta: Record<string, TableMeta> = {
  masih_kuliah_aktif: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  masih_kuliah: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  keterangan_lulus: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  kpa: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  legalisir: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  transkrip: {
    workflow: "verification",
    requestDateColumn: "PERMINTAAN_TGL",
  },
  bebas_pinjaman: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  plagiarisme: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  referensi: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  unggah_karya_ilmiah: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIKIRIM_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  surat_pengantar: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  beasiswa: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  kelakuan_baik: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
  ijazah: {
    workflow: "verification",
    requestDateColumn: "PERMINTAAN_TGL",
  },
  kks: {
    workflow: "normal",
    requestDateColumn: "PERMINTAAN_TGL",
    processColumn: "PROSES_TGL",
    completeColumn: "SELESAI_TGL",
    deliveryColumn: "DIAMBIL_TGL",
    processStaffColumn: "PROSES_STAF",
    completeStaffColumn: "SELESAI_STAF",
  },
};

function q(id: string) {
  return `\`${id.replaceAll("`", "``")}\``;
}

function toNum(v: bigint | number | null | undefined) {
  return v == null ? 0 : Number(v);
}

// ---------------------------------------------------------------------------
// Service report — per-service aggregate with optional date filter
// ---------------------------------------------------------------------------

export type ServiceReportRow = {
  serviceTitle: string;
  serviceSlug: string;
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  delivered: number;
};

export type ServiceReport = {
  rows: ServiceReportRow[];
  totalAll: number;
  totalPending: number;
  totalInProgress: number;
  totalCompleted: number;
  totalDelivered: number;
};

type RawServiceRow = {
  title: string;
  slug: string;
  total: bigint | number | null;
  pending: bigint | number | null;
  inProgress: bigint | number | null;
  completed: bigint | number | null;
  delivered: bigint | number | null;
};

export async function getServiceReport(options?: {
  dateFrom?: string;
  dateTo?: string;
  serviceSlug?: string;
}): Promise<ServiceReport> {
  const services = getPublicServices().filter(
    (s) =>
      s.sourceTable in tableMeta &&
      (!options?.serviceSlug || s.slug === options.serviceSlug)
  );

  if (services.length === 0) {
    return { rows: [], totalAll: 0, totalPending: 0, totalInProgress: 0, totalCompleted: 0, totalDelivered: 0 };
  }

  const queries = services.map((svc) => {
    const meta = tableMeta[svc.sourceTable];
    const tbl = Prisma.raw(q(svc.sourceTable));
    const dateCol = Prisma.raw(q(meta.requestDateColumn));

    let dateFilter = Prisma.sql``;
    if (options?.dateFrom && options?.dateTo) {
      dateFilter = Prisma.sql` WHERE ${dateCol} >= ${options.dateFrom} AND ${dateCol} <= ${options.dateTo}`;
    } else if (options?.dateFrom) {
      dateFilter = Prisma.sql` WHERE ${dateCol} >= ${options.dateFrom}`;
    } else if (options?.dateTo) {
      dateFilter = Prisma.sql` WHERE ${dateCol} <= ${options.dateTo}`;
    }

    if (meta.workflow === "normal") {
      const proc = Prisma.raw(q(meta.processColumn));
      const comp = Prisma.raw(q(meta.completeColumn));
      const dlvr = Prisma.raw(q(meta.deliveryColumn));

      return Prisma.sql`SELECT ${svc.title} AS title, ${svc.slug} AS slug,
        COUNT(*) AS total,
        SUM(CASE WHEN ${proc} IS NULL THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN ${proc} IS NOT NULL AND ${comp} IS NULL THEN 1 ELSE 0 END) AS inProgress,
        SUM(CASE WHEN ${comp} IS NOT NULL THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN ${dlvr} IS NOT NULL THEN 1 ELSE 0 END) AS delivered
        FROM ${tbl}${dateFilter}`;
    }

    return Prisma.sql`SELECT ${svc.title} AS title, ${svc.slug} AS slug,
      COUNT(*) AS total,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NOT NULL AND \`DIAMBIL_TGL\` IS NULL THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN \`UNIVERSITAS_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN \`DIAMBIL_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS delivered
      FROM ${tbl}${dateFilter}`;
  });

  try {
    const query = Prisma.join(queries, " UNION ALL ");
    const raw = await prisma.$queryRaw<RawServiceRow[]>(query);

    const rows: ServiceReportRow[] = raw.map((r) => ({
      serviceTitle: r.title,
      serviceSlug: r.slug,
      total: toNum(r.total),
      pending: toNum(r.pending),
      inProgress: toNum(r.inProgress),
      completed: toNum(r.completed),
      delivered: toNum(r.delivered),
    }));

    return {
      rows,
      totalAll: rows.reduce((s, r) => s + r.total, 0),
      totalPending: rows.reduce((s, r) => s + r.pending, 0),
      totalInProgress: rows.reduce((s, r) => s + r.inProgress, 0),
      totalCompleted: rows.reduce((s, r) => s + r.completed, 0),
      totalDelivered: rows.reduce((s, r) => s + r.delivered, 0),
    };
  } catch (err) {
    console.error("[admin-reports] getServiceReport error", err);
    return { rows: [], totalAll: 0, totalPending: 0, totalInProgress: 0, totalCompleted: 0, totalDelivered: 0 };
  }
}

// ---------------------------------------------------------------------------
// Staff performance — aggregate PROSES_STAF / SELESAI_STAF counts
// ---------------------------------------------------------------------------

export type StaffPerformanceRow = {
  staffName: string;
  processed: number;
  completed: number;
};

type RawStaffRow = {
  staff: string;
  processed: bigint | number | null;
  completed: bigint | number | null;
};

export async function getStaffPerformance(options?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<StaffPerformanceRow[]> {
  // Only normal-workflow tables have PROSES_STAF / SELESAI_STAF
  const normalTables = Object.entries(tableMeta).filter(
    (e): e is [string, NormalMeta] => e[1].workflow === "normal"
  );

  if (normalTables.length === 0) return [];

  const queries = normalTables.map(([tblName, meta]) => {
    const tbl = Prisma.raw(q(tblName));
    const procStaff = Prisma.raw(q(meta.processStaffColumn));
    const dateCol = Prisma.raw(q(meta.requestDateColumn));

    const whereParts: Prisma.Sql[] = [
      Prisma.sql`${procStaff} IS NOT NULL`,
      Prisma.sql`${procStaff} != ''`,
    ];

    if (options?.dateFrom && options?.dateTo) {
      whereParts.push(
        Prisma.sql`${dateCol} >= ${options.dateFrom}`,
        Prisma.sql`${dateCol} <= ${options.dateTo}`
      );
    } else if (options?.dateFrom) {
      whereParts.push(Prisma.sql`${dateCol} >= ${options.dateFrom}`);
    } else if (options?.dateTo) {
      whereParts.push(Prisma.sql`${dateCol} <= ${options.dateTo}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereParts, " AND ")}`;

    return Prisma.sql`
      SELECT ${procStaff} AS staff,
        COUNT(*) AS processed,
        SUM(CASE WHEN ${Prisma.raw(q(meta.completeColumn))} IS NOT NULL THEN 1 ELSE 0 END) AS completed
      FROM ${tbl}
      ${whereClause}
      GROUP BY ${procStaff}`;
  });

  try {
    const query = Prisma.join(queries, " UNION ALL ");
    // Wrap to aggregate across all tables
    const wrapperQuery = Prisma.sql`SELECT staff, SUM(processed) AS processed, SUM(completed) AS completed FROM (${query}) AS combined GROUP BY staff ORDER BY processed DESC LIMIT 50`;
    const raw = await prisma.$queryRaw<RawStaffRow[]>(wrapperQuery);

    return raw
      .filter((r) => r.staff && r.staff.trim() !== "")
      .map((r) => ({
        staffName: r.staff,
        processed: toNum(r.processed),
        completed: toNum(r.completed),
      }));
  } catch (err) {
    console.error("[admin-reports] getStaffPerformance error", err);
    return [];
  }
}
