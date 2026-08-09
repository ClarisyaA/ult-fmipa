import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedTableText } from "@/components/ui/truncated-table-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SurveySummary } from "@/lib/service-surveys";
import Link from "next/link";

type SurveySummaryViewProps = {
  title: string;
  description: string;
  summary: SurveySummary;
  serviceOptions?: Array<{
    slug: string;
    title: string;
  }>;
  search?: string;
  selectedServiceSlug?: string;
  exportBasePath?: string;
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

function buildSurveyHref({
  search,
  service,
  page,
}: {
  search?: string;
  service?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("q", search.trim());
  }

  if (service?.trim()) {
    params.set("service", service.trim());
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `?${query}` : "?";
}

function buildExportHref({
  exportBasePath,
  search,
  service,
}: {
  exportBasePath?: string;
  search: string;
  service: string;
}) {
  if (!exportBasePath) {
    return "#";
  }

  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("q", search.trim());
  }

  if (service.trim()) {
    params.set("service", service.trim());
  }

  const query = params.toString();

  return query ? `${exportBasePath}?${query}` : exportBasePath;
}

export function SurveySummaryView({
  title,
  description,
  summary,
  serviceOptions = [],
  search = "",
  selectedServiceSlug = "",
  exportBasePath,
}: SurveySummaryViewProps) {
  const pagination = summary.commentsPagination;
  const exportHref = buildExportHref({
    exportBasePath,
    search,
    service: selectedServiceSlug,
  });
  const metrics = [
    {
      label: "Total Respons",
      value: summary.totalCount,
    },
    {
      label: "Rata-rata Keseluruhan",
      value: formatRating(summary.averageOverallRating),
    },
    {
      label: "Tangibility",
      value: formatRating(summary.averageTangibility),
    },
    {
      label: "Reliability",
      value: formatRating(summary.averageReliability),
    },
    {
      label: "Responsiveness",
      value: formatRating(summary.averageResponsiveness),
    },
    {
      label: "Assurance",
      value: formatRating(summary.averageAssurance),
    },
    {
      label: "Empathy",
      value: formatRating(summary.averageEmpathy),
    },
  ];

  return (
    <div className="grid gap-4 sm:gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#173d2d] sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>

      {serviceOptions.length > 0 ? (
        <form className="grid grid-cols-1 gap-3 rounded-lg border border-[#e8dfd0] bg-white p-3 shadow-sm sm:flex sm:flex-wrap sm:items-end sm:p-4">
          <input type="hidden" name="page" value="1" />
          <label className="grid w-full min-w-0 flex-1 gap-1 text-xs font-semibold text-[#5d665f] sm:min-w-[200px]">
            Search
            <Input
              name="q"
              defaultValue={search}
              placeholder="Cari layanan atau komentar..."
              className="h-9 w-full min-w-0 border-[#e1d8ca] bg-white text-xs sm:text-sm"
            />
          </label>
          <label className="grid w-full min-w-0 gap-1 text-xs font-semibold text-[#5d665f] sm:w-auto sm:min-w-[180px]">
            Layanan
            <select
              name="service"
              defaultValue={selectedServiceSlug}
              className="h-9 w-full min-w-0 max-w-full rounded-md border border-[#e1d8ca] bg-white px-3 text-xs text-[#303b34] outline-none focus:border-[#0f3d2e] focus:ring-1 focus:ring-[#0f3d2e] sm:text-sm"
            >
              <option value="">Semua Layanan</option>
              {serviceOptions.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <Button
              type="submit"
              className="h-9 flex-1 shrink-0 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39] sm:flex-initial"
            >
              Terapkan
            </Button>
            {exportBasePath ? (
              <Button
                asChild
                variant="outline"
                className="h-9 flex-1 shrink-0 whitespace-nowrap rounded-md border-[#e1d8ca] bg-white px-4 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8] sm:flex-initial"
              >
                <Link href={exportHref}>Download CSV</Link>
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7"
        data-tour="admin-survey-summary"
      >
        {metrics.map((metric, index) => (
          <Card
            key={metric.label}
            className={`min-w-0 rounded-lg border border-[#e8dfd0] bg-white p-3.5 shadow-sm sm:p-4 ${
              index === metrics.length - 1 && metrics.length % 2 !== 0
                ? "col-span-2 sm:col-span-1"
                : ""
            }`}
          >
            <CardHeader className="p-0">
              <CardDescription className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
                {metric.label}
              </CardDescription>
              <CardTitle className="mt-1 truncate text-lg font-bold tracking-tight text-[#173d2d] sm:text-2xl lg:text-3xl">
                {metric.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="rounded-lg border border-[#e8dfd0] shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base font-semibold sm:text-lg">
            Komentar terbaru
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Komentar ditampilkan tanpa membuka data master mahasiswa/alumni.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {summary.totalCount === 0 ? (
            <div className="rounded-md border border-[#eee6d9] bg-[#fbf9f5] p-5 text-center text-xs text-muted-foreground sm:text-sm">
              Belum ada survei yang masuk.
            </div>
          ) : summary.recentComments.length === 0 ? (
            <div className="rounded-md border border-[#eee6d9] bg-[#fbf9f5] p-5 text-center text-xs text-muted-foreground sm:text-sm">
              Tidak ada komentar yang cocok dengan filter saat ini.
            </div>
          ) : (
            <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-md border border-[#eee6d9]">
              <Table className="w-full min-w-[650px] table-fixed">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[42%]" />
                </colgroup>
                <TableHeader className="bg-[#fcfaf7]">
                  <TableRow>
                    <TableHead className="text-xs">Layanan</TableHead>
                    <TableHead className="text-right text-xs">Rating</TableHead>
                    <TableHead className="text-right text-xs">Tanggal</TableHead>
                    <TableHead className="text-xs">Komentar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recentComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="min-w-0 text-xs font-medium sm:text-sm">
                        <TruncatedTableText value={comment.serviceTitle} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-xs font-semibold text-[#0f5b45] sm:text-sm">
                        {comment.overallRating}/5
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground sm:text-sm">
                        {formatDate(comment.createdAt)}
                      </TableCell>
                      <TableCell className="min-w-0 text-xs sm:text-sm">
                        <TruncatedTableText value={comment.comment} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-3 border-t border-[#eee6d9] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {pagination.total === 0
                ? "Tidak ada komentar yang cocok."
                : `Menampilkan halaman ${pagination.page} dari ${pagination.totalPages}. Total ${pagination.total} komentar.`}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                asChild={pagination.page > 1}
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                className="h-8 flex-1 rounded-md border-[#e1d8ca] bg-white px-3 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8] sm:flex-initial"
              >
                {pagination.page > 1 ? (
                  <Link
                    href={buildSurveyHref({
                      search,
                      service: selectedServiceSlug,
                      page: pagination.page - 1,
                    })}
                  >
                    Sebelumnya
                  </Link>
                ) : (
                  "Sebelumnya"
                )}
              </Button>
              <Button
                asChild={pagination.page < pagination.totalPages}
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 flex-1 rounded-md border-[#e1d8ca] bg-white px-3 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8] sm:flex-initial"
              >
                {pagination.page < pagination.totalPages ? (
                  <Link
                    href={buildSurveyHref({
                      search,
                      service: selectedServiceSlug,
                      page: pagination.page + 1,
                    })}
                  >
                    Berikutnya
                  </Link>
                ) : (
                  "Berikutnya"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-[#e8dfd0] shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base font-semibold sm:text-lg">
            Breakdown per layanan
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Ringkasan jumlah respons dan rating keseluruhan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {summary.serviceBreakdown.length === 0 ? (
            <div className="rounded-md border border-[#eee6d9] bg-[#fbf9f5] p-5 text-center text-xs text-muted-foreground sm:text-sm">
              Belum ada survei yang masuk.
            </div>
          ) : (
            <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-md border border-[#eee6d9]">
              <Table className="w-full min-w-[500px] table-fixed">
                <colgroup>
                  <col className="w-[60%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <TableHeader className="bg-[#fcfaf7]">
                  <TableRow>
                    <TableHead className="text-xs">Layanan</TableHead>
                    <TableHead className="text-right text-xs">Respons</TableHead>
                    <TableHead className="text-right text-xs">Rata-rata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.serviceBreakdown.map((service) => (
                    <TableRow key={service.serviceSlug}>
                      <TableCell className="min-w-0 text-xs font-medium sm:text-sm">
                        <TruncatedTableText value={service.serviceTitle} />
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold sm:text-sm">
                        {service.totalCount}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-[#0f5b45] sm:text-sm">
                        {formatRating(service.averageOverallRating)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
