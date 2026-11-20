import Link from "next/link";

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
import { SystemUsersTabs } from "@/components/admin/system-users-tabs";
import {
  UserCreateButton,
  UserRowActions,
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
import {
  getAccessRows,
  getAppRoleRows,
  getUnitOptions,
  getUserPage,
  sanitizeUserPageSize,
  USER_DEFAULT_PAGE_SIZE,
  USER_PAGE_SIZE_OPTIONS,
} from "@/lib/admin-readonly-data";
import { getCurrentUser } from "@/lib/auth";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function buildUsersHref({
  q,
  page,
  pageSize,
}: {
  q?: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("q", q?.trim() ?? "");
  return `/admin/system/users?${params.toString()}`;
}

// Windows the page-number list around the current page (plus first/last),
// collapsing long runs into an "ellipsis" marker so very large page counts
// don't render one button per page.
function buildPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const keep = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...keep]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }
  return result;
}

export default async function AdminSystemUsersPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const currentQuery = params.q?.trim() ?? "";
  const requestedPage = parsePositiveInt(params.page, 1);
  const requestedPageSize = sanitizeUserPageSize(
    parsePositiveInt(params.pageSize, USER_DEFAULT_PAGE_SIZE),
  );
  let result: Awaited<ReturnType<typeof getUserPage>> = {
    rows: [],
    pagination: {
      page: 1,
      pageSize: requestedPageSize,
      total: 0,
      totalPages: 1,
      start: 0,
      end: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
  let accessRows: Awaited<ReturnType<typeof getAccessRows>> = [];
  const appRoleRows = getAppRoleRows();
  let units: Awaited<ReturnType<typeof getUnitOptions>> = [];
  let unavailable = false;
  const currentUser = await getCurrentUser();
  const currentLegacyUsername = currentUser?.id?.startsWith("legacy-")
    ? currentUser.id.slice("legacy-".length)
    : null;

  try {
    [result, accessRows, units] = await Promise.all([
      getUserPage({
        search: currentQuery,
        page: requestedPage,
        pageSize: requestedPageSize,
      }),
      getAccessRows({ limit: 100 }),
      getUnitOptions(),
    ]);
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:system:users", error);
  }
  const rows = result.rows;
  const { pagination } = result;
  const pageWindow = buildPageWindow(pagination.page, pagination.totalPages);
  const csvRows = rows.map((row) => ({
    Username: row.USER_NAME,
    Nama: row.FULL_NAME,
    Email: row.EMAIL,
    Akses: row.ACCESS_CODE,
    "Akses Aplikasi": row.APP_ROLE ?? "",
    Unit: row.UNIT_ID,
    Status: row.CONFIRMED === "1" ? "Aktif" : "Belum konfirmasi",
  }));

  return (
    <AdminPageShell>
      <SystemUsersTabs active="users" />
      <AdminPageHeader
        title="User List"
        description="Kelola field user yang aman. Password hash dan field sensitif tidak ditampilkan."
        action={
          <UserCreateButton
            accessRows={accessRows}
            appRoleRows={appRoleRows}
            units={units}
          />
        }
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
          <div className="grid min-w-0 flex-1 gap-1 md:min-w-[240px] md:max-w-sm">
            <label className="text-[11px] font-semibold text-[#7a7166]">
              Kata kunci
            </label>
            <Input
              name="q"
              defaultValue={currentQuery}
              placeholder="Cari user..."
              className="h-9 min-w-0 border-[#e1d8ca] bg-white"
            />
          </div>
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <label className="grid shrink-0 gap-1 text-[11px] font-semibold text-[#7a7166]">
            Baris
            <select
              name="pageSize"
              defaultValue={pagination.pageSize}
              className="h-9 rounded-md border border-[#e1d8ca] bg-white px-3 text-xs text-[#303b34]"
            >
              {USER_PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} per halaman
                </option>
              ))}
            </select>
          </label>
          <CsvDownloadButton filename="system-users.csv" rows={csvRows} />
        </form>
        <p className="mt-3 text-[11px] text-[#7a7166]">
          Password tidak ditampilkan. Admin dapat membuat password baru melalui
          tombol Reset Password pada baris user.
        </p>
      </AdminSectionCard>
      <div data-tour="admin-users-table">
        <AdminSectionCard title="Tabel User">
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState title="Data user tidak ditemukan" />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[1160px] table-fixed">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[17%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
                <col className="w-[6%]" />
                <col className="w-[12%]" />
              </colgroup>
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Posisi / Level</TableHead>
                  <TableHead>Akses Aplikasi</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="admin-action-cell-wide">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.USER_NAME}>
                    <TableCell className="min-w-0 font-semibold">
                      <TruncatedTableText value={row.USER_NAME} />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={row.FULL_NAME} />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={row.EMAIL} />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={row.ACCESS_CODE} />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={row.APP_ROLE ?? "-"} />
                    </TableCell>
                    <TableCell className="min-w-0">
                      <TruncatedTableText value={row.UNIT_ID} />
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge
                        tone={row.CONFIRMED === "1" ? "success" : "neutral"}
                      >
                        {row.CONFIRMED === "1" ? "Aktif" : "Belum konfirmasi"}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell className="admin-action-cell-wide">
                      <UserRowActions
                        row={row}
                        accessRows={accessRows}
                        appRoleRows={appRoleRows}
                        units={units}
                        currentUserEmail={currentUser?.email}
                        currentLegacyUsername={currentLegacyUsername}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminTableScroll>
        )}
        <div
          className="mt-4 flex flex-col gap-3 border-t border-[#eee6d9] pt-4 sm:flex-row sm:items-center sm:justify-between"
          data-tour="admin-users-pagination"
        >
          <p className="text-xs text-[#7a7166]">
            {pagination.total === 0
              ? "Tidak ada data yang sesuai pencarian."
              : `Menampilkan ${pagination.start}-${pagination.end} dari ${pagination.total} data. Halaman ${pagination.page} dari ${pagination.totalPages}.`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild={pagination.hasPreviousPage}
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              className="h-8 rounded-md border-[#e1d8ca] px-3 text-xs"
            >
              {pagination.hasPreviousPage ? (
                <Link
                  aria-label="Buka halaman sebelumnya"
                  href={buildUsersHref({
                    q: currentQuery,
                    page: pagination.page - 1,
                    pageSize: pagination.pageSize,
                  })}
                >
                  Sebelumnya
                </Link>
              ) : (
                <span>Sebelumnya</span>
              )}
            </Button>
            {pagination.totalPages > 1
              ? pageWindow.map((entry, index) =>
                  entry === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-xs text-[#7a7166]"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={entry}
                      asChild={entry !== pagination.page}
                      variant={entry === pagination.page ? "default" : "outline"}
                      size="sm"
                      disabled={entry === pagination.page}
                      className={
                        entry === pagination.page
                          ? "h-8 min-w-8 rounded-md bg-[#0f3d2e] px-2 text-xs text-white hover:bg-[#0f3d2e]"
                          : "h-8 min-w-8 rounded-md border-[#e1d8ca] px-2 text-xs"
                      }
                    >
                      {entry === pagination.page ? (
                        <span aria-current="page">{entry}</span>
                      ) : (
                        <Link
                          aria-label={`Buka halaman ${entry}`}
                          href={buildUsersHref({
                            q: currentQuery,
                            page: entry,
                            pageSize: pagination.pageSize,
                          })}
                        >
                          {entry}
                        </Link>
                      )}
                    </Button>
                  ),
                )
              : null}
            <Button
              asChild={pagination.hasNextPage}
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              className="h-8 rounded-md border-[#e1d8ca] px-3 text-xs"
            >
              {pagination.hasNextPage ? (
                <Link
                  aria-label="Buka halaman berikutnya"
                  href={buildUsersHref({
                    q: currentQuery,
                    page: pagination.page + 1,
                    pageSize: pagination.pageSize,
                  })}
                >
                  Berikutnya
                </Link>
              ) : (
                <span>Berikutnya</span>
              )}
            </Button>
          </div>
        </div>
        </AdminSectionCard>
      </div>
    </AdminPageShell>
  );
}
