import Image from "next/image";
import Link from "next/link";

import { HomeActivityActions } from "@/components/home-activities/home-activity-actions";
import { HomeLinksSettingsForm } from "@/components/home-activities/home-links-settings-form";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminHomeActivitiesState } from "@/lib/home-activities";
import { getHomeLinksState } from "@/lib/home-links";

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

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Kegiatan Mahasiswa
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola item carousel Kegiatan Mahasiswa di homepage.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/beranda/kegiatan/tambah">Tambah Kegiatan</Link>
        </Button>
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
          <CardTitle>Daftar Kegiatan Beranda</CardTitle>
          <CardDescription>
            Jumlah item yang tampil di homepage mengikuti item aktif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gambar</TableHead>
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
                  const imageClass =
                    activity.imageFit === "contain"
                      ? "aspect-video w-28 rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-contain object-center p-1"
                      : "aspect-video w-28 rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-cover object-center";

                  return (
                    <TableRow key={activity.id}>
                    <TableCell>
                      {activity.imagePath ? (
                        <Image
                          src={`/api/home/activities/images/${activity.id}`}
                          alt={activity.imageAlt ?? activity.title}
                          width={128}
                          height={80}
                          unoptimized
                          className={imageClass}
                        />
                      ) : (
                        <div className="grid aspect-video w-28 place-items-center rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] text-xs text-muted-foreground">
                          Tanpa gambar
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium">{activity.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {activity.eyebrow ?? "Tanpa kategori"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activity.isActive ? "secondary" : "outline"}>
                        {activity.isActive ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.sortOrder}</TableCell>
                    <TableCell>
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
