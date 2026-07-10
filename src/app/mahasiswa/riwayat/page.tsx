import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { getDefaultRedirectByRole } from "@/lib/auth-redirect";
import { getStudentRequestHistory } from "@/lib/student-request-history";
import type { RequestStatus } from "@/types/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StudentHistoryPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

const statuses = new Set<RequestStatus>([
  "pending",
  "inProgress",
  "completed",
  "delivered",
  "sikApprovalPending",
  "sikApprovalRejected",
  "sikApprovalVerified",
  "sikFinalSubmitted",
]);

const statusStyles = {
  pending: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
  inProgress: "border-[#c9ddf0] bg-[#edf7ff] text-[#285b7c]",
  completed: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  delivered: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  sikApprovalPending: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
  sikApprovalRejected: "border-[#f1c6c6] bg-[#fff0f0] text-[#8f1d1d]",
  sikApprovalVerified: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  sikFinalSubmitted: "border-[#d8d4e4] bg-[#fbfaff] text-[#4f4a5f]",
} satisfies Record<RequestStatus, string>;

function parseStatus(value?: string) {
  if (!value || !statuses.has(value as RequestStatus)) return undefined;
  return value as RequestStatus;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function StudentHistoryPage({
  searchParams,
}: StudentHistoryPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/mahasiswa/riwayat");
  }

  if (session.user.role !== "student") {
    redirect(getDefaultRedirectByRole(session.user.role));
  }

  if (!session.user.npm) {
    redirect("/layanan");
  }

  const params = await searchParams;
  const result = await getStudentRequestHistory({
    npm: session.user.npm,
    status: parseStatus(params.status),
    page: Number(params.page ?? 1),
    limit: Number(params.limit ?? 10),
  });

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <Link href="/layanan">
            <ArrowLeft className="size-4" />
            Kembali ke Layanan
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-normal">
          Riwayat Pengajuan
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session.user.name ?? "Mahasiswa"} · NPM {session.user.npm}
        </p>
      </div>

      {result.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada pengajuan</CardTitle>
            <CardDescription>
              Pengajuan layanan yang memakai NPM session ini akan muncul di
              sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/layanan">Lihat Layanan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {result.data.map((request) => (
            <Card key={`${request.sourceTable}-${request.id}`}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{request.serviceTitle}</CardTitle>
                    <CardDescription>
                      {formatDate(request.requestDate)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-sm ${statusStyles[request.status]}`}
                  >
                    {request.statusLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {request.description ? (
                  <p className="text-sm text-muted-foreground">
                    {request.description}
                  </p>
                ) : null}
                <div>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/mahasiswa/riwayat/${request.serviceSlug}/${request.id}`}
                    >
                      Detail
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
