import { Prisma } from "@prisma/client";

import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type { ServiceRequestDetail } from "@/types/request-detail";
import type { RequestStatus } from "@/types/request";

type NormalWorkflowMetadata = {
  workflow: "normal";
  deliveryColumn: "DIAMBIL_TGL" | "DIKIRIM_TGL";
  deliveryByColumn: "DIAMBIL_OLEH" | "DIKIRIM_OLEH";
  emailColumn?: "EMAIL";
  languageColumn?: "BAHASA_SURAT";
  phoneColumn?: "NO_HP" | "HP_WA";
  keperluanColumn?: "KEPERLUAN";
  keteranganColumn?: "KETERANGAN";
  beasiswaColumn?: "BEASISWA";
  pengantarColumn?: "PENGANTAR";
  ditujukanColumn?: "DITUJUKAN";
  jenisPermohonanColumn?: "JENIS_PERMOHONAN";
  kontakPersonColumn?: "KONTAK_PERSON";
  tempatPelaksanaanColumn?: "TEMPAT_PELAKSANAAN";
  tujuanSuratColumn?: "TUJUAN_SURAT";
  alamatSuratColumn?: "ALAMAT_SURAT";
  kecamatanKabupatenColumn?: "KECAMATAN_KABUPATEN";
  kotaKabupatenColumn?: "KOTA_KABUPATEN";
  provinsiColumn?: "PROVINSI";
  tanggalMulaiColumn?: "TANGGAL_MULAI";
  tanggalSelesaiColumn?: "TANGGAL_SELESAI";
  jumlahIjazahColumn?: "JUMLAH_IJAZAH";
  jumlahTranskripColumn?: "JUMLAH_TRANSKRIP";
  jumlahTranslateColumn?: "JUMLAH_TRANSLET";
};

type VerificationWorkflowMetadata = {
  workflow: "verification";
  emailColumn?: "EMAIL";
  languageColumn?: "BAHASA_SURAT";
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
    deliveryByColumn: "DIAMBIL_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "NO_HP",
    keperluanColumn: "KEPERLUAN",
  },
  masih_kuliah: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "NO_HP",
  },
  keterangan_lulus: {
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
  kpa: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "NO_HP",
    keperluanColumn: "KEPERLUAN",
  },
  legalisir: {
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    keperluanColumn: "KEPERLUAN",
    jumlahIjazahColumn: "JUMLAH_IJAZAH",
    jumlahTranskripColumn: "JUMLAH_TRANSKRIP",
    jumlahTranslateColumn: "JUMLAH_TRANSLET",
  },
  transkrip: {
    workflow: "verification",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
  },
  bebas_pinjaman: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "HP_WA",
    keteranganColumn: "KETERANGAN",
  },
  plagiarisme: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "HP_WA",
    keteranganColumn: "KETERANGAN",
  },
  referensi: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "HP_WA",
    keteranganColumn: "KETERANGAN",
  },
  unggah_karya_ilmiah: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "HP_WA",
    keteranganColumn: "KETERANGAN",
  },
  surat_pengantar: {
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    pengantarColumn: "PENGANTAR",
    ditujukanColumn: "DITUJUKAN",
  },
  permohonan_magang: {
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    jenisPermohonanColumn: "JENIS_PERMOHONAN",
    kontakPersonColumn: "KONTAK_PERSON",
    tempatPelaksanaanColumn: "TEMPAT_PELAKSANAAN",
    tujuanSuratColumn: "TUJUAN_SURAT",
    alamatSuratColumn: "ALAMAT_SURAT",
    kecamatanKabupatenColumn: "KECAMATAN_KABUPATEN",
    kotaKabupatenColumn: "KOTA_KABUPATEN",
    provinsiColumn: "PROVINSI",
    tanggalMulaiColumn: "TANGGAL_MULAI",
    tanggalSelesaiColumn: "TANGGAL_SELESAI",
  },
  surat_izin_kegiatan: {
    workflow: "sik",
  },
  beasiswa: {
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    beasiswaColumn: "BEASISWA",
  },
  kelakuan_baik: {
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    keperluanColumn: "KEPERLUAN",
  },
  ijazah: {
    workflow: "verification",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
  },
  kks: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
    emailColumn: "EMAIL",
    languageColumn: "BAHASA_SURAT",
    phoneColumn: "NO_HP",
    keperluanColumn: "KEPERLUAN",
  },
} satisfies Record<string, RequestTableMetadata>;

