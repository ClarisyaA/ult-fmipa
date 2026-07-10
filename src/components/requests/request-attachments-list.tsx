import Link from "next/link";

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

  return null;
}

export function RequestAttachmentsList({
  attachments,
}: RequestAttachmentsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lampiran</CardTitle>
        <CardDescription>
          Metadata lampiran pengajuan. Path storage lokal tidak ditampilkan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada lampiran.</p>
        ) : (
          <div className="grid gap-3">
            {attachments.map((attachment) => {
              const attachmentType = formatAttachmentType(attachment.attachmentType);

              return (
                <div
                  key={attachment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {attachment.originalName}
                    </p>
                    {attachmentType ? (
                      <p className="text-sm text-muted-foreground">
                        {attachmentType}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      {attachment.mimeType} - {formatFileSize(attachment.sizeBytes)}
                      {" - "}
                      {formatDate(attachment.uploadedAt)}
                    </p>
                  </div>
                  <Link
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    href={`/api/attachments/${attachment.id}`}
                    target="_blank"
                  >
                    Buka
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
