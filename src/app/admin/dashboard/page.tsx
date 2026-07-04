import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
import { getDashboardSummary } from "@/lib/legacy-request-stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function AdminDashboardPage() {
  const summary = await getDashboardSummary();
  const metrics = [
    {
      label: "Total Pengajuan",
      value: summary.totalRequests,
      description: `${summary.totalServices} layanan aktif`,
      accent: "",
    },
    {
      label: "Menunggu Proses",
      value: summary.totalPending,
      description: "Belum masuk tahap proses",
      accent: "text-[#EE1C25]",
    },
    {
      label: "Sedang Diproses",
      value: summary.totalInProgress,
      description: "Sudah diproses, belum selesai",
      accent: "text-[#FCB71B]",
    },
    {
      label: "Selesai",
      value: summary.totalCompleted,
      description: "Sudah memiliki tanggal selesai",
      accent: "text-[#03B36B]",
    },
    {
      label: "Diambil/Dikirim",
      value: summary.totalDelivered,
      description: "Sudah diterima atau dikirim",
      accent: "text-[#03B36B]",
    },
  ];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        section="Overview"
        title="Dashboard Admin"
        description="Ringkasan agregat read-only dari seluruh layanan ULT FMIPA Unpad."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className={`text-3xl ${metric.accent}`}>
                {formatNumber(metric.value)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {metric.description}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan per Layanan</CardTitle>
          <CardDescription>
            Angka agregat per tabel layanan yang sudah dipetakan secara aman.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
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
                    <TableCell className="font-medium">
                      {service.title}
                    </TableCell>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
