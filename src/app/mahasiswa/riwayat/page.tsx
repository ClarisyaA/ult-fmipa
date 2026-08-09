import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Calendar,
  AlertCircle,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusFilter } from "@/components/filter/status-filter";
import { SearchForm } from "@/components/filter/search-form";
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
    search?: string;
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

// Label status yang lebih jelas
const statusLabels: Record<RequestStatus, string> = {
  pending: "Menunggu Verifikasi",
  inProgress: "Sedang Diproses",
  completed: "Selesai",
  delivered: "Diambil/Dikirim",
  sikApprovalPending: "SIK Menunggu",
  sikApprovalRejected: "SIK Ditolak",
  sikApprovalVerified: "SIK Terverifikasi",
  sikFinalSubmitted: "SIK Final Terkirim",
};

const statusIcons: Record<RequestStatus, LucideIcon> = {
  pending: Clock,
  inProgress: Clock,
  completed: CheckCircle2,
  delivered: Send,
  sikApprovalPending: Clock,
  sikApprovalRejected: XCircle,
  sikApprovalVerified: CheckCircle2,
  sikFinalSubmitted: Send,
};

// Urutan status: Pengajuan → Diproses → Selesai → Diambil/Dikirim
const statusFlow = [
  { key: "pending", label: "Pengajuan", color: "text-[#745411]" },
  { key: "inProgress", label: "Diproses", color: "text-[#285b7c]" },
  { key: "completed", label: "Selesai", color: "text-[#2f6b44]" },
  { key: "delivered", label: "Diambil/Dikirim", color: "text-[#2f6b44]" },
];

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "inProgress", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "delivered", label: "Diambil/Dikirim" },
  { value: "sikApprovalPending", label: "SIK Menunggu" },
  { value: "sikApprovalRejected", label: "SIK Ditolak" },
  { value: "sikApprovalVerified", label: "SIK Terverifikasi" },
  { value: "sikFinalSubmitted", label: "SIK Final" },
];

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

function getStatusProgress(status: RequestStatus): number {
  const flow = ["pending", "inProgress", "completed", "delivered"];
  const idx = flow.indexOf(status);
  if (idx === -1) return 0;
  return ((idx + 1) / flow.length) * 100;
}

function getStatusStep(status: RequestStatus): number {
  const flow = ["pending", "inProgress", "completed", "delivered"];
  const idx = flow.indexOf(status);
  if (idx === -1) return 0;
  return idx + 1;
}

