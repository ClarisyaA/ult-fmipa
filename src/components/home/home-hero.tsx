"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Fixed stage dimensions (desktop baseline) ──────────────────────────────
const BASE_SCENE_WIDTH = 1440;
const BASE_SCENE_HEIGHT = 810;
const DESKTOP_BREAKPOINT = 1024;

// ─── Staff constants (frozen from lg: desktop values) ────────────────────────
const STAFF_BOX = {
  width: 258,
  height: 388,
};
const STAFF_BOTTOM = 166;
const STAFF1_LEFT = 207;
const STAFF2_RIGHT = 225;

// ─── Per-pose visual compensation (applied to inner image only) ──────────────
// left/right SVGs use viewBox="0 0 1500 1500" (square) while normal/outline use
// 337×506 (portrait). The wrapper stays fixed — only the image transform adjusts.
const staffPoseTransform: Record<string, Record<string, string>> = {
  staff1: {
    normal: "translate(0px, 0px) scale(1)",
    outline: "translate(0px, 0px) scale(1)",
    left: "translate(0px, 0px) scale(1.5)",
    right: "translate(0px, 0px) scale(1.5)",
  },
  staff2: {
    normal: "translate(0px, 0px) scale(1)",
    outline: "translate(0px, 0px) scale(1)",
    left: "translate(0px, 0px) scale(1.5)",
    right: "translate(0px, 0px) scale(1.5)",
  },
};

