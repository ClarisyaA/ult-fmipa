import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type {
  CreateServiceRequestInput,
  CreateServiceRequestResult,
} from "@/types/submission";

type SupportedSubmissionTable =
  | "beasiswa"
  | "bebas_pinjaman"
  | "ijazah"
  | "keterangan_lulus"
  | "kelakuan_baik"
  | "kks"
  | "kpa"
  | "legalisir"
  | "masih_kuliah"
  | "masih_kuliah_aktif"
  | "plagiarisme"
  | "permohonan_magang"
  | "referensi"
  | "surat_pengantar"
  | "transkrip"
  | "unggah_karya_ilmiah";

const supportedSubmissionTables = {
  beasiswa: "beasiswa",
  bebas_pinjaman: "bebas_pinjaman",
  ijazah: "ijazah",
  keterangan_lulus: "keterangan_lulus",
  kelakuan_baik: "kelakuan_baik",
  kks: "kks",
  kpa: "kpa",
  legalisir: "legalisir",
  masih_kuliah: "masih_kuliah",
  masih_kuliah_aktif: "masih_kuliah_aktif",
  plagiarisme: "plagiarisme",
  permohonan_magang: "permohonan_magang",
  referensi: "referensi",
  surat_pengantar: "surat_pengantar",
  transkrip: "transkrip",
  unggah_karya_ilmiah: "unggah_karya_ilmiah",
} satisfies Record<SupportedSubmissionTable, SupportedSubmissionTable>;

const supportedSubmissionSlugs = new Set([
  "rekomendasi-beasiswa",
  "bebas-peminjaman",
  "cek-plagiarisme",
  "referensi",
  "kartu-prestasi-akademik",
  "kartu-kemajuan-studi",
  "ket-tunjangan-orang-tua",
  "keterangan-masih-kuliah",
  "keterangan-kelakuan-baik",
  "surat-pengantar",
  "keterangan-lulus",
  "penerbitan-ijazah",
  "legalisir-ijazah-transkrip",
  "penerbitan-transkrip",
  "unggah-karya-ilmiah",
  "permohonan-magang-kerja-praktek-ta",
]);

export class ServiceRequestSubmitError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ServiceRequestSubmitError";
    this.statusCode = statusCode;
  }
}

export function isSubmissionSupported(serviceSlug: string) {
  const service = getPublicServiceBySlug(serviceSlug);

  return Boolean(
    service &&
      service.sourceTable in supportedSubmissionTables &&
      service.slug === serviceSlug &&
      supportedSubmissionSlugs.has(service.slug)
  );
}

function isSupportedTable(
  sourceTable: string
): sourceTable is SupportedSubmissionTable {
  return sourceTable in supportedSubmissionTables;
}

