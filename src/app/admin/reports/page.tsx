import Link from "next/link";

import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminStatusBadge,
  AdminTableScroll,
  AdminUnavailableState,
} from "@/components/admin/admin-ui";
import { CsvDownloadButton } from "@/components/admin/csv-download-button";
import { PerformanceRankingChart } from "@/components/admin/performance-ranking-chart";
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
  getPerformanceSummary,
} from "@/lib/legacy-request-stats";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";
import { getPublicServices } from "@/lib/legacy-services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReportsPageProps = {
  searchParams: Promise<{
    tab?: string;
    service?: string;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
  }>;
};

const tabs = [
  { value: "layanan", label: "Report Layanan" },
  { value: "staf", label: "Kinerja Staf" },
  { value: "unit", label: "Kinerja Unit" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function AdminReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;
  const activeTab = tabs.some((tab) => tab.value === params.tab)
    ? params.tab
    : "layanan";
  const services = getPublicServices();
  const activeService = services.some(
    (service) => service.slug === params.service,
  )
    ? params.service
    : undefined;
  let summary: Awaited<ReturnType<typeof getDashboardSummary>> | null = null;
  let performance: Awaited<ReturnType<typeof getPerformanceSummary>> | null =
    null;
  let unavailable = false;

  try {
    summary = await getDashboardSummary({
      service: activeTab === "layanan" ? activeService : undefined,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      q: activeTab === "layanan" ? params.q : undefined,
    });
    performance =
      activeTab === "layanan"
        ? null
        : await getPerformanceSummary({
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            q: params.q,
          });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:reports", error);
  }
  const performanceRanking =
    activeTab === "staf"
      ? (performance?.staff ?? []).map((staff) => ({
          key: staff.userName,
          label: staff.fullName,
          subtitle: staff.unitName,
          total: staff.total,
        }))
      : (performance?.units ?? []).map((unit) => ({
          key: unit.unitName,
          label: unit.unitName,
          subtitle: `${unit.staffCount} staf`,
          total: unit.total,
        }));
  const topPerformance = performanceRanking.slice(0, 3);
  const performanceChartRows = performanceRanking;
  const topServices = [...(summary?.services ?? [])]
    .sort((left, right) => right.total - left.total)
    .slice(0, 3);
  const isAllData =
    !activeService && !params.dateFrom && !params.dateTo && !params.q?.trim();
  const reportRows =
    activeTab === "layanan"
      ? (summary?.services ?? []).map((service) => ({
          Layanan: service.title,
          Total: service.total,
          Menunggu: service.pending,
          Diproses: service.inProgress,
          Selesai: service.completed,
          "Diambil/Dikirim": service.delivered,
        }))
      : activeTab === "staf"
        ? (performance?.staff ?? []).map((staff) => ({
            Staf: staff.fullName,
            Username: staff.userName,
            Unit: staff.unitName,
            "Total Aktivitas": staff.total,
            "Proses/Verifikasi": staff.processed,
            Selesai: staff.completed,
            "Diambil/Dikirim": staff.delivered,
          }))
        : (performance?.units ?? []).map((unit) => ({
            Unit: unit.unitName,
            "Jumlah Staf": unit.staffCount,
            "Total Aktivitas": unit.total,
            "Proses/Verifikasi": unit.processed,
            Selesai: unit.completed,
            "Diambil/Dikirim": unit.delivered,
          }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Reporting"
        description="Laporan operasional berbasis data layanan yang sudah tersedia. Download dan grafik lanjutan disiapkan bertahap tanpa data palsu."
      />

      <AdminSectionCard>
        <div className="flex gap-5 overflow-x-auto border-b border-[#eee6d9] pb-0">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/reports?tab=${tab.value}`}
              className={`h-9 shrink-0 border-b-2 text-[12px] font-semibold ${
                activeTab === tab.value
                  ? "border-[#0f5b45] text-[#0f5b45]"
                  : "border-transparent text-[#606860] hover:text-[#0f5b45]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form
          action="/admin/reports"
          method="get"
          className="mt-4 rounded-md border border-[#e8dfd0] bg-[#fffdf9] p-3"
        >
          <input type="hidden" name="tab" value={activeTab} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]">
            <div className="grid min-w-0 gap-1">
              <label className="text-[11px] font-semibold text-[#7a7166]">
                Tanggal mulai
              </label>
              <Input
                type="date"
                name="dateFrom"
                defaultValue={params.dateFrom ?? ""}
                className="h-9 border-[#e1d8ca] bg-white"
              />
            </div>
            <div className="grid min-w-0 gap-1">
              <label className="text-[11px] font-semibold text-[#7a7166]">
                Tanggal selesai
              </label>
              <Input
                type="date"
                name="dateTo"
                defaultValue={params.dateTo ?? ""}
                className="h-9 border-[#e1d8ca] bg-white"
              />
            </div>
            {activeTab === "layanan" ? (
              <div className="grid min-w-0 gap-1">
                <label className="text-[11px] font-semibold text-[#7a7166]">
                  Jenis layanan
                </label>
                <select
                  name="service"
                  defaultValue={activeService ?? "all"}
                  className="h-9 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm text-[#303b34]"
                >
                  <option value="all">Semua layanan</option>
                  {services.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid min-w-0 gap-1">
                <label className="text-[11px] font-semibold text-[#7a7166]">
                  Tampilan
                </label>
                <select className="h-9 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm text-[#303b34]">
                  <option>Grafik</option>
                  <option>Tabel</option>
                </select>
              </div>
            )}
            <div className="grid min-w-0 gap-1">
              <label className="text-[11px] font-semibold text-[#7a7166]">
                {activeTab === "layanan"
                  ? "Pencarian layanan"
                  : activeTab === "staf"
                    ? "Pencarian staf atau unit"
                    : "Pencarian unit"}
              </label>
              <Input
                name="q"
                placeholder={
                  activeTab === "layanan"
                    ? "Cari layanan..."
                    : "Cari nama staf atau unit..."
                }
                defaultValue={params.q ?? ""}
                className="h-9 border-[#e1d8ca] bg-white"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="submit"
              className="h-9 w-full rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39] sm:w-auto"
            >
              Tampilkan
            </Button>
            <Button
              asChild
              type="button"
              variant="outline"
              className="h-9 w-full rounded-md border-[#d8cdbd] bg-white px-4 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8] sm:w-auto"
            >
              <Link href={`/admin/reports?tab=${activeTab}`}>
                Tampilkan Semua
              </Link>
            </Button>
            <CsvDownloadButton
              filename={
                activeTab === "layanan"
                  ? "report-layanan.csv"
                  : `report-${activeTab}.csv`
              }
              rows={reportRows}
              className="h-9 w-full justify-center rounded-md border-[#e1d8ca] bg-white px-3 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8] sm:w-auto"
            />
          </div>
        </form>
      </AdminSectionCard>

      {activeTab === "layanan" ? (
        <AdminSectionCard
          title="Report Layanan"
          description="Ringkasan jumlah pengajuan per layanan dari tabel yang sudah dipetakan."
        >
          {unavailable || !summary ? (
            <AdminUnavailableState />
          ) : (
          <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone={isAllData ? "success" : "info"}>
              {isAllData ? "Menampilkan semua data" : "Filter aktif"}
            </AdminStatusBadge>
            <span className="text-[11px] text-[#7a7166]">
              Tanggal kosong berarti seluruh periode data.
            </span>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-md border border-[#e3d9ca] bg-[#fffdf9] p-4">
              <p className="text-[11px] font-semibold text-[#7a7166]">
                Total Pengajuan
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#173d2d]">
                {formatNumber(summary.totalRequests)}
              </p>
            </div>
            <div className="rounded-md border border-[#e3d9ca] bg-[#fffdf9] p-4">
              <p className="text-[11px] font-semibold text-[#7a7166]">
                Menunggu
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#745411]">
                {formatNumber(summary.totalPending)}
              </p>
            </div>
            <div className="rounded-md border border-[#e3d9ca] bg-[#fffdf9] p-4">
              <p className="text-[11px] font-semibold text-[#7a7166]">
                Diproses
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#285b7c]">
                {formatNumber(summary.totalInProgress)}
              </p>
            </div>
            <div className="rounded-md border border-[#e3d9ca] bg-[#fffdf9] p-4">
              <p className="text-[11px] font-semibold text-[#7a7166]">
                Selesai/Dikirim
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#2f6b44]">
                {formatNumber(summary.totalCompleted + summary.totalDelivered)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2">
              <h3 className="text-sm font-bold text-[#173d2d]">
                Top 3 Layanan
              </h3>
              <p className="text-[11px] text-[#7a7166]">
                Layanan dengan jumlah pengajuan tertinggi dari data yang sedang
                ditampilkan.
              </p>
            </div>
            {topServices.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {topServices.map((service, index) => (
                  <div
                    key={service.slug}
                    className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-md border border-[#dce6da] bg-[#f8fbf6] p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#0f3d2e] text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="truncate text-xs font-bold text-[#173d2d]"
                        title={service.title}
                      >
                        {service.title}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#2f6b44]">
                        {formatNumber(service.total)}
                      </p>
                      <p className="text-[10px] text-[#7a7166]">pengajuan</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="Tidak ada data"
                description="Tidak ada layanan yang sesuai dengan filter reporting."
              />
            )}
          </div>

          <AdminTableScroll>
            <Table className="min-w-[860px]">
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
          </>
          )}
        </AdminSectionCard>
      ) : (
        <AdminSectionCard
          title={activeTab === "staf" ? "Kinerja Staf" : "Kinerja Unit"}
          description="Agregasi aktivitas staf dan unit berdasarkan timestamp workflow pada data layanan."
        >
          {unavailable ? (
            <AdminUnavailableState />
          ) : (
          <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone="info">
              {params.dateFrom || params.dateTo || params.q?.trim()
                ? "Filter aktif"
                : "Menampilkan semua data"}
            </AdminStatusBadge>
            <span className="text-[11px] text-[#7a7166]">
              Proses, verifikasi, selesai, fakultas, universitas, dan diambil/dikirim
              dihitung dari timestamp staf yang tersimpan.
            </span>
          </div>
          {topPerformance.length > 0 ? (
            <div className="mb-5 rounded-md border border-[#e3ddd2] bg-[#fcfaf6] p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-[#173d2d]">
                  Top 3 {activeTab === "staf" ? "Kinerja Staf" : "Kinerja Unit"}
                </h3>
                <p className="mt-1 text-[11px] text-[#7a7166]">
                  Ringkasan cepat untuk ranking aktivitas tertinggi pada periode
                  filter saat ini.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {topPerformance.map((row, index) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#dce6da] bg-[#f8fbf6] px-3 py-2.5"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-[#0f3d2e] text-[11px] font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold text-[#173d2d]"
                        title={row.label}
                      >
                        {row.label}
                      </p>
                      <p className="truncate text-[11px] text-[#7a7166]">
                        {row.subtitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#2f6b44]">
                        {formatNumber(row.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {performanceChartRows.length > 0 ? (
            <div className="mb-5">
              <PerformanceRankingChart
                data={performanceChartRows}
                label={`Grafik Aktivitas ${
                  activeTab === "staf" ? "Staf" : "Unit"
                }`}
              />
            </div>
          ) : (
            <div className="mb-5">
              <AdminEmptyState
                title="Grafik belum tersedia"
                description="Belum ada data yang bisa divisualisasikan untuk filter ini."
              />
            </div>
          )}
          {activeTab === "staf" ? (
            <AdminTableScroll>
              <Table className="min-w-[900px]">
                <TableHeader className="bg-[#eef3ec]">
                  <TableRow>
                    <TableHead>Staf</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Total Aktivitas</TableHead>
                    <TableHead className="text-right">Proses/Verifikasi</TableHead>
                    <TableHead className="text-right">Selesai</TableHead>
                    <TableHead className="text-right">Diambil/Dikirim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(performance?.staff ?? []).map((staff) => (
                    <TableRow key={staff.userName}>
                      <TableCell>
                        <p className="font-medium">{staff.fullName}</p>
                        <p className="text-[11px] text-[#7a7166]">{staff.userName}</p>
                      </TableCell>
                      <TableCell>{staff.unitName}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(staff.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(staff.processed)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(staff.completed)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(staff.delivered)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableScroll>
          ) : (
            <AdminTableScroll>
              <Table className="min-w-[820px]">
                <TableHeader className="bg-[#eef3ec]">
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Jumlah Staf</TableHead>
                    <TableHead className="text-right">Total Aktivitas</TableHead>
                    <TableHead className="text-right">Proses/Verifikasi</TableHead>
                    <TableHead className="text-right">Selesai</TableHead>
                    <TableHead className="text-right">Diambil/Dikirim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(performance?.units ?? []).map((unit) => (
                    <TableRow key={unit.unitName}>
                      <TableCell className="font-medium">{unit.unitName}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(unit.staffCount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(unit.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(unit.processed)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(unit.completed)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(unit.delivered)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableScroll>
          )}
          </>
          )}
        </AdminSectionCard>
      )}
    </AdminPageShell>
  );
}
