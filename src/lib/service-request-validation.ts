import { z } from "zod";

const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maxLength).optional()
  );

const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Tanggal tidak valid.")
    .optional()
);

const optionalPositiveInteger = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return typeof value === "string" ? Number(value) : value;
  },
  z
    .number()
    .int("Jumlah harus berupa angka bulat.")
    .positive("Jumlah harus lebih dari 0.")
    .optional()
);

export const createServiceRequestSchema = z.object({
  npm: z
    .string()
    .trim()
    .min(8, "NPM minimal 8 digit.")
    .max(15, "NPM maksimal 15 digit.")
    .regex(/^\d+$/, "NPM hanya boleh berisi angka."),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email("Email tidak valid.").optional()
  ),
  phone: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z
      .string()
      .trim()
      .max(30, "Nomor HP maksimal 30 karakter.")
      .regex(/^[0-9+\-\s]+$/, "Nomor HP tidak valid.")
      .optional()
  ),
  description: optionalText(100),
  scholarshipName: optionalText(100),
  semester: optionalText(25),
  tahunAkademik: optionalText(10),
  namaOrangTua: optionalText(100),
  nipNrp: optionalText(100),
  pangkatGolongan: optionalText(100),
  instansi: optionalText(100),
  pengantar: optionalText(150),
  ditujukan: optionalText(150),
  dasarSuratNo: optionalText(30),
  dasarSuratPerihal: optionalText(100),
  dasarSuratTgl: optionalDate,
  tempatLahir: optionalText(100),
  tanggalLahir: optionalDate,
  tanggalLulus: optionalDate,
  tglLulus: optionalDate,
  ipk: optionalText(5),
  yudisium: optionalText(25),
  jumlahTranskrip: optionalPositiveInteger,
  jumlahIjazah: optionalPositiveInteger,
  jumlahTranslet: optionalPositiveInteger,
});
