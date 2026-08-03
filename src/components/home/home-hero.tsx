"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { ArrowDown, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BASE_SCENE_WIDTH = 1440;
const BASE_SCENE_HEIGHT = 810;
const MOBILE_BREAKPOINT = 640;
const DESKTOP_BREAKPOINT = 1024;
const HERO_BACKGROUND_SIZES =
  "(max-width: 1023px) 1440px, (max-width: 1920px) 100vw, 2560px";
const HERO_LAYER_SIZES = "640px";

function heroAsset(name: string, width: number) {
  return `/beranda-new/beranda-webp-optimized/${name}-${width}.webp`;
}

const personWrapperConfig = {
  orang1: {
    left: 432,
    bottom: 54,
    width: 274,
    height: 411,
    zoneLeft: 80,
    zoneRight: 660,
    travelLeft: -265,
    travelRight: 110,
  },
  orang2: {
    left: 890,
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
    left: "translate(0px, 0px) scale(1.02)",
    right: "translate(0px, 0px) scale(1.02)",
  },
};

const furniture = [
  {
    src: heroAsset("MejaKiri", 900),
    width: 900,
    height: 896,
    style: { left: 150, bottom: 25, width: 400 } as React.CSSProperties,
  },
  {
    src: heroAsset("MejaTengah", 900),
    width: 900,
    height: 769,
    style: { left: 560, bottom: 35, width: 387 } as React.CSSProperties,
  },
  {
    src: heroAsset("MejaKanan", 900),
    width: 900,
    height: 891,
    style: { right: 65, bottom: 40, width: 330 } as React.CSSProperties,
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
    style: {
      left: 37,
      bottom: 230,
      width: 230,
      height: 162,
    } as React.CSSProperties,
  },
  printerHint: {
    style: {
      left: 124,
      bottom: 390,
      width: 56,
      height: 56,
    } as React.CSSProperties,
  },
  printerInfo: {
    style: { left: 44, bottom: 406 } as React.CSSProperties,
  },
};

const printerText =
  "Mahasiswa dapat menggunakan printer layanan untuk kebutuhan administrasi akademik. Gunakan fasilitas ini secara tertib sesuai arahan petugas ULT.";

const heroHotspots = [
  {
    id: "mipa-corner",
    imageSrc: "/beranda-new/beranda-webp/MipaCorner.webp",
    imageAlt: "Gelas minuman Mipa Corner di meja layanan",
    imageWidth: 2897,
    imageHeight: 3769,
    imageSizes: "(max-width: 640px) 48px, (max-width: 1023px) 56px, 62px",
    style: { left: 1272, bottom: 238, width: 56, height: 74 },
    arrowStyle: { left: 16, top: -36, width: 40, height: 40 },
    popoverClassName: "right-6 bottom-[calc(100%+16px)]",
    title: "Mampir ke Mipa Corner",
    description:
      "Nikmati pilihan kopi, minuman, dan bakery dari Mipa Corner FMIPA Unpad.",
    ctaLabel: "Lihat Lokasi Mipa Corner",
    href: "https://share.google/GLuKZXOcqpUlBDGxc",
    supportingImage: {
      src: "/beranda-new/beranda-webp/MipaCornerWA.webp",
      alt: "QR WhatsApp Mipa Corner FMIPA Unpad",
      width: 4405,
      height: 4139,
    },
  },
  {
    id: "lab-catalog",
    imageSrc: "/beranda-new/beranda-webp/Stetoskop.webp",
    imageAlt: "Mikroskop katalog laboratorium di meja layanan",
    imageWidth: 2659,
    imageHeight: 3988,
    imageSizes: "(max-width: 640px) 62px, (max-width: 1023px) 74px, 90px",
    style: { left: 784, bottom: 238, width: 76, height: 114 },
    arrowStyle: { left: 26, top: -40, width: 44, height: 44 },
    popoverClassName: "left-1/2 bottom-[calc(100%+16px)] -translate-x-1/2",
    title: "Jelajahi Laboratorium FMIPA",
    description:
      "Lihat fasilitas dan katalog laboratorium FMIPA Universitas Padjadjaran.",
    ctaLabel: "Lihat Katalog Laboratorium",
    href: "https://bit.ly/KatalogLaboratoriumFMIPAUnpad?r=qr",
  },
] satisfies HeroHotspotConfig[];

