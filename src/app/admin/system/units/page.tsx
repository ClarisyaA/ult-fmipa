import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminTableScroll,
  AdminUnavailableState,
} from "@/components/admin/admin-ui";
import { CsvDownloadButton } from "@/components/admin/csv-download-button";
import {
  UnitCreateButton,
  UnitRowActions,
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
import { TruncatedTableText } from "@/components/ui/truncated-table-text";
import { getLevelOptions, getUnitRows } from "@/lib/admin-readonly-data";
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
  let levels: Awaited<ReturnType<typeof getLevelOptions>> = [];
  let unavailable = false;

  try {
    [rows, levels] = await Promise.all([
      getUnitRows({ search: params.q }),
      getLevelOptions(),
    ]);
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
        description="Kelola daftar unit dengan validasi level dan pemakaian user."
        action={<UnitCreateButton levels={levels} />}
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari unit..."
            className="h-9 min-w-0 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="system-units.csv" rows={csvRows} />
        </form>
      </AdminSectionCard>
      <div data-tour="admin-system-units">
        <AdminSectionCard title="Tabel Unit">
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState title="Data unit tidak ditemukan" />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[920px] table-fixed">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[34%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[24%]" />
              </colgroup>
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama Unit</TableHead>
                  <TableHead>Level ID</TableHead>
                  <TableHead>Kode Level</TableHead>
                  <TableHead className="admin-action-cell">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.unitId}>
                    <TableCell className="whitespace-nowrap">
                      {row.unitId}
                    </TableCell>
                    <TableCell className="min-w-0 font-semibold">
                      <TruncatedTableText value={row.unitName} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.levelDataId}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={row.levelDataCode} />
                    </TableCell>
                    <TableCell className="admin-action-cell whitespace-nowrap">
                      <UnitRowActions row={row} levels={levels} />
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
