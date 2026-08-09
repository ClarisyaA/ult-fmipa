import {
  getPrintableLetterService,
} from "@/lib/letters/letter-data";
import { getLetterMetadata } from "@/lib/letters/letter-metadata";
import { getRequestDetail } from "@/lib/legacy-request-detail";
import { prisma } from "@/lib/prisma";
import type { ServiceRequestDetail } from "@/types/request-detail";

export const EMAIL_ATTACHMENT_INSTRUCTION =
  "Lampirkan file hasil layanan secara manual sebelum mengirim email.";

export type EmailComposeInput = {
  to?: string | null;
  subject: string;
  body: string;
};

export type RequestEmailDraft = {
  recipientEmail: string | null;
  hasRecipientEmail: boolean;
  subject: string;
  body: string;
  gmailComposeUrl: string;
  serviceTitle: string;
  supportsGeneratedPdf: boolean;
  pdfUrl: string | null;
  isPdfReady: boolean;
  pdfNotReadyMessage: string | null;
  attachmentInstruction: string;
};

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: string | null | undefined) {
  const email = normalizeText(value);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  return email;
}

export function buildRequestCompletionSubject(serviceTitle: string) {
  return `Penyelesaian Pengajuan ${serviceTitle} - ULT FMIPA Unpad`;
}

export function buildRequestCompletionBody({
  requesterName,
  serviceTitle,
}: {
  requesterName?: string | null;
  serviceTitle: string;
}) {
  const greetingName = normalizeText(requesterName) ?? "Pemohon";

  return [
    `Yth. ${greetingName},`,
    "",
    `Pengajuan layanan ${serviceTitle} Anda telah selesai diproses.`,
    "",
    "Silakan cek file hasil layanan yang akan dilampirkan pada email ini.",
    "",
    "Terima kasih.",
    "",
    "ULT FMIPA Universitas Padjadjaran",
  ].join("\n");
}

export function buildGmailComposeUrl({ to, subject, body }: EmailComposeInput) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: to ?? "",
    su: subject,
    body,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

async function getAlumniProfileByNpm(npm: string | null | undefined) {
  const normalizedNpm = normalizeText(npm);

  if (!normalizedNpm) {
    return null;
  }

  return prisma.alumni.findFirst({
    where: { npm: normalizedNpm },
    select: {
      nama: true,
      email: true,
    },
  });
}

async function resolveRecipientEmail(detail: ServiceRequestDetail) {
  const requestSpecificEmail = normalizeEmail(
    detail.emailPengiriman ?? detail.requesterEmail,
  );

  if (requestSpecificEmail) {
    return requestSpecificEmail;
  }

  if (detail.sourceTable === "keterangan_lulus") {
    const alumni = await getAlumniProfileByNpm(detail.npm);
    return normalizeEmail(alumni?.email);
  }

  return null;
}

async function resolveRequesterName(detail: ServiceRequestDetail) {
  const detailName = normalizeText(detail.requesterName);

  if (detailName) {
    return detailName;
  }

  if (detail.sourceTable === "keterangan_lulus") {
    const alumni = await getAlumniProfileByNpm(detail.npm);
    return normalizeText(alumni?.nama);
  }

  return null;
}

export async function buildRequestEmailDraft(
  serviceSlug: string,
  id: string,
): Promise<RequestEmailDraft | null> {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  const detail = await getRequestDetail(serviceSlug, id);

  if (!detail) {
    return null;
  }

  const recipientEmail = await resolveRecipientEmail(detail);
  const requesterName = await resolveRequesterName(detail);
  const subject = buildRequestCompletionSubject(detail.serviceTitle);
  const body = buildRequestCompletionBody({
    requesterName,
    serviceTitle: detail.serviceTitle,
  });
  const printableService = getPrintableLetterService(detail.serviceSlug);
  const pdfUrl = printableService
    ? `/api/requests/${detail.serviceSlug}/${detail.id}/pdf`
    : null;

  let isPdfReady = true;
  let pdfNotReadyMessage: string | null = null;

  if (printableService) {
    try {
      const metadata = await getLetterMetadata(detail.serviceSlug, detail.id);
      if (metadata.readiness) {
        isPdfReady = metadata.readiness.isReady;
        pdfNotReadyMessage = metadata.readiness.message;
      }
    } catch {
      isPdfReady = false;
      pdfNotReadyMessage = "Data surat belum lengkap.";
    }
  }

  return {
    recipientEmail,
    hasRecipientEmail: Boolean(recipientEmail),
    subject,
    body,
    gmailComposeUrl: buildGmailComposeUrl({ to: recipientEmail, subject, body }),
    serviceTitle: detail.serviceTitle,
    supportsGeneratedPdf: Boolean(printableService),
    pdfUrl,
    isPdfReady,
    pdfNotReadyMessage,
    attachmentInstruction: EMAIL_ATTACHMENT_INSTRUCTION,
  };
}
