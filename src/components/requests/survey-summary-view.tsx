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
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>

      {serviceOptions.length > 0 ? (
        <form className="flex flex-wrap items-end gap-3 rounded-lg border border-[#e8dfd0] bg-white p-3 shadow-sm">
          <input type="hidden" name="page" value="1" />
          <label className="grid min-w-[220px] flex-1 gap-1 text-xs font-semibold text-[#5d665f]">
            Search
            <Input
              name="q"
              defaultValue={search}
              placeholder="Cari layanan atau komentar..."
              className="h-9 border-[#e1d8ca] bg-white text-sm"
            />
          </label>
          <label className="grid min-w-[190px] gap-1 text-xs font-semibold text-[#5d665f]">
            Layanan
            <select
              name="service"
              defaultValue={selectedServiceSlug}
              className="h-9 rounded-md border border-[#e1d8ca] bg-white px-3 text-sm text-[#303b34]"
            >
              <option value="">Semua Layanan</option>
              {serviceOptions.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.title}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="submit"
            className="h-9 shrink-0 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]"
          >
            Terapkan
          </Button>
          {exportBasePath ? (
            <Button
              asChild
              variant="outline"
              className="h-9 shrink-0 whitespace-nowrap rounded-md border-[#e1d8ca] bg-white px-4 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
            >
              <Link href={exportHref}>Download CSV</Link>
            </Button>
          ) : null}
        </form>
      ) : null}

      <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain px-1 pt-2 pb-3">
        <div
          className="flex w-max flex-nowrap gap-3"
          data-tour="admin-survey-summary"
        >
          {metrics.map((metric) => (
            <Card key={metric.label} className="w-[240px] shrink-0">
              <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-3xl">{metric.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Komentar terbaru</CardTitle>
          <CardDescription>
            Komentar ditampilkan tanpa membuka data master mahasiswa/alumni.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
            <Table className="min-w-[900px] table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[10%]" />
                <col className="w-[16%]" />
                <col className="w-[46%]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>Layanan</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Tanggal</TableHead>
                  <TableHead>Komentar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.totalCount === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Belum ada survei yang masuk.
                    </TableCell>
                  </TableRow>
                ) : summary.recentComments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Tidak ada komentar yang cocok dengan filter saat ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.recentComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="min-w-0 font-medium">
                        <TruncatedTableText value={comment.serviceTitle} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {comment.overallRating}/5
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatDate(comment.createdAt)}
                      </TableCell>
                      <TableCell className="min-w-0">
                        <TruncatedTableText value={comment.comment} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-[#eee6d9] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {pagination.total === 0
                ? "Tidak ada komentar yang cocok."
                : `Menampilkan halaman ${pagination.page} dari ${pagination.totalPages}. Total ${pagination.total} komentar.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild={pagination.page > 1}
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
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
                className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
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

      <Card>
        <CardHeader>
          <CardTitle>Breakdown per layanan</CardTitle>
          <CardDescription>
            Ringkasan jumlah respons dan rating keseluruhan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
          <Table className="min-w-[800px] table-fixed">
            <colgroup>
              <col className="w-[64%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead className="text-right">Respons</TableHead>
                <TableHead className="text-right">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.serviceBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Belum ada survei yang masuk.
                  </TableCell>
                </TableRow>
              ) : (
                summary.serviceBreakdown.map((service) => (
                  <TableRow key={service.serviceSlug}>
                    <TableCell className="min-w-0 font-medium">
                      <TruncatedTableText value={service.serviceTitle} />
                    </TableCell>
                    <TableCell className="text-right">
                      {service.totalCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatRating(service.averageOverallRating)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
