import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { jsonApiError } from "@/lib/error-utils";
import {
  getServiceRequestList,
  parseRequestStatus,
} from "@/lib/legacy-request-list";
import { getPublicServices } from "@/lib/legacy-services";
import type { ServiceRequestListItem } from "@/types/request";

const categoryMap: Record<string, string[]> = {
  mahasiswa: ["Layanan Mahasiswa"],
  "akademik-alumni": ["Layanan Alumni"],
  perpustakaan: ["Layanan Perpustakaan"],
};

function formatDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function requestToCsvRow(request: ServiceRequestListItem) {
  return [
    request.serviceTitle,
    request.npm,
    request.requesterName,
    request.requesterProgram,
    request.requesterEmail,
    request.requesterPhone,
    request.mainField ?? request.purpose,
    request.jenisPermohonan,
    request.tempatPelaksanaan,
    request.tujuanSurat,
    formatDateTime(request.requestDate),
    formatDateTime(request.processDate),
    formatDateTime(request.completedDate),
    formatDateTime(request.deliveredDate),
    request.statusLabel,
  ].map(escapeCsv).join(",");
}

function getCategoryServiceSlugs(category: string | null) {
  if (!category || !categoryMap[category]) return undefined;

  const categories = categoryMap[category];
  return getPublicServices()
    .filter((service) => categories.includes(service.category))
    .map((service) => service.slug);
}

export async function GET(request: Request) {
  const user = await requireRole(["admin"]);

  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") === "all" ? "all" : "filtered";
  const service = scope === "filtered" ? searchParams.get("service") ?? undefined : undefined;
  const category = scope === "filtered" ? searchParams.get("category") : null;
  const status = scope === "filtered"
    ? parseRequestStatus(searchParams.get("status") ?? undefined)
    : undefined;
  const sort = searchParams.get("sort") === "oldest" ? "oldest" : "newest";

  try {
    const result = await getServiceRequestList({
      service,
      serviceSlugs: service ? undefined : getCategoryServiceSlugs(category),
      status,
      sort,
      all: true,
    });
    const headers = [
      "Layanan",
      "NPM",
      "Nama",
      "Program Studi",
      "Email",
      "No HP",
      "Keperluan",
      "Jenis Permohonan",
      "Tempat Pelaksanaan",
      "Tujuan Surat",
      "Permintaan",
      "Proses",
      "Selesai",
      "Diambil/Dikirim",
      "Status",
    ];
    const csv = `\uFEFF${[
      headers.map(escapeCsv).join(","),
      ...result.data.map(requestToCsvRow),
    ].join("\r\n")}`;
    const csvSize = new TextEncoder().encode(csv).byteLength;
    const date = new Date().toISOString().slice(0, 10);
    const filename = `pengajuan-${scope === "all" ? "semua" : service ?? category ?? "filter"}-${date}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Size": String(csvSize),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return jsonApiError(
      error,
      "api:admin:requests:export:get",
      "Data pengajuan gagal diekspor.",
    );
  }
}
