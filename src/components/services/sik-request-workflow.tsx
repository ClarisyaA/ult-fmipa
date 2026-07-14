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
      Opsional
    </span>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
  optional = false,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="inline-flex flex-wrap items-center gap-1 text-[#18130E] font-medium"
    >
      {children}
      {required ? <RequiredMark /> : null}
      {!required && optional ? <OptionalMark /> : null}
    </Label>
  );
}

const sikSteps = [
  "Audiensi & ACC Offline",
  "Upload Bukti ACC",
  "Verifikasi Admin/Staff",
  "Form Final SIK",
  "Surat Diproses & Dikirim",
];

function getActiveStep(latestRequest?: StudentRequestDetail | null) {
  if (!latestRequest) return 2;
  if (latestRequest.status === "sikApprovalPending") return 3;
  if (latestRequest.status === "sikApprovalRejected") return 2;
  if (latestRequest.status === "sikApprovalVerified") return 4;
  return 5;
}

function getStateCopy(latestRequest?: StudentRequestDetail | null) {
  if (!latestRequest) {
    return {
      title: "Mulai dari ACC offline",
      description:
        "Lakukan audiensi dan minta ACC dari Manajer Akademik dan Kemahasiswaan bersama koordinator, lalu unggah bukti ACC pada halaman ini.",
    };
  }

  if (latestRequest.status === "sikApprovalPending") {
    return {
      title: "Bukti ACC sedang diverifikasi",
      description:
        "Tim ULT FMIPA akan memeriksa bukti ACC yang Anda unggah. Form final SIK akan terbuka setelah bukti disetujui.",
    };
  }

  if (latestRequest.status === "sikApprovalRejected") {
    return {
      title: "Bukti ACC perlu diperbaiki",
      description:
        "Tinjau alasan penolakan dari admin/staff, lalu unggah kembali bukti ACC yang sesuai.",
    };
  }

  if (latestRequest.status === "sikApprovalVerified") {
    return {
      title: "Bukti ACC disetujui",
      description:
        "Silakan lengkapi form final SIK agar permohonan dapat diproses oleh SBAK/ULT FMIPA.",
    };
  }

  if (latestRequest.status === "delivered") {
    return {
      title: "Surat izin telah dikirim",
      description:
        "Surat izin kegiatan telah selesai diproses dan dikirim sesuai email yang dicantumkan.",
    };
  }

  return {
    title: "Form final SIK sudah dikirim",
    description:
      "Permohonan Anda sudah masuk ke tahap pemrosesan. Pantau status secara berkala melalui riwayat pengajuan.",
  };
}

function SikStepper({ activeStep }: { activeStep: number }) {
  return (
    <div className="grid gap-2 rounded-lg border border-[#E7DED0] bg-[#FFFDF9] p-4">
      {sikSteps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === activeStep;
        const isDone = stepNumber < activeStep;

        return (
          <div
            key={step}
            className={`flex items-center gap-3 rounded-md px-2 py-2 ${
              isActive ? "bg-[#FFF3F3]" : ""
            }`}
          >
            <div
              className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                isActive
                  ? "border-[#EE1C25] bg-white text-[#EE1C25]"
                  : isDone
                    ? "border-[#CFE0D4] bg-[#F1FAF4] text-[#2F6B44]"
                    : "border-[#D8D1C5] bg-white text-[#6B5E52]"
              }`}
            >
              {stepNumber}
            </div>
            <p
              className={`text-sm ${
                isActive ? "font-semibold text-[#18130E]" : "text-[#6B5E52]"
              }`}
            >
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FilePicker({
  label,
  uploadRule,
  selectedFiles,
  setSelectedFiles,
  fieldError,
  setFieldError,
}: {
  label: string;
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
      <Label htmlFor="attachments" className="inline-flex items-center gap-2 text-[#18130E] font-medium">
        {label}
        {uploadRule.minFiles ? (
          <>
            <RequiredMark />
            <span className="text-xs font-semibold text-[#EE1C25]">Wajib</span>
          </>
        ) : (
          <OptionalMark />
        )}
      </Label>
      <Input
        id="attachments"
        name="attachments"
        type="file"
        multiple
        accept={acceptAttribute}
        aria-required={Boolean(uploadRule.minFiles)}
        onChange={handleAttachmentChange}
        className="border-[#EE1C25]/40 focus:border-[#EE1C25] focus:ring-[#EE1C25]/20 flex items-center file:inline-flex file:items-center file:justify-center file:bg-[#EE1C25] file:text-white file:border-0 file:px-4 file:h-9 file:rounded-md file:hover:bg-[#EE1C25]/90 file:cursor-pointer file:mr-4 h-12"
      />
      <p className="text-sm text-muted-foreground">
        {uploadRule.minFiles
          ? uploadRule.description
          : "Lampiran dokumen pendukung bersifat opsional."}
      </p>
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
  const activeStep = getActiveStep(latestRequest);
  const stateCopy = getStateCopy(latestRequest);

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
      <SikStepper activeStep={activeStep} />

      <StatusCard title={stateCopy.title}>
        <p>{stateCopy.description}</p>
        {latestRequest ? (
          <div className="mt-2">
            <p className="font-medium text-[#18130E]">
              Status saat ini: {latestRequest.statusLabel}
            </p>
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
          </div>
        ) : null}
      </StatusCard>

      {canUploadProof ? (
        <form className="grid gap-4" onSubmit={submitProof}>
          <FilePicker
            label={isRejected ? "Upload Ulang Bukti ACC" : "Upload Bukti ACC"}
            uploadRule={proofUploadRule}
            selectedFiles={proofFiles}
            setSelectedFiles={setProofFiles}
            fieldError={fieldErrors.proofAttachments ?? fieldErrors.attachments}
            setFieldError={(message) =>
              setAttachmentError("proofAttachments", message)
            }
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="sik-proof-submit"
            className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90"
          >
            {isSubmitting
              ? "Mengirim..."
              : isRejected
                ? "Upload Ulang Bukti ACC"
                : "Upload Bukti ACC"}
          </Button>
        </form>
      ) : null}

      {canSubmitFinal ? (
        <form className="grid gap-4" onSubmit={submitFinal}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="namaHimpunan" required>Nama Himpunan</FieldLabel>
              <Input id="namaHimpunan" name="namaHimpunan" required maxLength={150} />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="namaKegiatan" required>Nama Kegiatan</FieldLabel>
              <Input id="namaKegiatan" name="namaKegiatan" required maxLength={200} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <FieldLabel htmlFor="tanggalKegiatan" required>Tanggal Kegiatan</FieldLabel>
              <Input id="tanggalKegiatan" name="tanggalKegiatan" type="date" required />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="emailPengiriman" required>Email Pengiriman SIK</FieldLabel>
              <Input id="emailPengiriman" name="emailPengiriman" type="email" required maxLength={100} />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="noHpWa" required>No HP WA Contact Person</FieldLabel>
              <Input id="noHpWa" name="noHpWa" required maxLength={30} />
            </div>
          </div>
          <FilePicker
            label="Upload SPIK Final"
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
