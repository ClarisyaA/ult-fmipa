import { prisma } from "@/lib/prisma";
import {
  LetterDataError,
  validateOfficialLetterData,
} from "@/lib/letters/letter-data";
import { getLetterStudentProfile } from "@/lib/letters/letter-students";
import type {
  BaseOfficialLetterData,
  OfficialLetterTemplate,
} from "@/lib/letters/letter-types";

export type PrintReadiness = {
  isReady: boolean;
  message: string;
};

export const PRINT_READY_MESSAGE = "Data surat siap dicetak.";
export const PRINT_NOT_READY_MESSAGE =
  "Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, data utama layanan, dan penandatangan sebelum mencetak.";

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new LetterDataError("ID pengajuan tidak valid.", 400);
  }
}

function validate(
  data: BaseOfficialLetterData,
  requiredText: Array<string | null | undefined>,
) {
  validateOfficialLetterData({
    npm: data.npm,
    studentName: data.studentName,
    requiredText,
    signer: {
      letterNumber: data.signer.letterNumber,
      letterDate: data.signer.letterDate,
      place: data.signer.place,
      rank: data.signer.rank,
      title: data.signer.title,
      name: data.signer.name,
      nip: data.signer.nip,
    },
  });
}

async function withStudent(
  npm: string | null,
  data: Omit<BaseOfficialLetterData, "npm" | "studentName" | "programStudy" | "level">,
): Promise<BaseOfficialLetterData> {
  const student = await getLetterStudentProfile(npm);

  return {
    ...data,
    npm: npm ?? "",
    studentName: student?.name ?? "",
    programStudy: student?.programStudy ?? null,
    level: student?.level ?? null,
  };
}

export async function getMasihKuliahLetterData(
  id: string,
): Promise<BaseOfficialLetterData | null> {
  assertValidId(id);

  const row = await prisma.masih_kuliah.findUnique({
    where: { ID: BigInt(id) },
    select: {
      ID: true,
      NPM: true,
      SEMESTER: true,
      TAHUN_AKADEMIK: true,
      NAMA_ORANG_TUA: true,
      NIP_NRP: true,
      PANGKAT_GOLONGAN: true,
      INSTANSI: true,
      TTD_NO_SURAT: true,
      TTD_TANGGAL: true,
      TTD_TEMPAT: true,
      TTD_PANGKAT_GOLONGAN: true,
      TTD_JABATAN: true,
      TTD_NAMA: true,
      TTD_NIP: true,
    },
  });

  if (!row) return null;

  const data = await withStudent(row.NPM, {
    requestId: row.ID.toString(),
    semester: row.SEMESTER,
    academicYear: row.TAHUN_AKADEMIK,
    parentName: row.NAMA_ORANG_TUA,
    parentNipNrp: row.NIP_NRP,
    parentRank: row.PANGKAT_GOLONGAN,
    parentInstitution: row.INSTANSI,
    signer: {
      letterNumber: row.TTD_NO_SURAT,
      letterDate: row.TTD_TANGGAL,
      validUntil: null,
      place: row.TTD_TEMPAT,
      actingFor: null,
      rank: row.TTD_PANGKAT_GOLONGAN,
      title: row.TTD_JABATAN,
      name: row.TTD_NAMA,
      nip: row.TTD_NIP,
    },
  });

  validate(data, [
    data.semester,
    data.academicYear,
    data.parentName,
    data.parentNipNrp,
    data.parentRank,
    data.parentInstitution,
  ]);

  return data;
}

export async function getMasihKuliahAktifLetterData(
  id: string,
): Promise<BaseOfficialLetterData | null> {
  assertValidId(id);

  const row = await prisma.masih_kuliah_aktif.findUnique({
    where: { ID: BigInt(id) },
    select: {
      ID: true,
      NPM: true,
      SEMESTER: true,
      TAHUN_AKADEMIK: true,
      ALAMAT: true,
      TTD_NO_SURAT: true,
      TTD_TANGGAL: true,
      TTD_TEMPAT: true,
      TTD_PANGKAT_GOLONGAN: true,
      TTD_JABATAN: true,
      TTD_NAMA: true,
      TTD_NIP: true,
    },
  });

  if (!row) return null;

  const data = await withStudent(row.NPM, {
    requestId: row.ID.toString(),
    semester: row.SEMESTER,
    academicYear: row.TAHUN_AKADEMIK,
    address: row.ALAMAT,
    signer: {
      letterNumber: row.TTD_NO_SURAT,
      letterDate: row.TTD_TANGGAL,
      validUntil: null,
      place: row.TTD_TEMPAT,
      actingFor: null,
      rank: row.TTD_PANGKAT_GOLONGAN,
      title: row.TTD_JABATAN,
      name: row.TTD_NAMA,
      nip: row.TTD_NIP,
    },
  });

  validate(data, [data.semester, data.academicYear, data.address]);

  return data;
}

export async function getKelakuanBaikLetterData(
  id: string,
): Promise<BaseOfficialLetterData | null> {
  assertValidId(id);

  const row = await prisma.kelakuan_baik.findUnique({
    where: { ID: BigInt(id) },
    select: {
      ID: true,
      NPM: true,
      ALAMAT: true,
      TTD_NO_SURAT: true,
      TTD_TANGGAL: true,
      TTD_TEMPAT: true,
      TTD_PANGKAT_GOLONGAN: true,
      TTD_JABATAN: true,
      TTD_NAMA: true,
      TTD_NIP: true,
    },
  });

  if (!row) return null;

  const data = await withStudent(row.NPM, {
    requestId: row.ID.toString(),
    address: row.ALAMAT,
    signer: {
      letterNumber: row.TTD_NO_SURAT,
      letterDate: row.TTD_TANGGAL,
      validUntil: null,
      place: row.TTD_TEMPAT,
      actingFor: null,
      rank: row.TTD_PANGKAT_GOLONGAN,
      title: row.TTD_JABATAN,
      name: row.TTD_NAMA,
      nip: row.TTD_NIP,
    },
  });

  validate(data, [data.address]);

  return data;
}

export async function getOfficialLetterData(
  template: OfficialLetterTemplate,
  id: string,
) {
  if (template === "masih-kuliah") return getMasihKuliahLetterData(id);
  if (template === "masih-kuliah-aktif") return getMasihKuliahAktifLetterData(id);
  if (template === "kelakuan-baik") return getKelakuanBaikLetterData(id);
  return null;
}

export async function getOfficialPrintReadiness(
  template: OfficialLetterTemplate,
  id: string,
): Promise<PrintReadiness | null> {
  if (!/^\d+$/.test(id)) {
    return { isReady: false, message: PRINT_NOT_READY_MESSAGE };
  }

  try {
    const data = await getOfficialLetterData(template, id);
    if (!data) return null;
    return { isReady: true, message: PRINT_READY_MESSAGE };
  } catch (error) {
    if (error instanceof LetterDataError) {
      return { isReady: false, message: PRINT_NOT_READY_MESSAGE };
    }
    throw error;
  }
}
