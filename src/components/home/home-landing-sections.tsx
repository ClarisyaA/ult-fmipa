"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Search, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { HomeActivityImage } from "@/components/home-activities/home-activity-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicService } from "@/types/service";

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

type HomeActivitySlide = {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string;
  image: string;
  imageAlt: string;
  imageFit: "cover" | "contain";
};

type HomeActivityApiItem = {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string;
  image: string | null;
  imageAlt: string;
  imageFit?: "cover" | "contain" | string | null;
};

const fallbackStudentActivities: HomeActivitySlide[] = [
  {
    id: "fallback-akademik",
    title: "Layanan Akademik Terpandu",
    eyebrow: "Agenda Sivitas",
    description:
      "Pendampingan langsung oleh petugas ULT dalam pengajuan surat dan dokumen akademik, mulai dari surat aktif hingga legalisasi transkrip resmi.",
    image: "/gedung-fmipa.svg",
    imageAlt: "Layanan Akademik Terpandu",
    imageFit: "cover",
  },
  {
    id: "fallback-informasi",
    title: "Ruang Informasi Sivitas",
    eyebrow: "Agenda Sivitas",
    description:
      "Kabar layanan terbaru, pengumuman resmi fakultas, dan agenda penting kampus tersaji dalam satu portal yang mudah diakses sivitas akademika.",
    image: "/gedung-fmipa.svg",
    imageAlt: "Ruang Informasi Sivitas",
    imageFit: "cover",
  },
  {
    id: "fallback-fasilitas",
    title: "Dukungan Sarana Prasarana",
    eyebrow: "Agenda Sivitas",
    description:
      "Akses peminjaman gedung, ruang belajar bersama, dan fasilitas laboratorium FMIPA untuk kegiatan akademik dan kemahasiswaan secara terstruktur.",
    image: "/gedung-fmipa.svg",
    imageAlt: "Dukungan Sarana Prasarana",
    imageFit: "cover",
  },
  {
    id: "fallback-survei",
    title: "Survei Kepuasan Sivitas",
    eyebrow: "Agenda Sivitas",
    description:
      "Bantu ULT terus meningkatkan mutu pelayanan akademik melalui survei kepuasan berkala yang transparan dan berbasis data nyata.",
    image: "/gedung-fmipa.svg",
    imageAlt: "Survei Kepuasan Sivitas",
    imageFit: "cover",
  },
];

const marqueeItems = [
  "AKADEMIK",
  "KEMAHASISWAAN",
  "FASILITAS",
  "ALUMNI",
  "BEASISWA",
  "ULT FMIPA UNPAD",
];

const heroTitlePart1 = "Satu portal untuk  ";
const heroTitlePart2 = "semua kebutuhan";
const heroTitlePart3 = "Anda.";
const heroTitleTotalChars = heroTitlePart1.length + heroTitlePart2.length + heroTitlePart3.length;
const defaultAcademicCalendarUrl =
  "https://www.unpad.ac.id/pengumuman/kalender-kegiatan-akademik-universitas-padjadjaran-tahun-akademik-2026-2027/";

type HomeService = Pick<PublicService, "title" | "slug" | "category" | "description">;

type HomeInformation = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  summary: string | null;
  publishedAt: string | null;
  image: string;
  imageAlt: string;
  imageFit: "cover" | "contain";
};

type InformationApiItem = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  summary: string | null;
  publishedAt: string | null;
  coverImage: {
    id: string;
    altText: string | null;
    originalName: string;
    imageFit?: "cover" | "contain" | string | null;
  } | null;
};

type HomeLinksApiResponse = {
  data?: {
    academicCalendar?: {
      label?: string;
      url?: string;
      isActive?: boolean;
    };
  };
};

