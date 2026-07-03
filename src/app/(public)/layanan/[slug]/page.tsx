import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  Award, 
  TrendingUp, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  FileText, 
  ScrollText, 
  Stamp, 
  BookOpen, 
  UploadCloud, 
  FileSearch, 
  Library,
  type LucideIcon 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCanonicalServiceSlug,
  getPublicServiceBySlug,
} from "@/lib/legacy-services";
import { getServiceFlowType } from "@/components/services/service-flow-config";
import { ServiceFlow } from "@/components/services/service-flow";

/* ================================================================
 * DEKORASI DINAMIS — berdasarkan slug
 * ================================================================ */

const ICON_RULES: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /prestasi/, icon: Award },
  { test: /kemajuan/, icon: TrendingUp },
  { test: /beasiswa/, icon: GraduationCap },
  { test: /tunjangan|orang-tua/, icon: Users },
  { test: /kelakuan/, icon: ShieldCheck },
  { test: /pengantar/, icon: Mail },
  { test: /masih-kuliah|aktif/, icon: CheckCircle2 },
  { test: /lulus/, icon: CheckCircle2 },
  { test: /transkrip/, icon: FileText },
  { test: /ijazah/, icon: ScrollText },
  { test: /legalisir/, icon: Stamp },
  { test: /peminjaman/, icon: BookOpen },
  { test: /unggah|karya-ilmiah/, icon: UploadCloud },
  { test: /plagiarisme/, icon: FileSearch },
  { test: /referensi|pustaka|perpus/, icon: Library },
];

function getServiceIcon(slug: string): LucideIcon {
  const match = ICON_RULES.find(({ test }) => test.test(slug));
  return match?.icon ?? Award;
}

function getServiceTheme(slug: string) {
  return {
    primary: "#EE1C25",
    primaryLight: "from-[#EE1C25] to-[#C41720]",
    bgGlow: "shadow-[#EE1C25]/30",
    ring: "border-[#EE1C25]/20",
    dot: "bg-[#EE1C25]",
    dotBg: "bg-[#EE1C25]/10",
    accent: "#EE1C25",
  };
}

/* ================================================================
 * HERO DECORATION
 * ================================================================ */

interface HeroDecorationProps {
  slug: string;
}

