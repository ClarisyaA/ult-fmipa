"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FileText, Mail, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EmailDraft = {
  recipientEmail: string | null;
  hasRecipientEmail: boolean;
  subject: string;
  body: string;
  gmailComposeUrl: string;
  serviceTitle: string;
  supportsGeneratedPdf: boolean;
  pdfUrl: string | null;
  attachmentInstruction: string;
};

type EmailDraftResponse = {
  success: boolean;
  data?: EmailDraft;
  error?: {
    message?: string;
  };
};

type RequestEmailHelperProps = {
  serviceSlug: string;
  id: string;
  mode?: "card" | "completion-dialog";
  openSignal?: number;
  onClose?: () => void;
};

function fieldValue(value: string | null | undefined, fallback = "-") {
  return value?.trim() ? value : fallback;
}

function DraftContent({ draft }: { draft: EmailDraft }) {
  const helperText = draft.supportsGeneratedPdf
    ? "Buka atau unduh PDF Surat, lalu lampirkan secara manual di Gmail sebelum mengirim email."
    : "Layanan ini belum memiliki PDF otomatis. Lampirkan file hasil layanan secara manual di Gmail sebelum mengirim email.";

  return (
    <div className="grid gap-4">
      {!draft.hasRecipientEmail ? (
        <div className="flex gap-2 rounded-md border border-[#f1c9a8] bg-[#fff7ed] p-3 text-sm text-[#9a3412]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Email tujuan belum tersedia. Silakan isi alamat email secara manual
            di Gmail.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Email tujuan</p>
          <p className="mt-1 break-all text-sm font-medium">
            {fieldValue(draft.recipientEmail, "Isi manual di Gmail")}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Subject</p>
          <p className="mt-1 text-sm font-medium">{draft.subject}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Body</p>
          <pre className="mt-1 whitespace-pre-wrap rounded-md bg-white p-3 text-sm leading-relaxed text-[#2d2924]">
            {draft.body}
          </pre>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-muted-foreground">
        <p className="font-medium text-[#5f554a]">
          {draft.attachmentInstruction}
        </p>
        <p>{helperText}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="bg-[#111111] hover:bg-[#252525]">
          <a href={draft.gmailComposeUrl} target="_blank" rel="noopener noreferrer">
            <Mail className="size-4" />
            Buka Gmail
          </a>
        </Button>
        {draft.supportsGeneratedPdf && draft.pdfUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={draft.pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="size-4" />
              Buka PDF Surat
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function RequestEmailHelper({
  serviceSlug,
  id,
  mode = "card",
  openSignal = 0,
  onClose,
}: RequestEmailHelperProps) {
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadDraft = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/requests/${serviceSlug}/${id}/email-draft`,
        { cache: "no-store" },
      );
      const body = (await response.json().catch(() => null)) as
        | EmailDraftResponse
        | null;

      if (!response.ok || !body?.success || !body.data) {
        setError(
          body?.error?.message ??
            "Status berhasil diperbarui, tetapi draft Gmail belum dapat disiapkan. Coba buka detail pengajuan.",
        );
        setDraft(null);
        return;
      }

      setDraft(body.data);
    } catch {
      setError(
        "Status berhasil diperbarui, tetapi draft Gmail belum dapat disiapkan. Coba buka detail pengajuan.",
      );
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, serviceSlug]);

  useEffect(() => {
    if (mode === "card") {
      const timeout = window.setTimeout(() => {
        void loadDraft();
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [loadDraft, mode]);

  useEffect(() => {
    if (mode === "completion-dialog" && openSignal > 0) {
      const timeout = window.setTimeout(() => {
        setIsDialogOpen(true);
        void loadDraft();
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [loadDraft, mode, openSignal]);

  if (mode === "completion-dialog") {
    return (
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) onClose?.();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Pengajuan selesai. Siapkan email pengiriman melalui Gmail?
            </DialogTitle>
            <DialogDescription>
              Gmail akan terbuka dengan email tujuan, subjek, dan isi pesan yang sudah disiapkan. File hasil layanan tetap harus dilampirkan manual sebelum dikirim.
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Menyiapkan draft email...</p>
          ) : error ? (
            <p className="rounded-md border border-[#f1c9a8] bg-[#fff7ed] p-3 text-sm text-[#9a3412]">
              {error}
            </p>
          ) : draft ? (
            <DraftContent draft={draft} />
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Nanti
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Pengiriman Email</CardTitle>
          <CardDescription>
            Gmail akan terbuka dengan email tujuan, subjek, dan isi pesan yang sudah disiapkan. File hasil layanan tetap harus dilampirkan manual sebelum dikirim.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadDraft()}
          disabled={isLoading}
        >
          <RefreshCw className="size-4" />
          {isLoading ? "Memuat..." : "Muat Ulang"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && !draft ? (
          <p className="text-sm text-muted-foreground">Menyiapkan draft email...</p>
        ) : error ? (
          <p className="rounded-md border border-[#f1c9a8] bg-[#fff7ed] p-3 text-sm text-[#9a3412]">
            {error}
          </p>
        ) : draft ? (
          <DraftContent draft={draft} />
        ) : null}
      </CardContent>
    </Card>
  );
}
