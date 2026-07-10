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
};

type UnsupportedWorkflowMetadata = {
  workflow: "unsupported";
  message?: string;
};

type RequestTableMetadata =
  | NormalWorkflowMetadata
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
    workflow: "unsupported",
    message: "Status update untuk layanan transkrip belum diaktifkan.",
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
    workflow: "unsupported",
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

  if (action === "process") {
    await prisma.$executeRaw`
      UPDATE ${table}
      SET \`PROSES_TGL\` = NOW(), \`PROSES_STAF\` = ${staffName}
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

  const deliveryColumn = Prisma.raw(quoteIdentifier(metadata.deliveryColumn));
  const deliveryByColumn = Prisma.raw(quoteIdentifier(metadata.deliveryByColumn));

  await prisma.$executeRaw`
    UPDATE ${table}
    SET ${deliveryColumn} = NOW(), ${deliveryByColumn} = ${staffName}
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

  const metadata = requestTableMetadata[service.sourceTable];

  if (metadata.workflow === "unsupported") {
    const message =
      "message" in metadata
        ? metadata.message
        : "Layanan ini belum mendukung update status.";

    throw new RequestStatusUpdateError(
      message,
      400
    );
  }

  await updateNormalWorkflow(
    service.sourceTable,
    metadata,
    input.action,
    input.staffName.trim(),
    id
  );

  const updatedDetail = await getRequestDetail(serviceSlug, id);

  if (!updatedDetail) {
    throw new RequestStatusUpdateError("Pengajuan tidak ditemukan.", 404);
  }

  return updatedDetail;
}
