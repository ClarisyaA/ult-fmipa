import Link from "next/link";

import { HomeActivityActions } from "@/components/home-activities/home-activity-actions";
import { HomeActivityImage } from "@/components/home-activities/home-activity-image";
import { HomeLinksSettingsForm } from "@/components/home-activities/home-links-settings-form";
import { ServiceLinksSettingsForm } from "@/components/services/service-links-settings-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getHomeActivityImageFileSrc,
  getHomeActivityImageSrc,
} from "@/lib/home-activity-image-url";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedTableText } from "@/components/ui/truncated-table-text";
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

export default async function AdminHomeActivitiesPage() {
  const { activities, unavailable } = await getAdminHomeActivitiesState();
  const { academicCalendar, unavailable: linksUnavailable } = await getHomeLinksState();
  const { scholarshipTemplate, unavailable: serviceLinksUnavailable } =
    await getServiceLinksState();

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-normal">
              Kegiatan Mahasiswa
            </h1>
            <Button
              asChild
              size="sm"
              className="h-9 rounded-md bg-[#0f5b45] px-4 text-xs font-semibold text-white hover:bg-[#0f3d2e]"
            >
              <Link href="/admin/beranda/kegiatan/tambah">Tambah Kegiatan</Link>
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola item carousel Kegiatan Mahasiswa di homepage.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Beranda</CardTitle>
          <CardDescription>
            Atur link tombol Kalender Akademik di section pertama homepage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomeLinksSettingsForm
            rolePrefix="admin"
            initialLink={academicCalendar}
            unavailable={linksUnavailable}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Link Layanan</CardTitle>
          <CardDescription>
            Atur link template eksternal yang dipakai pada halaman layanan mahasiswa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceLinksSettingsForm
            rolePrefix="admin"
            initialLink={scholarshipTemplate}
            unavailable={serviceLinksUnavailable}
          />
        </CardContent>
      </Card>

      <Card data-tour="admin-home-activities-list">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Daftar Kegiatan Beranda</CardTitle>
            <Button
              asChild
              size="sm"
              className="h-8 rounded-md bg-[#0f5b45] px-3 text-xs font-semibold text-white hover:bg-[#0f3d2e]"
            >
              <Link href="/admin/beranda/kegiatan/tambah">Tambah Kegiatan</Link>
            </Button>
          </div>
          <CardDescription>
            Jumlah item yang tampil di homepage mengikuti item aktif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[900px] table-fixed">
            <colgroup>
              <col className="w-32" />
              <col className="w-[32%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Gambar</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    {unavailable
                      ? "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
                      : "Belum ada kegiatan mahasiswa yang dibuat."}
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => {
                  const cover =
                    activity.images.find((image) => image.isCover) ?? activity.images[0] ?? null;
                  const coverFit = cover?.imageFit ?? activity.imageFit;
                  const coverSrc = cover
                    ? getHomeActivityImageFileSrc(cover)
                    : activity.imagePath
                      ? getHomeActivityImageSrc(activity)
                      : null;
                  const coverAlt = cover?.imageAlt ?? activity.imageAlt ?? activity.title;
                  const imageClass =
                    coverFit === "contain"
                      ? "aspect-video w-28 rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-contain object-center p-1"
                      : "aspect-video w-28 rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-cover object-center";

                  return (
                    <TableRow key={activity.id}>
                    <TableCell className="w-32 max-w-32">
                      {coverSrc ? (
                        <HomeActivityImage
                          src={coverSrc}
                          alt={coverAlt}
                          width={128}
                          height={80}
                          unoptimized
                          className={imageClass}
                          fallbackClassName="grid aspect-video w-28 max-w-28 place-items-center overflow-hidden rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] p-2 text-center text-muted-foreground"
                          fallbackDescription=""
                        />
                      ) : (
                        <div className="grid aspect-video w-28 max-w-28 place-items-center overflow-hidden rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] px-2 text-center text-xs leading-tight text-muted-foreground">
                          Tanpa gambar
                        </div>
                      )}
                      {activity.images.length > 1 ? (
                        <p className="mt-1 text-center text-[10px] text-muted-foreground">
                          {activity.images.length} gambar
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <TruncatedTableText
                          value={activity.title}
                          className="font-medium"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          <TruncatedTableText
                            value={activity.eyebrow ?? "Tanpa kategori"}
                          />
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activity.isActive ? "secondary" : "outline"}>
                        {activity.isActive ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.sortOrder}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(activity.updatedAt ?? activity.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/beranda/kegiatan/${activity.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <HomeActivityActions
                          activity={activity}
                          rolePrefix="admin"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
