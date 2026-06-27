"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

import { Reveal } from "@/components/sections/reveal";

const missionItems = [
  "Menyederhanakan prosedur birokrasi melalui integrasi sistem digital.",
  "Meningkatkan kompetensi sumber daya manusia dalam melayani publik.",
  "Menjamin keterbukaan informasi dan kepastian waktu layanan.",
];

const organization = {
  head: {
    name: "Nama Lengkap",
    role: "Kepala ULT",
    color: "emerald",
    photo: "",
  },
  coordinators: [
    {
      name: "Nama Lengkap",
      role: "Koordinator Operasional",
      color: "emerald",
      photo: "",
      staff: [
        { name: "Staff 1", photo: "" },
        { name: "Staff 2", photo: "" },
      ],
    },
    {
      name: "Nama Lengkap",
      role: "Koordinator Administrasi",
      color: "red",
      photo: "",
      staff: [
        { name: "Staff 1", photo: "" },
        { name: "Staff 2", photo: "" },
      ],
    },
    {
      name: "Nama Lengkap",
      role: "Koordinator Teknik",
      color: "amber",
      photo: "",
      staff: [
        { name: "Staff 1", photo: "" },
        { name: "Staff 2", photo: "" },
      ],
    },
  ],
} as const;

const orgColorClass = {
  emerald: {
    border: "border-emerald-500/75",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  red: {
    border: "border-rose-400/80",
    bg: "bg-red-50",
    text: "text-rose-600",
    dot: "bg-rose-400",
  },
  amber: {
    border: "border-amber-400/85",
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-400",
  },
} as const;

const orgLineClass = "bg-[#d2b16d]";
const baseOrgRevealClass = "opacity-0";
const animatedOrgRevealClass = "[animation:org-reveal_650ms_ease-out_forwards]";
const orgLineRevealClass =
  "opacity-0";
const animatedOrgLineRevealClass =
  "[animation:org-line-reveal_420ms_ease-out_forwards]";

type OrgColor = keyof typeof orgColorClass;

function OrgAvatar({
  name,
  photo,
  color,
  size = "md",
}: {
  name: string;
  photo?: string;
  color: OrgColor;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "size-16",
    md: "size-20",
    lg: "size-28",
  };

  return (
    <div
      className={`group relative mx-auto ${sizeClass[size]} rounded-full border-[3px] bg-white p-1.5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/15 ${orgColorClass[color].border}`}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-neutral-100">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound className="size-1/2 text-neutral-300 transition duration-300 group-hover:scale-110" />
          </div>
        )}
      </div>
      <span
        className={`absolute bottom-0 left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-white ${orgColorClass[color].dot}`}
      />
    </div>
  );
}