function HeroDecoration({ slug }: HeroDecorationProps) {
  const Icon = getServiceIcon(slug);
  const theme = getServiceTheme(slug);

  return (
    <div className="relative hidden lg:block">
      <div className="relative h-[180px] w-[180px]">
        <div className="absolute inset-0 animate-spin-slow opacity-60">
          <div className={`absolute inset-0 rounded-full border-2 ${theme.ring}`} />
          <div className={`absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${theme.dotBg}`} />
          <div className={`absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${theme.dotBg}`} />
          <div className={`absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${theme.dotBg}`} />
          <div className={`absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${theme.dotBg}`} />
        </div>

        <div className="absolute inset-[20%] animate-spin-slow-reverse opacity-40">
          <div className={`absolute inset-0 rounded-full border ${theme.ring}`} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br ${theme.primaryLight} shadow-lg ${theme.bgGlow} animate-float-icon`}
          >
            <Icon className="size-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <div className="absolute -right-4 top-8 h-1.5 w-1.5 animate-float-dot-1 rounded-full bg-[#EE1C25]/10" />
        <div className="absolute -left-4 bottom-8 h-1.5 w-1.5 animate-float-dot-2 rounded-full bg-[#EE1C25]/10" />
        <div className={`absolute left-1/2 -top-4 h-1.5 w-1.5 -translate-x-1/2 animate-float-dot-1 rounded-full ${theme.dotBg}`} />
        <div className={`absolute left-1/2 -bottom-4 h-1.5 w-1.5 -translate-x-1/2 animate-float-dot-2 rounded-full ${theme.dotBg}`} />
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }

        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 30s linear infinite;
        }

        @keyframes float-icon {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        .animate-float-icon {
          animation: float-icon 3.5s ease-in-out infinite;
        }

        @keyframes float-dot-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-4px, -5px); }
        }
        .animate-float-dot-1 {
          animation: float-dot-1 4.5s ease-in-out infinite;
        }

        @keyframes float-dot-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(5px, 4px); }
        }
        .animate-float-dot-2 {
          animation: float-dot-2 4s ease-in-out infinite;
        }

        @keyframes detail-fade-up {
          from { opacity: 0; transform: translateY(14px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .detail-fade-up {
          animation: detail-fade-up 0.6s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .detail-fade-up { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ================================================================
 * SECTION UNDERLINE
 * ================================================================ */

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

/* ================================================================
 * MAIN PAGE
 * ================================================================ */

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = getCanonicalServiceSlug(slug);

  if (canonicalSlug !== slug) {
    redirect(`/layanan/${canonicalSlug}`);
  }

  const service = getPublicServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const flowType = getServiceFlowType(slug);
  const Icon = getServiceIcon(slug);

  return (
    <main className="relative bg-[#FEFDF9]">
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F3EA] to-[#FEFDF9] px-6 sm:px-8 lg:px-12 pt-24 pb-4 lg:pt-28 lg:pb-6">
        {/* Background pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C4B89A1A 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Back button  */}
          <Button
            asChild
            variant="ghost"
            className="mb-3 -ml-2 text-[#6B5E52] hover:text-[#EE1C25] hover:bg-transparent"
          >
            <Link href="/layanan">
              <ArrowLeft className="size-4 mr-2" />
              Kembali ke Daftar Layanan
            </Link>
          </Button>

          {/* Bordered container card */}
          <div className="relative rounded-3xl border-2 border-[#DDD5C3] bg-gradient-to-br from-[#EE1C25]/20 via-white/20 to-[#EE1C25]/15 backdrop-blur-sm shadow-lg overflow-hidden">
            {/* Decorative accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#EE1C25] to-[#C41720]" />
            
            <div className="px-8 py-6 sm:px-10 sm:py-7 lg:px-14 lg:py-8">
              <div className="grid items-center gap-6 lg:grid-cols-[1fr_200px]">
                {/* KOLOM KIRI — Teks */}
                <div className="detail-fade-up relative z-10">
                  {/* Title */}
                  <h1 className="text-[2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[2.5rem] lg:text-[2.8rem]">
                    {service.title}
                  </h1>
                  <SectionUnderline />

                  {/* Description */}
                  <p className="mt-3 max-w-2xl text-base leading-7 text-[#7A6A5C]">
                    {service.description}
                  </p>
                </div>

                {/* KOLOM KANAN — Dekorasi */}
                <HeroDecoration slug={slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CONTENT
          ============================================================ */}
      <section className="mx-auto max-w-6xl px-4 pt-5 pb-10 sm:px-6 lg:px-8 lg:pt-4 lg:pb-15">
        <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
          <div className="flex-1 min-w-0">
            <div className="detail-fade-up grid gap-6" style={{ animationDelay: "80ms" }}>
              {/* Persyaratan */}
              <div 
                id="persyaratan"
                className="relative rounded-3xl bg-white p-6 shadow-sm sm:p-7 border border-[#F5F0E8] hover:shadow-md transition-shadow overflow-hidden scroll-mt-[100px] lg:scroll-mt-[120px]"
              >
                <div className="absolute -right-6 -top-6 h-12 w-12 rounded-full bg-[#EE1C25]/5" />
                
                <div className="relative">
                  <h2 className="text-lg font-black tracking-tight text-[#18130E]">
                    Persyaratan Awal
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#7A6A5C]">
                    Siapkan dokumen atau informasi berikut sebelum pengajuan.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {service.requirements.map((requirement) => (
                      <li
                        key={requirement}
                        className="flex items-start gap-3 text-sm leading-6 text-[#6B5E52]"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#EE1C25]" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pengajuan Layanan */}
              <div 
                id="pengajuan"
                className="relative rounded-3xl bg-white p-6 shadow-sm sm:p-7 border border-[#F5F0E8] hover:shadow-md transition-shadow overflow-hidden scroll-mt-[100px] lg:scroll-mt-[120px]"
              >
                <div className="absolute -right-6 -top-6 h-12 w-12 rounded-full bg-[#EE1C25]/5" />
                
                <div className="relative">
                  <h2 className="text-lg font-black tracking-tight text-[#18130E]">
                    Pengajuan Layanan
                  </h2>
                  <ServiceFlow slug={slug} flow={flowType} service={service} />
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-[320px] lg:flex-shrink-0 lg:sticky lg:top-[115px] lg:self-start mt-6 lg:mt-0">
            <aside
              className="detail-fade-up"
              style={{ animationDelay: "140ms" }}
            >
              <div className="space-y-4">
                {/* Ringkasan Layanan */}
                <div className="relative rounded-3xl bg-white shadow-sm border border-[#F5F0E8] hover:shadow-md transition-shadow overflow-hidden">
                  <div className="absolute -right-6 -top-6 h-12 w-12 rounded-full bg-[#EE1C25]/5" />
                  
                  <div className="relative px-6 py-5 sm:px-7 sm:py-6">
                    <h2 className="text-lg font-black tracking-tight text-[#18130E]">
                      Ringkasan Layanan
                    </h2>
                    
                    <div className="mt-4 space-y-4">
                      {/* Kategori */}
                      <div>
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-[#EE1C25]/10 p-1.5">
                            <Award className="size-4 text-[#EE1C25]" />
                          </div>
                          <span className="text-xs font-medium text-[#A0917F] uppercase tracking-wider">Kategori</span>
                        </div>
                        <p className="mt-1 pl-9 text-sm text-[#18130E]">
                          {service.category}
                        </p>
                      </div>

                      {/* Estimasi Proses */}
                      <div>
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-[#EE1C25]/10 p-1.5">
                            <Clock className="size-4 text-[#EE1C25]" />
                          </div>
                          <span className="text-xs font-medium text-[#A0917F] uppercase tracking-wider">Estimasi Proses</span>
                        </div>
                        <p className="mt-1 pl-9 text-sm text-[#18130E]">
                          {service.processingTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full bg-[#EE1C25] hover:bg-[#EE1C25]/90 shadow-lg shadow-[#EE1C25]/20"
                >
                  <Link href={`/layanan/${service.slug}/ajukan`}>Ajukan Layanan</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#DDD5C3] text-[#6B5E52] hover:border-[#EE1C25]/40 hover:text-[#EE1C25]"
                >
                  <Link href="/layanan">Kembali ke Daftar Layanan</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}