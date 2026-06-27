"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Dimensi SVG yang sudah diketahui ────────────────────────────────────────
// idle/outline: 337×506  (portrait, aspect ~0.666)
// left/right  : 337×506  declared, tapi viewBox="0 0 1500 1500" (square)
//               → karakter hanya mengisi sebagian kecil, perlu scale-up ~2.5x

const desks = [
  {
    href: "/informasi",
    label: "Layanan Informasi",
    ariaLabel: "Buka layanan informasi",
    image: "/beranda/LayananInformasi.svg",
    hoverImage: "/beranda/LayananInformasi_outline.svg",
    className:
      "left-[-5.5%] bottom-[1.8%] w-[46%] sm:left-[0%] sm:w-[42%] lg:left-[0%] lg:w-[40%]",
  },
  {
    href: "/layanan",
    label: "Layanan Mahasiswa & Alumni",
    ariaLabel: "Buka layanan mahasiswa dan alumni",
    image: "/beranda/LayananTerpadu.svg",
    hoverImage: "/beranda/LayananTerpadu_outline.svg",
    className:
      "right-[0%] bottom-[1.8%] w-[46%] sm:right-[0%] sm:w-[42%] lg:right-[0%] lg:w-[40%]",
  },
];

type StaffDirection = "idle" | "left" | "right";
type ActiveStaff = "staff1" | "staff2";
type StaffPose = "normal" | "outline" | "left" | "right";

const staffImageMap = {
  staff1: {
    normal: "/beranda/staff1.svg",
    outline: "/beranda/staff1_outline.svg",
    left: "/beranda/staff1_left.svg",
    right: "/beranda/staff1_right.svg",
  },
  staff2: {
    normal: "/beranda/staff2.svg",
    outline: "/beranda/staff2_outline.svg",
    left: "/beranda/staff2_left.svg",
    right: "/beranda/staff2_right.svg",
  },
} satisfies Record<ActiveStaff, Record<StaffPose, string>>;

const preloadImages = [
  ...Object.values(staffImageMap.staff1),
  ...Object.values(staffImageMap.staff2),
  "/beranda/LayananInformasi.svg",
  "/beranda/LayananInformasi_outline.svg",
  "/beranda/LayananTerpadu.svg",
  "/beranda/LayananTerpadu_outline.svg",
];

// Faktor skala untuk pose left/right:
// viewBox 1500×1500 tapi karakter hanya ~40% dari tinggi → perlu scale ≈ 2.5
// (dituning dari perbandingan visual)
function getPose(staff: ActiveStaff, active: ActiveStaff, dir: StaffDirection): StaffPose {
  if (staff !== active) return "normal";
  return dir === "idle" ? "outline" : dir;
}

function useReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const upd = () => setRm(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  return rm;
}

