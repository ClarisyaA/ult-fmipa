import { Prisma } from "@prisma/client";

import { getPublicServiceBySlug, getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type { RequestStatus } from "@/types/request";
import type {
  PaginatedStudentRequests,
  StudentRequestDetail,
  StudentRequestListItem,
} from "@/types/student-request";

type StudentRequestListOptions = {
  npm: string;
  status?: RequestStatus;
  page?: number;
  limit?: number;
};

type NormalWorkflowMetadata = {
  workflow: "normal";
  deliveryColumn: "DIAMBIL_TGL" | "DIKIRIM_TGL";
  deliveryByColumn: "DIAMBIL_OLEH" | "DIKIRIM_OLEH";
  descriptionColumn?:
    | "KETERANGAN"
    | "KEPERLUAN"
    | "BEASISWA"
    | "PENGANTAR"
    | "JENIS_PERMOHONAN";
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

type RequestTableName =
  | "masih_kuliah_aktif"
  | "masih_kuliah"
  | "keterangan_lulus"
  | "kpa"
  | "legalisir"
  | "transkrip"
  | "bebas_pinjaman"
  | "plagiarisme"
  | "referensi"
  | "unggah_karya_ilmiah"
  | "surat_pengantar"
  | "permohonan_magang"
  | "surat_izin_kegiatan"
  | "beasiswa"
  | "kelakuan_baik"
  | "ijazah"
  | "kks";

const requestTableMetadata: Record<RequestTableName, RequestTableMetadata> = {
  masih_kuliah_aktif: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    descriptionColumn: "KEPERLUAN",
  },
  masih_kuliah: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
  keterangan_lulus: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
  kpa: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    descriptionColumn: "KEPERLUAN",
  },
  legalisir: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    descriptionColumn: "KEPERLUAN",
  },
  transkrip: {
    workflow: "verification",
  },
  bebas_pinjaman: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    descriptionColumn: "KETERANGAN",
  },
  plagiarisme: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    descriptionColumn: "KETERANGAN",
  },
  referensi: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    descriptionColumn: "KETERANGAN",
  },
  unggah_karya_ilmiah: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    descriptionColumn: "KETERANGAN",
  },
  surat_pengantar: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    descriptionColumn: "PENGANTAR",
  },
  permohonan_magang: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    descriptionColumn: "JENIS_PERMOHONAN",
  },
  surat_izin_kegiatan: {
    workflow: "sik",
  },
  beasiswa: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    descriptionColumn: "BEASISWA",
  },
  kelakuan_baik: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    descriptionColumn: "KEPERLUAN",
  },
  ijazah: {
    workflow: "verification",
  },
  kks: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    descriptionColumn: "KEPERLUAN",
  },
};

type StudentRequestService = {
  title: string;
  slug: string;
  sourceTable: RequestTableName;
};

type StudentRequestRow = {
  id: string | bigint | number;
  serviceTitle: string;
  serviceSlug: string;
  sourceTable: string;
  requestDate: Date | string | null;
  status: RequestStatus;
  description: string | null;
  requestEntry: string | null;
  processDate: Date | string | null;
  processStaff: string | null;
  completedDate: Date | string | null;
  completedStaff: string | null;
  deliveredDate: Date | string | null;
  deliveredBy: string | null;
  verificationDate: Date | string | null;
  verificationStaff: string | null;
  facultyDate: Date | string | null;
  facultyStaff: string | null;
  universityDate: Date | string | null;
  universityStaff: string | null;
  approvalStatus: string | null;
  approvalVerificationDate: Date | string | null;
  approvalVerificationStaff: string | null;
  approvalRejectReason: string | null;
  finalSubmittedDate: Date | string | null;
  namaHimpunan: string | null;
  namaKegiatan: string | null;
  tanggalKegiatan: Date | string | null;
  emailPengiriman: string | null;
  noHpWa: string | null;
};

const statusLabels = {
  pending: "Menunggu Proses",
  inProgress: "Sedang Diproses",
  completed: "Selesai",
  delivered: "Diambil/Dikirim",
  sikApprovalPending: "Menunggu Verifikasi",
  sikApprovalRejected: "Ditolak",
  sikApprovalVerified: "Terverifikasi, lengkapi Form Final",
  sikFinalSubmitted: "Form Final Terkirim",
} satisfies Record<RequestStatus, string>;

function isRequestTable(sourceTable: string): sourceTable is RequestTableName {
  return sourceTable in requestTableMetadata;
}

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function normalizePage(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) return 1;
  return Math.floor(value);
}

