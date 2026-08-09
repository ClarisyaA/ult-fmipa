"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { HomeActivityImage } from "@/components/home-activities/home-activity-image";
import { Button } from "@/components/ui/button";
import type { PublicHomeActivityImage } from "@/lib/home-activities";

type HomeActivityImageCarouselProps = {
  images: PublicHomeActivityImage[];
  imageClassName?: string;
  fallbackClassName?: string;
};

const SWIPE_THRESHOLD_PX = 40;

export function HomeActivityImageCarousel({
  images,
  imageClassName,
  fallbackClassName,
}: HomeActivityImageCarouselProps) {
  const hasMultipleImages = images.length > 1;
  const [trackIndex, setTrackIndex] = useState(() => (hasMultipleImages ? 1 : 0));
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  // Ref (not state) so overlapping clicks/swipes/keys can't stack multiple
  // moves before the previous CSS transition finishes and desyncs the
  // clone-padded track index.
  const isAnimatingRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);

  const activeIndex = hasMultipleImages
    ? (((trackIndex - 1) % images.length) + images.length) % images.length
    : 0;

  function move(direction: -1 | 1) {
    if (!hasMultipleImages || isAnimatingRef.current) {
      return;
    }

    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setTrackIndex((current) => current + direction);
  }

  function goTo(index: number) {
    if (!hasMultipleImages || isAnimatingRef.current || index === activeIndex) {
      return;
    }

    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setTrackIndex(index + 1);
  }

  if (images.length === 0) {
    return null;
  }

  const carouselImages = hasMultipleImages
    ? [images[images.length - 1], ...images, images[0]]
    : images;

  function handleTransitionEnd() {
    isAnimatingRef.current = false;

    if (!hasMultipleImages) {
      return;
    }

    if (trackIndex === images.length + 1) {
      setIsTransitionEnabled(false);
      setTrackIndex(1);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsTransitionEnabled(true));
      });
    }

    if (trackIndex === 0) {
      setIsTransitionEnabled(false);
      setTrackIndex(images.length);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsTransitionEnabled(true));
      });
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!hasMultipleImages) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      move(1);
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (!hasMultipleImages) return;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!hasMultipleImages || touchStartXRef.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const delta = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

    // Swipe left (negative delta) advances to the next image, matching
    // the natural "drag content leftward to see what's next" gesture.
    move(delta < 0 ? 1 : -1);
  }

  return (
    <div
      className="group/carousel relative h-full w-full overflow-hidden"
      tabIndex={hasMultipleImages ? 0 : -1}
      role={hasMultipleImages ? "region" : undefined}
      aria-roledescription={hasMultipleImages ? "carousel" : undefined}
      aria-label={hasMultipleImages ? "Galeri gambar kegiatan" : undefined}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`flex h-full w-full ${
          isTransitionEnabled ? "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""
        }`}
        style={{ transform: `translateX(-${trackIndex * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {carouselImages.map((image, index) => (
          <div key={`${image.id}-${index}`} className="relative h-full w-full flex-none">
            <HomeActivityImage
              src={image.url}
              alt={image.altText}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`${imageClassName ?? ""} ${
                image.imageFit === "contain" ? "object-contain p-4" : "object-cover"
              } object-center`}
              fallbackClassName={fallbackClassName}
              fallbackDescription="File gambar belum tersedia."
            />
          </div>
        ))}
      </div>

      {hasMultipleImages ? (
        <>
          {/*
            Hidden on mobile: the surrounding activity-to-activity carousel
            already renders its own prev/next round buttons at this same
            left-2/right-2 top-1/2 spot on small screens (sm:hidden there).
            Showing both would overlap. Mobile users still navigate images
            via swipe or the dot indicators below; desktop gets these
            hover-revealed arrows since nothing else occupies that spot.
          */}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 rounded-full border border-white/60 bg-white/85 text-[#18130E] opacity-0 shadow-md backdrop-blur transition-opacity duration-200 hover:bg-white group-hover/carousel:opacity-100 focus-visible:opacity-100 sm:flex"
            onClick={(event) => {
              event.stopPropagation();
              move(-1);
            }}
            aria-label="Gambar sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 rounded-full border border-white/60 bg-white/85 text-[#18130E] opacity-0 shadow-md backdrop-blur transition-opacity duration-200 hover:bg-white group-hover/carousel:opacity-100 focus-visible:opacity-100 sm:flex"
            onClick={(event) => {
              event.stopPropagation();
              move(1);
            }}
            aria-label="Gambar berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/55"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  goTo(index);
                }}
                aria-label={`Tampilkan gambar ke-${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>

          <span className="absolute right-2 top-2 z-10 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {activeIndex + 1}/{images.length}
          </span>
        </>
      ) : null}
    </div>
  );
}