type RequestTableName = keyof typeof requestTableMetadata;

type DetailRow = {
  id: string | bigint | number;
  npm: string | null;
  email: string | null;
  bahasaSurat: string | null;
  phone: string | null;
  requestDate: Date | string | null;
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
  keperluan: string | null;
  keterangan: string | null;
  jumlahIjazah: number | null;
  jumlahTranskrip: number | null;
  jumlahTranslate: number | null;
  beasiswa: string | null;
  pengantar: string | null;
  ditujukan: string | null;
  jenisPermohonan: string | null;
  kontakPerson: string | null;
  tempatPelaksanaan: string | null;
  tujuanSurat: string | null;
  alamatSurat: string | null;
  kecamatanKabupaten: string | null;
  kotaKabupaten: string | null;
  provinsi: string | null;
  tanggalMulai: Date | string | null;
  tanggalSelesai: Date | string | null;
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

type RequesterProfile = {
  name: string | null;
  program: string | null;
  level: string | null;
  classYear: number | null;
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

function columnOrNull(column?: string) {
  return column
    ? Prisma.raw(quoteIdentifier(column))
    : Prisma.sql`CAST(NULL AS CHAR)`;
}

function numberColumnOrNull(column?: string) {
  return column ? Prisma.raw(quoteIdentifier(column)) : Prisma.sql`NULL`;
}

function toIso(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function getNormalStatus(row: DetailRow): RequestStatus {
  if (row.deliveredDate) return "delivered";
  if (row.completedDate) return "completed";
  if (row.processDate) return "inProgress";
  return "pending";
}

function getVerificationStatus(row: DetailRow): RequestStatus {
  if (row.deliveredDate) return "delivered";
  if (row.universityDate) return "completed";
  if (row.verificationDate) return "inProgress";
  return "pending";
}

function getSikStatus(row: DetailRow): RequestStatus {
  if (row.deliveredDate) return "delivered";
  if (row.completedDate) return "completed";
  if (row.processDate) return "inProgress";
  if (row.finalSubmittedDate) return "sikFinalSubmitted";
  if (row.approvalStatus === "verified") return "sikApprovalVerified";
  if (row.approvalStatus === "rejected") return "sikApprovalRejected";
  return "sikApprovalPending";
}

async function getRequesterProfile(
  npm: string | null,
): Promise<RequesterProfile | null> {
  if (!npm) {
    return null;
  }

  const activeStudent = await prisma.mahasiswa.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
      JENJANG: true,
      ANGKATAN: true,
    },
  });

  if (activeStudent) {
    return {
      name: activeStudent.NAMA,
      program: activeStudent.PROGRAM_STUDI,
      level: activeStudent.JENJANG,
      classYear: activeStudent.ANGKATAN,
    };
  }

  const archivedStudent = await prisma.mahasiswa_sd_2015.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
      JENJANG: true,
      ANGKATAN: true,
    },
  });

  if (archivedStudent) {
    return {
      name: archivedStudent.NAMA,
      program: archivedStudent.PROGRAM_STUDI,
      level: archivedStudent.JENJANG,
      classYear: archivedStudent.ANGKATAN,
    };
  }

  const alumni = await prisma.alumni.findFirst({
    where: { npm },
    select: {
      nama: true,
      program: true,
      prodi: true,
      tahun_masuk: true,
    },
  });

  if (alumni) {
    return {
      name: alumni.nama,
      program: [alumni.program, alumni.prodi].filter(Boolean).join(" "),
      level: alumni.program,
      classYear: alumni.tahun_masuk,
    };
  }

  return null;
}

function buildNormalWorkflow(row: DetailRow) {
  return [
    {
      label: "Diajukan",
      date: toIso(row.requestDate),
      staff: row.requestEntry,
      done: Boolean(row.requestDate),
    },
    {
      label: "Diproses",
      date: toIso(row.processDate),
      staff: row.processStaff,
      done: Boolean(row.processDate),
    },
    {
      label: "Selesai",
      date: toIso(row.completedDate),
      staff: row.completedStaff,
      done: Boolean(row.completedDate),
    },
    {
      label: "Diambil/Dikirim",
      date: toIso(row.deliveredDate),
      staff: row.deliveredBy,
      done: Boolean(row.deliveredDate),
    },
  ];
}

