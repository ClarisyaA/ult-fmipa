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
import { getAdminUserLogRows } from "@/lib/admin-user-log";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
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
  let result: Awaited<ReturnType<typeof getAdminUserLogRows>> = {
    rows: [],
    total: 0,
    page: 1,
    limit: 20,
    pageCount: 1,
  };
  let unavailable = false;

  try {
    result = await getAdminUserLogRows({
      search: params.q,
      page: Number(params.page ?? 1),
      limit: 20,
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:system:user-log", error);
  }
  const rows = result.rows;
  const csvRows = rows.map((row) => ({
    Waktu: formatDate(row.time),
    Pengguna: row.userName,
    Aksi: row.action,
    Modul: row.module,
    Keterangan: row.description,
  }));
  const previousPage = Math.max(result.page - 1, 1);
  const nextPage = Math.min(result.page + 1, result.pageCount);
  const queryString = params.q
    ? `&q=${encodeURIComponent(params.q)}`
    : "";

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="User Log"
        description="Read-only log aktivitas user. IP address dan fingerprint browser tidak ditampilkan."
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari user atau aktivitas..."
            className="h-9 min-w-0 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="user-log.csv" rows={csvRows} />
        </form>
      </AdminSectionCard>
      <div data-tour="admin-user-log">
        <AdminSectionCard
          title="Tabel User Log"
          description={`Menampilkan ${rows.length} dari ${result.total} aktivitas tercatat.`}
        >
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title="Belum ada aktivitas tercatat."
            description="Tidak ada log yang cocok dengan pencarian saat ini."
          />
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-3 md:hidden">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="grid gap-2 rounded-lg border border-[#eee6d9] bg-[#fffdf9] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#6f746f]">
                      {formatDate(row.time)}
                    </p>
                    <p className="rounded-full border border-[#d7d9e5] bg-[#f4f5fa] px-2 py-0.5 text-[10px] font-semibold text-[#4e5566]">
                      {row.module ?? "-"}
                    </p>
                  </div>
                  <p className="break-words text-sm font-bold text-[#1f2922]">
                    {row.userName}
                  </p>
                  <p className="break-words text-xs font-semibold text-[#536058]">
                    {row.action}
                  </p>
                  <p className="break-words text-xs leading-relaxed text-[#6f746f]">
                    {row.description}
                  </p>
                </article>
              ))}
            </div>
            <div className="hidden md:block">
            <AdminTableScroll>
              <Table className="min-w-[860px]">
                <TableHeader className="bg-[#eef3ec]">
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Modul</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.time)}</TableCell>
                      <TableCell className="font-semibold">
                        {row.userName}
                      </TableCell>
                      <TableCell>{row.action}</TableCell>
                      <TableCell>{row.module ?? "-"}</TableCell>
                      <TableCell>{row.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableScroll>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6a6258]">
              <span>
                Halaman {result.page} dari {result.pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={result.page <= 1}
                  className="h-8 rounded-md border-[#e1d8ca] bg-white text-xs"
                >
                  <a href={`?page=${previousPage}${queryString}`}>Sebelumnya</a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={result.page >= result.pageCount}
                  className="h-8 rounded-md border-[#e1d8ca] bg-white text-xs"
                >
                  <a href={`?page=${nextPage}${queryString}`}>Berikutnya</a>
                </Button>
              </div>
            </div>
          </div>
        )}
        </AdminSectionCard>
      </div>
    </AdminPageShell>
  );
}
