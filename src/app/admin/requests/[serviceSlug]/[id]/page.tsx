import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RequestStatusActions } from "@/components/requests/request-status-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDetail } from "@/lib/legacy-request-detail";
import type { ServiceRequestDetail } from "@/types/request-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestDetailPageProps = {
  params: Promise<{ serviceSlug: string; id: string }>;
};

function formatDate(value: string | null | undefined) {
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

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function OptionalDetails({ detail }: { detail: ServiceRequestDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Pengajuan</CardTitle>
        <CardDescription>
          Field yang ditampilkan sudah dibatasi untuk kebutuhan operasional.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <DetailField label="NPM" value={detail.npm} />
        <DetailField label="Tanggal Pengajuan" value={formatDate(detail.requestDate)} />
        <DetailField label="Keperluan" value={detail.keperluan} />
        <DetailField label="Keterangan" value={detail.keterangan} />
        <DetailField label="Entry" value={detail.requestEntry} />
        <DetailField label="Beasiswa" value={detail.beasiswa} />
        <DetailField label="Pengantar" value={detail.pengantar} />
        <DetailField label="Ditujukan" value={detail.ditujukan} />
        <DetailField label="Jumlah Ijazah" value={detail.jumlahIjazah} />
        <DetailField label="Jumlah Transkrip" value={detail.jumlahTranskrip} />
        <DetailField label="Jumlah Translate" value={detail.jumlahTranslate} />
      </CardContent>
    </Card>
  );
}

export default async function AdminRequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { serviceSlug, id } = await params;
  const detail = await getRequestDetail(serviceSlug, id);
  const user = await getCurrentUser();

  if (!detail) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <Link href="/admin/requests">
            <ArrowLeft className="size-4" />
            Kembali ke Pengajuan
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-normal">
            {detail.serviceTitle}
          </h1>
          <Badge variant="secondary">{detail.statusLabel}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Mode terbatas. Hanya update status workflow yang diaktifkan.
        </p>
      </div>

      <RequestStatusActions
        serviceSlug={detail.serviceSlug}
        id={detail.id}
        currentStatus={detail.status}
        rolePrefix="admin"
        staffName={user?.name ?? "Admin ULT"}
      />

      <OptionalDetails detail={detail} />

      <Card>
        <CardHeader>
          <CardTitle>Alur Status</CardTitle>
          <CardDescription>
            Timeline read-only berdasarkan kolom workflow tabel legacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {detail.workflow.map((item) => (
            <div key={item.label} className="flex gap-3">
              <div
                className={
                  item.done
                    ? "mt-1 size-3 rounded-full bg-primary"
                    : "mt-1 size-3 rounded-full border"
                }
              />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(item.date)}
                  {item.staff ? ` - ${item.staff}` : ""}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
