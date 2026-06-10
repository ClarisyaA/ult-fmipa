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

const metrics = [
  { label: "Pengajuan masuk", value: "24", description: "Dummy minggu ini" },
  { label: "Dalam proses", value: "12", description: "Belum real-time" },
  { label: "Selesai", value: "38", description: "Data contoh" },
];

const recentRequests = [
  {
    id: "ULT-001",
    layanan: "Surat Keterangan Aktif Kuliah",
    pemohon: "Mahasiswa",
    status: "Baru",
  },
  {
    id: "ULT-002",
    layanan: "Legalisir Ijazah dan Transkrip",
    pemohon: "Alumni",
    status: "Diproses",
  },
  {
    id: "ULT-003",
    layanan: "Peminjaman Ruangan/Laboratorium",
    pemohon: "Unit akademik",
    status: "Menunggu verifikasi",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Dashboard Admin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ringkasan statis untuk fondasi dashboard admin ULT.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {metric.description}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pengajuan terbaru</CardTitle>
          <CardDescription>
            Tabel placeholder memakai data dummy, belum terhubung ke database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{request.layanan}</TableCell>
                  <TableCell>{request.pemohon}</TableCell>
                  <TableCell>{request.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
