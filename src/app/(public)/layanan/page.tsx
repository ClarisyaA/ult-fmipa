"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Search,
  ChevronDown,
  Clock,
  ArrowRight,
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
  type LucideIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  getPublicServices,
  getServiceCategories,
} from "@/lib/legacy-services";
import type { PublicService } from "@/types/service";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CATEGORY_THEME = [
  {
    dot: "bg-[#EE1C25]",
    iconWrap: "bg-[#EE1C25]/8",
    icon: "text-[#EE1C25]",
    badgeText: "text-[#EE1C25]",
    bgGradient: "from-[#EE1C25]/5 to-transparent",
    borderGlow: "hover:border-[#EE1C25]/30",
  },
  {
    dot: "bg-[#FCB71B]",
    iconWrap: "bg-[#FCB71B]/14",
    icon: "text-[#B98900]",
    badgeText: "text-[#B98900]",
    bgGradient: "from-[#FCB71B]/5 to-transparent",
    borderGlow: "hover:border-[#FCB71B]/30",
  },
  {
    dot: "bg-[#18130E]",
    iconWrap: "bg-[#18130E]/6",
    icon: "text-[#6B5E52]",
    badgeText: "text-[#6B5E52]",
    bgGradient: "from-[#18130E]/5 to-transparent",
    borderGlow: "hover:border-[#18130E]/20",
  },
] as const;

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
  { test: /referensi|pustaka/, icon: Library },
];

function getServiceIcon(slug: string): LucideIcon {
  const match = ICON_RULES.find(({ test }) => test.test(slug));
  return match?.icon ?? FileText;
}

function serviceHref(service: PublicService) {
  return `/layanan/${service.slug}`;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return reduced;
}

function SectionUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 18"
      className={`editorial-underline mt-3 h-4 w-44 text-[#EE1C25] ${className}`}
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

function MarqueeStrip({ reducedMotion }: { reducedMotion: boolean }) {
  const items = ["LAYANAN MAHASISWA", "LAYANAN ALUMNI", "LAYANAN PERPUSTAKAAN"];
  const textItems = [...items, ...items, ...items, ...items, ...items];

  return (
    <section className="relative overflow-hidden border-y border-[#d8ceb6] bg-[#EAE4CA] py-4">
      <div
        className={`flex w-max items-center gap-12 whitespace-nowrap ${
          reducedMotion ? "" : "layanan-marquee-track"
        }`}
      >
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
          <div className="relative flex items-center">
            <div className="relative h-28 w-14 animate-float-book">
              <div className="h-full w-full rounded-l-xl border-2 border-r-0 border-[#EE1C25]/20 bg-gradient-to-r from-[#EE1C25]/5 to-transparent" />
              <div className="absolute left-3 top-4 h-[2px] w-8 rounded-full bg-[#EE1C25]/10" />
              <div className="absolute left-3 top-7 h-[2px] w-6 rounded-full bg-[#EE1C25]/10" />
              <div className="absolute left-3 top-10 h-[2px] w-7 rounded-full bg-[#EE1C25]/10" />
              <div className="absolute left-3 top-13 h-[2px] w-5 rounded-full bg-[#EE1C25]/10" />
              <div className="absolute left-3 top-16 h-[2px] w-6 rounded-full bg-[#EE1C25]/10" />
              <div className="absolute left-3 top-19 h-[2px] w-4 rounded-full bg-[#EE1C25]/10" />
            </div>

            <div className="h-28 w-1.5 rounded-full bg-[#18130E]/10" />
            <div className="relative h-28 w-14 animate-float-book-delay">
              <div className="h-full w-full rounded-r-xl border-2 border-l-0 border-[#FCB71B]/20 bg-gradient-to-l from-[#FCB71B]/5 to-transparent" />
              <div className="absolute left-3 top-4 h-[2px] w-8 rounded-full bg-[#FCB71B]/10" />
              <div className="absolute left-3 top-7 h-[2px] w-6 rounded-full bg-[#FCB71B]/10" />
              <div className="absolute left-3 top-10 h-[2px] w-7 rounded-full bg-[#FCB71B]/10" />
              <div className="absolute left-3 top-13 h-[2px] w-5 rounded-full bg-[#FCB71B]/10" />
              <div className="absolute left-3 top-16 h-[2px] w-6 rounded-full bg-[#FCB71B]/10" />
              <div className="absolute left-3 top-19 h-[2px] w-4 rounded-full bg-[#FCB71B]/10" />
            </div>
          </div>
        </div>

        <div className="absolute -right-8 top-8 h-2 w-2 animate-float-dot-1 rounded-full bg-[#EE1C25]/10" />
        <div className="absolute -left-8 bottom-12 h-2.5 w-2.5 animate-float-dot-2 rounded-full bg-[#FCB71B]/10" />
        <div className="absolute -right-6 bottom-20 h-1.5 w-1.5 animate-float-dot-3 rounded-full bg-[#18130E]/8" />
        <div className="absolute -left-6 top-20 h-1.5 w-1.5 animate-float-dot-4 rounded-full bg-[#EE1C25]/8" />
        <div className="absolute left-1/2 -top-6 h-2 w-2 -translate-x-1/2 animate-float-dot-1 rounded-full bg-[#FCB71B]/10" />
        <div className="absolute left-1/2 -bottom-6 h-2 w-2 -translate-x-1/2 animate-float-dot-2 rounded-full bg-[#EE1C25]/10" />
      </div>
    </div>
  );
}