// ─── Desk data (frozen from lg: desktop values, tuned for background alignment)
const desks = [
  {
    href: "/informasi",
    label: "Layanan Informasi",
    ariaLabel: "Buka layanan informasi",
    image: "/beranda/LayananInformasi.svg",
    hoverImage: "/beranda/LayananInformasi_outline.svg",
    style: {
      left: -1,
      bottom: 47,
      width: 560,
    } as React.CSSProperties,
    labelClassName:
      "-top-9 left-1/2 right-auto top-auto -translate-x-1/2 translate-y-0",
    mobileLabelClassName:
      "left-[84%] top-[42%] max-w-[170px] -translate-y-1/2 translate-x-0",
  },
  {
    href: "/layanan",
    label: "Layanan Mahasiswa & Alumni",
    ariaLabel: "Buka layanan mahasiswa dan alumni",
    image: "/beranda/LayananTerpadu.svg",
    hoverImage: "/beranda/LayananTerpadu_outline.svg",
    style: {
      right: 8,
      bottom: 47,
      width: 560,
    } as React.CSSProperties,
    labelClassName:
      "-top-9 left-1/2 top-auto -translate-x-1/2 translate-y-0",
    mobileLabelClassName:
      "right-[84%] top-[42%] max-w-[190px] -translate-y-1/2 translate-x-0",
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

function getDesktopSceneSize() {
  if (typeof window === "undefined") {
    return { width: BASE_SCENE_WIDTH, height: BASE_SCENE_HEIGHT };
  }

  const viewportWidth = Math.round(window.innerWidth);
  const width =
    viewportWidth >= DESKTOP_BREAKPOINT
      ? viewportWidth
      : BASE_SCENE_WIDTH;

  return {
    width,
    height: Math.round(width * (BASE_SCENE_HEIGHT / BASE_SCENE_WIDTH)),
  };
}

function useDesktopSceneSize() {
  const [sceneSize, setSceneSize] = useState({
    width: BASE_SCENE_WIDTH,
    height: BASE_SCENE_HEIGHT,
  });

  useEffect(() => {
    const update = () => setSceneSize(getDesktopSceneSize());
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return sceneSize;
}

function useIsDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return isDesktop;
}

function scaleSceneStyle(style: React.CSSProperties, scale: number) {
  const next = { ...style };
  (["left", "right", "bottom", "width"] as const).forEach((key) => {
    const value = next[key];
    if (typeof value === "number") {
      next[key] = Math.round(value * scale);
    }
  });
  return next;
}

function StaffSprite({
  staff,
  pose,
}: {
  staff: ActiveStaff;
  pose: StaffPose;
}) {
  return (
    <div className="relative h-full w-full">
      {(["normal", "outline", "left", "right"] as const).map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p}
          src={staffImageMap[staff][p]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
          style={{
            objectPosition: "bottom center",
            opacity: pose === p ? 1 : 0,
            transition: "opacity 120ms linear",
            transform: staffPoseTransform[staff][p],
            transformOrigin: "bottom center",
          }}
        />
      ))}
    </div>
  );
}

function DeskSprite({
  image,
  hoverImage,
  active,
  sceneWidth,
}: {
  image: string;
  hoverImage: string;
  active: boolean;
  sceneWidth: number;
}) {
  return (
    <div className="relative h-full w-full">
      <div style={{ display: active ? "none" : "block" }} className="absolute inset-0">
        <Image
          src={image}
          alt=""
          fill
          sizes={`${Math.round(sceneWidth * 0.41)}px`}
          className="object-contain drop-shadow-2xl"
          priority
          aria-hidden="true"
        />
      </div>
      <div style={{ display: active ? "block" : "none" }} className="absolute inset-0">
        <Image
          src={hoverImage}
          alt=""
          fill
          sizes={`${Math.round(sceneWidth * 0.41)}px`}
          className="object-contain drop-shadow-2xl"
          priority
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function HomeHero({ onLoadComplete }: { onLoadComplete?: () => void }) {
  const [hoveredDesk, setHoveredDesk] = useState<string | null>(null);
  const [activeStaff, setActiveStaff] = useState<ActiveStaff>("staff1");
  const [mouseDirection, setMouseDir] = useState<StaffDirection>("idle");
  const [showScrollHint, setShowScrollHint] = useState(false);
  const sceneSize = useDesktopSceneSize();
  const sceneScale = sceneSize.width / BASE_SCENE_WIDTH;
  const isDesktopViewport = useIsDesktopViewport();

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

  // ── Preload background and staff SVGs on mount before completing load ──
  useEffect(() => {
    let active = true;
    const imagesToPreload = ["/beranda/Background.svg", ...preloadImages];
    let loadedCount = 0;
    const totalCount = imagesToPreload.length;

    if (totalCount === 0) {
      onLoadComplete?.();
      return;
    }

    const checkLoad = () => {
      loadedCount++;
      if (loadedCount >= totalCount) {
        if (active) {
          onLoadComplete?.();
        }
      }
    };

    imagesToPreload.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      if (img.complete) {
        checkLoad();
      } else {
        img.addEventListener("load", checkLoad, { once: true });
        img.addEventListener("error", checkLoad, { once: true });
      }
    });

    return () => {
      active = false;
    };
  }, [onLoadComplete]);

  // ── Show/hide scroll hint based on viewport width ──
  useEffect(() => {
    const check = () => setShowScrollHint(window.innerWidth < sceneSize.width);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [sceneSize.width]);

  // ── Optional: set scroll to the far left on mount for narrow viewports ──
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    if (window.innerWidth < sceneSize.width) {
      scroller.scrollLeft = 0;
    }
  }, [sceneSize.width]);

  // ── Mouse-based staff movement (desktop) ──
  useEffect(() => {
    if (reducedMotion) return;
    const hero = heroRef.current;
    if (!hero) return;

    const MX = 75 * sceneScale; // px max horizontal
    const MY = 24 * sceneScale; // px max vertical

    /** Helper: set CSS custom properties pada wrapper */
    const setPos = (el: HTMLDivElement | null, tx: number, ty: number) => {
      if (!el) return;
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
    };

    const onMove = (e: MouseEvent) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const b = hero.getBoundingClientRect();
        // Calculate position relative to the fixed stage, not viewport
        const localX = e.clientX - b.left;
        const localY = e.clientY - b.top;
        const nx = (Math.min(1, Math.max(0, localX / sceneSize.width)) - 0.5) * 2; // -1..+1
        const ny = (Math.min(1, Math.max(0, localY / sceneSize.height)) - 0.5) * 2;
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
          setPos(staff1Wrap.current, nx * MX, ty);
          setPos(staff2Wrap.current, 0, 0);
        } else {
          setPos(staff1Wrap.current, 0, 0);
          setPos(staff2Wrap.current, nx * MX, ty);
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
      setPos(staff1Wrap.current, 0, 0);
      setPos(staff2Wrap.current, 0, 0);
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
  }, [reducedMotion, sceneScale, sceneSize.height, sceneSize.width]);

  // ── Scroll-based staff movement (narrow viewports) ──
  useEffect(() => {
    if (reducedMotion) return;
    const scroller = scrollRef.current;
    const stage = heroRef.current;
    if (!scroller || !stage) return;

    let lastScrollLeft = scroller.scrollLeft;
    let timer: number | null = null;
    let raf: number | null = null;

    const setPos = (el: HTMLDivElement | null, tx: number, ty: number) => {
      if (!el) return;
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
    };

    const updateFromScroll = () => {
      // Only activate scroll-based movement when viewport is narrower than scene
      if (window.innerWidth >= sceneSize.width) return;
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
          setPos(staff1Wrap.current, tx, -8);
          setPos(staff2Wrap.current, 0, 0);
        } else {
          setPos(staff1Wrap.current, 0, 0);
          setPos(staff2Wrap.current, tx, -8);
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

    // Hide scroll hint after user starts scrolling
    const onFirstScroll = () => {
      setShowScrollHint(false);
      scroller.removeEventListener("scroll", onFirstScroll);
    };

    updateFromScroll();
    scroller.addEventListener("scroll", updateFromScroll, { passive: true });
    scroller.addEventListener("scroll", onFirstScroll, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", updateFromScroll);
      scroller.removeEventListener("scroll", onFirstScroll);
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [reducedMotion, sceneSize.width]);

  const renderedActive = reducedMotion ? "staff1" : activeStaff;
  const renderedDir = reducedMotion ? "idle" : mouseDirection;
  const isS1Active = renderedActive === "staff1";
  const isS2Active = renderedActive === "staff2";

  const pose1 = getPose("staff1", renderedActive, renderedDir);
  const pose2 = getPose("staff2", renderedActive, renderedDir);
  const scaleSceneValue = (value: number) => Math.round(value * sceneScale);
  const staffBox = {
    width: scaleSceneValue(STAFF_BOX.width),
    height: scaleSceneValue(STAFF_BOX.height),
  };

  return (
    <section
      ref={scrollRef}
      className="animate-hero-fade-up relative overflow-x-auto overflow-y-hidden border-b border-[#eadfd1] bg-[#fff6e7] touch-pan-x overscroll-x-contain"
    >
      {/* ── Fixed stage: 1366×920, centered on wide viewports ── */}
      <div
        ref={heroRef}
        style={{
          position: "relative",
          width: sceneSize.width,
          minWidth: sceneSize.width,
          height: sceneSize.height,
          overflow: "hidden",
          marginInline: "auto",
          paddingTop: scaleSceneValue(128), // pt-32 = 8rem = 128px at baseline
        }}
      >
        {/* Background */}
        <Image
          src="/beranda/Background.svg"
          alt="" fill priority sizes={`${sceneSize.width}px`}
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
              bottom: scaleSceneValue(STAFF_BOTTOM),
              left: scaleSceneValue(STAFF1_LEFT),
              width: staffBox.width,
              height: staffBox.height,
              translate: "var(--tx, 0px) var(--ty, 0px)",
              transformOrigin: "bottom center",
              willChange: "translate",
              opacity: 1,
              filter: isS1Active ? "brightness(1.04)" : "brightness(1)",
              transition: "filter 0.2s ease-out",
            }}
          >
            <StaffSprite staff="staff1" pose={pose1} />
          </div>

          {/* Staff 2 — kanan */}
          <div
            ref={staff2Wrap}
            style={{
              position: "absolute",
              bottom: scaleSceneValue(STAFF_BOTTOM),
              right: scaleSceneValue(STAFF2_RIGHT),
              width: staffBox.width,
              height: staffBox.height,
              translate: "var(--tx, 0px) var(--ty, 0px)",
              transformOrigin: "bottom center",
              willChange: "translate",
              opacity: 1,
              filter: isS2Active ? "brightness(1.04)" : "brightness(1)",
              transition: "filter 0.2s ease-out",
            }}
          >
            <StaffSprite staff="staff2" pose={pose2} />
          </div>
        </div>

        {/* Invisible hover zones untuk keyboard/focus — z-[25] below desk links */}
        <button
          type="button"
          className="absolute bottom-[20%] left-[4%] z-[25] h-[30%] w-[22%] cursor-pointer bg-transparent"
          aria-label="Aktifkan staff layanan informasi"
          onMouseEnter={() => !reducedMotion && setActiveStaff("staff1")}
          onFocus={() => !reducedMotion && setActiveStaff("staff1")}
        />
        <button
          type="button"
          className="absolute bottom-[20%] right-[6%] z-[25] h-[30%] w-[24%] cursor-pointer bg-transparent"
          aria-label="Aktifkan staff layanan terpadu"
          onMouseEnter={() => !reducedMotion && setActiveStaff("staff2")}
          onFocus={() => !reducedMotion && setActiveStaff("staff2")}
        />

        {/* ── Desk SVG links ── */}
        {desks.map((desk) => {
          const isHovered = isDesktopViewport && hoveredDesk === desk.href;
          const isDeskOutlined = !isDesktopViewport || isHovered;
          return (
            <Link
              key={desk.href}
              href={desk.href}
              aria-label={desk.ariaLabel}
              className="group absolute z-30 block"
              style={scaleSceneStyle(desk.style, sceneScale)}
              onMouseEnter={() => isDesktopViewport && setHoveredDesk(desk.href)}
              onMouseLeave={() => isDesktopViewport && setHoveredDesk(null)}
              onFocus={() => isDesktopViewport && setHoveredDesk(desk.href)}
              onBlur={() => isDesktopViewport && setHoveredDesk(null)}
            >
              <span
                className={`absolute z-40 rounded-full border border-red-100 bg-white/95 px-4 py-2 text-center text-[13px] font-bold leading-snug text-red-700 shadow-lg shadow-red-950/10 transition-all duration-200 ${
                  isDesktopViewport
                    ? `whitespace-nowrap opacity-0 group-hover:-top-11 group-hover:opacity-100 group-focus-visible:-top-11 group-focus-visible:opacity-100 ${desk.labelClassName}`
                    : `whitespace-normal opacity-100 ${desk.mobileLabelClassName}`
                }`}
              >
                {desk.label}
              </span>
              {/* Fixed aspect-ratio box prevents hover jump */}
              <div className="relative w-full" style={{ aspectRatio: "620 / 420" }}>
                <DeskSprite
                  image={desk.image}
                  hoverImage={desk.hoverImage}
                  active={isDeskOutlined}
                  sceneWidth={sceneSize.width}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Scroll hint (narrow viewports only) ── */}
      {showScrollHint && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-4 z-50 flex flex-col items-center gap-1 animate-pulse"
          aria-hidden="true"
        >
          <span className="text-[11px] font-bold text-[#5c3a21] tracking-wide">
            Geser untuk melihat area layanan
          </span>
          <div className="h-1 w-10 rounded-full bg-[#5c3a21]/40" />
        </div>
      )}
    </section>
  );
}
