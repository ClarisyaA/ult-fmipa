import { prisma } from "@/lib/prisma";
import {
  validateKeteranganLulusLetterData,
  LetterDataError,
} from "@/lib/letters/letter-data";
import type { KeteranganLulusLetterData } from "@/lib/letters/letter-types";

type StudentProfile = {
  name: string | null;
  programStudy: string | null;
  level: string | null;
};

export type KeteranganLulusPrintReadiness = {
  isReady: boolean;
  message: string;
};

const READY_MESSAGE = "Data surat siap dicetak.";
const NOT_READY_MESSAGE =
  "Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, masa berlaku, data kelulusan, dan penandatangan sebelum mencetak.";

async function getStudentProfile(npm: string | null): Promise<StudentProfile | null> {
  if (!npm) {
    return null;
  }

  const activeStudent = await prisma.mahasiswa.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
      JENJANG: true,
    },
  });

  if (activeStudent) {
    return {
      name: activeStudent.NAMA,
      programStudy: activeStudent.PROGRAM_STUDI,
      level: activeStudent.JENJANG,
    };
  }

  const archivedStudent = await prisma.mahasiswa_sd_2015.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
      JENJANG: true,
    },
  });

  if (archivedStudent) {
    return {
      name: archivedStudent.NAMA,
      programStudy: archivedStudent.PROGRAM_STUDI,
      level: archivedStudent.JENJANG,
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
      programStudy: [alumni.program, alumni.prodi].filter(Boolean).join(" "),
      level: alumni.program,
    };
  }

  return null;
}

export async function getKeteranganLulusLetterData(
  id: string,
): Promise<KeteranganLulusLetterData | null> {
  if (!/^\d+$/.test(id)) {
    throw new LetterDataError("ID pengajuan tidak valid.", 400);
  }

  const row = await prisma.keterangan_lulus.findUnique({
    where: {
      ID: BigInt(id),
    },
    select: {
      ID: true,
      NPM: true,
      TEMPAT_LAHIR: true,
      TGL_LAHIR: true,
      TGL_LULUS: true,
      IPK: true,
      YUDISIUM: true,
      DASAR_SURAT_NO: true,
      DASAR_SURAT_PERIHAL: true,
      DASAR_SURAT_TGL: true,
      TTD_NO_SURAT: true,
      TTD_TANGGAL: true,
      TTD_TANGGAL_BERLAKU: true,
      TTD_TEMPAT: true,
      TTD_AN: true,
      TTD_JABATAN: true,
      TTD_NAMA: true,
      TTD_NIP: true,
    },
  });

  if (!row) {
    return null;
  }

  const student = await getStudentProfile(row.NPM);
  const data: KeteranganLulusLetterData = {
    requestId: row.ID.toString(),
    npm: row.NPM ?? "",
    studentName: student?.name ?? "",
    programStudy: student?.programStudy ?? null,
    level: student?.level ?? null,
    birthPlace: row.TEMPAT_LAHIR,
    birthDate: row.TGL_LAHIR,
    graduationDate: row.TGL_LULUS,
    gpa: row.IPK,
    predicate: row.YUDISIUM,
    decreeNumber: row.DASAR_SURAT_NO,
    decreeSubject: row.DASAR_SURAT_PERIHAL,
    decreeDate: row.DASAR_SURAT_TGL,
    signer: {
      letterNumber: row.TTD_NO_SURAT,
      letterDate: row.TTD_TANGGAL,
      validUntil: row.TTD_TANGGAL_BERLAKU,
      place: row.TTD_TEMPAT,
      actingFor: row.TTD_AN,
      title: row.TTD_JABATAN,
      name: row.TTD_NAMA,
      nip: row.TTD_NIP,
    },
  };

  validateKeteranganLulusLetterData(data);

  return data;
}

export async function getKeteranganLulusPrintReadiness(
  id: string,
): Promise<KeteranganLulusPrintReadiness | null> {
  if (!/^\d+$/.test(id)) {
    return {
      isReady: false,
      message: NOT_READY_MESSAGE,
    };
  }

  const row = await prisma.keterangan_lulus.findUnique({
    where: {
      ID: BigInt(id),
    },
    select: {
      NPM: true,
      TGL_LULUS: true,
      IPK: true,
      YUDISIUM: true,
      TTD_NO_SURAT: true,
      TTD_TANGGAL: true,
      TTD_TANGGAL_BERLAKU: true,
      TTD_TEMPAT: true,
      TTD_JABATAN: true,
      TTD_NAMA: true,
      TTD_NIP: true,
    },
  });

  if (!row) {
    return null;
  }

  const student = await getStudentProfile(row.NPM);

  try {
    validateKeteranganLulusLetterData({
      npm: row.NPM,
      studentName: student?.name ?? null,
      graduationDate: row.TGL_LULUS,
      gpa: row.IPK,
      predicate: row.YUDISIUM,
      signer: {
        letterNumber: row.TTD_NO_SURAT,
        letterDate: row.TTD_TANGGAL,
        validUntil: row.TTD_TANGGAL_BERLAKU,
        place: row.TTD_TEMPAT,
        title: row.TTD_JABATAN,
        name: row.TTD_NAMA,
        nip: row.TTD_NIP,
      },
    });

    return {
      isReady: true,
      message: READY_MESSAGE,
    };
  } catch (error) {
    if (error instanceof LetterDataError) {
      return {
        isReady: false,
        message: NOT_READY_MESSAGE,
      };
    }

    throw error;
  }
}
