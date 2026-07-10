"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getServiceUploadRule, type ServiceUploadRule } from "@/lib/service-upload-config";
import type { CreateServiceRequestResult } from "@/types/submission";

type ServiceRequestFormProps = {
  serviceSlug: string;
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
  "Magang",
  "Kerja Praktek",
  "Tugas Akhir (TA)",
];

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
      <div data-testid="request-success" className="grid gap-4 rounded-lg border bg-muted/30 p-4">
        <div>
          <p className="font-medium">Pengajuan layanan berhasil dikirim.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nomor pengajuan: {result.id}. Status awal: Menunggu Proses.
          </p>
          {result.attachmentCount ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Lampiran tersimpan: {result.attachmentCount} file.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/mahasiswa/riwayat">Lihat Riwayat Pengajuan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/layanan/${serviceSlug}`}>
              Kembali ke Detail Layanan
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isScholarshipService = serviceSlug === "rekomendasi-beasiswa";
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
  const isUnggahKaryaIlmiah = serviceSlug === "unggah-karya-ilmiah";
  const isMagang = serviceSlug === "permohonan-magang-kerja-praktek-ta";
  const showDescription =
    !isSuratPengantar &&
    !isKeteranganLulus &&
    !isIjazah &&
    !isTranskrip &&
    !isMagang;

  // Custom input class with red border
  const inputClass = "border-[#EE1C25]/40 focus:border-[#EE1C25] focus:ring-[#EE1C25]/20";
  const textareaClass = "border-[#EE1C25]/40 focus:border-[#EE1C25] focus:ring-[#EE1C25]/20";

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} data-testid="service-request-form" id="service-request-form">
      {isMagang ? (
        <div className="grid gap-4 rounded-lg border border-[#E7DED0] bg-[#FFFDF9] p-4">
          <div className="flex gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full border border-[#EE1C25]/25 bg-[#FFF3F3] text-sm font-semibold text-[#EE1C25]">
              1
            </div>
            <div>
              <p className="text-sm font-semibold text-[#18130E]">
                Siapkan Surat Permohonan dari Program Studi
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#6B5E52]">
                Sebelum mengisi formulir ini, mahasiswa perlu mengajukan atau
                menyiapkan surat permohonan dari program studi masing-masing
                terlebih dahulu. Surat tersebut akan diunggah pada tahap
                pengajuan layanan.
              </p>
              <ul className="mt-3 grid gap-1.5 text-sm text-[#6B5E52]">
                <li>Surat berasal dari program studi.</li>
                <li>File yang diunggah harus PDF.</li>
                <li>Maksimal 5 file, masing-masing 10 MB.</li>
                <li>
                  Pastikan data instansi dan periode pelaksanaan sudah benar.
                </li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3 border-t border-[#EFE7DB] pt-4">
            <div className="grid size-8 shrink-0 place-items-center rounded-full border border-[#EE1C25]/25 bg-[#FFF3F3] text-sm font-semibold text-[#EE1C25]">
              2
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#18130E]">
                Isi Form Permohonan Magang/Kerja Praktek/Tugas Akhir
              </p>
              <p className="mt-1 text-sm text-[#6B5E52]">
                Setelah surat dari prodi tersedia, lengkapi form di bawah ini.
                Data pengajuan akan tersimpan langsung ke database layanan
                Magang/Kerja Praktek/Tugas Akhir.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div id={isMagang ? "magang-form-fields" : undefined} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="npm" className="text-[#18130E] font-medium">NPM</Label>
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
          <p className="text-sm text-destructive">{fieldErrors.npm}</p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-[#18130E] font-medium">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            className={inputClass}
          />
          {fieldErrors.email ? (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone" className="text-[#18130E] font-medium">No HP/WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            maxLength={30}
            defaultValue={defaultValues?.phone ?? ""}
            className={inputClass}
          />
          {fieldErrors.phone ? (
            <p className="text-sm text-destructive">{fieldErrors.phone}</p>
          ) : null}
        </div>
      </div>

      {isScholarshipService ? (
        <div className="grid gap-2">
          <Label htmlFor="scholarshipName" className="text-[#18130E] font-medium">Nama Beasiswa</Label>
          <Input id="scholarshipName" name="scholarshipName" maxLength={100} className={inputClass} />
          {fieldErrors.scholarshipName ? (
            <p className="text-sm text-destructive">
              {fieldErrors.scholarshipName}
            </p>
          ) : null}
        </div>
      ) : null}

      {needsAcademicFields ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="semester" className="text-[#18130E] font-medium">Semester</Label>
            <Input id="semester" name="semester" maxLength={25} data-testid="request-semester" className={inputClass} />
            {fieldErrors.semester ? (
              <p className="text-sm text-destructive">
                {fieldErrors.semester}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tahunAkademik" className="text-[#18130E] font-medium">Tahun Akademik</Label>
            <Input id="tahunAkademik" name="tahunAkademik" maxLength={10} data-testid="request-tahun-akademik" className={inputClass} />
            {fieldErrors.tahunAkademik ? (
              <p className="text-sm text-destructive">
                {fieldErrors.tahunAkademik}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {needsParentFields ? (
        <div className="grid gap-4 rounded-lg border border-[#EE1C25]/40 p-4">
          <p className="text-sm font-medium text-[#18130E]">Data Orang Tua</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="namaOrangTua" className="text-[#18130E] font-medium">Nama Orang Tua</Label>
              <Input id="namaOrangTua" name="namaOrangTua" maxLength={100} className={inputClass} />
              {fieldErrors.namaOrangTua ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.namaOrangTua}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nipNrp" className="text-[#18130E] font-medium">NIP/NRP</Label>
              <Input id="nipNrp" name="nipNrp" maxLength={100} className={inputClass} />
              {fieldErrors.nipNrp ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.nipNrp}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pangkatGolongan" className="text-[#18130E] font-medium">Pangkat/Golongan</Label>
              <Input
                id="pangkatGolongan"
                name="pangkatGolongan"
                maxLength={100}
                className={inputClass}
              />
              {fieldErrors.pangkatGolongan ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.pangkatGolongan}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instansi" className="text-[#18130E] font-medium">Instansi</Label>
              <Input id="instansi" name="instansi" maxLength={100} className={inputClass} />
              {fieldErrors.instansi ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.instansi}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isSuratPengantar ? (
        <div className="grid gap-4 rounded-lg border border-[#EE1C25]/40 p-4">
          <p className="text-sm font-medium text-[#18130E]">Data Surat Pengantar</p>
          <div className="grid gap-2">
            <Label htmlFor="pengantar" className="text-[#18130E] font-medium">Pengantar</Label>
            <Textarea id="pengantar" name="pengantar" maxLength={150} className={textareaClass} />
            {fieldErrors.pengantar ? (
              <p className="text-sm text-destructive">
                {fieldErrors.pengantar}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ditujukan" className="text-[#18130E] font-medium">Ditujukan</Label>
            <Input id="ditujukan" name="ditujukan" maxLength={150} className={inputClass} />
            {fieldErrors.ditujukan ? (
              <p className="text-sm text-destructive">
                {fieldErrors.ditujukan}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratNo" className="text-[#18130E] font-medium">No. Dasar Surat</Label>
              <Input id="dasarSuratNo" name="dasarSuratNo" maxLength={30} className={inputClass} />
              {fieldErrors.dasarSuratNo ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratNo}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratPerihal" className="text-[#18130E] font-medium">Perihal</Label>
              <Input
                id="dasarSuratPerihal"
                name="dasarSuratPerihal"
                maxLength={100}
                className={inputClass}
              />
              {fieldErrors.dasarSuratPerihal ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratPerihal}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratTgl" className="text-[#18130E] font-medium">Tanggal Dasar Surat</Label>
              <Input id="dasarSuratTgl" name="dasarSuratTgl" type="date" className={inputClass} />
              {fieldErrors.dasarSuratTgl ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratTgl}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isKeteranganLulus || isIjazah || isTranskrip ? (
        <div className="grid gap-4 rounded-lg border border-[#EE1C25]/40 p-4">
          <p className="text-sm font-medium text-[#18130E]">Data Kelulusan</p>
          {isKeteranganLulus ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tempatLahir" className="text-[#18130E] font-medium">Tempat Lahir</Label>
                <Input id="tempatLahir" name="tempatLahir" maxLength={100} className={inputClass} />
                {fieldErrors.tempatLahir ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.tempatLahir}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tanggalLahir" className="text-[#18130E] font-medium">Tanggal Lahir</Label>
                <Input id="tanggalLahir" name="tanggalLahir" type="date" className={inputClass} />
                {fieldErrors.tanggalLahir ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.tanggalLahir}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="tanggalLulus" className="text-[#18130E] font-medium">Tanggal Lulus</Label>
              <Input id="tanggalLulus" name="tanggalLulus" type="date" className={inputClass} />
              {fieldErrors.tanggalLulus ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.tanggalLulus}
                </p>
              ) : null}
            </div>
            {isKeteranganLulus ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="ipk" className="text-[#18130E] font-medium">IPK</Label>
                  <Input id="ipk" name="ipk" maxLength={5} className={inputClass} />
                  {fieldErrors.ipk ? (
                    <p className="text-sm text-destructive">
                      {fieldErrors.ipk}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yudisium" className="text-[#18130E] font-medium">Yudisium</Label>
                  <Input id="yudisium" name="yudisium" maxLength={25} className={inputClass} />
                  {fieldErrors.yudisium ? (
                    <p className="text-sm text-destructive">
                      {fieldErrors.yudisium}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {isUnggahKaryaIlmiah ? (
        <p className="rounded-md border border-[#EE1C25]/40 px-3 py-2 text-sm text-[#7A6A5C]">
          Unggah file karya ilmiah akan ditambahkan pada tahap berikutnya.
        </p>
      ) : null}

      {isLegalisir ? (
        <div className="grid gap-4 rounded-lg border border-[#EE1C25]/40 p-4">
          <p className="text-sm font-medium text-[#18130E]">Jumlah Dokumen</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="jumlahTranskrip" className="text-[#18130E] font-medium">Transkrip</Label>
              <Input
                id="jumlahTranskrip"
                name="jumlahTranskrip"
                type="number"
                min={1}
                defaultValue={1}
                className={inputClass}
              />
              {fieldErrors.jumlahTranskrip ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahTranskrip}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jumlahIjazah" className="text-[#18130E] font-medium">Ijazah</Label>
              <Input
                id="jumlahIjazah"
                name="jumlahIjazah"
                type="number"
                min={1}
                defaultValue={1}
                className={inputClass}
              />
              {fieldErrors.jumlahIjazah ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahIjazah}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jumlahTranslet" className="text-[#18130E] font-medium">Terjemahan</Label>
              <Input
                id="jumlahTranslet"
                name="jumlahTranslet"
                type="number"
                min={1}
                defaultValue={1}
                className={inputClass}
              />
              {fieldErrors.jumlahTranslet ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahTranslet}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isMagang ? (
        <div className="grid gap-4 rounded-lg border border-[#EE1C25]/40 p-4">
          <p className="text-sm font-medium text-[#18130E]">
            Data Permohonan Magang
          </p>
          <div className="grid gap-2">
            <Label htmlFor="jenisPermohonan" className="text-[#18130E] font-medium">
              Jenis Permohonan
            </Label>
            <select
              id="jenisPermohonan"
              name="jenisPermohonan"
              required
              className={`${inputClass} h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none`}
            >
              <option value="">Pilih jenis permohonan</option>
              {magangJenisPermohonan.map((jenis) => (
                <option key={jenis} value={jenis}>
                  {jenis}
                </option>
              ))}
            </select>
            {fieldErrors.jenisPermohonan ? (
              <p className="text-sm text-destructive">
                {fieldErrors.jenisPermohonan}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="kontakPerson" className="text-[#18130E] font-medium">
                Kontak Person
              </Label>
              <Input id="kontakPerson" name="kontakPerson" maxLength={150} className={inputClass} />
              {fieldErrors.kontakPerson ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.kontakPerson}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tempatPelaksanaan" className="text-[#18130E] font-medium">
                Tempat Pelaksanaan
              </Label>
              <Input id="tempatPelaksanaan" name="tempatPelaksanaan" maxLength={200} required className={inputClass} />
              {fieldErrors.tempatPelaksanaan ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.tempatPelaksanaan}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tujuanSurat" className="text-[#18130E] font-medium">
              Tujuan Surat
            </Label>
            <Input id="tujuanSurat" name="tujuanSurat" maxLength={200} required className={inputClass} />
            {fieldErrors.tujuanSurat ? (
              <p className="text-sm text-destructive">
                {fieldErrors.tujuanSurat}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="alamatSurat" className="text-[#18130E] font-medium">
              Alamat Surat
            </Label>
            <Textarea id="alamatSurat" name="alamatSurat" maxLength={255} required className={textareaClass} />
            {fieldErrors.alamatSurat ? (
              <p className="text-sm text-destructive">
                {fieldErrors.alamatSurat}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="kecamatanKabupaten" className="text-[#18130E] font-medium">
                Kecamatan dan Kabupaten
              </Label>
              <Input id="kecamatanKabupaten" name="kecamatanKabupaten" maxLength={150} required className={inputClass} />
              {fieldErrors.kecamatanKabupaten ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.kecamatanKabupaten}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kotaKabupaten" className="text-[#18130E] font-medium">
                Kota / Kabupaten
              </Label>
              <Input id="kotaKabupaten" name="kotaKabupaten" maxLength={100} required className={inputClass} />
              {fieldErrors.kotaKabupaten ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.kotaKabupaten}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provinsi" className="text-[#18130E] font-medium">
                Provinsi
              </Label>
              <Input id="provinsi" name="provinsi" maxLength={100} className={inputClass} />
              {fieldErrors.provinsi ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.provinsi}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tanggalMulai" className="text-[#18130E] font-medium">
                Tanggal Mulai
              </Label>
              <Input id="tanggalMulai" name="tanggalMulai" type="date" required className={inputClass} />
              {fieldErrors.tanggalMulai ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.tanggalMulai}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tanggalSelesai" className="text-[#18130E] font-medium">
                Tanggal Selesai
              </Label>
              <Input id="tanggalSelesai" name="tanggalSelesai" type="date" required className={inputClass} />
              {fieldErrors.tanggalSelesai ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.tanggalSelesai}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showDescription ? (
        <div className="grid gap-2">
          <Label htmlFor="description" className="text-[#18130E] font-medium">Keterangan/Keperluan</Label>
          <Textarea id="description" name="description" maxLength={100} data-testid="request-description" className={textareaClass} />
          {fieldErrors.description ? (
            <p className="text-sm text-destructive">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="attachments" className="text-[#18130E] font-medium">Lampiran Dokumen Pendukung</Label>
        <div className="relative">
          <Input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={acceptAttribute}
            onChange={handleAttachmentChange}
            className="border-[#EE1C25]/40 focus:border-[#EE1C25] focus:ring-[#EE1C25]/20 flex items-center file:inline-flex file:items-center file:justify-center file:bg-[#EE1C25] file:text-white file:border-0 file:px-4 file:h-9 file:rounded-md file:hover:bg-[#EE1C25]/90 file:cursor-pointer file:mr-4 h-12"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {uploadRule.description}
        </p>
        <div className="grid gap-2 rounded-md border border-[#EE1C25]/40 px-3 py-2">
          <p className="text-sm font-medium text-[#18130E]">
            {selectedFiles.length} dari {uploadRule.maxFiles} file dipilih
          </p>
          {selectedFiles.length > 0 ? (
            <ul className="grid gap-1">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#6B5E52]"
                >
                  <span className="min-w-0 flex-1 break-all">
                    {file.name}
                  </span>
                  <span>{formatFileSizeMb(file.size)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#EE1C25]/30 text-[#EE1C25] hover:bg-[#EE1C25]/10"
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
          <p className="text-sm text-destructive">
            {fieldErrors.attachments}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <p className="rounded-md border border-[#EE1C25]/40 px-3 py-2 text-sm text-[#7A6A5C]">
        Anda sedang mengajukan layanan sebagai mahasiswa development. Pada tahap
        berikutnya, data akan diambil dari PAUS OAuth.
      </p>

      <Button 
        type="submit" 
        disabled={isSubmitting} 
        data-testid="service-request-submit"
        className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90 shadow-lg shadow-[#EE1C25]/20"
      >
        {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
      </Button>

      <Button
        asChild
        variant="outline"
        className="w-full border-[#DDD5C3] text-[#6B5E52] hover:border-[#EE1C25]/40 hover:text-[#EE1C25]"
      >
        <Link href={`/layanan/${serviceSlug}`}>Kembali</Link>
      </Button>
      </div>
    </form>
  );
}