function normalizeLimit(value?: number) {
  if (!value || Number.isNaN(value) || value < 1) return 10;
  return Math.min(Math.floor(value), 50);
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function getRequestServices(): StudentRequestService[] {
  return getPublicServices().flatMap((service) => {
    if (!isRequestTable(service.sourceTable)) return [];
    return [
      {
        title: service.title,
        slug: service.slug,
        sourceTable: service.sourceTable,
      },
    ];
  });
}

function columnOrNull(column?: string) {
  return column
    ? Prisma.raw(quoteIdentifier(column))
    : Prisma.sql`CAST(NULL AS CHAR)`;
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

function buildListSelect(service: StudentRequestService, npm: string) {
  const metadata = requestTableMetadata[service.sourceTable];
  const table = Prisma.raw(quoteIdentifier(service.sourceTable));
  const statusSql =
    metadata.workflow === "normal"
      ? buildNormalStatusSql(metadata.deliveryColumn)
      : metadata.workflow === "verification"
        ? buildVerificationStatusSql()
        : buildSikStatusSql();
  const descriptionSql =
    metadata.workflow === "normal"
      ? service.sourceTable === "permohonan_magang"
        ? Prisma.sql`CONCAT_WS(
            ' | ',
            NULLIF(CONVERT(\`JENIS_PERMOHONAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
            NULLIF(CONVERT(\`TEMPAT_PELAKSANAAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
            NULLIF(CONCAT(
              DATE_FORMAT(\`TANGGAL_MULAI\`, '%d/%m/%Y'),
              ' - ',
              DATE_FORMAT(\`TANGGAL_SELESAI\`, '%d/%m/%Y')
            ), ' - ')
          )`
        : columnOrNull(metadata.descriptionColumn)
      : metadata.workflow === "sik"
        ? Prisma.sql`CONCAT_WS(
            ' | ',
            NULLIF(CONVERT(\`NAMA_KEGIATAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
            NULLIF(CONVERT(\`NAMA_HIMPUNAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
            NULLIF(CONCAT('Verifikasi: ', CONVERT(\`APPROVAL_STATUS\` USING utf8mb3) COLLATE utf8mb3_unicode_ci), 'Verifikasi: ')
          )`
        : Prisma.sql`CAST(NULL AS CHAR)`;
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
      ${requestDateSql} AS requestDate,
      ${statusSql} AS status,
      ${descriptionSql} AS description
    FROM ${table}
    WHERE \`NPM\` = ${npm}
  `;
}

function buildUnionSql(services: StudentRequestService[], npm: string) {
  return Prisma.join(
    services.map((service) => buildListSelect(service, npm)),
    " UNION ALL "
  );
}

function toListItem(row: StudentRequestRow): StudentRequestListItem {
  return {
    id: String(row.id),
    serviceTitle: row.serviceTitle,
    serviceSlug: row.serviceSlug,
    sourceTable: row.sourceTable,
    requestDate: toIso(row.requestDate),
    status: row.status,
    statusLabel: statusLabels[row.status],
    description: row.description,
  };
}

export async function getStudentRequestHistory({
  npm,
  status,
  page,
  limit,
}: StudentRequestListOptions): Promise<PaginatedStudentRequests> {
  const safePage = normalizePage(page);
  const safeLimit = normalizeLimit(limit);
  const offset = (safePage - 1) * safeLimit;
  const services = getRequestServices();
  const unionSql = buildUnionSql(services, npm);
  const statusFilter = status
    ? Prisma.sql`WHERE status = ${status}`
    : Prisma.empty;

  const countRows = await prisma.$queryRaw<{ total: bigint | number }[]>`
    SELECT COUNT(*) AS total
    FROM (${unionSql}) AS requests
    ${statusFilter}
  `;

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;
  const rows = await prisma.$queryRaw<StudentRequestRow[]>`
    SELECT
      id,
      serviceTitle,
      serviceSlug,
      sourceTable,
      requestDate,
      status,
      description
    FROM (${unionSql}) AS requests
    ${statusFilter}
    ORDER BY requestDate DESC, id DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `;

  return {
    data: rows.map(toListItem),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

function buildNormalDetailSelect(
  service: StudentRequestService,
  metadata: NormalWorkflowMetadata,
  npm: string,
  id: string
) {
  const table = Prisma.raw(quoteIdentifier(service.sourceTable));
  const deliveryColumn = Prisma.raw(quoteIdentifier(metadata.deliveryColumn));
  const deliveryByColumn = Prisma.raw(quoteIdentifier(metadata.deliveryByColumn));
  const statusSql = buildNormalStatusSql(metadata.deliveryColumn);

  return Prisma.sql`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      ${service.title} AS serviceTitle,
      ${service.slug} AS serviceSlug,
      ${service.sourceTable} AS sourceTable,
      \`PERMINTAAN_TGL\` AS requestDate,
      ${statusSql} AS status,
      ${columnOrNull(metadata.descriptionColumn)} AS description,
      \`PERMINTAAN_ENTRY\` AS requestEntry,
      \`PROSES_TGL\` AS processDate,
      \`PROSES_STAF\` AS processStaff,
      \`SELESAI_TGL\` AS completedDate,
      \`SELESAI_STAF\` AS completedStaff,
      ${deliveryColumn} AS deliveredDate,
      ${deliveryByColumn} AS deliveredBy,
      NULL AS verificationDate,
      NULL AS verificationStaff,
      NULL AS facultyDate,
      NULL AS facultyStaff,
      NULL AS universityDate,
      NULL AS universityStaff,
      NULL AS approvalStatus,
      NULL AS approvalVerificationDate,
      NULL AS approvalVerificationStaff,
      NULL AS approvalRejectReason,
      NULL AS finalSubmittedDate,
      NULL AS namaHimpunan,
      NULL AS namaKegiatan,
      NULL AS tanggalKegiatan,
      NULL AS emailPengiriman,
      NULL AS noHpWa
    FROM ${table}
    WHERE \`NPM\` = ${npm} AND \`ID\` = ${id}
    LIMIT 1
  `;
}

function buildVerificationDetailSelect(
  service: StudentRequestService,
  npm: string,
  id: string
) {
  const table = Prisma.raw(quoteIdentifier(service.sourceTable));

  return Prisma.sql`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      ${service.title} AS serviceTitle,
      ${service.slug} AS serviceSlug,
      ${service.sourceTable} AS sourceTable,
      \`PERMINTAAN_TGL\` AS requestDate,
      ${buildVerificationStatusSql()} AS status,
      NULL AS description,
      \`PERMINTAAN_ENTRY\` AS requestEntry,
      NULL AS processDate,
      NULL AS processStaff,
      \`UNIVERSITAS_TGL\` AS completedDate,
      \`UNIVERSITAS_STAF\` AS completedStaff,
      \`DIAMBIL_TGL\` AS deliveredDate,
      \`DIAMBIL_OLEH\` AS deliveredBy,
      \`VERIFIKASI_TGL\` AS verificationDate,
      \`VERIFIKASI_STAF\` AS verificationStaff,
      \`FAKULTAS_TGL\` AS facultyDate,
      \`FAKULTAS_STAF\` AS facultyStaff,
      \`UNIVERSITAS_TGL\` AS universityDate,
      \`UNIVERSITAS_STAF\` AS universityStaff,
      NULL AS approvalStatus,
      NULL AS approvalVerificationDate,
      NULL AS approvalVerificationStaff,
      NULL AS approvalRejectReason,
      NULL AS finalSubmittedDate,
      NULL AS namaHimpunan,
      NULL AS namaKegiatan,
      NULL AS tanggalKegiatan,
      NULL AS emailPengiriman,
      NULL AS noHpWa
    FROM ${table}
    WHERE \`NPM\` = ${npm} AND \`ID\` = ${id}
    LIMIT 1
  `;
}

function buildSikDetailSelect(service: StudentRequestService, npm: string, id: string) {
  return Prisma.sql`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      ${service.title} AS serviceTitle,
      ${service.slug} AS serviceSlug,
      ${service.sourceTable} AS sourceTable,
      COALESCE(\`FINAL_SUBMITTED_TGL\`, \`PERMINTAAN_TGL\`) AS requestDate,
      ${buildSikStatusSql()} AS status,
      COALESCE(
        NULLIF(CONVERT(\`NAMA_KEGIATAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
        NULLIF(CONVERT(\`NAMA_HIMPUNAN\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, ''),
        NULLIF(CONVERT(\`APPROVAL_STATUS\` USING utf8mb3) COLLATE utf8mb3_unicode_ci, '')
      ) AS description,
      \`PERMINTAAN_ENTRY\` AS requestEntry,
      \`PROSES_TGL\` AS processDate,
      \`PROSES_STAF\` AS processStaff,
      \`SELESAI_TGL\` AS completedDate,
      \`SELESAI_STAF\` AS completedStaff,
      \`DIKIRIM_TGL\` AS deliveredDate,
      \`DIKIRIM_OLEH\` AS deliveredBy,
      NULL AS verificationDate,
      NULL AS verificationStaff,
      NULL AS facultyDate,
      NULL AS facultyStaff,
      NULL AS universityDate,
      NULL AS universityStaff,
      \`APPROVAL_STATUS\` AS approvalStatus,
      \`APPROVAL_VERIFIKASI_TGL\` AS approvalVerificationDate,
      \`APPROVAL_VERIFIKASI_STAF\` AS approvalVerificationStaff,
      \`APPROVAL_REJECT_REASON\` AS approvalRejectReason,
      \`FINAL_SUBMITTED_TGL\` AS finalSubmittedDate,
      \`NAMA_HIMPUNAN\` AS namaHimpunan,
      \`NAMA_KEGIATAN\` AS namaKegiatan,
      \`TANGGAL_KEGIATAN\` AS tanggalKegiatan,
      \`EMAIL_PENGIRIMAN\` AS emailPengiriman,
      \`NO_HP_WA\` AS noHpWa
    FROM \`surat_izin_kegiatan\`
    WHERE \`NPM\` = ${npm} AND \`ID\` = ${id}
    LIMIT 1
  `;
}

function buildNormalWorkflow(row: StudentRequestRow) {
  return [
    { label: "Diajukan", date: toIso(row.requestDate), staff: row.requestEntry, done: Boolean(row.requestDate) },
    { label: "Diproses", date: toIso(row.processDate), staff: row.processStaff, done: Boolean(row.processDate) },
    { label: "Selesai", date: toIso(row.completedDate), staff: row.completedStaff, done: Boolean(row.completedDate) },
    { label: "Diambil/Dikirim", date: toIso(row.deliveredDate), staff: row.deliveredBy, done: Boolean(row.deliveredDate) },
  ];
}

function buildVerificationWorkflow(row: StudentRequestRow) {
  return [
    { label: "Diajukan", date: toIso(row.requestDate), staff: row.requestEntry, done: Boolean(row.requestDate) },
    { label: "Verifikasi", date: toIso(row.verificationDate), staff: row.verificationStaff, done: Boolean(row.verificationDate) },
    { label: "Fakultas", date: toIso(row.facultyDate), staff: row.facultyStaff, done: Boolean(row.facultyDate) },
    { label: "Universitas", date: toIso(row.universityDate), staff: row.universityStaff, done: Boolean(row.universityDate) },
    { label: "Diambil", date: toIso(row.deliveredDate), staff: row.deliveredBy, done: Boolean(row.deliveredDate) },
  ];
}

export async function getStudentRequestDetail(
  npm: string,
  serviceSlug: string,
  id: string
): Promise<StudentRequestDetail | null> {
  if (!/^\d+$/.test(id)) return null;

  const service = getPublicServiceBySlug(serviceSlug);

  if (!service || !isRequestTable(service.sourceTable)) return null;

  const requestService = {
    title: service.title,
    slug: service.slug,
    sourceTable: service.sourceTable,
  };
  const metadata = requestTableMetadata[service.sourceTable];
  const rows =
    metadata.workflow === "normal"
      ? await prisma.$queryRaw<StudentRequestRow[]>(
          buildNormalDetailSelect(requestService, metadata, npm, id)
        )
      : metadata.workflow === "verification"
        ? await prisma.$queryRaw<StudentRequestRow[]>(
            buildVerificationDetailSelect(requestService, npm, id)
          )
        : await prisma.$queryRaw<StudentRequestRow[]>(
            buildSikDetailSelect(requestService, npm, id)
          );
  const row = rows[0];

  if (!row) return null;

  return {
    ...toListItem(row),
    requestEntry: row.requestEntry,
    processDate: toIso(row.processDate),
    processStaff: row.processStaff,
    completedDate: toIso(row.completedDate),
    completedStaff: row.completedStaff,
    deliveredDate: toIso(row.deliveredDate),
    deliveredBy: row.deliveredBy,
    approvalStatus: row.approvalStatus,
    approvalVerificationDate: toIso(row.approvalVerificationDate),
    approvalVerificationStaff: row.approvalVerificationStaff,
    approvalRejectReason: row.approvalRejectReason,
    finalSubmittedDate: toIso(row.finalSubmittedDate),
    namaHimpunan: row.namaHimpunan,
    namaKegiatan: row.namaKegiatan,
    tanggalKegiatan: toIso(row.tanggalKegiatan),
    emailPengiriman: row.emailPengiriman,
    noHpWa: row.noHpWa,
    workflow:
      metadata.workflow === "normal" || metadata.workflow === "sik"
        ? buildNormalWorkflow(row)
        : buildVerificationWorkflow(row),
  };
}
