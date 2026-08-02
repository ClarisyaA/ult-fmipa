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
  getUserRows,
} from "@/lib/admin-readonly-data";
import { getCurrentUser } from "@/lib/auth";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminSystemUsersPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  let rows: Awaited<ReturnType<typeof getUserRows>> = [];
  let accessRows: Awaited<ReturnType<typeof getAccessRows>> = [];
  const appRoleRows = getAppRoleRows();
  let units: Awaited<ReturnType<typeof getUnitOptions>> = [];
  let unavailable = false;
  const currentUser = await getCurrentUser();
  const currentLegacyUsername = currentUser?.id?.startsWith("legacy-")
    ? currentUser.id.slice("legacy-".length)
    : null;

  try {
    [rows, accessRows, units] = await Promise.all([
      getUserRows({ search: params.q }),
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
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari user..."
            className="h-9 min-w-0 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
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
        </AdminSectionCard>
      </div>
    </AdminPageShell>
  );
}
