import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AdminStatusBadge } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="overflow-x-auto rounded-md border border-[#edf0e9]">
      <Table className="min-w-[980px]">
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
              <TableCell className="font-medium">{row.serviceTitle}</TableCell>
              <TableCell>{row.requesterName}</TableCell>
              <TableCell>{row.programStudy}</TableCell>
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
                  className="h-8 rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
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
    </div>
  );
}
