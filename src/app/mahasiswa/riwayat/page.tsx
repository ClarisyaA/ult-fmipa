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
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";
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
  let result: Awaited<ReturnType<typeof getStudentRequestHistory>> | null = null;

  try {
    result = await getStudentRequestHistory({
      npm: session.user.npm,
      status: parseStatus(params.status),
      page: Number(params.page ?? 1),
      limit: Number(params.limit ?? 10),
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    logServerError("mahasiswa:riwayat", error);
  }

  return (
    <main className="relative bg-[#FEFDF9]" data-testid="student-history-page">
      <section className="mx-auto w-full max-w-4xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <Button 
          asChild 
          variant="ghost" 
          className="-ml-2 mb-6 text-[#6B5E52] hover:text-[#EE1C25] hover:bg-transparent"
        >
          <Link href="/layanan">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Layanan
          </Link>
        </Button>

        <div className="relative rounded-3xl border-2 border-[#DDD5C3] bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#EE1C25] to-[#C41720]" />
          
          <Card className="border-0 shadow-none bg-transparent rounded-none">
            <CardHeader className="px-8 pt-8 pb-2 sm:px-10 sm:pt-10">
              <CardTitle className="text-2xl font-black tracking-tight text-[#18130E] sm:text-3xl">
                Riwayat Pengajuan
              </CardTitle>
              <CardDescription className="mt-2 text-[#7A6A5C]">
                {session.user.name ?? "Mahasiswa"} · NPM {session.user.npm}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 sm:px-10 sm:pb-10">
              {!result ? (
                <div className="rounded-lg border border-[#F5F0E8] bg-[#F7F3EA]/30 p-6 text-center">
                  <p className="text-[#7A6A5C] mb-4">
                    Data belum dapat dimuat. Koneksi database sedang tidak tersedia.
                  </p>
                  <Button asChild variant="outline" className="border-[#DDD5C3] hover:bg-[#F5F0E8]">
                    <Link href="/mahasiswa/riwayat">Muat ulang</Link>
                  </Button>
                </div>
              ) : result.data.length === 0 ? (
                <div className="rounded-lg border border-[#F5F0E8] bg-[#F7F3EA]/30 p-6 text-center">
                  <p className="text-[#7A6A5C] mb-2">Belum ada pengajuan</p>
                  <p className="text-sm text-[#7A6A5C]/70 mb-4">
                    Pengajuan layanan yang memakai NPM ini akan muncul di sini.
                  </p>
                  <Button asChild className="bg-[#EE1C25] hover:bg-[#C41720] text-white">
                    <Link href="/layanan">Lihat Layanan</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.data.map((request) => (
                    <div
                      key={`${request.sourceTable}-${request.id}`}
                      className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-6 transition-all hover:border-[#EE1C25]/30 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-[#18130E]">
                            {request.serviceTitle}
                          </h3>
                          <p className="text-sm text-[#7A6A5C] mt-0.5">
                            {formatDate(request.requestDate)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`rounded-sm font-medium px-3 py-1 ${statusStyles[request.status]}`}
                        >
                          {request.statusLabel}
                        </Badge>
                      </div>

                      {request.description && (
                        <p className="text-sm text-[#7A6A5C] mt-3 line-clamp-2">
                          {request.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-3">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-[#DDD5C3] hover:border-[#EE1C25] hover:bg-[#EE1C25]/5 hover:text-[#EE1C25]"
                        >
                          <Link
                            href={`/mahasiswa/riwayat/${request.serviceSlug}/${request.id}`}
                          >
                            Lihat Detail
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}