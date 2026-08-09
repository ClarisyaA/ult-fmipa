"use client";

import { ChangeEvent, FormEvent, type ReactNode, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { YUDISIUM_OPTIONS } from "@/lib/letters/graduation-validation";
import { getServiceUploadRule, type ServiceUploadRule } from "@/lib/service-upload-config";
import type { CreateServiceRequestResult } from "@/types/submission";

type ServiceRequestFormProps = {
  serviceSlug: string;
  templateLinks?: {
    scholarshipRecommendation?: {
      label: string;
      url: string;
      isActive: boolean;
    };
  };
  defaultValues?: {
    npm?: string;
    email?: string | null;
    phone?: string;
  };
};

type ApiIssue = {
  field: string;
  message: string;
};

const magangJenisPermohonan = [
  "Magang Kerja",
  "Kerja Praktek Industri",
  "Praktik Kerja",
  "Magang Tugas Akhir",
];

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
];

function RequiredMark() {
  return (
    <span className="text-[#EE1C25]" aria-label="wajib diisi">
      *
    </span>
  );
}

function OptionalMark() {
  return (
    <span className="text-xs font-normal text-[#7A6A5C]">
      (Opsional)
    </span>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
  optional = false,
  className = "",
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={`inline-flex flex-wrap items-center gap-1 text-sm font-medium text-[#18130E] ${className}`}
    >
      {children}
      {required ? <RequiredMark /> : null}
      {!required && optional ? <OptionalMark /> : null}
    </Label>
  );
}

