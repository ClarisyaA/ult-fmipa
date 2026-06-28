import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  PackageCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardSummary } from "@/lib/legacy-request-stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function StaffDashboardPage() {
  const summary = await getDashboardSummary();
  const metrics = [
    {
      label: "Total Pengajuan",
      value: summary.totalRequests,
      description: `${summary.totalServices} layanan aktif dihitung`,
      icon: FileText,
      accent: "bg-[#0f3d2e] text-white",
    },
    {
      label: "Menunggu Proses",
      value: summary.totalPending,
      description: "Belum masuk tahap proses",
      icon: Clock3,
      accent: "bg-[#fff8e6] text-[#745411]",
    },
    {
      label: "Sedang Diproses",
      value: summary.totalInProgress,
      description: "Sudah diproses, belum selesai",
      icon: Loader2,
      accent: "bg-[#edf7ff] text-[#285b7c]",
    },
    {
      label: "Selesai",
      value: summary.totalCompleted,
      description: "Sudah memiliki tanggal selesai",
      icon: CheckCircle2,
      accent: "bg-[#eef9f1] text-[#2f6b44]",
    },
    {
      label: "Diambil/Dikirim",
      value: summary.totalDelivered,
      description: "Sudah diterima atau dikirim",
      icon: PackageCheck,
      accent: "bg-[#f4f5fa] text-[#4e5566]",
    },
  ];

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
              Dashboard Staff
            </h1>
            <p className="mt-1 text-xs text-[#566258]">
              Pantau volume pengajuan dan progres layanan ULT secara ringkas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[10px] font-semibold text-[#39433c] shadow-sm hover:bg-[#f6f1e8]"
            >
              <Link href="/">
                <ExternalLink className="size-3.5" />
                Kunjungi website publik
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-6 grid max-w-[1320px] gap-3 px-4 pb-6 sm:px-6 lg:px-7">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white p-4 shadow-[0_2px_10px_rgba(47,38,20,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7a7166]">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold leading-none text-[#173d2d]">
                      {formatNumber(metric.value)}
                    </p>
                  </div>
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-md ${metric.accent}`}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-[11px] leading-5 text-[#657066]">
                  {metric.description}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6d9] bg-[#fffdf9] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#173d2d]">
                Ringkasan per Layanan
              </h2>
              <p className="mt-1 text-[11px] text-[#7a7166]">
                Agregat layanan tanpa menampilkan data pribadi pemohon.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
            >
              <Link href="/staff/requests">Buka daftar pengajuan</Link>
            </Button>
          </div>

          <div className="overflow-x-auto px-4 py-3">
            <Table className="min-w-[920px] table-fixed overflow-hidden rounded-md border border-[#edf0e9]">
              <colgroup>
                <col className="w-[36%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
              </colgroup>
              <TableHeader className="bg-[#eef3ec]">
                <TableRow className="border-[#dfe6dd] hover:bg-[#eef3ec]">
                  <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                    Layanan
                  </TableHead>
                  <TableHead className="h-8 px-4 text-right text-[10px] font-bold text-[#244934]">
                    Total
                  </TableHead>
                  <TableHead className="h-8 px-4 text-right text-[10px] font-bold text-[#244934]">
                    Menunggu
                  </TableHead>
                  <TableHead className="h-8 px-4 text-right text-[10px] font-bold text-[#244934]">
                    Diproses
                  </TableHead>
                  <TableHead className="h-8 px-4 text-right text-[10px] font-bold text-[#244934]">
                    Selesai
                  </TableHead>
                  <TableHead className="h-8 px-4 text-right text-[10px] font-bold text-[#244934]">
                    Diambil/Dikirim
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.services.map((service) => (
                  <TableRow
                    key={service.slug}
                    className="border-b border-[#ece7dc] bg-white transition-colors hover:bg-[#f8faf6]"
                  >
                    <TableCell className="px-4 py-3 text-[11px] font-semibold text-[#202923]">
                      {service.title}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-[11px] font-semibold text-[#28352c]">
                      {formatNumber(service.total)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-[11px] text-[#745411]">
                      {formatNumber(service.pending)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-[11px] text-[#285b7c]">
                      {formatNumber(service.inProgress)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-[11px] text-[#2f6b44]">
                      {formatNumber(service.completed)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-[11px] text-[#4e5566]">
                      {formatNumber(service.delivered)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
