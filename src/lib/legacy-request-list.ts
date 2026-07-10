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
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
  all?: boolean;
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
  requesterName: string | null;
  requesterProgram: string | null;
  requesterEmail: string | null;
  requesterPhone: string | null;
  purpose: string | null;
  requestDate: Date | string | null;
  processDate: Date | string | null;
  completedDate: Date | string | null;
  deliveredDate: Date | string | null;
  mainField: string | null;
  jenisPermohonan: string | null;
  tempatPelaksanaan: string | null;
  tujuanSurat: string | null;
  tanggalMulai: Date | string | null;
  tanggalSelesai: Date | string | null;
  namaHimpunan: string | null;
  namaKegiatan: string | null;
  tanggalKegiatan: Date | string | null;
  approvalStatus: string | null;
  finalSubmittedDate: Date | string | null;
  status: RequestStatus;
};

type RequesterProfileRow = {
  npm: string | null;
  requesterName: string | null;
  requesterProgram: string | null;
  priority: number | bigint;
};

type RequesterProfile = {
  requesterName: string | null;
  requesterProgram: string | null;
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

function normalizedTextSql(expression: Prisma.Sql) {
  return Prisma.sql`CONVERT(${expression} USING utf8mb3) COLLATE utf8mb3_unicode_ci`;
}

function normalizedNullTextSql() {
  return Prisma.sql`CAST(NULL AS CHAR CHARACTER SET utf8mb3) COLLATE utf8mb3_unicode_ci`;
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
    return normalizedNullTextSql();
  }

  const columns = metadata.purposeColumns.map((column) => {
    const identifier = Prisma.raw(quoteIdentifier(column));

    return Prisma.sql`NULLIF(${normalizedTextSql(Prisma.sql`${identifier}`)}, '')`;
  });

  return Prisma.sql`COALESCE(${Prisma.join(columns, ", ")})`;
}

function columnOrNull(column: string, sourceTable: RequestTableName) {
  const tableColumns: Record<RequestTableName, Set<string>> = {
    masih_kuliah_aktif: new Set(["EMAIL", "NO_HP", "KEPERLUAN"]),
    masih_kuliah: new Set(["EMAIL", "NO_HP"]),
    keterangan_lulus: new Set([]),
    kpa: new Set(["EMAIL", "NO_HP", "KEPERLUAN"]),
    legalisir: new Set(["KEPERLUAN"]),
    transkrip: new Set([]),
    bebas_pinjaman: new Set(["EMAIL", "HP_WA", "KETERANGAN"]),
    plagiarisme: new Set(["EMAIL", "HP_WA", "KETERANGAN"]),
    referensi: new Set(["EMAIL", "HP_WA", "KETERANGAN"]),
    unggah_karya_ilmiah: new Set(["EMAIL", "HP_WA", "KETERANGAN"]),
    surat_pengantar: new Set(["PENGANTAR", "DITUJUKAN"]),
    permohonan_magang: new Set([
      "NAMA",
      "PRODI",
      "JENIS_PERMOHONAN",
      "TEMPAT_PELAKSANAAN",
      "TUJUAN_SURAT",
      "TANGGAL_MULAI",
      "TANGGAL_SELESAI",
    ]),
    surat_izin_kegiatan: new Set([
      "NAMA",
      "PRODI",
      "NAMA_HIMPUNAN",
      "NAMA_KEGIATAN",
      "TANGGAL_KEGIATAN",
      "APPROVAL_STATUS",
      "FINAL_SUBMITTED_TGL",
    ]),
    beasiswa: new Set(["BEASISWA"]),
    kelakuan_baik: new Set(["KEPERLUAN"]),
    ijazah: new Set([]),
    kks: new Set(["EMAIL", "NO_HP", "KEPERLUAN"]),
  };

  if (!tableColumns[sourceTable].has(column)) {
    return Prisma.sql`NULL`;
  }

  return Prisma.raw(quoteIdentifier(column));
}

function textColumnOrNull(column: string, sourceTable: RequestTableName) {
  return normalizedTextSql(Prisma.sql`${columnOrNull(column, sourceTable)}`);
}

