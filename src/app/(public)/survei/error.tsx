"use client";

import { Button } from "@/components/ui/button";

export default function SurveiError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto grid min-h-[60vh] w-full max-w-3xl place-items-center px-4 py-20 text-center">
      <div className="rounded-lg border border-[#edd2c5] bg-[#fff7f2] px-6 py-8">
        <h1 className="text-xl font-semibold text-[#8a3d23]">
          Data belum dapat dimuat
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#8a3d23]/80">
          Koneksi database sedang tidak tersedia. Coba muat ulang halaman
          beberapa saat lagi.
        </p>
        <Button type="button" className="mt-5" onClick={reset}>
          Muat ulang
        </Button>
      </div>
    </main>
  );
}