const fallbackServices: HomeService[] = [
  {
    title: "Layanan Akademik",
    slug: "kartu-prestasi-akademik",
    category: "Layanan Mahasiswa",
    description: "Pengajuan surat akademik, legalisir, surat aktif kuliah, dan transkrip nilai resmi.",
  },
  {
    title: "Layanan Keuangan",
    slug: "rekomendasi-beasiswa",
    category: "Layanan Mahasiswa",
    description: "Informasi penangguhan UKT, cicilan pembayaran kuliah, dan beasiswa internal.",
  },
  {
    title: "Layanan Fasilitas",
    slug: "surat-pengantar",
    category: "Layanan Mahasiswa",
    description: "Peminjaman laboratorium sains, gedung pertemuan, ruang kelas, dan perlengkapan.",
  },
  {
    title: "Layanan Surat Keterangan",
    slug: "keterangan-masih-kuliah",
    category: "Layanan Mahasiswa",
    description: "Surat rekomendasi dosen, beasiswa, kelakuan baik, hingga surat bebas pustaka.",
  },
  {
    title: "Layanan Kemahasiswaan",
    slug: "keterangan-kelakuan-baik",
    category: "Layanan Mahasiswa",
    description: "Rekomendasi kegiatan kemahasiswaan, perizinan ormawa, dan pengajuan dana bantuan.",
  },
  {
    title: "Layanan Alumni",
    slug: "legalisir-ijazah-transkrip",
    category: "Layanan Alumni",
    description: "Pengesahan ijazah alumni, pengisian kuisioner tracer study, dan legalisasi berkas.",
  },
];

const fallbackInformation: HomeInformation[] = [
  {
    id: "pendaftaran",
    title: "Pendaftaran",
    slug: "",
    category: "Pendaftaran",
    summary: "Informasi alur pendaftaran mahasiswa baru jalur mandiri (SMUP) & pascasarjana FMIPA Unpad.",
    publishedAt: "2026-06-28T00:00:00.000Z",
    image: "/gedung-fmipa.svg",
    imageAlt: "Gedung FMIPA Unpad",
    imageFit: "cover",
  },
  {
    id: "akademik",
    title: "Akademik",
    slug: "",
    category: "Akademik",
    summary: "Pengumuman kalender akademik semester ganjil dan masa pengisian KRS mahasiswa.",
    publishedAt: "2026-06-27T00:00:00.000Z",
    image: "/gedung-fmipa.svg",
    imageAlt: "Gedung FMIPA Unpad",
    imageFit: "cover",
  },
  {
    id: "kemahasiswaan",
    title: "Kemahasiswaan",
    slug: "",
    category: "Kemahasiswaan",
    summary: "Panduan pengajuan Program Kreativitas Mahasiswa (PKM) dan proposal pendanaan kegiatan.",
    publishedAt: "2026-06-25T00:00:00.000Z",
    image: "/gedung-fmipa.svg",
    imageAlt: "Gedung FMIPA Unpad",
    imageFit: "cover",
  },
  {
    id: "alumni",
    title: "Alumni",
    slug: "",
    category: "Alumni",
    summary: "Sosialisasi Tracer Study FMIPA Unpad 2026 untuk peningkatan standar kualitas mutu.",
    publishedAt: "2026-06-24T00:00:00.000Z",
    image: "/gedung-fmipa.svg",
    imageAlt: "Gedung FMIPA Unpad",
    imageFit: "cover",
  },
  {
    id: "sarana-prasarana",
    title: "Sarana Prasarana",
    slug: "",
    category: "Fasilitas",
    summary: "Peningkatan fasilitas smart-classroom dan pembukaan ruang belajar bersama (co-working space).",
    publishedAt: "2026-06-22T00:00:00.000Z",
    image: "/gedung-fmipa.svg",
    imageAlt: "Gedung FMIPA Unpad",
    imageFit: "cover",
  },
  {
    id: "beasiswa-dan-magang",
    title: "Beasiswa dan Magang",
    slug: "",
    category: "Beasiswa",
    summary: "Pendaftaran beasiswa industri dan lowongan magang bersertifikat MBKM dengan mitra.",
    publishedAt: "2026-06-20T00:00:00.000Z",
    image: "/gedung-fmipa.svg",
    imageAlt: "Gedung FMIPA Unpad",
    imageFit: "cover",
  },
];

