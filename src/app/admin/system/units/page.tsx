import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminTableScroll,
  AdminUnavailableState,
} from "@/components/admin/admin-ui";
import { CsvDownloadButton } from "@/components/admin/csv-download-button";
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
import { getUnitRows } from "@/lib/admin-readonly-data";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminSystemUnitsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof getUnitRows>> = [];
  let unavailable = false;

  try {
    rows = await getUnitRows({ search: params.q });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:system:units", error);
  }
  const csvRows = rows.map((row) => ({
    ID: row.unitId,
    "Nama Unit": row.unitName,
    "Level ID": row.levelDataId,
    "Kode Level": row.levelDataCode,
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Unit List"
        description="Shell read-only untuk daftar unit. Import dan perubahan data masih rencana."
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex flex-col gap-2 md:flex-row md:items-end">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari unit..."
            className="h-9 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="unit-list.csv" rows={csvRows} />
        </form>
        <p className="mt-3 text-[11px] text-[#7a7166]">
          Tambah, edit, hapus, dan import belum ditampilkan sampai endpoint
          unit yang aman tersedia.
        </p>
      </AdminSectionCard>
      <AdminSectionCard title="Tabel Unit">
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState title="Data unit tidak ditemukan" />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[760px]">
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Level ID</TableHead>
                  <TableHead>Kode Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.unitId}>
                    <TableCell>{row.unitId}</TableCell>
                    <TableCell className="font-semibold">
                      {row.unitName}
                    </TableCell>
                    <TableCell>{row.levelDataId}</TableCell>
                    <TableCell>{row.levelDataCode}</TableCell>
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
