import Link from "next/link";
import { CheckCircle2, Eye, FileText, Info, X } from "lucide-react";

import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPageShell,
  AdminSectionCard,
  AdminStatusBadge,
  AdminTableScroll,
  AdminUnavailableState,
} from "@/components/admin/admin-ui";
import { CsvDownloadButton } from "@/components/admin/csv-download-button";
import { RequestExportButton } from "@/components/admin/request-export-button";
import {
  BulkRequestDeleteProvider,
  BulkRequestDeleteToolbar,
  BulkRequestSelectAll,
  BulkRequestSelectRow,
} from "@/components/requests/bulk-request-delete";
import {
  InlineStatusAction,
  RequestStatusActionButton,
} from "@/components/requests/inline-status-action";
import { RequestDeleteButton } from "@/components/requests/request-delete-button";
import { RequestEmailHelper } from "@/components/requests/request-email-helper";
import { RequestStatusCancelButton } from "@/components/requests/request-status-cancel-button";
import { SikApprovalActions } from "@/components/requests/sik-approval-actions";
import { ServiceFilterSelect } from "@/components/requests/service-filter-select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth";
import { isDatabaseUnavailableError, logServerError } from "@/lib/error-utils";
import { getPrintableLetterService } from "@/lib/letters/letter-data";
import { getRequestDetail } from "@/lib/legacy-request-detail";
import {
  getServiceRequestList,
  maskNpm,
  parseRequestStatus,
} from "@/lib/legacy-request-list";
import { getPublicServices } from "@/lib/legacy-services";
import { getRequestAttachments } from "@/lib/request-attachments";
import type { RequestAttachment } from "@/types/attachment";
import type { RequestStatus, ServiceRequestListItem } from "@/types/request";
import type { RequestStatusAction } from "@/types/request-action";
import type { ServiceRequestDetail } from "@/types/request-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestsPageProps = {
  searchParams: Promise<{
    category?: string;
    service?: string;
    status?: string;
    sort?: string;
    page?: string;
    limit?: string;
    previewService?: string;
    previewId?: string;
  }>;
};

const statusOptions: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "inProgress", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "delivered", label: "Diambil/Dikirim" },
];

const sortOptions = [
  { value: "newest", label: "Terbaru dulu" },
  { value: "oldest", label: "Terlama dulu" },
] as const;

type ServiceFilterOption = {
  title: string;
  slug: string;
  category: string;
};

const serviceGroups = [
  {
    value: "all",
    label: "Semua Kelompok",
    categories: null,
  },
  {
    value: "mahasiswa",
    label: "Layanan Mahasiswa",
    categories: ["Layanan Mahasiswa"],
  },
  {
    value: "akademik-alumni",
    label: "Layanan Akademik & Alumni",
    categories: ["Layanan Alumni"],
  },
  {
    value: "perpustakaan",
    label: "Layanan Perpustakaan",
    categories: ["Layanan Perpustakaan"],
  },
] satisfies Array<{
  value: string;
  label: string;
  categories: string[] | null;
}>;

const unsupportedInlineStatusTables = new Set(["transkrip", "ijazah"]);

function isPrintableRequest(request: Pick<ServiceRequestListItem, "serviceSlug">) {
  return Boolean(getPrintableLetterService(request.serviceSlug));
}

function isPrintableService(service: Pick<ServiceFilterOption, "slug">) {
  return Boolean(getPrintableLetterService(service.slug));
}

type ForwardRequestStatusAction = Extract<
  RequestStatusAction,
  "process" | "complete" | "deliver"
>;

type CancelRequestStatusAction = Extract<
  RequestStatusAction,
  "cancelProcess" | "cancelComplete" | "cancelDeliver"
>;

