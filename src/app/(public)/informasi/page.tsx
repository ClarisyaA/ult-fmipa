import { CalendarDays, Megaphone, Newspaper } from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const infoItems = [
  {
    title: "Pengumuman layanan",
    description:
      "Ruang untuk informasi jam layanan, perubahan jadwal, dan pemberitahuan penting.",
    icon: Megaphone,
  },
  {
    title: "Agenda akademik",
    description:
      "Placeholder untuk jadwal kegiatan akademik dan administrasi yang relevan.",
    icon: CalendarDays,
  },
  {
    title: "Berita layanan",
    description:
      "Area ringkas untuk pembaruan proses, panduan, atau artikel layanan ULT.",
    icon: Newspaper,
  },
];

export default function InformasiPage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Informasi
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
            Pusat informasi layanan FMIPA
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Halaman ini menyiapkan struktur untuk pengumuman, agenda, dan
            artikel layanan tanpa mengambil data dari sistem legacy.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          title="Jenis informasi"
          description="Konten masih statis agar tim FE bisa melanjutkan layout, empty state, dan pola card."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {infoItems.map((item) => (
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
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Placeholder daftar informasi</CardTitle>
              <CardDescription>
                Area ini dapat dikembangkan menjadi daftar artikel atau
                pengumuman dari CMS/API internal.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>Belum ada data dinamis yang ditampilkan pada tahap skeleton.</p>
              <p>Tambahkan integrasi setelah struktur konten dan akses disepakati.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
