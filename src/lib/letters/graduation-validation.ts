export const YUDISIUM_OPTIONS = [
  "Pujian",
  "Sangat Memuaskan",
  "Memuaskan",
] as const;

export const YUDISIUM_INVALID_MESSAGE =
  "Yudisium tidak valid. Pilih salah satu: Pujian, Sangat Memuaskan, atau Memuaskan.";

export const IPK_INVALID_MESSAGE =
  "IPK tidak valid. Masukkan angka antara 0.00 sampai 4.00.";

export const GRADUATION_DATA_INVALID_MESSAGE =
  "IPK atau Yudisium belum valid. Validasi data kelulusan sebelum mencetak surat.";

export type YudisiumOption = (typeof YUDISIUM_OPTIONS)[number];

export function isValidYudisium(value: string | null | undefined) {
  return YUDISIUM_OPTIONS.includes(value?.trim() as YudisiumOption);
}

export function parseIpk(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) {
    return null;
  }

  const normalized = Number(trimmed.replace(",", "."));

  if (!Number.isFinite(normalized) || normalized < 0 || normalized > 4) {
    return null;
  }

  return normalized;
}

export function isValidIpk(value: string | null | undefined) {
  return parseIpk(value) !== null;
}
