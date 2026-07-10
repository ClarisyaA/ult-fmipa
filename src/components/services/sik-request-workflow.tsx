"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getServiceUploadRule, type ServiceUploadRule } from "@/lib/service-upload-config";
import type { StudentRequestDetail } from "@/types/student-request";

type SikRequestWorkflowProps = {
  latestRequest?: StudentRequestDetail | null;
};

type ApiIssue = {
  field: string;
  message: string;
};

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");

  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

function formatFileSizeMb(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
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

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function StatusCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#EE1C25]/30 bg-[#FFF7F2] p-4">
      <p className="text-sm font-semibold text-[#18130E]">{title}</p>
      <div className="mt-2 text-sm text-[#6B5E52]">{children}</div>
    </div>
  );
}

function FilePicker({
  uploadRule,
  selectedFiles,
  setSelectedFiles,
  fieldError,
  setFieldError,
}: {
  uploadRule: ServiceUploadRule;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  fieldError?: string;
  setFieldError: (message: string) => void;
}) {
  const acceptAttribute = [
    ...uploadRule.allowedExtensions,
    ...uploadRule.allowedMimeTypes,
  ].join(",");

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
      setFieldError(invalidMessage);
      return;
    }

    if (selectedFiles.length + files.length > uploadRule.maxFiles) {
      setFieldError(`Maksimal ${uploadRule.maxFiles} file lampiran.`);
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    setFieldError("");
  }

  return (
    <div className="grid gap-2">
      <Input
        id="attachments"
        name="attachments"
        type="file"
        multiple
        accept={acceptAttribute}
        onChange={handleAttachmentChange}
        className="border-[#EE1C25]/40 focus:border-[#EE1C25] focus:ring-[#EE1C25]/20 flex items-center file:inline-flex file:items-center file:justify-center file:bg-[#EE1C25] file:text-white file:border-0 file:px-4 file:h-9 file:rounded-md file:hover:bg-[#EE1C25]/90 file:cursor-pointer file:mr-4 h-12"
      />
      <p className="text-sm text-muted-foreground">{uploadRule.description}</p>
      <div className="grid gap-2 rounded-md border border-[#EE1C25]/40 px-3 py-2">
        <p className="text-sm font-medium text-[#18130E]">
          {selectedFiles.length} dari {uploadRule.maxFiles} file dipilih
        </p>
        {selectedFiles.map((file, index) => (
          <div
            key={`${file.name}-${file.size}-${index}`}
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#6B5E52]"
          >
            <span className="min-w-0 flex-1 break-all">{file.name}</span>
            <span>{formatFileSizeMb(file.size)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#EE1C25]/30 text-[#EE1C25] hover:bg-[#EE1C25]/10"
              onClick={() =>
                setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
              }
            >
              Hapus
            </Button>
          </div>
        ))}
      </div>
      {fieldError ? (
        <p className="text-sm text-destructive">{fieldError}</p>
      ) : null}
    </div>
  );
}

