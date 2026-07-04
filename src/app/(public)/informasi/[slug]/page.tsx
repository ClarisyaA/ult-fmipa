import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { InformationImageGallery } from "@/components/information/information-image-gallery";
import { Button } from "@/components/ui/button";
import { getInformationPostImages } from "@/lib/information-post-images";
import { getPublishedInformationPostBySlug } from "@/lib/information-posts";
import { use } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type InformationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function DecorativeAnimationStyles() {
  return (
    <style>{`
      @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .animate-spin-slow { animation: spin-slow 25s linear infinite; }

      @keyframes spin-slow-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      .animate-spin-slow-reverse { animation: spin-slow-reverse 30s linear infinite; }

      @keyframes float-icon { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.02); } }
      .animate-float-icon { animation: float-icon 3.5s ease-in-out infinite; }

      @keyframes float-dot-1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-4px, -5px); } }
      .animate-float-dot-1 { animation: float-dot-1 4.5s ease-in-out infinite; }

      @keyframes float-dot-2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(5px, 4px); } }
      .animate-float-dot-2 { animation: float-dot-2 4s ease-in-out infinite; }

      @keyframes fade-up { from { opacity: 0; transform: translateY(14px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
      .fade-up { animation: fade-up 0.6s ease-out both; }

      @media (prefers-reduced-motion: reduce) {
        .animate-spin-slow, .animate-spin-slow-reverse, .animate-float-icon,
        .animate-float-dot-1, .animate-float-dot-2, .fade-up { animation: none; }
      }
    `}</style>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function InformationDetailPage({
  params,
}: InformationDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedInformationPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const images = await getInformationPostImages(post.id);

  return (
    <main className="relative bg-[#FEFDF9]">
      <DecorativeAnimationStyles />

      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F3EA] to-[#FEFDF9] px-6 sm:px-8 lg:px-12 pt-24 pb-4 lg:pt-28 lg:pb-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C4B89A1A 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-3 flex justify-start">
            <Button
              asChild
              variant="ghost"
              className="-ml-2 text-[#6B5E52] hover:bg-transparent hover:text-[#EE1C25]"
            >
              <Link href="/informasi">
                <ArrowLeft className="mr-2 size-4" />
                Kembali ke Daftar Informasi
              </Link>
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-3xl border-2 border-[#DDD5C3] bg-gradient-to-br from-[#EE1C25]/20 via-white/20 to-[#EE1C25]/15 shadow-lg backdrop-blur-sm">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#EE1C25] to-[#C41720]" />

            <div className="px-8 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14">
              <div className="relative z-10 flex flex-col items-center text-center">
                
                {/* Kategori dan Tanggal */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {post.category ? (
                    <span className="rounded-full bg-[#EE1C25]/10 px-2.5 py-1 text-xs font-semibold text-[#EE1C25]">
                      {post.category}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 text-xs text-[#A0917F]">
                    <CalendarDays className="size-3.5" />
                    {formatDate(post.publishedAt)}
                  </span>
                </div>

                {/* Judul Utama */}
                <h1 className="mt-4 max-w-3xl text-[1.75rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[2.2rem] lg:text-[2.5rem]">
                  {post.title}
                </h1>

                {/* Garis Pembatas */}
                <div className="mt-5 h-[2px] w-24 bg-gradient-to-r from-transparent via-[#EE1C25] to-transparent" />

                {/* Ringkasan / Summary */}
                {post.summary ? (
                  <p className="mt-5 max-w-2xl text-base leading-7 text-[#7A6A5C]">
                    {post.summary}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          KONTEN UTAMA
          ============================================================ */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-20">
        <div className="rounded-3xl border border-[#F5F0E8] bg-white p-6 shadow-sm sm:p-8">
          <InformationImageGallery images={images} />
          <div className="mt-6 whitespace-pre-line text-sm leading-7 text-[#3F362C] sm:text-base sm:leading-8">
            {post.content}
          </div>
        </div>
      </section>
    </main>
  );
}