import { prisma } from "@/lib/prisma";
import { deleteRequestAttachmentsByType } from "@/lib/request-attachments";

export const sikServiceSlug = "surat-izin-kegiatan";
export const sikSourceTable = "surat_izin_kegiatan";
export const sikApprovalProofAttachmentType = "manager_approval_proof";
export const sikFinalSpikAttachmentType = "final_spik_document";

export type SikApprovalActionInput =
  | {
      action: "approve";
      staffName: string;
    }
  | {
      action: "reject";
      reason: string;
      staffName: string;
    };

export type SikFinalSubmitInput = {
  namaHimpunan: string;
  namaKegiatan: string;
  tanggalKegiatan: string;
  emailPengiriman: string;
  noHpWa: string;
};

export class SikRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "SikRequestError";
    this.statusCode = statusCode;
  }
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new SikRequestError("ID pengajuan tidak valid.", 400);
  }
}

function normalizeRequiredText(value: string | undefined, label: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new SikRequestError(`${label} wajib diisi.`, 400);
  }

  return trimmed;
}

function normalizeDate(value: string | undefined, label: string) {
  const trimmed = normalizeRequiredText(value, label);
  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    throw new SikRequestError(`${label} tidak valid.`, 400);
  }

  return date;
}

export async function getStudentProfileForSik(npm: string) {
  const activeStudent = await prisma.mahasiswa.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
    },
  });

  if (activeStudent) {
    return {
      name: activeStudent.NAMA,
      program: activeStudent.PROGRAM_STUDI,
    };
  }

  const archivedStudent = await prisma.mahasiswa_sd_2015.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
    },
  });

  if (archivedStudent) {
    return {
      name: archivedStudent.NAMA,
      program: archivedStudent.PROGRAM_STUDI,
    };
  }

  const alumni = await prisma.alumni.findFirst({
    where: { npm },
    select: {
      nama: true,
      program: true,
      prodi: true,
    },
  });

  if (alumni) {
    return {
      name: alumni.nama,
      program: [alumni.program, alumni.prodi].filter(Boolean).join(" "),
    };
  }

  return {
    name: null,
    program: null,
  };
}

export async function getLatestSikRequestForStudent(npm: string) {
  return prisma.surat_izin_kegiatan.findFirst({
    where: {
      NPM: npm,
    },
    orderBy: [{ PERMINTAAN_TGL: "desc" }, { ID: "desc" }],
  });
}

export async function createSikApprovalProofRequest(input: {
  npm: string;
  uploadedBy: string | null;
}) {
  const latest = await getLatestSikRequestForStudent(input.npm);

  if (latest?.APPROVAL_STATUS === "pending") {
    throw new SikRequestError("Bukti ACC masih menunggu verifikasi.", 409);
  }

  if (latest?.APPROVAL_STATUS === "verified" && !latest.FINAL_SUBMITTED_TGL) {
    throw new SikRequestError(
      "Bukti ACC sudah terverifikasi. Silakan lengkapi form final SIK.",
      409
    );
  }

  const profile = await getStudentProfileForSik(input.npm);

  if (latest?.APPROVAL_STATUS === "rejected" && !latest.FINAL_SUBMITTED_TGL) {
    await deleteRequestAttachmentsByType(
      sikServiceSlug,
      sikSourceTable,
      String(latest.ID),
      sikApprovalProofAttachmentType
    );

    return prisma.surat_izin_kegiatan.update({
      where: { ID: latest.ID },
      data: {
        NAMA: profile.name,
        PRODI: profile.program,
        APPROVAL_STATUS: "pending",
        APPROVAL_VERIFIKASI_TGL: null,
        APPROVAL_VERIFIKASI_STAF: null,
        APPROVAL_REJECT_REASON: null,
        PERMINTAAN_TGL: new Date(),
        PERMINTAAN_ENTRY: input.uploadedBy ?? "Website ULT",
        PERMINTAAN_IP: null,
      },
    });
  }

  return prisma.surat_izin_kegiatan.create({
    data: {
      NPM: input.npm,
      NAMA: profile.name,
      PRODI: profile.program,
      APPROVAL_STATUS: "pending",
      PERMINTAAN_TGL: new Date(),
      PERMINTAAN_ENTRY: input.uploadedBy ?? "Website ULT",
      PERMINTAAN_IP: null,
    },
  });
}

export async function updateSikApproval(id: string, input: SikApprovalActionInput) {
  assertValidId(id);

  const request = await prisma.surat_izin_kegiatan.findUnique({
    where: { ID: BigInt(id) },
  });

  if (!request) {
    throw new SikRequestError("Pengajuan SIK tidak ditemukan.", 404);
  }

  if (request.FINAL_SUBMITTED_TGL) {
    throw new SikRequestError(
      "Bukti ACC tidak dapat diubah setelah form final dikirim.",
      409
    );
  }

  if (input.action === "approve") {
    return prisma.surat_izin_kegiatan.update({
      where: { ID: BigInt(id) },
      data: {
        APPROVAL_STATUS: "verified",
        APPROVAL_VERIFIKASI_TGL: new Date(),
        APPROVAL_VERIFIKASI_STAF: input.staffName,
        APPROVAL_REJECT_REASON: null,
      },
    });
  }

  const reason = normalizeRequiredText(input.reason, "Alasan penolakan");

  return prisma.surat_izin_kegiatan.update({
    where: { ID: BigInt(id) },
    data: {
      APPROVAL_STATUS: "rejected",
      APPROVAL_VERIFIKASI_TGL: new Date(),
      APPROVAL_VERIFIKASI_STAF: input.staffName,
      APPROVAL_REJECT_REASON: reason,
    },
  });
}

export async function submitSikFinalForm(
  id: string,
  npm: string,
  input: SikFinalSubmitInput
) {
  assertValidId(id);

  const request = await prisma.surat_izin_kegiatan.findUnique({
    where: { ID: BigInt(id) },
  });

  if (!request || request.NPM !== npm) {
    throw new SikRequestError("Pengajuan SIK tidak ditemukan.", 404);
  }

  if (request.APPROVAL_STATUS !== "verified") {
    throw new SikRequestError("Bukti ACC belum terverifikasi.", 409);
  }

  if (request.FINAL_SUBMITTED_TGL) {
    throw new SikRequestError("Form final SIK sudah dikirim.", 409);
  }

  return prisma.surat_izin_kegiatan.update({
    where: { ID: BigInt(id) },
    data: {
      FINAL_SUBMITTED_TGL: new Date(),
      NAMA_HIMPUNAN: normalizeRequiredText(input.namaHimpunan, "Nama himpunan"),
      NAMA_KEGIATAN: normalizeRequiredText(input.namaKegiatan, "Nama kegiatan"),
      TANGGAL_KEGIATAN: normalizeDate(
        input.tanggalKegiatan,
        "Tanggal kegiatan"
      ),
      EMAIL_PENGIRIMAN: normalizeRequiredText(
        input.emailPengiriman,
        "Email pengiriman SIK"
      ),
      NO_HP_WA: normalizeRequiredText(input.noHpWa, "No HP WA contact person"),
    },
  });
}
