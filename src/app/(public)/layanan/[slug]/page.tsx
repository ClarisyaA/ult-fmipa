import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, LockKeyhole } from "lucide-react";

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
  getCanonicalServiceSlug,
  getPublicServiceBySlug,
} from "@/lib/legacy-services";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = getCanonicalServiceSlug(slug);

  if (canonicalSlug !== slug) {
    redirect(`/layanan/${canonicalSlug}`);
  }

  const service = getPublicServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <main data-testid="service-detail-page">
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" className="-ml-2 mb-6">
            <Link href="/layanan">
              <ArrowLeft className="size-4" />
              Kembali ke Daftar Layanan
            </Link>
          </Button>

          <Badge variant="secondary">{service.category}</Badge>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal">
            {service.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {service.description}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Persyaratan awal</CardTitle>
              <CardDescription>
                Siapkan dokumen atau informasi berikut sebelum pengajuan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {service.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card id="pengajuan">
            <CardHeader>
              <CardTitle>Pengajuan layanan</CardTitle>
              <CardDescription>
                Beberapa layanan sederhana sudah dapat diajukan melalui form
                awal. Autentikasi PAUS akan diaktifkan pada tahap berikutnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <LockKeyhole className="mt-0.5 size-4 text-primary" />
                <p>
                  Form awal hanya menyimpan data pengajuan minimum ke tabel
                  layanan yang sudah diizinkan. Belum ada unggah berkas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan layanan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Kategori</p>
                <p className="mt-1 font-medium">{service.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimasi proses</p>
                <p className="mt-1 flex items-center gap-2 font-medium">
                  <Clock className="size-4 text-primary" />
                  {service.processingTime}
                </p>
              </div>
            </CardContent>
          </Card>

          <Button asChild size="lg">
            <Link href={`/layanan/${service.slug}/ajukan`}>Ajukan Layanan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/layanan">Kembali ke Daftar Layanan</Link>
          </Button>
        </aside>
      </section>
    </main>
  );
}
