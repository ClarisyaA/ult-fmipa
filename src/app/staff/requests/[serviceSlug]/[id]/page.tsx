import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, FileText } from "lucide-react";

import { RequestAttachmentsList } from "@/components/requests/request-attachments-list";
import { RequestStatusActions } from "@/components/requests/request-status-actions";
import { SikApprovalActions } from "@/components/requests/sik-approval-actions";
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
import type { KeteranganLulusPrintReadiness } from "@/lib/letters/keterangan-lulus-data";
import { getKeteranganLulusPrintReadiness } from "@/lib/letters/keterangan-lulus-data";
import { getRequestDetail } from "@/lib/legacy-request-detail";
import { getRequestAttachments } from "@/lib/request-attachments";
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-[#E7DED0] bg-white p-4">
      <p className="text-sm font-semibold text-[#18130E]">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function OptionalDetails({ detail }: { detail: ServiceRequestDetail }) {
  if (detail.sourceTable === "permohonan_magang") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detail Pengajuan Magang/KP/TA</CardTitle>
          <CardDescription>
            Data pengajuan dikelompokkan sesuai kebutuhan proses layanan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DetailSection title="Data Mahasiswa">
            <DetailField label="Nama" value={detail.requesterName} />
            <DetailField label="NPM" value={detail.npm} />
            <DetailField label="Prodi" value={detail.requesterProgram} />
          </DetailSection>
          <DetailSection title="Jenis Pengajuan">
            <DetailField label="Jenis Permohonan" value={detail.jenisPermohonan} />
            <DetailField
              label="Tanggal Mulai"
              value={detail.tanggalMulai ? formatDate(detail.tanggalMulai) : null}
            />
            <DetailField
              label="Tanggal Selesai"
              value={detail.tanggalSelesai ? formatDate(detail.tanggalSelesai) : null}
            />
          </DetailSection>
          <DetailSection title="Detail Instansi">
            <DetailField label="Tempat Pelaksanaan" value={detail.tempatPelaksanaan} />
            <DetailField label="Kontak Person" value={detail.kontakPerson} />
            <DetailField label="Tujuan Surat" value={detail.tujuanSurat} />
            <DetailField label="Alamat Surat" value={detail.alamatSurat} />
            <DetailField label="Kecamatan dan Kabupaten" value={detail.kecamatanKabupaten} />
            <DetailField label="Kota / Kabupaten" value={detail.kotaKabupaten} />
            <DetailField label="Provinsi" value={detail.provinsi} />
          </DetailSection>
        </CardContent>
      </Card>
    );
  }

  if (detail.sourceTable === "surat_izin_kegiatan") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detail Surat Izin Kegiatan</CardTitle>
          <CardDescription>
            Tahap verifikasi, form final, dan pemrosesan surat dipisahkan agar mudah ditindaklanjuti.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DetailSection title="Tahap Verifikasi ACC">
            <DetailField label="Status Verifikasi" value={detail.approvalStatus} />
            <DetailField
              label="Tanggal Verifikasi"
              value={
                detail.approvalVerificationDate
                  ? formatDate(detail.approvalVerificationDate)
                  : null
              }
            />
            <DetailField label="Verifikator" value={detail.approvalVerificationStaff} />
            <DetailField label="Alasan Penolakan" value={detail.approvalRejectReason} />
          </DetailSection>
          <DetailSection title="Form Final SIK">
            <DetailField label="Nama Himpunan" value={detail.namaHimpunan} />
            <DetailField label="Nama Kegiatan" value={detail.namaKegiatan} />
            <DetailField
              label="Tanggal Kegiatan"
              value={detail.tanggalKegiatan ? formatDate(detail.tanggalKegiatan) : null}
            />
            <DetailField label="Email Pengiriman SIK" value={detail.emailPengiriman} />
            <DetailField label="No HP WA" value={detail.noHpWa} />
            <DetailField
              label="Tanggal Form Final"
              value={detail.finalSubmittedDate ? formatDate(detail.finalSubmittedDate) : null}
            />
          </DetailSection>
          <DetailSection title="Riwayat Singkat">
            <DetailField label="Bukti Diunggah" value={formatDate(detail.requestDate)} />
            <DetailField
              label="Verifikasi"
              value={
                detail.approvalVerificationDate
                  ? formatDate(detail.approvalVerificationDate)
                  : null
              }
            />
            <DetailField
              label="Form Final"
              value={detail.finalSubmittedDate ? formatDate(detail.finalSubmittedDate) : null}
            />
            <DetailField label="Diproses" value={formatDate(detail.processDate)} />
            <DetailField label="Selesai" value={formatDate(detail.completedDate)} />
            <DetailField label="Dikirim" value={formatDate(detail.deliveredDate)} />
          </DetailSection>
        </CardContent>
      </Card>
    );
  }

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
        <DetailField label="Jenis Permohonan" value={detail.jenisPermohonan} />
        <DetailField label="Kontak Person" value={detail.kontakPerson} />
        <DetailField label="Tempat Pelaksanaan" value={detail.tempatPelaksanaan} />
        <DetailField label="Tujuan Surat" value={detail.tujuanSurat} />
        <DetailField label="Alamat Surat" value={detail.alamatSurat} />
        <DetailField label="Kecamatan dan Kabupaten" value={detail.kecamatanKabupaten} />
        <DetailField label="Kota / Kabupaten" value={detail.kotaKabupaten} />
        <DetailField label="Provinsi" value={detail.provinsi} />
        <DetailField
          label="Tanggal Mulai"
          value={detail.tanggalMulai ? formatDate(detail.tanggalMulai) : null}
        />
        <DetailField
          label="Tanggal Selesai"
          value={detail.tanggalSelesai ? formatDate(detail.tanggalSelesai) : null}
        />
        <DetailField label="Status Verifikasi SIK" value={detail.approvalStatus} />
        <DetailField
          label="Tanggal Verifikasi SIK"
          value={
            detail.approvalVerificationDate
              ? formatDate(detail.approvalVerificationDate)
              : null
          }
        />
        <DetailField label="Verifikator SIK" value={detail.approvalVerificationStaff} />
        <DetailField label="Alasan Penolakan" value={detail.approvalRejectReason} />
        <DetailField
          label="Tanggal Form Final"
          value={detail.finalSubmittedDate ? formatDate(detail.finalSubmittedDate) : null}
        />
        <DetailField label="Nama Himpunan" value={detail.namaHimpunan} />
        <DetailField label="Nama Kegiatan" value={detail.namaKegiatan} />
        <DetailField
          label="Tanggal Kegiatan"
          value={detail.tanggalKegiatan ? formatDate(detail.tanggalKegiatan) : null}
        />
        <DetailField label="Email Pengiriman SIK" value={detail.emailPengiriman} />
        <DetailField label="No HP WA Contact Person" value={detail.noHpWa} />
        <DetailField label="Jumlah Ijazah" value={detail.jumlahIjazah} />
        <DetailField label="Jumlah Transkrip" value={detail.jumlahTranskrip} />
        <DetailField label="Jumlah Translate" value={detail.jumlahTranslate} />
      </CardContent>
    </Card>
  );
}

