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
import { getRequestDetail } from "@/lib/legacy-request-detail";
import {
  getServiceRequestList,
  maskNpm,
  parseRequestStatus,
} from "@/lib/legacy-request-list";
import { getPublicServices } from "@/lib/legacy-services";
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

type RequestColumn = {
  key: string;
  label: string;
  className?: string;
  cellClassName?: string;
  nowrap?: boolean;
  align?: "left" | "center" | "right";
  workflowAction?: RequestStatusAction;
  value: (request: ServiceRequestListItem) => string | null;
};

function supportsInlineStatus(request: ServiceRequestListItem) {
  if (unsupportedInlineStatusTables.has(request.sourceTable)) {
    return false;
  }

  if (request.sourceTable !== "surat_izin_kegiatan") {
    return true;
  }

  return ["sikFinalSubmitted", "inProgress", "completed"].includes(
    request.status,
  );
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

const compactText = "max-w-[175px]";
const compactLongText = "max-w-[270px]";
const compactDate = "w-[148px]";

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
      { key: "dikirim", label: "Diambil/Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
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
      { key: "dikirim", label: "Diambil/Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
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
      { key: "delivery", label: "Diambil/Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
    ];
  }

  return [
    { key: "pemohon", label: "Pemohon", className: "max-w-[170px]", value: (row) => `${dash(row.npm)}${row.requesterName ? ` - ${row.requesterName}` : ""}` },
    { key: "layanan", label: "Layanan", className: compactLongText, value: (row) => row.serviceTitle },
    { key: "ringkasan", label: "Ringkasan", className: "max-w-[260px]", value: (row) => row.purpose },
    { key: "tanggal", label: "Permintaan", className: compactDate, nowrap: true, value: (row) => formatFullDateTime(row.requestDate) },
    { key: "proses", label: "Proses", className: compactDate, nowrap: true, workflowAction: "process", value: (row) => formatFullDateTime(row.processDate) },
    { key: "selesai", label: "Selesai", className: compactDate, nowrap: true, workflowAction: "complete", value: (row) => formatFullDateTime(row.completedDate) },
    { key: "delivery", label: "Diambil/Dikirim", className: compactDate, nowrap: true, workflowAction: "deliver", value: (row) => formatFullDateTime(row.deliveredDate) },
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

function AdminRequestPreview({
  request,
  detail,
  staffName,
  closeHref,
}: {
  request: ServiceRequestListItem;
  detail: ServiceRequestDetail;
  staffName: string;
  closeHref: string;
}) {
  const profileRows = [
    { label: "Nama", value: detail.requesterName },
    { label: "NPM", value: detail.npm },
    { label: "Email", value: detail.requesterEmail },
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
        }
      : null,
    detail.finalSubmittedDate
      ? {
          label: "Final Submit SIK",
          value: formatFullDateTime(detail.finalSubmittedDate),
          done: true,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; done: boolean }>;

  return (
    <aside className="sticky top-4 max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden rounded-lg border border-[#d8e2d7] bg-[#fbfdf9] shadow-[0_2px_10px_rgba(47,38,20,0.08)]">
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
          <InlineStatusAction
            rolePrefix="admin"
            serviceSlug={request.serviceSlug}
            id={request.id}
            status={request.status}
            staffName={staffName}
            supported={supportsInlineStatus(request)}
          />

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
              Data Pemohon
            </p>
            <DetailRows rows={profileRows} />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
              Detail Layanan
            </p>
            <DetailRows rows={requestRows} />
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#718170]">
              Lampiran
            </p>
            <div className="flex items-center gap-2 rounded-md border border-[#d8e2d7] bg-white px-3 py-2 text-xs text-[#4c554f]">
              <FileText className="size-4 text-[#2d6a4f]" />
              Metadata lampiran mengikuti detail pengajuan.
            </div>
          </div>

          <RequestDeleteButton
            serviceSlug={request.serviceSlug}
            id={request.id}
            compact
          />
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

  if (!column.workflowAction) {
    return (
      <span
        className="block overflow-hidden text-ellipsis whitespace-nowrap"
        title={dash(value)}
      >
        {dash(value)}
      </span>
    );
  }

  if (value && value !== "-") {
    return (
      <span
        className="block overflow-hidden text-ellipsis whitespace-nowrap"
        title={value}
      >
        {value}
      </span>
    );
  }

  if (!supportsInlineStatus(request)) {
    return <span title="-">-</span>;
  }

  return (
    <RequestStatusActionButton
      rolePrefix="admin"
      serviceSlug={request.serviceSlug}
      id={request.id}
      status={request.status}
      staffName={staffName}
      supported={supportsInlineStatus(request)}
      action={column.workflowAction}
      label={column.workflowAction === "deliver" ? "Kirim" : undefined}
      compact
    />
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
  const selectedRequest = result.data.find(
    (request) =>
      request.serviceSlug === params.previewService &&
      request.id === params.previewId,
  );
  let selectedDetail: ServiceRequestDetail | null = null;

  if (params.previewService && params.previewId && !unavailable) {
    try {
      selectedDetail = await getRequestDetail(
        params.previewService,
        params.previewId,
      );
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

      <AdminSectionCard
        title="Filter"
        description="Filter berdasarkan status dan layanan. Data pemohon ditampilkan terbatas untuk kebutuhan operasional."
      >
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-[12px] font-bold text-[#173d2d]">
              Pilih Status Pengajuan
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className={`inline-flex h-9 shrink-0 items-center rounded-md border px-4 text-[12px] font-bold shadow-sm ${
                  !status
                    ? "border-[#0f3d2e] bg-[#0f3d2e] text-white"
                    : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
                }`}
                href={buildHref({
                  category: activeCategory,
                  service: params.service,
                  sort,
                  limit,
                })}
              >
                Semua
              </Link>
              {statusOptions.map((option) => (
                <Link
                  key={option.value}
                  className={`inline-flex h-9 shrink-0 items-center rounded-md border px-4 text-[12px] font-bold shadow-sm ${
                    status === option.value
                      ? "border-[#0f3d2e] bg-[#0f3d2e] text-white"
                      : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
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
          </div>

          <div>
            <p className="mb-2 text-[12px] font-bold text-[#173d2d]">
              Pilih Kelompok Layanan
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleGroups.map((group) => {
                const isActive = activeCategory === group.value;

                return (
                  <Link
                    key={group.value}
                    className={`inline-flex min-h-10 items-center rounded-md border px-4 text-[12px] font-bold shadow-sm ${
                      isActive
                        ? "border-[#0f3d2e] bg-[#0f3d2e] text-white"
                        : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
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
          </div>

          <div>
            <p className="mb-2 text-[12px] font-bold text-[#173d2d]">
              Pilih Jenis Layanan
            </p>
            <div className="grid gap-3 rounded-md border border-[#eee6d9] bg-[#fffdf9] p-3">
              <div className="flex flex-wrap gap-2">
                <Link
                  className={`inline-flex min-h-9 items-center rounded-md border px-4 text-[12px] font-bold shadow-sm ${
                    !params.service
                      ? "border-[#0f3d2e] bg-[#0f3d2e] text-white"
                      : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
                  }`}
                  href={buildHref({
                    category: activeCategory,
                    status,
                    sort,
                    limit,
                  })}
                >
                  Semua layanan di kelompok ini
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {visibleServices.map((service) => (
                  <Link
                    key={service.slug}
                    className={`inline-flex min-h-9 items-center rounded-md border px-4 text-[12px] font-bold shadow-sm ${
                      params.service === service.slug
                        ? "border-[#0f3d2e] bg-[#0f3d2e] text-white"
                        : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
                    }`}
                    href={buildHref({
                      category: activeCategory,
                      service: service.slug,
                      status,
                      sort,
                      limit,
                    })}
                  >
                    {service.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#eee6d9] pt-3">
            <RequestExportButton
              href={buildExportHref({ scope: "all", sort })}
              label="Download Semua Data"
              variant="outline"
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
            />
            <p className="basis-full text-[11px] text-[#7a7166] sm:basis-auto">
              Semua Data mengunduh seluruh pengajuan. Sesuai Filter mengunduh
              semua halaman pada status, kelompok, atau layanan yang dipilih.
            </p>
          </div>
        </div>
      </AdminSectionCard>

      <div
        className={`grid min-w-0 gap-4 ${
          hasPreview ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""
        }`}
      >
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
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e8dfd0] bg-[#fffdf9] px-3 py-2">
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
                  <Table className="w-max min-w-full table-auto">
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
                        <TableHead className="h-8 w-[102px] px-2 text-center text-[10px] font-bold text-[#244934]">
                          Status
                        </TableHead>
                        <TableHead className="h-8 w-[112px] px-2 text-center text-[10px] font-bold text-[#244934]">
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
                            <TableCell className="w-[42px] px-2 py-2 text-center">
                              <BulkRequestSelectRow item={bulkItem} />
                            </TableCell>
                            {columns.map((column) => (
                              <TableCell
                                key={column.key}
                                className={`px-2 py-2 text-[11px] leading-snug text-[#303b34] ${
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
                            <TableCell className="w-[102px] px-2 py-2 text-center">
                              <AdminStatusBadge tone={getStatusTone(request.status)}>
                                {request.statusLabel}
                              </AdminStatusBadge>
                            </TableCell>
                            <TableCell className="w-[112px] px-2 py-2">
                              <div className="grid w-[104px] grid-cols-2 gap-1">
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
                                  <Link
                                    href={buildHref({
                                      category: activeCategory,
                                      service: params.service,
                                      status,
                                      sort,
                                      page: result.pagination.page,
                                      limit,
                                      previewService: request.serviceSlug,
                                      previewId: request.id,
                                    })}
                                    scroll={false}
                                  >
                                    <span className="inline-flex items-center gap-1">
                                      <Eye className="size-3" />
                                      Detail
                                    </span>
                                  </Link>
                                </Button>
                                <RequestDeleteButton
                                  serviceSlug={request.serviceSlug}
                                  id={request.id}
                                  compact
                                />
                              </div>
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

        {previewRequest && selectedDetail ? (
          <AdminRequestPreview
            request={previewRequest}
            detail={selectedDetail}
            staffName={staffName}
            closeHref={closePreviewHref}
          />
        ) : null}
      </div>
    </AdminPageShell>
  );
}
