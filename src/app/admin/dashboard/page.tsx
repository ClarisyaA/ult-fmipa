import Link from "next/link";

import { Button } from "@/components/ui/button";
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
      description: `${summary.totalServices} layanan aktif dihitung`,
    },
    {
      label: "Menunggu Proses",
      value: summary.totalPending,
      description: "Belum masuk tahap proses",
    },
    {
      label: "Sedang Diproses",
      value: summary.totalInProgress,
      description: "Sudah diproses, belum selesai",
    },
    {
      label: "Selesai",
      value: summary.totalCompleted,
      description: "Sudah memiliki tanggal selesai",
    },
    {
      label: "Diambil/Dikirim",
      value: summary.totalDelivered,
      description: "Sudah diterima atau dikirim",
    },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Dashboard Admin
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ringkasan agregat read-only dari tabel layanan legacy. Tidak ada data
            pemohon yang ditampilkan.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Lihat Website Publik</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">
                {formatNumber(metric.value)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {metric.description}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan per layanan</CardTitle>
          <CardDescription>
            Count per tabel layanan yang sudah dipetakan secara aman.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
