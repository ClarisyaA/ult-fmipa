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
  LevelCreateButton,
  LevelRowActions,
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
import { getLevelRows } from "@/lib/admin-readonly-data";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminSystemLevelsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof getLevelRows>> = [];
  let unavailable = false;

  try {
    rows = await getLevelRows({ search: params.q });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:system:levels", error);
  }
  const csvRows = rows.map((row) => ({
    ID: row.LEVEL_DATA_ID,
    "Nama Level": row.LEVEL_DATA_NAME,
    "Field Name": row.FIELD_NAME,
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Data Level"
        description="Kelola data level sistem dengan validasi aman."
        action={<LevelCreateButton />}
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari level..."
            className="h-9 min-w-0 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="data-level.csv" rows={csvRows} />
        </form>
      </AdminSectionCard>
      <div data-tour="admin-system-levels">
        <AdminSectionCard title="Tabel Data Level">
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState title="Data level tidak ditemukan" />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[860px] table-fixed">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[36%]" />
                <col className="w-[28%]" />
                <col className="w-[24%]" />
              </colgroup>
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nama Level</TableHead>
                  <TableHead>Field Name</TableHead>
                  <TableHead className="admin-action-cell">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.LEVEL_DATA_ID}>
                    <TableCell className="whitespace-nowrap">
                      {row.LEVEL_DATA_ID}
                    </TableCell>
                    <TableCell className="min-w-0 font-semibold">
                      <TruncatedTableText value={row.LEVEL_DATA_NAME} />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={row.FIELD_NAME} />
                    </TableCell>
                    <TableCell className="admin-action-cell whitespace-nowrap">
                      <LevelRowActions row={row} />
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
