import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminStatusBadge,
  AdminTableScroll,
  AdminUnavailableState,
} from "@/components/admin/admin-ui";
import { CsvDownloadButton } from "@/components/admin/csv-download-button";
import {
  TracerCreateButton,
  TracerRowActions,
} from "@/components/admin/master-actions/admin-master-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTracerStudyRows } from "@/lib/admin-readonly-data";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminTracerStudyPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof getTracerStudyRows>> = [];
  let unavailable = false;

  try {
    rows = await getTracerStudyRows({ search: params.q });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:alumni:tracer-study", error);
  }
  const csvRows = rows.map((row) => ({
    NPM: row.npm,
    Nama: row.nama,
    "Program Studi": row.programStudi,
    "Tahun Lulus": row.tahunLulus,
    Instansi: row.instansi,
    Jabatan: row.jabatan,
    Status: row.statusIsi ? "Terisi" : "Belum terisi",
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Daftar Tracer Study"
        description="Kelola data tracer study alumni. Kontak personal tidak ditampilkan di tabel ini."
        action={<TracerCreateButton />}
      />

      <AdminSectionCard
        title="Pencarian"
        description="Cari berdasarkan NPM, nama, program studi, atau instansi."
      >
        <form className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="grid flex-1 gap-1">
            <label className="text-[11px] font-semibold text-[#7a7166]">
              Kata kunci
            </label>
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Cari tracer study..."
              className="h-9 border-[#e1d8ca] bg-white"
            />
          </div>
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="tracer-study-alumni.csv" rows={csvRows} />
        </form>
      </AdminSectionCard>

      <div data-tour="admin-tracer-study">
        <AdminSectionCard
          title="Tabel Tracer Study"
          description={`Menampilkan ${rows.length} baris read-only.`}
        >
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title="Data tracer study tidak ditemukan"
            description="Tidak ada baris yang cocok dengan pencarian saat ini."
          />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[900px]">
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>NPM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead>Tahun Lulus</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold">
                      {row.npm ?? "-"}
                    </TableCell>
                    <TableCell>{row.nama || "-"}</TableCell>
                    <TableCell>{row.programStudi ?? "-"}</TableCell>
                    <TableCell>{row.tahunLulus ?? "-"}</TableCell>
                    <TableCell>{row.instansi ?? "-"}</TableCell>
                    <TableCell>
                      <AdminStatusBadge
                        tone={row.statusIsi ? "success" : "neutral"}
                      >
                        {row.statusIsi ? "Terisi" : "Belum terisi"}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell>
                      <TracerRowActions row={row} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableScroll>
        )}
        </AdminSectionCard>
      </div>
    </AdminPageShell>
  );
}
