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

const magangJenisPermohonan = [
  "Magang",
  "Kerja Praktek",
  "Tugas Akhir (TA)",
] as const;

const requiredMagangFields = [
  ["jenisPermohonan", "Jenis permohonan wajib dipilih."],
  ["tempatPelaksanaan", "Tempat pelaksanaan wajib diisi."],
  ["tujuanSurat", "Tujuan surat wajib diisi."],
  ["alamatSurat", "Alamat surat wajib diisi."],
  ["kecamatanKabupaten", "Kecamatan dan kabupaten wajib diisi."],
  ["kotaKabupaten", "Kota/kabupaten wajib diisi."],
  ["tanggalMulai", "Tanggal mulai wajib diisi."],
  ["tanggalSelesai", "Tanggal selesai wajib diisi."],
] as const;

export const createServiceRequestSchema = z.object({
  serviceSlug: optionalText(100),
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
  jenisPermohonan: optionalText(50),
  kontakPerson: optionalText(150),
  tempatPelaksanaan: optionalText(200),
  tujuanSurat: optionalText(200),
  alamatSurat: optionalText(255),
  kecamatanKabupaten: optionalText(150),
  kotaKabupaten: optionalText(100),
  provinsi: optionalText(100),
  tanggalMulai: optionalDate,
  tanggalSelesai: optionalDate,
}).superRefine((input, context) => {
  if (input.serviceSlug !== "permohonan-magang-kerja-praktek-ta") {
    return;
  }

  for (const [field, message] of requiredMagangFields) {
    if (!input[field]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message,
      });
    }
  }

  if (
    input.jenisPermohonan &&
    !magangJenisPermohonan.includes(
      input.jenisPermohonan as (typeof magangJenisPermohonan)[number]
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["jenisPermohonan"],
      message: "Jenis permohonan tidak valid.",
    });
  }

  if (input.tanggalMulai && input.tanggalSelesai) {
    const start = new Date(input.tanggalMulai);
    const end = new Date(input.tanggalSelesai);

    if (end < start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tanggalSelesai"],
        message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
      });
    }
  }
});
