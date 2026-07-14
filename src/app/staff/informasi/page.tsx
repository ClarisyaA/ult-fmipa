import Link from "next/link";
import { Newspaper, PlusCircle } from "lucide-react";

import { InformationDeleteButton } from "@/components/information/information-delete-button";
import { InformationStatusAction } from "@/components/information/information-status-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InformationPost, InformationPostStatus } from "@/lib/information-posts";
import { getStaffInformationApiData } from "@/lib/staff-api-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const statusLabels: Record<InformationPostStatus, string> = {
  draft: "Draft",
  published: "Dipublikasikan",
  archived: "Diarsipkan",
};

const statusStyles: Record<InformationPostStatus, string> = {
  draft: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
  published: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  archived: "border-[#d7d9e5] bg-[#f4f5fa] text-[#4e5566]",
};

const displayStatusStyles: Record<string, string> = {
  "Sedang Tayang": "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
  "Belum Tayang": "border-[#c9ddf0] bg-[#edf7ff] text-[#285b7c]",
  "Masa Tayang Selesai": "border-[#e5d3c6] bg-[#fff3eb] text-[#8a4c28]",
  "Diarsipkan": "border-[#d7d9e5] bg-[#f4f5fa] text-[#4e5566]",
  "Belum Publik": "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
  "Non-aktif": "border-[#edd2c5] bg-[#fff7f2] text-[#8a3d23]",
};

function getDisplayStatus(post: InformationPost) {
  if (post.status === "archived") {
    return "Diarsipkan";
  }

  if (post.status !== "published" || !post.isActive) {
    return post.isActive ? "Belum Publik" : "Non-aktif";
  }

  const now = Date.now();

  if (post.displayStartAt && new Date(post.displayStartAt).getTime() > now) {
    return "Belum Tayang";
  }

  if (post.displayEndAt && new Date(post.displayEndAt).getTime() < now) {
    return "Masa Tayang Selesai";
  }

  return "Sedang Tayang";
}

function getPostSummary(posts: InformationPost[]) {
  return {
    total: posts.length,
    published: posts.filter((post) => post.status === "published").length,
    draft: posts.filter((post) => post.status === "draft").length,
    featured: posts.filter((post) => post.featured).length,
  };
}

