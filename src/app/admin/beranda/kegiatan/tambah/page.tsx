import Link from "next/link";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminTambahHomeActivityPage() {
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
          <CardTitle>Tambah Kegiatan Mahasiswa</CardTitle>
          <CardDescription>
            Item aktif akan tampil di carousel homepage sesuai urutan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomeActivityForm rolePrefix="admin" mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
