import { z } from "zod";

const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(maxLength).optional()
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
});
