import Link from "next/link";
import { notFound } from "next/navigation";
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
import { getInformationPostById } from "@/lib/information-posts";

type EditInformationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffEditInformasiPage({
  params,
}: EditInformationPageProps) {
  const { id } = await params;
  const post = await getInformationPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link href="/staff/informasi">
          <ArrowLeft className="size-4" />
          Kembali
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit Informasi</CardTitle>
          <CardDescription>
            Ubah status menjadi published untuk menampilkan informasi ke publik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InformationPostForm
            rolePrefix="staff"
            mode="edit"
            initialPost={post}
          />
        </CardContent>
      </Card>
    </div>
  );
}
