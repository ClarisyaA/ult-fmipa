import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RequestPriorityTable } from "@/components/requests/request-priority-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedTableText } from "@/components/ui/truncated-table-text";
import {
  getLatestPendingDashboardRequestsByDate,
  getPriorityDashboardRequests,
} from "@/lib/legacy-request-stats";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";
import type {
  PendingDashboardRequestRow,
  PriorityDashboardRequestRow,
} from "@/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StaffDashboardPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
};

function getCategoryParam(category: string) {
  if (category === "Layanan Mahasiswa") return "mahasiswa";
  if (category === "Layanan Alumni") return "alumni";
  if (category === "Layanan Perpustakaan") return "perpustakaan";

  return undefined;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildRequestPreviewHref(row: PendingDashboardRequestRow) {
  const params = new URLSearchParams({
    service: row.serviceSlug,
    previewService: row.serviceSlug,
    previewId: row.id,
  });
  const category = getCategoryParam(row.serviceCategory);

  if (category) {
    params.set("category", category);
  }

  return `/staff/requests?${params.toString()}`;
}

export default async function StaffDashboardPage({
  searchParams,
}: StaffDashboardPageProps) {
  const params = await searchParams;
  let rows: PendingDashboardRequestRow[] = [];
  let priorityRows: PriorityDashboardRequestRow[] = [];
  let dashboardError: string | null = null;
  const isPriorityFilterActive = Boolean(params.dateFrom || params.dateTo);

  try {
    [rows, priorityRows] = await Promise.all([
      getLatestPendingDashboardRequestsByDate({
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      }),
      getPriorityDashboardRequests(12, {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      }),
    ]);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    dashboardError =
      "Koneksi database sedang tidak tersedia. Coba muat ulang halaman beberapa saat lagi.";
    logServerError("staff:dashboard", error);
  }

  return (
    <div
      className="-m-4 min-h-[calc(100%+2rem)] bg-[#f8f2ea] text-[#1f2922] sm:-m-5 sm:min-h-[calc(100%+2.5rem)] lg:-m-6 lg:min-h-[calc(100%+3rem)]"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 72% 30% at 55% -8%, transparent 67%, rgba(198,184,160,0.20) 67.15%, transparent 67.45%)",
          "radial-gradient(ellipse 62% 28% at 75% 6%, transparent 63%, rgba(205,192,170,0.18) 63.15%, transparent 63.45%)",
          "radial-gradient(ellipse 48% 22% at 92% 18%, transparent 60%, rgba(201,187,164,0.20) 60.15%, transparent 60.45%)",
          "radial-gradient(circle at 74% 12%, rgba(247,238,224,0.92), transparent 34%)",
          "radial-gradient(circle at 100% 0%, rgba(243,230,211,0.48), transparent 30%)",
          "linear-gradient(180deg, #fbf8f2 0%, #f8f2ea 38%, #f5ecdf 100%)",
        ].join(", "),
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="relative z-0 overflow-hidden bg-transparent px-5 pb-10 pt-5 text-[#173d2d] sm:px-7 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
              Dashboard
            </h1>
            <p className="mt-1 text-xs text-[#566258]">
              Pantau pengajuan terbaru yang belum masuk tahap proses.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-6 grid max-w-[1320px] gap-3 px-4 pb-6 sm:px-6 lg:px-7">
        <section className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)]">
          <div className="border-b border-[#eee6d9] bg-[#fffdf9] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#173d2d]">
              Filter Prioritas
            </h2>
            <p className="mt-1 text-[11px] text-[#7a7166]">
              Batasi antrean prioritas berdasarkan tanggal pengajuan supaya
              request lama yang sudah tidak relevan bisa disisihkan.
            </p>
          </div>
          <form className="flex flex-wrap items-end gap-3 p-4" method="get">
            <div className="grid gap-1.5">
              <label
                htmlFor="staff-priority-date-from"
                className="text-[11px] font-semibold text-[#5d665f]"
              >
                Dari tanggal
              </label>
              <Input
                id="staff-priority-date-from"
                name="dateFrom"
                type="date"
                defaultValue={params.dateFrom}
                className="h-9 w-[180px] rounded-md border-[#ddd4c6] bg-white"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="staff-priority-date-to"
                className="text-[11px] font-semibold text-[#5d665f]"
              >
                Sampai tanggal
              </label>
              <Input
                id="staff-priority-date-to"
                name="dateTo"
                type="date"
                defaultValue={params.dateTo}
                className="h-9 w-[180px] rounded-md border-[#ddd4c6] bg-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                size="sm"
                className="h-9 rounded-md bg-[#0f3d2e] px-4 text-[11px] font-semibold text-white hover:bg-[#164b39]"
              >
                Terapkan Filter
              </Button>
              <Button
                asChild
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-md border-[#ddd4c6] bg-white px-4 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
              >
                <Link href="/staff/dashboard">Reset</Link>
              </Button>
            </div>
            <div className="ml-auto rounded-md border border-[#dce6da] bg-[#f8fbf6] px-3 py-2 text-xs font-semibold text-[#173d2d] shadow-sm">
              {isPriorityFilterActive ? "Filter tanggal aktif" : "Semua tanggal"}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6d9] bg-[#fffdf9] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#173d2d]">
                Layanan Baru Yang Belum Diproses
              </h2>
              <p className="mt-1 text-[11px] text-[#7a7166]">
                {isPriorityFilterActive
                  ? "Daftar pengajuan baru mengikuti rentang tanggal filter yang sama."
                  : "Diurutkan dari tanggal pengajuan terbaru."}
              </p>
            </div>
          </div>

          {dashboardError ? (
            <div className="px-4 py-3">
              <div className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-4 py-6 text-center text-sm text-[#8a3d23]">
                {dashboardError}
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-3">
              <div className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-4 py-8 text-center text-sm text-[#6f746f]">
                Tidak ada pengajuan baru yang belum diproses.
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-2 px-4 py-3 md:hidden">
                {rows.map((row) => (
                  <div
                    key={`${row.serviceSlug}-${row.id}`}
                    className="rounded-md border border-[#e3d9ca] bg-white p-3 shadow-[0_1px_4px_rgba(47,38,20,0.06)]"
                  >
                    <div className="grid gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-[#7a7166]">
                          Layanan
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-snug text-[#202923]">
                          {row.serviceTitle}
                        </p>
                      </div>
                      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2 text-xs">
                        <span className="text-[#7a7166]">Nama</span>
                        <span className="min-w-0 break-words font-semibold text-[#303b34]">
                          {row.requesterName}
                        </span>
                        <span className="text-[#7a7166]">Prodi</span>
                        <span className="min-w-0 break-words text-[#303b34]">
                          {row.programStudy}
                        </span>
                        <span className="text-[#7a7166]">Tanggal</span>
                        <span className="min-w-0 break-words text-[#303b34]">
                          {formatDate(row.requestDate)}
                        </span>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="mt-3 h-9 w-full rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
                    >
                      <Link href={buildRequestPreviewHref(row)}>
                        Proses
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto px-4 py-3 md:block">
                <Table className="min-w-[920px] table-fixed overflow-hidden rounded-md border border-[#edf0e9]">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[22%]" />
                    <col className="w-[25%]" />
                    <col className="w-[14%]" />
                    <col className="w-[11%]" />
                  </colgroup>
                  <TableHeader className="bg-[#eef3ec]">
                    <TableRow className="border-[#dfe6dd] hover:bg-[#eef3ec]">
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Layanan
                      </TableHead>
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Nama
                      </TableHead>
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Program Studi
                      </TableHead>
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Tanggal Pengajuan
                      </TableHead>
                      <TableHead className="h-8 min-w-28 px-4 text-center text-[10px] font-bold text-[#244934]">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={`${row.serviceSlug}-${row.id}`}
                        className="border-b border-[#ece7dc] bg-white transition-colors hover:bg-[#f8faf6]"
                      >
                        <TableCell className="min-w-0 px-4 py-3 text-[11px] font-semibold text-[#202923]">
                          <TruncatedTableText value={row.serviceTitle} />
                        </TableCell>
                        <TableCell className="min-w-0 px-4 py-3 text-[11px] font-semibold text-[#303b34]">
                          <TruncatedTableText value={row.requesterName} />
                        </TableCell>
                        <TableCell className="min-w-0 px-4 py-3 text-[11px] text-[#303b34]">
                          <TruncatedTableText value={row.programStudy} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[11px] whitespace-nowrap text-[#303b34]">
                          {formatDate(row.requestDate)}
                        </TableCell>
                        <TableCell className="w-28 min-w-28 px-4 py-3 text-center whitespace-nowrap">
                          <Button
                            asChild
                            size="sm"
                            className="admin-action-button h-8 rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
                          >
                            <Link href={buildRequestPreviewHref(row)}>
                              Proses
                              <ArrowRight className="size-3.5" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)]">
          <div className="border-b border-[#eee6d9] bg-[#fffdf9] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#173d2d]">
              Prioritas Tindak Lanjut
            </h2>
            <p className="mt-1 text-[11px] text-[#7a7166]">
              {isPriorityFilterActive
                ? "Daftar prioritas sudah mengikuti rentang tanggal pengajuan yang dipilih."
                : "Fokuskan proses ke pengajuan pending yang paling lama menunggu."}
            </p>
          </div>
          <div className="p-4">
            {dashboardError ? (
              <div className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-4 py-6 text-center text-sm text-[#8a3d23]">
                {dashboardError}
              </div>
            ) : (
              <RequestPriorityTable rows={priorityRows} role="staff" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