export default function ProfilPage() {
  const organizationRef = useRef<HTMLElement | null>(null);
  const [isOrganizationVisible, setIsOrganizationVisible] = useState(false);

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
        threshold: 0.22,
        rootMargin: "0px 0px -18% 0px",
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const orgRevealClass = isOrganizationVisible
    ? `${baseOrgRevealClass} ${animatedOrgRevealClass}`
    : baseOrgRevealClass;
  const orgLineAnimatedClass = isOrganizationVisible
    ? `${orgLineRevealClass} ${animatedOrgLineRevealClass}`
    : orgLineRevealClass;

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

          html {
            scroll-behavior: smooth;
          }
        `}
      </style>

      <section className="relative flex min-h-[calc(100vh+20px)] items-center overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          <img
            src="/gedung-fmipa.svg"
            alt="Gedung FMIPA Unpad"
            className="h-full w-full object-cover [animation:hero-image-reveal_1200ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-black/10" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-5xl">
            <Reveal delay={160}>
              <h1 className="max-w-5xl text-4xl font-black leading-[0.95] tracking-normal text-white min-[380px]:text-5xl sm:text-5xl lg:text-6xl xl:text-7xl">
                Profil{" "}
                <span className="bg-gradient-to-r from-[#ff2d28] via-[#ff7f87] to-white bg-clip-text text-transparent">
                  Unit Layanan
                </span>
                <br />
                Terpadu (ULT)
              </h1>
            </Reveal>

            <Reveal delay={320}>
              <p className="mt-7 max-w-2xl text-sm leading-7 text-white/70 sm:mt-8 sm:text-base sm:leading-8">
                Komitmen kami dalam memberikan layanan berkualitas tinggi,
                transparan, dan efisien bagi seluruh civitas akademika, alumni,
                serta masyarakat luas di lingkungan Fakultas MIPA Unpad.
              </p>
            </Reveal>

            <Reveal
              className="mt-11 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center"
              delay={480}
            >
              <Link
                href="/layanan"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#ff2d28] px-8 py-4 text-sm font-black text-white shadow-2xl shadow-red-600/30 transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff1f1a] hover:shadow-red-600/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
              >
                <span>Lihat Layanan</span>
                <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="#tentang"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-black/35 px-8 py-4 text-sm font-black text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/55 hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
              >
                Kenali Kami
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id="tentang"
        className="relative z-10 flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[linear-gradient(135deg,#fff8f7_0%,#fff_42%,#f8fbfa_100%)] px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
      >
        <div className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-red-100/45 blur-3xl" />
        <div className="pointer-events-none absolute right-8 top-14 hidden h-px w-48 bg-gradient-to-r from-transparent via-red-200 to-transparent lg:block" />

        <div className="relative mx-auto mt-8 grid w-full max-w-7xl items-center gap-6 lg:mt-12 lg:grid-cols-[1fr_1fr] lg:gap-4">
          <Reveal className="relative w-full max-w-[520px] justify-self-start lg:-ml-10 lg:max-w-[580px]" direction="left">
            <div className="absolute -left-4 -top-4 hidden h-24 w-24 rounded-2xl border border-red-200/70 sm:block" />

            <div className="group relative overflow-hidden rounded-[1.5rem] bg-white p-2 shadow-2xl shadow-black/10 transition duration-500 hover:-translate-y-1 hover:shadow-black/15">
              <img
                src="/sbak.svg"
                alt="Ruang layanan administrasi"
                className="aspect-[16/10] w-full rounded-[1rem] object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-2 rounded-[1rem] bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>

          </Reveal>

          <Reveal className="relative" direction="right" delay={120}>
            <div className="max-w-2xl">
              <div className="mb-8 flex flex-nowrap items-center gap-x-4 sm:mb-9">
                <p className="shrink-0 whitespace-nowrap text-3xl font-black uppercase tracking-[0.08em] text-neutral-950 sm:text-4xl lg:text-5xl">
                  Tentang{" "}
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
                <p className="flex flex-1 items-center text-xl font-semibold leading-tight text-white sm:text-xl lg:text-[1.85rem] lg:leading-[1.16]">
                  Menjadi Unit Layanan Terpadu yang unggul dalam menyediakan
                  pelayanan publik yang profesional, transparan, dan akuntabel
                  di tingkat nasional pada tahun 2026.
                </p>
                <div className="mt-auto pt-8">
                  <div className="h-px w-full bg-gradient-to-r from-red-500/70 via-white/10 to-transparent" />
                  <div className="mt-4 flex items-center gap-2">
                    <span className="h-1.5 w-10 rounded-full bg-red-500/70" />
                    <span className="h-1.5 w-5 rounded-full bg-white/15" />
                    <span className="h-1.5 w-5 rounded-full bg-white/10" />
                  </div>
                </div>
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
        className="relative z-30 overflow-hidden bg-[radial-gradient(circle_at_10%_12%,rgba(251,191,36,0.18),transparent_14rem),radial-gradient(circle_at_92%_24%,rgba(0,0,0,0.06),transparent_16rem),radial-gradient(circle_at_88%_92%,rgba(251,191,36,0.16),transparent_18rem),linear-gradient(135deg,#fffaf1_0%,#fff7ea_45%,#f8efe3_100%)] px-4 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8"
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
          `}
        </style>
        <div className="pointer-events-none absolute left-0 top-0 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/40" />
        <div className="pointer-events-none absolute bottom-0 right-0 size-80 translate-x-1/3 translate-y-1/3 rounded-full border border-amber-300/40" />
        <div className="pointer-events-none absolute left-8 top-24 size-8 rounded-full bg-amber-200/60" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-neutral-50" />
        <div className="pointer-events-none absolute right-10 top-20 grid grid-cols-5 gap-1 opacity-30">
          {Array.from({ length: 25 }).map((_, index) => (
            <span key={index} className="size-1 rounded-full bg-amber-400" />
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl">
          <Reveal className="text-center">
            <h2 className="text-3xl font-black tracking-normal text-neutral-900 sm:text-4xl lg:text-5xl">
              Struktur Organisasi
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-neutral-500 sm:text-base">
              Sinergi kepemimpinan dan eksekusi layanan yang tertata.
            </p>
          </Reveal>

          <div className="relative mx-auto mt-10 max-w-6xl lg:mt-14">
            <div className="flex flex-col items-center">
              <div
                className={`relative z-10 text-center ${orgRevealClass}`}
                style={{ animationDelay: "120ms" }}
              >
                <OrgAvatar
                  name={organization.head.name}
                  photo={organization.head.photo}
                  color={organization.head.color}
                  size="lg"
                />
                <h3 className="mt-3 text-sm font-black text-neutral-900">
                  {organization.head.name}
                </h3>
                <span className="mt-1 inline-flex rounded-sm border border-emerald-500 bg-emerald-50 px-4 py-1 text-[10px] font-black uppercase tracking-normal text-emerald-700">
                  {organization.head.role}
                </span>
              </div>

              <div
                className={`hidden h-10 w-px md:block ${orgLineClass} ${orgLineAnimatedClass}`}
                style={{ animationDelay: "520ms" }}
              />
              <div
                className={`hidden h-px w-[72%] md:block ${orgLineClass} ${orgLineAnimatedClass}`}
                style={{ animationDelay: "820ms" }}
              />

              <div className="mt-12 grid w-full gap-16 md:mt-0 md:grid-cols-3 md:gap-8 lg:gap-14">
                {organization.coordinators.map((coordinator, coordinatorIndex) => {
                  const color = orgColorClass[coordinator.color];
                  const branchDelay = 1080 + coordinatorIndex * 180;

                  return (
                    <div
                      key={coordinator.role}
                      className="relative flex flex-col items-center"
                    >
                      <div
                        className={`hidden h-10 w-px md:block ${orgLineClass} ${orgLineAnimatedClass}`}
                        style={{ animationDelay: `${branchDelay}ms` }}
                      />

                      <div
                        className={`relative z-10 text-center ${orgRevealClass}`}
                        style={{ animationDelay: `${branchDelay + 180}ms` }}
                      >
                        <OrgAvatar
                          name={coordinator.name}
                          photo={coordinator.photo}
                          color={coordinator.color}
                          size="md"
                        />
                        <h3 className="mt-3 text-xs font-black text-neutral-900 sm:text-sm">
                          {coordinator.name}
                        </h3>
                        <span
                          className={`mt-1 inline-flex rounded-sm border px-3 py-1 text-[9px] font-black uppercase tracking-normal ${color.bg} ${color.text} ${color.border}`}
                        >
                          {coordinator.role}
                        </span>
                      </div>

                      <div
                        className={`mt-6 h-8 w-px ${orgLineClass} ${orgLineAnimatedClass}`}
                        style={{ animationDelay: `${branchDelay + 440}ms` }}
                      />
                      <div
                        className={`hidden h-px w-2/3 sm:block ${orgLineClass} ${orgLineAnimatedClass}`}
                        style={{ animationDelay: `${branchDelay + 600}ms` }}
                      />

                      <div className="grid w-full grid-cols-2 gap-6 pt-6">
                        {coordinator.staff.map((staff, staffIndex) => (
                          <div
                            key={staff.name}
                            className={`relative text-center ${orgRevealClass}`}
                            style={{
                              animationDelay: `${
                                branchDelay + 780 + staffIndex * 140
                              }ms`,
                            }}
                          >
                            <div
                              className={`absolute left-1/2 top-[-1.5rem] hidden h-6 w-px -translate-x-1/2 sm:block ${orgLineClass} ${orgLineAnimatedClass}`}
                              style={{
                                animationDelay: `${
                                  branchDelay + 680 + staffIndex * 120
                                }ms`,
                              }}
                            />
                            <OrgAvatar
                              name={staff.name}
                              photo={staff.photo}
                              color={coordinator.color}
                              size="sm"
                            />
                            <p className="mt-3 text-xs font-black text-neutral-900">
                              {staff.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-40 overflow-hidden bg-neutral-50 px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
        <div className="relative mx-auto min-h-[560px] max-w-7xl">
          <Reveal className="absolute inset-y-8 right-0 hidden w-[68%] overflow-hidden rounded-[2rem] border-4 border-white bg-neutral-200 shadow-2xl shadow-black/20 transition duration-500 hover:-translate-y-1 hover:shadow-black/25 lg:block">
            <img
              src="/denah-unpad.svg"
              alt="Denah lokasi FMIPA Unpad"
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20" />
          </Reveal>

          <div className="relative z-10 flex min-h-[560px] items-center">
            <Reveal
              className="w-full max-w-xl rounded-[2rem] bg-white/90 px-6 py-8 shadow-2xl shadow-black/15 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-black/20 sm:px-12 sm:py-10 lg:min-h-[500px]"
              delay={120}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                Location & Access
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-normal text-neutral-950 sm:text-4xl">
                Lokasi Kami
              </h2>
              <p className="mt-7 max-w-md text-sm leading-7 text-neutral-500">
                Lokasi ULT FMIPA berada di Lt. 1 Gedung Otto Sumarwoto Fakultas
                MIPA (Gedung Dekanat), Jl. Ir. Sukarno Km. 21, Jatinangor,
                Sumedang dan berada di pusat kawasan Universitas Padjadjaran
                Kampus Jatinangor.
              </p>

              <div className="mt-10 space-y-5">
                <div className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg shadow-black/5 sm:flex-row sm:items-center sm:justify-between sm:rounded-full">
                  <span className="text-xs font-black text-neutral-900">
                    Senin - Kamis
                  </span>
                  <span className="w-fit rounded-full bg-red-50 px-4 py-2 text-[10px] font-black text-red-600">
                    08.00-15.00 WIB
                  </span>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg shadow-black/5 sm:flex-row sm:items-center sm:justify-between sm:rounded-full">
                  <span className="text-xs font-black text-neutral-900">
                    Jumat (Daring)
                  </span>
                  <span className="w-fit rounded-full bg-red-50 px-4 py-2 text-[10px] font-black text-red-600">
                    08.00-16.00 WIB
                  </span>
                </div>
              </div>

              <div className="mt-10 overflow-hidden rounded-3xl border-4 border-white bg-neutral-200 shadow-xl shadow-black/10 lg:hidden">
                <img
                  src="/denah-unpad.svg"
                  alt="Denah lokasi FMIPA Unpad"
                  className="aspect-[4/3] w-full object-cover grayscale"
                />
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=FMIPA%20Unpad%20Jatinangor"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-7 py-4 text-xs font-black text-white shadow-lg shadow-red-600/25 transition duration-300 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/35 sm:w-auto"
                >
                  <MapPin className="size-4" />
                  Petunjuk Arah
                </a>

                <a
                  href="mailto:ult.fmipa@unpad.ac.id"
                  className="inline-flex items-center gap-2 text-xs font-black text-neutral-950 transition hover:text-red-600"
                >
                  ult.fmipa@unpad.ac.id
                  <Mail className="size-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      
    </>
  );
}
