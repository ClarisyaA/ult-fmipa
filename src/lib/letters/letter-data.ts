import type { PrintableLetterService } from "@/lib/letters/letter-types";

export const PRINTABLE_LETTER_SERVICES = {
  "keterangan-lulus": {
    sourceTable: "keterangan_lulus",
    template: "keterangan-lulus",
  },
} satisfies Record<string, PrintableLetterService>;

export type PrintableLetterSlug = keyof typeof PRINTABLE_LETTER_SERVICES;

export const MISSING_LETTER_DATA_MESSAGE =
  "Data surat belum lengkap. Lengkapi nomor surat, tanggal surat, dan data penandatangan terlebih dahulu.";

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
  const valid =
    hasText(data.npm) &&
    hasText(data.studentName) &&
    hasDate(data.graduationDate) &&
    hasText(data.gpa) &&
    hasText(data.predicate) &&
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
