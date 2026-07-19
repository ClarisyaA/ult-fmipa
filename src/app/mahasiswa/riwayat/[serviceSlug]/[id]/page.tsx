import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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

export default async function StudentHistoryDetailPage({
  params,
}: StudentHistoryDetailPageProps) {
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
            <CardHeader className="px-8 pt-8 pb-2 sm:px-10 sm:pt-10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl font-black tracking-tight text-[#18130E] sm:text-3xl">
                    {detail.serviceTitle}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`rounded-sm font-medium px-3 py-1 shrink-0 ${statusColor}`}
                >
                  {detail.statusLabel}
                </Badge>
              </div>
              <CardDescription className="mt-2 text-[#7A6A5C]">
                Pengajuan ini hanya dapat dilihat oleh pemilik NPM di session.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 sm:px-10 sm:pb-10 space-y-6">
              {/* Detail Pengajuan */}
              <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-6">
                <h3 className="text-sm font-semibold text-[#18130E] mb-4">
                  Detail Pengajuan
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-[#7A6A5C]">Tanggal Pengajuan</p>
                    <p className="mt-1 text-sm font-medium text-[#18130E]">
                      {formatDate(detail.requestDate)}
                    </p>
                  </div>
                  {detail.description ? (
                    <div>
                      <p className="text-sm text-[#7A6A5C]">Keterangan</p>
                      <p className="mt-1 text-sm font-medium text-[#18130E]">
                        {detail.description}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Attachments */}
              <RequestAttachmentsList attachments={attachments} />

              {/* SIK Workflow */}
              {detail.sourceTable === "surat_izin_kegiatan" &&
              !detail.finalSubmittedDate ? (
                <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-6">
                  <h3 className="text-sm font-semibold text-[#18130E] mb-1">
                    Tindak Lanjut SIK
                  </h3>
                  <p className="text-sm text-[#7A6A5C] mb-4">
                    Lengkapi tahap SIK sesuai status verifikasi terbaru.
                  </p>
                  <SikRequestWorkflow latestRequest={detail} />
                </div>
              ) : null}

              {/* Survey */}
              <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-6">
                <h3 className="text-sm font-semibold text-[#18130E] mb-1">
                  Survei Kepuasan
                </h3>
                <p className="text-sm text-[#7A6A5C]">
                  {canSubmitSurvey
                    ? survey
                      ? "Survei untuk pengajuan ini sudah diisi."
                      : "Isi survei kepuasan dari halaman survei."
                    : "Survei dapat diisi setelah layanan selesai diproses."}
                </p>
                {canSubmitSurvey && !survey ? (
                  <div className="mt-4">
                    <Button asChild variant="outline" className="border-[#DDD5C3] hover:border-[#EE1C25] hover:bg-[#EE1C25]/5 hover:text-[#EE1C25]">
                      <Link href="/survei">Isi Survei Kepuasan</Link>
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Alur Status */}
              <div className="rounded-lg border-2 border-[#DDD5C3] bg-white/50 p-6">
                <h3 className="text-sm font-semibold text-[#18130E] mb-1">
                  Alur Status
                </h3>
                <p className="text-sm text-[#7A6A5C] mb-4">
                  Timeline read-only dari proses layanan.
                </p>
                <div className="space-y-4">
                  {detail.workflow.map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <div
                        className={
                          item.done
                            ? "mt-1 size-3 rounded-full bg-[#EE1C25] shrink-0"
                            : "mt-1 size-3 rounded-full border-2 border-[#DDD5C3] shrink-0"
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-[#18130E]">
                          {item.label}
                        </p>
                        <p className="text-sm text-[#7A6A5C]">
                          {formatDate(item.date)}
                          {item.staff ? ` - ${item.staff}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}