"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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

// ─── Data ───────────────────────────────────────────────────────────────────

const studentActivities = [
  {
    title: "Layanan Akademik Terpandu",
    eyebrow: "01",
    description:
      "Pendampingan langsung oleh petugas ULT dalam pengajuan surat dan dokumen akademik, mulai dari surat aktif hingga legalisasi transkrip resmi.",
    images: ["/gedung-fmipa.svg", "/gedung-fmipa.svg", "/gedung-fmipa.svg"],
  },
  {
    title: "Ruang Informasi Sivitas",
    eyebrow: "02",
    description:
      "Kabar layanan terbaru, pengumuman resmi fakultas, dan agenda penting kampus tersaji dalam satu portal yang mudah diakses sivitas akademika.",
    images: ["/gedung-fmipa.svg", "/gedung-fmipa.svg"],
  },
  {
    title: "Dukungan Sarana Prasarana",
    eyebrow: "03",
    description:
      "Akses peminjaman gedung, ruang belajar bersama, dan fasilitas laboratorium FMIPA untuk kegiatan akademik dan kemahasiswaan secara terstruktur.",
    images: ["/gedung-fmipa.svg", "/gedung-fmipa.svg", "/gedung-fmipa.svg"],
  },
  {
    title: "Survei Kepuasan Sivitas",
    eyebrow: "04",
    description:
      "Bantu ULT terus meningkatkan mutu pelayanan akademik melalui survei kepuasan berkala yang transparan dan berbasis data nyata.",
    images: ["/gedung-fmipa.svg", "/gedung-fmipa.svg"],
  },
];

const serviceCards = [
  "Layanan Akademik",
  "Layanan Keuangan",
  "Layanan Fasilitas",
  "Layanan Surat Keterangan",
  "Layanan Kemahasiswaan",
  "Layanan Alumni",
];

const marqueeItems = [
  "AKADEMIK",
  "KEMAHASISWAAN",
  "FASILITAS",
  "ALUMNI",
  "BEASISWA",
  "ULT FMIPA UNPAD",
];

const serviceDetails: Record<
  string,
  { desc: string }
> = {
  "Layanan Akademik": {
    desc: "Pengajuan surat akademik, legalisir, surat aktif kuliah, dan transkrip nilai resmi.",
  },
  "Layanan Keuangan": {
    desc: "Informasi penangguhan UKT, cicilan pembayaran kuliah, dan beasiswa internal.",
  },
  "Layanan Fasilitas": {
    desc: "Peminjaman laboratorium sains, gedung pertemuan, ruang kelas, dan perlengkapan.",
  },
  "Layanan Surat Keterangan": {
    desc: "Surat rekomendasi dosen, beasiswa, kelakuan baik, hingga surat bebas pustaka.",
  },
  "Layanan Kemahasiswaan": {
    desc: "Rekomendasi kegiatan kemahasiswaan, perizinan ormawa, dan pengajuan dana bantuan.",
  },
  "Layanan Alumni": {
    desc: "Pengesahan ijazah alumni, pengisian kuisioner tracer study, dan legalisasi berkas.",
  },
};

const informationCards = [
  "Pendaftaran",
  "Akademik",
  "Kemahasiswaan",
  "Alumni",
  "Sarana Prasarana",
  "Beasiswa dan Magang",
];

const informationDetails: Record<
  string,
  { date: string; category: string; desc: string; image: string }
> = {
  Pendaftaran: {
    date: "28 Jun 2026",
    category: "Pendaftaran",
    desc: "Informasi alur pendaftaran mahasiswa baru jalur mandiri (SMUP) & pascasarjana FMIPA Unpad.",
    image: "/gedung-fmipa.svg",
  },
  Akademik: {
    date: "27 Jun 2026",
    category: "Akademik",
    desc: "Pengumuman kalender akademik semester ganjil dan masa pengisian KRS mahasiswa.",
    image: "/gedung-fmipa.svg",
  },
  Kemahasiswaan: {
    date: "25 Jun 2026",
    category: "Kemahasiswaan",
    desc: "Panduan pengajuan Program Kreativitas Mahasiswa (PKM) dan proposal pendanaan kegiatan.",
    image: "/gedung-fmipa.svg",
  },
  Alumni: {
    date: "24 Jun 2026",
    category: "Alumni",
    desc: "Sosialisasi Tracer Study FMIPA Unpad 2026 untuk peningkatan standar kualitas mutu.",
    image: "/gedung-fmipa.svg",
  },
  "Sarana Prasarana": {
    date: "22 Jun 2026",
    category: "Fasilitas",
    desc: "Peningkatan fasilitas smart-classroom dan pembukaan ruang belajar bersama (co-working space).",
    image: "/gedung-fmipa.svg",
  },
  "Beasiswa dan Magang": {
    date: "20 Jun 2026",
    category: "Beasiswa",
    desc: "Pendaftaran beasiswa industri dan lowongan magang bersertifikat MBKM dengan mitra.",
    image: "/gedung-fmipa.svg",
  },
};

