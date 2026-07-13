"use client";

import { Button } from "@/components/ui/button";

export default function MahasiswaError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FEFDF9] px-4">
      <section className="max-w-lg rounded-lg border border-[#eadfd1] bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-black text-[#18130E]">
          Data belum dapat dimuat
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#7A6A5C]">
          Koneksi database sedang tidak tersedia. Coba muat ulang halaman
          beberapa saat lagi.
        </p>
        <Button className="mt-5" onClick={reset}>
          Muat ulang
        </Button>
      </section>
    </main>
  );
}
