"use client";

import { useRef, useState } from "react";
import { Check, Download, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ExportState = "idle" | "preparing" | "downloading" | "done" | "error";

type RequestExportButtonProps = {
  href: string;
  label: string;
  variant?: "default" | "outline";
};

function getFilename(contentDisposition: string | null) {
  const encodedMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? "pengajuan-layanan.csv";
}

export function RequestExportButton({
  href,
  label,
  variant = "default",
}: RequestExportButtonProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [progress, setProgress] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusy = state === "preparing" || state === "downloading";

  async function downloadExport() {
    if (isBusy) return;

    if (resetTimer.current) clearTimeout(resetTimer.current);
    setState("preparing");
    setProgress(0);

    try {
      const response = await fetch(href, {
        credentials: "same-origin",
        headers: { Accept: "text/csv" },
      });

      if (!response.ok) {
        throw new Error("Export request failed");
      }

      const totalBytes = Number(response.headers.get("X-Export-Size") ?? 0);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Download stream is unavailable");
      }

      const chunks: ArrayBuffer[] = [];
      let receivedBytes = 0;
      setState("downloading");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(
          value.buffer.slice(
            value.byteOffset,
            value.byteOffset + value.byteLength,
          ) as ArrayBuffer,
        );
        receivedBytes += value.byteLength;

        if (totalBytes > 0) {
          setProgress(Math.min(99, Math.round((receivedBytes / totalBytes) * 100)));
        }
      }

      const blob = new Blob(chunks, { type: "text/csv;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = getFilename(response.headers.get("Content-Disposition"));
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setProgress(100);
      setState("done");
      resetTimer.current = setTimeout(() => setState("idle"), 1800);
    } catch (error) {
      console.error("Failed to download request export", error);
      setState("error");
      resetTimer.current = setTimeout(() => setState("idle"), 3000);
    }
  }

  const buttonText =
    state === "preparing"
      ? "Menyiapkan..."
      : state === "downloading"
        ? `Download ${progress}%`
        : state === "done"
          ? "Download selesai"
          : state === "error"
            ? "Gagal, coba lagi"
            : label;

  return (
    <Button
      type="button"
      variant={variant}
      disabled={isBusy}
      onClick={downloadExport}
      aria-live="polite"
      className={
        variant === "outline"
          ? "h-9 min-w-[174px] rounded-md border-[#d8cdbd] bg-white px-4 text-[12px] font-bold text-[#173d2d] hover:bg-[#f6f1e8]"
          : "h-9 min-w-[190px] rounded-md bg-[#0f3d2e] px-4 text-[12px] font-bold text-white hover:bg-[#164b39]"
      }
    >
      {isBusy ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="size-4" />
      ) : (
        <Download className="size-4" />
      )}
      <span>{buttonText}</span>
    </Button>
  );
}
