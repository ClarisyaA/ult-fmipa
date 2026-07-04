import Link from "next/link";
import { GraduationCap } from "lucide-react";

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
import { getMahasiswaList } from "@/lib/admin-master";

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
  return q ? `/admin/master/mahasiswa?${q}` : "/admin/master/mahasiswa";
}

export default async function AdminMahasiswaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 20);
  const search = params.search ?? "";

  const result = await getMahasiswaList(page, limit, search || undefined);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        section="Data"
        title="Daftar Mahasiswa"
        description="Data mahasiswa aktif dari tabel master. Hanya admin yang memiliki akses."
      />

      {/* Toolbar */}
      <div className="rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Pencarian
            </label>
            <form>
              <div className="flex gap-2">
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="Cari NPM, Nama, Program Studi..."
                  className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" size="sm" className="h-9">
                  Tampilkan
                </Button>
              </div>
            </form>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 cursor-not-allowed opacity-60" disabled>
              Tambah Data — Rencana
            </Button>
            <Button variant="outline" size="sm" className="h-9 cursor-not-allowed opacity-60" disabled>
              Import Data — Rencana
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mahasiswa</CardTitle>
          <CardDescription>
            Total {result.total.toLocaleString("id-ID")} mahasiswa. Halaman{" "}
            {result.page} dari {result.totalPages}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.data.length === 0 ? (
            <AdminEmptyState
              icon={<GraduationCap className="size-8" />}
              title="Tidak ada data mahasiswa"
              description={
                search
                  ? "Coba ubah kata kunci pencarian."
                  : "Tabel mahasiswa kosong atau belum terisi."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NPM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Program Studi</TableHead>
                    <TableHead>Jenjang</TableHead>
                    <TableHead className="text-right">Angkatan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.map((row) => (
                    <TableRow key={row.npm}>
                      <TableCell className="font-mono text-sm">
                        {row.npm}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.nama ?? "-"}
                      </TableCell>
                      <TableCell>{row.programStudi ?? "-"}</TableCell>
                      <TableCell>{row.jenjang ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {row.angkatan ?? "-"}
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
                <Link
                  href={buildHref({
                    search: search || undefined,
                    page: result.page - 1,
                    limit,
                  })}
                >
                  Sebelumnya
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={result.page >= result.totalPages}
              >
                <Link
                  href={buildHref({
                    search: search || undefined,
                    page: result.page + 1,
                    limit,
                  })}
                >
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
