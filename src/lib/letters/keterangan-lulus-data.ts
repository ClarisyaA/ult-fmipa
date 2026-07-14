import { prisma } from "@/lib/prisma";
import {
  validateKeteranganLulusLetterData,
  LetterDataError,
} from "@/lib/letters/letter-data";
import { getLetterStudentProfile } from "@/lib/letters/letter-students";
import type { KeteranganLulusLetterData } from "@/lib/letters/letter-types";

export type KeteranganLulusPrintReadiness = {
  isReady: boolean;
  message: string;
};

const READY_MESSAGE = "Data surat siap dicetak.";
const NOT_READY_MESSAGE =
  "Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, masa berlaku, data kelulusan, dan penandatangan sebelum mencetak.";
const GRADUATION_NOT_VALID_MESSAGE =
  "IPK atau Yudisium belum valid. Validasi data kelulusan sebelum mencetak surat.";

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
      BAHASA_SURAT: true,
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

  const student = await getLetterStudentProfile(row.NPM);
  const data: KeteranganLulusLetterData = {
    requestId: row.ID.toString(),
    languagePreference: row.BAHASA_SURAT === "en" ? "en" : "id",
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
      rank: null,
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
      TEMPAT_LAHIR: true,
      TGL_LAHIR: true,
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

  const student = await getLetterStudentProfile(row.NPM);

  try {
    validateKeteranganLulusLetterData({
      npm: row.NPM,
      studentName: student?.name ?? null,
      birthPlace: row.TEMPAT_LAHIR,
      birthDate: row.TGL_LAHIR,
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
        message:
          error.message === GRADUATION_NOT_VALID_MESSAGE
            ? GRADUATION_NOT_VALID_MESSAGE
            : NOT_READY_MESSAGE,
      };
    }

    throw error;
  }
}
