import type { LetterDateValue, LetterLanguage } from "@/lib/letters/letter-types";

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

const ENGLISH_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toValidDate(value: LetterDateValue) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatIndonesianDate(value: LetterDateValue) {
  const date = toValidDate(value);

  if (!date) {
    return "";
  }

  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatEnglishDate(value: LetterDateValue) {
  const date = toValidDate(value);

  if (!date) {
    return "";
  }

  return `${date.getDate()} ${ENGLISH_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatLetterDate(value: LetterDateValue, language: LetterLanguage) {
  return language === "en" ? formatEnglishDate(value) : formatIndonesianDate(value);
}

export function formatIndonesianDateRange(
  startValue: LetterDateValue,
  endValue: LetterDateValue,
) {
  const start = formatIndonesianDate(startValue);
  const end = formatIndonesianDate(endValue);

  if (start && end) {
    return start === end ? start : `${start} s.d. ${end}`;
  }

  return start || end;
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

export function officialLetterFilename(
  prefix: "skmk" | "skmka" | "skkb" | "magang",
  npm: string | null | undefined,
) {
  const safeNpm = sanitizePdfFilename(npm);

  return safeNpm ? `${prefix}_${safeNpm}.pdf` : `${prefix}_surat.pdf`;
}
