"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Clock,
  Download,
  FileCheck,
  Layers,
  Package,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// ---------------------------------------------------------------------------
// Types matching server helpers
// ---------------------------------------------------------------------------

type ServiceReportRow = {
  serviceTitle: string;
  serviceSlug: string;
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  delivered: number;
};

type ServiceReport = {
  rows: ServiceReportRow[];
  totalAll: number;
  totalPending: number;
  totalInProgress: number;
  totalCompleted: number;
  totalDelivered: number;
};

type StaffPerformanceRow = {
  staffName: string;
  processed: number;
  completed: number;
};

// ---------------------------------------------------------------------------
// CSV download helper
// ---------------------------------------------------------------------------

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

// ---------------------------------------------------------------------------
// Simple CSS bar chart component
// ---------------------------------------------------------------------------

function BarChartSimple({
  data,
}: {
  data: { label: string; value: number; maxValue: number }[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct =
          item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0;
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-32 truncate text-xs font-medium text-muted-foreground">
              {item.label}
            </span>
            <div className="flex-1">
              <div className="h-7 w-full overflow-hidden rounded-lg bg-muted/50">
                <div
                  className="flex h-full items-center rounded-lg bg-[#03B36B]/20 px-2 text-xs font-semibold text-[#03B36B] transition-all duration-500"
                  style={{ width: `${Math.max(pct, 8)}%` }}
                >
                  {fmt(item.value)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Report Page
// ---------------------------------------------------------------------------

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("layanan");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // Service report state
  const [serviceReport, setServiceReport] = useState<ServiceReport | null>(
    null
  );
  const [serviceLoading, setServiceLoading] = useState(false);

  // Staff perf state
  const [staffData, setStaffData] = useState<StaffPerformanceRow[] | null>(
    null
  );
  const [staffLoading, setStaffLoading] = useState(false);

  // Read tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["layanan", "staf", "unit"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Fetch service report
  const fetchServiceReport = useCallback(async () => {
    setServiceLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/admin/reports/service?${params}`);
      if (res.ok) {
        setServiceReport(await res.json());
      }
    } catch {
      // Silently handle
    } finally {
      setServiceLoading(false);
    }
  }, [dateFrom, dateTo]);

  // Fetch staff performance
  const fetchStaffPerf = useCallback(async () => {
    setStaffLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/admin/reports/staff?${params}`);
      if (res.ok) {
        setStaffData(await res.json());
      }
    } catch {
      // Silently handle
    } finally {
      setStaffLoading(false);
    }
  }, [dateFrom, dateTo]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchServiceReport();
    fetchStaffPerf();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => {
    if (activeTab === "layanan") fetchServiceReport();
    else if (activeTab === "staf") fetchStaffPerf();
  };

  // Filtered rows
  const filteredServiceRows = useMemo(() => {
    if (!serviceReport) return [];
    if (!search.trim()) return serviceReport.rows;
    const q = search.toLowerCase();
    return serviceReport.rows.filter((r) =>
      r.serviceTitle.toLowerCase().includes(q)
    );
  }, [serviceReport, search]);

  const filteredStaffRows = useMemo(() => {
    if (!staffData) return [];
    if (!search.trim()) return staffData;
    const q = search.toLowerCase();
    return staffData.filter((r) => r.staffName.toLowerCase().includes(q));
  }, [staffData, search]);

  // CSV downloads
  const downloadServiceCsv = () => {
    downloadCsv(
      "report-layanan.csv",
      ["Layanan", "Total", "Menunggu", "Diproses", "Selesai", "Diambil/Dikirim"],
      filteredServiceRows.map((r) => [
        r.serviceTitle,
        String(r.total),
        String(r.pending),
        String(r.inProgress),
        String(r.completed),
        String(r.delivered),
      ])
    );
  };

  const downloadStaffCsv = () => {
    downloadCsv(
      "kinerja-staf.csv",
      ["Staf", "Diproses", "Diselesaikan"],
      filteredStaffRows.map((r) => [
        r.staffName,
        String(r.processed),
        String(r.completed),
      ])
    );
  };

  const maxStaffProcessed = useMemo(
    () =>
      filteredStaffRows.reduce((m, r) => Math.max(m, r.processed), 0),
    [filteredStaffRows]
  );

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        section="Reporting"
        title="Laporan & Analisis"
        description="Lihat rekapitulasi layanan, kinerja staf, dan kinerja unit ULT/SBAK FMIPA Unpad."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="layanan" className="gap-1.5">
            <ClipboardList className="size-3.5" />
            Report Layanan
          </TabsTrigger>
          <TabsTrigger value="staf" className="gap-1.5">
            <Users className="size-3.5" />
            Kinerja Staf
          </TabsTrigger>
          <TabsTrigger value="unit" className="gap-1.5">
            <Layers className="size-3.5" />
            Kinerja Unit
          </TabsTrigger>
        </TabsList>

        {/* ── Report Layanan ─────────────────────────────────── */}
        <TabsContent value="layanan" className="mt-4 grid gap-4">
          {/* Filters */}
          <div className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Dari Tanggal
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Sampai Tanggal
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Pencarian
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari layanan..."
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={handleApply} size="sm" className="h-9">
                Tampilkan
              </Button>
              <Button
                onClick={downloadServiceCsv}
                variant="outline"
                size="sm"
                className="h-9"
                disabled={filteredServiceRows.length === 0}
              >
                <Download className="mr-1.5 size-3.5" />
                Download Data
              </Button>
            </div>
          </div>

          {/* Metric cards */}
          {serviceReport && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Total Pengajuan",
                  value: serviceReport.totalAll,
                  icon: Package,
                  color: "text-foreground",
                },
                {
                  label: "Menunggu",
                  value: serviceReport.totalPending,
                  icon: Clock,
                  color: "text-[#EE1C25]",
                },
                {
                  label: "Diproses",
                  value: serviceReport.totalInProgress,
                  icon: TrendingUp,
                  color: "text-[#FCB71B]",
                },
                {
                  label: "Selesai",
                  value: serviceReport.totalCompleted,
                  icon: FileCheck,
                  color: "text-[#03B36B]",
                },
                {
                  label: "Diambil/Dikirim",
                  value: serviceReport.totalDelivered,
                  icon: Package,
                  color: "text-[#03B36B]",
                },
              ].map((m) => (
                <Card key={m.label}>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-1.5">
                      <m.icon className="size-3.5" />
                      {m.label}
                    </CardDescription>
                    <CardTitle className={`text-3xl ${m.color}`}>
                      {fmt(m.value)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detail per Layanan</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Memuat data...
                </p>
              ) : filteredServiceRows.length === 0 ? (
                <AdminEmptyState
                  icon={<ClipboardList className="size-8" />}
                  title="Tidak ada data layanan"
                  description="Coba ubah filter tanggal atau kata kunci pencarian."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Layanan</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Menunggu</TableHead>
                        <TableHead className="text-right">Diproses</TableHead>
                        <TableHead className="text-right">Selesai</TableHead>
                        <TableHead className="text-right">
                          Diambil/Dikirim
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServiceRows.map((row) => (
                        <TableRow key={row.serviceSlug}>
                          <TableCell className="font-medium">
                            {row.serviceTitle}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(row.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(row.pending)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(row.inProgress)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(row.completed)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(row.delivered)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Kinerja Staf ───────────────────────────────────── */}
        <TabsContent value="staf" className="mt-4 grid gap-4">
          <div className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Dari Tanggal
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Sampai Tanggal
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Pencarian
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari staf..."
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={handleApply} size="sm" className="h-9">
                Tampilkan
              </Button>
              <Button
                onClick={downloadStaffCsv}
                variant="outline"
                size="sm"
                className="h-9"
                disabled={filteredStaffRows.length === 0}
              >
                <Download className="mr-1.5 size-3.5" />
                Download Data
              </Button>
            </div>
          </div>

          {/* Bar chart */}
          {filteredStaffRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-4" />
                  Grafik Kinerja Staf
                </CardTitle>
                <CardDescription>
                  Jumlah pengajuan yang diproses oleh masing-masing staf.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartSimple
                  data={filteredStaffRows.slice(0, 15).map((r) => ({
                    label: r.staffName,
                    value: r.processed,
                    maxValue: maxStaffProcessed,
                  }))}
                />
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Kinerja Staf</CardTitle>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Memuat data...
                </p>
              ) : filteredStaffRows.length === 0 ? (
                <AdminEmptyState
                  icon={<Users className="size-8" />}
                  title="Data kinerja staf belum tersedia"
                  description="Belum ada data staf yang tercatat memproses pengajuan layanan."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Staf</TableHead>
                        <TableHead className="text-right">
                          Diproses
                        </TableHead>
                        <TableHead className="text-right">
                          Diselesaikan
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaffRows.map((row) => (
                        <TableRow key={row.staffName}>
                          <TableCell className="font-medium">
                            {row.staffName}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(row.processed)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmt(row.completed)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Kinerja Unit ───────────────────────────────────── */}
        <TabsContent value="unit" className="mt-4 grid gap-4">
          <div className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Dari Tanggal
                </label>
                <Input type="date" disabled />
              </div>
              <div className="w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Sampai Tanggal
                </label>
                <Input type="date" disabled />
              </div>
              <Button size="sm" className="h-9" disabled>
                Tampilkan
              </Button>
              <Button variant="outline" size="sm" className="h-9" disabled>
                <Download className="mr-1.5 size-3.5" />
                Segera hadir
              </Button>
            </div>
          </div>

          <AdminEmptyState
            icon={<Layers className="size-8" />}
            title="Data unit belum tersedia"
            description="Pencatatan kinerja per unit belum aktif pada sistem saat ini. Data akan tersedia setelah integrasi unit selesai."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
