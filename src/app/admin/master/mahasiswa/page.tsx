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
  MahasiswaCreateButton,
  MahasiswaRowActions,
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
import { getMahasiswaRows } from "@/lib/admin-readonly-data";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminMahasiswaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof getMahasiswaRows>> = [];
  let unavailable = false;

  try {
    rows = await getMahasiswaRows({ search: params.q });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:master:mahasiswa", error);
  }
  const csvRows = rows.map((row) => ({
    NPM: row.npm,
    Nama: row.nama,
    "Program Studi": row.programStudi,
    Angkatan: row.angkatan,
    Status: row.status ?? "Aktif",
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Daftar Mahasiswa"
        description="Kelola data mahasiswa aktif. Kolom dibatasi sesuai struktur tabel master."
        action={<MahasiswaCreateButton />}
      />

      <AdminSectionCard
        title="Pencarian"
        description="Gunakan NPM, nama, atau program studi."
      >
        <form className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="grid flex-1 gap-1">
            <label className="text-[11px] font-semibold text-[#7a7166]">
              Kata kunci
            </label>
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Cari mahasiswa..."
              className="h-9 border-[#e1d8ca] bg-white"
            />
          </div>
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="data-mahasiswa.csv" rows={csvRows} />
        </form>
      </AdminSectionCard>

      <AdminSectionCard
        title="Tabel Mahasiswa"
        description={`Menampilkan maksimal ${rows.length} baris pertama sesuai filter.`}
      >
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title="Data mahasiswa tidak ditemukan"
            description="Tidak ada baris yang cocok dengan pencarian saat ini."
          />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[760px]">
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>NPM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.npm}>
                    <TableCell className="font-semibold">{row.npm}</TableCell>
                    <TableCell>{row.nama ?? "-"}</TableCell>
                    <TableCell>{row.programStudi ?? "-"}</TableCell>
                    <TableCell>{row.angkatan ?? "-"}</TableCell>
                    <TableCell>
                      <AdminStatusBadge tone="neutral">
                        {row.status ?? "Aktif"}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell>
                      <MahasiswaRowActions row={row} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableScroll>
        )}
      </AdminSectionCard>
    </AdminPageShell>
  );
}
