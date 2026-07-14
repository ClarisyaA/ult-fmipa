import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { InformationPostForm } from "@/components/information/information-post-form";
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

export default function AdminTambahInformasiPage() {
  return (
    <div className="grid content-start gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/admin/informasi">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Tambah Informasi</CardTitle>
          <CardDescription>
            Gunakan teks biasa. Konten akan ditampilkan dengan line break aman.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InformationPostForm rolePrefix="admin" mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
