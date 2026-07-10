import Link from "next/link";

import { InlineStatusAction } from "@/components/requests/inline-status-action";
import { RequestDeleteButton } from "@/components/requests/request-delete-button";
import { Badge } from "@/components/ui/badge";
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
import {
  getServiceRequestList,
  parseRequestStatus,
} from "@/lib/legacy-request-list";
import { getPublicServices } from "@/lib/legacy-services";
import { getCurrentUser } from "@/lib/auth";
import type { RequestStatus } from "@/types/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestsPageProps = {
  searchParams: Promise<{
    service?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
};

const statusOptions: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "inProgress", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "delivered", label: "Diambil/Dikirim" },
];
const unsupportedInlineStatusTables = new Set(["transkrip", "ijazah"]);

function supportsInlineStatus(request: {
  sourceTable: string;
  status: RequestStatus;
}) {
  if (unsupportedInlineStatusTables.has(request.sourceTable)) {
    return false;
  }

  if (request.sourceTable !== "surat_izin_kegiatan") {
    return true;
  }

  return ["sikFinalSubmitted", "inProgress", "completed"].includes(
    request.status
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildHref(params: {
  service?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params.service) searchParams.set("service", params.service);
  if (params.status) searchParams.set("status", params.status);
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  if (params.limit && params.limit !== 10) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return query ? `/admin/requests?${query}` : "/admin/requests";
}

export default async function AdminRequestsPage({
  searchParams,
}: RequestsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 10);
  const status = parseRequestStatus(params.status);
  const result = await getServiceRequestList({
    service: params.service,
    status,
    page,
    limit,
  });
  const services = getPublicServices();
  const user = await getCurrentUser();
  const staffName = user?.name ?? "Admin ULT";

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Daftar Pengajuan Layanan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tampilan read-only dengan NPM dimasking dan tanpa data pribadi mentah.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            Gunakan filter sederhana untuk melihat pengajuan berdasarkan layanan
            atau status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Status</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant={!status ? "default" : "outline"} size="sm">
                <Link href={buildHref({ service: params.service, limit })}>
                  Semua
                </Link>
              </Button>
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  asChild
                  variant={status === option.value ? "default" : "outline"}
                  size="sm"
                >
                  <Link
                    href={buildHref({
                      service: params.service,
                      status: option.value,
                      limit,
                    })}
                  >
                    {option.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Layanan</p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant={!params.service ? "default" : "outline"}
                size="sm"
              >
                <Link href={buildHref({ status, limit })}>Semua layanan</Link>
              </Button>
              {services.map((service) => (
                <Button
                  key={service.slug}
                  asChild
                  variant={params.service === service.slug ? "default" : "outline"}
                  size="sm"
                >
                  <Link
                    href={buildHref({
                      service: service.slug,
                      status,
                      limit,
                    })}
                  >
                    {service.title}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengajuan</CardTitle>
          <CardDescription>
            Total {result.pagination.total} pengajuan aman untuk ditampilkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>NPM</TableHead>
                <TableHead>Tanggal Pengajuan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Tidak ada pengajuan yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                result.data.map((request) => (
                  <TableRow key={`${request.sourceTable}-${request.id}`}>
                    <TableCell className="font-medium">
                      {request.serviceTitle}
                    </TableCell>
                    <TableCell>{request.maskedNpm}</TableCell>
                    <TableCell>{formatDate(request.requestDate)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{request.statusLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <InlineStatusAction
                          rolePrefix="admin"
                          serviceSlug={request.serviceSlug}
                          id={request.id}
                          status={request.status}
                          staffName={staffName}
                          supported={supportsInlineStatus(request)}
                        />
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/admin/requests/${request.serviceSlug}/${request.id}`}
                          >
                            Detail
                          </Link>
                        </Button>
                        <RequestDeleteButton
                          serviceSlug={request.serviceSlug}
                          id={request.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Halaman {result.pagination.page} dari{" "}
              {result.pagination.totalPages || 1}
            </p>
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={result.pagination.page <= 1}
              >
                <Link
                  href={buildHref({
                    service: params.service,
                    status,
                    page: result.pagination.page - 1,
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
                disabled={
                  result.pagination.page >= result.pagination.totalPages
                }
              >
                <Link
                  href={buildHref({
                    service: params.service,
                    status,
                    page: result.pagination.page + 1,
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
