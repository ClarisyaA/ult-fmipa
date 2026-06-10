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
  { label: "Tugas hari ini", value: "8", description: "Data contoh" },
  { label: "Butuh tindak lanjut", value: "5", description: "Belum real-time" },
  { label: "Selesai dicek", value: "17", description: "Dummy minggu ini" },
];

const taskList = [
  {
    id: "TASK-001",
    layanan: "Surat Rekomendasi Beasiswa",
    prioritas: "Normal",
    status: "Review dokumen",
  },
  {
    id: "TASK-002",
    layanan: "Bebas Pinjaman Perpustakaan",
    prioritas: "Tinggi",
    status: "Konfirmasi unit",
  },
  {
    id: "TASK-003",
    layanan: "Unggah Karya Ilmiah",
    prioritas: "Normal",
    status: "Menunggu kelengkapan",
  },
];

export default function StaffDashboardPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Dashboard Staff
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ringkasan statis untuk fondasi dashboard operasional staff ULT.
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
          <CardTitle>Daftar tugas layanan</CardTitle>
          <CardDescription>
            Tabel placeholder memakai data dummy, belum mengambil data legacy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.id}</TableCell>
                  <TableCell>{task.layanan}</TableCell>
                  <TableCell>{task.prioritas}</TableCell>
                  <TableCell>{task.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