function filterByQuery<T>(items: T[], query: string, getText: (item: T) => string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => getText(item).toLowerCase().includes(q));
}

function serviceHref(service: HomeService) {
  return service.slug ? `/layanan/${service.slug}` : "/layanan";
}

function informationHref(info: HomeInformation) {
  return info.slug ? `/informasi/${info.slug}` : "/informasi";
}

function formatInfoDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toHomeInformation(item: InformationApiItem): HomeInformation {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    summary: item.summary,
    publishedAt: item.publishedAt,
    image: item.coverImage ? `/api/information/images/${item.coverImage.id}` : "/gedung-fmipa.svg",
    imageAlt: item.coverImage?.altText ?? item.coverImage?.originalName ?? item.title,
    imageFit: item.coverImage?.imageFit === "contain" ? "contain" : "cover",
  };
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
  const [typingProgress, setTypingProgress] = useState(0);
  const [startTyping, setStartTyping] = useState(false);
  const [services, setServices] = useState<HomeService[]>(fallbackServices);
  const [information, setInformation] = useState<HomeInformation[]>(fallbackInformation);
  const [activities, setActivities] = useState<HomeActivitySlide[]>(fallbackStudentActivities);
  const [academicCalendarUrl, setAcademicCalendarUrl] = useState(defaultAcademicCalendarUrl);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const heroUnderlineAnimatedRef = useRef(false);
  const heroCardRef = useTilt(6);
  const infoFeaturedRef = useTilt(4);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(() => {
        setTypingProgress(50);
      }, 0);
      return () => clearTimeout(timer);
    }
    if (!startTyping) return;
    const totalChars = heroTitleTotalChars;
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setTypingProgress(current);
      if (current >= totalChars) {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [startTyping, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || heroUnderlineAnimatedRef.current || typingProgress < heroTitleTotalChars) return;

    const path = document.querySelector<SVGPathElement>(".hero-anda-underline path");
    if (!path) return;

    const length = path.getTotalLength();
    heroUnderlineAnimatedRef.current = true;
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: "power2.out",
    });
  }, [typingProgress, reducedMotion]);

  const renderTypedTitle = () => {
    const andaUnderline = (
      <svg
        aria-hidden="true"
        viewBox="0 0 220 18"
        className="editorial-underline hero-anda-underline absolute bottom-0 left-0 h-4 w-full text-[#EE1C25]"
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

    if (reducedMotion) {
      return (
        <>
          {heroTitlePart1}
          <span className="relative inline-block">
            {heroTitlePart2}
            <span
              aria-hidden="true"
              className="absolute bottom-1 left-0 -z-10 h-3 w-full rounded-sm opacity-20"
              style={{ background: "#EE1C25" }}
            />
          </span>
          {" "}
          <span className="relative inline-block pb-4 sm:pb-5">
            {heroTitlePart3}
            {andaUnderline}
          </span>
        </>
      );
    }

    let p1 = "";
    let p2 = "";
    let p3 = "";

    if (typingProgress <= heroTitlePart1.length) {
      p1 = heroTitlePart1.slice(0, typingProgress);
    } else if (typingProgress <= heroTitlePart1.length + heroTitlePart2.length) {
      p1 = heroTitlePart1;
      p2 = heroTitlePart2.slice(0, typingProgress - heroTitlePart1.length);
    } else {
      p1 = heroTitlePart1;
      p2 = heroTitlePart2;
      p3 = heroTitlePart3.slice(0, typingProgress - heroTitlePart1.length - heroTitlePart2.length);
    }

    return (
      <>
        {p1}
        {p2 && (
          <span className="relative inline-block">
            {p2}
            {typingProgress >= heroTitlePart1.length + heroTitlePart2.length && (
              <span
                aria-hidden="true"
                className="absolute bottom-1 left-0 -z-10 h-3 w-full rounded-sm opacity-20"
                style={{ background: "#EE1C25" }}
              />
            )}
          </span>
        )}
        {p3 && (
          <>
            {" "}
            <span className="relative inline-block pb-4 sm:pb-5">
              {p3}
              {typingProgress >= heroTitleTotalChars && andaUnderline}
            </span>
          </>
        )}
      </>
    );
  };

  const filteredServices = useMemo(
    () =>
      filterByQuery(
        services,
        serviceQuery,
        (service) => `${service.title} ${service.category} ${service.description}`
      ),
    [serviceQuery, services]
  );
  const filteredInformation = useMemo(
    () =>
      filterByQuery(
        information,
        informationQuery,
        (info) => `${info.title} ${info.category ?? ""} ${info.summary ?? ""}`
      ),
    [information, informationQuery]
  );
  const displayedServices = serviceQuery.trim()
    ? filteredServices
    : filteredServices.slice(0, 6);
  const displayedServiceKey = displayedServices.map((service) => service.slug).join("|");
  const featuredInformation = filteredInformation[0] ?? information[0];
  const sideInformation = featuredInformation
    ? filteredInformation.filter((info) => info.id !== featuredInformation.id).slice(0, 5)
    : [];
  const featuredInformationImageClass =
    featuredInformation?.imageFit === "contain"
      ? "object-contain object-center p-4"
      : "object-cover object-center transition-transform duration-700 group-hover:scale-105";
  const currentActivityIdx =
    activities.length > 0 && activeIdx < activities.length ? activeIdx : 0;

  useEffect(() => {
    let cancelled = false;

    async function loadHomeLinks() {
      try {
        const response = await fetch("/api/home/links", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as HomeLinksApiResponse;
        const nextUrl = payload.data?.academicCalendar?.url?.trim();

        if (!cancelled && nextUrl) {
          setAcademicCalendarUrl(nextUrl);
        }
      } catch {
        // Keep the default academic calendar URL when the homepage links API is unavailable.
      }
    }

    loadHomeLinks();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      try {
        const response = await fetch("/api/home/activities", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: HomeActivityApiItem[] };
        const nextActivities: HomeActivitySlide[] =
          payload.data?.map((activity) => ({
            id: activity.id,
            title: activity.title,
            eyebrow: activity.eyebrow,
            description: activity.description,
            image: activity.image ?? "/gedung-fmipa.svg",
            imageAlt: activity.imageAlt ?? activity.title,
            imageFit: activity.imageFit === "contain" ? "contain" : "cover",
          })) ?? [];

        if (!cancelled && nextActivities.length > 0) {
          setActivities(nextActivities);
        }
      } catch {
        // Keep fallback activities when the homepage content API is unavailable.
      }
    }

    loadActivities();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const response = await fetch("/api/services", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: PublicService[] };
        const nextServices =
          payload.data?.map(({ title, slug, category, description }) => ({
            title,
            slug,
            category,
            description,
          })) ?? [];

        if (!cancelled && nextServices.length > 0) {
          setServices(nextServices);
        }
      } catch {
        // Keep fallback data when the API is unavailable during local development.
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInformation() {
      try {
        const response = await fetch("/api/information", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: InformationApiItem[] };
        const nextInformation = payload.data?.map(toHomeInformation) ?? [];

        if (!cancelled && nextInformation.length > 0) {
          setInformation(nextInformation);
        }
      } catch {
        // Keep fallback data when the API is unavailable during local development.
      }
    }

    loadInformation();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (activities.length <= 1) return;

    const t = setInterval(() => {
      goToActivity((currentActivityIdx + 1) % activities.length, 1);
    }, 5500);
    return () => clearInterval(t);
  }, [activities.length, currentActivityIdx, goToActivity]);

  // (reducedMotion logic moved up)

  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      // Orb ambient movement
      gsap.to(".orb-red", { x: 30, y: -20, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(".orb-green", { x: -25, y: 25, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1 });
      gsap.to(".orb-yellow", { x: 20, y: 30, duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2 });
      gsap.to(".turah-hero-mascot", {
        y: -12,
        x: 6,
        rotation: 2.5,
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

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
        .fromTo(".hero-eyebrow", { y: -18, opacity: 0, filter: "blur(6px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" })
        .call(() => {
          setStartTyping(true);
        })
        .fromTo(".hero-title", { y: 15 }, { y: 0, duration: 0.5, ease: "power3.out" }, "-=0.25")
        .fromTo(".hero-desc", { y: 22, opacity: 0, filter: "blur(7px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.85, ease: "power3.out" }, "-=0.6")
        .fromTo(".hero-cta", { y: 18, opacity: 0, filter: "blur(4px)" }, { y: 0, opacity: 1, filter: "blur(0px)", stagger: 0.1, duration: 0.55, ease: "power3.out" }, "-=0.45")
        .fromTo(".dekanat-card", { scale: 0.94, opacity: 0, y: 26, filter: "blur(8px)" }, { scale: 1, opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power4.out" }, "-=0.85");

      // Kegiatan section
      gsap.timeline({ scrollTrigger: { trigger: ".kegiatan-sec", start: "top 85%", toggleActions: "play none none none" } })
        .fromTo(".kegiatan-header", { y: 28, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" })
        .fromTo(".kegiatan-container", { scale: 0.98, opacity: 0, filter: "blur(6px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }, "-=0.4");

      // Layanan section
      gsap.timeline({ scrollTrigger: { trigger: ".layanan-sec", start: "top 85%", toggleActions: "play none none none" } })
        .fromTo(".layanan-header", { y: 28, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" })
        .fromTo(".layanan-search", { y: 24, opacity: 0, filter: "blur(6px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, "-=0.55")
        .fromTo(".layanan-all-button", { y: 18, opacity: 0, filter: "blur(4px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out" }, "-=0.2")
        .fromTo(".layanan-cta-banner", { y: 24, opacity: 0, filter: "blur(6px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.75, ease: "power3.out" }, "-=0.2");

      // Info section
      gsap.timeline({ scrollTrigger: { trigger: ".info-sec", start: "top 85%", toggleActions: "play none none none" } })
        .fromTo(".info-header", { y: 28, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" })
        .fromTo(".info-search", { y: 24, opacity: 0, filter: "blur(6px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, "-=0.55")
        .fromTo(".info-featured", { y: 34, opacity: 0, filter: "blur(7px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }, "-=0.5")
        .fromTo(".info-strip", { x: 24, opacity: 0, filter: "blur(5px)" }, { x: 0, opacity: 1, filter: "blur(0px)", stagger: 0.08, duration: 0.7, ease: "power3.out" }, "-=0.7");

    }, sectionRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => { ctx.revert(); clearTimeout(t); };
  }, [reducedMotion]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".layanan-card");
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
            trigger: ".layanan-sec",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    const t = setTimeout(() => ScrollTrigger.refresh(), 80);
    return () => {
      ctx.revert();
      clearTimeout(t);
    };
  }, [displayedServiceKey, reducedMotion]);

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

        @keyframes ult-image-reveal {
          from {
            opacity: 0.78;
            transform: scale(1.045);
            filter: blur(8px) saturate(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0) saturate(1);
          }
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

        .dekanat-hero-image {
          animation: ult-image-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track,
          .activity-progress-fill,
          .service-staff-float,
          .dekanat-hero-image {
            animation: none;
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

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">

          {/* ── Text Column ── */}
          <div className="lg:-translate-y-5">
            {/* Eyebrow
            <div className="hero-eyebrow flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EE1C25]/20 bg-[#EE1C25]/6 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#EE1C25]">
                <span className="size-1.5 rounded-full bg-[#EE1C25] animate-pulse" />
                Unit Layanan Terpadu FMIPA Unpad
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#6B5E52]">
                Dekanat FMIPA
              </span>
            </div> */}

            <Image
              src="/Beranda-Section1/LogoTeks.svg"
              alt=""
              width={900}
              height={360}
              priority
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
              className="hero-eyebrow pointer-events-none mb-0 h-auto w-36 translate-y-3 object-contain drop-shadow-[0_12px_20px_rgba(92,58,30,0.10)] sm:mb-1 sm:w-44 lg:mb-0 lg:w-48"
              aria-hidden="true"
            />

            {/* Headline */}
            <h2 className="hero-title mt-0 text-[2.6rem] font-black leading-[1.1] tracking-tight text-[#18130E] sm:text-[3.6rem] lg:text-[4rem] relative">
              {/* Invisible layout placeholder to prevent layout shifts */}
              <span className="invisible select-none" aria-hidden="true">
                Satu portal untuk{" "}
                <span className="relative inline-block">
                  semua kebutuhan
                </span>{" "}
                Anda.
              </span>
              {/* Absolute overlay rendering typewriter text */}
              <span className="absolute inset-0 select-text">
                {renderTypedTitle()}
              </span>
            </h2>
            {/* Description */}
            <p className="hero-desc mt-7 max-w-[520px] text-[1.0625rem] leading-[1.85] text-[#6B5E52] sm:mt-8">
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
              <Button
                asChild
                variant="outline"
                size="lg"
                className="hero-cta group rounded-2xl border-[#D9D0BC] bg-white px-7 font-semibold text-[#18130E] transition-all duration-200 hover:bg-[#18130E] hover:text-white hover:border-[#18130E] hover:scale-[1.02]"
              >
                <a
                  href={academicCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Kalender Akademik
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Button>
            </div>

          </div>

          {/* ── Visual Card Column ── */}
          <div className="relative min-h-[360px] sm:mt-4 sm:min-h-[430px] lg:mt-14 lg:min-h-[500px]">
            <div
              ref={heroCardRef}
              className="dekanat-card relative mx-auto -rotate-[1.5deg] overflow-hidden rounded-[2.8rem] border border-[#E8DECE] bg-white p-4 shadow-2xl shadow-[#5C3A1E]/10 transition-transform duration-300 hover:rotate-0 sm:p-5"
              style={{ willChange: "transform" }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2.2rem] bg-[#F5EEE4]">
                <Image
                  src="/gedung-fmipa.svg"
                  alt="Gedung Dekanat FMIPA Unpad"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="dekanat-hero-image object-cover transition-transform duration-700 hover:scale-105"
                />
                {/* <div className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-2xl border border-white/30 bg-white/70 px-4 py-2.5 shadow-lg backdrop-blur-md">
                  <span className="size-2 rounded-full bg-[#03B36B] animate-pulse" />
                  <span className="text-xs font-bold text-[#18130E]">Layanan Aktif</span>
                </div> */}
              </div>

              <div className="mt-4 flex items-center justify-between px-2 pb-1">
                <div>
                  <h3 className="text-base font-black text-[#18130E]">Gedung Dekanat FMIPA</h3>
                </div>
                
              </div>
            </div>

            <Image
              src="/Beranda-Section1/Turah1.svg"
              alt=""
              width={900}
              height={900}
              priority
              sizes="(max-width: 640px) 112px, (max-width: 1024px) 140px, 168px"
              className="turah-hero-mascot pointer-events-none absolute bottom-6 right-0 z-10 h-auto w-[112px] object-contain drop-shadow-[0_14px_22px_rgba(92,58,30,0.14)] sm:bottom-8 sm:-right-5 sm:w-[140px] lg:bottom-10 lg:-right-10 lg:w-[168px]"
              aria-hidden="true"
            />
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
              {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-[#03B36B]/20 bg-[#03B36B]/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#03B36B]">
                <span className="size-1.5 rounded-full bg-[#03B36B]" />
                Aktivitas Sivitas
              </span> */}
              <h2 className="mt-4 text-[2.2rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[3rem]">
                Kegiatan Mahasiswa
              </h2>
              <SectionUnderline className="text-[#03B36B]" />
              <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-[#6B5E52]">
                Jelajahi program dan aktivitas yang diselenggarakan dalam lingkungan civitas akademika FMIPA Unpad.
              </p>
            </div>

            {/* Manual prev/next controls */}
            {activities.length > 1 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  goToActivity(
                    (activeIdx - 1 + activities.length) % activities.length,
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
                  goToActivity((currentActivityIdx + 1) % activities.length, 1)
                }
                className="flex size-11 items-center justify-center rounded-2xl border border-[#D9D0BC] bg-white text-[#18130E] shadow-sm transition-all duration-200 hover:bg-[#EE1C25] hover:text-white hover:border-[#EE1C25] hover:shadow-md"
                aria-label="Slide berikutnya"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            ) : null}
          </div>

          {/* Slide container */}
          <div className="kegiatan-container relative mt-8 min-h-[650px] overflow-hidden md:min-h-[430px]">
            {activities.map((act, idx) => {
              const isActive = idx === currentActivityIdx;
              const isPrevious = idx === previousIdx;
              const displayNumber = String(idx + 1).padStart(2, "0");
              const imageFitClass =
                act.imageFit === "contain"
                  ? "object-contain object-center p-4"
                  : "object-cover object-center";
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
                  key={act.id}
                  role="tabpanel"
                  aria-hidden={!isActive}
                  className={`absolute inset-0 grid w-full items-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${slideStateClass} ${
                    isActive ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                >
                  <div className="grid items-center gap-10 md:grid-cols-2">

                    {/* Image block */}
                    <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-[#DDD5C3] bg-[#F5F0E8] ${idx % 2 === 0 ? "md:order-1" : "md:order-2"}`}>
                      <HomeActivityImage
                        src={act.image}
                        alt={act.imageAlt}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className={imageFitClass}
                        fallbackClassName="absolute inset-0 grid place-items-center bg-[#F5F0E8] p-6 text-center text-[#6B5E52]"
                        fallbackDescription="File gambar belum tersedia di storage lokal."
                      />
                      {/* Eyebrow number badge */}
                      <div
                        className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-xl bg-[#18130E] text-sm font-black text-white"
                      >
                        {displayNumber}
                      </div>
                    </div>

                    {/* Text block */}
                    <div className={`relative flex flex-col justify-center ${idx % 2 === 0 ? "md:order-2" : "md:order-1"}`}>
                      <span className="activity-bg-number pointer-events-none absolute -top-12 left-0 text-[7rem] font-black leading-none text-[#18130E]/5 sm:text-[9rem]">
                        {displayNumber}
                      </span>
                      <span className="relative text-[11px] font-bold uppercase tracking-[0.28em] text-[#6B5E52]">
                        {act.eyebrow ?? "Agenda Sivitas"}
                      </span>
                      <h3 className="relative mt-3 text-[1.75rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[2.1rem]">
                        {act.title}
                      </h3>
                      <p className="relative mt-4 text-[0.9375rem] leading-[1.8] text-[#6B5E52]">{act.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bars */}
          {activities.length > 1 ? (
          <div
            className="mt-10 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${activities.length}, minmax(0, 1fr))` }}
          >
            {activities.map((activity, idx) => (
              <button
                key={activity.id}
                onClick={() =>
                  goToActivity(idx, idx > activeIdx ? 1 : -1)
                }
                aria-label={`Ke slide ${idx + 1}`}
                className="h-1 overflow-hidden rounded-full bg-[#C4B89A]/60"
              >
                <span
                  key={`${currentActivityIdx}-${idx}`}
                  className={`block h-full origin-left rounded-full bg-[#18130E] ${
                    currentActivityIdx === idx
                      ? reducedMotion
                        ? "scale-x-100"
                        : "activity-progress-fill"
                      : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </div>
          ) : null}
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
              {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EE1C25]/20 bg-[#EE1C25]/6 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#EE1C25]">
                <span className="size-1.5 rounded-full bg-[#EE1C25]" />
                Katalog ULT
              </span> */}
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

          {/* Cards grid */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedServices.map((service) => {
              return (
                <Link
                  key={service.slug}
                  href={serviceHref(service)}
                  className="layanan-card group relative flex flex-col overflow-hidden rounded-[1.8rem] border border-[#E8DECE] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#18130E]/20 hover:shadow-xl"
                >
                  <h3 className="relative text-[1.05rem] font-black leading-snug text-[#18130E] transition-colors duration-200 group-hover:text-[#EE1C25]">
                    {service.title}
                  </h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-[#7A6A5C]">{service.description}</p>

                  <div className="relative mt-5 flex w-max items-center gap-1 text-xs font-bold text-[#EE1C25] transition-all duration-200 group-hover:translate-x-0.5">
                    Ajukan Sekarang <ArrowRight className="size-3.5" />
                    <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#EE1C25] transition-transform duration-300 group-hover:scale-x-100" />
                  </div>
                </Link>
              );
            })}

            {/* Empty state */}
            {displayedServices.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-[#A0917F]">
                Tidak ada layanan yang cocok dengan pencarian Anda.
              </p>
            )}
          </div>

          <div className="layanan-all-button mt-9 flex justify-center">
            <Button
              asChild
              variant="outline"
              className="group rounded-2xl border-[#D9D0BC] bg-white px-6 font-semibold text-[#18130E] shadow-sm transition-all duration-200 hover:border-[#18130E] hover:bg-[#18130E] hover:text-white hover:scale-[1.02]"
            >
              <Link href="/layanan" className="flex items-center gap-2">
                Lihat Semua Layanan
                <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
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
              {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FCB71B]/30 bg-[#FCB71B]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#7A5C00]">
                <span className="size-1.5 rounded-full bg-[#FCB71B]" />
                Kabar Layanan
              </span> */}
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
                  src={featuredInformation?.image ?? "/gedung-fmipa.svg"}
                  alt={featuredInformation?.imageAlt ?? "Informasi Layanan"}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, 50vw"
                  className={featuredInformationImageClass}
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B5E52]">
                  {featuredInformation?.category ?? "Terbaru"}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#8A7A6E]">
                  <Calendar className="size-3 text-[#EE1C25]" /> {formatInfoDate(featuredInformation?.publishedAt ?? null)}
                </span>
              </div>

              <h3 className="mt-4 text-[1.5rem] font-black leading-tight tracking-tight text-[#18130E] sm:text-[1.75rem] transition-colors duration-200 group-hover:text-[#EE1C25]">
                {featuredInformation?.title ?? "Pusat Layanan Informasi Terpadu"}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#7A6A5C]">
                {featuredInformation?.summary ??
                  "Temukan informasi penting mengenai layanan ULT FMIPA Unpad."}
              </p>

              <Link
                href={featuredInformation ? informationHref(featuredInformation) : "/informasi"}
                className="relative mt-6 flex w-max items-center gap-1.5 text-xs font-bold text-[#EE1C25] transition-all duration-200 group-hover:translate-x-0.5"
              >
                Baca Selengkapnya <ArrowRight className="size-3.5" />
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#EE1C25] transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </div>

            {/* Editorial strips */}
            <div className="flex flex-col gap-3.5">
              {sideInformation.map((info) => {
                const thumbnailImageClass =
                  info.imageFit === "contain"
                    ? "object-contain object-center p-2"
                    : "object-cover object-center transition-transform duration-500 group-hover:scale-110";

                return (
                  <Link
                    key={info.id}
                    href={informationHref(info)}
                    className="info-strip group grid grid-cols-[76px_1fr] gap-4 overflow-hidden rounded-[1.6rem] border border-[#DDD5C3] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-transparent"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-[1.1rem] bg-[#F0EAD8]">
                      <Image
                        src={info.image}
                        alt={info.imageAlt}
                        fill
                        unoptimized
                        sizes="76px"
                        className={thumbnailImageClass}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex min-w-0 flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-[#6B5E52]"
                          >
                            {info.category ?? "Informasi"}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium text-[#8A7A6E]">{formatInfoDate(info.publishedAt)}</span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-black leading-snug text-[#18130E] transition-colors duration-200 group-hover:text-[#EE1C25]">
                          {info.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8A7A6E]">
                          {info.summary ?? "Baca informasi lengkap ULT FMIPA Unpad."}
                        </p>
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
