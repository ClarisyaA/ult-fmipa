"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const BASE_SCENE_WIDTH = 1440;
const BASE_SCENE_HEIGHT = 810;
const DESKTOP_BREAKPOINT = 1024;

const personWrapperConfig = {
  orang1: {
    left: 432,
    bottom: 54,
    width: 274,
    height: 411,
    zoneLeft: 80,
    zoneRight: 660,
    travelLeft: -420,
    travelRight: 110,
  },
  orang2: {
    left: 916,
    bottom: 52,
    width: 294,
    height: 400,
    zoneLeft: 780,
    zoneRight: 1160,
    travelLeft: -230,
    travelRight: 120,
  },
} satisfies Record<
  ActivePerson,
  {
    left: number;
    bottom: number;
    width: number;
    height: number;
    zoneLeft: number;
    zoneRight: number;
    travelLeft: number;
    travelRight: number;
  }
>;

const personPoseTransform: Record<ActivePerson, Record<PersonPose, string>> = {
  orang1: {
    normal: "translate(0px, 0px) scale(1)",
    line: "translate(0px, 0px) scale(1.11)",
    left: "translate(0px, 0px) scale(1)",
    right: "translate(0px, 0px) scale(1)",
  },
  orang2: {
    normal: "translate(0px, 0px) scale(1)",
    line: "translate(0px, 0px) scale(1)",
    left: "translate(0px, 0px) scale(1)",
    right: "translate(0px, 0px) scale(1)",
  },
};

const furniture = [
  {
    src: "/beranda-new/MejaKiri.svg",
    width: 2680,
    height: 2669,
    style: { left: 150, bottom: 25, width: 400 } as React.CSSProperties,
    sizesRatio: 0.24,
  },
  {
    src: "/beranda-new/MejaTengah.svg",
    width: 2671,
    height: 2282,
    style: { left: 560, bottom: 35, width: 387 } as React.CSSProperties,
    sizesRatio: 0.23,
  },
  {
    src: "/beranda-new/MejaKanan.svg",
    width: 2167,
    height: 2145,
    style: { right: 65, bottom: 40, width: 330 } as React.CSSProperties,
    sizesRatio: 0.25,
  },
];

const sceneElements = {
  teksHitArea: {
    style: {
      left: 436,
      top: 232,
      width: 600,
      height: 116,
    } as React.CSSProperties,
  },
  printer: {
    style: { left: 37, bottom: 230, width: 230, height: 162 } as React.CSSProperties,
  },
  printerInfo: {
    style: { left: 44, bottom: 406 } as React.CSSProperties,
  },
};

const printerText =
  "Mahasiswa dapat menggunakan printer layanan untuk kebutuhan administrasi akademik. Gunakan fasilitas ini secara tertib sesuai arahan petugas ULT.";

type PersonDirection = "idle" | "left" | "right";
type ActivePerson = "orang1" | "orang2";
type PersonPose = "normal" | "line" | "left" | "right";

const personImageMap = {
  orang1: {
    normal: "/beranda-new/Orang1.svg",
    line: "/beranda-new/Orang1Line.svg",
    left: "/beranda-new/Orang1Left.svg",
    right: "/beranda-new/Orang1Right.svg",
  },
  orang2: {
    normal: "/beranda-new/Orang2.svg",
    line: "/beranda-new/Orang2Line.svg",
    left: "/beranda-new/Orang2Left.svg",
    right: "/beranda-new/Orang2Right.svg",
  },
} satisfies Record<ActivePerson, Record<PersonPose, string>>;

const preloadImages = [
  "/beranda-new/ULT.svg",
  "/beranda-new/MejaKiri.svg",
  "/beranda-new/MejaKanan.svg",
  "/beranda-new/MejaTengah.svg",
  ...Object.values(personImageMap.orang1),
  ...Object.values(personImageMap.orang2),
];

function getPose(
  person: ActivePerson,
  active: ActivePerson,
  dir: PersonDirection,
): PersonPose {
  if (person !== active) return "normal";
  return dir === "idle" ? "line" : dir;
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
    viewportWidth >= DESKTOP_BREAKPOINT ? viewportWidth : BASE_SCENE_WIDTH;

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
  (["left", "right", "top", "bottom", "width", "height"] as const).forEach(
    (key) => {
      const value = next[key];
      if (typeof value === "number") {
        next[key] = Math.round(value * scale);
      }
    },
  );
  return next;
}