function getWorkflowCancelAction(label: string): {
  action: CancelRequestStatusAction;
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

type RequestColumn = {
  key: string;
  label: string;
  className?: string;
  cellClassName?: string;
  nowrap?: boolean;
  align?: "left" | "center" | "right";
  workflowAction?: ForwardRequestStatusAction;
  value: (request: ServiceRequestListItem) => string | null;
};

function supportsInlineStatus(request: ServiceRequestListItem) {
  if (unsupportedInlineStatusTables.has(request.sourceTable)) {
    return false;
  }

  if (request.sourceTable !== "surat_izin_kegiatan") {
    return true;
  }

  return ["sikFinalSubmitted", "inProgress", "completed", "delivered"].includes(
    request.status,
  );
}

function isSikRequest(request: Pick<ServiceRequestListItem, "sourceTable">) {
  return request.sourceTable === "surat_izin_kegiatan";
}

function showSikStagePanel(request: ServiceRequestListItem) {
  return isSikRequest(request) && !supportsInlineStatus(request);
}

function showRequestEmailHelper(request: ServiceRequestListItem) {
  return !showSikStagePanel(request);
}

function getSikStageCopy(detail: ServiceRequestDetail) {
  if (detail.approvalStatus === "rejected") {
    return {
      label: "Ditolak",
      tone: "border-[#f1c6c6] bg-[#fff0f0] text-[#8f1d1d]",
      description:
        "Bukti ACC ditolak. Mahasiswa perlu memperbaiki atau mengunggah ulang bukti persetujuan.",
    };
  }

  if (detail.approvalStatus === "verified" && !detail.finalSubmittedDate) {
    return {
      label: "Terverifikasi",
      tone: "border-[#c9ddf0] bg-[#edf7ff] text-[#285b7c]",
      description:
        "Bukti ACC sudah disetujui. Menunggu mahasiswa melengkapi form final SIK.",
    };
  }

  return {
    label: "Menunggu Verifikasi",
    tone: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
    description:
      "Bukti persetujuan kegiatan menunggu verifikasi admin atau staff.",
  };
}

function getSikWorkflowDisabledTitle(request: ServiceRequestListItem) {
  if (!isSikRequest(request) || supportsInlineStatus(request)) {
    return undefined;
  }

  if (request.status === "sikApprovalVerified") {
    return "Menunggu mahasiswa mengisi form final SIK.";
  }

  if (request.status === "sikApprovalPending") {
    return "Bukti ACC SIK belum diverifikasi.";
  }

  if (request.status === "sikApprovalRejected") {
    return "Bukti ACC SIK ditolak dan perlu diperbaiki mahasiswa.";
  }

  return "Approval SIK belum selesai.";
}

function getStatusTone(status: RequestStatus) {
  if (status === "pending" || status === "sikApprovalPending") {
    return "warning";
  }

  if (status === "sikApprovalRejected") {
    return "danger";
  }

  if (status === "inProgress" || status === "sikApprovalVerified") {
    return "info";
  }

  if (status === "completed" || status === "delivered") {
    return "success";
  }

  return "neutral";
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatFullDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return `${new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value))} WIB`;
}

function dash(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatAttachmentType(value?: string | null) {
  if (value === "manager_approval_proof") {
    return "Bukti ACC";
  }

  if (value === "final_spik_document") {
    return "Dokumen Final SPIK";
  }

  if (value === "program_study_request_letter") {
    return "Surat Permohonan Prodi";
  }

  return "Lampiran";
}

function formatLanguage(value: string | null | undefined) {
  if (value === "en") {
    return "Bahasa Inggris";
  }

  if (value === "id") {
    return "Bahasa Indonesia";
  }

  return value ?? null;
}

function contactValue(request: ServiceRequestListItem) {
  const values = [request.requesterEmail, request.requesterPhone].filter(Boolean);

  return values.length > 0 ? values.join(" / ") : null;
}

function getVisibleServiceGroups(services: ServiceFilterOption[]) {
  return serviceGroups.filter((group) => {
    if (!group.categories) {
      return true;
    }

    return services.some((service) => group.categories?.includes(service.category));
  });
}

function getCategoryServices(
  services: ServiceFilterOption[],
  category?: string,
) {
  const selectedGroup = serviceGroups.find((group) => group.value === category);

  if (!selectedGroup?.categories) {
    return services;
  }

  return services.filter((service) =>
    selectedGroup.categories?.includes(service.category),
  );
}

const compactText = "min-w-[150px] max-w-[190px]";
const compactLongText = "min-w-[220px] max-w-[300px]";
const compactDate = "min-w-[132px] max-w-[148px]";

function getRequestColumns(serviceSlug?: string): RequestColumn[] {
  if (serviceSlug === "permohonan-magang-kerja-praktek-ta") {
    return [
      { key: "npm", label: "NPM", className: "w-[96px]", nowrap: true, value: (row) => row.npm },
      { key: "nama", label: "Nama", className: compactText, value: (row) => row.requesterName },
      { key: "prodi", label: "Program Studi", className: compactText, value: (row) => row.requesterProgram },
      { key: "jenis", label: "Jenis", className: "max-w-[130px]", value: (row) => row.jenisPermohonan },
      { key: "tempat", label: "Tempat", className: compactText, value: (row) => row.tempatPelaksanaan },
      { key: "tujuan", label: "Tujuan", className: compactText, value: (row) => row.tujuanSurat },
      { key: "mulai", label: "Mulai", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.tanggalMulai) },
      { key: "selesaiTanggal", label: "Akhir", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.tanggalSelesai) },
      { key: "permintaan", label: "Permintaan", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.requestDate) },
      { key: "proses", label: "Proses", className: compactDate, nowrap: true, workflowAction: "process", value: (row) => formatFullDateTime(row.processDate) },
      { key: "selesai", label: "Selesai", className: compactDate, nowrap: true, workflowAction: "complete", value: (row) => formatFullDateTime(row.completedDate) },
      { key: "dikirim", label: "Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
    ];
  }

  if (serviceSlug === "surat-izin-kegiatan") {
    return [
      { key: "npm", label: "NPM", className: "w-[96px]", nowrap: true, value: (row) => row.npm },
      { key: "nama", label: "Nama", className: compactText, value: (row) => row.requesterName },
      { key: "prodi", label: "Program Studi", className: compactText, value: (row) => row.requesterProgram },
      { key: "himpunan", label: "Himpunan", className: compactText, value: (row) => row.namaHimpunan },
      { key: "kegiatan", label: "Kegiatan", className: compactLongText, value: (row) => row.namaKegiatan },
      { key: "tanggalKegiatan", label: "Tanggal Kegiatan", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.tanggalKegiatan) },
      { key: "approval", label: "Approval", className: "max-w-[120px]", nowrap: true, value: (row) => row.approvalStatus },
      { key: "final", label: "Final Submit", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.finalSubmittedDate) },
      { key: "permintaan", label: "Permintaan", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.requestDate) },
      { key: "proses", label: "Proses", className: compactDate, nowrap: true, workflowAction: "process", value: (row) => formatFullDateTime(row.processDate) },
      { key: "selesai", label: "Selesai", className: compactDate, nowrap: true, workflowAction: "complete", value: (row) => formatFullDateTime(row.completedDate) },
      { key: "dikirim", label: "Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
    ];
  }

  if (serviceSlug) {
    return [
      { key: "npm", label: "NPM", className: "w-[96px]", nowrap: true, value: (row) => row.npm },
      { key: "nama", label: "Nama", className: compactText, value: (row) => row.requesterName },
      { key: "prodi", label: "Program Studi", className: compactText, value: (row) => row.requesterProgram },
      { key: "kontak", label: "Email & No HP", className: compactLongText, value: contactValue },
      { key: "utama", label: "Keperluan", className: "max-w-[240px]", value: (row) => row.mainField ?? row.purpose },
      { key: "permintaan", label: "Permintaan", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.requestDate) },
      { key: "proses", label: "Proses", className: compactDate, nowrap: true, workflowAction: "process", value: (row) => formatFullDateTime(row.processDate) },
      { key: "selesai", label: "Selesai", className: compactDate, nowrap: true, workflowAction: "complete", value: (row) => formatFullDateTime(row.completedDate) },
      { key: "delivery", label: "Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
    ];
  }

  return [
    { key: "pemohon", label: "Pemohon", className: "min-w-[170px] max-w-[220px]", value: (row) => `${dash(row.npm)}${row.requesterName ? ` - ${row.requesterName}` : ""}` },
    { key: "layanan", label: "Layanan", className: compactLongText, value: (row) => row.serviceTitle },
    { key: "ringkasan", label: "Ringkasan", className: "max-w-[260px]", value: (row) => row.purpose },
    { key: "tanggal", label: "Permintaan", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.requestDate) },
    { key: "proses", label: "Proses", className: compactDate, nowrap: true, workflowAction: "process", value: (row) => formatFullDateTime(row.processDate) },
    { key: "selesai", label: "Selesai", className: compactDate, nowrap: true, workflowAction: "complete", value: (row) => formatFullDateTime(row.completedDate) },
    { key: "delivery", label: "Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
  ];
}

