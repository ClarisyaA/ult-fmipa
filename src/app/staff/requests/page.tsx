import Link from "next/link";
import {
  ChevronRight,
  Eye,
  ExternalLink,
  FileText,
  Info,
  Search,
  X,
} from "lucide-react";

import { InlineStatusAction } from "@/components/requests/inline-status-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth";
import { getRequestDetail } from "@/lib/legacy-request-detail";
import {
  getServiceRequestList,
  parseRequestStatus,
} from "@/lib/legacy-request-list";
import { getPublicServices } from "@/lib/legacy-services";
import type { ServiceRequestDetail } from "@/types/request-detail";
import type { RequestStatus, ServiceRequestListItem } from "@/types/request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestsPageProps = {
  searchParams: Promise<{
    category?: string;
    service?: string;
    status?: string;
    page?: string;
    limit?: string;
    q?: string;
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

const serviceGroups = [
  {
    value: "mahasiswa",
    label: "Layanan Mahasiswa",
    categories: ["Layanan Mahasiswa"],
  },
  {
    value: "alumni",
    label: "Layanan Alumni",
    categories: ["Layanan Alumni"],
  },
  {
    value: "perpustakaan",
    label: "Layanan Perpustakaan",
    categories: ["Layanan Perpustakaan"],
  },
  {
    value: "tata-naskah",
    label: "Tata Naskah Dinas",
    categories: [],
  },
];

const statusStyles = {
  pending: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
  inProgress: "border-[#c9ddf0] bg-[#edf7ff] text-[#285b7c]",
  completed: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  delivered: "border-[#d7d9e5] bg-[#f4f5fa] text-[#4e5566]",
} satisfies Record<RequestStatus, string>;

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getPageItems(currentPage: number, totalPages: number) {
  const pages = new Set(
    [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(
      (pageNumber) => pageNumber >= 1 && pageNumber <= totalPages
    )
  );

  return Array.from(pages).sort((a, b) => a - b);
}

function buildHref(params: {
  category?: string;
  service?: string;
  status?: string;
  page?: number;
  limit?: number;
  q?: string;
  previewService?: string;
  previewId?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.category) searchParams.set("category", params.category);
  if (params.service) searchParams.set("service", params.service);
  if (params.status) searchParams.set("status", params.status);
  if (params.q) searchParams.set("q", params.q);
  if (params.previewService) {
    searchParams.set("previewService", params.previewService);
  }
  if (params.previewId) searchParams.set("previewId", params.previewId);
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  if (params.limit && params.limit !== 10) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();

  return query ? `/staff/requests?${query}` : "/staff/requests";
}

function getCategoryServices(category?: string) {
  const services = getPublicServices();
  const selectedGroup = serviceGroups.find((group) => group.value === category);

  if (!selectedGroup) {
    return services;
  }

  return services.filter((service) =>
    selectedGroup.categories.includes(service.category)
  );
}

function getVisibleServiceGroups() {
  const services = getPublicServices();

  return serviceGroups.filter((group) => {
    if (group.categories.length === 0) {
      return false;
    }

    return services.some((service) => group.categories.includes(service.category));
  });
}

function RequestPreview({
  request,
  detail,
  staffName,
  closeHref,
  fixedHeight = false,
}: {
  request: ServiceRequestListItem;
  detail: ServiceRequestDetail;
  staffName: string;
  closeHref: string;
  fixedHeight?: boolean;
}) {
  const displayNpm = detail.npm ?? "-";
  const profileRows = [
    { label: "Nama", value: detail.requesterName },
    { label: "NPM", value: displayNpm },
    { label: "Program Studi", value: detail.requesterProgram },
    { label: "Jenjang", value: detail.requesterLevel },
    { label: "Angkatan", value: detail.requesterClassYear },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "");
  const requestRows = [
    { label: "Keperluan", value: detail.keperluan },
    { label: "Keterangan", value: detail.keterangan },
    { label: "Beasiswa", value: detail.beasiswa },
    { label: "Pengantar", value: detail.pengantar },
    { label: "Ditujukan", value: detail.ditujukan },
    { label: "Jumlah Ijazah", value: detail.jumlahIjazah },
    { label: "Jumlah Transkrip", value: detail.jumlahTranskrip },
    { label: "Jumlah Terjemahan", value: detail.jumlahTranslate },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "");

  return (
    <aside
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#d8d4e4] bg-[#fbfaff] shadow-sm transition-all duration-300 ease-out animate-in fade-in slide-in-from-right-4 ${
        fixedHeight ? "h-[min(680px,calc(100dvh-7rem))]" : "h-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e4dfec] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#213027]">Detail Preview</h2>
        <div className="flex items-center gap-2">
          <Info className="size-4 text-[#7d8290]" />
          <Button
            asChild
            variant="ghost"
            size="icon-xs"
            className="rounded-full text-[#7d8290] hover:bg-[#ece8f5] hover:text-[#17231c]"
            title="Tutup detail"
          >
            <Link href={closeHref} scroll={false}>
              <X className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto px-4 py-4">
        <div className="rounded-md border border-[#ded8eb] bg-white px-4 py-5 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full border-4 border-[#d7eadc] bg-[#2d6a4f] text-lg font-semibold text-white">
            {displayNpm.slice(-2)}
          </div>
          <p className="mt-3 text-sm font-semibold text-[#18221b]">
            {detail.requesterName ?? `Pemohon ${displayNpm}`}
          </p>
          {detail.requesterProgram ? (
            <p className="mt-1 text-xs font-medium text-[#4f5a52]">
              {detail.requesterProgram}
            </p>
          ) : null}
          <p className="text-xs text-[#6f746f]">
            {formatDate(request.requestDate)}
          </p>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8796]">
              Status Pemohon
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#8a2345]" />
              <p className="text-sm font-medium text-[#222721]">
                {request.statusLabel}
              </p>
            </div>
          </div>

          {profileRows.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8796]">
                Data Pemohon
              </p>
              <div className="mt-2 grid gap-2 rounded-md border border-[#d8d4e4] bg-white p-3">
                {profileRows.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-xs"
                  >
                    <span className="text-[#7a7885]">{item.label}</span>
                    <span className="min-w-0 break-words font-semibold text-[#222721]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8796]">
              Jenis Permohonan
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-[#222721]">
              {request.serviceTitle}
            </p>
          </div>

          {requestRows.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8796]">
                Detail Layanan
              </p>
              <div className="mt-2 grid gap-2 rounded-md border border-[#d8d4e4] bg-white p-3">
                {requestRows.map((item) => (
                  <div key={item.label} className="grid gap-1 text-xs">
                    <span className="text-[#7a7885]">{item.label}</span>
                    <span className="break-words font-semibold text-[#222721]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8796]">
              Dokumen Dilampirkan
            </p>
            <div className="mt-2 grid gap-2">
              <div className="flex items-center justify-between rounded-md border border-[#d8d4e4] bg-white px-3 py-2 text-xs text-[#4c554f]">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 text-[#2d6a4f]" />
                  Metadata lampiran tersedia di detail
                </span>
                <ExternalLink className="size-3 shrink-0" />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              asChild
              className="h-10 bg-[#0f3d2e] text-white hover:bg-[#164b39]"
            >
              <Link href={`/staff/requests/${request.serviceSlug}/${request.id}`}>
                Buka Ruang Proses
              </Link>
            </Button>
            <div className="rounded-md border border-[#d8d4e4] bg-white p-2">
              <InlineStatusAction
                rolePrefix="staff"
                serviceSlug={request.serviceSlug}
                id={request.id}
              status={request.status}
              staffName={staffName}
              supported
            />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default async function StaffRequestsPage({
  searchParams,
}: RequestsPageProps) {
  const params = await searchParams;
  const activeCategory = params.category ?? "alumni";
  const visibleGroups = getVisibleServiceGroups();
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 10);
  const searchQuery = params.q?.trim();
  const hasSearchQuery = Boolean(searchQuery);
  const status = parseRequestStatus(params.status);
  const visibleServices = getCategoryServices(activeCategory);
  const result = await getServiceRequestList({
    service: hasSearchQuery ? undefined : params.service,
    serviceSlugs: hasSearchQuery
      ? undefined
      : params.service
      ? undefined
      : visibleServices.map((service) => service.slug),
    status: hasSearchQuery ? undefined : status,
    q: searchQuery,
    page,
    limit,
  });
  const rows = result.data;
  const user = await getCurrentUser();
  const staffName = user?.name ?? "Staff ULT";
  const selectedRequest = rows.find(
    (request) =>
      request.serviceSlug === params.previewService &&
      request.id === params.previewId
  );
  const selectedDetail = selectedRequest
    ? await getRequestDetail(selectedRequest.serviceSlug, selectedRequest.id)
    : null;
  const hasPreview = Boolean(selectedRequest && selectedDetail);
  const shouldLockPreviewLayout = hasPreview && rows.length < limit;
  const shouldMatchPreviewHeight = hasPreview && rows.length >= limit;
  const shouldConstrainTable = shouldLockPreviewLayout || shouldMatchPreviewHeight;
  const totalPages = Math.max(result.pagination.totalPages, 1);
  const pageItems = getPageItems(result.pagination.page, totalPages);

  return (
    <div
      className={`-m-4 bg-[#f8f2ea] text-[#1f2922] sm:-m-5 lg:-m-6 ${
        shouldLockPreviewLayout
          ? "flex h-[calc(100%+2rem)] flex-col overflow-hidden sm:h-[calc(100%+2.5rem)] lg:h-[calc(100%+3rem)]"
          : "min-h-[calc(100%+2rem)] sm:min-h-[calc(100%+2.5rem)] lg:min-h-[calc(100%+3rem)]"
      }`}
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 72% 30% at 55% -8%, transparent 67%, rgba(198,184,160,0.20) 67.15%, transparent 67.45%)",
          "radial-gradient(ellipse 62% 28% at 75% 6%, transparent 63%, rgba(205,192,170,0.18) 63.15%, transparent 63.45%)",
          "radial-gradient(ellipse 48% 22% at 92% 18%, transparent 60%, rgba(201,187,164,0.20) 60.15%, transparent 60.45%)",
          "radial-gradient(ellipse 54% 24% at 68% 34%, transparent 66%, rgba(204,190,168,0.16) 66.15%, transparent 66.45%)",
          "radial-gradient(ellipse 64% 34% at 88% 30%, transparent 69%, rgba(203,190,168,0.14) 69.15%, transparent 69.45%)",
          "radial-gradient(circle at 74% 12%, rgba(247,238,224,0.92), transparent 34%)",
          "radial-gradient(circle at 100% 0%, rgba(243,230,211,0.48), transparent 30%)",
          "linear-gradient(180deg, #fbf8f2 0%, #f8f2ea 38%, #f5ecdf 100%)",
        ].join(", "),
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="relative z-0 overflow-hidden bg-transparent px-5 pb-10 pt-5 text-[#173d2d] sm:px-7 lg:px-8">
        <div className={`relative mx-auto flex flex-wrap items-start justify-between gap-4 ${
          selectedRequest ? "max-w-[1660px]" : "max-w-[1320px]"
        }`}>
          <div>
            <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
              Manajemen Pengajuan Layanan
            </h1>
            <p className="mt-1 text-xs text-[#566258]">
              Kelola, verifikasi, dan tindak lanjuti seluruh pengajuan layanan ULT.
            </p>
          </div>
        </div>
      </div>

      <div
        className={`relative z-10 mx-auto -mt-6 grid gap-3 px-4 pb-6 transition-[grid-template-columns] duration-300 ease-out sm:px-6 lg:px-7 ${
          shouldLockPreviewLayout ? "min-h-0 flex-1" : ""
        } ${
          hasPreview
            ? "items-stretch max-w-[1660px] xl:[grid-template-columns:minmax(0,1fr)_360px]"
            : "items-start max-w-[1320px] xl:[grid-template-columns:minmax(0,1fr)_0px]"
        }`}
      >
        <div
          className={`grid min-w-0 gap-3 ${
            shouldLockPreviewLayout
              ? "h-full grid-rows-[auto_minmax(0,1fr)]"
              : shouldMatchPreviewHeight
              ? "h-[min(680px,calc(100dvh-7rem))] grid-rows-[auto_minmax(0,1fr)]"
              : "content-start"
          }`}
        >
          <section className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.09)]">
            <div className="flex h-[56px] items-end gap-3 border-b border-[#e8dfd0] bg-white px-3 pt-2">
              {visibleGroups.map((group) => {
                const isActive = activeCategory === group.value;

                return (
                  <Link
                    key={group.value}
                    className={`flex h-[44px] min-w-[168px] items-center justify-center border-b-2 px-5 text-[11px] font-semibold transition-colors ${
                      isActive
                        ? "rounded-t-lg border-[#c79743] bg-[#0f3d2e] text-white shadow-[0_1px_2px_rgba(15,61,46,0.18)] hover:bg-[#0f3d2e] hover:text-white"
                        : "border-transparent bg-transparent text-[#536058] hover:text-[#0f3d2e]"
                    }`}
                    href={buildHref({
                      category: group.value,
                      status,
                      limit,
                      q: params.q,
                    })}
                  >
                    {group.label}
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-3 bg-[#fffdf9] px-4 py-3 lg:grid-cols-[minmax(320px,0.85fr)_minmax(360px,1.15fr)_auto] lg:items-end xl:px-5">
              <div
                className={
                  selectedRequest
                    ? "lg:col-span-1"
                    : undefined
                }
              >
                <p className="mb-1.5 text-[10px] font-semibold text-[#7a7166]">
                  Filter Status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className={`h-7 rounded-md px-3 text-[10px] font-semibold shadow-none ${
                      !status
                        ? "bg-[#0f3d2e] text-white hover:bg-[#0f3d2e] hover:text-white"
                        : "border border-[#e8dfd0] bg-white text-[#4f5a52] hover:bg-[#f6f1e8]"
                    }`}
                  >
                    <Link
                      href={buildHref({
                        category: activeCategory,
                        service: params.service,
                        limit,
                        q: params.q,
                      })}
                    >
                      Semua
                    </Link>
                  </Button>
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      asChild
                      size="sm"
                      variant="ghost"
                      className={`h-7 rounded-md px-3 text-[10px] font-semibold shadow-none ${
                        status === option.value
                          ? "bg-[#0f3d2e] text-white hover:bg-[#0f3d2e] hover:text-white"
                          : "border border-[#e8dfd0] bg-white text-[#4f5a52] hover:bg-[#f6f1e8]"
                      }`}
                    >
                      <Link
                        href={buildHref({
                          category: activeCategory,
                          service: params.service,
                          status: option.value,
                          limit,
                          q: params.q,
                        })}
                      >
                        {option.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              <form
                className={`min-w-0 lg:border-[#e8dfd0] ${
                  selectedRequest
                    ? "lg:border-l lg:pl-4"
                    : "lg:border-l lg:pl-4"
                }`}
              >
                {limit !== 10 ? (
                  <input type="hidden" name="limit" value={limit} />
                ) : null}
                <label
                  htmlFor="request-search"
                  className="mb-1.5 block text-[10px] font-semibold text-[#7a7166]"
                >
                  Pencarian
                </label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-[#e1d8ca] bg-white px-3 shadow-[inset_0_1px_2px_rgba(31,41,34,0.03)]">
                  <Search className="size-3.5 text-[#7d8290]" />
                  <Input
                    id="request-search"
                    name="q"
                    defaultValue={params.q ?? ""}
                    placeholder="Cari NPM atau nama"
                    className="h-7 border-0 px-0 text-[11px] shadow-none focus-visible:ring-0"
                  />
                </div>
              </form>

              <Link
                href={buildHref({ category: activeCategory, limit })}
                className={`pb-2.5 text-[10px] font-semibold text-[#0f5b45] underline-offset-4 hover:underline lg:text-center ${
                  selectedRequest ? "lg:text-left" : ""
                }`}
              >
                Reset
              </Link>
            </div>
          </section>

          <section
            className={`overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)] ${
              shouldConstrainTable ? "flex min-h-0 flex-col" : ""
            }`}
          >
            <div className="flex gap-6 overflow-x-auto border-b border-[#eee6d9] px-5">
              <Link
                className={`h-9 rounded-none border-b-2 px-0 text-[10px] font-semibold ${
                  !params.service
                    ? "border-[#0f5b45] text-[#0f5b45] hover:bg-transparent"
                    : "border-transparent text-[#606860] hover:bg-transparent hover:text-[#0f5b45]"
                }`}
                href={buildHref({
                  category: activeCategory,
                  status,
                  limit,
                  q: params.q,
                })}
              >
                <span className="flex h-full items-center whitespace-nowrap">
                  Semua Pengajuan
                </span>
              </Link>
              {visibleServices.map((service) => (
                <Link
                  key={service.slug}
                  className={`h-9 rounded-none border-b-2 px-0 text-[10px] font-semibold ${
                    params.service === service.slug
                      ? "border-[#0f5b45] text-[#0f5b45] hover:bg-transparent"
                      : "border-transparent text-[#606860] hover:bg-transparent hover:text-[#0f5b45]"
                  }`}
                  href={buildHref({
                    category: activeCategory,
                    service: service.slug,
                    status,
                    limit,
                    q: params.q,
                  })}
                >
                  <span className="flex h-full items-center whitespace-nowrap">
                    {service.title}
                  </span>
                </Link>
              ))}
            </div>

            <div
              className={`px-4 py-3 ${
                shouldConstrainTable
                  ? "min-h-[220px] flex-1 overflow-auto"
                  : "overflow-x-auto"
              }`}
            >
              <Table className="min-w-[980px] table-fixed overflow-hidden rounded-md border border-[#edf0e9]">
                <colgroup>
                  <col className="w-[17%]" />
                  <col className="w-[37%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <TableHeader className="bg-[#eef3ec]">
                  <TableRow className="border-[#dfe6dd] hover:bg-[#eef3ec]">
                    <TableHead className="h-8 px-4 text-center text-[10px] font-bold text-[#244934]">
                      NPM
                    </TableHead>
                    <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                      Layanan
                    </TableHead>
                    <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                      Tanggal Pengajuan
                    </TableHead>
                    <TableHead className="h-8 px-4 text-center text-[10px] font-bold text-[#244934]">
                      Status
                    </TableHead>
                    <TableHead className="h-8 px-4 text-center text-[10px] font-bold text-[#244934]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-sm text-[#6f746f]"
                      >
                        Tidak ada pengajuan yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((request) => {
                      const isSelected =
                        selectedRequest?.serviceSlug === request.serviceSlug &&
                        selectedRequest.id === request.id;
                      const time = formatTime(request.requestDate);

                      return (
                        <TableRow
                          key={`${request.sourceTable}-${request.id}`}
                          className={`border-l-4 border-b border-[#ece7dc] transition-colors duration-200 hover:bg-[#f8faf6] ${
                            isSelected
                              ? "border-l-[#bd8730] bg-[#eef6ec]"
                              : "border-l-transparent bg-white"
                          }`}
                        >
                          <TableCell className="px-4 py-3 text-center text-[11px] font-semibold text-[#28352c]">
                            {request.maskedNpm}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-left">
                            <p className="truncate text-[11px] font-semibold text-[#202923]">
                              {request.serviceTitle}
                            </p>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-left text-[11px] text-[#303b34]">
                            <p>{formatDate(request.requestDate)}</p>
                            {time ? (
                              <p className="mt-0.5 text-[10px] text-[#72796f]">
                                {time} WIB
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={`rounded-sm border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[request.status]}`}
                            >
                              {request.statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <Link
                              scroll={false}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-bold underline-offset-3 hover:underline ${
                                isSelected ? "text-[#0b3f30]" : "text-[#0f5b45]"
                              }`}
                              href={buildHref({
                                category: activeCategory,
                                service: params.service,
                                status,
                                page: result.pagination.page,
                                limit,
                                q: params.q,
                                previewService: request.serviceSlug,
                                previewId: request.id,
                              })}
                            >
                              <Eye className="size-3.5" />
                              Lihat detail
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee6d9] bg-[#fffdf9] px-5 py-3">
              <p className="text-[11px] text-[#7a7166]">
                Menampilkan {rows.length} dari {result.pagination.total} data
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {pageItems.map((pageNumber, index) => {
                  const previousPage = pageItems[index - 1];
                  const showGap = previousPage && pageNumber - previousPage > 1;

                  return (
                    <span key={pageNumber} className="flex items-center gap-1.5">
                      {showGap ? (
                        <span className="px-1 text-xs text-[#7a7166]">...</span>
                      ) : null}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className={`size-8 rounded-md p-0 text-[11px] font-semibold ${
                          result.pagination.page === pageNumber
                            ? "border-[#0f5b45] bg-[#0f5b45] text-white hover:bg-[#0f5b45] hover:text-white"
                            : "border-[#e1d8ca] bg-white text-[#39433c] hover:bg-[#f6f1e8]"
                        }`}
                      >
                        <Link
                          href={buildHref({
                            category: activeCategory,
                            service: params.service,
                            status,
                            page: pageNumber,
                            limit,
                            q: params.q,
                          })}
                        >
                          {pageNumber}
                        </Link>
                      </Button>
                    </span>
                  );
                })}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                  disabled={result.pagination.page >= totalPages}
                >
                  <Link
                    href={buildHref({
                      category: activeCategory,
                      service: params.service,
                      status,
                      page: result.pagination.page + 1,
                      limit,
                      q: params.q,
                    })}
                  >
                    Selanjutnya
                    <ChevronRight className="size-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#7a7166]">
                <span>Tampilkan</span>
                <select
                  className="h-8 rounded-md border border-[#e1d8ca] bg-white px-2 text-[11px] font-semibold text-[#39433c] outline-none"
                  defaultValue={String(limit)}
                  aria-label="Jumlah data per halaman"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span>data per halaman</span>
              </div>
            </div>
          </section>
        </div>

        <div
          className={`min-w-0 transition-all duration-300 ease-out ${
            hasPreview
              ? "min-h-0 translate-x-0 opacity-100"
              : "pointer-events-none hidden translate-x-4 opacity-0 xl:block xl:overflow-hidden"
          }`}
        >
          {selectedRequest && selectedDetail ? (
            <RequestPreview
              request={selectedRequest}
              detail={selectedDetail}
              staffName={staffName}
              closeHref={buildHref({
                category: activeCategory,
                service: params.service,
                status,
                page: result.pagination.page,
                limit,
                q: params.q,
              })}
              fixedHeight={shouldMatchPreviewHeight}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