function FieldHint({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-xs leading-relaxed text-[#7A6A5C] ${className}`}>
      {children}
    </p>
  );
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function formatFileSizeMb(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");

  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

function validateAttachmentFile(file: File, uploadRule: ServiceUploadRule) {
  if (file.size > uploadRule.maxFileSizeBytes) {
    return `File ${file.name} melebihi ${Math.floor(
      uploadRule.maxFileSizeBytes / (1024 * 1024)
    )} MB.`;
  }

  if (
    !uploadRule.allowedMimeTypes.includes(file.type) ||
    !uploadRule.allowedExtensions.includes(getFileExtension(file.name))
  ) {
    return `Format file ${file.name} tidak didukung.`;
  }

  return "";
}

export function ServiceRequestForm({
  serviceSlug,
  templateLinks,
  defaultValues,
}: ServiceRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CreateServiceRequestResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const uploadRule = getServiceUploadRule(serviceSlug);
  const acceptAttribute = [
    ...uploadRule.allowedExtensions,
    ...uploadRule.allowedMimeTypes,
  ].join(",");

  function setAttachmentValidationError(message: string) {
    setError(message);
    setFieldErrors((current) => ({
      ...current,
      attachments: message,
    }));
  }

  function clearAttachmentValidationError() {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.attachments;
      return next;
    });
    setError((current) =>
      current.startsWith("File ") ||
      current.startsWith("Format file ") ||
      current === `Maksimal ${uploadRule.maxFiles} file lampiran.`
        ? ""
        : current
    );
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []).filter(
      (file) => file.size > 0
    );

    event.currentTarget.value = "";

    if (files.length === 0) {
      return;
    }

    const invalidMessage = files
      .map((file) => validateAttachmentFile(file, uploadRule))
      .find((message) => message);

    if (invalidMessage) {
      setAttachmentValidationError(invalidMessage);
      return;
    }

    if (selectedFiles.length + files.length > uploadRule.maxFiles) {
      setAttachmentValidationError(
        `Maksimal ${uploadRule.maxFiles} file lampiran.`
      );
      return;
    }

    setSelectedFiles((current) => [...current, ...files]);
    clearAttachmentValidationError();
  }

  function handleRemoveAttachment(indexToRemove: number) {
    setSelectedFiles((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
    clearAttachmentValidationError();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setError("");
    setFieldErrors({});
    setResult(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(form);
      const payload = {
        npm: getFormString(formData, "npm"),
        email: getFormString(formData, "email"),
        phone: getFormString(formData, "phone"),
        bahasaSurat: getFormString(formData, "bahasaSurat"),
        description: getFormString(formData, "description"),
        scholarshipName: getFormString(formData, "scholarshipName"),
        semester: getFormString(formData, "semester"),
        tahunAkademik: getFormString(formData, "tahunAkademik"),
        namaOrangTua: getFormString(formData, "namaOrangTua"),
        nipNrp: getFormString(formData, "nipNrp"),
        pangkatGolongan: getFormString(formData, "pangkatGolongan"),
        instansi: getFormString(formData, "instansi"),
        pengantar: getFormString(formData, "pengantar"),
        ditujukan: getFormString(formData, "ditujukan"),
        dasarSuratNo: getFormString(formData, "dasarSuratNo"),
        dasarSuratPerihal: getFormString(formData, "dasarSuratPerihal"),
        dasarSuratTgl: getFormString(formData, "dasarSuratTgl"),
        tempatLahir: getFormString(formData, "tempatLahir"),
        tanggalLahir: getFormString(formData, "tanggalLahir"),
        tanggalLulus: getFormString(formData, "tanggalLulus"),
        tglLulus: getFormString(formData, "tanggalLulus"),
        ipk: getFormString(formData, "ipk"),
        yudisium: getFormString(formData, "yudisium"),
        jumlahTranskrip: getFormString(formData, "jumlahTranskrip"),
        jumlahIjazah: getFormString(formData, "jumlahIjazah"),
        jumlahTranslet: getFormString(formData, "jumlahTranslet"),
        programStudi: getFormString(formData, "programStudi"),
        jenisPermohonan: getFormString(formData, "jenisPermohonan"),
        kontakPerson: getFormString(formData, "kontakPerson"),
        tempatPelaksanaan: getFormString(formData, "tempatPelaksanaan"),
        tujuanSurat: getFormString(formData, "tujuanSurat"),
        alamatSurat: getFormString(formData, "alamatSurat"),
        kecamatanKabupaten: getFormString(formData, "kecamatanKabupaten"),
        kotaKabupaten: getFormString(formData, "kotaKabupaten"),
        provinsi: getFormString(formData, "provinsi"),
        tanggalMulai: getFormString(formData, "tanggalMulai"),
        tanggalSelesai: getFormString(formData, "tanggalSelesai"),
      };

      if (selectedFiles.length > uploadRule.maxFiles) {
        const message = `Maksimal ${uploadRule.maxFiles} file lampiran.`;

        setError(message);
        setFieldErrors({
          attachments: message,
        });
        return;
      }

      if (selectedFiles.length < (uploadRule.minFiles ?? 0)) {
        setError("Lampiran wajib diunggah.");
        setFieldErrors({
          attachments: "Lampiran wajib diunggah.",
        });
        return;
      }

      const invalidMessage = selectedFiles
        .map((file) => validateAttachmentFile(file, uploadRule))
        .find((message) => message);

      if (invalidMessage) {
        setAttachmentValidationError(invalidMessage);
        return;
      }

      const requestBody = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        requestBody.append(key, value);
      });
      selectedFiles.forEach((file) => {
        requestBody.append("attachments", file);
      });

      const response = await fetch(`/api/services/${serviceSlug}/requests`, {
        method: "POST",
        body: requestBody,
      });

      const body = (await response.json().catch(() => null)) as {
        data?: CreateServiceRequestResult;
        error?: string;
        issues?: ApiIssue[];
      } | null;

      if (!response.ok || !body?.data) {
        const issues = body?.issues ?? [];
        const nextFieldErrors = Object.fromEntries(
          issues.map((issue) => [issue.field, issue.message])
        );

        setFieldErrors(nextFieldErrors);
        setError(
          issues[0]?.message ??
            body?.error ??
            "Pengajuan layanan gagal dikirim."
        );
        return;
      }

      form.reset();
      setSelectedFiles([]);
      setResult(body.data);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <div data-testid="request-success" className="grid gap-4 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-6">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EE1C25]/10">
            <svg className="size-5 text-[#EE1C25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-black text-[#18130E]">Pengajuan Berhasil!</p>
            <p className="mt-1 text-sm text-[#7A6A5C]">
              Nomor pengajuan: <span className="font-medium text-[#18130E]">{result.id}</span>
            </p>
            <p className="text-sm text-[#7A6A5C]">Status awal: Menunggu Proses</p>
            {result.attachmentCount ? (
              <p className="mt-1 text-sm text-[#7A6A5C]">
                Lampiran tersimpan: {result.attachmentCount} file
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild className="bg-[#EE1C25] hover:bg-[#EE1C25]/90">
            <Link href="/mahasiswa/riwayat">Lihat Riwayat Pengajuan</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#DDD5C3] hover:border-[#EE1C25]/40 hover:text-[#EE1C25]">
            <Link href={`/layanan/${serviceSlug}`}>
              Kembali ke Detail Layanan
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#DDD5C3] hover:border-[#EE1C25]/40 hover:text-[#EE1C25]">
            <Link href="/layanan">Ajukan Layanan Lain</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isScholarshipService = serviceSlug === "rekomendasi-beasiswa";
  const scholarshipTemplateLink = templateLinks?.scholarshipRecommendation;
  const needsAcademicFields = [
    "ket-tunjangan-orang-tua",
    "keterangan-masih-kuliah",
  ].includes(serviceSlug);
  const needsParentFields = serviceSlug === "ket-tunjangan-orang-tua";
  const isSuratPengantar = serviceSlug === "surat-pengantar";
  const isKeteranganLulus = serviceSlug === "keterangan-lulus";
  const isIjazah = serviceSlug === "penerbitan-ijazah";
  const isTranskrip = serviceSlug === "penerbitan-transkrip";
  const isLegalisir = serviceSlug === "legalisir-ijazah-transkrip";
  const isMagang = serviceSlug === "permohonan-magang-kerja-praktek-ta";
  const isRequiredUpload = Boolean(uploadRule.minFiles);
  const uploadHelperText = isRequiredUpload
    ? isScholarshipService
      ? "Dokumen pendukung wajib diunggah. Gunakan template Google Docs, isi dokumen, lalu unggah file yang sudah dilengkapi."
      : uploadRule.description
    : "Lampiran dokumen pendukung bersifat opsional.";
  const showDescription =
    !isSuratPengantar &&
    !isKeteranganLulus &&
    !isIjazah &&
    !isTranskrip &&
    !isMagang;

  // Custom input class with red border - lebih subtle
  const inputClass = "border-[#DDD5C3] focus:border-[#EE1C25] focus:ring-[#EE1C25]/20 rounded-xl";
  const textareaClass = "border-[#DDD5C3] focus:border-[#EE1C25] focus:ring-[#EE1C25]/20 rounded-xl";

  return (
    <form className="grid gap-5" onSubmit={handleSubmit} data-testid="service-request-form" id="service-request-form">
      {isMagang ? (
        <div className="grid gap-4 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5">
          <div className="flex gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EE1C25]/10 text-sm font-bold text-[#EE1C25]">
              1
            </div>
            <div>
              <p className="text-sm font-semibold text-[#18130E]">
                Siapkan Surat Permohonan dari Program Studi
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#7A6A5C]">
                Sebelum mengisi formulir ini, mahasiswa perlu mengajukan atau
                menyiapkan surat permohonan dari program studi masing-masing
                terlebih dahulu. Surat tersebut akan diunggah pada tahap
                pengajuan layanan.
              </p>
              <ul className="mt-3 grid gap-1.5 text-sm text-[#7A6A5C]">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#EE1C25]" />
                  Surat berasal dari program studi.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#EE1C25]" />
                  File yang diunggah harus PDF.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#EE1C25]" />
                  Maksimal 5 file, masing-masing 10 MB.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#EE1C25]" />
                  Pastikan data instansi dan periode pelaksanaan sudah benar.
                </li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3 border-t border-[#DDD5C3]/50 pt-4">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#EE1C25]/10 text-sm font-bold text-[#EE1C25]">
              2
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#18130E]">
                Isi Form Permohonan Magang/Kerja Praktek/Tugas Akhir
              </p>
              <p className="mt-1 text-sm text-[#7A6A5C]">
                Setelah surat dari prodi tersedia, lengkapi form di bawah ini.
                Data pengajuan akan tersimpan langsung ke database layanan
                Magang/Kerja Praktek/Tugas Akhir.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#7A6A5C]">
                Field bertanda <span className="font-semibold text-[#EE1C25]">*</span> wajib diisi.
                Nama dan prodi mahasiswa akan dibaca dari data akademik berdasarkan NPM.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div id={isMagang ? "magang-form-fields" : undefined} className="grid gap-5">
      {isScholarshipService ? (
        <div className="grid gap-3 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5">
          <div>
            <p className="text-sm font-semibold text-[#18130E]">
              Template Surat Rekomendasi Beasiswa
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#7A6A5C]">
              Unduh atau salin template dari Google Docs, isi sesuai kebutuhan,
              lalu unggah dokumen yang sudah dilengkapi pada bagian Dokumen
              Pendukung.
            </p>
          </div>
          {scholarshipTemplateLink?.isActive ? (
            <Button
              asChild
              type="button"
              className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90 sm:w-fit"
            >
              <a
                href={scholarshipTemplateLink.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka Template Rekomendasi Beasiswa
              </a>
            </Button>
          ) : (
            <p className="rounded-xl border border-[#DDD5C3] bg-[#F7F3EA]/30 px-4 py-3 text-sm text-[#7A6A5C]">
              Link template Rekomendasi Beasiswa sedang nonaktif. Silakan hubungi ULT FMIPA.
            </p>
          )}
        </div>
      ) : null}

      {/* NPM */}
      <div className="grid gap-1.5">
        <FieldLabel htmlFor="npm" required>NPM</FieldLabel>
        <Input
          id="npm"
          name="npm"
          minLength={8}
          maxLength={15}
          defaultValue={defaultValues?.npm ?? ""}
          required
          className={inputClass}
        />
        {fieldErrors.npm ? (
          <p className="text-sm text-[#EE1C25]">{fieldErrors.npm}</p>
        ) : null}
        {isMagang ? (
          <FieldHint>
            Nama mahasiswa akan mengikuti data akademik yang terhubung dengan NPM ini.
          </FieldHint>
        ) : null}
      </div>

      {/* Program Studi (Magang) */}
      {isMagang ? (
        <div className="grid gap-1.5">
          <FieldLabel htmlFor="programStudi" required>Program Studi</FieldLabel>
          <select
            id="programStudi"
            name="programStudi"
            required
            className={`${inputClass} h-10 rounded-xl border bg-white px-3 py-2 text-sm outline-none`}
          >
            <option value="">Pilih program studi</option>
            {programStudiOptions.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
          {fieldErrors.programStudi ? (
            <p className="text-sm text-[#EE1C25]">
              {fieldErrors.programStudi}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Email & Bahasa Surat */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <FieldLabel htmlFor="email" required>Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={150}
            defaultValue={defaultValues?.email ?? ""}
            required
            className={inputClass}
          />
          {fieldErrors.email ? (
            <p className="text-sm text-[#EE1C25]">{fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <FieldLabel htmlFor="bahasaSurat" required>Bahasa Surat</FieldLabel>
          <select
            id="bahasaSurat"
            name="bahasaSurat"
            defaultValue="id"
            required
            className={`${inputClass} h-10 rounded-xl border bg-white px-3 py-2 text-sm outline-none`}
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">Bahasa Inggris</option>
          </select>
          {fieldErrors.bahasaSurat ? (
            <p className="text-sm text-[#EE1C25]">
              {fieldErrors.bahasaSurat}
            </p>
          ) : null}
        </div>
      </div>

      {/* Phone */}
      <div className="grid gap-1.5">
        <FieldLabel htmlFor="phone" required>No HP/WhatsApp</FieldLabel>
        <Input
          id="phone"
          name="phone"
          maxLength={30}
          defaultValue={defaultValues?.phone ?? ""}
          required
          className={inputClass}
        />
        {fieldErrors.phone ? (
          <p className="text-sm text-[#EE1C25]">{fieldErrors.phone}</p>
        ) : null}
      </div>

      {/* Nama Beasiswa */}
      {isScholarshipService ? (
        <div className="grid gap-1.5">
          <FieldLabel htmlFor="scholarshipName" required>Nama Beasiswa</FieldLabel>
          <Input id="scholarshipName" name="scholarshipName" maxLength={100} required className={inputClass} />
          {fieldErrors.scholarshipName ? (
            <p className="text-sm text-[#EE1C25]">
              {fieldErrors.scholarshipName}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Semester & Tahun Akademik */}
      {needsAcademicFields ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="semester" required>Semester</FieldLabel>
            <Input id="semester" name="semester" maxLength={25} data-testid="request-semester" required className={inputClass} />
            {fieldErrors.semester ? (
              <p className="text-sm text-[#EE1C25]">
                {fieldErrors.semester}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="tahunAkademik" required>Tahun Akademik</FieldLabel>
            <Input id="tahunAkademik" name="tahunAkademik" maxLength={10} data-testid="request-tahun-akademik" required className={inputClass} />
            {fieldErrors.tahunAkademik ? (
              <p className="text-sm text-[#EE1C25]">
                {fieldErrors.tahunAkademik}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Data Orang Tua */}
      {needsParentFields ? (
        <div className="grid gap-4 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5">
          <p className="text-sm font-semibold text-[#18130E]">Data Orang Tua</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="namaOrangTua" required>Nama Orang Tua</FieldLabel>
              <Input id="namaOrangTua" name="namaOrangTua" maxLength={100} required className={inputClass} />
              {fieldErrors.namaOrangTua ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.namaOrangTua}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="nipNrp" required>NIP/NRP</FieldLabel>
              <Input id="nipNrp" name="nipNrp" maxLength={100} required className={inputClass} />
              {fieldErrors.nipNrp ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.nipNrp}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="pangkatGolongan" required>Pangkat/Golongan</FieldLabel>
              <Input
                id="pangkatGolongan"
                name="pangkatGolongan"
                maxLength={100}
                required
                className={inputClass}
              />
              {fieldErrors.pangkatGolongan ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.pangkatGolongan}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="instansi" required>Instansi</FieldLabel>
              <Input id="instansi" name="instansi" maxLength={100} required className={inputClass} />
              {fieldErrors.instansi ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.instansi}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Surat Pengantar */}
      {isSuratPengantar ? (
        <div className="grid gap-4 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5">
          <p className="text-sm font-semibold text-[#18130E]">Data Surat Pengantar</p>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="pengantar" required>Pengantar</FieldLabel>
            <Textarea id="pengantar" name="pengantar" maxLength={150} required className={textareaClass} />
            {fieldErrors.pengantar ? (
              <p className="text-sm text-[#EE1C25]">
                {fieldErrors.pengantar}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="ditujukan" required>Ditujukan</FieldLabel>
            <Input id="ditujukan" name="ditujukan" maxLength={150} required className={inputClass} />
            {fieldErrors.ditujukan ? (
              <p className="text-sm text-[#EE1C25]">
                {fieldErrors.ditujukan}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="dasarSuratNo" required>No. Dasar Surat</FieldLabel>
              <Input id="dasarSuratNo" name="dasarSuratNo" maxLength={30} required className={inputClass} />
              {fieldErrors.dasarSuratNo ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.dasarSuratNo}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="dasarSuratPerihal" required>Perihal</FieldLabel>
              <Input
                id="dasarSuratPerihal"
                name="dasarSuratPerihal"
                maxLength={100}
                required
                className={inputClass}
              />
              {fieldErrors.dasarSuratPerihal ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.dasarSuratPerihal}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="dasarSuratTgl" required>Tanggal Dasar Surat</FieldLabel>
              <Input id="dasarSuratTgl" name="dasarSuratTgl" type="date" required className={inputClass} />
              {fieldErrors.dasarSuratTgl ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.dasarSuratTgl}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Data Kelulusan */}
      {isKeteranganLulus || isIjazah || isTranskrip ? (
        <div className="grid gap-4 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5">
          <p className="text-sm font-semibold text-[#18130E]">Data Kelulusan</p>
          {isKeteranganLulus ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="tempatLahir" required>Tempat Lahir</FieldLabel>
                <Input id="tempatLahir" name="tempatLahir" maxLength={100} required className={inputClass} />
                {fieldErrors.tempatLahir ? (
                  <p className="text-sm text-[#EE1C25]">
                    {fieldErrors.tempatLahir}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="tanggalLahir" required>Tanggal Lahir</FieldLabel>
                <Input id="tanggalLahir" name="tanggalLahir" type="date" required className={inputClass} />
                {fieldErrors.tanggalLahir ? (
                  <p className="text-sm text-[#EE1C25]">
                    {fieldErrors.tanggalLahir}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="tanggalLulus" required>Tanggal Lulus</FieldLabel>
              <Input id="tanggalLulus" name="tanggalLulus" type="date" required className={inputClass} />
              {fieldErrors.tanggalLulus ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.tanggalLulus}
                </p>
              ) : null}
            </div>
            {isKeteranganLulus ? (
              <>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="ipk" required>IPK</FieldLabel>
                  <Input id="ipk" name="ipk" maxLength={5} required className={inputClass} />
                  {fieldErrors.ipk ? (
                    <p className="text-sm text-[#EE1C25]">
                      {fieldErrors.ipk}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="yudisium" required>Yudisium</FieldLabel>
                  <select
                    id="yudisium"
                    name="yudisium"
                    required
                    className={`${inputClass} h-10 rounded-xl border bg-white px-3 py-2 text-sm outline-none`}
                    defaultValue=""
                  >
                    <option value="">Pilih Yudisium</option>
                    {YUDISIUM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.yudisium ? (
                    <p className="text-sm text-[#EE1C25]">
                      {fieldErrors.yudisium}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}


      {/* Legalisir */}
      {isLegalisir ? (
        <div className="grid gap-4 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5">
          <p className="text-sm font-semibold text-[#18130E]">Jumlah Dokumen</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="jumlahTranskrip" required>Transkrip</FieldLabel>
              <Input
                id="jumlahTranskrip"
                name="jumlahTranskrip"
                type="number"
                min={1}
                defaultValue={1}
                required
                className={inputClass}
              />
              {fieldErrors.jumlahTranskrip ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.jumlahTranskrip}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="jumlahIjazah" required>Ijazah</FieldLabel>
              <Input
                id="jumlahIjazah"
                name="jumlahIjazah"
                type="number"
                min={1}
                defaultValue={1}
                required
                className={inputClass}
              />
              {fieldErrors.jumlahIjazah ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.jumlahIjazah}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="jumlahTranslet" required>Terjemahan</FieldLabel>
              <Input
                id="jumlahTranslet"
                name="jumlahTranslet"
                type="number"
                min={1}
                defaultValue={1}
                required
                className={inputClass}
              />
              {fieldErrors.jumlahTranslet ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.jumlahTranslet}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Magang */}
      {isMagang ? (
        <div className="grid gap-4 rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5">
          <p className="text-sm font-semibold text-[#18130E]">
            Data Permohonan Magang
          </p>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="jenisPermohonan" required>Perihal</FieldLabel>
            <select
              id="jenisPermohonan"
              name="jenisPermohonan"
              required
              className={`${inputClass} h-10 rounded-xl border bg-white px-3 py-2 text-sm outline-none`}
            >
              <option value="">Pilih jenis permohonan</option>
              {magangJenisPermohonan.map((jenis) => (
                <option key={jenis} value={jenis}>
                  {jenis}
                </option>
              ))}
            </select>
            {fieldErrors.jenisPermohonan ? (
              <p className="text-sm text-[#EE1C25]">
                {fieldErrors.jenisPermohonan}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="kontakPerson" optional>Kontak Person</FieldLabel>
              <FieldHint className="sm:min-h-[2.25rem]">
                Jika ada, tuliskan lengkap nama dan jabatannya.
              </FieldHint>
              <Input
                id="kontakPerson"
                name="kontakPerson"
                maxLength={150}
                placeholder="Contoh: Budi Santoso, HRD PT. Telkom Indonesia Tbk."
                className={inputClass}
              />
              {fieldErrors.kontakPerson ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.kontakPerson}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="tempatPelaksanaan" required>Tempat Pelaksanaan</FieldLabel>
              <FieldHint className="sm:min-h-[2.25rem]">
                Contoh: Dinas Pendapatan Daerah (DPD) atau PT. Telkom Indonesia Tbk.
              </FieldHint>
              <Input
                id="tempatPelaksanaan"
                name="tempatPelaksanaan"
                maxLength={200}
                required
                placeholder="Contoh: PT. Telkom Indonesia Tbk."
                className={inputClass}
              />
              {fieldErrors.tempatPelaksanaan ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.tempatPelaksanaan}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="tujuanSurat" required>Tujuan Surat</FieldLabel>
            <FieldHint>
              Diisi jabatan dari instansi yang dituju, misalnya Kepala Dinas Pendapatan Daerah,
              Direktur PT. PLN Persero, atau HRD PT. ...
            </FieldHint>
            <Input
              id="tujuanSurat"
              name="tujuanSurat"
              maxLength={200}
              required
              placeholder="Contoh: HRD PT. Telkom Indonesia Tbk."
              className={inputClass}
            />
            {fieldErrors.tujuanSurat ? (
              <p className="text-sm text-[#EE1C25]">
                {fieldErrors.tujuanSurat}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="alamatSurat" required>Alamat Surat</FieldLabel>
            <FieldHint>
              Diisi secara singkat. Contoh: Jl. Ir. H. Djuanda No. 35
            </FieldHint>
            <Textarea
              id="alamatSurat"
              name="alamatSurat"
              maxLength={255}
              required
              placeholder="Contoh: Jl. Ir. H. Djuanda No. 35"
              className={textareaClass}
            />
            {fieldErrors.alamatSurat ? (
              <p className="text-sm text-[#EE1C25]">
                {fieldErrors.alamatSurat}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="kecamatanKabupaten" required>Kecamatan dan Kabupaten</FieldLabel>
              <FieldHint>
                Contoh: Kecamatan Cibeunying Kaler
              </FieldHint>
              <Input
                id="kecamatanKabupaten"
                name="kecamatanKabupaten"
                maxLength={150}
                required
                placeholder="Contoh: Kecamatan Cibeunying Kaler"
                className={inputClass}
              />
              {fieldErrors.kecamatanKabupaten ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.kecamatanKabupaten}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="kotaKabupaten" required>Kota / Kabupaten</FieldLabel>
              <FieldHint>
                Contoh: Kota Bandung atau Kabupaten Bandung
              </FieldHint>
              <Input
                id="kotaKabupaten"
                name="kotaKabupaten"
                maxLength={100}
                required
                placeholder="Contoh: Kota Bandung"
                className={inputClass}
              />
              {fieldErrors.kotaKabupaten ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.kotaKabupaten}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="provinsi" optional>Provinsi</FieldLabel>
              <FieldHint>
                Boleh diisi atau tidak. Contoh: Jawa Barat
              </FieldHint>
              <Input
                id="provinsi"
                name="provinsi"
                maxLength={100}
                placeholder="Contoh: Jawa Barat"
                className={inputClass}
              />
              {fieldErrors.provinsi ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.provinsi}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="tanggalMulai" required>Tanggal Mulai</FieldLabel>
              <Input id="tanggalMulai" name="tanggalMulai" type="date" required className={inputClass} />
              {fieldErrors.tanggalMulai ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.tanggalMulai}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="tanggalSelesai" required>Tanggal Selesai</FieldLabel>
              <Input id="tanggalSelesai" name="tanggalSelesai" type="date" required className={inputClass} />
              {fieldErrors.tanggalSelesai ? (
                <p className="text-sm text-[#EE1C25]">
                  {fieldErrors.tanggalSelesai}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Description */}
      {showDescription ? (
        <div className="grid gap-1.5">
          <FieldLabel htmlFor="description" required>Keterangan/Keperluan</FieldLabel>
          <Textarea id="description" name="description" maxLength={100} required data-testid="request-description" className={textareaClass} />
          {fieldErrors.description ? (
            <p className="text-sm text-[#EE1C25]">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Attachments */}
      <div className="grid gap-2">
        <Label htmlFor="attachments" className="inline-flex items-center gap-2 text-sm font-medium text-[#18130E]">
          {isMagang ? "Upload Surat Permohonan Dari Program Studi" : "Lampiran Dokumen Pendukung"}
          {isRequiredUpload ? (
            <>
              <RequiredMark />
              <span className="text-xs font-semibold text-[#EE1C25]">Wajib</span>
            </>
          ) : (
            <OptionalMark />
          )}
        </Label>
        <div className="relative">
          <Input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={acceptAttribute}
            aria-required={isRequiredUpload}
            onChange={handleAttachmentChange}
            className="border-[#DDD5C3] focus:border-[#EE1C25] focus:ring-[#EE1C25]/20 rounded-xl flex items-center file:inline-flex file:items-center file:justify-center file:bg-[#EE1C25] file:text-white file:border-0 file:px-4 file:h-9 file:rounded-xl file:hover:bg-[#EE1C25]/90 file:cursor-pointer file:mr-4 h-12"
          />
        </div>
        <p className="text-sm text-[#7A6A5C]">
          {uploadHelperText}
        </p>
        <div className="grid gap-2 rounded-xl border-2 border-[#DDD5C3] bg-white/50 px-4 py-3">
          <p className="text-sm font-medium text-[#18130E]">
            {selectedFiles.length} dari {uploadRule.maxFiles} file dipilih
          </p>
          {selectedFiles.length > 0 ? (
            <ul className="grid gap-1.5">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#DDD5C3]/50 bg-white/30 px-3 py-2 text-sm text-[#6B5E52]"
                >
                  <span className="min-w-0 flex-1 break-all">
                    {file.name}
                  </span>
                  <span className="text-xs font-medium text-[#7A6A5C]">{formatFileSizeMb(file.size)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#EE1C25]/30 text-[#EE1C25] hover:bg-[#EE1C25]/10 hover:border-[#EE1C25] rounded-xl"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    Hapus
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {fieldErrors.attachments ? (
          <p className="text-sm text-[#EE1C25]">
            {fieldErrors.attachments}
          </p>
        ) : null}
      </div>

      {/* Error Message */}
      {error ? (
        <div className="rounded-xl border border-[#EE1C25]/30 bg-[#EE1C25]/5 px-4 py-3">
          <p className="text-sm text-[#EE1C25]">{error}</p>
        </div>
      ) : null}

      {/* Info */}
      <div className="rounded-xl border-2 border-[#DDD5C3] bg-white/50 px-4 py-3">
        <p className="text-sm text-[#7A6A5C]">
          Anda sedang mengajukan layanan sebagai mahasiswa development. Pada tahap
          berikutnya, data akan diambil dari PAUS OAuth.
        </p>
      </div>

      {/* Buttons */}
      <div className="grid gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          data-testid="service-request-submit"
          className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90 rounded-xl shadow-lg shadow-[#EE1C25]/20 h-12 text-base font-semibold"
        >
          {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-full border-[#DDD5C3] text-[#6B5E52] hover:border-[#EE1C25]/40 hover:text-[#EE1C25] rounded-xl h-11"
        >
          <Link href={`/layanan/${serviceSlug}`}>Kembali</Link>
        </Button>
      </div>
      </div>
    </form>
  );
}