function normalizeOptional(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizeDate(value?: string) {
  const trimmed = value?.trim();

  return trimmed ? new Date(trimmed) : null;
}

function normalizeCount(value?: number, fallback = 1) {
  return value ?? fallback;
}

function normalizeTanggalLulus(input: CreateServiceRequestInput) {
  return normalizeDate(input.tanggalLulus ?? input.tglLulus);
}

async function insertBeasiswa(input: CreateServiceRequestInput) {
  const created = await prisma.beasiswa.create({
    data: {
      NPM: input.npm,
      BEASISWA:
        normalizeOptional(input.scholarshipName) ??
        normalizeOptional(input.description),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

async function insertSimpleRequest(
  sourceTable:
    | "bebas_pinjaman"
    | "plagiarisme"
    | "referensi"
    | "unggah_karya_ilmiah",
  input: CreateServiceRequestInput
) {
  const data = {
    NPM: input.npm,
    EMAIL: normalizeOptional(input.email),
    HP_WA: normalizeOptional(input.phone),
    KETERANGAN: normalizeOptional(input.description),
    PERMINTAAN_TGL: new Date(),
    PERMINTAAN_ENTRY: "Website ULT",
    PERMINTAAN_IP: null,
  };

  if (sourceTable === "bebas_pinjaman") {
    const created = await prisma.bebas_pinjaman.create({ data });

    return String(created.ID);
  }

  if (sourceTable === "plagiarisme") {
    const created = await prisma.plagiarisme.create({ data });

    return String(created.ID);
  }

  if (sourceTable === "unggah_karya_ilmiah") {
    const created = await prisma.unggah_karya_ilmiah.create({ data });

    return String(created.ID);
  }

  const created = await prisma.referensi.create({ data });

  return String(created.ID);
}

async function insertCardRequest(
  sourceTable: "kpa" | "kks",
  input: CreateServiceRequestInput
) {
  const data = {
    NPM: input.npm,
    EMAIL: normalizeOptional(input.email),
    NO_HP: normalizeOptional(input.phone),
    KEPERLUAN: normalizeOptional(input.description),
    PERMINTAAN_TGL: new Date(),
    PERMINTAAN_ENTRY: "Website ULT",
    PERMINTAAN_IP: null,
  };

  if (sourceTable === "kpa") {
    const created = await prisma.kpa.create({ data });

    return String(created.ID);
  }

  const created = await prisma.kks.create({ data });

  return String(created.ID);
}

async function insertMasihKuliah(input: CreateServiceRequestInput) {
  const created = await prisma.masih_kuliah.create({
    data: {
      NPM: input.npm,
      SEMESTER: normalizeOptional(input.semester),
      EMAIL: normalizeOptional(input.email),
      NO_HP: normalizeOptional(input.phone),
      TAHUN_AKADEMIK: normalizeOptional(input.tahunAkademik),
      NAMA_ORANG_TUA: normalizeOptional(input.namaOrangTua),
      NIP_NRP: normalizeOptional(input.nipNrp),
      PANGKAT_GOLONGAN: normalizeOptional(input.pangkatGolongan),
      INSTANSI: normalizeOptional(input.instansi),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

async function insertMasihKuliahAktif(input: CreateServiceRequestInput) {
  const created = await prisma.masih_kuliah_aktif.create({
    data: {
      NPM: input.npm,
      SEMESTER: normalizeOptional(input.semester),
      TAHUN_AKADEMIK: normalizeOptional(input.tahunAkademik),
      KEPERLUAN: normalizeOptional(input.description),
      EMAIL: normalizeOptional(input.email),
      NO_HP: normalizeOptional(input.phone),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

async function insertKelakuanBaik(input: CreateServiceRequestInput) {
  const created = await prisma.kelakuan_baik.create({
    data: {
      NPM: input.npm,
      KEPERLUAN: normalizeOptional(input.description),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

async function insertSuratPengantar(input: CreateServiceRequestInput) {
  const created = await prisma.surat_pengantar.create({
    data: {
      NPM: input.npm,
      PERMINTAAN_IP: null,
      PENGANTAR: normalizeOptional(input.pengantar),
      DITUJUKAN: normalizeOptional(input.ditujukan),
      DASAR_SURAT_NO: normalizeOptional(input.dasarSuratNo),
      DASAR_SURAT_PERIHAL: normalizeOptional(input.dasarSuratPerihal),
      DASAR_SURAT_TGL: normalizeDate(input.dasarSuratTgl),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
    },
  });

  return String(created.ID);
}

async function insertKeteranganLulus(input: CreateServiceRequestInput) {
  const created = await prisma.keterangan_lulus.create({
    data: {
      NPM: input.npm,
      TEMPAT_LAHIR: normalizeOptional(input.tempatLahir),
      TGL_LAHIR: normalizeDate(input.tanggalLahir),
      TGL_LULUS: normalizeTanggalLulus(input),
      IPK: normalizeOptional(input.ipk),
      YUDISIUM: normalizeOptional(input.yudisium),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

async function insertIjazah(input: CreateServiceRequestInput) {
  const created = await prisma.ijazah.create({
    data: {
      NPM: input.npm,
      TGL_LULUS: normalizeTanggalLulus(input),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

async function insertTranskrip(input: CreateServiceRequestInput) {
  const created = await prisma.transkrip.create({
    data: {
      NPM: input.npm,
      TGL_LULUS: normalizeTanggalLulus(input),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

async function insertLegalisir(input: CreateServiceRequestInput) {
  const created = await prisma.legalisir.create({
    data: {
      NPM: input.npm,
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
      JUMLAH_TRANSKRIP: normalizeCount(input.jumlahTranskrip),
      JUMLAH_IJAZAH: normalizeCount(input.jumlahIjazah),
      JUMLAH_TRANSLET: normalizeCount(input.jumlahTranslet),
      KEPERLUAN: normalizeOptional(input.description),
    },
  });

  return String(created.ID);
}

async function insertPermohonanMagang(input: CreateServiceRequestInput) {
  const created = await prisma.permohonan_magang.create({
    data: {
      NPM: input.npm,
      JENIS_PERMOHONAN: normalizeOptional(input.jenisPermohonan),
      KONTAK_PERSON: normalizeOptional(input.kontakPerson),
      TEMPAT_PELAKSANAAN: normalizeOptional(input.tempatPelaksanaan),
      TUJUAN_SURAT: normalizeOptional(input.tujuanSurat),
      ALAMAT_SURAT: normalizeOptional(input.alamatSurat),
      KECAMATAN_KABUPATEN: normalizeOptional(input.kecamatanKabupaten),
      KOTA_KABUPATEN: normalizeOptional(input.kotaKabupaten),
      PROVINSI: normalizeOptional(input.provinsi),
      TANGGAL_MULAI: normalizeDate(input.tanggalMulai),
      TANGGAL_SELESAI: normalizeDate(input.tanggalSelesai),
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: "Website ULT",
      PERMINTAAN_IP: null,
    },
  });

  return String(created.ID);
}

export async function createServiceRequest(
  serviceSlug: string,
  input: CreateServiceRequestInput
): Promise<CreateServiceRequestResult> {
  const service = getPublicServiceBySlug(serviceSlug);

  if (!service) {
    throw new ServiceRequestSubmitError("Layanan tidak ditemukan.", 404);
  }

  if (!isSubmissionSupported(serviceSlug) || !isSupportedTable(service.sourceTable)) {
    throw new ServiceRequestSubmitError(
      "Pengajuan untuk layanan ini belum tersedia.",
      400
    );
  }

  let id: string;

  switch (service.sourceTable) {
    case "beasiswa":
      id = await insertBeasiswa(input);
      break;
    case "bebas_pinjaman":
    case "plagiarisme":
    case "referensi":
    case "unggah_karya_ilmiah":
      id = await insertSimpleRequest(service.sourceTable, input);
      break;
    case "kpa":
    case "kks":
      id = await insertCardRequest(service.sourceTable, input);
      break;
    case "masih_kuliah":
      id = await insertMasihKuliah(input);
      break;
    case "masih_kuliah_aktif":
      id = await insertMasihKuliahAktif(input);
      break;
    case "kelakuan_baik":
      id = await insertKelakuanBaik(input);
      break;
    case "surat_pengantar":
      id = await insertSuratPengantar(input);
      break;
    case "keterangan_lulus":
      id = await insertKeteranganLulus(input);
      break;
    case "ijazah":
      id = await insertIjazah(input);
      break;
    case "transkrip":
      id = await insertTranskrip(input);
      break;
    case "legalisir":
      id = await insertLegalisir(input);
      break;
    case "permohonan_magang":
      id = await insertPermohonanMagang(input);
      break;
    default:
      throw new ServiceRequestSubmitError(
        "Pengajuan untuk layanan ini belum tersedia.",
        400
      );
  }

  return {
    id,
    serviceSlug: service.slug,
    serviceTitle: service.title,
    status: "pending",
  };
}