function buildHref(params: {
  category?: string;
  service?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
  previewService?: string;
  previewId?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params.service) searchParams.set("service", params.service);
  if (params.status) searchParams.set("status", params.status);
  if (params.sort && params.sort !== "newest") {
    searchParams.set("sort", params.sort);
  }
  if (params.previewService) {
    searchParams.set("previewService", params.previewService);
  }
  if (params.previewId) searchParams.set("previewId", params.previewId);
  if (params.page && params.page > 1)
    searchParams.set("page", String(params.page));
  if (params.limit && params.limit !== 10) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return query ? `/admin/requests?${query}` : "/admin/requests";
}

function buildExportHref(params: {
  scope: "all" | "filtered";
  category?: string;
  service?: string;
  status?: string;
  sort?: string;
}) {
  const searchParams = new URLSearchParams({ scope: params.scope });

  if (params.scope === "filtered") {
    if (params.category && params.category !== "all") {
      searchParams.set("category", params.category);
    }
    if (params.service) searchParams.set("service", params.service);
    if (params.status) searchParams.set("status", params.status);
  }
  if (params.sort === "oldest") searchParams.set("sort", "oldest");

  return `/api/admin/requests/export?${searchParams.toString()}`;
}

function DetailRows({
  rows,
}: {
  rows: Array<{ label: string; value: string | number | null | undefined }>;
}) {
  const visibleRows = rows.filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== "",
  );

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 rounded-md border border-[#d8e2d7] bg-white p-3">
      {visibleRows.map((row) => (
        <div key={row.label} className="grid gap-1 text-xs">
          <span className="text-[#6f746f]">{row.label}</span>
          <span className="break-words font-semibold text-[#223027]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function AttachmentRows({ attachments }: { attachments: RequestAttachment[] }) {
  if (attachments.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[#d8e2d7] bg-white px-3 py-2 text-xs text-[#4c554f]">
        <FileText className="size-4 text-[#2d6a4f]" />
        Belum ada lampiran.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="grid gap-2 rounded-md border border-[#d8e2d7] bg-white px-3 py-2 text-xs text-[#4c554f]"
        >
          <div className="flex min-w-0 items-start gap-2">
            <FileText className="mt-0.5 size-4 shrink-0 text-[#2d6a4f]" />
            <div className="min-w-0">
              <p className="break-words font-semibold text-[#223027]">
                {attachment.originalName}
              </p>
              <p className="mt-0.5 text-[#6f746f]">
                {formatAttachmentType(attachment.attachmentType)}
              </p>
            </div>
          </div>
          <Link
            className="w-fit font-semibold text-[#0f5b45] underline-offset-4 hover:underline"
            href={`/api/attachments/${attachment.id}`}
            target="_blank"
          >
            Buka
          </Link>
        </div>
      ))}
    </div>
  );
}

function SikWorkflowPreviewCard({
  rolePrefix,
  detail,
  attachments,
}: {
  rolePrefix: "admin" | "staff";
  detail: ServiceRequestDetail;
  attachments: RequestAttachment[];
}) {
  const copy = getSikStageCopy(detail);
  const proofAttachments = attachments.filter(
    (attachment) => attachment.attachmentType === "manager_approval_proof",
  );

  return (
    <div
      className="grid gap-3 rounded-md border border-[#d8e2d7] bg-white p-3"
      data-tour="admin-sik-verification"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#173d2d]">
            Verifikasi Surat Izin Kegiatan
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#5f6b63]">
            {copy.description}
          </p>
        </div>
        <span
          className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold ${copy.tone}`}
        >
          {copy.label}
        </span>
      </div>

      {detail.approvalRejectReason ? (
        <div className="rounded-md border border-[#f1c6c6] bg-[#fff7f7] px-3 py-2 text-xs text-[#7a1c1c]">
          <span className="font-semibold">Alasan penolakan: </span>
          {detail.approvalRejectReason}
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
          Bukti ACC
        </p>
        <AttachmentRows attachments={proofAttachments} />
      </div>

      <SikApprovalActions
        rolePrefix={rolePrefix}
        id={detail.id}
        approvalStatus={detail.approvalStatus}
        finalSubmitted={Boolean(detail.finalSubmittedDate)}
      />

      {detail.approvalStatus !== "pending" ? (
        <p className="text-xs leading-relaxed text-[#6f746f]">
          Pengiriman email dan proses status layanan tersedia setelah form final
          SIK dikirim mahasiswa.
        </p>
      ) : null}
    </div>
  );
}

function AdminRequestPreview({
  request,
  detail,
  attachments,
  staffName,
  closeHref,
}: {
  request: ServiceRequestListItem;
  detail: ServiceRequestDetail;
  attachments: RequestAttachment[];
  staffName: string;
  closeHref: string;
}) {
  const profileRows = [
    { label: "Nama", value: detail.requesterName },
    { label: "NPM", value: detail.npm },
    { label: "Email", value: detail.requesterEmail },
    { label: "Bahasa Surat", value: formatLanguage(detail.bahasaSurat) },
    { label: "No HP", value: detail.requesterPhone },
    { label: "Program Studi", value: detail.requesterProgram },
    { label: "Jenjang", value: detail.requesterLevel },
    { label: "Angkatan", value: detail.requesterClassYear },
  ];
  const requestRows = [
    { label: "Layanan", value: detail.serviceTitle },
    { label: "Keperluan", value: detail.keperluan },
    { label: "Keterangan", value: detail.keterangan },
    { label: "Beasiswa", value: detail.beasiswa },
    { label: "Pengantar", value: detail.pengantar },
    { label: "Ditujukan", value: detail.ditujukan },
    { label: "Jenis Permohonan", value: detail.jenisPermohonan },
    { label: "Kontak Person", value: detail.kontakPerson },
    { label: "Tempat Pelaksanaan", value: detail.tempatPelaksanaan },
    { label: "Tujuan Surat", value: detail.tujuanSurat },
    { label: "Alamat Surat", value: detail.alamatSurat },
    { label: "Kecamatan dan Kabupaten", value: detail.kecamatanKabupaten },
    { label: "Kota / Kabupaten", value: detail.kotaKabupaten },
    { label: "Provinsi", value: detail.provinsi },
    {
      label: "Tanggal Mulai",
      value: detail.tanggalMulai ? formatShortDate(detail.tanggalMulai) : null,
    },
    {
      label: "Tanggal Selesai",
      value: detail.tanggalSelesai
        ? formatShortDate(detail.tanggalSelesai)
        : null,
    },
    { label: "Jumlah Ijazah", value: detail.jumlahIjazah },
    { label: "Jumlah Transkrip", value: detail.jumlahTranskrip },
    { label: "Jumlah Terjemahan", value: detail.jumlahTranslate },
    { label: "Nama Himpunan", value: detail.namaHimpunan },
    { label: "Nama Kegiatan", value: detail.namaKegiatan },
    {
      label: "Tanggal Kegiatan",
      value: detail.tanggalKegiatan
        ? formatShortDate(detail.tanggalKegiatan)
        : null,
    },
    { label: "Email Pengiriman", value: detail.emailPengiriman },
    { label: "No HP/WA", value: detail.noHpWa },
  ];
  const workflowRows = [
    ...detail.workflow.map((item) => ({
      label: item.label,
      value: item.date
        ? `${formatFullDateTime(item.date)}${item.staff ? ` - ${item.staff}` : ""}`
        : item.done
          ? "Selesai"
          : "Belum ada timestamp",
      done: item.done,
      cancelAction: item.done ? getWorkflowCancelAction(item.label) : null,
    })),
    detail.approvalVerificationDate
      ? {
          label: "Verifikasi SIK",
          value: `${formatFullDateTime(detail.approvalVerificationDate)}${
            detail.approvalVerificationStaff
              ? ` - ${detail.approvalVerificationStaff}`
              : ""
          }`,
          done: true,
          cancelAction: null,
        }
      : null,
    detail.finalSubmittedDate
      ? {
          label: "Final Submit SIK",
          value: formatFullDateTime(detail.finalSubmittedDate),
          done: true,
          cancelAction: null,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    done: boolean;
    cancelAction: ReturnType<typeof getWorkflowCancelAction>;
  }>;

  return (
    <aside
      className="sticky top-4 max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden rounded-lg border border-[#d8e2d7] bg-[#fbfdf9] shadow-[0_2px_10px_rgba(47,38,20,0.08)]"
      data-tour="admin-requests-preview-panel"
    >
      <div className="flex items-center justify-between border-b border-[#e3eadf] bg-white px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#173d2d]">
            Detail Pengajuan
          </h2>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-[#6f746f]">
            {request.serviceTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Info className="size-4 text-[#6f746f]" />
          <Button
            asChild
            variant="ghost"
            size="icon-xs"
            className="rounded-full text-[#6f746f] hover:bg-[#edf4ea] hover:text-[#173d2d]"
            title="Tutup detail"
          >
            <Link href={closeHref} scroll={false}>
              <X className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto px-4 py-4">
        <div className="grid gap-4">
          <div
            data-tour="admin-request-status-actions"
          >
            <div data-tour="admin-preview-status-actions">
              {showSikStagePanel(request) ? (
                <SikWorkflowPreviewCard
                  rolePrefix="admin"
                  detail={detail}
                  attachments={attachments}
                />
              ) : (
                <InlineStatusAction
                  rolePrefix="admin"
                  serviceSlug={request.serviceSlug}
                  id={request.id}
                  status={request.status}
                  staffName={staffName}
                  supported={supportsInlineStatus(request)}
                />
              )}
            </div>
          </div>

          {showRequestEmailHelper(request) ? (
            <div data-tour="admin-preview-email-helper">
              <RequestEmailHelper
                serviceSlug={request.serviceSlug}
                id={request.id}
              />
            </div>
          ) : null}

          <div data-tour="admin-request-detail-data">
            <div data-tour="admin-preview-student-data">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
                Data Pemohon
              </p>
              <DetailRows rows={profileRows} />
            </div>

            <div className="mt-4" data-tour="admin-preview-request-data">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
                Detail Layanan
              </p>
              <DetailRows rows={requestRows} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
              Timestamp Workflow
            </p>
            <div className="grid gap-2 rounded-md border border-[#d8e2d7] bg-white p-3">
              {workflowRows.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-xs"
                >
                  <CheckCircle2
                    className={`mt-0.5 size-4 ${
                      item.done ? "text-[#2d6a4f]" : "text-[#b7afa3]"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#223027]">{item.label}</p>
                    <p className="mt-0.5 break-words text-[#6f746f]">
                      {item.value}
                    </p>
                    {item.cancelAction ? (
                      <RequestStatusCancelButton
                        serviceSlug={request.serviceSlug}
                        id={request.id}
                        rolePrefix="admin"
                        staffName={staffName}
                        action={item.cancelAction.action}
                        label={item.cancelAction.label}
                        confirmation={item.cancelAction.confirmation}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-tour="admin-request-attachments">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
              Lampiran
            </p>
            <div data-tour="admin-preview-attachments">
              <AttachmentRows attachments={attachments} />
            </div>
          </div>

          <div data-tour="admin-preview-delete-action">
            <RequestDeleteButton
              serviceSlug={request.serviceSlug}
              id={request.id}
              compact
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function toPreviewRequest(detail: ServiceRequestDetail): ServiceRequestListItem {
  return {
    id: detail.id,
    serviceTitle: detail.serviceTitle,
    serviceSlug: detail.serviceSlug,
    sourceTable: detail.sourceTable,
    npm: detail.npm,
    maskedNpm: maskNpm(detail.npm),
    requesterName: detail.requesterName ?? null,
    requesterProgram: detail.requesterProgram ?? null,
    requesterEmail: detail.requesterEmail ?? null,
    requesterPhone: detail.requesterPhone ?? null,
    purpose:
      detail.keperluan ??
      detail.keterangan ??
      detail.beasiswa ??
      detail.pengantar ??
      detail.jenisPermohonan ??
      null,
    requestDate: detail.requestDate,
    processDate: detail.processDate ?? null,
    completedDate: detail.completedDate ?? null,
    deliveredDate: detail.deliveredDate ?? null,
    mainField: null,
    jenisPermohonan: detail.jenisPermohonan ?? null,
    tempatPelaksanaan: detail.tempatPelaksanaan ?? null,
    tujuanSurat: detail.tujuanSurat ?? null,
    tanggalMulai: detail.tanggalMulai ?? null,
    tanggalSelesai: detail.tanggalSelesai ?? null,
    namaHimpunan: detail.namaHimpunan ?? null,
    namaKegiatan: detail.namaKegiatan ?? null,
    tanggalKegiatan: detail.tanggalKegiatan ?? null,
    approvalStatus: detail.approvalStatus ?? null,
    finalSubmittedDate: detail.finalSubmittedDate ?? null,
    status: detail.status,
    statusLabel: detail.statusLabel,
  };
}

function RequestWorkflowCell({
  request,
  column,
  staffName,
}: {
  request: ServiceRequestListItem;
  column: RequestColumn;
  staffName: string;
}) {
  const value = column.value(request);

  if (column.workflowAction && (!value || value === "-")) {
    const supported = supportsInlineStatus(request);
    const disabledTitle = getSikWorkflowDisabledTitle(request);

    if (!supported && request.sourceTable !== "surat_izin_kegiatan") {
      return <span title="Aksi status belum tersedia untuk layanan ini.">-</span>;
    }

    return (
      <RequestStatusActionButton
        rolePrefix="admin"
        serviceSlug={request.serviceSlug}
        id={request.id}
        status={request.status}
        staffName={staffName}
        supported={supported}
        action={column.workflowAction}
        label={column.workflowAction === "deliver" ? "Kirim" : undefined}
        disabledTitle={disabledTitle}
        compact
      />
    );
  }

  return (
    <span
      className={`block overflow-hidden text-ellipsis ${
        column.nowrap ? "whitespace-nowrap" : "line-clamp-2"
      }`}
      title={dash(value)}
    >
      {column.key === "layanan" && isPrintableRequest(request) ? (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <FileText
            className="size-3.5 shrink-0 text-[#0f5b45]"
            aria-label="Layanan ini memiliki template surat"
          />
          <span className="truncate">{dash(value)}</span>
        </span>
      ) : (
        dash(value)
      )}
    </span>
  );
}

function RequestActionsCell({
  isSelected,
  detailHref,
  request,
}: {
  request: ServiceRequestListItem;
  isSelected: boolean;
  detailHref: string;
}) {
  const hasPrintableTemplate = isPrintableRequest(request);

  return (
    <div
      className={`grid gap-1 ${
        hasPrintableTemplate ? "w-[156px] grid-cols-3" : "w-[104px] grid-cols-2"
      }`}
    >
      <Button
        asChild
        variant={isSelected ? "default" : "outline"}
        size="sm"
        className={`h-7 rounded-md px-1.5 text-[10px] font-semibold ${
          isSelected
            ? "bg-[#0f3d2e] text-white hover:bg-[#164b39]"
            : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
        }`}
      >
        <Link href={detailHref} scroll={false}>
          <span
            className="inline-flex items-center gap-1"
            data-tour="admin-requests-row-detail-button"
            data-tutorial-service={request.serviceSlug}
          >
            <Eye className="size-3" />
            Detail
          </span>
        </Link>
      </Button>
      {hasPrintableTemplate ? (
        <span data-tour="admin-request-letter-metadata">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 rounded-md border-[#b8d8c9] bg-[#f3fbf6] px-1.5 text-[10px] font-semibold text-[#0f5b45] hover:bg-[#e5f5eb]"
            title="Isi Data Surat dan cetak PDF resmi"
            data-tour="admin-request-print-buttons"
          >
            <Link href={`/admin/requests/${request.serviceSlug}/${request.id}`}>
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3" />
                Surat
              </span>
            </Link>
          </Button>
        </span>
      ) : null}
      <RequestDeleteButton
        serviceSlug={request.serviceSlug}
        id={request.id}
        compact
      />
    </div>
  );
}

function toBulkRequestItem(request: ServiceRequestListItem) {
  return {
    key: `${request.serviceSlug}:${request.id}`,
    serviceSlug: request.serviceSlug,
    id: request.id,
    label: `${request.serviceTitle} - ${dash(request.npm)}`,
  };
}

function toRequestCsvRow(request: ServiceRequestListItem) {
  return {
    Layanan: request.serviceTitle,
    NPM: request.npm,
    Nama: request.requesterName,
    "Program Studi": request.requesterProgram,
    "Email/No HP": contactValue(request),
    Ringkasan: request.mainField ?? request.purpose,
    "Jenis Permohonan": request.jenisPermohonan,
    "Tempat Pelaksanaan": request.tempatPelaksanaan,
    "Tujuan Surat": request.tujuanSurat,
    Permintaan: formatFullDateTime(request.requestDate),
    Proses: formatFullDateTime(request.processDate),
    Selesai: formatFullDateTime(request.completedDate),
    "Diambil/Dikirim": formatFullDateTime(request.deliveredDate),
    Status: request.statusLabel,
  };
}

export default async function AdminRequestsPage({
  searchParams,
}: RequestsPageProps) {
  const params = await searchParams;
  const services = getPublicServices();
  const activeCategory = params.category ?? "all";
  const visibleGroups = getVisibleServiceGroups(services);
  const visibleServices = getCategoryServices(services, activeCategory);
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 10);
  const status = parseRequestStatus(params.status);
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  let result: Awaited<ReturnType<typeof getServiceRequestList>>;
  let unavailable = false;

  try {
    result = await getServiceRequestList({
      service: params.service,
      serviceSlugs: params.service
        ? undefined
        : activeCategory === "all"
          ? undefined
          : visibleServices.map((service) => service.slug),
      status,
      sort,
      page,
      limit,
    });
  } catch (error) {
    if (!isDatabaseUnavailableError(error)) {
      throw error;
    }
    unavailable = true;
    logServerError("admin:requests:list", error);
    result = {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 1,
      },
    };
  }
  const user = await getCurrentUser();
  const staffName = user?.name ?? "Admin ULT";
  const totalPages = Math.max(result.pagination.totalPages, 1);
  const columns = getRequestColumns(params.service);
  const bulkItems = result.data.map(toBulkRequestItem);
  const csvRows = result.data.map(toRequestCsvRow);
  const selectedRequest = result.data.find(
    (request) =>
      request.serviceSlug === params.previewService &&
      request.id === params.previewId,
  );
  let selectedDetail: ServiceRequestDetail | null = null;
  let selectedAttachments: RequestAttachment[] = [];

  if (params.previewService && params.previewId && !unavailable) {
    try {
      selectedDetail = await getRequestDetail(
        params.previewService,
        params.previewId,
      );
      if (selectedDetail) {
        selectedAttachments = await getRequestAttachments(
          selectedDetail.serviceSlug,
          selectedDetail.sourceTable,
          selectedDetail.id,
        );
      }
    } catch (error) {
      if (!isDatabaseUnavailableError(error)) {
        throw error;
      }
      unavailable = true;
      logServerError("admin:requests:preview", error);
    }
  }
  const previewRequest =
    selectedRequest ?? (selectedDetail ? toPreviewRequest(selectedDetail) : null);
  const hasPreview = Boolean(previewRequest && selectedDetail);
  const closePreviewHref = buildHref({
    category: activeCategory,
    service: params.service,
    status,
    sort,
    page: result.pagination.page,
    limit,
  });

  return (
    <AdminPageShell wide={hasPreview}>
      <AdminPageHeader
        title="Daftar Pengajuan Layanan"
        description="Pantau dan tindak lanjuti pengajuan layanan. Detail pengajuan dibuka di panel kanan agar tabel tetap berada di halaman ini."
      />

      <section
        className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.09)]"
        data-tour="admin-requests-filters"
      >
        <div className="flex h-[58px] items-end gap-2 overflow-x-auto border-b border-[#e8dfd0] bg-white px-2 pt-2 sm:gap-3 sm:px-3">
          {visibleGroups.map((group) => {
            const isActive = activeCategory === group.value;

            return (
              <Link
                key={group.value}
                className={`flex h-[46px] min-w-max shrink-0 items-center justify-center border-b-2 px-4 text-[12px] font-bold transition-colors sm:min-w-[178px] sm:px-5 ${
                  isActive
                    ? "rounded-t-lg border-[#c79743] bg-[#0f3d2e] text-white shadow-[0_1px_2px_rgba(15,61,46,0.18)] hover:bg-[#0f3d2e] hover:text-white"
                    : "border-transparent bg-transparent text-[#536058] hover:text-[#0f3d2e]"
                }`}
                href={buildHref({
                  category: group.value,
                  status,
                  sort,
                  limit,
                })}
              >
                {group.label}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-3 bg-[#fffdf9] px-3 py-3 sm:px-4 xl:px-5">
          <div className="md:hidden">
            <ServiceFilterSelect
              services={visibleServices}
              currentService={params.service}
            />
          </div>

          <div className="hidden flex-wrap gap-2 md:flex">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className={`h-8 rounded-md px-4 text-[12px] font-bold shadow-none ${
                !params.service
                  ? "bg-[#0f3d2e] text-white hover:bg-[#0f3d2e] hover:text-white"
                  : "border border-[#e8dfd0] bg-white text-[#4f5a52] hover:bg-[#f6f1e8]"
              }`}
            >
              <Link
                href={buildHref({
                  category: activeCategory,
                  status,
                  sort,
                  limit,
                })}
              >
                Semua Pengajuan
              </Link>
            </Button>
            {visibleServices.map((service) => (
              <Button
                key={service.slug}
                asChild
                size="sm"
                variant="ghost"
                className={`h-8 rounded-md px-4 text-[12px] font-bold shadow-none ${
                  params.service === service.slug
                    ? "bg-[#0f3d2e] text-white hover:bg-[#0f3d2e] hover:text-white"
                    : "border border-[#e8dfd0] bg-white text-[#4f5a52] hover:bg-[#f6f1e8]"
                }`}
              >
                <Link
                  className="inline-flex items-center gap-1.5"
                  href={buildHref({
                    category: activeCategory,
                    service: service.slug,
                    status,
                    sort,
                    limit,
                  })}
                >
                  {isPrintableService(service) ? (
                    <FileText
                      className="size-3.5 shrink-0"
                      aria-label="Memiliki template surat"
                    />
                  ) : null}
                  {service.title}
                </Link>
              </Button>
            ))}
          </div>

          <div
            className="flex gap-4 overflow-x-auto border-t border-[#eee6d9] pt-3"
            data-tour="admin-requests-status-tabs"
          >
            <Link
              className={`h-8 shrink-0 border-b-2 px-0 text-[12px] font-semibold ${
                !status
                  ? "border-[#0f5b45] text-[#0f5b45] hover:bg-transparent"
                  : "border-transparent text-[#606860] hover:bg-transparent hover:text-[#0f5b45]"
              }`}
              href={buildHref({
                category: activeCategory,
                service: params.service,
                sort,
                limit,
              })}
            >
              Semua Status
            </Link>
            {statusOptions.map((option) => (
              <Link
                key={option.value}
                className={`h-8 shrink-0 border-b-2 px-0 text-[12px] font-semibold ${
                  status === option.value
                    ? "border-[#0f5b45] text-[#0f5b45] hover:bg-transparent"
                    : "border-transparent text-[#606860] hover:bg-transparent hover:text-[#0f5b45]"
                }`}
                href={buildHref({
                  category: activeCategory,
                  service: params.service,
                  status: option.value,
                  sort,
                  limit,
                })}
              >
                {option.label}
              </Link>
            ))}
          </div>

          <div
            className="flex flex-col gap-2 border-t border-[#eee6d9] pt-3 sm:flex-row sm:flex-wrap sm:items-center"
            data-tour="admin-requests-download"
          >
            <CsvDownloadButton
              filename="admin-requests.csv"
              rows={csvRows}
              className="h-9 w-full justify-center rounded-md border-[#e1d8ca] bg-white px-3 text-[12px] font-bold text-[#173d2d] hover:bg-[#f6f1e8] sm:w-auto"
            />
            <RequestExportButton
              href={buildExportHref({ scope: "all", sort })}
              label="Download Semua Data"
              variant="outline"
              disabled={unavailable || result.pagination.total === 0}
            />
            <RequestExportButton
              href={buildExportHref({
                scope: "filtered",
                category: activeCategory,
                service: params.service,
                status,
                sort,
              })}
              label="Download Sesuai Filter"
              disabled={unavailable || result.pagination.total === 0}
            />
            <p className="basis-full text-[11px] text-[#7a7166] sm:basis-auto">
              Semua Data mengunduh seluruh pengajuan. Sesuai Filter mengunduh
              semua halaman pada status, kelompok, atau layanan yang dipilih.
            </p>
          </div>
        </div>
      </section>

      <div
        className={`grid min-w-0 gap-4 ${
          hasPreview ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""
        }`}
      >
        <div data-tour="admin-requests-table">
          <AdminSectionCard
            title="Pengajuan"
            description={`Total ${result.pagination.total} pengajuan aman untuk ditampilkan.`}
            className="min-w-0"
          >
          <BulkRequestDeleteProvider items={bulkItems}>
            {unavailable ? (
              <AdminUnavailableState />
            ) : result.data.length === 0 ? (
              <AdminEmptyState
                title="Tidak ada pengajuan"
                description="Tidak ada pengajuan yang sesuai dengan filter saat ini."
              />
            ) : (
              <div className="grid gap-3">
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e8dfd0] bg-[#fffdf9] px-3 py-2"
                  data-tour="admin-requests-sort"
                >
                  <div>
                    <p className="text-[11px] font-bold text-[#173d2d]">
                      Urutkan Tabel
                    </p>
                    <p className="text-[10px] text-[#7a7166]">
                      Pilih apakah pengajuan terbaru atau terlama tampil dulu.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((option) => (
                      <Link
                        key={option.value}
                        className={`inline-flex h-8 items-center rounded-md border px-3 text-[11px] font-bold shadow-sm ${
                          sort === option.value
                            ? "border-[#0f3d2e] bg-[#0f3d2e] text-white"
                            : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
                        }`}
                        href={buildHref({
                          category: activeCategory,
                          service: params.service,
                          status,
                          sort: option.value,
                          limit,
                        })}
                      >
                        {option.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <BulkRequestDeleteToolbar />
                <AdminTableScroll>
                  <Table className="min-w-max table-auto">
                    <TableHeader className="bg-[#eef3ec]">
                      <TableRow className="border-[#dfe6dd] hover:bg-[#eef3ec]">
                        <TableHead className="h-8 w-[42px] px-2 text-center text-[10px] font-bold text-[#244934]">
                          <BulkRequestSelectAll />
                        </TableHead>
                        {columns.map((column) => (
                          <TableHead
                            key={column.key}
                            className={`h-8 px-2 text-[10px] font-bold text-[#244934] ${
                              column.align === "center"
                                ? "text-center"
                                : "text-left"
                            } ${column.className ?? ""}`}
                          >
                            {column.label}
                          </TableHead>
                        ))}
                        <TableHead className="h-8 w-[100px] px-2 text-center text-[10px] font-bold text-[#244934]">
                          Status
                        </TableHead>
                        <TableHead className="h-8 w-[164px] px-2 text-center text-[10px] font-bold text-[#244934]">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.data.map((request) => {
                        const isSelected =
                          previewRequest?.serviceSlug === request.serviceSlug &&
                          previewRequest.id === request.id;
                        const bulkItem = toBulkRequestItem(request);

                        return (
                          <TableRow
                            key={`${request.sourceTable}-${request.id}`}
                            className={`border-b border-[#ece7dc] transition-colors ${
                              isSelected
                                ? "bg-[#eef6ec] hover:bg-[#eef6ec]"
                                : "bg-white hover:bg-[#f8faf6]"
                            }`}
                          >
                            <TableCell className="w-[42px] px-2 py-1.5 text-center">
                              <BulkRequestSelectRow item={bulkItem} />
                            </TableCell>
                            {columns.map((column) => (
                              <TableCell
                                key={column.key}
                                className={`px-2 py-1.5 text-[11px] leading-snug text-[#303b34] ${
                                  column.nowrap ? "whitespace-nowrap" : ""
                                } ${column.className ?? ""} ${
                                  column.cellClassName ?? ""
                                }`}
                              >
                                <RequestWorkflowCell
                                  request={request}
                                  column={column}
                                  staffName={staffName}
                                />
                              </TableCell>
                            ))}
                            <TableCell className="w-[100px] px-2 py-1.5 text-center">
                              <AdminStatusBadge tone={getStatusTone(request.status)}>
                                {request.statusLabel}
                              </AdminStatusBadge>
                            </TableCell>
                            <TableCell className="w-[164px] px-2 py-1.5">
                              <RequestActionsCell
                                request={request}
                                isSelected={isSelected}
                                detailHref={buildHref({
                                  category: activeCategory,
                                  service: params.service,
                                  status,
                                  sort,
                                  page: result.pagination.page,
                                  limit,
                                  previewService: request.serviceSlug,
                                  previewId: request.id,
                                })}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AdminTableScroll>
              </div>
            )}
          </BulkRequestDeleteProvider>

          <div className="mt-4 flex flex-col items-stretch gap-3 border-t border-[#eee6d9] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#7a7166]">
              Halaman {result.pagination.page} dari {totalPages}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                disabled={result.pagination.page <= 1}
              >
                <Link
                  href={buildHref({
                    category: activeCategory,
                    service: params.service,
                    status,
                    sort,
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
                className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                disabled={result.pagination.page >= totalPages}
              >
                <Link
                  href={buildHref({
                    category: activeCategory,
                    service: params.service,
                    status,
                    sort,
                    page: result.pagination.page + 1,
                    limit,
                  })}
                >
                  Berikutnya
                </Link>
              </Button>
            </div>
          </div>
          </AdminSectionCard>
        </div>

        {previewRequest && selectedDetail ? (
          <AdminRequestPreview
            request={previewRequest}
            detail={selectedDetail}
            attachments={selectedAttachments}
            staffName={staffName}
            closeHref={closePreviewHref}
          />
        ) : null}
      </div>
    </AdminPageShell>
  );
}
