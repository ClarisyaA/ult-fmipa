import { ClipboardList, MessageSquareText } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SurveySummary } from "@/lib/service-surveys";
import { getStaffSurveySummaryApiData } from "@/lib/staff-api-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const emptySummary: SurveySummary = {
  totalCount: 0,
  averageOverallRating: null,
  averageTangibility: null,
  averageReliability: null,
  averageResponsiveness: null,
  averageAssurance: null,
  averageEmpathy: null,
  recentComments: [],
  serviceBreakdown: [],
};

function formatRating(value: number | null) {
  return value === null ? "-" : value.toFixed(2);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function StaffSurveysPage() {
  const { data, error } = await getStaffSurveySummaryApiData();
  const summary = data ?? emptySummary;
  const metrics = [
    { label: "Total Respons", value: summary.totalCount },
    {
      label: "Rata-rata Keseluruhan",
      value: formatRating(summary.averageOverallRating),
    },
    { label: "Tangibility", value: formatRating(summary.averageTangibility) },
    { label: "Reliability", value: formatRating(summary.averageReliability) },
    {
      label: "Responsiveness",
      value: formatRating(summary.averageResponsiveness),
    },
    { label: "Assurance", value: formatRating(summary.averageAssurance) },
    { label: "Empathy", value: formatRating(summary.averageEmpathy) },
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
      <div className="relative z-0 overflow-hidden bg-transparent px-5 pb-8 pt-5 text-[#173d2d] sm:px-7 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
              Ringkasan Survei
            </h1>
            <p className="mt-1 text-xs text-[#566258]">
              {error ??
                "Pantau kepuasan layanan dari pengajuan yang sudah selesai."}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-4 grid max-w-[1320px] gap-3 px-4 pb-6 sm:px-6 lg:px-7">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="min-w-0 rounded-lg border border-[#e3d9ca] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(47,38,20,0.06)]"
            >
              <p className="text-[11px] font-semibold leading-snug text-[#7a7166]">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-semibold leading-none text-[#173d2d]">
                {metric.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="flex min-h-[230px] flex-col overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)] sm:min-h-[250px]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6d9] bg-[#fffdf9] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-[#173d2d]">
                  Komentar Terbaru
                </h2>
                <p className="mt-1 text-[11px] text-[#7a7166]">
                  Komentar ditampilkan tanpa menyertakan identitas pemohon.
                </p>
              </div>
              <MessageSquareText className="size-4 text-[#0f5b45]" />
            </div>

            <div className="grid flex-1 gap-2 px-4 py-3">
              {summary.totalCount === 0 ? (
                <div className="grid min-h-[120px] place-items-center rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-4 py-8 text-center text-sm text-[#6f746f]">
                  Belum ada survei yang masuk.
                </div>
              ) : summary.recentComments.length === 0 ? (
                <div className="grid min-h-[120px] place-items-center rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-4 py-8 text-center text-sm text-[#6f746f]">
                  Belum ada komentar terbaru.
                </div>
              ) : (
                summary.recentComments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-md border border-[#e3d9ca] bg-white p-3 shadow-[0_1px_4px_rgba(47,38,20,0.06)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-xs font-semibold leading-snug text-[#202923]">
                        {comment.serviceTitle}
                      </h3>
                      <span className="rounded-sm border border-[#e2d7b8] bg-[#fff8e6] px-2.5 py-0.5 text-[10px] font-semibold text-[#745411]">
                        {comment.overallRating}/5
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#7a7166]">
                      {formatDate(comment.createdAt)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#303b34]">
                      {comment.comment}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="flex min-h-[230px] flex-col overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)] sm:min-h-[250px]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6d9] bg-[#fffdf9] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-[#173d2d]">
                  Hasil Survei per Layanan
                </h2>
                <p className="mt-1 text-[11px] text-[#7a7166]">
                  Ringkasan jumlah respons dan rating keseluruhan.
                </p>
              </div>
              <ClipboardList className="size-4 text-[#0f5b45]" />
            </div>

            <div className="grid flex-1 gap-2 px-4 py-3 md:hidden">
              {summary.serviceBreakdown.length === 0 ? (
                <div className="grid min-h-[120px] place-items-center rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-4 py-8 text-center text-sm text-[#6f746f]">
                  Belum ada survei yang masuk.
                </div>
              ) : (
                summary.serviceBreakdown.map((service) => (
                  <div
                    key={service.serviceSlug}
                    className="rounded-md border border-[#e3d9ca] bg-white p-3 shadow-[0_1px_4px_rgba(47,38,20,0.06)]"
                  >
                    <p className="text-xs font-semibold leading-snug text-[#202923]">
                      {service.serviceTitle}
                    </p>
                    <div className="mt-3 grid grid-cols-[82px_minmax(0,1fr)] gap-2 text-xs">
                      <span className="text-[#7a7166]">Respons</span>
                      <span className="font-semibold text-[#303b34]">
                        {service.totalCount}
                      </span>
                      <span className="text-[#7a7166]">Rata-rata</span>
                      <span className="font-semibold text-[#303b34]">
                        {formatRating(service.averageOverallRating)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden flex-1 px-4 py-3 md:block">
              <Table className="w-full table-fixed overflow-hidden rounded-md border border-[#edf0e9]">
                <colgroup>
                  <col className="w-[58%]" />
                  <col className="w-[20%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <TableHeader className="bg-[#eef3ec]">
                  <TableRow className="border-[#dfe6dd] hover:bg-[#eef3ec]">
                    <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                      Layanan
                    </TableHead>
                    <TableHead className="h-8 px-4 text-right text-[10px] font-bold text-[#244934]">
                      Respons
                    </TableHead>
                    <TableHead className="h-8 px-4 text-right text-[10px] font-bold text-[#244934]">
                      Rata-rata
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.serviceBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-32 text-center text-sm text-[#6f746f]"
                      >
                        Belum ada survei yang masuk.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.serviceBreakdown.map((service) => (
                      <TableRow
                        key={service.serviceSlug}
                        className="border-b border-[#ece7dc] bg-white transition-colors hover:bg-[#f8faf6]"
                      >
                        <TableCell className="px-4 py-3 text-[11px] font-semibold leading-snug text-[#202923]">
                          {service.serviceTitle}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-[11px] text-[#303b34]">
                          {service.totalCount}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-[11px] font-semibold text-[#303b34]">
                          {formatRating(service.averageOverallRating)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
