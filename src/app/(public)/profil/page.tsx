import { Building2, GraduationCap, Users } from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const profileCards = [
  {
    title: "Fokus layanan",
    description:
      "Membantu kebutuhan administrasi akademik, kemahasiswaan, alumni, fasilitas, dan perpustakaan.",
    icon: Building2,
  },
  {
    title: "Pengguna layanan",
    description:
      "Disiapkan untuk mahasiswa, alumni, staff, dan unit terkait di lingkungan FMIPA Unpad.",
    icon: Users,
  },
  {
    title: "Arah pengembangan",
    description:
      "Menjadi portal layanan yang konsisten, mudah dipelihara, dan siap dikembangkan bertahap.",
    icon: GraduationCap,
  },
];

export default function ProfilPage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Profil
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
            Unit Layanan Terpadu SBAK FMIPA Unpad
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            ULT menjadi pintu awal layanan administrasi dan informasi akademik
            FMIPA Unpad. Halaman ini masih berupa fondasi konten untuk tim FE.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          title="Fondasi informasi profil"
          description="Struktur konten dibuat agar dapat dilanjutkan dengan copy final, visual kampus, dan integrasi data yang aman."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {profileCards.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="size-6 text-primary" />
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-2 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Visi layanan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Menyediakan akses informasi dan administrasi yang jelas,
              responsif, dan mudah digunakan oleh sivitas akademika.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Prinsip pengembangan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Dimulai dari skeleton yang stabil, lalu dikembangkan menuju
              pengajuan layanan, pelacakan status, dan dashboard operasional.
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
