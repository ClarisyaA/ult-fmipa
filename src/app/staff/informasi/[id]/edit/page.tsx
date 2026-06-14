import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { requireRole } from "@/lib/auth";
import { getInformationPostImages } from "@/lib/information-post-images";
import { getInformationPostById } from "@/lib/information-posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EditInformationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffEditInformasiPage({
  params,
}: EditInformationPageProps) {
  const user = await requireRole(["staff"]);

  if (!user) {
    redirect("/login?callbackUrl=/staff/informasi");
  }

  const { id } = await params;
  const post = await getInformationPostById(id);

  if (!post) {
    notFound();
  }

  const images = await getInformationPostImages(post.id);

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
            initialImages={images}
          />
        </CardContent>
      </Card>
    </div>
  );
}
