import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  getServiceSuggestions,
  parseServiceSuggestionSort,
  type ServiceSuggestion,
} from "@/lib/service-suggestions";

const statusLabels = {
  new: "Baru",
  reviewed: "Ditinjau",
  archived: "Diarsipkan",
} satisfies Record<ServiceSuggestion["status"], string>;

function csvValue(value: string | number | Date | null | undefined) {
  const text =
    value instanceof Date
      ? value.toISOString()
      : value === null || value === undefined
        ? ""
        : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function formatDateForFilename(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function toCsv(rows: ServiceSuggestion[]) {
  const headers = [
    "Tanggal",
    "Nama pengusul",
    "NPM",
    "Layanan yang diajukan",
    "Detail/deskripsi usulan",
    "Saran peningkatan",
    "Status",
    "Catatan admin",
    "Tanggal terakhir diperbarui",
  ];
  const lines = [
    headers.map(csvValue).join(","),
    ...rows.map((row) =>
      [
        row.createdAt,
        row.nama,
        row.npm,
        row.layananDiajukan,
        row.detailLayanan,
        row.saranPeningkatan,
        statusLabels[row.status],
        row.adminNote,
        row.updatedAt,
      ]
        .map(csvValue)
        .join(","),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}

export async function GET(request: Request) {
  const user = await requireRole(["ADMIN"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const sort = parseServiceSuggestionSort(url.searchParams.get("sort"));
    const rows = await getServiceSuggestions({ sort });
    const filename = `usulan-layanan-ult-fmipa-${formatDateForFilename(
      new Date(),
    )}.csv`;

    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:service-suggestions:export:get",
      "Export usulan layanan gagal dibuat.",
    );
  }
}