export default async function StudentHistoryPage({
  searchParams,
}: StudentHistoryPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/mahasiswa/riwayat");
  }

  if (session.user.role !== "MAHASISWA") {
    redirect(getDefaultRedirectByRole(session.user.role));
  }

  if (!session.user.npm) {
    redirect("/layanan");
  }

  const params = await searchParams;
  const statusFilter = parseStatus(params.status);
  const searchQuery = params.search?.toLowerCase() || "";

  let result: Awaited<ReturnType<typeof getStudentRequestHistory>> | null = null;

  try {
    result = await getStudentRequestHistory({
      npm: session.user.npm,
      status: statusFilter,
      page: Number(params.page ?? 1),
      limit: Number(params.limit ?? 10),
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    logServerError("mahasiswa:riwayat", error);
  }

  // Filter by search query
  let filteredData = result?.data || [];
  if (searchQuery) {
    filteredData = filteredData.filter(
      (item) =>
        item.serviceTitle.toLowerCase().includes(searchQuery) ||
        (item.description?.toLowerCase() || "").includes(searchQuery) ||
        item.statusLabel.toLowerCase().includes(searchQuery)
    );
  }

  // Count stats
  const totalRequests = result?.data.length || 0;
  const pendingCount = result?.data.filter(d => d.status === "pending" || d.status === "sikApprovalPending").length || 0;
  const inProgressCount = result?.data.filter(d => d.status === "inProgress").length || 0;
  const completedCount = result?.data.filter(d => d.status === "completed" || d.status === "sikApprovalVerified").length || 0;
  const deliveredCount = result?.data.filter(d => d.status === "delivered" || d.status === "sikFinalSubmitted").length || 0;
  const rejectedCount = result?.data.filter(d => d.status === "sikApprovalRejected").length || 0;

  // Build filter URLs
  const baseUrl = "/mahasiswa/riwayat";
  const currentStatus = params.status || "all";
  const currentSearch = params.search || "";

  // Build URL with filters
  const buildUrl = (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };

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
            <CardHeader className="px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight text-[#18130E] sm:text-3xl">
                    Riwayat Pengajuan
                  </CardTitle>
                  <CardDescription className="mt-1 text-[#7A6A5C]">
                    {session.user.name ?? "Mahasiswa"} · NPM {session.user.npm}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-[#DDD5C3] text-[#6B5E52] px-4 py-1.5">
                  {totalRequests} Pengajuan
                </Badge>
              </div>

              {/* Stat Cards - 5 cards */}
              <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-5">
                <Link 
                  href={buildUrl("pending", currentSearch)}
                  className={`rounded-lg bg-white/60 border border-[#DDD5C3] p-3 text-center transition-all hover:border-[#EE1C25]/30 hover:shadow-sm ${pendingCount === 0 ? 'opacity-60 cursor-default pointer-events-none' : ''}`}
                >
                  <p className="text-xs text-[#7A6A5C]">Menunggu</p>
                  <p className="text-xl font-black text-[#745411]">{pendingCount}</p>
                </Link>
                <Link 
                  href={buildUrl("inProgress", currentSearch)}
                  className={`rounded-lg bg-white/60 border border-[#DDD5C3] p-3 text-center transition-all hover:border-[#EE1C25]/30 hover:shadow-sm ${inProgressCount === 0 ? 'opacity-60 cursor-default pointer-events-none' : ''}`}
                >
                  <p className="text-xs text-[#7A6A5C]">Diproses</p>
                  <p className="text-xl font-black text-[#285b7c]">{inProgressCount}</p>
                </Link>
                <Link 
                  href={buildUrl("completed", currentSearch)}
                  className={`rounded-lg bg-white/60 border border-[#DDD5C3] p-3 text-center transition-all hover:border-[#EE1C25]/30 hover:shadow-sm ${completedCount === 0 ? 'opacity-60 cursor-default pointer-events-none' : ''}`}
                >
                  <p className="text-xs text-[#7A6A5C]">Selesai</p>
                  <p className="text-xl font-black text-[#2f6b44]">{completedCount}</p>
                </Link>
                <Link 
                  href={buildUrl("delivered", currentSearch)}
                  className={`rounded-lg bg-white/60 border border-[#DDD5C3] p-3 text-center transition-all hover:border-[#EE1C25]/30 hover:shadow-sm ${deliveredCount === 0 ? 'opacity-60 cursor-default pointer-events-none' : ''}`}
                >
                  <p className="text-xs text-[#7A6A5C]">Diambil/Dikirim</p>
                  <p className="text-xl font-black text-[#2f6b44]">{deliveredCount}</p>
                </Link>
                <Link 
                  href={buildUrl("sikApprovalRejected", currentSearch)}
                  className={`rounded-lg bg-white/60 border border-[#DDD5C3] p-3 text-center transition-all hover:border-[#EE1C25]/30 hover:shadow-sm ${rejectedCount === 0 ? 'opacity-60 cursor-default pointer-events-none' : ''}`}
                >
                  <p className="text-xs text-[#7A6A5C]">Ditolak</p>
                  <p className="text-xl font-black text-[#8f1d1d]">{rejectedCount}</p>
                </Link>
              </div>

              {/* Search & Filter */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchForm 
                  currentSearch={currentSearch}
                  currentStatus={currentStatus}
                  baseUrl={baseUrl}
                />
                
                <StatusFilter 
                  currentStatus={currentStatus}
                  currentSearch={currentSearch}
                  statusOptions={statusOptions}
                  baseUrl={baseUrl}
                />
              </div>

              {/* Reset Filter */}
              {(currentStatus !== "all" || currentSearch) && (
                <div className="mt-3">
                  <Link 
                    href={baseUrl}
                    className="text-xs text-[#EE1C25] hover:underline font-medium"
                  >
                    Reset semua filter
                  </Link>
                </div>
              )}
            </CardHeader>

            <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
              {!result ? (
                <div className="rounded-lg border border-[#F5F0E8] bg-[#F7F3EA]/30 p-8 text-center">
                  <AlertCircle className="mx-auto size-10 text-[#A0917F] mb-3" />
                  <p className="text-[#7A6A5C] mb-4">
                    Data belum dapat dimuat. Koneksi database sedang tidak tersedia.
                  </p>
                  <Button asChild variant="outline" className="border-[#DDD5C3] hover:bg-[#F5F0E8]">
                    <Link href="/mahasiswa/riwayat">Muat ulang</Link>
                  </Button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="rounded-lg border border-[#F5F0E8] bg-[#F7F3EA]/30 p-8 text-center">
                  <FileText className="mx-auto size-10 text-[#A0917F] mb-3" />
                  {searchQuery || statusFilter ? (
                    <>
                      <p className="text-[#7A6A5C] mb-2">Tidak ada hasil yang sesuai</p>
                      <p className="text-sm text-[#7A6A5C]/70">
                        Coba ubah kata kunci atau filter status
                      </p>
                      <Button asChild variant="outline" className="mt-4 border-[#DDD5C3] hover:bg-[#F5F0E8]">
                        <Link href={baseUrl}>Reset Filter</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-[#7A6A5C] mb-2">Belum ada pengajuan</p>
                      <p className="text-sm text-[#7A6A5C]/70 mb-4">
                        Pengajuan layanan yang memakai NPM ini akan muncul di sini.
                      </p>
                    </>
                  )}
                  <Button asChild className="bg-[#EE1C25] hover:bg-[#C41720] text-white">
                    <Link href="/layanan">Lihat Layanan</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData.map((request) => {
                    const StatusIcon = statusIcons[request.status] || FileText;
                    const statusColor = statusStyles[request.status] || "";
                    const progress = getStatusProgress(request.status);
                    const step = getStatusStep(request.status);
                    const statusLabel = statusLabels[request.status] || request.statusLabel;

                    return (
                      <div
                        key={`${request.sourceTable}-${request.id}`}
                        className="group rounded-xl border-2 border-[#DDD5C3] bg-white/50 p-5 transition-all hover:border-[#EE1C25]/30 hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold text-[#18130E] group-hover:text-[#EE1C25] transition-colors">
                                {request.serviceTitle}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <span className="flex items-center gap-1.5 text-xs text-[#7A6A5C]">
                                <Calendar className="size-3.5" />
                                {formatDate(request.requestDate)}
                              </span>
                              {request.description && (
                                <span className="flex items-center gap-1.5 text-xs text-[#7A6A5C]">
                                  <FileText className="size-3.5" />
                                  {request.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={`rounded-full font-medium px-3 py-1 flex items-center gap-1.5 shrink-0 ${statusColor}`}
                          >
                            <StatusIcon className="size-3" />
                            {statusLabel}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="relative">
                            <div className="flex justify-between mb-1.5">
                              {statusFlow.map((s, idx) => {
                                const isActive = idx < step;
                                return (
                                  <div key={s.key} className="flex flex-col items-center">
                                    <div className={`flex items-center gap-1.5 ${isActive ? s.color : "text-[#DDD5C3]"}`}>
                                      <div className={`size-2 rounded-full ${isActive ? "bg-[#EE1C25]" : "bg-[#DDD5C3]"}`} />
                                      <span className={`text-[10px] font-medium hidden sm:inline ${isActive ? "text-[#18130E]" : "text-[#A0917F]"}`}>
                                        {s.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="relative h-1.5 w-full rounded-full bg-[#F0EAD8] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#EE1C25] to-[#C41720] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-[#A0917F]">
                                {step} dari {statusFlow.length} tahap
                              </span>
                              <span className="text-[10px] font-medium text-[#EE1C25]">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tombol Lihat Detail */}
                        <div className="mt-4 flex items-center justify-between border-t border-[#F5F0E8] pt-4">
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}