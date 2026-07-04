import Link from "next/link";
import { Settings } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUnitList } from "@/lib/admin-system";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
  }>;
};

function buildHref(params: { page?: number; limit?: number; search?: string }) {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.limit && params.limit !== 20) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return q ? `/admin/system/units?${q}` : "/admin/system/units";
}

export default async function AdminUnitsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 20);
  const search = params.search ?? "";

  const result = await getUnitList(page, limit, search || undefined);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        section="System"
        title="Unit List"
        description="Daftar unit organisasi pada sistem ULT."
      />

      {/* Toolbar */}
      <div className="rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <form>
              <div className="flex gap-2">
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="Cari nama unit, kode..."
                  className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" size="sm" className="h-9">
                  Tampilkan
                </Button>
              </div>
            </form>
          </div>
          <Button variant="outline" size="sm" className="h-9 cursor-not-allowed opacity-60" disabled>
            Tambah Data — Rencana
          </Button>
          <Button variant="outline" size="sm" className="h-9 cursor-not-allowed opacity-60" disabled>
            Import Data — Rencana
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unit</CardTitle>
          <CardDescription>
            Total {result.total.toLocaleString("id-ID")} unit. Halaman{" "}
            {result.page} dari {result.totalPages}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.data.length === 0 ? (
            <AdminEmptyState
              icon={<Settings className="size-8" />}
              title="Tidak ada data unit"
              description={
                search
                  ? "Coba ubah kata kunci pencarian."
                  : "Tabel data_unit kosong atau belum terisi."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Level ID</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Unit</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">
                        {row.id}
                      </TableCell>
                      <TableCell>{row.levelDataId}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.levelDataCode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.unitName}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          Edit/Delete — Rencana
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Halaman {result.page} dari {result.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={result.page <= 1}
              >
                <Link href={buildHref({ search: search || undefined, page: result.page - 1, limit })}>
                  Sebelumnya
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={result.page >= result.totalPages}
              >
                <Link href={buildHref({ search: search || undefined, page: result.page + 1, limit })}>
                  Berikutnya
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
