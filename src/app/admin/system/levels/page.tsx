import { Database } from "lucide-react";

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
import { getLevelList } from "@/lib/admin-system";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLevelsPage() {
  const levels = await getLevelList();

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        section="System"
        title="Data Level"
        description="Daftar level data pada sistem ULT."
      />

      {/* Toolbar */}
      <div className="rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-end gap-3">
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
          <CardTitle>Level</CardTitle>
          <CardDescription>
            Total {levels.length} level terdaftar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {levels.length === 0 ? (
            <AdminEmptyState
              icon={<Database className="size-8" />}
              title="Tidak ada data level"
              description="Tabel data_level kosong atau belum terisi."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama Level</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">
                        {row.id}
                      </TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.fieldName}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
