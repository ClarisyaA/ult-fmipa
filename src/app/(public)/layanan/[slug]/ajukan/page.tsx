import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ServiceRequestForm } from "@/components/services/service-request-form";
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
import { isSubmissionSupported } from "@/lib/legacy-request-submit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SubmitServiceRequestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = getCanonicalServiceSlug(slug);

  if (canonicalSlug !== slug) {
    redirect(`/layanan/${canonicalSlug}/ajukan`);
  }

  const service = getPublicServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const supported = isSubmissionSupported(service.slug);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="-ml-2 mb-6">
        <Link href={`/layanan/${service.slug}`}>
          <ArrowLeft className="size-4" />
          Kembali ke Detail Layanan
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Ajukan {service.title}</CardTitle>
          <CardDescription>
            Versi awal. Autentikasi PAUS akan diaktifkan pada tahap berikutnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supported ? (
            <ServiceRequestForm
              serviceSlug={service.slug}
              isScholarshipService={service.slug === "rekomendasi-beasiswa"}
            />
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Pengajuan online untuk layanan ini belum tersedia.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
