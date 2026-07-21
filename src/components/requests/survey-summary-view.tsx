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

      <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-2">
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
            <Table className="min-w-[820px]">
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
                      Belum ada komentar terbaru.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.recentComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="font-medium">
                        {comment.serviceTitle}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {comment.overallRating}/5
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {formatDate(comment.createdAt)}
                      </TableCell>
                      <TableCell>{comment.comment}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
          <Table className="min-w-[800px]">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
