"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { Reveal } from "@/components/sections/reveal";
import {
  OrganizationStructureTree,
  type PublicStructureNode,
} from "@/components/profile/organization-structure-tree";

const missionItems = [
  "Memberikan pelayanan terintegrasi yang mudah diakses melalui pemanfaatan teknologi informasi.",
  "Meningkatkan profesionalisme sumber daya manusia yang responsif dan akuntabel.",
  "Menjamin keterbukaan informasi dan kepastian waktu layanan.",
];

type ProfileStructureSettingsData = {
  title: string;
  subtitle: string | null;
};

type ProfileStructureApiResponse = {
  settings: ProfileStructureSettingsData | null;
  tree: PublicStructureNode[];
};

type ProfileStructureState = {
  settings: ProfileStructureSettingsData;
  tree: PublicStructureNode[];
  loaded: boolean;
};

type ProfileLocationData = {
  eyebrow: string | null;
  title: string;
  description: string;
  directionLabel: string;
  directionUrl: string | null;
  email: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageFit: "cover" | "contain";
  hours: Array<{
    id: string;
    dayLabel: string;
    timeLabel: string;
    sortOrder: number;
  }>;
};

const defaultStructureState: ProfileStructureState = {
  settings: {
    title: "Struktur Organisasi ULT",
    subtitle: "Sinergi kepemimpinan dan eksekusi layanan yang tertata.",
  },
  tree: [],
  loaded: false,
};

const fallbackLocation: ProfileLocationData = {
  eyebrow: "Location & Access",
  title: "Lokasi Kami",
  description:
    "Lokasi ULT FMIPA berada di Lt. 1 Gedung Otto Sumarwoto Fakultas MIPA (Gedung Dekanat), Jl. Ir. Sukarno Km. 21, Jatinangor, Sumedang dan berada di pusat kawasan Universitas Padjadjaran Kampus Jatinangor.",
  directionLabel: "Petunjuk Arah",
  directionUrl: "https://maps.app.goo.gl/yT3wqVpxQteXAweZ9?g_st=ic",
  email: "ult.fmipa@unpad.ac.id",
  imageUrl: null, 
  imageAlt: "Denah lokasi FMIPA Unpad",
  imageFit: "cover",
  hours: [
    {
      id: "fallback-senin-kamis",
      dayLabel: "Senin - Kamis",
      timeLabel: "08.00-15.00 WIB",
      sortOrder: 0,
    },
    {
      id: "fallback-jumat",
      dayLabel: "Jumat (Daring)",
      timeLabel: "08.00-16.00 WIB",
      sortOrder: 1,
    },
  ],
};

