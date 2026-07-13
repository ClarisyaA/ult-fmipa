import type { LetterDateValue } from "@/lib/letters/letter-types";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatIndonesianDate(value: LetterDateValue) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function sanitizePdfFilename(value: string | null | undefined) {
  return (value ?? "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 80);
}

export function keteranganLulusFilename(npm: string | null | undefined) {
  const safeNpm = sanitizePdfFilename(npm);

  return safeNpm ? `skl_${safeNpm}.pdf` : "skl_surat.pdf";
}
