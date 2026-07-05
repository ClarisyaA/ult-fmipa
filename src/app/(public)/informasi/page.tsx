import Link from "next/link";
import Image from "next/image";
import { 
  Megaphone, 
  Bell,           
  FileText,       
  AlertCircle,    
  Newspaper,      
  FileSpreadsheet 
} from "lucide-react";
import { getPublishedInformationPosts } from "@/lib/information-posts";
import { getInformationPostCoverImage } from "@/lib/information-post-images";
import InformasiClient from "@/components/information/information-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

// ============================================
// SERVER COMPONENT 
// ============================================
export default async function InformasiPage() {
  const posts = await getPublishedInformationPosts();
  
  const postsWithCoverImages = await Promise.all(
    posts.map(async (post) => ({
      post,
      coverImage: await getInformationPostCoverImage(post.id),
    }))
  );

  const categories = Array.from(
    new Set(posts.map((p) => p.category).filter(Boolean))
  );

  return (
    <div className="relative w-full bg-[#FEFDF9]">
      <main data-testid="information-page" className="relative bg-[#FEFDF9]">
        <DecorativeAnimationStyles />

        <style>{`
          @keyframes informations-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .informations-marquee-track {
            animation: informations-marquee 34s linear infinite;
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
          }

          @keyframes spin-slow-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-spin-slow-reverse {
            animation: spin-slow-reverse 25s linear infinite;
          }

          @keyframes float-envelope {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
            50% { transform: translateY(-6px) rotate(-1.5deg) scale(1.01); }
          }
          .animate-float-envelope {
            animation: float-envelope 3s ease-in-out infinite;
          }

          @keyframes float-envelope-delay {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
            50% { transform: translateY(-6px) rotate(1.5deg) scale(1.01); }
          }
          .animate-float-envelope-delay {
            animation: float-envelope-delay 3s ease-in-out infinite 0.15s;
          }

          @keyframes float-dot-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-6px, -10px) scale(1.1); }
          }
          .animate-float-dot-1 {
            animation: float-dot-1 4s ease-in-out infinite;
          }

          @keyframes float-dot-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(8px, 8px) scale(1.1); }
          }
          .animate-float-dot-2 {
            animation: float-dot-2 3.5s ease-in-out infinite;
          }

          @keyframes float-dot-3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-8px, 6px) scale(1.1); }
          }
          .animate-float-dot-3 {
            animation: float-dot-3 4.5s ease-in-out infinite;
          }

          @keyframes float-dot-4 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(6px, -8px) scale(1.1); }
          }
          .animate-float-dot-4 {
            animation: float-dot-4 3.8s ease-in-out infinite;
          }

          .fade-up {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeUp 0.6s ease forwards;
          }

          @keyframes fadeUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* HERO SECTION */}
        <section className="hero-sec relative overflow-hidden border-b border-[#EAE2D4] bg-gradient-to-b from-[#F7F3EA] to-[#FEFDF9] px-4 pb-4 pt-30 sm:px-6 sm:pt-34 md:pt-38 lg:px-8 lg:pb-14 lg:pt-30">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, #C4B89A1A 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#EE1C25]/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-[#FCB71B]/5 blur-3xl"
          />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-8 lg:flex-row lg:gap-12">
            <div className="w-full lg:flex-1">
              <h1 className="hero-title mt-3 text-left text-[2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[2.5rem] md:text-[2.8rem] lg:text-[3rem]">
                Pusat Informasi ULT FMIPA
              </h1>

              <div className="editorial-underline flex justify-start">
                <SectionUnderline />
              </div>

              <p className="hero-desc mt-4 text-left text-base leading-7 text-[#7A6A5C] sm:text-lg sm:leading-8 md:max-w-2xl lg:max-w-xl">
                Menyajikan pengumuman, pembaruan kebijakan, dan informasi 
                strategis mengenai seluruh layanan akademik serta 
                administrasi di bawah pengelolaan ULT FMIPA Unpad 
                sebagai acuan utama bagi sivitas akademika.
              </p>
            </div>

            <div className="hero-decoration flex-shrink-0">
              <HeroDecoration />
            </div>
          </div>
        </section>

        {/* MARQUEE STRIP DIVIDER */}
        <MarqueeStrip />

        {/* CLIENT COMPONENT */}
        <InformasiClient 
          initialPosts={postsWithCoverImages} 
          initialCategories={categories as string[]}
        />
      </main>
    </div>
  );
}

// ============================================
// KOMPONEN DEKORASI 
// ============================================
function SectionUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 18"
      className={`mt-3 h-4 w-40 text-[#EE1C25] ${className}`}
      fill="none"
    >
      <path
        d="M4 12 C48 2, 88 17, 132 8 S196 5, 216 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function DecorativeAnimationStyles() {
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

function MarqueeStrip() {
  const items = ["PUSAT INFORMASI", "PENGUMUMAN RESMI", "BERITA AKADEMIK"];
  const textItems = [...items, ...items, ...items, ...items, ...items];

  return (
    <section className="relative overflow-hidden border-y border-[#d8ceb6] bg-[#EAE4CA] py-4">
      <div className="flex w-max items-center gap-12 whitespace-nowrap informations-marquee-track">
        {textItems.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="text-sm font-black uppercase tracking-[0.34em] text-[#18130E]/45"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function HeroDecoration() {
  return (
    <div className="relative hidden lg:block">
      <div className="relative h-[260px] w-[260px]">
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute inset-0 rounded-full border border-[#EE1C25]/8" />
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#EE1C25]/15" />
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#EE1C25]/15" />
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#EE1C25]/15" />
          <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#EE1C25]/15" />
        </div>

        <div className="absolute inset-[12%] animate-spin-slow-reverse">
          <div className="absolute inset-0 rounded-full border border-[#FCB71B]/8" />
          <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FCB71B]/15" />
          <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FCB71B]/15" />
          <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FCB71B]/15" />
          <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FCB71B]/15" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-32 w-32">
            <div className="absolute bottom-2 left-2 h-24 w-24 animate-float-envelope rounded-2xl border border-[#FCB71B]/30 bg-gradient-to-br from-[#FCB71B]/10 to-[#FEFDF9] p-3 shadow-md">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-[#FCB71B]" />
                <div className="h-1.5 w-10 rounded-full bg-[#FCB71B]/20" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1 w-full rounded-full bg-[#18130E]/10" />
                <div className="h-1 w-5/6 rounded-full bg-[#18130E]/10" />
                <div className="h-1 w-4/5 rounded-full bg-[#18130E]/10" />
              </div>
              <Megaphone className="absolute bottom-2 right-2 size-4 text-[#B98900]/30 -rotate-12" strokeWidth={1.8} />
            </div>

            <div className="absolute right-2 top-2 h-26 w-24 animate-float-envelope-delay rounded-2xl border border-[#EE1C25]/20 bg-white p-3 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-md bg-[#EE1C25]/10 px-1.5 py-0.5 text-[8px] font-bold text-[#EE1C25]">
                  NEW
                </div>
                <Bell className="size-3.5 text-[#EE1C25]/40 animate-pulse" strokeWidth={2} />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-1.5 w-full rounded-full bg-[#18130E]/15" />
                <div className="h-1.5 w-11/12 rounded-full bg-[#18130E]/15" />
                <div className="h-1 w-3/4 rounded-full bg-[#7A6A5C]/20" />
              </div>
              <div className="mt-4 flex items-center gap-1">
                <div className="size-3 rounded-full bg-[#EE1C25]/10 flex items-center justify-center">
                  <div className="size-1 rounded-full bg-[#EE1C25]" />
                </div>
                <div className="h-1 w-8 rounded-full bg-[#7A6A5C]/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -right-8 top-6 h-8 w-8 animate-float-dot-1">
          <FileText className="size-5 text-[#EE1C25]/15" strokeWidth={1.5} />
        </div>
        <div className="absolute -left-8 bottom-10 h-8 w-8 animate-float-dot-2">
          <AlertCircle className="size-5 text-[#FCB71B]/15" strokeWidth={1.5} />
        </div>
        <div className="absolute -right-6 bottom-16 h-6 w-6 animate-float-dot-3">
          <Bell className="size-4 text-[#18130E]/10" strokeWidth={1.5} />
        </div>
        <div className="absolute -left-6 top-16 h-6 w-6 animate-float-dot-4">
          <Megaphone className="size-4 text-[#EE1C25]/10" strokeWidth={1.5} />
        </div>
        <div className="absolute left-1/2 -top-8 h-6 w-6 -translate-x-1/2 animate-float-dot-1">
          <Newspaper className="size-4 text-[#FCB71B]/12" strokeWidth={1.5} />
        </div>
        <div className="absolute left-1/2 -bottom-8 h-6 w-6 -translate-x-1/2 animate-float-dot-2">
          <FileSpreadsheet className="size-4 text-[#EE1C25]/12" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}