function buildVerificationWorkflow(row: DetailRow) {
  return [
    {
      label: "Diajukan",
      date: toIso(row.requestDate),
      staff: row.requestEntry,
      done: Boolean(row.requestDate),
    },
    {
      label: "Verifikasi",
      date: toIso(row.verificationDate),
      staff: row.verificationStaff,
      done: Boolean(row.verificationDate),
    },
    {
      label: "Fakultas",
      date: toIso(row.facultyDate),
      staff: row.facultyStaff,
      done: Boolean(row.facultyDate),
    },
    {
      label: "Universitas",
      date: toIso(row.universityDate),
      staff: row.universityStaff,
      done: Boolean(row.universityDate),
    },
    {
      label: "Diambil",
      date: toIso(row.deliveredDate),
      staff: row.deliveredBy,
      done: Boolean(row.deliveredDate),
    },
  ];
}

async function getNormalDetail(
  sourceTable: RequestTableName,
  metadata: NormalWorkflowMetadata,
  id: string,
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const deliveryColumn = Prisma.raw(quoteIdentifier(metadata.deliveryColumn));
  const deliveryByColumn = Prisma.raw(
    quoteIdentifier(metadata.deliveryByColumn),
  );
  const emailColumn = columnOrNull(metadata.emailColumn);
  const languageColumn = columnOrNull(metadata.languageColumn);
  const phoneColumn = columnOrNull(metadata.phoneColumn);

  const rows = await prisma.$queryRaw<DetailRow[]>`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      \`NPM\` AS npm,
      ${emailColumn} AS email,
      ${languageColumn} AS bahasaSurat,
      ${phoneColumn} AS phone,
      \`PERMINTAAN_TGL\` AS requestDate,
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
      ${columnOrNull(metadata.keperluanColumn)} AS keperluan,
      ${columnOrNull(metadata.keteranganColumn)} AS keterangan,
      ${numberColumnOrNull(metadata.jumlahIjazahColumn)} AS jumlahIjazah,
      ${numberColumnOrNull(metadata.jumlahTranskripColumn)} AS jumlahTranskrip,
      ${numberColumnOrNull(metadata.jumlahTranslateColumn)} AS jumlahTranslate,
      ${columnOrNull(metadata.beasiswaColumn)} AS beasiswa,
      ${columnOrNull(metadata.pengantarColumn)} AS pengantar,
      ${columnOrNull(metadata.ditujukanColumn)} AS ditujukan,
      ${columnOrNull(metadata.jenisPermohonanColumn)} AS jenisPermohonan,
      ${columnOrNull(metadata.kontakPersonColumn)} AS kontakPerson,
      ${columnOrNull(metadata.tempatPelaksanaanColumn)} AS tempatPelaksanaan,
      ${columnOrNull(metadata.tujuanSuratColumn)} AS tujuanSurat,
      ${columnOrNull(metadata.alamatSuratColumn)} AS alamatSurat,
      ${columnOrNull(metadata.kecamatanKabupatenColumn)} AS kecamatanKabupaten,
      ${columnOrNull(metadata.kotaKabupatenColumn)} AS kotaKabupaten,
      ${columnOrNull(metadata.provinsiColumn)} AS provinsi,
      ${columnOrNull(metadata.tanggalMulaiColumn)} AS tanggalMulai,
      ${columnOrNull(metadata.tanggalSelesaiColumn)} AS tanggalSelesai,
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
    WHERE \`ID\` = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function getVerificationDetail(
  sourceTable: RequestTableName,
  metadata: VerificationWorkflowMetadata,
  id: string,
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const emailColumn = columnOrNull(metadata.emailColumn);
  const languageColumn = columnOrNull(metadata.languageColumn);

  const rows = await prisma.$queryRaw<DetailRow[]>`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      \`NPM\` AS npm,
      ${emailColumn} AS email,
      ${languageColumn} AS bahasaSurat,
      NULL AS phone,
      \`PERMINTAAN_TGL\` AS requestDate,
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
      NULL AS keperluan,
      NULL AS keterangan,
      NULL AS jumlahIjazah,
      NULL AS jumlahTranskrip,
      NULL AS jumlahTranslate,
      NULL AS beasiswa,
      NULL AS pengantar,
      NULL AS ditujukan,
      NULL AS jenisPermohonan,
      NULL AS kontakPerson,
      NULL AS tempatPelaksanaan,
      NULL AS tujuanSurat,
      NULL AS alamatSurat,
      NULL AS kecamatanKabupaten,
      NULL AS kotaKabupaten,
      NULL AS provinsi,
      NULL AS tanggalMulai,
      NULL AS tanggalSelesai,
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
    WHERE \`ID\` = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function getSikDetail(id: string) {
  const rows = await prisma.$queryRaw<DetailRow[]>`
    SELECT
      CAST(\`ID\` AS CHAR) AS id,
      \`NPM\` AS npm,
      \`EMAIL_PENGIRIMAN\` AS email,
      \`BAHASA_SURAT\` AS bahasaSurat,
      \`NO_HP_WA\` AS phone,
      \`PERMINTAAN_TGL\` AS requestDate,
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
      NULL AS keperluan,
      NULL AS keterangan,
      NULL AS jumlahIjazah,
      NULL AS jumlahTranskrip,
      NULL AS jumlahTranslate,
      NULL AS beasiswa,
      NULL AS pengantar,
      NULL AS ditujukan,
      NULL AS jenisPermohonan,
      NULL AS kontakPerson,
      NULL AS tempatPelaksanaan,
      NULL AS tujuanSurat,
      NULL AS alamatSurat,
      NULL AS kecamatanKabupaten,
      NULL AS kotaKabupaten,
      NULL AS provinsi,
      NULL AS tanggalMulai,
      NULL AS tanggalSelesai,
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
    WHERE \`ID\` = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getRequestDetail(
  serviceSlug: string,
  id: string,
): Promise<ServiceRequestDetail | null> {
  const service = getPublicServiceBySlug(serviceSlug);

  if (!service || !isRequestTable(service.sourceTable)) {
    return null;
  }

  const metadata = requestTableMetadata[service.sourceTable];
  const row =
    metadata.workflow === "normal"
      ? await getNormalDetail(service.sourceTable, metadata, id)
      : metadata.workflow === "verification"
        ? await getVerificationDetail(service.sourceTable, metadata, id)
        : await getSikDetail(id);

  if (!row) {
    return null;
  }

  const status =
    metadata.workflow === "normal"
      ? getNormalStatus(row)
      : metadata.workflow === "verification"
        ? getVerificationStatus(row)
        : getSikStatus(row);
  const requesterProfile = await getRequesterProfile(row.npm);

  return {
    id: String(row.id),
    serviceTitle: service.title,
    serviceSlug: service.slug,
    sourceTable: service.sourceTable,
    npm: row.npm,
    requesterName: requesterProfile?.name,
    requesterEmail: row.email,
    requesterPhone: row.phone,
    bahasaSurat: row.bahasaSurat,
    requesterProgram: requesterProfile?.program,
    requesterLevel: requesterProfile?.level,
    requesterClassYear: requesterProfile?.classYear,
    requestDate: toIso(row.requestDate),
    status,
    statusLabel: statusLabels[status],
    keperluan: row.keperluan,
    keterangan: row.keterangan,
    requestEntry: row.requestEntry,
    processDate: toIso(row.processDate),
    processStaff: row.processStaff,
    completedDate: toIso(row.completedDate),
    completedStaff: row.completedStaff,
    deliveredDate: toIso(row.deliveredDate),
    deliveredBy: row.deliveredBy,
    workflow:
      metadata.workflow === "normal" || metadata.workflow === "sik"
        ? buildNormalWorkflow(row)
        : buildVerificationWorkflow(row),
    jumlahIjazah: row.jumlahIjazah,
    jumlahTranskrip: row.jumlahTranskrip,
    jumlahTranslate: row.jumlahTranslate,
    beasiswa: row.beasiswa,
    pengantar: row.pengantar,
    ditujukan: row.ditujukan,
    jenisPermohonan: row.jenisPermohonan,
    kontakPerson: row.kontakPerson,
    tempatPelaksanaan: row.tempatPelaksanaan,
    tujuanSurat: row.tujuanSurat,
    alamatSurat: row.alamatSurat,
    kecamatanKabupaten: row.kecamatanKabupaten,
    kotaKabupaten: row.kotaKabupaten,
    provinsi: row.provinsi,
    tanggalMulai: toIso(row.tanggalMulai),
    tanggalSelesai: toIso(row.tanggalSelesai),
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
  };
}
