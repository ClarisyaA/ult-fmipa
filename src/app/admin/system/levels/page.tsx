import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminTableScroll,
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
import { getLevelRows } from "@/lib/admin-readonly-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminSystemLevelsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const rows = await getLevelRows({ search: params.q });
  const csvRows = rows.map((row) => ({
    ID: row.LEVEL_DATA_ID,
    "Nama Level": row.LEVEL_DATA_NAME,
    "Field Name": row.FIELD_NAME,
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Data Level"
        description="Shell read-only untuk data level. Perubahan data disiapkan sebagai rencana."
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex flex-col gap-2 md:flex-row md:items-end">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari level..."
            className="h-9 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="data-level.csv" rows={csvRows} />
        </form>
        <p className="mt-3 text-[11px] text-[#7a7166]">
          Tambah, edit, hapus, dan import belum ditampilkan sampai endpoint
          master system yang aman tersedia.
        </p>
      </AdminSectionCard>
      <AdminSectionCard title="Tabel Data Level">
        {rows.length === 0 ? (
          <AdminEmptyState title="Data level tidak ditemukan" />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[720px]">
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama Level</TableHead>
                  <TableHead>Field Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.LEVEL_DATA_ID}>
                    <TableCell>{row.LEVEL_DATA_ID}</TableCell>
                    <TableCell className="font-semibold">
                      {row.LEVEL_DATA_NAME}
                    </TableCell>
                    <TableCell>{row.FIELD_NAME}</TableCell>
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
