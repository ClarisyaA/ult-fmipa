import { z } from "zod";

import {
  IPK_INVALID_MESSAGE,
  isValidIpk,
  isValidYudisium,
  YUDISIUM_INVALID_MESSAGE,
} from "@/lib/letters/graduation-validation";

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
  "Magang Kerja",
  "Kerja Praktek Industri",
  "Praktik Kerja",
  "Magang Tugas Akhir",
] as const;

const programStudiOptions = [
  "S-1 Matematika",
  "S-1 Kimia",
  "S-1 Fisika",
  "S-1 Biologi",
  "S-1 Statistika",
  "S-1 Teknik Informatika",
  "S-1 Teknik Elektro",
  "S-1 Ilmu Aktuaria",
  "D-IV Teknologi Industri Kimia",
  "S-1 Geofisika",
  "S-2 Statistika Terapan",
  "S-2 Ilmu Kimia",
] as const;

const requiredMagangFields = [
  ["programStudi", "Program studi wajib dipilih."],
  ["jenisPermohonan", "Jenis permohonan wajib dipilih."],
  ["tempatPelaksanaan", "Tempat pelaksanaan wajib diisi."],
  ["tujuanSurat", "Tujuan surat wajib diisi."],
  ["alamatSurat", "Alamat surat wajib diisi."],
  ["kecamatanKabupaten", "Kecamatan dan kabupaten wajib diisi."],
  ["kotaKabupaten", "Kota/kabupaten wajib diisi."],
  ["tanggalMulai", "Tanggal mulai wajib diisi."],
  ["tanggalSelesai", "Tanggal selesai wajib diisi."],
] as const;

const requiredCommonContactFields = [
  ["email", "Email wajib diisi."],
  ["phone", "No HP/WhatsApp wajib diisi."],
  ["bahasaSurat", "Bahasa surat wajib dipilih."],
] as const;

const requiredFieldsByService = {
  "kartu-prestasi-akademik": [
    ...requiredCommonContactFields,
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "kartu-kemajuan-studi": [
    ...requiredCommonContactFields,
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "rekomendasi-beasiswa": [
    ...requiredCommonContactFields,
    ["scholarshipName", "Nama beasiswa wajib diisi."],
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "ket-tunjangan-orang-tua": [
    ...requiredCommonContactFields,
    ["semester", "Semester wajib diisi."],
    ["tahunAkademik", "Tahun akademik wajib diisi."],
    ["namaOrangTua", "Nama orang tua wajib diisi."],
    ["nipNrp", "NIP/NRP wajib diisi."],
    ["pangkatGolongan", "Pangkat/golongan wajib diisi."],
    ["instansi", "Instansi wajib diisi."],
  ],
  "keterangan-masih-kuliah": [
    ...requiredCommonContactFields,
    ["semester", "Semester wajib diisi."],
    ["tahunAkademik", "Tahun akademik wajib diisi."],
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "keterangan-kelakuan-baik": [
    ...requiredCommonContactFields,
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "surat-pengantar": [
    ...requiredCommonContactFields,
    ["pengantar", "Pengantar wajib diisi."],
    ["ditujukan", "Tujuan surat wajib diisi."],
    ["dasarSuratNo", "No. dasar surat wajib diisi."],
    ["dasarSuratPerihal", "Perihal dasar surat wajib diisi."],
    ["dasarSuratTgl", "Tanggal dasar surat wajib diisi."],
  ],
  "keterangan-lulus": [
    ...requiredCommonContactFields,
    ["tempatLahir", "Tempat lahir wajib diisi."],
    ["tanggalLahir", "Tanggal lahir wajib diisi."],
  ],
  "penerbitan-transkrip": [
    ...requiredCommonContactFields,
    ["tanggalLulus", "Tanggal lulus wajib diisi."],
  ],
  "penerbitan-ijazah": [
    ...requiredCommonContactFields,
    ["tanggalLulus", "Tanggal lulus wajib diisi."],
  ],
  "legalisir-ijazah-transkrip": [
    ...requiredCommonContactFields,
    ["jumlahTranskrip", "Jumlah transkrip wajib diisi."],
    ["jumlahIjazah", "Jumlah ijazah wajib diisi."],
    ["jumlahTranslet", "Jumlah terjemahan wajib diisi."],
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "bebas-peminjaman": [
    ...requiredCommonContactFields,
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "unggah-karya-ilmiah": [
    ...requiredCommonContactFields,
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "cek-plagiarisme": [
    ...requiredCommonContactFields,
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  referensi: [
    ...requiredCommonContactFields,
    ["description", "Keterangan/keperluan wajib diisi."],
  ],
  "permohonan-magang-kerja-praktek-ta": [
    ...requiredCommonContactFields,
    ...requiredMagangFields,
  ],
} as const;

type RequiredFieldName =
  (typeof requiredFieldsByService)[keyof typeof requiredFieldsByService][number][0];

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
    z.string().trim().email("Email tidak valid.").max(150, "Email maksimal 150 karakter.").optional()
  ),
  bahasaSurat: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.enum(["id", "en"], {
      error: "Bahasa surat tidak valid.",
    }).default("id")
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
  programStudi: optionalText(150),
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
  const requiredFields = input.serviceSlug
    ? requiredFieldsByService[input.serviceSlug as keyof typeof requiredFieldsByService]
    : undefined;

  for (const [field, message] of requiredFields ?? []) {
    if (!input[field as RequiredFieldName]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message,
      });
    }
  }

  if (input.serviceSlug === "keterangan-lulus") {
    if (!input.tanggalLulus && !input.tglLulus) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tanggalLulus"],
        message: "Tanggal lulus wajib diisi.",
      });
    }

    if (!input.ipk || !isValidIpk(input.ipk)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ipk"],
        message: IPK_INVALID_MESSAGE,
      });
    }

    if (!input.yudisium || !isValidYudisium(input.yudisium)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yudisium"],
        message: YUDISIUM_INVALID_MESSAGE,
      });
    }
  }

  if (input.serviceSlug !== "permohonan-magang-kerja-praktek-ta") {
    return;
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

  if (
    input.programStudi &&
    !programStudiOptions.includes(
      input.programStudi as (typeof programStudiOptions)[number]
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["programStudi"],
      message: "Program studi tidak valid.",
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
