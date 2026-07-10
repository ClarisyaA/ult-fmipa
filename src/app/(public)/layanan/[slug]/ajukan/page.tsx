import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ServiceRequestForm } from "@/components/services/service-request-form";
import { SikRequestWorkflow } from "@/components/services/sik-request-workflow";
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
import { getCurrentUser } from "@/lib/auth";
import { isSubmissionSupported } from "@/lib/legacy-request-submit";
import { getLatestSikRequestForStudent, sikServiceSlug } from "@/lib/sik-requests";
import { getStudentRequestDetail } from "@/lib/student-request-history";

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
  const user = await getCurrentUser();

  if (!service) {
    notFound();
  }

  if (!user) {
    redirect(`/login?callbackUrl=/layanan/${service.slug}/ajukan`);
  }

  if (user.role === "admin") {
    redirect("/admin/dashboard");
  }

  if (user.role === "staff") {
    redirect("/staff/dashboard");
  }

  const supported = isSubmissionSupported(service.slug);
  const latestSikRecord =
    service.slug === sikServiceSlug && user.npm
      ? await getLatestSikRequestForStudent(user.npm)
      : null;
  const latestSikDetail =
    service.slug === sikServiceSlug && user.npm && latestSikRecord
      ? await getStudentRequestDetail(
          user.npm,
          service.slug,
          String(latestSikRecord.ID)
        )
      : null;

  return (
    <main className="relative bg-[#FEFDF9]" data-testid="service-submit-page">
      <section className="mx-auto w-full max-w-3xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <Button 
          asChild 
          variant="ghost" 
          className="-ml-2 mb-6 text-[#6B5E52] hover:text-[#EE1C25] hover:bg-transparent"
        >
          <Link href={`/layanan/${service.slug}`}>
            <ArrowLeft className="size-4 mr-2" />
            Kembali ke Detail Layanan
          </Link>
        </Button>

        <div className="relative rounded-3xl border-2 border-[#DDD5C3] bg-white/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#EE1C25] to-[#C41720]" />
          
          <Card className="border-0 shadow-none bg-transparent rounded-none">
            <CardHeader className="px-8 pt-8 pb-2 sm:px-10 sm:pt-10">
              <CardTitle className="text-2xl font-black tracking-tight text-[#18130E] sm:text-3xl">
                Ajukan {service.title}
              </CardTitle>
              <CardDescription className="mt-2 text-[#7A6A5C]">
                Versi awal. Autentikasi PAUS akan diaktifkan pada tahap berikutnya.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 sm:px-10 sm:pb-10">
              {service.slug === sikServiceSlug ? (
                <SikRequestWorkflow latestRequest={latestSikDetail} />
              ) : supported ? (
                <ServiceRequestForm
                  serviceSlug={service.slug}
                  defaultValues={{
                    npm: user.npm,
                    email: user.email,
                    phone: user.phone,
                  }}
                />
              ) : (
                <div className="rounded-lg border border-[#F5F0E8] bg-[#F7F3EA]/30 p-4 text-sm text-[#7A6A5C]">
                  Pengajuan online untuk layanan ini belum tersedia.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