export function SikRequestWorkflow({
  latestRequest,
}: SikRequestWorkflowProps) {
  const proofUploadRule = getServiceUploadRule("surat-izin-kegiatan:approval-proof");
  const finalUploadRule = getServiceUploadRule("surat-izin-kegiatan:final-spik");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [finalFiles, setFinalFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRejected = latestRequest?.status === "sikApprovalRejected";
  const canUploadProof = !latestRequest || isRejected;
  const canSubmitFinal =
    latestRequest?.status === "sikApprovalVerified" &&
    !latestRequest.finalSubmittedDate;
  const isFinalSubmitted = Boolean(latestRequest?.finalSubmittedDate);

  function setAttachmentError(key: string, message: string) {
    setFieldErrors((current) => ({
      ...current,
      [key]: message,
    }));
    setError(message);
  }

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    if (proofFiles.length < (proofUploadRule.minFiles ?? 0)) {
      setAttachmentError("proofAttachments", "Lampiran wajib diunggah.");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = new FormData();
      proofFiles.forEach((file) => requestBody.append("attachments", file));

      const response = await fetch("/api/services/surat-izin-kegiatan/requests", {
        method: "POST",
        body: requestBody,
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        issues?: ApiIssue[];
      } | null;

      if (!response.ok) {
        const issues = body?.issues ?? [];
        setFieldErrors(
          Object.fromEntries(issues.map((issue) => [issue.field, issue.message]))
        );
        setError(issues[0]?.message ?? body?.error ?? "Bukti ACC gagal dikirim.");
        return;
      }

      setProofFiles([]);
      setSuccess("Bukti ACC berhasil dikirim dan menunggu verifikasi.");
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitFinal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    if (!latestRequest) {
      setError("Pengajuan SIK tidak ditemukan.");
      return;
    }

    if (finalFiles.length < (finalUploadRule.minFiles ?? 0)) {
      setAttachmentError("finalAttachments", "Lampiran wajib diunggah.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const requestBody = new FormData();

      requestBody.append("namaHimpunan", getFormString(formData, "namaHimpunan"));
      requestBody.append("namaKegiatan", getFormString(formData, "namaKegiatan"));
      requestBody.append("tanggalKegiatan", getFormString(formData, "tanggalKegiatan"));
      requestBody.append("emailPengiriman", getFormString(formData, "emailPengiriman"));
      requestBody.append("noHpWa", getFormString(formData, "noHpWa"));
      finalFiles.forEach((file) => requestBody.append("attachments", file));

      const response = await fetch(
        `/api/services/surat-izin-kegiatan/requests/${latestRequest.id}/final`,
        {
          method: "PATCH",
          body: requestBody,
        }
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        issues?: ApiIssue[];
      } | null;

      if (!response.ok) {
        const issues = body?.issues ?? [];
        setFieldErrors(
          Object.fromEntries(issues.map((issue) => [issue.field, issue.message]))
        );
        setError(issues[0]?.message ?? body?.error ?? "Form final SIK gagal dikirim.");
        return;
      }

      setFinalFiles([]);
      setSuccess("Form final SIK berhasil dikirim.");
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 rounded-lg border border-[#EE1C25]/30 p-4">
        <p className="text-sm font-semibold text-[#18130E]">
          Alur Pengajuan SIK
        </p>
        <ol className="grid gap-2 text-sm text-[#6B5E52]">
          <li>1. Instruksi: lakukan permohonan ACC offline bersama koordinator.</li>
          <li>2. Upload Bukti ACC Manajer Akademik dan Kemahasiswaan.</li>
          <li>3. Tunggu verifikasi admin/staff.</li>
          <li>4. Isi Form Final setelah bukti disetujui.</li>
          <li>5. Pantau proses surat sampai dikirim.</li>
        </ol>
      </div>

      {latestRequest ? (
        <StatusCard title="Status Pengajuan SIK">
          <p>{latestRequest.statusLabel}</p>
          {latestRequest.approvalRejectReason ? (
            <p className="mt-2 text-destructive">
              Alasan penolakan: {latestRequest.approvalRejectReason}
            </p>
          ) : null}
          {isFinalSubmitted ? (
            <p className="mt-2">
              Form final sudah dikirim. Pantau proses dari halaman riwayat.
            </p>
          ) : null}
        </StatusCard>
      ) : null}

      {canUploadProof ? (
        <form className="grid gap-4" onSubmit={submitProof}>
          <div className="grid gap-2">
            <Label className="text-[#18130E] font-medium">
              Upload Bukti ACC
            </Label>
            <FilePicker
              uploadRule={proofUploadRule}
              selectedFiles={proofFiles}
              setSelectedFiles={setProofFiles}
              fieldError={fieldErrors.proofAttachments ?? fieldErrors.attachments}
              setFieldError={(message) =>
                setAttachmentError("proofAttachments", message)
              }
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="sik-proof-submit"
            className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Bukti ACC"}
          </Button>
        </form>
      ) : null}

      {canSubmitFinal ? (
        <form className="grid gap-4" onSubmit={submitFinal}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="namaHimpunan">Nama Himpunan</Label>
              <Input id="namaHimpunan" name="namaHimpunan" required maxLength={150} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="namaKegiatan">Nama Kegiatan</Label>
              <Input id="namaKegiatan" name="namaKegiatan" required maxLength={200} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="tanggalKegiatan">Tanggal Kegiatan</Label>
              <Input id="tanggalKegiatan" name="tanggalKegiatan" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailPengiriman">Email Pengiriman SIK</Label>
              <Input id="emailPengiriman" name="emailPengiriman" type="email" required maxLength={100} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="noHpWa">No HP WA Contact Person</Label>
              <Input id="noHpWa" name="noHpWa" required maxLength={30} />
            </div>
          </div>
          <FilePicker
            uploadRule={finalUploadRule}
            selectedFiles={finalFiles}
            setSelectedFiles={setFinalFiles}
            fieldError={fieldErrors.finalAttachments ?? fieldErrors.attachments}
            setFieldError={(message) =>
              setAttachmentError("finalAttachments", message)
            }
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="sik-final-submit"
            className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Form Final SIK"}
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-[#cce3d3] bg-[#eef9f1] px-3 py-2 text-sm text-[#2f6b44]">
          {success}
        </p>
      ) : null}

      <Button asChild variant="outline" className="w-full">
        <Link href="/mahasiswa/riwayat">Lihat Riwayat Pengajuan</Link>
      </Button>
    </div>
  );
}