export function HomeHero() {
  const [hoveredDesk, setHoveredDesk] = useState<string | null>(null);
  const [activeStaff, setActiveStaff] = useState<ActiveStaff>("staff1");
  const [mouseDirection, setMouseDir] = useState<StaffDirection>("idle");

  const scrollRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const staff1Wrap = useRef<HTMLDivElement | null>(null);
  const staff2Wrap = useRef<HTMLDivElement | null>(null);

  const prevXRef = useRef<number | null>(null);
  const activeRef = useRef<ActiveStaff>("staff1");
  const dirRef = useRef<StaffDirection>("idle");
  const idleTimer = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => { activeRef.current = activeStaff; }, [activeStaff]);
  useEffect(() => { dirRef.current = mouseDirection; }, [mouseDirection]);

  useEffect(() => {
    if (reducedMotion) return;
    const hero = heroRef.current;
    if (!hero) return;

    const MX = 75; // px max horizontal
    const MY = 24; // px max vertical

    /** Helper: set CSS custom properties pada wrapper (React tidak menyentuhnya) */
    const setPos = (el: HTMLDivElement | null, tx: number, ty: number, sc: number) => {
      if (!el) return;
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
      el.style.setProperty("--sc", `${sc}`);
    };

    const onMove = (e: MouseEvent) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const b = hero.getBoundingClientRect();
        const nx = ((e.clientX - b.left) / b.width - 0.5) * 2; // -1..+1
        const ny = ((e.clientY - b.top) / b.height - 0.5) * 2;
        const onLeft = nx < 0;

        // ── Aktifkan staff yang sesuai sisi kursor
        const next: ActiveStaff = onLeft ? "staff1" : "staff2";
        if (activeRef.current !== next) {
          activeRef.current = next;
          setActiveStaff(next);
        }

        // ── Deteksi arah gerakan horizontal (untuk pose SVG)
        if (prevXRef.current !== null) {
          const dx = e.clientX - prevXRef.current;
          if (dx < -4 && dirRef.current !== "left") { dirRef.current = "left"; setMouseDir("left"); }
          else if (dx > 4 && dirRef.current !== "right") { dirRef.current = "right"; setMouseDir("right"); }
        }
        prevXRef.current = e.clientX;

        // ── Update posisi via CSS custom props (INSTAN, tanpa React render cycle)
        const ty = ny * MY - 8;
        if (onLeft) {
          setPos(staff1Wrap.current, nx * MX, ty, 1.05); // aktif: bergerak
          setPos(staff2Wrap.current, 0,       0,  0.97); // diam total (tidak bergerak vertikal / horizontal)
        } else {
          setPos(staff1Wrap.current, 0,       0,  0.97); // diam total (tidak bergerak vertikal / horizontal)
          setPos(staff2Wrap.current, nx * MX, ty, 1.05); // aktif: bergerak
        }

        // ── Reset pose setelah kursor berhenti
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = window.setTimeout(() => {
          prevXRef.current = null;
          if (dirRef.current !== "idle") { dirRef.current = "idle"; setMouseDir("idle"); }
        }, 500);
      });
    };

    const onLeave = () => {
      setPos(staff1Wrap.current, 0, 0, 1);
      setPos(staff2Wrap.current, 0, 0, 1);
      if (dirRef.current !== "idle") { dirRef.current = "idle"; setMouseDir("idle"); }
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const scroller = scrollRef.current;
    const stage = heroRef.current;
    if (!scroller || !stage) return;

    const media = window.matchMedia("(max-width: 639px)");
    let lastScrollLeft = scroller.scrollLeft;
    let timer: number | null = null;
    let raf: number | null = null;

    const setPos = (el: HTMLDivElement | null, tx: number, ty: number, sc: number) => {
      if (!el) return;
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
      el.style.setProperty("--sc", `${sc}`);
    };

    const updateFromScroll = () => {
      if (!media.matches) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const maxScroll = Math.max(stage.scrollWidth - scroller.clientWidth, 1);
        const progress = scroller.scrollLeft / maxScroll;
        const dx = scroller.scrollLeft - lastScrollLeft;
        const next: ActiveStaff = progress < 0.5 ? "staff1" : "staff2";
        const dir: StaffDirection = dx < -1 ? "left" : dx > 1 ? "right" : dirRef.current;
        const nx = (progress - 0.5) * 2;
        const tx = nx * 70;

        if (activeRef.current !== next) {
          activeRef.current = next;
          setActiveStaff(next);
        }
        if (dir !== dirRef.current) {
          dirRef.current = dir;
          setMouseDir(dir);
        }

        if (next === "staff1") {
          setPos(staff1Wrap.current, tx, -8, 1.05);
          setPos(staff2Wrap.current, 0, 0, 0.97);
        } else {
          setPos(staff1Wrap.current, 0, 0, 0.97);
          setPos(staff2Wrap.current, tx, -8, 1.05);
        }

        lastScrollLeft = scroller.scrollLeft;
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (dirRef.current !== "idle") {
            dirRef.current = "idle";
            setMouseDir("idle");
          }
        }, 450);
      });
    };

    updateFromScroll();
    scroller.addEventListener("scroll", updateFromScroll, { passive: true });
    media.addEventListener("change", updateFromScroll);

    return () => {
      scroller.removeEventListener("scroll", updateFromScroll);
      media.removeEventListener("change", updateFromScroll);
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [reducedMotion]);

  const renderedActive = reducedMotion ? "staff1" : activeStaff;
  const renderedDir = reducedMotion ? "idle" : mouseDirection;
  const isS1Active = renderedActive === "staff1";
  const isS2Active = renderedActive === "staff2";

  const pose1 = getPose("staff1", renderedActive, renderedDir);
  const pose2 = getPose("staff2", renderedActive, renderedDir);
  const src1 = staffImageMap.staff1[pose1];
  const src2 = staffImageMap.staff2[pose2];

  const isS1Square = pose1 === "left" || pose1 === "right";
  const isS2Square = pose2 === "left" || pose2 === "right";

  // Ukuran container staff — fixed untuk kedua staff agar konsisten
  const W = "clamp(200px, 18vw, 330px)";

  // Template transform yang pakai CSS custom props (React sets string, kita update vars)
  return (
    <section
      ref={scrollRef}
      className="animate-hero-fade-up relative overflow-x-auto overflow-y-hidden border-b border-[#eadfd1] bg-[#fff6e7] max-sm:touch-pan-x max-sm:overscroll-x-contain sm:overflow-hidden"
    >
      <div
        ref={heroRef}
        className="relative min-h-[74vh] w-full overflow-hidden pt-24 max-sm:min-h-[720px] max-sm:w-[920px] sm:min-h-[82vh] sm:pt-28 lg:min-h-screen lg:pt-32"
      >
      {/* Background */}
      <Image
        src="/beranda/Background.svg"
        alt="" fill priority sizes="100vw"
        className="pointer-events-none object-cover object-center"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,242,0.15)_0%,rgba(255,250,242,0.06)_46%,rgba(255,250,242,0.01)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#fffaf2]/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fffaf2]/70 to-transparent" />

      {/* Preload */}
      <div className="pointer-events-none hidden" aria-hidden="true">
        {preloadImages.map((s) => <Image key={s} src={s} alt="" width={1} height={1} />)}
      </div>

      {/* ── Staff layer ── */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">

        {/* Staff 1 — kiri */}
        <div
          ref={staff1Wrap}
          style={{
            position: "absolute",
            bottom: "18%",
            left: isS1Square ? `calc(15% - (${W} * 0.2507))` : "15%",
            width: isS1Square ? `calc(${W} * 506 / 337)` : W,
            aspectRatio: isS1Square ? "1 / 1" : "337 / 506",
            // Use independent properties for lag-free cursor tracking
            translate: "var(--tx, 0px) var(--ty, 0px)",
            scale: "var(--sc, 1)",
            transformOrigin: "bottom center",
            willChange: "translate, scale",
            opacity: isS1Active ? 1 : 0.8,
            filter: isS1Active ? "brightness(1.05)" : "brightness(1)",
            // Only transition scale, opacity and filter so translation is instant (0ms delay)
            transition: "scale 0.2s ease-out, opacity 0.2s ease-out, filter 0.2s ease-out",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src1}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
            onError={(e) => { e.currentTarget.src = staffImageMap.staff1.normal; }}
          />
        </div>

        {/* Staff 2 — kanan */}
        <div
          ref={staff2Wrap}
          style={{
            position: "absolute",
            bottom: "18%",
            right: isS2Square ? `calc(16% - (${W} * 0.2478))` : "16%",
            width: isS2Square ? `calc(${W} * 504 / 337)` : W,
            aspectRatio: isS2Square ? "1 / 1" : "337 / 504",
            translate: "var(--tx, 0px) var(--ty, 0px)",
            scale: "var(--sc, 1)",
            transformOrigin: "bottom center",
            willChange: "translate, scale",
            opacity: isS2Active ? 1 : 0.8,
            filter: isS2Active ? "brightness(1.05)" : "brightness(1)",
            transition: "scale 0.2s ease-out, opacity 0.2s ease-out, filter 0.2s ease-out",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src2}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom center",
            }}
            onError={(e) => { e.currentTarget.src = staffImageMap.staff2.normal; }}
          />
        </div>
      </div>

      {/* Invisible hover zones untuk keyboard/focus */}
      <button
        type="button"
        className="absolute bottom-[20%] left-[4%] z-30 h-[30%] w-[22%] cursor-pointer bg-transparent"
        aria-label="Aktifkan staff layanan informasi"
        onMouseEnter={() => !reducedMotion && setActiveStaff("staff1")}
        onFocus={() => !reducedMotion && setActiveStaff("staff1")}
      />
      <button
        type="button"
        className="absolute bottom-[20%] right-[6%] z-30 h-[30%] w-[24%] cursor-pointer bg-transparent"
        aria-label="Aktifkan staff layanan terpadu"
        onMouseEnter={() => !reducedMotion && setActiveStaff("staff2")}
        onFocus={() => !reducedMotion && setActiveStaff("staff2")}
      />

      {/* ── Desk SVG links ── */}
      {desks.map((desk) => {
        const isHovered = hoveredDesk === desk.href;
        return (
          <Link
            key={desk.href}
            href={desk.href}
            aria-label={desk.ariaLabel}
            className={`group absolute z-30 block ${desk.className}`}
            onMouseEnter={() => setHoveredDesk(desk.href)}
            onMouseLeave={() => setHoveredDesk(null)}
            onFocus={() => setHoveredDesk(desk.href)}
            onBlur={() => setHoveredDesk(null)}
          >
            <span className="absolute -top-9 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-red-100 bg-white/95 px-3 py-1 text-xs font-bold text-red-700 opacity-100 shadow-lg shadow-red-950/10 transition-all duration-200 md:opacity-0 md:group-hover:-top-11 md:group-hover:opacity-100 md:group-focus-visible:-top-11 md:group-focus-visible:opacity-100">
              {desk.label}
            </span>
            <Image
              src={isHovered ? desk.hoverImage : desk.image}
              alt=""
              width={620}
              height={420}
              sizes="(max-width: 640px) 54vw, (max-width: 1024px) 48vw, 46vw"
              className="h-auto w-full drop-shadow-2xl transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.02] group-focus-visible:-translate-y-1 group-focus-visible:scale-[1.02]"
              priority
              aria-hidden="true"
            />
          </Link>
        );
      })}
      </div>
    </section>
  );
}
