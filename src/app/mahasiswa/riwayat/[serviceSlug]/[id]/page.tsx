import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RequestAttachmentsList } from "@/components/requests/request-attachments-list";
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

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <Link href="/mahasiswa/riwayat">
            <ArrowLeft className="size-4" />
            Kembali ke Riwayat Pengajuan
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-normal">
            {detail.serviceTitle}
          </h1>
          <Badge variant="secondary">{detail.statusLabel}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Pengajuan</CardTitle>
          <CardDescription>
            Pengajuan ini hanya dapat dilihat oleh pemilik NPM di session.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Tanggal Pengajuan</p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(detail.requestDate)}
            </p>
          </div>
          {detail.description ? (
            <div>
              <p className="text-sm text-muted-foreground">Keterangan</p>
              <p className="mt-1 text-sm font-medium">{detail.description}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <RequestAttachmentsList attachments={attachments} />

      <Card>
        <CardHeader>
          <CardTitle>Survei Kepuasan</CardTitle>
          <CardDescription>
            {canSubmitSurvey
              ? survey
                ? "Survei untuk pengajuan ini sudah diisi."
                : "Isi survei kepuasan dari halaman survei."
              : "Survei dapat diisi setelah layanan selesai diproses."}
          </CardDescription>
        </CardHeader>
        {canSubmitSurvey && !survey ? (
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/survei">Isi Survei Kepuasan</Link>
            </Button>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alur Status</CardTitle>
          <CardDescription>Timeline read-only dari proses layanan.</CardDescription>
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
