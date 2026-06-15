import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock, FileText } from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicServices } from "@/lib/legacy-services";

const highlights = [
  {
    title: "Layanan terpusat",
    description: "Satu pintu untuk kebutuhan administrasi akademik FMIPA.",
    icon: ClipboardCheck,
  },
  {
    title: "Status lebih jelas",
    description: "Fondasi alur layanan disiapkan agar proses mudah dipantau.",
    icon: Clock,
  },
  {
    title: "Informasi praktis",
    description: "Daftar layanan, persyaratan, dan estimasi waktu tersedia.",
    icon: FileText,
  },
];

export default function HomePage() {
  const featuredServices = getPublicServices().slice(0, 3);

  return (
    <main data-testid="home-page">
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Unit Layanan Terpadu
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
              Layanan administrasi FMIPA Unpad yang rapi dan mudah diakses.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Portal ini menjadi fondasi frontend untuk informasi layanan,
              pengajuan, survei, dan dashboard operasional ULT FMIPA Unpad.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/layanan">
                  Lihat Layanan
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/survei">Isi Survei</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => (
              <Card key={item.title}>
                <CardHeader className="flex flex-row items-start gap-4">
                   <div className="rounded-lg border bg-background p-2">
                    <item.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Layanan populer"
          title="Mulai dari kebutuhan yang paling sering diajukan"
          description="Katalog berikut adalah daftar layanan publik yang dikurasi dari pemetaan aman ke tabel legacy."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featuredServices.map((service) => (
            <Card key={service.slug}>
              <CardHeader>
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <CardDescription>{service.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {service.description}
                </p>
                <p className="mt-4 text-sm font-medium">
                  Estimasi: {service.processingTime}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
