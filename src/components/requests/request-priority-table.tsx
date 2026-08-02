import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AdminStatusBadge, AdminTableScroll } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedTableText } from "@/components/ui/truncated-table-text";
import type { PriorityDashboardRequestRow } from "@/types/dashboard";

function getCategoryParam(category: string) {
  if (category === "Layanan Mahasiswa") return "mahasiswa";
  if (category === "Layanan Alumni") return "alumni";
  if (category === "Layanan Perpustakaan") return "perpustakaan";

  return undefined;
}

function buildPreviewHref(
  role: "admin" | "staff",
  row: PriorityDashboardRequestRow,
) {
  const params = new URLSearchParams({
    service: row.serviceSlug,
    previewService: row.serviceSlug,
    previewId: row.id,
  });
  const category = getCategoryParam(row.serviceCategory);

  if (category) {
    params.set("category", category);
  }

  return `/${role}/requests?${params.toString()}`;
}

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

function formatWaitingTime(waitingHours: number) {
  if (waitingHours >= 24) {
    const days = Math.floor(waitingHours / 24);
    const hours = waitingHours % 24;

    if (hours === 0) {
      return `${days} hari`;
    }

    return `${days} hari ${hours} jam`;
  }

  return `${waitingHours} jam`;
}

function getPriorityBadge(priorityLevel: PriorityDashboardRequestRow["priorityLevel"]) {
  if (priorityLevel === "high") {
    return <AdminStatusBadge tone="danger">Mendesak</AdminStatusBadge>;
  }

  if (priorityLevel === "medium") {
    return <AdminStatusBadge tone="warning">Perlu diproses</AdminStatusBadge>;
  }

  return <AdminStatusBadge tone="info">Baru masuk</AdminStatusBadge>;
}

export function RequestPriorityTable({
  rows,
  role,
}: {
  rows: PriorityDashboardRequestRow[];
  role: "admin" | "staff";
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-4 py-8 text-center text-sm text-[#6f746f]">
        Tidak ada pengajuan pending yang perlu diprioritaskan saat ini.
      </div>
    );
  }

  return (
    <>
      {role === "staff" ? (
        <div className="grid gap-2 md:hidden">
          {rows.map((row) => (
            <div
              key={`${row.serviceSlug}-${row.id}`}
              className="rounded-md border border-[#e3d9ca] bg-white p-3 shadow-[0_1px_4px_rgba(47,38,20,0.06)]"
            >
              <div className="grid gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#7a7166]">
                    Layanan
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-snug text-[#202923]">
                    {row.serviceTitle}
                  </p>
                </div>
                <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2 text-xs">
                  <span className="text-[#7a7166]">Nama</span>
                  <span className="min-w-0 break-words font-semibold text-[#303b34]">
                    {row.requesterName}
                  </span>
                  <span className="text-[#7a7166]">Prodi</span>
                  <span className="min-w-0 break-words text-[#303b34]">
                    {row.programStudy}
                  </span>
                  <span className="text-[#7a7166]">Masuk</span>
                  <span className="min-w-0 break-words text-[#303b34]">
                    {formatDate(row.requestDate)}
                  </span>
                  <span className="text-[#7a7166]">Menunggu</span>
                  <span className="font-semibold text-[#8a3d23]">
                    {formatWaitingTime(row.waitingHours)}
                  </span>
                  <span className="text-[#7a7166]">Prioritas</span>
                  <span>{getPriorityBadge(row.priorityLevel)}</span>
                </div>
              </div>
              <Button
                asChild
                size="sm"
                className="mt-3 h-9 w-full rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
              >
                <Link href={buildPreviewHref(role, row)}>
                  Proses
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className={role === "staff" ? "hidden md:block" : undefined}>
        <AdminTableScroll>
          <Table className="min-w-[980px] table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
            </colgroup>
            <TableHeader className="bg-[#eef3ec]">
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Program Studi</TableHead>
                <TableHead>Masuk</TableHead>
                <TableHead>Lama Menunggu</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.serviceSlug}-${row.id}`}>
                  <TableCell className="min-w-0 font-medium">
                    <TruncatedTableText value={row.serviceTitle} />
                  </TableCell>
                  <TableCell className="min-w-0">
                    <TruncatedTableText value={row.requesterName} />
                  </TableCell>
                  <TableCell className="min-w-0">
                    <TruncatedTableText value={row.programStudy} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(row.requestDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium text-[#8a3d23]">
                    {formatWaitingTime(row.waitingHours)}
                  </TableCell>
                  <TableCell>{getPriorityBadge(row.priorityLevel)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      asChild
                      size="sm"
                      className="h-8 shrink-0 rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
                    >
                      <Link href={buildPreviewHref(role, row)}>
                        Proses
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableScroll>
      </div>
    </>
  );
}
