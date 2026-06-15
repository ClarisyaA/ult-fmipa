"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const maxAttachmentCount = 3;
const maxAttachmentSizeBytes = 5 * 1024 * 1024;
const supportedAttachmentMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const supportedAttachmentExtensions = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
]);

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

function validateAttachmentFile(file: File) {
  if (file.size > maxAttachmentSizeBytes) {
    return `File ${file.name} melebihi 5 MB.`;
  }

  if (
    !supportedAttachmentMimeTypes.has(file.type) ||
    !supportedAttachmentExtensions.has(getFileExtension(file.name))
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
      current === "Maksimal 3 file lampiran."
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
      .map(validateAttachmentFile)
      .find((message) => message);

    if (invalidMessage) {
      setAttachmentValidationError(invalidMessage);
      return;
    }

    if (selectedFiles.length + files.length > maxAttachmentCount) {
      setAttachmentValidationError("Maksimal 3 file lampiran.");
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
      };

      if (selectedFiles.length > maxAttachmentCount) {
        setError("Maksimal 3 file lampiran.");
        setFieldErrors({
          attachments: "Maksimal 3 file lampiran.",
        });
        return;
      }

      const invalidMessage = selectedFiles
        .map(validateAttachmentFile)
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
  const showDescription =
    !isSuratPengantar && !isKeteranganLulus && !isIjazah && !isTranskrip;

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} data-testid="service-request-form">
      <div className="grid gap-2">
        <Label htmlFor="npm">NPM</Label>
        <Input
          id="npm"
          name="npm"
          minLength={8}
          maxLength={15}
          defaultValue={defaultValues?.npm ?? ""}
          required
        />
        {fieldErrors.npm ? (
          <p className="text-sm text-destructive">{fieldErrors.npm}</p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
          />
          {fieldErrors.email ? (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">No HP/WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            maxLength={30}
            defaultValue={defaultValues?.phone ?? ""}
          />
          {fieldErrors.phone ? (
            <p className="text-sm text-destructive">{fieldErrors.phone}</p>
          ) : null}
        </div>
      </div>

      {isScholarshipService ? (
        <div className="grid gap-2">
          <Label htmlFor="scholarshipName">Nama Beasiswa</Label>
          <Input id="scholarshipName" name="scholarshipName" maxLength={100} />
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
            <Label htmlFor="semester">Semester</Label>
            <Input id="semester" name="semester" maxLength={25} data-testid="request-semester" />
            {fieldErrors.semester ? (
              <p className="text-sm text-destructive">
                {fieldErrors.semester}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tahunAkademik">Tahun Akademik</Label>
            <Input id="tahunAkademik" name="tahunAkademik" maxLength={10} data-testid="request-tahun-akademik" />
            {fieldErrors.tahunAkademik ? (
              <p className="text-sm text-destructive">
                {fieldErrors.tahunAkademik}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {needsParentFields ? (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Data Orang Tua</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="namaOrangTua">Nama Orang Tua</Label>
              <Input id="namaOrangTua" name="namaOrangTua" maxLength={100} />
              {fieldErrors.namaOrangTua ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.namaOrangTua}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nipNrp">NIP/NRP</Label>
              <Input id="nipNrp" name="nipNrp" maxLength={100} />
              {fieldErrors.nipNrp ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.nipNrp}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pangkatGolongan">Pangkat/Golongan</Label>
              <Input
                id="pangkatGolongan"
                name="pangkatGolongan"
                maxLength={100}
              />
              {fieldErrors.pangkatGolongan ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.pangkatGolongan}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instansi">Instansi</Label>
              <Input id="instansi" name="instansi" maxLength={100} />
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
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Data Surat Pengantar</p>
          <div className="grid gap-2">
            <Label htmlFor="pengantar">Pengantar</Label>
            <Textarea id="pengantar" name="pengantar" maxLength={150} />
            {fieldErrors.pengantar ? (
              <p className="text-sm text-destructive">
                {fieldErrors.pengantar}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ditujukan">Ditujukan</Label>
            <Input id="ditujukan" name="ditujukan" maxLength={150} />
            {fieldErrors.ditujukan ? (
              <p className="text-sm text-destructive">
                {fieldErrors.ditujukan}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratNo">No. Dasar Surat</Label>
              <Input id="dasarSuratNo" name="dasarSuratNo" maxLength={30} />
              {fieldErrors.dasarSuratNo ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratNo}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratPerihal">Perihal</Label>
              <Input
                id="dasarSuratPerihal"
                name="dasarSuratPerihal"
                maxLength={100}
              />
              {fieldErrors.dasarSuratPerihal ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.dasarSuratPerihal}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dasarSuratTgl">Tanggal Dasar Surat</Label>
              <Input id="dasarSuratTgl" name="dasarSuratTgl" type="date" />
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
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Data Kelulusan</p>
          {isKeteranganLulus ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                <Input id="tempatLahir" name="tempatLahir" maxLength={100} />
                {fieldErrors.tempatLahir ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.tempatLahir}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input id="tanggalLahir" name="tanggalLahir" type="date" />
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
              <Label htmlFor="tanggalLulus">Tanggal Lulus</Label>
              <Input id="tanggalLulus" name="tanggalLulus" type="date" />
              {fieldErrors.tanggalLulus ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.tanggalLulus}
                </p>
              ) : null}
            </div>
            {isKeteranganLulus ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="ipk">IPK</Label>
                  <Input id="ipk" name="ipk" maxLength={5} />
                  {fieldErrors.ipk ? (
                    <p className="text-sm text-destructive">
                      {fieldErrors.ipk}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="yudisium">Yudisium</Label>
                  <Input id="yudisium" name="yudisium" maxLength={25} />
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
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Unggah file karya ilmiah akan ditambahkan pada tahap berikutnya.
        </p>
      ) : null}

      {isLegalisir ? (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">Jumlah Dokumen</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="jumlahTranskrip">Transkrip</Label>
              <Input
                id="jumlahTranskrip"
                name="jumlahTranskrip"
                type="number"
                min={1}
                defaultValue={1}
              />
              {fieldErrors.jumlahTranskrip ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahTranskrip}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jumlahIjazah">Ijazah</Label>
              <Input
                id="jumlahIjazah"
                name="jumlahIjazah"
                type="number"
                min={1}
                defaultValue={1}
              />
              {fieldErrors.jumlahIjazah ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.jumlahIjazah}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jumlahTranslet">Terjemahan</Label>
              <Input
                id="jumlahTranslet"
                name="jumlahTranslet"
                type="number"
                min={1}
                defaultValue={1}
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

      {showDescription ? (
        <div className="grid gap-2">
          <Label htmlFor="description">Keterangan/Keperluan</Label>
          <Textarea id="description" name="description" maxLength={100} data-testid="request-description" />
          {fieldErrors.description ? (
            <p className="text-sm text-destructive">
              {fieldErrors.description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="attachments">Lampiran Dokumen Pendukung</Label>
        <Input
          id="attachments"
          name="attachments"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={handleAttachmentChange}
        />
        <p className="text-sm text-muted-foreground">
          Maksimal 3 file, masing-masing 5 MB. Format PDF, JPG, atau PNG.
        </p>
        <div className="grid gap-2 rounded-md border bg-muted/20 px-3 py-2">
          <p className="text-sm font-medium">
            {selectedFiles.length} dari {maxAttachmentCount} file dipilih
          </p>
          {selectedFiles.length > 0 ? (
            <ul className="grid gap-1">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
                >
                  <span className="min-w-0 flex-1 break-all">
                    {file.name}
                  </span>
                  <span>{formatFileSizeMb(file.size)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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

      <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Anda sedang mengajukan layanan sebagai mahasiswa development. Pada tahap
        berikutnya, data akan diambil dari PAUS OAuth.
      </p>

      <Button type="submit" disabled={isSubmitting} data-testid="service-request-submit">
        {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
      </Button>
    </form>
  );
}
