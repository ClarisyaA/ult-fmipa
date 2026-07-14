import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, FileText } from "lucide-react";

import {
  AdminPageShell,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import { LetterMetadataEditor } from "@/components/requests/letter-metadata-editor";
import { RequestAttachmentsList } from "@/components/requests/request-attachments-list";
import { RequestDeleteButton } from "@/components/requests/request-delete-button";
import { RequestEmailHelper } from "@/components/requests/request-email-helper";
import { RequestStatusCancelButton } from "@/components/requests/request-status-cancel-button";
import { RequestStatusActions } from "@/components/requests/request-status-actions";
import { SikApprovalActions } from "@/components/requests/sik-approval-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import {
  getPrintableLetterService,
  PRINTABLE_LETTER_SERVICES,
} from "@/lib/letters/letter-data";
import type { KeteranganLulusPrintReadiness } from "@/lib/letters/keterangan-lulus-data";
import { getKeteranganLulusPrintReadiness } from "@/lib/letters/keterangan-lulus-data";
import { getOfficialPrintReadiness } from "@/lib/letters/official-letter-data";
import { getRequestDetail } from "@/lib/legacy-request-detail";
import { getRequestAttachments } from "@/lib/request-attachments";
import type { RequestStatusAction } from "@/types/request-action";
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

type PrintableRequestInfo = {
  serviceSlug: keyof typeof PRINTABLE_LETTER_SERVICES;
  template: (typeof PRINTABLE_LETTER_SERVICES)[keyof typeof PRINTABLE_LETTER_SERVICES]["template"];
};

function getPrintableRequestInfo(
  serviceSlug: string,
  detail: ServiceRequestDetail,
): PrintableRequestInfo | null {
  const direct = getPrintableLetterService(detail.serviceSlug);

  if (direct) {
    return {
      serviceSlug: detail.serviceSlug as keyof typeof PRINTABLE_LETTER_SERVICES,
      template: direct.template,
    };
  }

  const fromParam = getPrintableLetterService(serviceSlug);

  if (fromParam && fromParam.sourceTable === detail.sourceTable) {
    return {
      serviceSlug: serviceSlug as keyof typeof PRINTABLE_LETTER_SERVICES,
      template: fromParam.template,
    };
  }

  const byTable = Object.entries(PRINTABLE_LETTER_SERVICES).find(
    ([, service]) => service.sourceTable === detail.sourceTable,
  );

  if (!byTable) {
    return null;
  }

  return {
    serviceSlug: byTable[0] as keyof typeof PRINTABLE_LETTER_SERVICES,
    template: byTable[1].template,
  };
}

function PrintLetterButton({
  detail,
  printableInfo,
}: {
  detail: ServiceRequestDetail;
  printableInfo: PrintableRequestInfo | null;
}) {
  if (!printableInfo) {
    return null;
  }

  return (
    <div className="grid gap-1 text-right">
      <Button asChild variant="outline">
        <Link
          href={`/api/requests/${printableInfo.serviceSlug}/${detail.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka PDF surat di tab baru"
        >
          <FileText className="size-4" />
          Cetak Surat
        </Link>
      </Button>
      <p className="max-w-[260px] text-xs text-muted-foreground">
        Pastikan Data Surat sudah lengkap sebelum mencetak PDF resmi.
      </p>
    </div>
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

function getWorkflowCancelAction(label: string): {
  action: Extract<
    RequestStatusAction,
    "cancelProcess" | "cancelComplete" | "cancelDeliver"
  >;
  label: string;
  confirmation: string;
} | null {
  if (label === "Diproses") {
    return {
      action: "cancelProcess",
      label: "Batalkan Proses",
      confirmation:
        "Batalkan status diproses? Status selesai dan diambil/dikirim juga akan dikosongkan.",
    };
  }

  if (label === "Selesai") {
    return {
      action: "cancelComplete",
      label: "Batalkan Selesai",
      confirmation:
        "Batalkan status selesai? Status diambil/dikirim juga akan dikosongkan.",
    };
  }

  if (label === "Diambil/Dikirim") {
    return {
      action: "cancelDeliver",
      label: "Batalkan Diambil/Dikirim",
      confirmation: "Batalkan status diambil/dikirim untuk pengajuan ini?",
    };
  }

  return null;
}

async function getPrintReadiness(
  printableInfo: PrintableRequestInfo | null,
  id: string,
) {
  if (!printableInfo) return null;
  const { template } = printableInfo;

  if (template === "keterangan-lulus") {
    return getKeteranganLulusPrintReadiness(id);
  }

  return getOfficialPrintReadiness(template, id);
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

  const attachments = await getRequestAttachments(
    detail.serviceSlug,
    detail.sourceTable,
    detail.id
  );
  const printableInfo = getPrintableRequestInfo(serviceSlug, detail);
  const printReadiness = await getPrintReadiness(printableInfo, detail.id);

  return (
    <AdminPageShell>
      <div>
        <Button
          asChild
          variant="ghost"
          className="-ml-2 mb-4 text-[#6B5E52] hover:bg-transparent hover:text-[#0f5b45]"
        >
          <Link href="/admin/requests">
            <ArrowLeft className="size-4" />
            Kembali ke Pengajuan
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal">
              {detail.serviceTitle}
            </h1>
            <AdminStatusBadge>{detail.statusLabel}</AdminStatusBadge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PrintLetterButton detail={detail} printableInfo={printableInfo} />
            <RequestDeleteButton
              serviceSlug={detail.serviceSlug}
              id={detail.id}
              label="Hapus Pengajuan"
              redirectTo="/admin/requests"
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-[#566258]">
          Mode terbatas. Hanya update status workflow yang diaktifkan.
        </p>
        <PrintReadinessNotice readiness={printReadiness} />
      </div>

      {detail.sourceTable === "surat_izin_kegiatan" ? (
        <SikApprovalActions
          rolePrefix="admin"
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
          rolePrefix="admin"
          staffName={user?.name ?? "Admin ULT"}
        />
      ) : (
        <div className="rounded-lg border border-[#e3d9ca] bg-[#fffdf9] p-4 text-sm text-[#6f746f]">
          Form final SIK belum dikirim oleh mahasiswa.
        </div>
      )}

      <RequestEmailHelper serviceSlug={detail.serviceSlug} id={detail.id} />

      {printableInfo ? (
        <LetterMetadataEditor
          serviceSlug={printableInfo.serviceSlug}
          id={detail.id}
          initialReadiness={printReadiness}
        />
      ) : null}

      <OptionalDetails detail={detail} />

      <RequestAttachmentsList attachments={attachments} />

      <Card>
        <CardHeader>
          <CardTitle>Alur Status</CardTitle>
          <CardDescription>
            Timeline berdasarkan kolom workflow tabel legacy. Status yang sudah
            terisi dapat dibatalkan jika perlu koreksi.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {detail.workflow.map((item) => {
            const cancelAction = item.done
              ? getWorkflowCancelAction(item.label)
              : null;

            return (
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
                  {cancelAction ? (
                    <RequestStatusCancelButton
                      serviceSlug={detail.serviceSlug}
                      id={detail.id}
                      rolePrefix="admin"
                      staffName={user?.name ?? "Admin ULT"}
                      action={cancelAction.action}
                      label={cancelAction.label}
                      confirmation={cancelAction.confirmation}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
