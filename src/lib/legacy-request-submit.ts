import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type {
  CreateServiceRequestInput,
  CreateServiceRequestResult,
} from "@/types/submission";

type SupportedSubmissionTable =
  | "beasiswa"
  | "bebas_pinjaman"
  | "plagiarisme"
  | "referensi";

const supportedSubmissionTables = {
  beasiswa: "beasiswa",
  bebas_pinjaman: "bebas_pinjaman",
  plagiarisme: "plagiarisme",
  referensi: "referensi",
} satisfies Record<SupportedSubmissionTable, SupportedSubmissionTable>;

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
      [
        "rekomendasi-beasiswa",
        "bebas-peminjaman",
        "cek-plagiarisme",
        "referensi",
      ].includes(service.slug)
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
  sourceTable: SupportedSubmissionTable,
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

  const created = await prisma.referensi.create({ data });

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

  const id =
    service.sourceTable === "beasiswa"
      ? await insertBeasiswa(input)
      : await insertSimpleRequest(service.sourceTable, input);

  return {
    id,
    serviceSlug: service.slug,
    serviceTitle: service.title,
    status: "pending",
  };
}
