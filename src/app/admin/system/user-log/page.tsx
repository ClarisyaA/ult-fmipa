import Link from "next/link";
import { ScrollText } from "lucide-react";

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
import { getUserLogList } from "@/lib/admin-system";

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
  if (params.limit && params.limit !== 30) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return q ? `/admin/system/user-log?${q}` : "/admin/system/user-log";
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AdminUserLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 30);
  const search = params.search ?? "";

  const result = await getUserLogList(page, limit, search || undefined);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        section="System"
        title="User Log"
        description="Log aktivitas login user pada sistem ULT."
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
                  placeholder="Cari username, IP, log..."
                  className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button type="submit" size="sm" className="h-9">
                  Tampilkan
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Total {result.total.toLocaleString("id-ID")} log. Halaman{" "}
            {result.page} dari {result.totalPages}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.data.length === 0 ? (
            <AdminEmptyState
              icon={<ScrollText className="size-8" />}
              title="Tidak ada log aktivitas"
              description={
                search
                  ? "Coba ubah kata kunci pencarian."
                  : "Tabel log_users kosong."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Log</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(row.time)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.userName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.ip}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {row.browser}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm">
                        {row.log}
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
