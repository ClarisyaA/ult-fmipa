import { Prisma } from "@prisma/client";

import { getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type {
  DashboardSummary,
  PendingDashboardRequestRow,
  PriorityDashboardRequestRow,
  RequestNotificationSnapshot,
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
  surat_izin_kegiatan: {
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

type DashboardSummaryOptions = {
  service?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
};

type PerformanceBucket = "processed" | "completed" | "delivered";

type PerformanceSourceRow = {
  staffName: string | null;
  total: bigint | number | null;
};

export type StaffPerformanceRow = {
  userName: string;
  fullName: string;
  unitName: string;
  processed: number;
  completed: number;
  delivered: number;
  total: number;
};

export type UnitPerformanceRow = {
  unitName: string;
  staffCount: number;
  processed: number;
  completed: number;
  delivered: number;
  total: number;
};

export type PerformanceSummary = {
  staff: StaffPerformanceRow[];
  units: UnitPerformanceRow[];
};

type PendingRequestRow = {
  id: string | bigint | number;
  npm: string | bigint | number | null;
  serviceTitle: string;
  serviceSlug: string;
  serviceCategory: string;
  requesterName: string | null;
  programStudy: string | null;
  requestDate: Date | string | null;
  waitingHours: bigint | number | null;
};

type StudentProfileRow = {
  npm: string | number | bigint | null;
  name: string | null;
  programStudy: string | null;
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

function getPriorityLevel(waitingHours: number): PriorityDashboardRequestRow["priorityLevel"] {
  if (waitingHours >= 72) {
    return "high";
  }

  if (waitingHours >= 24) {
    return "medium";
  }

  return "new";
}

function isRequestTable(sourceTable: string): sourceTable is RequestTableName {
  return sourceTable in requestTableMetadata;
}

function normalizeDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function buildSummaryWhereSql(options: DashboardSummaryOptions) {
  const conditions: Prisma.Sql[] = [];
  const dateFrom = normalizeDate(options.dateFrom);
  const dateTo = normalizeDate(options.dateTo);

  if (dateFrom) {
    conditions.push(Prisma.sql`\`PERMINTAAN_TGL\` >= ${dateFrom}`);
  }
  if (dateTo) {
    conditions.push(
      Prisma.sql`\`PERMINTAAN_TGL\` < DATE_ADD(${dateTo}, INTERVAL 1 DAY)`,
    );
  }

  return conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
}

function buildPerformanceDateWhereSql(
  dateColumn: Prisma.Sql,
  options: DashboardSummaryOptions,
) {
  const conditions: Prisma.Sql[] = [Prisma.sql`${dateColumn} IS NOT NULL`];
  const dateFrom = normalizeDate(options.dateFrom);
  const dateTo = normalizeDate(options.dateTo);

  if (dateFrom) {
    conditions.push(Prisma.sql`${dateColumn} >= ${dateFrom}`);
  }
  if (dateTo) {
    conditions.push(
      Prisma.sql`${dateColumn} < DATE_ADD(${dateTo}, INTERVAL 1 DAY)`,
    );
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

async function getNormalWorkflowSummary(
  sourceTable: RequestTableName,
  metadata: NormalWorkflowMetadata,
  options: DashboardSummaryOptions,
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const processColumn = Prisma.raw(quoteIdentifier(metadata.processColumn));
  const completeColumn = Prisma.raw(quoteIdentifier(metadata.completeColumn));
  const deliveryColumn = Prisma.raw(quoteIdentifier(metadata.deliveryColumn));
  const whereSql = buildSummaryWhereSql(options);

  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN ${processColumn} IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN ${processColumn} IS NOT NULL AND ${completeColumn} IS NULL THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN ${completeColumn} IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN ${deliveryColumn} IS NOT NULL THEN 1 ELSE 0 END) AS delivered
    FROM ${table}
    ${whereSql}
  `;

  return rows[0];
}

async function getVerificationWorkflowSummary(
  sourceTable: RequestTableName,
  options: DashboardSummaryOptions,
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const whereSql = buildSummaryWhereSql(options);

  const rows = await prisma.$queryRaw<CountRow[]>`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN \`VERIFIKASI_TGL\` IS NOT NULL AND \`DIAMBIL_TGL\` IS NULL THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN \`UNIVERSITAS_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN \`DIAMBIL_TGL\` IS NOT NULL THEN 1 ELSE 0 END) AS delivered
    FROM ${table}
    ${whereSql}
  `;

  return rows[0];
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
  const pendingCondition = buildPendingCondition(metadata);

  return Prisma.sql`
    SELECT
      CAST(requests.\`ID\` AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS id,
      CAST(requests.\`NPM\` AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS npm,
      CONVERT(${service.title} USING utf8mb4) COLLATE utf8mb4_unicode_ci AS serviceTitle,
      CONVERT(${service.slug} USING utf8mb4) COLLATE utf8mb4_unicode_ci AS serviceSlug,
      CONVERT(${service.category} USING utf8mb4) COLLATE utf8mb4_unicode_ci AS serviceCategory,
      CONVERT('Tidak diketahui' USING utf8mb4) COLLATE utf8mb4_unicode_ci AS requesterName,
      CONVERT('Tidak diketahui' USING utf8mb4) COLLATE utf8mb4_unicode_ci AS programStudy,
      requests.\`PERMINTAAN_TGL\` AS requestDate,
      TIMESTAMPDIFF(HOUR, requests.\`PERMINTAAN_TGL\`, NOW()) AS waitingHours
    FROM ${table} requests
    WHERE ${pendingCondition}
  `;
}

async function getServiceSummary(
  title: string,
  slug: string,
  sourceTable: RequestTableName,
  options: DashboardSummaryOptions,
): Promise<ServiceRequestSummary> {
  const metadata = requestTableMetadata[sourceTable];
  const row =
    metadata.workflow === "normal"
      ? await getNormalWorkflowSummary(sourceTable, metadata, options)
      : await getVerificationWorkflowSummary(sourceTable, options);

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

export async function getDashboardSummary(
  options: DashboardSummaryOptions = {},
): Promise<DashboardSummary> {
  const normalizedQuery = options.q?.trim().toLocaleLowerCase("id-ID");
  const services: ServiceWithRequestTable[] = getPublicServices().flatMap(
    (service) => {
      if (!isRequestTable(service.sourceTable)) {
        return [];
      }
      if (options.service && options.service !== service.slug) {
        return [];
      }
      if (
        normalizedQuery &&
        !service.title.toLocaleLowerCase("id-ID").includes(normalizedQuery)
      ) {
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

  const serviceSummaries = await Promise.all(
    services.map((service) =>
      getServiceSummary(
      service.title,
      service.slug,
      service.sourceTable,
      options,
      ),
    ),
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
    },
  );
}

function getPerformanceActions(
  metadata: RequestTableMetadata,
): Array<{
  bucket: PerformanceBucket;
  staffColumn: string;
  dateColumn: string;
}> {
  if (metadata.workflow === "normal") {
    return [
      {
        bucket: "processed",
        staffColumn: "PROSES_STAF",
        dateColumn: metadata.processColumn,
      },
      {
        bucket: "completed",
        staffColumn: "SELESAI_STAF",
        dateColumn: metadata.completeColumn,
      },
      {
        bucket: "delivered",
        staffColumn:
          metadata.deliveryColumn === "DIAMBIL_TGL"
            ? "DIAMBIL_OLEH"
            : "DIKIRIM_OLEH",
        dateColumn: metadata.deliveryColumn,
      },
    ];
  }

  return [
    {
      bucket: "processed",
      staffColumn: "VERIFIKASI_STAF",
      dateColumn: "VERIFIKASI_TGL",
    },
    {
      bucket: "completed",
      staffColumn: "FAKULTAS_STAF",
      dateColumn: "FAKULTAS_TGL",
    },
    {
      bucket: "completed",
      staffColumn: "UNIVERSITAS_STAF",
      dateColumn: "UNIVERSITAS_TGL",
    },
    {
      bucket: "delivered",
      staffColumn: "DIAMBIL_OLEH",
      dateColumn: "DIAMBIL_TGL",
    },
  ];
}

async function getPerformanceActionRows(
  sourceTable: RequestTableName,
  action: ReturnType<typeof getPerformanceActions>[number],
  options: DashboardSummaryOptions,
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const staffColumn = Prisma.raw(quoteIdentifier(action.staffColumn));
  const dateColumn = Prisma.raw(quoteIdentifier(action.dateColumn));
  const dateWhereSql = buildPerformanceDateWhereSql(dateColumn, options);

  const rows = await prisma.$queryRaw<PerformanceSourceRow[]>`
    SELECT
      CONVERT(${staffColumn} USING utf8mb3) COLLATE utf8mb3_unicode_ci AS staffName,
      COUNT(*) AS total
    FROM ${table}
    ${dateWhereSql}
      AND ${staffColumn} IS NOT NULL
      AND TRIM(${staffColumn}) <> ''
    GROUP BY CONVERT(${staffColumn} USING utf8mb3) COLLATE utf8mb3_unicode_ci
  `;

  return rows.map((row) => ({
    bucket: action.bucket,
    staffName: row.staffName?.trim() ?? "",
    total: toNumber(row.total),
  }));
}

export async function getPerformanceSummary(
  options: DashboardSummaryOptions = {},
): Promise<PerformanceSummary> {
  const services: ServiceWithRequestTable[] = getPublicServices().flatMap(
    (service) =>
      isRequestTable(service.sourceTable)
        ? [
            {
              title: service.title,
              slug: service.slug,
              category: service.category,
              sourceTable: service.sourceTable,
            },
          ]
        : [],
  );
  const activityRows: Array<{
    bucket: PerformanceBucket;
    staffName: string;
    total: number;
  }> = [];

  for (const service of services) {
    const actions = getPerformanceActions(
      requestTableMetadata[service.sourceTable],
    );
    const serviceRows = await Promise.all(
      actions.map((action) =>
        getPerformanceActionRows(service.sourceTable, action, options),
      ),
    );

    activityRows.push(...serviceRows.flat());
  }

  const [users, units] = await Promise.all([
    prisma.data_users.findMany({
      select: {
        USER_NAME: true,
        FULL_NAME: true,
        UNIT_ID: true,
      },
    }),
    prisma.data_unit.findMany({
      select: {
        UNIT_ID: true,
        UNIT_NAME: true,
      },
    }),
  ]);
  const usersByName = new Map(
    users.map((user) => [user.USER_NAME.trim().toLocaleLowerCase("id-ID"), user]),
  );
  const unitsById = new Map(
    units.map((unit) => [Number(unit.UNIT_ID), unit.UNIT_NAME]),
  );
  const staffByName = new Map<string, StaffPerformanceRow>();

  for (const activity of activityRows) {
    if (!activity.staffName) continue;

    const key = activity.staffName.toLocaleLowerCase("id-ID");
    const user = usersByName.get(key);
    const existing = staffByName.get(key) ?? {
      userName: activity.staffName,
      fullName: user?.FULL_NAME?.trim() || activity.staffName,
      unitName:
        (user ? unitsById.get(user.UNIT_ID) : undefined) ??
        "Belum terpetakan",
      processed: 0,
      completed: 0,
      delivered: 0,
      total: 0,
    };

    existing[activity.bucket] += activity.total;
    existing.total += activity.total;
    staffByName.set(key, existing);
  }

  const normalizedQuery = options.q?.trim().toLocaleLowerCase("id-ID");
  const staff = [...staffByName.values()]
    .filter(
      (row) =>
        !normalizedQuery ||
        [row.userName, row.fullName, row.unitName].some((value) =>
          value.toLocaleLowerCase("id-ID").includes(normalizedQuery),
        ),
    )
    .sort((left, right) => right.total - left.total || left.fullName.localeCompare(right.fullName, "id"));
  const unitsByName = new Map<string, UnitPerformanceRow>();

  for (const staffRow of staff) {
    const existing = unitsByName.get(staffRow.unitName) ?? {
      unitName: staffRow.unitName,
      staffCount: 0,
      processed: 0,
      completed: 0,
      delivered: 0,
      total: 0,
    };

    existing.staffCount += 1;
    existing.processed += staffRow.processed;
    existing.completed += staffRow.completed;
    existing.delivered += staffRow.delivered;
    existing.total += staffRow.total;
    unitsByName.set(staffRow.unitName, existing);
  }

  return {
    staff,
    units: [...unitsByName.values()].sort(
      (left, right) => right.total - left.total || left.unitName.localeCompare(right.unitName, "id"),
    ),
  };
}

export async function getLatestPendingDashboardRequests(): Promise<
  PendingDashboardRequestRow[]
> {
  return getPendingDashboardRequests({
    order: "newest",
    limit: 10,
  });
}

export async function getLatestPendingDashboardRequestsByDate(options: {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<PendingDashboardRequestRow[]> {
  return getPendingDashboardRequests({
    order: "newest",
    limit: options.limit ?? 10,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
  });
}

function buildPendingRequestDateWhereSql(options: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const conditions: Prisma.Sql[] = [];
  const dateFrom = normalizeDate(options.dateFrom);
  const dateTo = normalizeDate(options.dateTo);

  if (dateFrom) {
    conditions.push(Prisma.sql`requestDate >= ${dateFrom}`);
  }
  if (dateTo) {
    conditions.push(Prisma.sql`requestDate < DATE_ADD(${dateTo}, INTERVAL 1 DAY)`);
  }

  return conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
}

function normalizeProfileKey(value: string | bigint | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function profileMap(rows: StudentProfileRow[]) {
  return new Map(
    rows
      .map((row) => [normalizeProfileKey(row.npm), row] as const)
      .filter(([npm]) => npm.length > 0),
  );
}

async function getLimitedStudentProfiles(rows: PendingRequestRow[]) {
  const npms = Array.from(
    new Set(rows.map((row) => normalizeProfileKey(row.npm)).filter(Boolean)),
  );

  if (npms.length === 0) {
    return {
      active: new Map<string, StudentProfileRow>(),
      archived: new Map<string, StudentProfileRow>(),
      alumni: new Map<string, StudentProfileRow>(),
    };
  }

  const [activeRows, archivedRows, alumniRows] = await Promise.all([
    prisma.$queryRaw<StudentProfileRow[]>`
      SELECT
        \`NPM\` AS npm,
        NULLIF(\`NAMA\`, '') AS name,
        NULLIF(\`PROGRAM_STUDI\`, '') AS programStudy
      FROM \`mahasiswa\`
      WHERE \`NPM\` IN (${Prisma.join(npms)})
    `,
    prisma.$queryRaw<StudentProfileRow[]>`
      SELECT
        \`NPM\` AS npm,
        NULLIF(\`NAMA\`, '') AS name,
        NULLIF(\`PROGRAM_STUDI\`, '') AS programStudy
      FROM \`mahasiswa_sd_2015\`
      WHERE \`NPM\` IN (${Prisma.join(npms)})
    `,
    prisma.$queryRaw<StudentProfileRow[]>`
      SELECT
        \`npm\` AS npm,
        NULLIF(MAX(\`nama\`), '') AS name,
        NULLIF(CONCAT_WS(' ', MAX(\`program\`), MAX(\`prodi\`)), '') AS programStudy
      FROM \`alumni\`
      WHERE \`npm\` IN (${Prisma.join(npms)})
      GROUP BY \`npm\`
    `,
  ]);

  return {
    active: profileMap(activeRows),
    archived: profileMap(archivedRows),
    alumni: profileMap(alumniRows),
  };
}

async function hydratePendingRequestRows(rows: PendingRequestRow[]) {
  const profiles = await getLimitedStudentProfiles(rows);

  return rows.map((row) => {
    const npm = normalizeProfileKey(row.npm);
    const profile =
      profiles.active.get(npm) ??
      profiles.archived.get(npm) ??
      profiles.alumni.get(npm);

    return {
      ...row,
      requesterName: profile?.name || "Tidak diketahui",
      programStudy: profile?.programStudy || "Tidak diketahui",
    };
  });
}

async function getPendingDashboardRequests(options: {
  order: "newest" | "oldest";
  limit: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PendingDashboardRequestRow[]> {
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
  const whereSql = buildPendingRequestDateWhereSql(options);

  const rows = await prisma.$queryRaw<PendingRequestRow[]>`
    SELECT
      id,
      npm,
      serviceTitle,
      serviceSlug,
      serviceCategory,
      requesterName,
      programStudy,
      requestDate,
      waitingHours
    FROM (${unionSql}) AS requests
    ${whereSql}
    ORDER BY requestDate ${Prisma.raw(options.order === "oldest" ? "ASC" : "DESC")}, id ${Prisma.raw(options.order === "oldest" ? "ASC" : "DESC")}
    LIMIT ${options.limit}
  `;
  const hydratedRows = await hydratePendingRequestRows(rows);

  return hydratedRows.map((row) => ({
    id: String(row.id),
    serviceTitle: row.serviceTitle,
    serviceSlug: row.serviceSlug,
    serviceCategory: row.serviceCategory,
    requesterName: row.requesterName || "Tidak diketahui",
    programStudy: row.programStudy || "Tidak diketahui",
    requestDate: serializeRequestDate(row.requestDate),
  }));
}

export async function getPriorityDashboardRequests(
  limit = 12,
  options: {
    dateFrom?: string;
    dateTo?: string;
  } = {},
): Promise<PriorityDashboardRequestRow[]> {
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
  const whereSql = buildPendingRequestDateWhereSql(options);

  const rows = await prisma.$queryRaw<PendingRequestRow[]>`
    SELECT
      id,
      npm,
      serviceTitle,
      serviceSlug,
      serviceCategory,
      requesterName,
      programStudy,
      requestDate,
      waitingHours
    FROM (${unionSql}) AS requests
    ${whereSql}
    ORDER BY waitingHours DESC, requestDate ASC, id ASC
    LIMIT ${limit}
  `;
  const hydratedRows = await hydratePendingRequestRows(rows);

  return hydratedRows.map((row) => {
    const waitingHours = Math.max(0, toNumber(row.waitingHours));

    return {
      id: String(row.id),
      serviceTitle: row.serviceTitle,
      serviceSlug: row.serviceSlug,
      serviceCategory: row.serviceCategory,
      requesterName: row.requesterName || "Tidak diketahui",
      programStudy: row.programStudy || "Tidak diketahui",
      requestDate: serializeRequestDate(row.requestDate),
      waitingHours,
      waitingDays: Math.floor(waitingHours / 24),
      priorityLevel: getPriorityLevel(waitingHours),
    };
  });
}

export async function getRequestNotificationSnapshot(
  limit = 8,
): Promise<RequestNotificationSnapshot> {
  const [latestRequests, summary, priorityRequests] = await Promise.all([
    getPendingDashboardRequests({ order: "newest", limit }),
    getDashboardSummary(),
    getPriorityDashboardRequests(limit),
  ]);

  const firstRequest = latestRequests[0];
  const latestKey = firstRequest
    ? `${firstRequest.serviceSlug}:${firstRequest.id}:${firstRequest.requestDate ?? "unknown"}`
    : null;

  return {
    latestKey,
    totalPending: summary.totalPending,
    highPriorityCount: priorityRequests.filter(
      (row) => row.priorityLevel === "high",
    ).length,
    requests: latestRequests,
    generatedAt: new Date().toISOString(),
  };
}
