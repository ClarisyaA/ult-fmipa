import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import { getSurveyExportRows } from "@/lib/service-surveys";

function csvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);

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

export async function GET(request: Request) {
  const user = await requireRole(["ADMIN"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const rows = await getSurveyExportRows({
      search: url.searchParams.get("q") ?? undefined,
      serviceSlug: url.searchParams.get("service") ?? undefined,
    });
    const headers = [
      "ID Survei",
      "ID Pengajuan",
      "Layanan",
      "Rating keseluruhan",
      "Tangibility",
      "Reliability",
      "Responsiveness",
      "Assurance",
      "Empathy",
      "Komentar",
      "Tanggal pengisian",
      "Source Table",
      "Service Slug",
    ];
    const lines = [
      headers.map(csvValue).join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.requestId,
          row.serviceTitle,
          row.overallRating,
          row.ratingTangibility,
          row.ratingReliability,
          row.ratingResponsiveness,
          row.ratingAssurance,
          row.ratingEmpathy,
          row.comment,
          row.createdAt,
          row.sourceTable,
          row.serviceSlug,
        ]
          .map(csvValue)
          .join(","),
      ),
    ];
    const filename = `survei-ult-fmipa-${formatDateForFilename(new Date())}.csv`;

    return new Response(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:surveys:export:get",
      "Export survei gagal dibuat.",
    );
  }
}
