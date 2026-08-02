import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileText, Calendar, Send, Archive } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { RequestAttachmentsList } from "@/components/requests/request-attachments-list";
import { SikRequestWorkflow } from "@/components/services/sik-request-workflow";
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
import { getStudentRequestAttachments } from "@/lib/request-attachments";
import { getSurveyForRequest } from "@/lib/service-surveys";
import { getStudentRequestDetail } from "@/lib/student-request-history";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StudentHistoryDetailPageProps = {
  params: Promise<{ serviceSlug: string; id: string }>;
};

const statusStyles = {
  pending: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
  inProgress: "border-[#c9ddf0] bg-[#edf7ff] text-[#285b7c]",
  completed: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  delivered: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  sikApprovalPending: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
  sikApprovalRejected: "border-[#f1c6c6] bg-[#fff0f0] text-[#8f1d1d]",
  sikApprovalVerified: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  sikFinalSubmitted: "border-[#d8d4e4] bg-[#fbfaff] text-[#4f4a5f]",
} satisfies Record<string, string>;

const statusLabels: Record<string, string> = {
  pending: "Menunggu Verifikasi",
  inProgress: "Sedang Diproses",
  completed: "Selesai",
  delivered: "Diambil/Dikirim",
  sikApprovalPending: "SIK Menunggu",
  sikApprovalRejected: "SIK Ditolak",
  sikApprovalVerified: "SIK Terverifikasi",
  sikFinalSubmitted: "SIK Final Terkirim",
};

const statusIcons: Record<string, LucideIcon> = {
  pending: Clock,
  inProgress: Clock,
  completed: CheckCircle2,
  delivered: Send,
  sikApprovalPending: Clock,
  sikApprovalRejected: XCircle,
  sikApprovalVerified: CheckCircle2,
  sikFinalSubmitted: Archive,
};

