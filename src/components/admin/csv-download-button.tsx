"use client";

import { Button } from "@/components/ui/button";

export type CsvRow = Record<string, string | number | null | undefined>;

type CsvDownloadButtonProps = {
  filename: string;
  rows: CsvRow[];
  disabledLabel?: string;
  className?: string;
};

function escapeCsvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function toCsv(rows: CsvRow[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ];

  return lines.join("\r\n");
}

export function CsvDownloadButton({
  filename,
  rows,
  disabledLabel = "Tidak ada data",
  className,
}: CsvDownloadButtonProps) {
  const disabled = rows.length === 0;

  function handleDownload() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={handleDownload}
      className={
        className ??
        "h-9 rounded-md border-[#e1d8ca] bg-white px-3 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
      }
      title={disabled ? disabledLabel : `Download ${filename}`}
    >
      Download Data
    </Button>
  );
}