function filterItems(items: string[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.toLowerCase().includes(q));
}

// ─── Tilt Card Hook ──────────────────────────────────────────────────────────

function useTilt(strength = 8) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.02)`;
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)";
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.15s ease";
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return ref;
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const textItems = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <section className="relative overflow-hidden border-y border-[#d8ceb6] bg-[#EAE4CA] py-4">
      <div
        className={`flex w-max items-center gap-8 whitespace-nowrap ${
          reducedMotion ? "" : "marquee-track"
        }`}
      >
        {textItems.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="text-xs font-black uppercase tracking-[0.34em] text-[#18130E]/45"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function HomeLandingSections() {
  const [serviceQuery, setServiceQuery] = useState("");
  const [informationQuery, setInformationQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [previousIdx, setPreviousIdx] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const heroCardRef = useTilt(6);
  const infoFeaturedRef = useTilt(4);

  const filteredServices = useMemo(() => filterItems(serviceCards, serviceQuery), [serviceQuery]);
  const filteredInformation = useMemo(() => filterItems(informationCards, informationQuery), [informationQuery]);

  const goToActivity = useCallback(
    (nextIdx: number, direction: 1 | -1) => {
      if (nextIdx === activeIdx) return;
      setPreviousIdx(activeIdx);
      setSlideDirection(direction);
      setActiveIdx(nextIdx);
    },
    [activeIdx]
  );

  // Activity autoplay
  useEffect(() => {
    const t = setInterval(() => {
      goToActivity((activeIdx + 1) % studentActivities.length, 1);
    }, 5500);
    return () => clearInterval(t);
  }, [activeIdx, goToActivity]);

  // Image autoplay
  useEffect(() => {
    const t = setInterval(() => setActiveImgIdx((p) => p + 1), 2400);
    return () => clearInterval(t);
  }, []);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      // Orb ambient movement
      gsap.to(".orb-red", { x: 30, y: -20, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".orb-green", { x: -25, y: 25, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 });
      gsap.to(".orb-yellow", { x: 20, y: 30, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2 });

      gsap.to(".floating-globe", { y: -14, x: 6, rotation: 8, duration: 4.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".floating-map", { y: 12, x: -8, rotation: -5, duration: 5.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.8 });

      gsap.to(".dekanat-card", {
        y: -24,
        ease: "none",
        scrollTrigger: {
          trigger: ".dekanat-sec",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      gsap.to(".dekanat-parallax-fast", {
        y: -44,
        x: 18,
        ease: "none",
        scrollTrigger: {
          trigger: ".dekanat-sec",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.55,
        },
      });

      gsap.utils.toArray<SVGPathElement>(".editorial-underline path").forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: path.closest("section") ?? path,
            start: "top 78%",
            toggleActions: "play none none none",
          },
        });
      });

      gsap.to(".activity-bg-number", {
        y: -22,
        ease: "none",
        scrollTrigger: {
          trigger: ".kegiatan-sec",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      // Hero section
      const heroTl = gsap.timeline({ scrollTrigger: { trigger: ".dekanat-sec", start: "top 90%", toggleActions: "play none none none" } });
      heroTl
        .fromTo(".hero-eyebrow", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" })
        .fromTo(".hero-title", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power4.out" }, "-=0.3")
        .fromTo(".hero-desc", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .fromTo(".hero-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power3.out" }, "-=0.5")
        .fromTo(".dekanat-card", { scale: 0.92, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 1.1, ease: "power4.out" }, "-=0.9");

      // Kegiatan section
      gsap.timeline({ scrollTrigger: { trigger: ".kegiatan-sec", start: "top 85%", toggleActions: "play none none none" } })
        .fromTo(".kegiatan-header", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" })
        .fromTo(".kegiatan-container", { scale: 0.97, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=0.4");

      // Layanan section
      gsap.timeline({ scrollTrigger: { trigger: ".layanan-sec", start: "top 85%", toggleActions: "play none none none" } })
        .fromTo(".layanan-header", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" })
        .fromTo(".layanan-search", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "-=0.6")
        .fromTo(".layanan-featured", { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.5")
        .fromTo(".layanan-accent-line", { scaleY: 0 }, { scaleY: 1, stagger: 0.08, duration: 0.7, ease: "power3.out" }, "-=0.35")
        .fromTo(".layanan-card", { y: 40, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, stagger: 0.07, duration: 0.7, ease: "back.out(1.2)" }, "-=0.5")
        .fromTo(".layanan-cta-banner", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.3");

      // Info section
      gsap.timeline({ scrollTrigger: { trigger: ".info-sec", start: "top 85%", toggleActions: "play none none none" } })
        .fromTo(".info-header", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" })
        .fromTo(".info-search", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "-=0.6")
        .fromTo(".info-featured", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=0.5")
        .fromTo(".info-strip", { x: 30, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: "power3.out" }, "-=0.7");

    }, sectionRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => { ctx.revert(); clearTimeout(t); };
  }, [reducedMotion]);

  return (
    <div ref={sectionRef} className="overflow-hidden">
      <style>{`
        @keyframes ult-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes ult-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes ult-float-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .marquee-track {
          animation: ult-marquee 34s linear infinite;
        }

        .activity-progress-fill {
          animation: ult-progress 5.5s linear forwards;
        }

        .service-staff-float {
          animation: ult-float-soft 5.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track,
          .activity-progress-fill,
          .service-staff-float {
            animation: none;
          }

          .layanan-accent-line {
            transform: scaleY(1) !important;
          }
        }
      `}</style>

      {/* ══════════════════════════════════════════════
          SECTION 1 — HERO / DEKANAT
      ══════════════════════════════════════════════ */}
      <section className="dekanat-sec relative bg-[#FEFDF9] px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">

        {/* Ambient orbs — purely decorative, aria-hidden */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb-red absolute -left-32 -top-32 size-[600px] rounded-full bg-[#EE1C25] opacity-[0.04] blur-3xl" />
          <div className="orb-green absolute -bottom-32 -right-32 size-[500px] rounded-full bg-[#03B36B] opacity-[0.05] blur-3xl" />
          <div className="orb-yellow absolute right-1/3 top-1/3 size-[300px] rounded-full bg-[#FCB71B] opacity-[0.04] blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">

          {/* ── Text Column ── */}
          <div>
            {/* Eyebrow */}
            <div className="hero-eyebrow flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EE1C25]/20 bg-[#EE1C25]/6 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#EE1C25]">
                <span className="size-1.5 rounded-full bg-[#EE1C25] animate-pulse" />
                Unit Layanan Terpadu FMIPA Unpad
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B5E52]">
                Dekanat FMIPA
              </span>
            </div>

            {/* Headline */}
            <h2 className="hero-title mt-7 text-[2.6rem] font-black leading-[1.1] tracking-tight text-[#18130E] sm:text-[3.6rem] lg:text-[4rem]">
              Satu portal untuk seluruh{" "}
              <span className="relative inline-block">
                kebutuhan akademik
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 left-0 -z-10 h-3 w-full rounded-sm opacity-20"
                  style={{ background: "#EE1C25" }}
                />
              </span>{" "}
              Anda.
            </h2>
            <SectionUnderline />

            {/* Description */}
            <p className="hero-desc mt-6 max-w-[520px] text-[1.0625rem] leading-[1.85] text-[#6B5E52]">
              Unit Layanan Terpadu (ULT) FMIPA Universitas Padjadjaran memfasilitasi kebutuhan administrasi akademik, kemahasiswaan, sarana prasarana, dan alumni secara cepat, transparan, dan terarah.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-3.5">
              <Button
                asChild
                size="lg"
                className="hero-cta group rounded-2xl bg-[#EE1C25] px-7 font-bold text-white shadow-xl shadow-red-600/20 transition-all duration-200 hover:bg-[#C7111A] hover:shadow-red-600/30 hover:scale-[1.02]"
              >
                <Link href="/layanan" className="flex items-center gap-2">
                  Temukan Layanan
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="hero-cta rounded-2xl border-[#DDD5C3] bg-white px-7 font-semibold text-[#18130E] transition-all duration-200 hover:bg-[#F0EAD8] hover:border-[#C9BFA8] hover:scale-[1.02]"
              >
                <Link href="/profil">Profil ULT</Link>
              </Button>
            </div>

          </div>

          {/* ── Visual Card Column ── */}
          <div className="relative">
            <div
              ref={heroCardRef}
              className="dekanat-card relative -rotate-[1.5deg] overflow-hidden rounded-[2.8rem] border border-[#E8DECE] bg-white p-5 shadow-2xl shadow-[#5C3A1E]/10 transition-transform duration-300 hover:rotate-0"
              style={{ willChange: "transform" }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.2rem] bg-[#F5EEE4]">
                <Image
                  src="/gedung-fmipa.svg"
                  alt="Gedung Dekanat FMIPA Unpad"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                {/* Glassmorphism overlay badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-2xl border border-white/30 bg-white/70 px-4 py-2.5 shadow-lg backdrop-blur-md">
                  <span className="size-2 rounded-full bg-[#03B36B] animate-pulse" />
                  <span className="text-xs font-bold text-[#18130E]">Layanan Aktif</span>
                </div>
              </div>

              {/* Card footer */}
              <div className="mt-4 flex items-center justify-between px-2 pb-1">
                <div>
                  <h3 className="text-base font-black text-[#18130E]">Gedung Dekanat FMIPA</h3>
                  <p className="mt-0.5 text-xs text-[#8A7A6E]">Pusat Layanan Terpadu, Jatinangor.</p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#EE1C25]/8 text-[#EE1C25]">
                  <ArrowUpRight className="size-4" />
                </div>
              </div>
            </div>

            {/* Floating globe badge */}
            <div className="floating-globe dekanat-parallax-fast absolute -left-7 -top-7 hidden size-[68px] rounded-2xl border border-[#E8DECE] bg-white p-3 shadow-xl transition-transform duration-300 hover:rotate-6 sm:block">
              <Image src="/globe.svg" alt="" width={44} height={44} className="size-full" aria-hidden="true" />
            </div>

            {/* Floating map badge */}
            <div className="floating-map dekanat-parallax-fast absolute -bottom-7 -right-7 hidden aspect-square w-28 rounded-3xl border border-[#E8DECE] bg-white p-3.5 shadow-xl transition-transform duration-300 hover:-rotate-3 sm:block">
              <Image src="/denah-unpad.svg" alt="" width={84} height={84} className="size-full object-contain" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <MarqueeStrip reducedMotion={reducedMotion} />

      {/* ══════════════════════════════════════════════
          SECTION 2 — KEGIATAN MAHASISWA
      ══════════════════════════════════════════════ */}
      <section className="kegiatan-sec relative border-t border-[#EAE2D4] bg-[#F7F3EA] px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">

        {/* Subtle grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, #C4B89A22 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl">

          {/* Header */}
          <div className="kegiatan-header flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#03B36B]/20 bg-[#03B36B]/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#03B36B]">
                <span className="size-1.5 rounded-full bg-[#03B36B]" />
                Aktivitas Sivitas
              </span>
              <h2 className="mt-4 text-[2.2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[3rem]">
                Kegiatan Mahasiswa
              </h2>
              <SectionUnderline className="text-[#03B36B]" />
              <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-[#6B5E52]">
                Jelajahi program dan aktivitas yang diselenggarakan dalam lingkungan civitas akademika FMIPA Unpad.
              </p>
            </div>

            {/* Manual prev/next controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  goToActivity(
                    (activeIdx - 1 + studentActivities.length) % studentActivities.length,
                    -1
                  )
                }
                className="flex size-11 items-center justify-center rounded-2xl border border-[#D9D0BC] bg-white text-[#18130E] shadow-sm transition-all duration-200 hover:bg-[#EE1C25] hover:text-white hover:border-[#EE1C25] hover:shadow-md"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() =>
                  goToActivity((activeIdx + 1) % studentActivities.length, 1)
                }
                className="flex size-11 items-center justify-center rounded-2xl border border-[#D9D0BC] bg-white text-[#18130E] shadow-sm transition-all duration-200 hover:bg-[#EE1C25] hover:text-white hover:border-[#EE1C25] hover:shadow-md"
                aria-label="Slide berikutnya"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          {/* Slide container */}
          <div className="kegiatan-container relative mt-8 min-h-[650px] overflow-hidden md:min-h-[430px]">
            {studentActivities.map((act, idx) => {
              const isActive = idx === activeIdx;
              const isPrevious = idx === previousIdx;
              const imgIdx = activeImgIdx % act.images.length;
              const slideStateClass = isActive
                ? "z-20 translate-x-0 scale-100 opacity-100"
                : isPrevious
                  ? slideDirection === 1
                    ? "z-10 -translate-x-16 scale-[0.86] opacity-0"
                    : "z-10 translate-x-16 scale-[0.86] opacity-0"
                  : slideDirection === 1
                    ? "z-0 translate-x-16 scale-[0.86] opacity-0"
                    : "z-0 -translate-x-16 scale-[0.86] opacity-0";

              return (
                <div
                  key={act.title}
                  role="tabpanel"
                  aria-hidden={!isActive}
                  className={`absolute inset-0 grid w-full items-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${slideStateClass} ${
                    isActive ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                >
                  <div className="grid items-center gap-10 md:grid-cols-2">

                    {/* Image block */}
                    <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-[#DDD5C3] bg-[#F0EAD8] ${idx % 2 === 0 ? "md:order-1" : "md:order-2"}`}>
                      {act.images.map((src, i) => (
                        <Image
                          key={`${act.title}-${i}`}
                          src={src}
                          alt={i === 0 ? act.title : `${act.title} ${i + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className={`object-cover transition-all duration-700 ${i === imgIdx ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
                        />
                      ))}
                      {/* Dot indicators */}
                      {act.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
                          {act.images.map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 rounded-full transition-all duration-300 ${i === imgIdx ? "w-5 bg-white" : "w-1.5 bg-white/55"}`}
                            />
                          ))}
                        </div>
                      )}
                      {/* Eyebrow number badge */}
                      <div
                        className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-xl bg-[#18130E] text-sm font-black text-white"
                      >
                        {act.eyebrow}
                      </div>
                    </div>

                    {/* Text block */}
                    <div className={`relative flex flex-col justify-center ${idx % 2 === 0 ? "md:order-2" : "md:order-1"}`}>
                      <span className="activity-bg-number pointer-events-none absolute -top-12 left-0 text-[7rem] font-black leading-none text-[#18130E]/5 sm:text-[9rem]">
                        {act.eyebrow}
                      </span>
                      <span className="relative text-[11px] font-bold uppercase tracking-[0.28em] text-[#6B5E52]">
                        Agenda Sivitas
                      </span>
                      <h3 className="relative mt-3 text-[1.75rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[2.1rem]">
                        {act.title}
                      </h3>
                      <p className="relative mt-4 text-[0.9375rem] leading-[1.8] text-[#6B5E52]">{act.description}</p>

                      <div className="mt-7">
                        <Button
                          asChild
                          variant="outline"
                          className="group rounded-2xl border-[#D9D0BC] bg-white font-semibold text-[#18130E] shadow-sm transition-all duration-200 hover:border-[#18130E] hover:bg-[#18130E] hover:text-white hover:scale-[1.02]"
                        >
                          <Link href="/layanan" className="flex items-center gap-2 px-2">
                            Pelajari Selengkapnya
                            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bars */}
          <div className="mt-10 grid grid-cols-4 gap-2">
            {studentActivities.map((_, idx) => (
              <button
                key={idx}
                onClick={() =>
                  goToActivity(idx, idx > activeIdx ? 1 : -1)
                }
                aria-label={`Ke slide ${idx + 1}`}
                className="h-1 overflow-hidden rounded-full bg-[#C4B89A]/60"
              >
                <span
                  key={`${activeIdx}-${idx}`}
                  className={`block h-full origin-left rounded-full bg-[#18130E] ${
                    activeIdx === idx
                      ? reducedMotion
                        ? "scale-x-100"
                        : "activity-progress-fill"
                      : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — LAYANAN
      ══════════════════════════════════════════════ */}
      <section className="layanan-sec border-t border-[#EAE2D4] bg-[#FEFDF9] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">

          {/* Header */}
          <div className="layanan-header flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EE1C25]/20 bg-[#EE1C25]/6 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#EE1C25]">
                <span className="size-1.5 rounded-full bg-[#EE1C25]" />
                Katalog ULT
              </span>
              <h2 className="mt-4 text-[2.2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[3rem]">
                Layanan Kami
              </h2>
              <SectionUnderline />
            </div>
            <Button
              asChild
              className="group rounded-2xl bg-[#EE1C25] px-6 font-semibold text-white shadow-lg shadow-red-600/15 transition-all duration-200 hover:bg-[#C7111A] hover:scale-[1.02]"
            >
              <Link href="/layanan" className="flex items-center gap-2">
                Lihat Semua
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="layanan-search relative mt-8">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#A0917F]" />
            <Input
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              placeholder="Cari layanan..."
              className="h-13 rounded-2xl border-[#DDD5C3] bg-[#F5F0E8] pl-12 text-[#18130E] placeholder:text-[#A0917F] shadow-inner transition-all duration-200 focus-visible:bg-white focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30"
            />
          </div>

          <Link
            href="/layanan"
            className="layanan-featured group relative mt-10 grid overflow-hidden rounded-[2rem] border border-[#E8DECE] bg-white p-7 shadow-sm transition-all duration-300 hover:border-[#EE1C25]/25 hover:shadow-xl md:grid-cols-[1fr_220px] md:items-center"
          >
            <span className="layanan-accent-line absolute bottom-0 left-0 top-0 w-[3px] origin-top scale-y-0 bg-[#EE1C25]" />
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6B5E52]">
                Sorotan layanan
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-[#18130E]">
                Layanan Akademik
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#7A6A5C]">
                Jalur cepat untuk pengajuan surat aktif, legalisir, transkrip, dan kebutuhan administrasi akademik yang paling sering digunakan mahasiswa.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#EE1C25]">
                Mulai pengajuan
                <span className="relative inline-flex items-center">
                  <ArrowRight className="size-3.5" />
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#EE1C25] transition-transform duration-300 group-hover:scale-x-100" />
                </span>
              </span>
            </div>
            <div className="pointer-events-none relative mt-8 hidden h-44 md:mt-0 md:block">
              <Image
                src="/beranda/staff1.svg"
                alt=""
                fill
                sizes="220px"
                className="service-staff-float object-contain object-bottom"
                aria-hidden="true"
              />
            </div>
          </Link>

          {/* Cards grid */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const d = serviceDetails[service];
              if (!d) return null;
              return (
                <Link
                  key={service}
                  href="/layanan"
                  className="layanan-card group relative flex flex-col overflow-hidden rounded-[1.8rem] border border-[#E8DECE] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#18130E]/20 hover:shadow-xl"
                >
                  <span className="layanan-accent-line absolute bottom-0 left-0 top-0 w-[3px] origin-top scale-y-0 bg-[#EE1C25]" />
                  <h3 className="relative text-[1.05rem] font-black leading-snug text-[#18130E] transition-colors duration-200 group-hover:text-[#EE1C25]">
                    {service}
                  </h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-[#7A6A5C]">{d.desc}</p>

                  <div className="relative mt-5 flex w-max items-center gap-1 text-xs font-bold text-[#EE1C25] transition-all duration-200 group-hover:translate-x-0.5">
                    Ajukan Sekarang <ArrowRight className="size-3.5" />
                    <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#EE1C25] transition-transform duration-300 group-hover:scale-x-100" />
                  </div>
                </Link>
              );
            })}

            {/* Empty state */}
            {filteredServices.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-[#A0917F]">
                Tidak ada layanan yang cocok dengan pencarian Anda.
              </p>
            )}
          </div>

          {/* Suggestion banner */}
          <div className="layanan-cta-banner mt-12 flex flex-col items-start justify-between gap-6 overflow-hidden rounded-[2rem] border border-[#EAE2D4] bg-gradient-to-br from-[#F5F0E8] to-[#FEFDF9] p-8 md:flex-row md:items-center">
            <div className="max-w-lg">
              <h4 className="text-lg font-black text-[#18130E]">Layanan yang Anda butuhkan belum tersedia?</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-[#7A6A5C]">
                Bantu kami meningkatkan mutu pelayanan dengan mengusulkan layanan baru untuk dipertimbangkan oleh ULT FMIPA.
              </p>
            </div>
            <Button
              asChild
              className="group shrink-0 rounded-2xl bg-[#03B36B] px-6 font-bold text-white shadow-lg shadow-[#03B36B]/20 transition-all duration-200 hover:bg-[#029458] hover:scale-[1.02]"
            >
              <a href="https://forms.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Usulkan Layanan
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 4 — INFORMASI
      ══════════════════════════════════════════════ */}
      <section className="info-sec relative border-t border-[#EAE2D4] bg-[#F7F3EA] px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, #C4B89A1A 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto w-full max-w-6xl">

          {/* Header */}
          <div className="info-header flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FCB71B]/30 bg-[#FCB71B]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#7A5C00]">
                <span className="size-1.5 rounded-full bg-[#FCB71B]" />
                Kabar Layanan
              </span>
              <h2 className="mt-4 text-[2.2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[3rem]">
                Informasi Terkini
              </h2>
              <SectionUnderline className="text-[#FCB71B]" />
            </div>
            <Button
              asChild
              variant="outline"
              className="group rounded-2xl border-[#D9D0BC] bg-white font-semibold text-[#18130E] shadow-sm transition-all duration-200 hover:bg-[#F0EAD8] hover:scale-[1.02]"
            >
              <Link href="/informasi" className="flex items-center gap-2">
                Lihat Semua
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="info-search relative mt-8">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#A0917F]" />
            <Input
              value={informationQuery}
              onChange={(e) => setInformationQuery(e.target.value)}
              placeholder="Cari informasi..."
              className="h-13 rounded-2xl border-[#DDD5C3] bg-white pl-12 text-[#18130E] placeholder:text-[#A0917F] shadow-inner transition-all duration-200 focus-visible:border-[#FCB71B]/50 focus-visible:ring-1 focus-visible:ring-[#FCB71B]/30"
            />
          </div>

          {/* Grid */}
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

            {/* Featured card */}
            <div
              ref={infoFeaturedRef}
              className="info-featured group flex flex-col rounded-[2.5rem] border border-[#DDD5C3] bg-white p-7 shadow-md transition-shadow duration-300 hover:shadow-2xl hover:border-[#FCB71B]/30"
              style={{ willChange: "transform" }}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] bg-[#F0EAD8]">
                <Image
                  src="/gedung-fmipa.svg"
                  alt="Informasi Layanan"
                  fill
                  sizes="(max-width: 1024px) 90vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay badge */}
                <div className="absolute inset-0 flex items-end p-5">
                  <div className="rounded-2xl border border-white/30 bg-white/75 px-4 py-3 shadow-lg backdrop-blur-md">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#EE1C25]">Pengumuman Resmi</span>
                    <div className="mt-0.5 text-xs font-semibold text-[#18130E]">Admin ULT FMIPA</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B5E52]">Terbaru</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#8A7A6E]">
                  <Calendar className="size-3 text-[#EE1C25]" /> 28 Juni 2026
                </span>
              </div>

              <h3 className="mt-4 text-[1.5rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[1.75rem] transition-colors duration-200 group-hover:text-[#EE1C25]">
                Pusat Layanan Informasi Terpadu & Beasiswa MBKM
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#7A6A5C]">
                Temukan informasi penting mengenai pendaftaran program magang bersertifikat, beasiswa internal & eksternal, jadwal registrasi akademik, serta tata tertib perkuliahan FMIPA Unpad.
              </p>

              <div className="relative mt-6 flex w-max items-center gap-1.5 text-xs font-bold text-[#EE1C25] transition-all duration-200 group-hover:translate-x-0.5">
                Baca Selengkapnya <ArrowRight className="size-3.5" />
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#EE1C25] transition-transform duration-300 group-hover:scale-x-100" />
              </div>
            </div>

            {/* Editorial strips */}
            <div className="flex flex-col gap-3.5">
              {filteredInformation.map((info) => {
                const d = informationDetails[info];
                if (!d) return null;
                return (
                  <Link
                    key={info}
                    href="/informasi"
                    className="info-strip group grid grid-cols-[76px_1fr] gap-4 overflow-hidden rounded-[1.6rem] border border-[#DDD5C3] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-transparent"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-[1.1rem] bg-[#F0EAD8]">
                      <Image
                        src={d.image}
                        alt=""
                        fill
                        sizes="76px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-[#6B5E52]"
                          >
                            {d.category}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-[#8A7A6E]">{d.date}</span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-black leading-snug text-[#18130E] transition-colors duration-200 group-hover:text-[#EE1C25]">
                          {info}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8A7A6E]">{d.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {filteredInformation.length === 0 && (
                <p className="py-8 text-center text-sm text-[#A0917F]">
                  Tidak ada informasi yang cocok.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