// Urutan status
const statusFlow = [
  { key: "pending", label: "Pengajuan", icon: FileText },
  { key: "inProgress", label: "Diproses", icon: Clock },
  { key: "completed", label: "Selesai", icon: CheckCircle2 },
  { key: "delivered", label: "Diambil/Dikirim", icon: Send },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusProgress(status: string): number {
  const flow = ["pending", "inProgress", "completed", "delivered"];
  const idx = flow.indexOf(status);
  if (idx === -1) return 0;
  return ((idx + 1) / flow.length) * 100;
}

function getStatusStep(status: string): number {
  const flow = ["pending", "inProgress", "completed", "delivered"];
  const idx = flow.indexOf(status);
  if (idx === -1) return 0;
  return idx + 1;
}

export default async function StudentHistoryDetailPage({
  params,
}: StudentHistoryDetailPageProps) {
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

  const { serviceSlug, id } = await params;
  const detail = await getStudentRequestDetail(
    session.user.npm,
    serviceSlug,
    id
  );

  if (!detail) {
    notFound();
  }

  const attachments = await getStudentRequestAttachments(
    detail.serviceSlug,
    detail.sourceTable,
    detail.id,
    session.user.npm
  );
  const canSubmitSurvey = ["completed", "delivered"].includes(detail.status);
  const survey = await getSurveyForRequest(
    detail.serviceSlug,
    detail.sourceTable,
    detail.id,
    session.user.npm
  );

  const statusColor = statusStyles[detail.status] || "";
  const StatusIcon = statusIcons[detail.status] || FileText;
  const statusLabel = statusLabels[detail.status] || detail.statusLabel;
  const progress = getStatusProgress(detail.status);
  const step = getStatusStep(detail.status);

  return (
    <main className="relative bg-[#FEFDF9]" data-testid="student-history-detail-page">
      <section className="mx-auto w-full max-w-4xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <Button 
          asChild 
          variant="ghost" 
          className="-ml-2 mb-6 text-[#6B5E52] hover:text-[#EE1C25] hover:bg-transparent"
        >
          <Link href="/mahasiswa/riwayat">
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Riwayat Pengajuan
          </Link>
        </Button>

        <div className="relative rounded-3xl border-2 border-[#DDD5C3] bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#EE1C25] to-[#C41720]" />
          
          <Card className="border-0 shadow-none bg-transparent rounded-none">
            <CardHeader className="px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl font-black tracking-tight text-[#18130E] sm:text-3xl">
                    {detail.serviceTitle}
                  </CardTitle>
                  <CardDescription className="mt-2 text-[#7A6A5C]">
                    Pengajuan ini hanya dapat dilihat oleh pemilik NPM di session.
                  </CardDescription>
                </div>

                <Badge
                  variant="outline"
                  className={`rounded-full font-medium px-4 py-1.5 flex items-center gap-2 shrink-0 ${statusColor}`}
                >
                  <StatusIcon className="size-4" />
                  {statusLabel}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="relative">
                  <div className="flex justify-between mb-1.5">
                    {statusFlow.map((s, idx) => {
                      const isActive = idx < step;
                      const Icon = s.icon;
                      return (
                        <div key={s.key} className="flex flex-col items-center">
                          <div className={`flex items-center gap-1.5 ${isActive ? "text-[#EE1C25]" : "text-[#DDD5C3]"}`}>
                            <Icon className={`size-3.5 ${isActive ? "opacity-100" : "opacity-40"}`} />
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
            </CardHeader>

            <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8 space-y-4">
              {/* 1. Detail Pengajuan */}
              <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-5">
                <h3 className="text-sm font-semibold text-[#18130E] mb-3 flex items-center gap-2">
                  <FileText className="size-4 text-[#EE1C25]" />
                  Detail Pengajuan
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#7A6A5C]">Tanggal Pengajuan</p>
                    <p className="mt-0.5 text-sm font-medium text-[#18130E] flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[#A0917F]" />
                      {formatDate(detail.requestDate)}
                    </p>
                  </div>
                  {detail.description ? (
                    <div>
                      <p className="text-xs text-[#7A6A5C]">Keterangan</p>
                      <p className="mt-0.5 text-sm font-medium text-[#18130E]">
                        {detail.description}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 2. Alur Status */}
              <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-5">
                <h3 className="text-sm font-semibold text-[#18130E] mb-3 flex items-center gap-2">
                  <Clock className="size-4 text-[#EE1C25]" />
                  Alur Status
                </h3>
                <p className="text-sm text-[#7A6A5C] mb-4">
                  Timeline read-only dari proses layanan.
                </p>
                <div className="relative pl-6 border-l-2 border-[#DDD5C3] space-y-5">
                  {detail.workflow.map((item) => (
                    <div key={item.label} className="relative">
                      <div
                        className={`absolute -left-[25px] top-0.5 size-4 rounded-full border-2 flex items-center justify-center ${
                          item.done
                            ? "border-[#EE1C25] bg-[#EE1C25]"
                            : "border-[#DDD5C3] bg-white"
                        }`}
                      >
                        {item.done && (
                          <CheckCircle2 className="size-2.5 text-white" />
                        )}
                      </div>
                      <div className={`${!item.done ? "opacity-60" : ""}`}>
                        <p className="text-sm font-medium text-[#18130E]">
                          {item.label}
                        </p>
                        <p className="text-xs text-[#7A6A5C]">
                          {formatDate(item.date)}
                          {item.staff ? ` · ${item.staff}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Lampiran */}
              <RequestAttachmentsList attachments={attachments} />

              {/* SIK Workflow - ditampilkan setelah Lampiran jika SIK */}
              {detail.sourceTable === "surat_izin_kegiatan" &&
              !detail.finalSubmittedDate ? (
                <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-5">
                  <h3 className="text-sm font-semibold text-[#18130E] mb-1 flex items-center gap-2">
                    <Clock className="size-4 text-[#EE1C25]" />
                    Tindak Lanjut SIK
                  </h3>
                  <p className="text-sm text-[#7A6A5C] mb-4">
                    Lengkapi tahap SIK sesuai status verifikasi terbaru.
                  </p>
                  <SikRequestWorkflow latestRequest={detail} />
                </div>
              ) : null}

              {/* 4. Survei Kepuasan */}
              <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-5">
                <h3 className="text-sm font-semibold text-[#18130E] mb-1 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#EE1C25]" />
                  Survei Kepuasan
                </h3>
                <p className="text-sm text-[#7A6A5C]">
                  {canSubmitSurvey
                    ? survey
                      ? "✓ Survei untuk pengajuan ini sudah diisi."
                      : "Isi survei kepuasan dari halaman survei."
                    : "Survei dapat diisi setelah layanan selesai diproses."}
                </p>
                {canSubmitSurvey && !survey ? (
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm" className="border-[#DDD5C3] hover:border-[#EE1C25] hover:bg-[#EE1C25]/5 hover:text-[#EE1C25]">
                      <Link href="/survei">Isi Survei Kepuasan</Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}