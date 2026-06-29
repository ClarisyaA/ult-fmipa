"use client";

import { useRef } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  ClipboardCheck, 
  Clock, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Briefcase,
  Users,
  UserCheck,
  LayoutGrid,
  Newspaper,
  ClipboardList,
  CalendarDays,
  Star
} from "lucide-react";

import { Reveal } from "@/components/sections/reveal";

const highlights = [
  {
    title: "Layanan terpusat",
    description: "Satu pintu untuk kebutuhan administrasi akademik FMIPA.",
    icon: ClipboardCheck,
  },
  {
    title: "Status lebih jelas",
    description: "Fondasi alur layanan disiapkan agar proses mudah dipantau.",
    icon: Clock,
  },
  {
    title: "Informasi praktis",
    description: "Daftar layanan, persyaratan, dan estimasi waktu tersedia.",
    icon: FileText,
  },
];

const lensItems = [
  {
    id: 1,
    tag: "Research",
    title: "Kolaborasi Riset Interdisipliner Mahasiswa",
    description: "Mendorong inovasi melalui penggabungan berbagai disiplin ilmu sains.",
    image: "/sbak.svg"
  },
  {
    id: 2,
    tag: "Academic",
    title: "Simposium Internasional Sains Terapan",
    description: "Membahas tren global masa depan dalam komputasi dan pemodelan material.",
    image: "/sbak.svg"
  },
  {
    id: 3,
    tag: "Student Life",
    title: "Apresiasi Prestasi & Kreativitas Mahasiswa",
    description: "Merayakan pencapaian gemilang delegasi FMIPA di ajang nasional.",
    image: "/sbak.svg"
  },
  {
    id: 4,
    tag: "Innovation",
    title: "Pengembangan Aplikasi Layanan Berbasis AI",
    description: "Transformasi digital sistem antrean ULT demi efisiensi optimal.",
    image: "/sbak.svg"
  },
  {
    id: 5,
    tag: "Community",
    title: "Sains Masuk Desa & Bakti Sosial Keilmuan",
    description: "Edukasi pemanfaatan teknologi tepat guna bagi masyarakat lingkar kampus.",
    image: "/sbak.svg"
  }
];

const academicServices = [
  {
    title: "Layanan Mahasiswa",
    description: "Akses legalisir KKS/KPA, surat keterangan aktif kuliah, surat izin penelitian, hingga prosedur pengajuan cuti akademik.",
    icon: GraduationCap,
    href: "/layanan",
  },
  {
    title: "Layanan Alumni",
    description: "Pengajuan legalisir dokumen ijazah dan transkrip nilai, serta verifikasi keabsahan data kelulusan untuk dunia profesional.",
    icon: UserCheck,
    href: "/layanan",
  },
  {
    title: "Layanan Dosen & Tendik",
    description: "Fasilitasi persuratan internal, pengantar tugas belajar, administrasi angka kredit, hingga pendukung operasional kerja.",
    icon: Briefcase,
    href: "/layanan",
  },
];

