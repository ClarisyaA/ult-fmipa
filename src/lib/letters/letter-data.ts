import type { PrintableLetterService } from "@/lib/letters/letter-types";
import {
  GRADUATION_DATA_INVALID_MESSAGE,
  isValidIpk,
  isValidYudisium,
} from "@/lib/letters/graduation-validation";

export const PRINTABLE_LETTER_SERVICES = {
  "keterangan-lulus": {
    sourceTable: "keterangan_lulus",
    template: "keterangan-lulus",
  },
  "ket-tunjangan-orang-tua": {
    sourceTable: "masih_kuliah",
    template: "masih-kuliah",
  },
  "keterangan-masih-kuliah": {
    sourceTable: "masih_kuliah_aktif",
    template: "masih-kuliah-aktif",
  },
  "keterangan-kelakuan-baik": {
    sourceTable: "kelakuan_baik",
    template: "kelakuan-baik",
  },
  "permohonan-magang-kerja-praktek-ta": {
    sourceTable: "permohonan_magang",
    template: "magang",
  },
} satisfies Record<string, PrintableLetterService>;

export type PrintableLetterSlug = keyof typeof PRINTABLE_LETTER_SERVICES;

export const MISSING_LETTER_DATA_MESSAGE =
  "Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, dan data penandatangan terlebih dahulu.";
export const MISSING_OFFICIAL_LETTER_DATA_MESSAGE =
  "Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, data penandatangan, dan data utama layanan terlebih dahulu.";

export class LetterDataError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "LetterDataError";
    this.statusCode = statusCode;
  }
}

export function getPrintableLetterService(
  serviceSlug: string,
): PrintableLetterService | null {
  return (
    PRINTABLE_LETTER_SERVICES[
      serviceSlug as keyof typeof PRINTABLE_LETTER_SERVICES
    ] ?? null
  );
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasDate(value: Date | string | null | undefined) {
  if (!value) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(value);

  return !Number.isNaN(date.getTime());
}

export function validateKeteranganLulusLetterData(data: {
  npm: string | null;
  studentName: string | null;
  birthPlace: string | null;
  birthDate: Date | string | null;
  graduationDate: Date | string | null;
  gpa: string | null;
  predicate: string | null;
  signer: {
    letterNumber: string | null;
    letterDate: Date | string | null;
    validUntil: Date | string | null;
    place: string | null;
    title: string | null;
    name: string | null;
    nip: string | null;
  };
}) {
  if (!isValidIpk(data.gpa) || !isValidYudisium(data.predicate)) {
    throw new LetterDataError(GRADUATION_DATA_INVALID_MESSAGE, 422);
  }

  const valid =
    hasText(data.npm) &&
    hasText(data.studentName) &&
    hasText(data.birthPlace) &&
    hasDate(data.birthDate) &&
    hasDate(data.graduationDate) &&
    hasText(data.signer.letterNumber) &&
    hasDate(data.signer.letterDate) &&
    hasDate(data.signer.validUntil) &&
    hasText(data.signer.place) &&
    hasText(data.signer.title) &&
    hasText(data.signer.name) &&
    hasText(data.signer.nip);

  if (!valid) {
    throw new LetterDataError(MISSING_LETTER_DATA_MESSAGE, 422);
  }
}

export function validateOfficialLetterData(data: {
  npm: string | null;
  studentName: string | null;
  requiredText: Array<string | null | undefined>;
  signer: {
    letterNumber: string | null;
    letterDate: Date | string | null;
    place: string | null;
    rank: string | null;
    title: string | null;
    name: string | null;
    nip: string | null;
  };
}) {
  const valid =
    hasText(data.npm) &&
    hasText(data.studentName) &&
    data.requiredText.every((value) => hasText(value)) &&
    hasText(data.signer.letterNumber) &&
    hasDate(data.signer.letterDate) &&
    hasText(data.signer.place) &&
    hasText(data.signer.rank) &&
    hasText(data.signer.title) &&
    hasText(data.signer.name) &&
    hasText(data.signer.nip);

  if (!valid) {
    throw new LetterDataError(MISSING_OFFICIAL_LETTER_DATA_MESSAGE, 422);
  }
}