function getPersonTravel(person: ActivePerson, localX: number) {
  const cfg = personWrapperConfig[person];
  const personCenter = cfg.left + cfg.width / 2;
  const targetTravel = localX - personCenter;

  return Math.min(cfg.travelRight, Math.max(cfg.travelLeft, targetTravel));
}

function getScrollTravel(person: ActivePerson, progress: number) {
  const cfg = personWrapperConfig[person];
  const localProgress =
    person === "orang1"
      ? Math.min(progress * 2, 1)
      : Math.max((progress - 0.5) * 2, 0);
  return cfg.travelLeft + (cfg.travelRight - cfg.travelLeft) * localProgress;
}

function getPersonWrapperStyle(person: ActivePerson, scale: number) {
  const { left, bottom, width, height } = personWrapperConfig[person];
  return scaleSceneStyle(
    { left, bottom, width, height } as React.CSSProperties,
    scale,
  );
}

function movePerson(el: HTMLElement | null, tx: number, ty: number) {
  if (!el) return;
  gsap.to(el, {
    x: tx,
    y: ty,
    duration: 0.08,
    ease: "none",
    overwrite: "auto",
  });
}

function SceneImage({
  src,
  width,
  height,
  style,
  sceneWidth,
  sizesRatio,
  className = "",
}: {
  src: string;
  width: number;
  height: number;
  style: React.CSSProperties;
  sceneWidth: number;
  sizesRatio: number;
  className?: string;
}) {
  return (
    <div className={`absolute ${className}`} style={style}>
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        sizes={`${Math.round(sceneWidth * sizesRatio)}px`}
        className="h-auto w-full object-contain"
        priority
        aria-hidden="true"
      />
    </div>
  );
}

function PersonSprite({
  person,
  pose,
}: {
  person: ActivePerson;
  pose: PersonPose;
}) {
  return (
    <div className="relative h-full w-full">
      {(["normal", "line", "left", "right"] as const).map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p}
          src={personImageMap[person][p]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
          style={{
            objectPosition: "bottom center",
            opacity: pose === p ? 1 : 0,
            transition: "opacity 120ms linear",
            transform: personPoseTransform[person][p],
            transformOrigin: "bottom center",
          }}
        />
      ))}
    </div>
  );
}

