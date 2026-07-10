import Link from "next/link";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminStatusBadge,
  AdminTableScroll,
} from "@/components/admin/admin-ui";
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
import {
  getDashboardSummary,
  getLatestPendingDashboardRequestsByDate,
  getPriorityDashboardRequests,
} from "@/lib/legacy-request-stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

type AdminDashboardPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const params = await searchParams;
  const [summary, priorityRows, latestRows] = await Promise.all([
    getDashboardSummary(),
    getPriorityDashboardRequests(12, {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
    getLatestPendingDashboardRequestsByDate({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
  ]);
  const isPriorityFilterActive = Boolean(params.dateFrom || params.dateTo);
  const metrics = [
    {
      label: "Total Pengajuan",
      value: summary.totalRequests,
      description: `${summary.totalServices} layanan aktif`,
      tone: "neutral" as const,
    },
    {
      label: "Menunggu Proses",
      value: summary.totalPending,
      description: "Belum masuk tahap proses",
      tone: "warning" as const,
    },
    {
      label: "Sedang Diproses",
      value: summary.totalInProgress,
      description: "Sudah diproses",
      tone: "info" as const,
    },
    {
      label: "Selesai",
      value: summary.totalCompleted,
      description: "Sudah memiliki tanggal selesai",
      tone: "success" as const,
    },
    {
      label: "Diambil/Dikirim",
      value: summary.totalDelivered,
      description: "Sudah diterima atau dikirim",
      tone: "success" as const,
    },
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Dashboard Admin"
        description="Ringkasan agregat read-only dari layanan ULT. Data pribadi pemohon tidak ditampilkan di dashboard."
        action={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
          >
            <Link href="/">Website Publik</Link>
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-[#e3d9ca] bg-white p-4 shadow-[0_2px_10px_rgba(47,38,20,0.08)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold text-[#7a7166]">
                {metric.label}
              </p>
              <AdminStatusBadge tone={metric.tone}>
                {metric.tone === "neutral" ? "Data" : "Status"}
              </AdminStatusBadge>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#173d2d]">
              {formatNumber(metric.value)}
            </p>
            <p className="mt-1 text-[11px] text-[#7a7166]">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      <AdminSectionCard
        title="Filter Prioritas"
        description="Saring antrean prioritas berdasarkan tanggal pengajuan agar request lama yang sudah kadaluarsa tidak ikut mendominasi daftar."
      >
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="grid gap-1.5">
            <label
              htmlFor="admin-priority-date-from"
              className="text-[11px] font-semibold text-[#5d665f]"
            >
              Dari tanggal
            </label>
            <Input
              id="admin-priority-date-from"
              name="dateFrom"
              type="date"
              defaultValue={params.dateFrom}
              className="h-9 w-[180px] rounded-md border-[#ddd4c6] bg-white"
            />
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="admin-priority-date-to"
              className="text-[11px] font-semibold text-[#5d665f]"
            >
              Sampai tanggal
            </label>
            <Input
              id="admin-priority-date-to"
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
              <Link href="/admin/dashboard">Reset</Link>
            </Button>
          </div>
          <div className="ml-auto flex items-center">
            <AdminStatusBadge tone={isPriorityFilterActive ? "warning" : "info"}>
              {isPriorityFilterActive ? "Filter tanggal aktif" : "Semua tanggal"}
            </AdminStatusBadge>
          </div>
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="Prioritas Tindak Lanjut"
        description={
          isPriorityFilterActive
            ? "Daftar prioritas sudah disaring berdasarkan rentang tanggal pengajuan yang dipilih."
            : "Daftar pengajuan pending yang paling lama menunggu dan sebaiknya diproses lebih dulu oleh admin."
        }
      >
        <RequestPriorityTable rows={priorityRows} role="admin" />
      </AdminSectionCard>

      <AdminSectionCard
        title="Pengajuan Baru Masuk"
        description={
          isPriorityFilterActive
            ? "Daftar pengajuan baru mengikuti rentang tanggal filter yang sama."
            : "Pantau permintaan terbaru yang belum masuk ke tahap proses."
        }
      >
        <div className="overflow-x-auto rounded-md border border-[#edf0e9]">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-[#eef3ec]">
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestRows.length > 0 ? (
                latestRows.map((row) => (
                  <TableRow key={`${row.serviceSlug}-${row.id}`}>
                    <TableCell className="font-medium">{row.serviceTitle}</TableCell>
                    <TableCell>{row.requesterName}</TableCell>
                    <TableCell>{row.programStudy}</TableCell>
                    <TableCell>
                      {row.requestDate
                        ? new Intl.DateTimeFormat("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(row.requestDate))
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        asChild
                        size="sm"
                        className="h-8 rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
                      >
                        <Link
                          href={`/admin/requests?service=${row.serviceSlug}&previewService=${row.serviceSlug}&previewId=${row.id}`}
                        >
                          Proses
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-[#6f746f]"
                  >
                    Belum ada pengajuan baru yang menunggu proses.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Ringkasan per Layanan"
        description="Count per tabel layanan yang sudah dipetakan secara aman."
      >
        <AdminTableScroll>
          <Table className="min-w-[900px]">
            <TableHeader className="bg-[#eef3ec]">
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Menunggu</TableHead>
                <TableHead className="text-right">Diproses</TableHead>
                <TableHead className="text-right">Selesai</TableHead>
                <TableHead className="text-right">Diambil/Dikirim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.services.map((service) => (
                <TableRow key={service.slug}>
                  <TableCell className="font-medium">{service.title}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(service.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(service.pending)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(service.inProgress)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(service.completed)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(service.delivered)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableScroll>
      </AdminSectionCard>
    </AdminPageShell>
  );
}