type PersonDirection = "idle" | "left" | "right";
type ActivePerson = "orang1" | "orang2";
type PersonPose = "normal" | "line" | "left" | "right";
type HeroHotspotId = "mipa-corner" | "lab-catalog";

type HeroHotspotConfig = {
  id: HeroHotspotId;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageSizes: string;
  style: React.CSSProperties;
  arrowStyle: React.CSSProperties;
  popoverClassName: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  supportingImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

const personImageMap = {
  orang1: {
    normal: heroAsset("Orang1", 800),
    line: heroAsset("Orang1Line", 800),
    left: heroAsset("Orang1Left", 800),
    right: heroAsset("Orang1Right", 800),
  },
  orang2: {
    normal: heroAsset("Orang2", 800),
    line: heroAsset("Orang2Line", 800),
    left: heroAsset("Orang2Left", 800),
    right: heroAsset("Orang2Right", 800),
  },
} satisfies Record<ActivePerson, Record<PersonPose, string>>;

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

function useIsMobileHeroViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return isMobile;
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
  className = "",
}: {
  src: string;
  width: number;
  height: number;
  style: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={`absolute ${className}`} style={style}>
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        sizes={HERO_LAYER_SIZES}
        className="h-auto w-full object-contain"
        quality={75}
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
        <Image
          key={p}
          src={personImageMap[person][p]}
          alt=""
          fill
          sizes={HERO_LAYER_SIZES}
          quality={75}
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

function HotspotContent({
  hotspot,
  useDialogSemantics = false,
  showSupportingImage = true,
}: {
  hotspot: HeroHotspotConfig;
  useDialogSemantics?: boolean;
  showSupportingImage?: boolean;
}) {
  const heading = useDialogSemantics ? (
    <DialogTitle className="text-center text-xl font-black leading-tight text-[#18130E] sm:text-base sm:font-bold">
      {hotspot.title}
    </DialogTitle>
  ) : (
    <h3 className="text-base font-bold text-[#18130E]">{hotspot.title}</h3>
  );
  const description = useDialogSemantics ? (
    <DialogDescription className="mx-auto max-w-[18rem] text-center text-[0.9375rem] leading-relaxed text-[#6B5E52] sm:max-w-none sm:text-left sm:text-sm">
      {hotspot.description}
    </DialogDescription>
  ) : (
    <p className="text-sm leading-[1.7] text-[#6B5E52]">
      {hotspot.description}
    </p>
  );

  return (
    <>
      {useDialogSemantics ? (
        <DialogHeader className="items-center gap-3 px-2 pt-2 text-center sm:items-start sm:px-0 sm:pt-0 sm:text-left">
          {heading}
          {description}
        </DialogHeader>
      ) : (
        <div className="flex flex-col gap-3">
          {heading}
          {description}
        </div>
      )}
      <div
        className={
          useDialogSemantics ? "flex w-full justify-center pt-4" : "pt-4"
        }
      >
        <a
          href={hotspot.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 rounded-md bg-[#EE1C25] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-950/10 transition hover:bg-[#c9161e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${
            useDialogSemantics
              ? "w-fit min-w-[210px] max-w-full px-5 py-3 text-center text-base leading-tight"
              : "w-fit"
          }`}
        >
          {hotspot.ctaLabel}
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
      {showSupportingImage && hotspot.supportingImage && (
        <div
          className={`rounded-md border border-red-100 bg-white shadow-sm ${
            useDialogSemantics
              ? "mx-auto mt-5 w-full max-w-[18.5rem] p-3"
              : "w-fit p-2"
          }`}
        >
          <Image
            src={hotspot.supportingImage.src}
            alt={hotspot.supportingImage.alt}
            width={hotspot.supportingImage.width}
            height={hotspot.supportingImage.height}
            loading={useDialogSemantics ? "eager" : "lazy"}
            fetchPriority={useDialogSemantics ? "high" : "auto"}
            sizes={
              useDialogSemantics ? "(max-width: 640px) 82vw, 296px" : "128px"
            }
            className={`h-auto object-contain ${
              useDialogSemantics ? "w-full" : "w-28 sm:w-32"
            }`}
          />
        </div>
      )}
    </>
  );
}

function HotspotPreviewPortal({
  hotspot,
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: {
  hotspot: HeroHotspotConfig;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const isHydrated = useSyncExternalStore(
    (onStoreChange) => {
      const frameId = window.requestAnimationFrame(onStoreChange);
      return () => window.cancelAnimationFrame(frameId);
    },
    () => true,
    () => false,
  );

  if (
    !isOpen ||
    !isHydrated ||
    typeof document === "undefined" ||
    !hotspot.supportingImage
  ) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed left-1/2 top-1/2 z-[2147483647] max-h-[80vh] w-[clamp(360px,32vw,520px)] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/80 bg-white/95 p-4 shadow-2xl shadow-[#5c3a21]/25 ring-1 ring-red-100/80 backdrop-blur transition duration-200 ${
        isOpen
          ? "pointer-events-auto scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-hidden={!isOpen}
    >
      <Image
        src={hotspot.supportingImage.src}
        alt={hotspot.supportingImage.alt}
        width={hotspot.supportingImage.width}
        height={hotspot.supportingImage.height}
        loading="eager"
        fetchPriority="high"
        sizes="(max-width: 1280px) 360px, (max-width: 1920px) 32vw, 520px"
        className="max-h-[calc(80vh-2rem)] w-full object-contain"
      />
    </div>,
    document.body,
  );
}

function HeroHotspot({
  hotspot,
  sceneScale,
  isDesktopViewport,
  onOpenDialog,
}: {
  hotspot: HeroHotspotConfig;
  sceneScale: number;
  isDesktopViewport: boolean;
  onOpenDialog: (id: HeroHotspotId) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const openPreview = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimerRef.current = null;
    }, 160);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <div
      className="group absolute z-[34]"
      style={scaleSceneStyle(hotspot.style, sceneScale)}
      onMouseEnter={openPreview}
      onMouseLeave={scheduleClose}
      onFocusCapture={openPreview}
      onBlurCapture={(event) => {
        const nextFocus = event.relatedTarget as Node | null;

        if (!event.currentTarget.contains(nextFocus)) {
          scheduleClose();
        }
      }}
    >
      <button
        type="button"
        aria-label={hotspot.title}
        className="relative block h-full w-full rounded bg-transparent focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-red-500"
        onClick={() => {
          if (!isDesktopViewport) onOpenDialog(hotspot.id);
        }}
      >
        <Image
          src={hotspot.imageSrc}
          alt={hotspot.imageAlt}
          fill
          sizes={hotspot.imageSizes}
          loading="eager"
          className="object-contain drop-shadow-[0_8px_10px_rgba(92,58,33,0.22)] transition duration-200 group-hover:-translate-y-0.5 group-focus-within:-translate-y-0.5"
        />
      </button>
      <button
        type="button"
        aria-label={hotspot.title}
        className="absolute flex animate-bounce items-center justify-center rounded text-[#EE1C25] drop-shadow-[0_2px_3px_rgba(92,58,33,0.25)] transition group-hover:opacity-0 group-focus-within:opacity-0 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        style={scaleSceneStyle(hotspot.arrowStyle, sceneScale)}
        onClick={() => {
          if (!isDesktopViewport) onOpenDialog(hotspot.id);
        }}
      >
        <ArrowDown className="size-7" strokeWidth={3} aria-hidden="true" />
      </button>

      {isDesktopViewport && (
        <div
          className={`absolute z-50 w-[min(300px,calc(100vw-32px))] rounded-lg border border-red-100 bg-white/95 px-5 py-4 text-left shadow-xl shadow-red-950/10 transition duration-200 ${
            isOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          } ${hotspot.popoverClassName}`}
        >
          <HotspotContent hotspot={hotspot} showSupportingImage={false} />
        </div>
      )}

      {isDesktopViewport && (
        <HotspotPreviewPortal
          hotspot={hotspot}
          isOpen={isOpen}
          onMouseEnter={openPreview}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
}

function TurahPatrol({ reducedMotion }: { reducedMotion: boolean }) {
  const laneRef = useRef<HTMLDivElement | null>(null);
  const turahRef = useRef<HTMLDivElement | null>(null);
  const spriteRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const lane = laneRef.current;
    const turah = turahRef.current;
    const sprite = spriteRef.current;

    if (!lane || !turah || !sprite) return;

    if (reducedMotion) {
      gsap.killTweensOf(turah);
      gsap.set(turah, { x: 0 });
      gsap.set(sprite, { scaleX: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      let timeline: gsap.core.Timeline | null = null;

      const createAnimation = () => {
        const distance = Math.max(0, lane.clientWidth - turah.clientWidth);
        timeline?.kill();
        gsap.killTweensOf(turah);
        gsap.set(turah, { x: 0 });
        gsap.set(sprite, { scaleX: 1, transformOrigin: "center bottom" });

        timeline = gsap
          .timeline({ repeat: -1 })
          .to(turah, {
            x: distance,
            duration: 12,
            ease: "none",
            onStart: () => gsap.set(sprite, { scaleX: 1 }),
          })
          .to(turah, {
            x: 0,
            duration: 12,
            ease: "none",
            onStart: () => gsap.set(sprite, { scaleX: -1 }),
          });
      };

      createAnimation();

      const resizeObserver = new ResizeObserver(createAnimation);
      resizeObserver.observe(lane);
      resizeObserver.observe(turah);

      return () => {
        resizeObserver.disconnect();
        timeline?.kill();
      };
    }, lane);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div
      ref={laneRef}
      className="pointer-events-none absolute inset-x-[clamp(24px,5vw,96px)] bottom-2 z-[45] h-[88px] overflow-hidden sm:h-[108px] lg:h-[144px]"
      aria-hidden="true"
    >
      <div
        ref={turahRef}
        className="absolute bottom-0 left-0 w-14 will-change-transform sm:w-[72px] lg:w-[86px] xl:w-24"
      >
        <div ref={spriteRef} className="h-auto w-full">
          <Image
            src="/Beranda-Section1/Turah1.webp"
            alt=""
            width={2324}
            height={3037}
            sizes="(max-width: 640px) 56px, (max-width: 1023px) 72px, 96px"
            quality={75}
            className="h-auto w-full object-contain drop-shadow-[0_8px_12px_rgba(92,58,33,0.16)]"
          />
        </div>
      </div>
    </div>
  );
}

export function HomeHero({ onLoadComplete }: { onLoadComplete?: () => void }) {
  const [activePerson, setActivePerson] = useState<ActivePerson>("orang1");
  const [mouseDirection, setMouseDir] = useState<PersonDirection>("idle");
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showPrinterInfo, setShowPrinterInfo] = useState(false);
  const [activeHotspotDialog, setActiveHotspotDialog] =
    useState<HeroHotspotId | null>(null);
  const sceneSize = useDesktopSceneSize();
  const sceneScale = sceneSize.width / BASE_SCENE_WIDTH;
  const isDesktopViewport = useIsDesktopViewport();
  const isMobileHeroViewport = useIsMobileHeroViewport();

  const scrollRef = useRef<HTMLElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const person1Wrap = useRef<HTMLAnchorElement | null>(null);
  const person2Wrap = useRef<HTMLAnchorElement | null>(null);

  const heroRectRef = useRef<DOMRect | null>(null);
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
    const updateHeroRect = () => {
      heroRectRef.current = hero.getBoundingClientRect();
    };
    updateHeroRect();
    window.addEventListener("resize", updateHeroRect);
    window.addEventListener("scroll", updateHeroRect, { passive: true });

    const onMove = (e: MouseEvent) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      const clientX = e.clientX;
      const clientY = e.clientY;
      rafId.current = requestAnimationFrame(() => {
        const b = heroRectRef.current;
        if (!b) return;

        const localX = clientX - b.left;
        const baselineLocalX = localX / sceneScale;
        const localY = clientY - b.top;
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
          const dx = clientX - prevXRef.current;
          if (dx < -6 && dirRef.current !== "left") {
            dirRef.current = "left";
            setMouseDir("left");
          } else if (dx > 6 && dirRef.current !== "right") {
            dirRef.current = "right";
            setMouseDir("right");
          }
        }
        prevXRef.current = clientX;

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
      window.removeEventListener("resize", updateHeroRect);
      window.removeEventListener("scroll", updateHeroRect);
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
      const scrollLeft = scroller.scrollLeft;
      const maxScroll = Math.max(stage.scrollWidth - scroller.clientWidth, 1);
      const progress = scrollLeft / maxScroll;
      const dx = scrollLeft - lastScrollLeft;
      raf = requestAnimationFrame(() => {
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

        lastScrollLeft = scrollLeft;
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
  const printerInfoStyle = isMobileHeroViewport
    ? ({
        left: "clamp(18px, 6vw, 28px)",
        top: "236px",
        width: "clamp(148px, 48vw, 184px)",
        maxWidth: "calc(100vw - 132px)",
      } satisfies React.CSSProperties)
    : scaleSceneStyle(sceneElements.printerInfo.style, sceneScale);
  const activeDialogHotspot =
    heroHotspots.find((item) => item.id === activeHotspotDialog) ?? null;

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
          src="/beranda-new/beranda-webp/ULT.svg"
          alt=""
          fill
          priority
          sizes={HERO_BACKGROUND_SIZES}
          className="pointer-events-none object-cover object-center"
          aria-hidden="true"
          onLoad={onLoadComplete}
        />
        <div className="absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-[#fffaf2]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-[#fffaf2]/55 to-transparent" />

        <TurahPatrol reducedMotion={reducedMotion} />

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

        <div
          className="pointer-events-none absolute inset-0 z-30"
          aria-hidden="true"
        >
          {furniture.map((item) => (
            <SceneImage
              key={item.src}
              src={item.src}
              width={item.width}
              height={item.height}
              style={scaleSceneStyle(item.style, sceneScale)}
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

        {isDesktopViewport && !showPrinterInfo && (
          <div
            className="pointer-events-none absolute z-[36] flex animate-bounce items-center justify-center text-[#EE1C25] drop-shadow-[0_2px_3px_rgba(92,58,33,0.25)]"
            style={scaleSceneStyle(sceneElements.printerHint.style, sceneScale)}
            aria-hidden="true"
          >
            <ArrowDown className="size-7" strokeWidth={3} />
          </div>
        )}

        <div
          id="printer-info"
          className={`absolute z-40 rounded-lg border border-red-100 bg-white/95 text-left font-semibold leading-relaxed text-[#5c3a21] shadow-xl shadow-red-950/10 transition duration-200 ${
            isMobileHeroViewport
              ? "max-w-none px-3 py-2.5 text-[12px]"
              : "max-w-[280px] px-4 py-3 text-[12px]"
          } ${
            printerInfoVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          }`}
          style={printerInfoStyle}
        >
          {printerText}
        </div>

        {heroHotspots.map((hotspot) => (
          <HeroHotspot
            key={hotspot.id}
            hotspot={hotspot}
            sceneScale={sceneScale}
            isDesktopViewport={isDesktopViewport}
            onOpenDialog={setActiveHotspotDialog}
          />
        ))}
      </div>

      <Dialog
        open={activeHotspotDialog !== null}
        onOpenChange={(open) => {
          if (!open) setActiveHotspotDialog(null);
        }}
      >
        {activeDialogHotspot && (
          <DialogContent
            aria-label={activeDialogHotspot.title}
            className="max-w-[calc(100%-2rem)] sm:max-w-sm"
          >
            <HotspotContent hotspot={activeDialogHotspot} useDialogSemantics />
          </DialogContent>
        )}
      </Dialog>

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
