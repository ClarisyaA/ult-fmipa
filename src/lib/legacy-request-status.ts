import { Prisma } from "@prisma/client";

import { getRequestDetail } from "@/lib/legacy-request-detail";
import { getPublicServiceBySlug } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";
import type { ServiceRequestDetail } from "@/types/request-detail";
import type {
  RequestStatusAction,
  UpdateRequestStatusInput,
} from "@/types/request-action";

type NormalWorkflowMetadata = {
  workflow: "normal";
  deliveryColumn: "DIAMBIL_TGL" | "DIKIRIM_TGL";
  deliveryByColumn: "DIAMBIL_OLEH" | "DIKIRIM_OLEH";
  requireFinalSubmitted?: boolean;
};

/**
 * Maps the generic Proses/Selesai/Dikirim actions onto the 4-stage
 * verification pipeline (Verifikasi -> Fakultas -> Universitas -> Diambil)
 * used by ijazah/transkrip, matching the read-side status derivation in
 * `getVerificationStatus` (legacy-request-detail.ts): VERIFIKASI_TGL drives
 * "inProgress", UNIVERSITAS_TGL drives "completed", DIAMBIL_TGL drives
 * "delivered". FAKULTAS_TGL/STAF is set alongside "complete" so the
 * intermediate faculty stage isn't left permanently empty once a request
 * is marked done.
 */
type VerificationWorkflowMetadata = {
  workflow: "verification";
};

type UnsupportedWorkflowMetadata = {
  workflow: "unsupported";
  message?: string;
};

type RequestTableMetadata =
  | NormalWorkflowMetadata
  | VerificationWorkflowMetadata
  | UnsupportedWorkflowMetadata;

const requestTableMetadata = {
  masih_kuliah_aktif: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
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
  },
  legalisir: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
  transkrip: {
    workflow: "verification",
  },
  bebas_pinjaman: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
  },
  plagiarisme: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
  },
  referensi: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
  },
  unggah_karya_ilmiah: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
  },
  surat_pengantar: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
  permohonan_magang: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
  },
  surat_izin_kegiatan: {
    workflow: "normal",
    deliveryColumn: "DIKIRIM_TGL",
    deliveryByColumn: "DIKIRIM_OLEH",
    requireFinalSubmitted: true,
  },
  beasiswa: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
  kelakuan_baik: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
  ijazah: {
    workflow: "verification",
  },
  kks: {
    workflow: "normal",
    deliveryColumn: "DIAMBIL_TGL",
    deliveryByColumn: "DIAMBIL_OLEH",
  },
} satisfies Record<string, RequestTableMetadata>;

type RequestTableName = keyof typeof requestTableMetadata;

const validActions = new Set<RequestStatusAction>([
  "process",
  "complete",
  "deliver",
  "cancelProcess",
  "cancelComplete",
  "cancelDeliver",
]);

export class RequestStatusUpdateError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RequestStatusUpdateError";
    this.statusCode = statusCode;
  }
}

function isRequestTable(sourceTable: string): sourceTable is RequestTableName {
  return sourceTable in requestTableMetadata;
}

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new RequestStatusUpdateError("ID pengajuan tidak valid.", 400);
  }
}

function assertValidInput(input: UpdateRequestStatusInput) {
  if (!validActions.has(input.action)) {
    throw new RequestStatusUpdateError("Aksi status tidak valid.", 400);
  }

  if (!input.staffName.trim()) {
    throw new RequestStatusUpdateError("Nama staff wajib diisi.", 400);
  }
}

async function updateNormalWorkflow(
  sourceTable: RequestTableName,
  metadata: NormalWorkflowMetadata,
  action: RequestStatusAction,
  staffName: string,
  id: string
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));
  const deliveryColumn = Prisma.raw(quoteIdentifier(metadata.deliveryColumn));
  const deliveryByColumn = Prisma.raw(quoteIdentifier(metadata.deliveryByColumn));

  if (action === "process") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET \`PROSES_TGL\` = NOW(), \`PROSES_STAF\` = ${staffName}
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "cancelProcess") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET
        \`PROSES_TGL\` = NULL,
        \`PROSES_STAF\` = NULL,
        \`SELESAI_TGL\` = NULL,
        \`SELESAI_STAF\` = NULL,
        ${deliveryColumn} = NULL,
        ${deliveryByColumn} = NULL
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "complete") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET \`SELESAI_TGL\` = NOW(), \`SELESAI_STAF\` = ${staffName}
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "cancelComplete") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET
        \`SELESAI_TGL\` = NULL,
        \`SELESAI_STAF\` = NULL,
        ${deliveryColumn} = NULL,
        ${deliveryByColumn} = NULL
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "cancelDeliver") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET ${deliveryColumn} = NULL, ${deliveryByColumn} = NULL
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  await prisma.$executeRaw`
    UPDATE ${table}
    SET ${deliveryColumn} = NOW(), ${deliveryByColumn} = ${staffName}
    WHERE \`ID\` = ${id}
    LIMIT 1
  `;
}

