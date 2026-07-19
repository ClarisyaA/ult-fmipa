import Link from "next/link";
import { FileText, Download, Calendar, File, Image, Archive, FileSignature } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RequestAttachment } from "@/types/attachment";

type RequestAttachmentsListProps = {
  attachments: RequestAttachment[];
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAttachmentType(value?: string | null) {
  if (value === "program_study_request_letter") {
    return "Surat Permohonan dari Program Studi";
  }

  if (value === "manager_approval_proof") {
    return "Bukti ACC Manajer Akademik dan Kemahasiswaan";
  }

  if (value === "final_spik_document") {
    return "Dokumen Final SPIK";
  }

  return "Lampiran";
}

function getFileIcon(mimeType?: string) {
  if (!mimeType) return FileText;
  
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("image")) return Image;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  if (mimeType.includes("doc") || mimeType.includes("docx")) return FileSignature;
  
  return File;
}

export function RequestAttachmentsList({
  attachments,
}: RequestAttachmentsListProps) {
  return (
    <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 overflow-hidden">
      <div className="px-5 pt-4 pb-1 sm:px-6 sm:pt-5">
        <h3 className="text-sm font-semibold text-[#18130E] flex items-center gap-2">
          <FileText className="size-4 text-[#EE1C25]" />
          Lampiran
        </h3>
        <p className="mt-1 text-sm text-[#7A6A5C]">
          Metadata lampiran pengajuan. Path storage lokal tidak ditampilkan.
        </p>
      </div>
      <div className="px-5 pb-4 sm:px-6 sm:pb-5">
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#DDD5C3] bg-white/30 py-8 text-center">
            <FileText className="size-10 text-[#A0917F] mb-2" />
            <p className="text-sm text-[#7A6A5C]">Belum ada lampiran.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {attachments.map((attachment) => {
              const attachmentType = formatAttachmentType(attachment.attachmentType);
              const FileIcon = getFileIcon(attachment.mimeType);

              return (
                <div
                  key={attachment.id}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-4 transition-all hover:border-[#EE1C25]/30 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EE1C25]/10 text-[#EE1C25]">
                      <FileIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#18130E] truncate group-hover:text-[#EE1C25] transition-colors">
                        {attachment.originalName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {attachmentType && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F3EA]/80 px-2.5 py-0.5 text-xs font-medium text-[#6B5E52] border border-[#DDD5C3]/50">
                            {attachmentType}
                          </span>
                        )}
                        <span className="text-xs text-[#7A6A5C]">
                          {attachment.mimeType}
                        </span>
                        <span className="text-xs text-[#7A6A5C]">·</span>
                        <span className="text-xs text-[#7A6A5C]">
                          {formatFileSize(attachment.sizeBytes)}
                        </span>
                        <span className="text-xs text-[#7A6A5C]">·</span>
                        <span className="flex items-center gap-1 text-xs text-[#7A6A5C]">
                          <Calendar className="size-3" />
                          {formatDate(attachment.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#DDD5C3] bg-white px-4 py-2 text-sm font-medium text-[#6B5E52] transition-all hover:border-[#EE1C25] hover:bg-[#EE1C25]/5 hover:text-[#EE1C25] hover:shadow-sm shrink-0"
                    href={`/api/attachments/${attachment.id}`}
                    target="_blank"
                  >
                    <Download className="size-3.5" />
                    Buka
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}