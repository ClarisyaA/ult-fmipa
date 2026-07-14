import { LetterDataError, MISSING_OFFICIAL_LETTER_DATA_MESSAGE } from "@/lib/letters/letter-data";
import { getLetterStudentProfile } from "@/lib/letters/letter-students";
import type { MagangLetterData } from "@/lib/letters/letter-types";
import { prisma } from "@/lib/prisma";

export type MagangPrintReadiness = {
  isReady: boolean;
  message: string;
};

const READY_MESSAGE = "Data surat siap dicetak.";
const NOT_READY_MESSAGE =
  "Data surat belum lengkap. Lengkapi data permohonan magang, nomor surat, tanggal surat, dan penandatangan sebelum mencetak.";

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new LetterDataError("ID pengajuan tidak valid.", 400);
  }
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasDate(value: Date | string | null | undefined) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateMagangLetterData(data: MagangLetterData) {
  const valid =
    hasText(data.npm) &&
    hasText(data.studentName) &&
    hasText(data.programStudy) &&
    hasText(data.requestType) &&
    hasText(data.institutionName) &&
    hasText(data.recipient) &&
    hasText(data.address) &&
    hasDate(data.startDate) &&
    hasDate(data.endDate) &&
    hasText(data.signer.letterNumber) &&
    hasDate(data.signer.letterDate) &&
    hasText(data.signer.place) &&
    hasText(data.signer.title) &&
    hasText(data.signer.name) &&
    hasText(data.signer.nip);

  if (!valid) {
    throw new LetterDataError(MISSING_OFFICIAL_LETTER_DATA_MESSAGE, 422);
  }
}

export async function getMagangLetterData(
  id: string,
): Promise<MagangLetterData | null> {
  assertValidId(id);

  const row = await prisma.permohonan_magang.findUnique({
    where: { ID: BigInt(id) },
    select: {
      ID: true,
      BAHASA_SURAT: true,
      NPM: true,
      NAMA: true,
      PRODI: true,
      JENIS_PERMOHONAN: true,
      KONTAK_PERSON: true,
      TEMPAT_PELAKSANAAN: true,
      TUJUAN_SURAT: true,
      ALAMAT_SURAT: true,
      KECAMATAN_KABUPATEN: true,
      KOTA_KABUPATEN: true,
      PROVINSI: true,
      TANGGAL_MULAI: true,
      TANGGAL_SELESAI: true,
      TTD_NO_SURAT: true,
      TTD_TANGGAL: true,
      TTD_TEMPAT: true,
      TTD_AN: true,
      TTD_PANGKAT_GOLONGAN: true,
      TTD_JABATAN: true,
      TTD_NAMA: true,
      TTD_NIP: true,
    },
  });

  if (!row) return null;

  const student = await getLetterStudentProfile(row.NPM);
  const data: MagangLetterData = {
    requestId: row.ID.toString(),
    languagePreference: row.BAHASA_SURAT === "en" ? "en" : "id",
    npm: row.NPM ?? "",
    studentName: row.NAMA ?? student?.name ?? "",
    programStudy: row.PRODI ?? student?.programStudy ?? null,
    requestType: row.JENIS_PERMOHONAN,
    contactPerson: row.KONTAK_PERSON,
    institutionName: row.TEMPAT_PELAKSANAAN,
    recipient: row.TUJUAN_SURAT,
    address: row.ALAMAT_SURAT,
    districtCity: row.KECAMATAN_KABUPATEN,
    city: row.KOTA_KABUPATEN,
    province: row.PROVINSI,
    startDate: row.TANGGAL_MULAI,
    endDate: row.TANGGAL_SELESAI,
    signer: {
      letterNumber: row.TTD_NO_SURAT,
      letterDate: row.TTD_TANGGAL,
      validUntil: null,
      place: row.TTD_TEMPAT,
      actingFor: row.TTD_AN,
      rank: row.TTD_PANGKAT_GOLONGAN,
      title: row.TTD_JABATAN,
      name: row.TTD_NAMA,
      nip: row.TTD_NIP,
    },
  };

  validateMagangLetterData(data);

  return data;
}

export async function getMagangPrintReadiness(
  id: string,
): Promise<MagangPrintReadiness | null> {
  if (!/^\d+$/.test(id)) {
    return { isReady: false, message: NOT_READY_MESSAGE };
  }

  try {
    const data = await getMagangLetterData(id);
    if (!data) return null;
    return { isReady: true, message: READY_MESSAGE };
  } catch (error) {
    if (error instanceof LetterDataError) {
      return { isReady: false, message: NOT_READY_MESSAGE };
    }
    throw error;
  }
}
