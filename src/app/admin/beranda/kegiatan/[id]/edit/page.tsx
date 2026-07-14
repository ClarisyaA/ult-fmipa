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

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminEditHomeActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditHomeActivityPage({
  params,
}: AdminEditHomeActivityPageProps) {
  const { id } = await params;
  const activity = await getHomeActivityById(id);

  if (!activity) {
    notFound();
  }

  return (
    <div className="grid content-start gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/admin/beranda/kegiatan">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit Kegiatan Mahasiswa</CardTitle>
          <CardDescription>
            Ubah judul, kategori, gambar, status aktif, dan urutan tampil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomeActivityForm
            rolePrefix="admin"
            mode="edit"
            initialActivity={activity}
          />
        </CardContent>
      </Card>
    </div>
  );
}
