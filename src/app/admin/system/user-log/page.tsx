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
import { getUserLogRows } from "@/lib/admin-readonly-data";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminSystemUserLogPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof getUserLogRows>> = [];
  let unavailable = false;

  try {
    rows = await getUserLogRows({ search: params.q });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:system:user-log", error);
  }
  const csvRows = rows.map((row) => ({
    Waktu: formatDate(row.time),
    User: row.userName,
    Aktivitas: row.log,
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="User Log"
        description="Read-only log aktivitas user. IP address dan fingerprint browser tidak ditampilkan."
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex flex-col gap-2 md:flex-row md:items-end">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari user atau aktivitas..."
            className="h-9 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="user-log.csv" rows={csvRows} />
        </form>
      </AdminSectionCard>
      <AdminSectionCard title="Tabel User Log">
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title="Log tidak ditemukan"
            description="Tidak ada log yang cocok dengan pencarian saat ini."
          />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[760px]">
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aktivitas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.time)}</TableCell>
                    <TableCell className="font-semibold">
                      {row.userName}
                    </TableCell>
                    <TableCell>{row.log}</TableCell>
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
