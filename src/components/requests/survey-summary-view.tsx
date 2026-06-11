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
import type { SurveySummary } from "@/lib/service-surveys";

type SurveySummaryViewProps = {
  title: string;
  description: string;
  summary: SurveySummary;
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

export function SurveySummaryView({
  title,
  description,
  summary,
}: SurveySummaryViewProps) {
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Komentar terbaru</CardTitle>
          <CardDescription>
            Komentar ditampilkan tanpa membuka data master mahasiswa/alumni.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {summary.totalCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada survei yang masuk.
            </p>
          ) : summary.recentComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada komentar terbaru.
            </p>
          ) : (
            summary.recentComments.map((comment) => (
              <div key={comment.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{comment.serviceTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {comment.overallRating}/5 - {formatDate(comment.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {comment.comment}
                </p>
              </div>
            ))
          )}
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
          <Table>
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
                    <TableCell className="font-medium">
                      {service.serviceTitle}
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
        </CardContent>
      </Card>
    </div>
  );
}