function PrintLetterButton({ detail }: { detail: ServiceRequestDetail }) {
  if (detail.serviceSlug !== "keterangan-lulus") {
    return null;
  }

  return (
    <Button asChild variant="outline">
      <Link
        href={`/api/requests/${detail.serviceSlug}/${detail.id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        title="Buka PDF surat di tab baru"
      >
        <FileText className="size-4" />
        Cetak Surat
      </Link>
    </Button>
  );
}

function PrintReadinessNotice({
  readiness,
}: {
  readiness: KeteranganLulusPrintReadiness | null;
}) {
  if (!readiness) {
    return null;
  }

  return (
    <p
      className={
        readiness.isReady
          ? "mt-1 text-sm text-[#0f5b45]"
          : "mt-1 text-sm text-[#9a3412]"
      }
    >
      {readiness.message}
    </p>
  );
}

export default async function StaffRequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { serviceSlug, id } = await params;
  const detail = await getRequestDetail(serviceSlug, id);
  const user = await getCurrentUser();

  if (!detail) {
    notFound();
  }

  const attachments = await getRequestAttachments(
    detail.serviceSlug,
    detail.sourceTable,
    detail.id
  );
  const printReadiness =
    detail.serviceSlug === "keterangan-lulus"
      ? await getKeteranganLulusPrintReadiness(detail.id)
      : null;

  return (
    <div className="grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-4">
          <Link href="/staff/requests">
            <ArrowLeft className="size-4" />
            Kembali ke Pengajuan
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal">
              {detail.serviceTitle}
            </h1>
            <Badge variant="secondary">{detail.statusLabel}</Badge>
          </div>
          <PrintLetterButton detail={detail} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Mode terbatas. Hanya update status workflow yang diaktifkan.
        </p>
        <PrintReadinessNotice readiness={printReadiness} />
      </div>

      {detail.sourceTable === "surat_izin_kegiatan" ? (
        <SikApprovalActions
          rolePrefix="staff"
          id={detail.id}
          approvalStatus={detail.approvalStatus}
          finalSubmitted={Boolean(detail.finalSubmittedDate)}
        />
      ) : null}

      {detail.sourceTable !== "surat_izin_kegiatan" ||
      detail.finalSubmittedDate ? (
        <RequestStatusActions
          serviceSlug={detail.serviceSlug}
          id={detail.id}
          currentStatus={detail.status}
          rolePrefix="staff"
          staffName={user?.name ?? "Staff ULT"}
        />
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Form final SIK belum dikirim oleh mahasiswa.
        </div>
      )}

      <OptionalDetails detail={detail} />

      <RequestAttachmentsList attachments={attachments} />

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