export default async function StaffInformasiPage() {
  const { data, error } = await getStaffInformationApiData();
  const posts = data ?? [];
  const summary = getPostSummary(posts);

  return (
    <div
      className="-m-4 min-h-full bg-[#f8f2ea] text-[#1f2922] sm:-m-5 lg:-m-6"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 72% 30% at 55% -8%, transparent 67%, rgba(198,184,160,0.20) 67.15%, transparent 67.45%)",
          "radial-gradient(ellipse 62% 28% at 75% 6%, transparent 63%, rgba(205,192,170,0.18) 63.15%, transparent 63.45%)",
          "radial-gradient(ellipse 48% 22% at 92% 18%, transparent 60%, rgba(201,187,164,0.20) 60.15%, transparent 60.45%)",
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
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
              Kelola Informasi
            </h1>
            <p className="mt-1 text-xs text-[#566258]">
              Buat, edit, dan atur publikasi informasi ULT FMIPA.
            </p>
          </div>
          <Button
            asChild
            className="h-9 rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
          >
            <Link href="/staff/informasi/tambah">
              <PlusCircle className="size-3.5" />
              Tambah Informasi
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-6 grid max-w-[1320px] gap-3 px-4 pb-6 sm:px-6 lg:px-7">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Informasi", value: summary.total },
            { label: "Dipublikasikan", value: summary.published },
            { label: "Draft", value: summary.draft },
            { label: "Unggulan", value: summary.featured },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#e3d9ca] bg-white px-4 py-3 shadow-[0_2px_10px_rgba(47,38,20,0.06)]"
            >
              <p className="text-[11px] font-semibold text-[#7a7166]">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#173d2d]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee6d9] bg-[#fffdf9] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#173d2d]">
                Daftar Informasi
              </h2>
              <p className="mt-1 text-[11px] text-[#7a7166]">
                Semua draft, publikasi, dan arsip informasi.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#e3d9ca] bg-white px-3 py-2 text-xs font-semibold text-[#173d2d] shadow-sm">
              <Newspaper className="size-4 text-[#0f5b45]" />
              {error ? "Perlu dimuat ulang" : `${posts.length} informasi`}
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="px-4 py-3">
              <div
                className={`rounded-md border px-4 py-8 text-center text-sm ${
                  error
                    ? "border-[#edd2c5] bg-[#fff7f2] text-[#8a3d23]"
                    : "border-[#edf0e9] bg-[#fbfdf9] text-[#6f746f]"
                }`}
              >
                {error ?? "Belum ada informasi yang dibuat."}
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-2 px-4 py-3 md:hidden">
                {posts.map((post) => {
                  const displayStatus = getDisplayStatus(post);

                  return (
                    <div
                      key={post.id}
                      className="rounded-md border border-[#e3d9ca] bg-white p-3 shadow-[0_1px_4px_rgba(47,38,20,0.06)]"
                    >
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant="outline"
                          className={`rounded-sm border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[post.status]}`}
                        >
                          {statusLabels[post.status]}
                        </Badge>
                        {post.featured ? (
                          <Badge
                            variant="outline"
                            className="rounded-sm border border-[#e2d7b8] bg-[#fff8e6] px-2.5 py-0.5 text-[10px] font-semibold text-[#745411]"
                          >
                            Unggulan
                          </Badge>
                        ) : null}
                        {!post.isActive ? (
                          <Badge
                            variant="outline"
                            className="rounded-sm border border-[#edd2c5] bg-[#fff7f2] px-2.5 py-0.5 text-[10px] font-semibold text-[#8a3d23]"
                          >
                            Non-aktif
                          </Badge>
                        ) : null}
                      </div>

                      <h3 className="mt-2 text-sm font-semibold leading-snug text-[#202923]">
                        {post.title}
                      </h3>
                      <div className="mt-3 grid grid-cols-[82px_minmax(0,1fr)] gap-2 text-xs">
                        <span className="text-[#7a7166]">Kategori</span>
                        <span className="min-w-0 break-words text-[#303b34]">
                          {post.category ?? "-"}
                        </span>
                        <span className="text-[#7a7166]">Publikasi</span>
                        <span className="min-w-0 break-words text-[#303b34]">
                          {formatDate(post.publishedAt)}
                        </span>
                        <span className="text-[#7a7166]">Jadwal</span>
                        <span className="min-w-0 break-words text-[#303b34]">
                          {formatDate(post.displayStartAt)} -{" "}
                          {formatDate(post.displayEndAt)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`mt-3 rounded-sm border px-2.5 py-0.5 text-[10px] font-semibold ${displayStatusStyles[displayStatus]}`}
                      >
                        {displayStatus}
                      </Badge>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                        >
                          <Link href={`/staff/informasi/${post.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        {post.status === "published" ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                          >
                            <Link href={`/informasi/${post.slug}`}>
                              Lihat Halaman
                            </Link>
                          </Button>
                        ) : null}
                        {post.status === "archived" ? (
                          <InformationStatusAction
                            id={post.id}
                            rolePrefix="staff"
                            post={post}
                            targetStatus="draft"
                            label="Restore"
                            confirmMessage="Kembalikan informasi ini ke draft?"
                          />
                        ) : (
                          <InformationStatusAction
                            id={post.id}
                            rolePrefix="staff"
                            post={post}
                            targetStatus="archived"
                            label="Arsipkan"
                            confirmMessage="Arsipkan informasi ini?"
                          />
                        )}
                        <InformationDeleteButton
                          id={post.id}
                          rolePrefix="staff"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto px-4 py-3 md:block">
                <Table className="min-w-[1080px] table-fixed overflow-hidden rounded-md border border-[#edf0e9]">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[17%]" />
                    <col className="w-[14%]" />
                    <col className="w-[13%]" />
                    <col className="w-[17%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <TableHeader className="bg-[#eef3ec]">
                    <TableRow className="border-[#dfe6dd] hover:bg-[#eef3ec]">
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Judul
                      </TableHead>
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Status
                      </TableHead>
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Kategori
                      </TableHead>
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Publikasi
                      </TableHead>
                      <TableHead className="h-8 px-4 text-left text-[10px] font-bold text-[#244934]">
                        Jadwal
                      </TableHead>
                      <TableHead className="h-8 px-4 text-center text-[10px] font-bold text-[#244934]">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => {
                      const displayStatus = getDisplayStatus(post);

                      return (
                        <TableRow
                          key={post.id}
                          className="border-b border-[#ece7dc] bg-white transition-colors hover:bg-[#f8faf6]"
                        >
                          <TableCell className="px-4 py-3 text-[11px] font-semibold leading-snug text-[#202923]">
                            {post.title}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <Badge
                                variant="outline"
                                className={`rounded-sm border px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[post.status]}`}
                              >
                                {statusLabels[post.status]}
                              </Badge>
                              {post.featured ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-sm border border-[#e2d7b8] bg-[#fff8e6] px-2.5 py-0.5 text-[10px] font-semibold text-[#745411]"
                                >
                                  Unggulan
                                </Badge>
                              ) : null}
                              {!post.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-sm border border-[#edd2c5] bg-[#fff7f2] px-2.5 py-0.5 text-[10px] font-semibold text-[#8a3d23]"
                                >
                                  Non-aktif
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-[#303b34]">
                            {post.category ?? "-"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-[11px] text-[#303b34]">
                            {formatDate(post.publishedAt)}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="grid gap-1 text-[11px] text-[#303b34]">
                              <Badge
                                variant="outline"
                                className={`w-fit rounded-sm border px-2.5 py-0.5 text-[10px] font-semibold ${displayStatusStyles[displayStatus]}`}
                              >
                                {displayStatus}
                              </Badge>
                              <span className="text-[10px] text-[#72796f]">
                                Mulai: {formatDate(post.displayStartAt)}
                              </span>
                              <span className="text-[10px] text-[#72796f]">
                                Selesai: {formatDate(post.displayEndAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-wrap justify-center gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                              >
                                <Link href={`/staff/informasi/${post.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                              {post.status === "published" ? (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                                >
                                  <Link href={`/informasi/${post.slug}`}>
                                    Lihat
                                  </Link>
                                </Button>
                              ) : null}
                              {post.status === "archived" ? (
                                <InformationStatusAction
                                  id={post.id}
                                  rolePrefix="staff"
                                  post={post}
                                  targetStatus="draft"
                                  label="Restore"
                                  confirmMessage="Kembalikan informasi ini ke draft?"
                                />
                              ) : (
                                <InformationStatusAction
                                  id={post.id}
                                  rolePrefix="staff"
                                  post={post}
                                  targetStatus="archived"
                                  label="Arsipkan"
                                  confirmMessage="Arsipkan informasi ini?"
                                />
                              )}
                              <InformationDeleteButton
                                id={post.id}
                                rolePrefix="staff"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