async function updateVerificationWorkflow(
  sourceTable: RequestTableName,
  action: RequestStatusAction,
  staffName: string,
  id: string
) {
  const table = Prisma.raw(quoteIdentifier(sourceTable));

  if (action === "process") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET \`VERIFIKASI_TGL\` = NOW(), \`VERIFIKASI_STAF\` = ${staffName}
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "cancelProcess") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET
        \`VERIFIKASI_TGL\` = NULL,
        \`VERIFIKASI_STAF\` = NULL,
        \`FAKULTAS_TGL\` = NULL,
        \`FAKULTAS_STAF\` = NULL,
        \`UNIVERSITAS_TGL\` = NULL,
        \`UNIVERSITAS_STAF\` = NULL,
        \`DIAMBIL_TGL\` = NULL,
        \`DIAMBIL_OLEH\` = NULL
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "complete") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET
        \`FAKULTAS_TGL\` = COALESCE(\`FAKULTAS_TGL\`, NOW()),
        \`FAKULTAS_STAF\` = COALESCE(\`FAKULTAS_STAF\`, ${staffName}),
        \`UNIVERSITAS_TGL\` = NOW(),
        \`UNIVERSITAS_STAF\` = ${staffName}
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "cancelComplete") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET
        \`FAKULTAS_TGL\` = NULL,
        \`FAKULTAS_STAF\` = NULL,
        \`UNIVERSITAS_TGL\` = NULL,
        \`UNIVERSITAS_STAF\` = NULL,
        \`DIAMBIL_TGL\` = NULL,
        \`DIAMBIL_OLEH\` = NULL
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  if (action === "cancelDeliver") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET \`DIAMBIL_TGL\` = NULL, \`DIAMBIL_OLEH\` = NULL
      WHERE \`ID\` = ${id}
      LIMIT 1
    `;
    return;
  }

  await prisma.$executeRaw`
    UPDATE ${table}
    SET \`DIAMBIL_TGL\` = NOW(), \`DIAMBIL_OLEH\` = ${staffName}
    WHERE \`ID\` = ${id}
    LIMIT 1
  `;
}

export async function updateRequestStatus(
  serviceSlug: string,
  id: string,
  input: UpdateRequestStatusInput
): Promise<ServiceRequestDetail> {
  assertValidId(id);
  assertValidInput(input);

  const service = getPublicServiceBySlug(serviceSlug);

  if (!service || !isRequestTable(service.sourceTable)) {
    throw new RequestStatusUpdateError(
      "Layanan ini belum mendukung update status.",
      400
    );
  }

  const currentDetail = await getRequestDetail(serviceSlug, id);

  if (!currentDetail) {
    throw new RequestStatusUpdateError("Pengajuan tidak ditemukan.", 404);
  }

  // Widened back to the full union: the object literal's inferred type is
  // narrower than `RequestTableMetadata` right now (every current entry is
  // "normal" or "verification"), but the "unsupported" branch below remains
  // a valid safety net for any future table that isn't wired up yet.
  const metadata = requestTableMetadata[service.sourceTable] as RequestTableMetadata;

  if (metadata.workflow === "unsupported") {
    const message =
      metadata.message ?? "Layanan ini belum mendukung update status.";

    throw new RequestStatusUpdateError(
      message,
      400
    );
  }

  if (
    "requireFinalSubmitted" in metadata &&
    metadata.requireFinalSubmitted &&
    !currentDetail.finalSubmittedDate
  ) {
    throw new RequestStatusUpdateError(
      "Form final SIK belum dikirim oleh mahasiswa.",
      400
    );
  }

  if (metadata.workflow === "verification") {
    await updateVerificationWorkflow(
      service.sourceTable,
      input.action,
      input.staffName.trim(),
      id
    );
  } else {
    await updateNormalWorkflow(
      service.sourceTable,
      metadata,
      input.action,
      input.staffName.trim(),
      id
    );
  }

  const updatedDetail = await getRequestDetail(serviceSlug, id);

  if (!updatedDetail) {
    throw new RequestStatusUpdateError("Pengajuan tidak ditemukan.", 404);
  }

  return updatedDetail;
}
