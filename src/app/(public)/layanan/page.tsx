import Link from "next/link";
import { Clock } from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPublicServices,
  getServiceCategories,
} from "@/lib/legacy-services";

export default function LayananPage() {
  const services = getPublicServices();
  const serviceCategories = getServiceCategories();
  const groupedServices = serviceCategories.map((category) => ({
    category,
    items: services.filter((service) => service.category === category),
  }));

  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Layanan
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
            Katalog layanan ULT FMIPA
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Daftar berikut adalah katalog publik yang dikurasi dari pemetaan
            aman ke tabel legacy. Halaman ini tidak mengambil atau menampilkan
            data mahasiswa dan alumni.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          title="Kategori layanan"
          description="Kategori ini menjadi acuan awal untuk filtering atau tab layanan pada iterasi berikutnya."
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {serviceCategories.map((category) => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>

        <div className="mt-10 grid gap-10">
          {groupedServices.map((group) => (
            <div key={group.category} className="grid gap-4">
              <div className="flex items-center justify-between gap-4 border-b pb-3">
                <h2 className="text-xl font-semibold tracking-normal">
                  {group.category}
                </h2>
                <Badge variant="secondary">{group.items.length} layanan</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/layanan/${service.slug}`}
                    className="group block"
                  >
                    <Card className="flex h-full flex-col transition-colors group-hover:bg-muted/30">
                      <CardHeader>
                        <div className="mb-2">
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <CardTitle className="text-lg transition-colors group-hover:text-primary">
                          {service.title}
                        </CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-between gap-5">
                        <div>
                          <p className="text-sm font-medium">
                            Persyaratan awal
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {service.requirements.join(", ")}
                          </p>
                        </div>
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="size-4 text-primary" />
                          {service.processingTime}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