async function getRequesterProfiles(rows: RequestRow[]) {
  const npmList = Array.from(
    new Set(
      rows
        .map((row) => row.npm?.trim())
        .filter((npm): npm is string => Boolean(npm)),
    ),
  );

  if (npmList.length === 0) {
    return new Map<string, RequesterProfile>();
  }

  const profileRows: RequesterProfileRow[] = [];
  const batchSize = 1000;

  for (let start = 0; start < npmList.length; start += batchSize) {
    const normalizedNpmInSql = Prisma.join(
      npmList
        .slice(start, start + batchSize)
        .map((npm) => normalizedTextSql(Prisma.sql`${npm}`)),
    );

    try {
      const batchRows = await prisma.$queryRaw<RequesterProfileRow[]>`
        SELECT
          ${normalizedTextSql(Prisma.sql`active_student.\`NPM\``)} AS npm,
          NULLIF(${normalizedTextSql(Prisma.sql`active_student.\`NAMA\``)}, '') AS requesterName,
          NULLIF(${normalizedTextSql(Prisma.sql`active_student.\`PROGRAM_STUDI\``)}, '') AS requesterProgram,
          1 AS priority
        FROM \`mahasiswa\` active_student
        WHERE ${normalizedTextSql(Prisma.sql`active_student.\`NPM\``)} IN (${normalizedNpmInSql})
        UNION ALL
        SELECT
          ${normalizedTextSql(Prisma.sql`archived_student.\`NPM\``)} AS npm,
          NULLIF(${normalizedTextSql(Prisma.sql`archived_student.\`NAMA\``)}, '') AS requesterName,
          NULLIF(${normalizedTextSql(Prisma.sql`archived_student.\`PROGRAM_STUDI\``)}, '') AS requesterProgram,
          2 AS priority
        FROM \`mahasiswa_sd_2015\` archived_student
        WHERE ${normalizedTextSql(Prisma.sql`archived_student.\`NPM\``)} IN (${normalizedNpmInSql})
        UNION ALL
        SELECT
          ${normalizedTextSql(Prisma.sql`alumni_profile.\`npm\``)} AS npm,
          NULLIF(${normalizedTextSql(Prisma.sql`MAX(alumni_profile.\`nama\`)`)}, '') AS requesterName,
          NULLIF(${normalizedTextSql(Prisma.sql`CONCAT_WS(' ', MAX(alumni_profile.\`program\`), MAX(alumni_profile.\`prodi\`))`)}, '') AS requesterProgram,
          3 AS priority
        FROM \`alumni\` alumni_profile
        WHERE ${normalizedTextSql(Prisma.sql`alumni_profile.\`npm\``)} IN (${normalizedNpmInSql})
        GROUP BY ${normalizedTextSql(Prisma.sql`alumni_profile.\`npm\``)}
      `;

      profileRows.push(...batchRows);
    } catch (error) {
      console.warn("Failed to enrich a requester profile batch", error);
    }
  }

  const profiles = new Map<string, RequesterProfile>();

  for (const row of profileRows.sort(
    (left, right) => Number(left.priority) - Number(right.priority),
  )) {
    const npm = row.npm?.trim();
    if (!npm || profiles.has(npm)) {
      continue;
    }

    profiles.set(npm, {
      requesterName: row.requesterName,
      requesterProgram: row.requesterProgram,
    });
  }

  return profiles;
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
      ? normalizedTextSql(Prisma.sql`CONCAT_WS(
          ' | ',
          NULLIF(${normalizedTextSql(Prisma.sql`\`NAMA_KEGIATAN\``)}, ''),
          NULLIF(${normalizedTextSql(Prisma.sql`\`NAMA_HIMPUNAN\``)}, ''),
          NULLIF(CONCAT('Verifikasi: ', ${normalizedTextSql(Prisma.sql`\`APPROVAL_STATUS\``)}), 'Verifikasi: ')
        )`)
      : service.sourceTable === "permohonan_magang"
        ? normalizedTextSql(Prisma.sql`CONCAT_WS(
            ' | ',
            NULLIF(${normalizedTextSql(Prisma.sql`\`JENIS_PERMOHONAN\``)}, ''),
            NULLIF(${normalizedTextSql(Prisma.sql`\`TEMPAT_PELAKSANAAN\``)}, ''),
            NULLIF(CONCAT(
              DATE_FORMAT(\`TANGGAL_MULAI\`, '%d/%m/%Y'),
              ' - ',
              DATE_FORMAT(\`TANGGAL_SELESAI\`, '%d/%m/%Y')
            ), ' - ')
          )`)
      : buildPurposeSql(metadata);
  const requestDateSql =
    metadata.workflow === "sik"
      ? Prisma.sql`COALESCE(\`FINAL_SUBMITTED_TGL\`, \`PERMINTAAN_TGL\`)`
      : Prisma.sql`\`PERMINTAAN_TGL\``;
  const deliveryDateSql =
    metadata.workflow === "normal"
      ? Prisma.raw(quoteIdentifier(metadata.deliveryColumn))
      : metadata.workflow === "verification"
        ? Prisma.sql`\`DIAMBIL_TGL\``
        : Prisma.sql`\`DIKIRIM_TGL\``;
  const mainFieldSql =
    service.sourceTable === "surat_pengantar"
      ? normalizedTextSql(Prisma.sql`CONCAT_WS(' / ', NULLIF(${normalizedTextSql(Prisma.sql`\`PENGANTAR\``)}, ''), NULLIF(${normalizedTextSql(Prisma.sql`\`DITUJUKAN\``)}, ''))`)
      : purposeSql;

  return Prisma.sql`
    SELECT
      ${normalizedTextSql(Prisma.sql`requests.\`ID\``)} AS id,
      ${normalizedTextSql(Prisma.sql`${service.title}`)} AS serviceTitle,
      ${normalizedTextSql(Prisma.sql`${service.slug}`)} AS serviceSlug,
      ${normalizedTextSql(Prisma.sql`${service.sourceTable}`)} AS sourceTable,
      ${normalizedTextSql(Prisma.sql`requests.\`NPM\``)} AS npm,
      ${textColumnOrNull("NAMA", service.sourceTable)} AS requesterName,
      ${textColumnOrNull("PRODI", service.sourceTable)} AS requesterProgram,
      ${textColumnOrNull("EMAIL", service.sourceTable)} AS requesterEmail,
      COALESCE(${textColumnOrNull("NO_HP", service.sourceTable)}, ${textColumnOrNull("HP_WA", service.sourceTable)}) AS requesterPhone,
      ${purposeSql} AS purpose,
      ${requestDateSql} AS requestDate,
      ${metadata.workflow === "verification" ? Prisma.sql`\`VERIFIKASI_TGL\`` : Prisma.sql`\`PROSES_TGL\``} AS processDate,
      ${metadata.workflow === "verification" ? Prisma.sql`\`UNIVERSITAS_TGL\`` : Prisma.sql`\`SELESAI_TGL\``} AS completedDate,
      ${deliveryDateSql} AS deliveredDate,
      ${mainFieldSql} AS mainField,
      ${textColumnOrNull("JENIS_PERMOHONAN", service.sourceTable)} AS jenisPermohonan,
      ${textColumnOrNull("TEMPAT_PELAKSANAAN", service.sourceTable)} AS tempatPelaksanaan,
      ${textColumnOrNull("TUJUAN_SURAT", service.sourceTable)} AS tujuanSurat,
      ${columnOrNull("TANGGAL_MULAI", service.sourceTable)} AS tanggalMulai,
      ${columnOrNull("TANGGAL_SELESAI", service.sourceTable)} AS tanggalSelesai,
      ${textColumnOrNull("NAMA_HIMPUNAN", service.sourceTable)} AS namaHimpunan,
      ${textColumnOrNull("NAMA_KEGIATAN", service.sourceTable)} AS namaKegiatan,
      ${columnOrNull("TANGGAL_KEGIATAN", service.sourceTable)} AS tanggalKegiatan,
      ${textColumnOrNull("APPROVAL_STATUS", service.sourceTable)} AS approvalStatus,
      ${columnOrNull("FINAL_SUBMITTED_TGL", service.sourceTable)} AS finalSubmittedDate,
      ${normalizedTextSql(statusSql)} AS status
    FROM ${table} requests
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
    conditions.push(
      Prisma.sql`${normalizedTextSql(Prisma.sql`requests.\`status\``)} = ${normalizedTextSql(Prisma.sql`${options.status}`)}`,
    );
  }

  if (normalizedQuery) {
    const query = `%${normalizedQuery}%`;
    const normalizedQuerySql = normalizedTextSql(Prisma.sql`${query}`);

    conditions.push(
      Prisma.sql`(
        ${normalizedTextSql(Prisma.sql`requests.\`npm\``)} LIKE ${normalizedQuerySql}
        OR ${normalizedTextSql(Prisma.sql`requests.\`npm\``)} IN (
          SELECT ${normalizedTextSql(Prisma.sql`active_student.\`NPM\``)}
          FROM \`mahasiswa\` active_student
          WHERE ${normalizedTextSql(Prisma.sql`active_student.\`NAMA\``)} LIKE ${normalizedQuerySql}
          UNION
          SELECT ${normalizedTextSql(Prisma.sql`archived_student.\`NPM\``)}
          FROM \`mahasiswa_sd_2015\` archived_student
          WHERE ${normalizedTextSql(Prisma.sql`archived_student.\`NAMA\``)} LIKE ${normalizedQuerySql}
          UNION
          SELECT ${normalizedTextSql(Prisma.sql`alumni_profile.\`npm\``)}
          FROM \`alumni\` alumni_profile
          WHERE ${normalizedTextSql(Prisma.sql`alumni_profile.\`nama\``)} LIKE ${normalizedQuerySql}
        )
      )`,
    );
  }

  if (conditions.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

function buildOrderSql(sort?: RequestListOptions["sort"]) {
  if (sort === "oldest") {
    return Prisma.sql`ORDER BY requestDate ASC, id ASC`;
  }

  return Prisma.sql`ORDER BY requestDate DESC, id DESC`;
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
    npm: row.npm,
    maskedNpm: maskNpm(row.npm),
    requesterName: row.requesterName,
    requesterProgram: row.requesterProgram,
    requesterEmail: row.requesterEmail,
    requesterPhone: row.requesterPhone,
    purpose: row.purpose,
    requestDate: serializeRequestDate(row.requestDate),
    processDate: serializeRequestDate(row.processDate),
    completedDate: serializeRequestDate(row.completedDate),
    deliveredDate: serializeRequestDate(row.deliveredDate),
    mainField: row.mainField,
    jenisPermohonan: row.jenisPermohonan,
    tempatPelaksanaan: row.tempatPelaksanaan,
    tujuanSurat: row.tujuanSurat,
    tanggalMulai: serializeRequestDate(row.tanggalMulai),
    tanggalSelesai: serializeRequestDate(row.tanggalSelesai),
    namaHimpunan: row.namaHimpunan,
    namaKegiatan: row.namaKegiatan,
    tanggalKegiatan: serializeRequestDate(row.tanggalKegiatan),
    approvalStatus: row.approvalStatus,
    finalSubmittedDate: serializeRequestDate(row.finalSubmittedDate),
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
  const orderSql = buildOrderSql(options.sort);
  const paginationSql = options.all
    ? Prisma.empty
    : Prisma.sql`LIMIT ${limit} OFFSET ${offset}`;

  const countRows = await prisma.$queryRaw<{ total: bigint | number }[]>`
    SELECT COUNT(*) AS total
    FROM (${unionSql}) AS requests
    ${whereSql}
  `;

  const rows = await prisma.$queryRaw<RequestRow[]>`
    SELECT
      id,
      serviceTitle,
      serviceSlug,
      sourceTable,
      npm,
      requesterName,
      requesterProgram,
      requesterEmail,
      requesterPhone,
      purpose,
      requestDate,
      processDate,
      completedDate,
      deliveredDate,
      mainField,
      jenisPermohonan,
      tempatPelaksanaan,
      tujuanSurat,
      tanggalMulai,
      tanggalSelesai,
      namaHimpunan,
      namaKegiatan,
      tanggalKegiatan,
      approvalStatus,
      finalSubmittedDate,
      status
    FROM (${unionSql}) AS requests
    ${whereSql}
    ${orderSql}
    ${paginationSql}
  `;

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const requesterProfiles = await getRequesterProfiles(rows);

  return {
    data: rows.map((row) => {
      const profile = row.npm ? requesterProfiles.get(row.npm) : undefined;

      return toListItem({
        ...row,
        requesterName: row.requesterName ?? profile?.requesterName ?? null,
        requesterProgram:
          row.requesterProgram ?? profile?.requesterProgram ?? null,
      });
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
