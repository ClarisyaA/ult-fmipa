import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { HomeActivityForm } from "@/components/home-activities/home-activity-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getHomeActivityById } from "@/lib/home-activities";
import { getHomeActivityImages } from "@/lib/home-activity-images";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StaffEditHomeActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffEditHomeActivityPage({
  params,
}: StaffEditHomeActivityPageProps) {
  const { id } = await params;
  const activity = await getHomeActivityById(id);

  if (!activity) {
    notFound();
  }

  const images = await getHomeActivityImages(id);

  return (
    <div className="grid min-w-0 content-start gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/staff/beranda/kegiatan">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Edit Kegiatan Mahasiswa</CardTitle>
          <CardDescription>
            Ubah judul, kategori, gambar, status aktif, dan urutan tampil.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <HomeActivityForm
            rolePrefix="staff"
            mode="edit"
            initialActivity={{ ...activity, images }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