export function HomeHero({ onLoadComplete }: { onLoadComplete?: () => void }) {
  const [activePerson, setActivePerson] = useState<ActivePerson>("orang1");
  const [mouseDirection, setMouseDir] = useState<PersonDirection>("idle");
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showPrinterInfo, setShowPrinterInfo] = useState(false);
  const sceneSize = useDesktopSceneSize();
  const sceneScale = sceneSize.width / BASE_SCENE_WIDTH;
  const isDesktopViewport = useIsDesktopViewport();

  const scrollRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const person1Wrap = useRef<HTMLAnchorElement | null>(null);
  const person2Wrap = useRef<HTMLAnchorElement | null>(null);

  const prevXRef = useRef<number | null>(null);
  const activeRef = useRef<ActivePerson>("orang1");
  const dirRef = useRef<PersonDirection>("idle");
  const idleTimer = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    activeRef.current = activePerson;
  }, [activePerson]);

  useEffect(() => {
    dirRef.current = mouseDirection;
  }, [mouseDirection]);

  useEffect(() => {
    let active = true;
    let loadedCount = 0;
    const totalCount = preloadImages.length;

    const checkLoad = () => {
      loadedCount++;
      if (loadedCount >= totalCount && active) {
        onLoadComplete?.();
      }
    };

    preloadImages.forEach((src) => {
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

  useEffect(() => {
    const check = () => setShowScrollHint(window.innerWidth < sceneSize.width);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [sceneSize.width]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    if (window.innerWidth < sceneSize.width) {
      scroller.scrollLeft = 0;
    }
  }, [sceneSize.width]);

  useEffect(() => {
    if (reducedMotion) return;
    const hero = heroRef.current;
    if (!hero) return;

    const MY = 6 * sceneScale;

    const onMove = (e: MouseEvent) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const b = hero.getBoundingClientRect();
        const localX = e.clientX - b.left;
        const baselineLocalX = localX / sceneScale;
        const localY = e.clientY - b.top;
        const nx =
          (Math.min(1, Math.max(0, localX / sceneSize.width)) - 0.5) * 2;
        const ny =
          (Math.min(1, Math.max(0, localY / sceneSize.height)) - 0.5) * 2;
        const next: ActivePerson = nx < 0 ? "orang1" : "orang2";

        if (activeRef.current !== next) {
          activeRef.current = next;
          setActivePerson(next);
        }

        if (prevXRef.current !== null) {
          const dx = e.clientX - prevXRef.current;
          if (dx < -6 && dirRef.current !== "left") {
            dirRef.current = "left";
            setMouseDir("left");
          } else if (dx > 6 && dirRef.current !== "right") {
            dirRef.current = "right";
            setMouseDir("right");
          }
        }
        prevXRef.current = e.clientX;

        const ty = ny * MY;
        if (next === "orang1") {
          movePerson(
            person1Wrap.current,
            getPersonTravel("orang1", baselineLocalX) * sceneScale,
            ty,
          );
          movePerson(person2Wrap.current, 0, 0);
        } else {
          movePerson(person1Wrap.current, 0, 0);
          movePerson(
            person2Wrap.current,
            getPersonTravel("orang2", baselineLocalX) * sceneScale,
            ty,
          );
        }

        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = window.setTimeout(() => {
          prevXRef.current = null;
          if (dirRef.current !== "idle") {
            dirRef.current = "idle";
            setMouseDir("idle");
          }
        }, 600);
      });
    };

    const onLeave = () => {
      movePerson(person1Wrap.current, 0, 0);
      movePerson(person2Wrap.current, 0, 0);
      prevXRef.current = null;
      if (dirRef.current !== "idle") {
        dirRef.current = "idle";
        setMouseDir("idle");
      }
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

  useEffect(() => {
    if (reducedMotion) return;
    const scroller = scrollRef.current;
    const stage = heroRef.current;
    if (!scroller || !stage) return;

    let lastScrollLeft = scroller.scrollLeft;
    let timer: number | null = null;
    let raf: number | null = null;

    const updateFromScroll = () => {
      if (window.innerWidth >= sceneSize.width) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const maxScroll = Math.max(stage.scrollWidth - scroller.clientWidth, 1);
        const progress = scroller.scrollLeft / maxScroll;
        const dx = scroller.scrollLeft - lastScrollLeft;
        const next: ActivePerson = progress < 0.5 ? "orang1" : "orang2";
        const dir: PersonDirection =
          dx < -1 ? "left" : dx > 1 ? "right" : dirRef.current;
        const tx = getScrollTravel(next, progress) * sceneScale;

        if (activeRef.current !== next) {
          activeRef.current = next;
          setActivePerson(next);
        }
        if (dir !== dirRef.current) {
          dirRef.current = dir;
          setMouseDir(dir);
        }

        if (next === "orang1") {
          movePerson(person1Wrap.current, tx, 0);
          movePerson(person2Wrap.current, 0, 0);
        } else {
          movePerson(person1Wrap.current, 0, 0);
          movePerson(person2Wrap.current, tx, 0);
        }

        lastScrollLeft = scroller.scrollLeft;
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (dirRef.current !== "idle") {
            dirRef.current = "idle";
            setMouseDir("idle");
          }
        }, 500);
      });
    };

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
  }, [reducedMotion, sceneScale, sceneSize.width]);

  const renderedActive = reducedMotion ? "orang1" : activePerson;
  const renderedDir = reducedMotion ? "idle" : mouseDirection;
  const pose1 = getPose("orang1", renderedActive, renderedDir);
  const pose2 = getPose("orang2", renderedActive, renderedDir);
  const printerInfoVisible = !isDesktopViewport || showPrinterInfo;

  return (
    <section
      ref={scrollRef}
      className="animate-hero-fade-up relative overflow-x-auto overflow-y-hidden border-b border-[#eadfd1] bg-[#fff6e7] touch-pan-x overscroll-x-contain"
    >
      <div
        ref={heroRef}
        style={{
          position: "relative",
          width: sceneSize.width,
          minWidth: sceneSize.width,
          height: sceneSize.height,
          overflow: "hidden",
          marginInline: "auto",
        }}
      >
        <Image
          src="/beranda-new/ULT.svg"
          alt=""
          fill
          priority
          sizes={`${sceneSize.width}px`}
          className="pointer-events-none object-cover object-center"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-[#fffaf2]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-[#fffaf2]/55 to-transparent" />

        <div className="pointer-events-none hidden" aria-hidden="true">
          {preloadImages.map((s) => (
            <Image key={s} src={s} alt="" width={1} height={1} />
          ))}
        </div>

        <Link
          href="/profil"
          aria-label="Buka profil Unit Layanan Terpadu"
          className="group absolute z-40 block rounded focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-red-500"
          style={scaleSceneStyle(sceneElements.teksHitArea.style, sceneScale)}
        >
          <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full border border-red-100 bg-white/95 px-4 py-2 text-[12px] font-bold text-red-700 opacity-0 shadow-lg shadow-red-950/10 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            Profil ULT
          </span>
        </Link>

        <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
          {furniture.map((item) => (
            <SceneImage
              key={item.src}
              src={item.src}
              width={item.width}
              height={item.height}
              style={scaleSceneStyle(item.style, sceneScale)}
              sceneWidth={sceneSize.width}
              sizesRatio={item.sizesRatio}
              className="drop-shadow-lg"
            />
          ))}
        </div>

        <Link
          ref={person1Wrap}
          href="/informasi"
          aria-label="Buka layanan informasi"
          className="group absolute z-[25] block rounded focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-red-500"
          style={{
            ...getPersonWrapperStyle("orang1", sceneScale),
            transformOrigin: "bottom center",
            willChange: "translate",
          }}
          onMouseEnter={() => !reducedMotion && setActivePerson("orang1")}
          onFocus={() => !reducedMotion && setActivePerson("orang1")}
        >
          <PersonSprite person="orang1" pose={pose1} />
          <span
            className={`absolute left-1/2 z-40 -translate-x-1/2 rounded-full border border-red-100 bg-white/95 px-4 py-2 text-center text-[13px] font-bold leading-snug text-red-700 shadow-lg shadow-red-950/10 transition-all duration-200 ${
              isDesktopViewport
                ? "-top-10 whitespace-nowrap opacity-0 group-hover:-top-12 group-hover:opacity-100 group-focus-visible:-top-12 group-focus-visible:opacity-100"
                : "-top-12 min-w-36 whitespace-normal opacity-100"
            }`}
          >
            Layanan Informasi
          </span>
        </Link>

        <Link
          ref={person2Wrap}
          href="/layanan"
          aria-label="Buka layanan mahasiswa dan alumni"
          className="group absolute z-[25] block rounded focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-red-500"
          style={{
            ...getPersonWrapperStyle("orang2", sceneScale),
            transformOrigin: "bottom center",
            willChange: "translate",
          }}
          onMouseEnter={() => !reducedMotion && setActivePerson("orang2")}
          onFocus={() => !reducedMotion && setActivePerson("orang2")}
        >
          <PersonSprite person="orang2" pose={pose2} />
          <span
            className={`absolute left-1/2 z-40 -translate-x-1/2 rounded-full border border-red-100 bg-white/95 px-4 py-2 text-center text-[13px] font-bold leading-snug text-red-700 shadow-lg shadow-red-950/10 transition-all duration-200 ${
              isDesktopViewport
                ? "-top-10 min-w-64 whitespace-nowrap opacity-0 group-hover:-top-12 group-hover:opacity-100 group-focus-visible:-top-12 group-focus-visible:opacity-100"
                : "-top-14 min-w-48 whitespace-normal opacity-100"
            }`}
          >
            Layanan Mahasiswa dan Alumni
          </span>
        </Link>

        <button
          type="button"
          aria-label="Informasi penggunaan printer layanan"
          aria-describedby="printer-info"
          className="absolute z-[35] block rounded bg-transparent focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-red-500"
          style={scaleSceneStyle(sceneElements.printer.style, sceneScale)}
          onMouseEnter={() => setShowPrinterInfo(true)}
          onMouseLeave={() => setShowPrinterInfo(false)}
          onFocus={() => setShowPrinterInfo(true)}
          onBlur={() => setShowPrinterInfo(false)}
        />

        <div
          id="printer-info"
          className={`absolute z-40 max-w-[280px] rounded-lg border border-red-100 bg-white/95 px-4 py-3 text-left text-[12px] font-semibold leading-relaxed text-[#5c3a21] shadow-xl shadow-red-950/10 transition duration-200 ${
            printerInfoVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          }`}
          style={scaleSceneStyle(sceneElements.printerInfo.style, sceneScale)}
        >
          {printerText}
        </div>
      </div>

      {showScrollHint && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-4 z-50 flex animate-pulse flex-col items-center gap-1"
          aria-hidden="true"
        >
          <span className="text-[11px] font-bold tracking-wide text-[#5c3a21]">
            Geser untuk melihat area layanan
          </span>
          <div className="h-1 w-10 rounded-full bg-[#5c3a21]/40" />
        </div>
      )}
    </section>
  );
}
