import { MessageSquareText, Send } from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SurveiPage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Survei
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
            Survei kepuasan layanan
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Bantu tim ULT mengevaluasi kualitas layanan. Form berikut masih
            placeholder statis dan belum memiliki logic submission.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <SectionHeading
            title="Masukan pengguna layanan"
            description="Struktur ini dapat diteruskan menjadi form survei final setelah kebutuhan field dan penyimpanan disepakati."
          />
          <Card className="mt-8">
            <CardHeader>
              <MessageSquareText className="size-6 text-primary" />
              <CardTitle>Catatan implementasi</CardTitle>
              <CardDescription>
                Tidak ada data yang dikirim pada tahap layout foundation.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form survei placeholder</CardTitle>
            <CardDescription>
              Field contoh untuk membantu slicing dan validasi tampilan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nama">Nama</Label>
              <Input id="nama" placeholder="Nama responden" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="layanan">Layanan yang digunakan</Label>
              <Input id="layanan" placeholder="Contoh: Surat Aktif Kuliah" disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pesan">Masukan</Label>
              <Textarea
                id="pesan"
                placeholder="Tulis masukan layanan"
                disabled
              />
            </div>
            <Button type="button" disabled>
              <Send className="size-4" />
              Kirim Survei
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
