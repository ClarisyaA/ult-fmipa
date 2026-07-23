import Link from "next/link";
import { PlusCircle } from "lucide-react";

import {
  AdminPageShell,
  AdminSectionCard,
} from "@/components/admin/admin-ui";
import { HomeActivityActions } from "@/components/home-activities/home-activity-actions";
import { HomeActivityImage } from "@/components/home-activities/home-activity-image";
import { HomeLinksSettingsForm } from "@/components/home-activities/home-links-settings-form";
import { ServiceLinksSettingsForm } from "@/components/services/service-links-settings-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHomeActivityImageSrc } from "@/lib/home-activity-image-url";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminHomeActivitiesState } from "@/lib/home-activities";
import { getHomeLinksState } from "@/lib/home-links";
import { getServiceLinksState } from "@/lib/service-links";

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

export default async function StaffHomeActivitiesPage() {
  const { activities, unavailable } = await getAdminHomeActivitiesState();
  const { academicCalendar, unavailable: linksUnavailable } =
    await getHomeLinksState();
  const { scholarshipTemplate, unavailable: serviceLinksUnavailable } =
    await getServiceLinksState();

  return (
    <AdminPageShell>
      <div className="flex flex-wrap items-start justify-between gap-4 text-[#173d2d]">
        <div>
          <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
            Kegiatan Mahasiswa
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#566258]">
            Kelola item Kegiatan Mahasiswa di homepage.
          </p>
        </div>
        <Button
          asChild
          className="mr-14 h-9 rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39] sm:mr-16"
        >
          <Link href="/staff/beranda/kegiatan/tambah">
            <PlusCircle className="size-3.5" />
            Tambah Kegiatan
          </Link>
        </Button>
      </div>

      <div className="grid min-w-0 gap-4">
        <AdminSectionCard
          title="Pengaturan Beranda"
          description="Atur link tombol Kalender Akademik di section pertama homepage."
        >
          <HomeLinksSettingsForm
            rolePrefix="staff"
            initialLink={academicCalendar}
            unavailable={linksUnavailable}
          />
        </AdminSectionCard>

        <AdminSectionCard
          title="Pengaturan Link Layanan"
          description="Atur link template eksternal yang dipakai pada halaman layanan mahasiswa."
        >
          <ServiceLinksSettingsForm
            rolePrefix="staff"
            initialLink={scholarshipTemplate}
            unavailable={serviceLinksUnavailable}
          />
        </AdminSectionCard>
      </div>

      <AdminSectionCard
        title="Daftar Kegiatan Beranda"
        description="Jumlah item yang tampil di homepage mengikuti item aktif."
        className="min-w-0"
      >
        <div className="grid gap-2 md:hidden">
          {activities.length === 0 ? (
            <div className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-4 py-8 text-center text-sm text-[#6f746f]">
              {unavailable
                ? "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
                : "Belum ada kegiatan mahasiswa yang dibuat."}
            </div>
          ) : (
            activities.map((activity) => {
              const imageClass =
                activity.imageFit === "contain"
                  ? "aspect-video w-full rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-contain object-center p-1"
                  : "aspect-video w-full rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-cover object-center";

              return (
                <article
                  key={activity.id}
                  className="grid min-w-0 gap-3 rounded-md border border-[#e3d9ca] bg-white p-3 shadow-[0_1px_4px_rgba(47,38,20,0.06)] sm:grid-cols-[140px_minmax(0,1fr)]"
                >
                  {activity.imagePath ? (
                    <HomeActivityImage
                      src={getHomeActivityImageSrc(activity)}
                      alt={activity.imageAlt ?? activity.title}
                      width={320}
                      height={180}
                      unoptimized
                      className={imageClass}
                      fallbackClassName="grid aspect-video w-full place-items-center rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] p-2 text-center text-xs text-[#7a7166]"
                      fallbackDescription=""
                    />
                  ) : (
                    <div className="grid aspect-video w-full place-items-center rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] text-xs text-[#7a7166]">
                      Tanpa gambar
                    </div>
                  )}
                  <div className="grid min-w-0 content-start gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold leading-snug text-[#202923]">
                          {activity.title}
                        </h3>
                        <p className="mt-1 text-[10px] text-[#7a7166]">
                          {activity.eyebrow ?? "Tanpa kategori"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          activity.isActive
                            ? "rounded-sm border-[#cce3d3] bg-[#eef9f1] px-2.5 py-0.5 text-[10px] font-semibold text-[#2f6b44]"
                            : "rounded-sm border-[#d7d9e5] bg-[#f4f5fa] px-2.5 py-0.5 text-[10px] font-semibold text-[#4e5566]"
                        }
                      >
                        {activity.isActive ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-1 text-xs">
                      <span className="text-[#7a7166]">Urutan</span>
                      <span className="text-[#303b34]">
                        {activity.sortOrder}
                      </span>
                      <span className="text-[#7a7166]">Diperbarui</span>
                      <span className="text-[#303b34]">
                        {formatDate(activity.updatedAt ?? activity.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                      >
                        <Link
                          href={`/staff/beranda/kegiatan/${activity.id}/edit`}
                        >
                          Edit
                        </Link>
                      </Button>
                      <HomeActivityActions
                        activity={activity}
                        rolePrefix="staff"
                      />
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden w-full min-w-0 touch-pan-x overflow-x-auto overscroll-x-contain rounded-md border border-[#edf0e9] md:block">
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow className="border-[#dfe6dd] bg-[#eef3ec] hover:bg-[#eef3ec]">
                {[
                  "Gambar",
                  "Judul",
                  "Status",
                  "Urutan",
                  "Diperbarui",
                  "Aksi",
                ].map((heading) => (
                  <TableHead
                    key={heading}
                    className="h-8 px-4 text-[10px] font-bold text-[#244934]"
                  >
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-sm text-[#6f746f]"
                  >
                    {unavailable
                      ? "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
                      : "Belum ada kegiatan mahasiswa yang dibuat."}
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => {
                  const imageClass =
                    activity.imageFit === "contain"
                      ? "aspect-video w-28 rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-contain object-center p-1"
                      : "aspect-video w-28 rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-cover object-center";

                  return (
                    <TableRow
                      key={activity.id}
                      className="border-b border-[#ece7dc] bg-white transition-colors hover:bg-[#f8faf6]"
                    >
                      <TableCell className="w-32 max-w-32">
                        {activity.imagePath ? (
                          <HomeActivityImage
                            src={getHomeActivityImageSrc(activity)}
                            alt={activity.imageAlt ?? activity.title}
                            width={128}
                            height={80}
                            unoptimized
                            className={imageClass}
                            fallbackClassName="grid aspect-video w-28 max-w-28 place-items-center overflow-hidden rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] p-2 text-center text-[#7a7166]"
                            fallbackDescription=""
                          />
                        ) : (
                          <div className="grid aspect-video w-28 max-w-28 place-items-center overflow-hidden rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] px-2 text-center text-xs leading-tight text-[#7a7166]">
                            Tanpa gambar
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-[11px] font-semibold text-[#202923]">
                            {activity.title}
                          </p>
                          <p className="mt-1 text-[10px] text-[#7a7166]">
                            {activity.eyebrow ?? "Tanpa kategori"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            activity.isActive
                              ? "rounded-sm border-[#cce3d3] bg-[#eef9f1] px-2.5 py-0.5 text-[10px] font-semibold text-[#2f6b44]"
                              : "rounded-sm border-[#d7d9e5] bg-[#f4f5fa] px-2.5 py-0.5 text-[10px] font-semibold text-[#4e5566]"
                          }
                        >
                          {activity.isActive ? "Aktif" : "Non-aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>{activity.sortOrder}</TableCell>
                      <TableCell>
                        {formatDate(activity.updatedAt ?? activity.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                          >
                            <Link
                              href={`/staff/beranda/kegiatan/${activity.id}/edit`}
                            >
                              Edit
                            </Link>
                          </Button>
                          <HomeActivityActions
                            activity={activity}
                            rolePrefix="staff"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </AdminSectionCard>
    </AdminPageShell>
  );
}