export default function ProfilPage() {
  const organizationRef = useRef<HTMLElement | null>(null);
  const aboutHeadingRef = useRef<HTMLDivElement | null>(null);
  const [isOrganizationVisible, setIsOrganizationVisible] = useState(false);
  const [isAboutHeadingVisible, setIsAboutHeadingVisible] = useState(false);
  const [structure, setStructure] = useState<ProfileStructureState>(defaultStructureState);
  const [location, setLocation] = useState<ProfileLocationData>(fallbackLocation);

  useEffect(() => {
    const heading = aboutHeadingRef.current;

    if (!heading) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAboutHeadingVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.75,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    observer.observe(heading);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = organizationRef.current;

    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsOrganizationVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px -18% 0px",
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileContent() {
      try {
        const [structureResponse, locationResponse] = await Promise.all([
          fetch("/api/profile/structure", { cache: "no-store" }),
          fetch("/api/profile/location", { cache: "no-store" }),
        ]);

        if (structureResponse.ok) {
          const body = (await structureResponse.json().catch(() => null)) as {
            data?: ProfileStructureApiResponse;
          } | null;

          if (isMounted && body?.data) {
            setStructure({
              settings: body.data.settings ?? defaultStructureState.settings,
              tree: body.data.tree ?? [],
              loaded: true,
            });
          }
        } else if (isMounted) {
          // API reachable but failed: surface the neutral empty state
          // instead of quietly showing stale/fake data.
          setStructure((current) => ({ ...current, loaded: true }));
        }

        if (locationResponse.ok) {
          const body = (await locationResponse.json().catch(() => null)) as {
            data?: ProfileLocationData | null;
          } | null;

          if (isMounted && body?.data) {
            setLocation({
              ...fallbackLocation,
              ...body.data,
              hours: body.data.hours?.length ? body.data.hours : fallbackLocation.hours,
              imageFit: body.data.imageFit === "contain" ? "contain" : "cover",
            });
          }
        }
      } catch {
        if (isMounted) {
          setStructure((current) => ({ ...current, loaded: true }));
        }
      }
    }

    loadProfileContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const locationImageClass =
    location.imageFit === "contain"
      ? "h-full w-full bg-[#f7f3ea] object-contain object-center p-4"
      : "h-full w-full object-cover object-center";
  const mobileLocationImageClass =
    location.imageFit === "contain"
      ? "h-full w-full bg-[#f7f3ea] object-contain object-center p-4"
      : "h-full w-full object-cover object-center";

  return (
    <>
      <style>
        {`
          @keyframes hero-image-reveal {
            from {
              opacity: 0.78;
              transform: scale(1.045);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes vision-marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }

          .profile-marquee-track {
            animation: vision-marquee 28s linear infinite;
          }

          @keyframes about-card-sway {
            0% {
              transform: translateY(0) rotate(-1.2deg);
            }
            50% {
              transform: translateY(-7px) rotate(1.2deg);
            }
            100% {
              transform: translateY(0) rotate(-1.2deg);
            }
          }

          .about-card-sway {
            animation: about-card-sway 4.5s ease-in-out infinite;
            transform-origin: center center;
            will-change: transform;
          }

          @media (prefers-reduced-motion: reduce) {
            .about-card-sway {
              animation: none;
              transform: none;
            }

            .profile-marquee-track {
              animation: none;
            }
          }

          html {
            scroll-behavior: smooth;
          }
        `}
      </style>

      <section className="relative flex min-h-[calc(100svh-40px)] items-start overflow-hidden bg-neutral-950 sm:items-center">
        <div className="absolute inset-0">
          <Image
            src="/Beranda-Section1/gedung-fmipa.webp"
            alt="Gedung FMIPA Unpad"
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover [animation:hero-image-reveal_1200ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-black/10" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-32 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-5xl">
            <Reveal delay={160}>
              <h1 className="max-w-5xl text-[2.15rem] font-black leading-[1] tracking-normal text-white min-[380px]:text-4xl sm:text-5xl sm:leading-[0.95] lg:text-6xl xl:text-7xl">
                Profil{" "}
                <span className="bg-gradient-to-r from-[#ff2d28] via-[#ff7f87] to-white bg-clip-text text-transparent">
                  Unit Layanan
                </span>
                <br />
                Terpadu (ULT)
              </h1>
            </Reveal>

            <Reveal delay={320}>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:mt-8 sm:text-xl sm:leading-8">
                Kami berkomitmen memberikan pelayanan akademik, kemahasiswaan, dan penyediaan informasi yang mudah, cepat, profesional, akuntabel, dan transparan bagi mahasiswa, dosen, tenaga kependidikan, dan masyarakat.
              </p>
            </Reveal>

            <Reveal
              className="mt-7 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
              delay={480}
            >
              <Link
                href="/layanan"
                className="group inline-flex min-w-44 self-start items-center justify-center gap-2.5 rounded-full bg-[#ff2d28] px-5 py-3 text-xs font-black text-white shadow-2xl shadow-red-600/30 transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff1f1a] hover:shadow-red-600/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
              >
                <span>Lihat Layanan</span>
                <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="#tentang"
                className="inline-flex min-w-44 self-start items-center justify-center rounded-full border border-white/30 bg-black/35 px-5 py-3 text-xs font-black text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/55 hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
              >
                Kenali Kami
              </Link>
            </Reveal>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-20 overflow-hidden border-y border-[#D8CEB6] bg-[#EAE4CA] py-4">
          <div className="profile-marquee-track flex w-max whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <div key={groupIndex} className="flex shrink-0 items-center">
                {Array.from({ length: 6 }).map((__, itemIndex) => (
                  <div key={itemIndex} className="flex items-center">
                    <span className="px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B5E52] sm:px-8 sm:text-xs">
                      PROFIL ULT FMIPA
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="tentang"
        className="relative z-10 flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[#FEFDF9] px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 size-[600px] rounded-full bg-[#EE1C25] opacity-[0.04] blur-3xl" />
          <div className="absolute -bottom-32 -right-32 size-[500px] rounded-full bg-[#03B36B] opacity-[0.05] blur-3xl" />
          <div className="absolute right-1/3 top-1/3 size-[300px] rounded-full bg-[#FCB71B] opacity-[0.04] blur-3xl" />
        </div>

        <div className="relative mx-auto mt-8 grid w-full max-w-7xl items-center gap-6 lg:mt-12 lg:grid-cols-[1fr_1fr] lg:gap-4">
          <Reveal className="relative w-full max-w-[520px] justify-self-start lg:-ml-10 lg:max-w-[580px]" direction="left">
            <div className="absolute -left-4 -top-4 hidden h-24 w-24 rounded-2xl border border-red-200/70 sm:block" />

            <div className="about-card-sway group relative overflow-hidden rounded-[1.5rem] bg-white p-2 shadow-[0_0_55px_rgba(92,58,30,0.22),0_18px_45px_-18px_rgba(92,58,30,0.3)] transition-shadow duration-500 hover:shadow-[0_0_70px_rgba(92,58,30,0.3),0_24px_55px_-16px_rgba(92,58,30,0.4)]">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1rem]">
                <Image
                  src="/beranda-new/beranda-webp/ULT.webp"
                  alt="Unit Layanan Terpadu FMIPA"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, 580px"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-2 rounded-[1rem] bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>

          </Reveal>

          <Reveal className="relative" direction="right" delay={120}>
            <div className="max-w-2xl">
              <div
                ref={aboutHeadingRef}
                data-visible={isAboutHeadingVisible}
                className="group mb-8 flex flex-col items-start gap-y-2 min-[400px]:flex-row min-[400px]:flex-nowrap min-[400px]:gap-x-4 min-[400px]:gap-y-0 sm:mb-9"
              >
                <p className="relative inline-block shrink-0 whitespace-nowrap pb-4 text-3xl font-black uppercase tracking-[0.08em] text-neutral-950 sm:pb-5 sm:text-4xl lg:text-5xl">
                  Tentang{" "}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 18"
                    className="absolute bottom-0 left-0 h-4 w-full text-[#EE1C25]"
                    fill="none"
                  >
                    <path
                      d="M4 12 C48 2, 88 17, 132 8 S196 5, 216 11"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="3"
                      className="[stroke-dasharray:230] [stroke-dashoffset:230] transition-[stroke-dashoffset] delay-300 duration-[1200ms] ease-out group-data-[visible=true]:[stroke-dashoffset:0] motion-reduce:[stroke-dashoffset:0]"
                    />
                  </svg>
                </p>
                <span className="shrink-0 whitespace-nowrap text-3xl font-black uppercase tracking-[0.08em] text-red-600 sm:text-4xl lg:text-5xl">
                  ULT FMIPA
                </span>
              </div>

              <h2 className="text-2xl font-black leading-tight tracking-normal text-neutral-950 sm:text-2xl lg:text-2xl">
                Layanan akademik yang lebih{" "}
                <span className="text-red-600">jelas</span> dan terarah.
              </h2>

              <p className="mt-5 text-base leading-8 text-neutral-600">
                Unit Layanan Terpadu Fakultas Matematika dan Ilmu Pengetahuan
                Alam (ULT FMIPA) mulai dikembangkan pada akhir tahun 2025
                sebagai wujud komitmen FMIPA Unpad dalam meningkatkan kualitas
                layanan bagi mahasiswa, dosen, tenaga kependidikan, alumni,
                serta masyarakat.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white/75 p-5 shadow-lg shadow-black/5">
                  <p className="text-sm font-black text-neutral-950">
                    Praktis
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Informasi dan alur layanan dibuat lebih mudah dipahami.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white/75 p-5 shadow-lg shadow-black/5">
                  <p className="text-sm font-black text-neutral-950">
                    Akuntabel
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Proses layanan dibuat terukur dengan alur dan kepastian
                    waktu yang jelas.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative z-20 overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(220,38,38,0.18),transparent_18rem),radial-gradient(circle_at_82%_82%,rgba(217,119,6,0.14),transparent_20rem),linear-gradient(135deg,#241211_0%,#181111_46%,#261814_100%)] px-4 pb-20 pt-16 text-white sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-6 overflow-hidden whitespace-nowrap">
          <div className="flex w-max gap-10 text-[18vw] font-black leading-none text-white/[0.04] [animation:vision-marquee_28s_linear_infinite]">
            <span>VISION</span>
            <span>MISSION</span>
            <span>VISION</span>
            <span>MISSION</span>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden whitespace-nowrap">
          <div className="flex w-max -translate-x-1/4 gap-10 text-[16vw] font-black leading-none text-amber-300/[0.045] [animation:vision-marquee_34s_linear_infinite_reverse]">
            <span>MISSION</span>
            <span>VISION</span>
            <span>MISSION</span>
            <span>VISION</span>
          </div>
        </div>


        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-3xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              Visi Misi Kami
            </p>
          </Reveal>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-2 lg:gap-5">
            <Reveal direction="left" delay={120}>
              <div className="group flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-400/35 hover:bg-white/[0.075] sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <span className="rounded-full bg-red-500 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                    Visi Kami
                  </span>
                </div>
                <p className="flex flex-1 items-center text-base font-semibold leading-tight text-white sm:text-lg lg:text-[1.5rem] lg:leading-[1.5]">
                   Menjadi Unit Layanan Terpadu yang unggul dalam menyediakan pelayanan akademik, kemahasiswaan, dan penyediaan informasi yang mudah, cepat, profesional, akuntabel, dan transparan bagi mahasiswa, dosen, tenaga kependidikan, dan masyarakat.
                </p>
              </div>
            </Reveal>

            <Reveal direction="right" delay={220}>
              <div className="group flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/20 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-red-400/35 hover:bg-white/[0.075] sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <span className="rounded-full bg-red-500 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                    Misi Kami
                  </span>
                </div>

                <div className="space-y-2">
                  {missionItems.map((mission, index) => (
                    <div
                      key={mission}
                      className="group/item flex gap-4 rounded-2xl border border-transparent px-3 py-3 transition duration-300 hover:border-white/10 hover:bg-white/[0.055]"
                    >
                      <span className="pt-1 text-xl font-black leading-none text-white/15 transition group-hover/item:text-red-400 sm:text-2xl">
                        0{index + 1}
                      </span>
                      <p className="text-lg font-semibold leading-snug text-white sm:text-xl lg:leading-[1.2]">
                        {mission}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section
        ref={organizationRef}
        className="relative z-30 overflow-hidden border-t border-[#E5E2DB] bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,253,249,0.8)_32%,transparent_60%),radial-gradient(ellipse_at_92%_0%,rgba(184,200,189,0.4)_0%,rgba(214,222,214,0.18)_23%,transparent_48%),radial-gradient(ellipse_at_2%_24%,rgba(214,224,216,0.24)_0%,transparent_43%),radial-gradient(ellipse_at_50%_108%,rgba(236,227,213,0.42)_0%,rgba(243,236,225,0.3)_34%,transparent_68%),radial-gradient(ellipse_at_4%_90%,rgba(234,224,208,0.34)_0%,rgba(243,236,226,0.2)_31%,transparent_60%),radial-gradient(ellipse_at_92%_90%,rgba(237,228,214,0.28)_0%,transparent_54%),linear-gradient(135deg,#F7F5F0_0%,#FCF9F4_48%,#F7F3EC_100%)] px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8"
      >
        <style>
          {`
            @keyframes org-reveal {
              from {
                opacity: 0;
                transform: translateY(18px) scale(0.96);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes org-line-reveal {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes org-card-in-left {
              from {
                opacity: 0;
                transform: translateX(-42px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            @keyframes org-card-in-right {
              from {
                opacity: 0;
                transform: translateX(42px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            @keyframes org-marker-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.12); }
            }

            @keyframes org-level-reveal {
              from { opacity: 0; transform: translateY(24px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }

            @keyframes org-title-letter {
              from { opacity: 0; transform: translateY(8px); filter: blur(3px); }
              to { opacity: 1; transform: translateY(0); filter: blur(0); }
            }

            @keyframes org-title-highlight {
              from { background-size: 0% 100%; }
              to { background-size: 100% 100%; }
            }

            .org-title-letter[data-visible="true"] {
              animation: org-title-letter 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .org-title-highlight[data-visible="true"] {
              animation: org-title-highlight 1.15s 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .org-title-highlight {
              -webkit-box-decoration-break: clone;
              background-image: linear-gradient(
                to bottom,
                transparent 62%,
                rgba(238, 28, 37, 0.28) 62%,
                rgba(238, 28, 37, 0.28) 91%,
                transparent 91%
              );
              background-position: left center;
              background-repeat: no-repeat;
              background-size: 0% 100%;
              box-decoration-break: clone;
            }

            .org-chart-level {
              animation: org-level-reveal 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .org-role-row:nth-child(1) {
              animation: org-card-in-left 700ms 100ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .org-role-row:nth-child(2) {
              animation: org-card-in-right 700ms 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .org-role-row:nth-child(3) {
              animation: org-card-in-left 700ms 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .org-role-row:nth-child(4) {
              animation: org-card-in-right 700ms 580ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            .org-role-marker {
              animation: org-marker-pulse 3.6s ease-in-out infinite;
            }

            @media (prefers-reduced-motion: reduce) {
              .org-role-row,
              .org-role-marker,
              .org-chart-level,
              .org-title-letter,
              .org-title-highlight {
                animation: none !important;
              }

              .org-title-letter {
                filter: none !important;
                opacity: 1 !important;
                transform: none !important;
              }

              .org-title-highlight {
                background-size: 100% 100% !important;
              }
            }

            .org-chart-scroll {
              overflow-x: auto;
              overflow-y: visible;
              overscroll-behavior-x: contain;
              width: 100%;
            }

            .org-chart-canvas {
              margin-left: auto;
              margin-right: auto;
              width: max-content;
            }

            .org-tree-children {
              align-items: flex-start;
              display: flex;
              justify-content: center;
              list-style: none;
              margin: 0;
              padding: 0;
              width: max-content;
            }

            .org-tree-item {
              align-items: flex-start;
              display: flex;
              justify-content: center;
              min-width: 9.5rem;
              padding: 2rem 1.35rem 0;
              position: relative;
            }

            .org-tree-item::before,
            .org-tree-item::after {
              background: #d2b16d;
              content: "";
              height: 1px;
              opacity: 0;
              position: absolute;
              top: 0;
              width: 50%;
            }

            .org-tree-item::before {
              right: 50%;
            }

            .org-tree-item::after {
              left: 50%;
            }

            .org-tree-item:first-child::before,
            .org-tree-item:last-child::after,
            .org-tree-item:only-child::before,
            .org-tree-item:only-child::after {
              display: none;
            }

            .org-item-stem {
              background: #d2b16d;
              height: 2rem;
              left: 50%;
              opacity: 0;
              position: absolute;
              top: 0;
              transform: translateX(-0.5px);
              width: 1px;
            }

            .org-parent-stem {
              opacity: 0;
            }

            .org-tree-children[data-visible="true"] > .org-tree-item::before,
            .org-tree-children[data-visible="true"] > .org-tree-item::after,
            .org-tree-children[data-visible="true"] > .org-tree-item > .org-item-stem,
            .org-parent-stem[data-visible="true"] {
              animation: org-line-reveal 420ms ease-out forwards;
              animation-delay: var(--org-line-delay, 0ms);
            }

            @media (max-width: 640px) {
              .org-tree-item {
                min-width: 8.5rem;
                padding-left: 0.85rem;
                padding-right: 0.85rem;
              }
            }
          `}
        </style>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24 bg-gradient-to-b from-transparent via-[#FAF9F6]/20 to-[#FAF9F6]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <Reveal className="text-center">
            <h2 aria-label={structure.settings.title} className="relative isolate inline-block text-3xl font-black tracking-normal text-neutral-900 sm:text-4xl lg:text-5xl">
              <span
                data-visible={isOrganizationVisible ? "true" : "false"}
                className="org-title-highlight rounded-sm"
              >
                {structure.settings.title.split(" ").map((word, wordIndex, words) => (
                  <span key={`${word}-${wordIndex}`} className="inline-block">
                    {Array.from(word).map((character, index) => (
                      <span
                        key={`${character}-${index}`}
                        aria-hidden="true"
                        data-visible={isOrganizationVisible ? "true" : "false"}
                        className="org-title-letter inline-block opacity-0"
                        style={{ animationDelay: `${(wordIndex * 9 + index) * 48}ms` }}
                      >
                        {character}
                      </span>
                    ))}
                    {wordIndex < words.length - 1 ? " " : null}
                  </span>
                ))}
              </span>
            </h2>
            {structure.settings.subtitle ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-neutral-500 sm:text-base">
                {structure.settings.subtitle}
              </p>
            ) : null}
          </Reveal>

          <Reveal
            className="relative mx-auto mt-12 max-w-5xl lg:mt-16"
            delay={120}
          >
            {structure.tree.length > 0 ? (
              <OrganizationStructureTree roots={structure.tree} />
            ) : structure.loaded ? (
              <p className="mx-auto max-w-md rounded-2xl border border-[#E5E2DB] bg-white/70 px-6 py-8 text-center text-sm text-[#8A7A6E]">
                Struktur organisasi belum tersedia.
              </p>
            ) : null}
          </Reveal>
        </div>
      </section>

      <section className="relative z-40 overflow-hidden bg-[#FAF9F6] px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
        <div className="relative mx-auto min-h-[560px] max-w-7xl">
          <Reveal className="absolute inset-y-8 right-0 hidden w-[68%] overflow-hidden rounded-[2rem] border-4 border-white bg-neutral-200 shadow-2xl shadow-black/20 transition duration-500 hover:-translate-y-1 hover:shadow-black/25 lg:block">
            <Image
              src={location.imageUrl ?? "/denah-unpad.svg"}
              alt={location.imageAlt ?? location.title}
              fill
              unoptimized
              sizes="(max-width: 1280px) 68vw, 870px"
              className={`${locationImageClass} transition duration-700 hover:scale-105`}
            />
            <div className="absolute inset-0 bg-black/20" />
          </Reveal>

          <div className="relative z-10 flex min-h-[560px] items-center">
            <Reveal
              className="w-full max-w-xl rounded-[2rem] bg-white/90 px-6 py-8 shadow-2xl shadow-black/15 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-black/20 sm:px-12 sm:py-10 lg:min-h-[500px]"
              delay={120}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                {location.eyebrow ?? "Location & Access"}
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-normal text-neutral-950 sm:text-4xl">
                {location.title}
              </h2>
              <p className="mt-7 max-w-md text-sm leading-7 text-neutral-500">
                {location.description}
              </p>

              <div className="mt-10 space-y-5">
                {location.hours.map((hour) => (
                  <div
                    key={hour.id}
                    className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg shadow-black/5 sm:flex-row sm:items-center sm:justify-between sm:rounded-full"
                  >
                    <span className="text-xs font-black text-neutral-900">
                      {hour.dayLabel}
                    </span>
                    <span className="w-fit rounded-full bg-red-50 px-4 py-2 text-[10px] font-black text-red-600">
                      {hour.timeLabel}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 overflow-hidden rounded-3xl border-4 border-white bg-neutral-200 shadow-xl shadow-black/10 lg:hidden">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={location.imageUrl ?? "/denah-unpad.svg"}
                    alt={location.imageAlt ?? location.title}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 90vw, 520px"
                    className={`${mobileLocationImageClass} grayscale`}
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                {location.directionUrl ? (
                  <a
                    href="https://maps.app.goo.gl/yT3wqVpxQteXAweZ9?g_st=ic"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-7 py-4 text-xs font-black text-white shadow-lg shadow-red-600/25 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/35 sm:w-auto"
                  >
                    <MapPin className="size-4" />
                    {location.directionLabel}
                  </a>
                ) : null}

              </div>
            </Reveal>
          </div>
        </div>
      </section>

      
    </>
  );
}