export default function HomePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <main data-testid="home-page" className="bg-[#fcf8f7] min-h-screen text-neutral-950 selection:bg-red-500 selection:text-white overflow-hidden flex flex-col">
      
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
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(12px) rotate(-2deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(1.1); }
          }
          @keyframes pulse-glow-strong {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(1.15); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh+20px)] items-center overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          <img
            src="/sbak.svg"
            alt="Ruang layanan administrasi"
            className="h-full w-full object-cover [animation:hero-image-reveal_1200ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
        </div>
        
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-red-600/10 to-amber-500/5 blur-3xl [animation:pulse-glow_8s_ease-in-out_infinite]" />
          <div className="absolute -left-40 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-500/5 to-red-500/8 blur-3xl [animation:pulse-glow_10s_ease-in-out_infinite_2s]" />
          
          <div className="absolute left-[8%] top-[15%] [animation:float-slow_12s_ease-in-out_infinite]">
            <div className="h-24 w-24 rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-sm rotate-12" />
          </div>
          <div className="absolute right-[12%] bottom-[30%] [animation:float-medium_14s_ease-in-out_infinite_1s]">
            <div className="h-16 w-16 rounded-full border-2 border-white/10 bg-white/5 backdrop-blur-sm" />
          </div>
          <div className="absolute left-[5%] bottom-[20%] [animation:float-slow_16s_ease-in-out_infinite_2s]">
            <div className="flex gap-3">
              <div className="h-3 w-3 rounded-full bg-white/20" />
              <div className="h-3 w-3 rounded-full bg-white/20" />
              <div className="h-3 w-3 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="absolute right-[8%] top-[30%] [animation:float-medium_10s_ease-in-out_infinite_0.5s]">
            <div className="h-20 w-20 rotate-45 border-2 border-white/10 bg-white/5 backdrop-blur-sm" />
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            <Reveal delay={160}>
              <div className="flex flex-col">
                <h1 className="max-w-5xl text-4xl font-black leading-[0.95] tracking-normal text-white min-[380px]:text-5xl sm:text-5xl lg:text-6xl xl:text-7xl">
                  Unit Layanan Terpadu (ULT) <br />
                  <span className="bg-gradient-to-r from-[#ff2d28] via-[#ff7f87] to-white bg-clip-text text-transparent">
                    FMIPA Unpad
                  </span>
                </h1>
                
                <p className="mt-7 max-w-2xl text-sm leading-7 text-white/70 sm:mt-8 sm:text-base sm:leading-8">
                  Portal ini menjadi fondasi frontend untuk informasi layanan, pengajuan, survei, dan dashboard operasional ULT FMIPA Unpad.
                </p>
                
                <div className="mt-11 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link
                    href="/profil"
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#ff2d28] px-8 py-4 text-sm font-black text-white shadow-2xl shadow-red-600/30 transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff1f1a] hover:shadow-red-600/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
                  >
                    <span>Lihat Profil</span>
                    <ArrowRight className="size-4 transition duration-300 group-hover:translate-x-1" />
                  </Link>
                  
                  <Link
                    href="/survei"
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-black/35 px-8 py-4 text-sm font-black text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/55 hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:w-auto"
                  >
                    Isi Survei
                  </Link>
                </div>
              </div>
            </Reveal>

            <div className="relative flex flex-col gap-4 lg:pl-4">
              {highlights.map((item, idx) => (
                <Reveal key={item.title} delay={320 + (idx * 100)}>
                  <div className="group relative overflow-hidden rounded-[1.5rem] border border-white bg-white/90 p-6 shadow-2xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:bg-white hover:shadow-black/15">
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-multiply">
                      <img
                        src="/sbak.svg"
                        alt="Ruang layanan administrasi"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="relative z-10 flex items-start gap-5">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors duration-300 group-hover:bg-[#ff2d28] group-hover:text-white">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-neutral-950">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Lensa FMIPA Section */}
      <section className="relative overflow-hidden bg-white py-24 border-b border-neutral-200/50 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-100/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-red-50/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-neutral-100/70 blur-3xl" />
        
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[5%] top-[10%] [animation:float-slow_15s_ease-in-out_infinite]">
            <div className="h-32 w-32 rounded-full border-2 border-red-200/20 bg-red-50/10 backdrop-blur-sm" />
          </div>
          <div className="absolute left-[3%] bottom-[15%] [animation:float-medium_13s_ease-in-out_infinite_1s]">
            <div className="h-24 w-24 rotate-12 rounded-2xl border-2 border-amber-200/20 bg-amber-50/10 backdrop-blur-sm" />
          </div>
          <div className="absolute left-[45%] top-[5%] [animation:float-slow_18s_ease-in-out_infinite_0.5s]">
            <div className="h-16 w-16 rotate-45 border-2 border-red-200/15 bg-red-50/5 backdrop-blur-sm" />
          </div>
        </div>

        <div className="pointer-events-none absolute left-[10%] top-[20%] h-[2px] w-48 bg-gradient-to-r from-transparent via-red-200/30 to-transparent" />
        <div className="pointer-events-none absolute right-[8%] bottom-[25%] h-[2px] w-64 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <Reveal direction="left">
              <div>
                <div className="flex flex-nowrap items-center gap-x-3 mb-4">
                  <p className="shrink-0 whitespace-nowrap text-3xl font-black uppercase tracking-[0.08em] text-neutral-950 sm:text-4xl">
                    Lensa{" "}
                  </p>
                  <span className="shrink-0 whitespace-nowrap text-3xl font-black uppercase tracking-[0.08em] text-red-600 sm:text-4xl">
                    FMIPA
                  </span>
                </div>
                <h2 className="text-xl font-black leading-tight tracking-normal text-neutral-950 max-w-2xl">
                  Jelajahi momen <span className="text-red-600">inspiratif</span> aktivitas akademik dan kemahasiswaan.
                </h2>
              </div>
            </Reveal>

            <Reveal direction="right" delay={120}>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scroll("left")}
                  className="flex size-11 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-lg shadow-black/5 transition hover:bg-neutral-50 hover:border-neutral-300 active:scale-95"
                >
                  <ChevronLeft className="size-5 text-neutral-700" />
                </button>
                <button 
                  onClick={() => scroll("right")}
                  className="flex size-11 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg shadow-black/10 transition hover:bg-neutral-800 active:scale-95"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </Reveal>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {lensItems.map((item) => (
              <div 
                key={item.id} 
                className="w-[300px] sm:w-[340px] shrink-0 group flex flex-col rounded-[1.5rem] overflow-hidden bg-white border border-neutral-100 p-2 shadow-2xl shadow-black/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-black/10 hover:border-neutral-200"
              >
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[1rem] bg-neutral-100">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="inline-block rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                      {item.tag}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-black leading-snug text-neutral-950 group-hover:text-red-600 transition-colors duration-300 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-neutral-500 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kategori Layanan ULT FMIPA Section */}
      <section className="relative z-10 overflow-hidden bg-[radial-gradient(circle_at_20%_30%,rgba(220,38,38,0.12)_0%,rgba(255,255,255,0.95)_45%,rgba(248,250,250,0.98)_80%,rgba(220,38,38,0.06)_100%)] px-4 py-14 sm:py-20 lg:px-8 border-b border-neutral-200/50">
        
        <div className="pointer-events-none absolute -left-24 -top-24 size-[500px] rounded-full bg-red-500/15 blur-3xl [animation:pulse-glow-strong_7s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 size-[600px] rounded-full bg-amber-400/12 blur-3xl [animation:pulse-glow-strong_9s_ease-in-out_infinite_1.5s]" />
        <div className="pointer-events-none absolute left-[50%] top-[10%] size-[400px] -translate-x-1/2 rounded-full bg-amber-400/8 blur-3xl [animation:pulse-glow_11s_ease-in-out_infinite_0.8s]" />
        
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[3%] top-[10%] [animation:float-slow_14s_ease-in-out_infinite]">
            <div className="h-48 w-48 rounded-full border-2 border-red-300/20 bg-red-400/8 backdrop-blur-sm" />
          </div>
          <div className="absolute right-[2%] bottom-[15%] [animation:float-medium_16s_ease-in-out_infinite_1s]">
            <div className="h-36 w-36 rotate-12 rounded-2xl border-2 border-amber-300/20 bg-amber-400/8 backdrop-blur-sm" />
          </div>
          <div className="absolute left-[40%] top-[2%] [animation:float-medium_12s_ease-in-out_infinite_0.5s]">
            <div className="h-24 w-24 rotate-45 border-2 border-amber-300/15 bg-amber-400/6 backdrop-blur-sm" />
          </div>
          <div className="absolute right-[15%] top-[40%] [animation:float-slow_18s_ease-in-out_infinite_2s]">
            <div className="h-20 w-20 rounded-full border-2 border-red-300/15 bg-red-400/6 backdrop-blur-sm" />
          </div>
        </div>

        <div className="pointer-events-none absolute left-[15%] top-[20%] h-[3px] w-40 bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
        <div className="pointer-events-none absolute right-[20%] bottom-[30%] h-[3px] w-48 bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
        <div className="pointer-events-none absolute left-[45%] top-[15%] h-[2px] w-32 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_50%,transparent_100%)]" />

        <div className="pointer-events-none absolute top-8 left-8 h-16 w-16 border-l-2 border-t-2 border-red-400/20 rounded-tl-2xl" />
        <div className="pointer-events-none absolute bottom-8 right-8 h-16 w-16 border-r-2 border-b-2 border-amber-400/20 rounded-br-2xl" />

        <div className="relative mx-auto w-full max-w-7xl">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="mb-6 flex justify-center items-center gap-x-3">
                <p className="text-3xl font-black uppercase tracking-[0.08em] text-neutral-950 sm:text-4xl">
                  Katalog{" "}
                </p>
                <span className="text-3xl font-black uppercase tracking-[0.08em] text-red-600 sm:text-4xl">
                  Layanan
                </span>
              </div>
              <h2 className="text-xl font-black leading-tight tracking-normal text-neutral-950">
                Pusat layanan digital satu pintu yang lebih <span className="text-red-600">jelas</span> dan terarah.
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-500">
                Mempermudah pemenuhan segala kebutuhan administrasi operasional sivitas akademika, jajaran alumni, hingga mitra eksternal FMIPA Universitas Padjadjaran.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {academicServices.map((service, idx) => (
              <Reveal key={service.title} delay={120 * (idx + 1)} direction="up">
                <Link href={service.href} className="group block relative rounded-2xl border border-neutral-200/70 bg-white/95 backdrop-blur-sm p-8 shadow-xl shadow-black/[0.02] transition-all duration-300 hover:-translate-y-1.5 hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-600/[0.08] flex flex-col h-full">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-red-200/0 to-transparent group-hover:via-red-400/70 transition-all duration-500" />
                  
                  <div className="size-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 shadow-inner relative z-10">
                    <service.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-black text-neutral-950 group-hover:text-red-600 transition-colors relative z-10">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-500 flex-1 relative z-10">
                    {service.description}
                  </p>
                  <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-600 group-hover:text-red-700 transition-colors relative z-10">
                    <span>Lihat Layanan</span>
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={480}>
            <div className="mt-16 flex justify-center">
              <Link
                href="/layanan"
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 backdrop-blur-sm px-6 py-3.5 text-xs font-black uppercase tracking-wider text-neutral-800 shadow-md shadow-black/5 transition hover:bg-neutral-50 hover:border-red-300/30 hover:shadow-red-600/10 active:scale-95"
              >
                <LayoutGrid className="size-4 text-red-600" />
                Lihat Semua Layanan
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Informasi & Survei Section */}
      <section className="relative z-10 overflow-hidden bg-white px-4 py-16 sm:py-20 lg:px-8 border-b border-neutral-200/50">

        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-red-50/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-amber-50/20 blur-3xl" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[20%] [animation:float-slow_14s_ease-in-out_infinite]">
            <div className="h-32 w-32 rounded-full border border-red-100/20 bg-red-50/5" />
          </div>
          <div className="absolute right-[10%] bottom-[20%] [animation:float-medium_16s_ease-in-out_infinite_1s]">
            <div className="h-24 w-24 rotate-12 rounded-2xl border border-amber-100/20 bg-amber-50/5" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="mb-4 flex justify-center items-center gap-x-3">
                <p className="text-2xl font-black uppercase tracking-[0.08em] text-neutral-950 sm:text-3xl">
                  Informasi &{" "}
                </p>
                <span className="text-2xl font-black uppercase tracking-[0.08em] text-red-600 sm:text-3xl">
                  Survei
                </span>
              </div>
              <h2 className="text-xl font-black leading-tight tracking-normal text-neutral-950">
                Tetap terinformasi dan berikan <span className="text-red-600">suaramu</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-500">
                Dapatkan informasi terbaru seputar layanan dan sampaikan kepuasanmu melalui survei.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-2">
            <Reveal direction="left" delay={120}>
              <div className="group relative rounded-2xl bg-gradient-to-br from-red-50 via-red-100/30 to-white p-8 border border-red-200/40 shadow-xl shadow-red-500/[0.06] transition-all duration-300 hover:-translate-y-2 hover:border-red-400/60 hover:shadow-2xl hover:shadow-red-500/[0.12] flex flex-col h-full">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-100/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-red-400/40 to-transparent group-hover:via-red-500/80 transition-all duration-500" />
                <div className="absolute -right-16 -top-16 size-40 rounded-full bg-red-400/10 blur-2xl group-hover:bg-red-400/20 transition-all duration-500" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
                      <Newspaper className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-neutral-950">
                        Pusat Informasi
                      </h3>
                      <p className="text-xs font-medium text-red-600/70">Update terbaru layanan</p>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-neutral-600">
                    Dapatkan pengumuman resmi, informasi terbaru, dan berita seputar layanan ULT FMIPA Unpad. Selalu update dengan perkembangan terbaru.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <CalendarDays className="size-3.5 text-red-500" />
                      <span>Terupdate secara berkala</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-neutral-300" />
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Star className="size-3.5 text-amber-400" />
                      <span>Informasi resmi</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-red-200/30">
                    <Link
                      href="/informasi"
                      className="group/link inline-flex items-center gap-2 text-sm font-black text-red-600 hover:text-red-700 transition-colors"
                    >
                      <span>Lihat Semua Informasi</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={200}>
              <div className="group relative rounded-2xl bg-gradient-to-br from-amber-50 via-amber-100/30 to-white p-8 border border-amber-200/40 shadow-xl shadow-amber-500/[0.05] transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/[0.10] flex flex-col h-full">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-100/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent group-hover:via-amber-500/80 transition-all duration-500" />
                <div className="absolute -left-16 -bottom-16 size-40 rounded-full bg-amber-400/10 blur-2xl group-hover:bg-amber-400/20 transition-all duration-500" />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                      <ClipboardList className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-neutral-950">
                        Survei Kepuasan
                      </h3>
                      <p className="text-xs font-medium text-amber-600/70">Berikan penilaianmu</p>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-neutral-600">
                    Sampaikan pengalamanmu menggunakan layanan ULT FMIPA. Pendapatmu sangat berharga untuk meningkatkan kualitas pelayanan kami.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="inline-block size-2 rounded-full bg-amber-400" />
                      <span>Anonim & terpercaya</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-neutral-300" />
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="inline-block size-2 rounded-full bg-amber-400" />
                      <span>Hanya 5 menit</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-amber-200/30">
                    <Link
                      href="/survei"
                      className="group/link inline-flex items-center gap-2 text-sm font-black text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <span>Isi Survei Sekarang</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

    </main>
  );
}