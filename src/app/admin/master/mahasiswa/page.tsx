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
import {
  MahasiswaCreateButton,
  MahasiswaRowActions,
} from "@/components/admin/master-actions/admin-master-actions";
import { MahasiswaImportButton } from "@/components/admin/master-actions/mahasiswa-import-button";
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
import { getMahasiswaPage } from "@/lib/admin-readonly-data";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
};

const pageSizeOptions = [10, 20, 50, 100];

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function buildMahasiswaHref({
  q,
  page,
  pageSize,
}: {
  q?: string;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 20) params.set("pageSize", String(pageSize));
  const query = params.toString();
  return query ? `/admin/master/mahasiswa?${query}` : "/admin/master/mahasiswa";
}

export default async function AdminMahasiswaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedPage = parsePositiveInt(params.page, 1);
  const requestedPageSize = parsePositiveInt(params.pageSize, 20);
  let result: Awaited<ReturnType<typeof getMahasiswaPage>> = {
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
  let unavailable = false;

  try {
    result = await getMahasiswaPage({
      search: params.q,
      page: requestedPage,
      pageSize: requestedPageSize,
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:master:mahasiswa", error);
  }
  const rows = result.rows;
  const { pagination } = result;
  const csvRows = rows.map((row) => ({
    NPM: row.npm,
    Nama: row.nama,
    "Program Studi": row.programStudi,
    Angkatan: row.angkatan,
    Status: row.status ?? "Aktif",
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Daftar Mahasiswa"
        description="Kelola data mahasiswa aktif. Kolom dibatasi sesuai struktur tabel master."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MahasiswaImportButton endpoint="/api/admin/master/mahasiswa/import" />
            <MahasiswaCreateButton />
          </div>
        }
      />

      <AdminSectionCard
        title="Pencarian"
        description="Gunakan NPM, nama, atau program studi."
      >
        <form
          className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-end"
          data-tour="admin-students-search"
        >
          <div className="grid min-w-0 flex-1 gap-1 md:min-w-[280px]">
            <label className="text-[11px] font-semibold text-[#7a7166]">
              Kata kunci
            </label>
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Cari mahasiswa..."
              className="h-9 border-[#e1d8ca] bg-white"
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
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <CsvDownloadButton
            filename="data-mahasiswa.csv"
            rows={csvRows}
            className="h-9 shrink-0 rounded-md border-[#e1d8ca] bg-white px-3 text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
          />
        </form>
      </AdminSectionCard>

      <div className="min-w-0" data-tour="admin-students-table">
        <AdminSectionCard
          title="Tabel Mahasiswa"
          description="Kalau kolom tabel banyak, geser tabel ke kanan untuk melihat aksi atau data lanjutan."
        >
          {unavailable ? (
            <AdminUnavailableState />
          ) : rows.length === 0 ? (
            <AdminEmptyState
              title="Data mahasiswa tidak ditemukan"
              description="Tidak ada baris yang cocok dengan pencarian saat ini."
            />
          ) : (
            <AdminTableScroll>
              <Table className="min-w-[1040px] table-fixed">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[25%]" />
                  <col className="w-[27%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <TableHeader className="bg-[#eef3ec]">
                  <TableRow>
                    <TableHead>NPM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Program Studi</TableHead>
                    <TableHead>Angkatan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="admin-action-cell">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.npm}>
                      <TableCell className="min-w-0 font-semibold">
                        <TruncatedTableText value={row.npm} />
                      </TableCell>
                      <TableCell className="min-w-0">
                        <TruncatedTableText value={row.nama ?? "-"} />
                      </TableCell>
                      <TableCell className="min-w-0">
                        <TruncatedTableText value={row.programStudi ?? "-"} />
                      </TableCell>
                      <TableCell>{row.angkatan ?? "-"}</TableCell>
                      <TableCell>
                        <AdminStatusBadge tone="neutral">
                          {row.status ?? "Aktif"}
                        </AdminStatusBadge>
                      </TableCell>
                      <TableCell className="admin-action-cell">
                        <div data-tour="admin-students-actions">
                          <MahasiswaRowActions row={row} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminTableScroll>
          )}
          <div
            className="mt-4 flex flex-col gap-3 border-t border-[#eee6d9] pt-4 sm:flex-row sm:items-center sm:justify-between"
            data-tour="admin-students-pagination"
          >
            <p className="text-xs text-[#7a7166]">
              {pagination.total === 0
                ? "Tidak ada data yang sesuai pencarian."
                : `Menampilkan ${pagination.start}-${pagination.end} dari ${pagination.total} data. Halaman ${pagination.page} dari ${pagination.totalPages}.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild={pagination.hasPreviousPage}
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                className="h-8 rounded-md border-[#e1d8ca] px-3 text-xs"
              >
                {pagination.hasPreviousPage ? (
                  <Link
                    href={buildMahasiswaHref({
                      q: params.q,
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
              <Button
                asChild={pagination.hasNextPage}
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                className="h-8 rounded-md border-[#e1d8ca] px-3 text-xs"
              >
                {pagination.hasNextPage ? (
                  <Link
                    href={buildMahasiswaHref({
                      q: params.q,
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
