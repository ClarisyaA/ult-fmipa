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
import { getUserRows } from "@/lib/admin-readonly-data";
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
  let unavailable = false;

  try {
    rows = await getUserRows({ search: params.q });
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
    Unit: row.UNIT_ID,
    Status: row.CONFIRMED === "1" ? "Aktif" : "Belum konfirmasi",
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="User List"
        description="Read-only daftar user admin/staff. Password hash dan field sensitif tidak ditampilkan."
      />
      <AdminSectionCard title="Pencarian">
        <form className="flex flex-col gap-2 md:flex-row md:items-end">
          <Input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Cari user..."
            className="h-9 border-[#e1d8ca] bg-white md:max-w-sm"
          />
          <Button className="h-9 rounded-md bg-[#0f3d2e] px-4 text-xs font-semibold text-white hover:bg-[#164b39]">
            Tampilkan
          </Button>
          <CsvDownloadButton filename="system-users.csv" rows={csvRows} />
        </form>
        <p className="mt-3 text-[11px] text-[#7a7166]">
          Tambah, edit, hapus, dan import user tidak ditampilkan karena pola
          password dan provisioning user belum aman untuk diubah dari halaman ini.
        </p>
      </AdminSectionCard>
      <AdminSectionCard title="Tabel User">
        {unavailable ? (
          <AdminUnavailableState />
        ) : rows.length === 0 ? (
          <AdminEmptyState title="Data user tidak ditemukan" />
        ) : (
          <AdminTableScroll>
            <Table className="min-w-[860px]">
              <TableHeader className="bg-[#eef3ec]">
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Akses</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.USER_NAME}>
                    <TableCell className="font-semibold">
                      {row.USER_NAME}
                    </TableCell>
                    <TableCell>{row.FULL_NAME}</TableCell>
                    <TableCell>{row.EMAIL}</TableCell>
                    <TableCell>{row.ACCESS_CODE}</TableCell>
                    <TableCell>{row.UNIT_ID}</TableCell>
                    <TableCell>
                      <AdminStatusBadge
                        tone={row.CONFIRMED === "1" ? "success" : "neutral"}
                      >
                        {row.CONFIRMED === "1" ? "Aktif" : "Belum konfirmasi"}
                      </AdminStatusBadge>
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