export default function LayananPage() {
  const services = getPublicServices();
  const categories = getServiceCategories();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesQuery =
        !q ||
        `${service.title} ${service.description} ${service.category}`
          .toLowerCase()
          .includes(q);
      const matchesCategory =
        categoryFilter === "all" || service.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [services, query, categoryFilter]);

  const groupedServices = useMemo(
    () =>
      categories
        .map((category, idx) => ({
          category,
          theme: CATEGORY_THEME[idx % CATEGORY_THEME.length],
          items: filteredServices.filter((s) => s.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [categories, filteredServices]
  );

  const totalResults = filteredServices.length;
  const groupedServicesKey = groupedServices
    .map((group) => `${group.category}:${group.items.map((i) => i.slug).join(",")}`)
    .join("|");

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.utils
        .toArray<SVGPathElement>(".editorial-underline path")
        .forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: path.closest("section") ?? path,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".hero-sec",
            start: "top 90%",
            toggleActions: "play none none none",
          },
        })
        .fromTo(
          ".hero-title",
          { y: 22, opacity: 0, filter: "blur(7px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }
        )
        .fromTo(
          ".hero-desc",
          { y: 22, opacity: 0, filter: "blur(7px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" },
          "-=0.3"
        );

      gsap.fromTo(
        ".hero-decoration",
        { opacity: 0, scale: 0.9, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
      );
    }, containerRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      ctx.revert();
      clearTimeout(t);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const groups = gsap.utils.toArray<HTMLElement>(".service-group");

      groups.forEach((group) => {
        const cards = group.querySelectorAll<HTMLElement>(".service-card");
        if (cards.length === 0) return;

        if (reducedMotion) {
          gsap.set(cards, { clearProps: "transform,opacity" });
          return;
        }

        gsap.fromTo(
          cards,
          { y: 32, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.08,
            duration: 0.65,
            ease: "power3.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: group,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, containerRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 80);
    return () => {
      ctx.revert();
      clearTimeout(t);
    };
  }, [groupedServicesKey, reducedMotion]);

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-[#FEFDF9]">
      <style>{`
        @keyframes layanan-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .layanan-marquee-track {
          animation: layanan-marquee 34s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .layanan-marquee-track {
            animation: none;
          }
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

        @keyframes float-book {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(-1.5deg); }
        }
        .animate-float-book {
          animation: float-book 3s ease-in-out infinite;
        }

        @keyframes float-book-delay {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1.5deg); }
        }
        .animate-float-book-delay {
          animation: float-book-delay 3s ease-in-out infinite 0.15s;
        }

        @keyframes float-dot-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-6px, -8px); }
        }
        .animate-float-dot-1 {
          animation: float-dot-1 4s ease-in-out infinite;
        }

        @keyframes float-dot-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(8px, 6px); }
        }
        .animate-float-dot-2 {
          animation: float-dot-2 3.5s ease-in-out infinite;
        }

        @keyframes float-dot-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-8px, 6px); }
        }
        .animate-float-dot-3 {
          animation: float-dot-3 4.5s ease-in-out infinite;
        }

        @keyframes float-dot-4 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(6px, -8px); }
        }
        .animate-float-dot-4 {
          animation: float-dot-4 3.8s ease-in-out infinite;
        }
      `}</style>

      <main data-testid="services-page">
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
              <h1 className="hero-title text-left text-[2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[2.5rem] md:text-[2.8rem] lg:text-[3rem]">
                Katalog Layanan ULT FMIPA
              </h1>
              <div className="flex justify-start">
                <SectionUnderline />
              </div>

              <p className="hero-desc mt-4 text-left text-base leading-7 text-[#7A6A5C] sm:text-lg sm:leading-8 md:max-w-2xl lg:max-w-xl">
                Akses berbagai layanan ULT FMIPA Unpad yang disediakan untuk memenuhi 
                kebutuhan informasi, administrasi, dan pelayanan akademik bagi 
                mahasiswa, alumni, serta sivitas akademika.
              </p>
            </div>

            <div className="hero-decoration flex-shrink-0">
              <HeroDecoration />
            </div>
          </div>
        </section>

        {/* MARQUEE DIVIDER */}
        <MarqueeStrip reducedMotion={reducedMotion} />

        {/* SEARCH + CATEGORY FILTER */}
        <section className="search-sec bg-[#FEFDF9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="layanan-search flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:w-2/3">
                <label
                  htmlFor="layanan-search"
                  className="mb-2 ml-1 block text-[11px] font-bold uppercase tracking-widest text-[#6B5E52]"
                >
                  Cari Layanan
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#A0917F]" />
                  <Input
                    id="layanan-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Masukkan nama layanan..."
                    className="h-13 rounded-2xl border-[#DDD5C3] bg-white pl-12 text-[#18130E] placeholder:text-[#A0917F] shadow-sm transition-all duration-200 focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
                  />
                </div>
              </div>

              <div className="w-full md:w-1/3">
                <label
                  htmlFor="layanan-category"
                  className="mb-2 ml-1 block text-[11px] font-bold uppercase tracking-widest text-[#6B5E52]"
                >
                  Kategori
                </label>
                <div className="relative">
                  <select
                    id="layanan-category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-13 w-full appearance-none rounded-2xl border border-[#DDD5C3] bg-white px-4 pr-10 text-sm font-medium text-[#18130E] shadow-sm transition-all duration-200 focus:outline-none focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
                  >
                    <option value="all">Semua Layanan</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#A0917F]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATALOG */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          {totalResults === 0 ? (
            <p className="py-20 text-center text-sm text-[#A0917F]">
              Tidak ada layanan yang cocok dengan pencarian Anda.
            </p>
          ) : (
            <div className="space-y-12">
              {groupedServices.map((group) => (
                <div key={group.category} className="service-group">
                  <div className="relative mb-6"> 
                    <div className="relative flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <div>
                          <h2 className="flex items-center gap-3 text-[1.5rem] font-black tracking-tight text-[#18130E] sm:text-[1.75rem]">
                            {group.category}
                          </h2>
                          <div className={`mt-1 h-1 w-25 rounded-full bg-gradient-to-r ${group.theme.dot} to-transparent`} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full bg-[#F0EAD8] px-4 py-1.5 text-xs font-bold ${group.theme.badgeText}`}
                        >
                          {group.items.length} Layanan
                        </span>
                        <div className="hidden gap-1 sm:flex">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${group.theme.dot} opacity-${40 + i * 20}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((service) => {
                      return (
                        <Link
                          key={service.slug}
                          href={serviceHref(service)}
                          className="service-card group relative flex flex-col justify-between overflow-hidden rounded-[1.8rem] border border-[#E8DECE] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#18130E]/15 hover:shadow-xl"
                        >
                          <div>
                            <h3 className="text-[1.05rem] font-black leading-snug text-[#18130E] transition-colors duration-200 group-hover:text-[#EE1C25]">
                              {service.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-[#7A6A5C]">
                              {service.description}
                            </p>

                            <div className="mt-5 rounded-xl bg-[#FAF7EF] px-4 py-3">
                              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#A0917F]">
                                Persyaratan Awal
                              </span>
                              <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#6B5E52]">
                                {service.requirements.join(", ")}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 flex items-center justify-between border-t border-[#F0EAD8] pt-5">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B5E52]">
                              <Clock className="size-3.5 text-[#EE1C25]" />
                              {service.processingTime}
                            </span>
                            <span className="relative flex items-center gap-1 text-xs font-bold text-[#EE1C25] transition-all duration-200 group-hover:translate-x-0.5">
                              Ajukan
                              <ArrowRight className="size-3.5" />
                              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#EE1C25] transition-transform duration-300 group-hover:scale-x-100" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}