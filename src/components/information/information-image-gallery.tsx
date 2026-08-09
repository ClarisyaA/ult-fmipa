"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { InformationImage } from "@/components/information/information-image";
import { Button } from "@/components/ui/button";
import { getInformationImageSrc } from "@/lib/information-image-url";
import type { InformationPostImage } from "@/lib/information-post-images";

type InformationImageGalleryProps = {
  images: InformationPostImage[];
};

export function InformationImageGallery({ images }: InformationImageGalleryProps) {
  const [trackIndex, setTrackIndex] = useState(() => (images.length > 1 ? 1 : 0));
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const hasMultipleImages = images.length > 1;
  // Guards against rapid clicks stacking multiple moves before the previous
  // CSS transition finishes, which could push trackIndex past the
  // clone-padded array bounds. A ref (not state) since it's an internal
  // semaphore, not something that should trigger a render.
  const isAnimatingRef = useRef(false);

  // Derived from trackIndex (the single source of truth for carousel
  // position) instead of a separately-incremented state, so the dots/counter
  // can never drift out of sync with what's actually visible.
  const activeIndex = hasMultipleImages
    ? ((trackIndex - 1) % images.length + images.length) % images.length
    : 0;

  function move(direction: -1 | 1) {
    if (!hasMultipleImages || isAnimatingRef.current) {
      return;
    }

    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setTrackIndex((current) => current + direction);
  }

  useEffect(() => {
    if (!hasMultipleImages) {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (media.matches) {
      return;
    }

    const interval = window.setInterval(() => {
      if (isAnimatingRef.current) {
        return;
      }

      isAnimatingRef.current = true;
      setIsTransitionEnabled(true);
      setTrackIndex((current) => current + 1);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [hasMultipleImages, images.length]);

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

  return (
    <section className="grid gap-3">
      <style>{`
        .information-carousel-track {
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .information-carousel-track {
            transition: none !important;
          }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-3xl border border-[#e8dece] bg-[#f7f3ea] shadow-sm">
        <div className="relative aspect-video w-full">
          <div
            className={`information-carousel-track flex h-full w-full ${
              isTransitionEnabled
                ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                : ""
            }`}
            style={{ transform: `translateX(-${trackIndex * 100}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {carouselImages.map((image, index) => {
              const imageClass =
                image.imageFit === "contain"
                  ? "h-full w-full bg-[#f7f3ea] object-contain object-center p-4 sm:p-6"
                  : "h-full w-full object-cover object-center";

              return (
                <div
                  key={`${image.id}-${index}`}
                  className="relative h-full w-full flex-none"
                >
                  <InformationImage
                    src={getInformationImageSrc(image)}
                    alt={image.altText ?? image.originalName}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 90vw, 896px"
                    className={imageClass}
                    fallbackTitle="Gambar informasi belum tersedia."
                    fallbackClassName="flex h-full w-full items-center justify-center bg-[#f7f3ea] p-4 text-center text-[#7a6a5c]"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {hasMultipleImages ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 size-9 -translate-y-1/2 rounded-full border border-white/60 bg-white/85 text-[#18130E] shadow-md backdrop-blur hover:bg-white"
              onClick={() => move(-1)}
              aria-label="Gambar sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 size-9 -translate-y-1/2 rounded-full border border-white/60 bg-white/85 text-[#18130E] shadow-md backdrop-blur hover:bg-white"
              onClick={() => move(1)}
              aria-label="Gambar berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="flex items-center justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-8 bg-[#EE1C25]" : "w-2 bg-[#D8CFBE]"
              }`}
              onClick={() => {
                if (index === activeIndex || isAnimatingRef.current) {
                  return;
                }
                isAnimatingRef.current = true;
                setIsTransitionEnabled(true);
                setTrackIndex(index + 1);
              }}
              aria-label={`Tampilkan gambar ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}

      {hasMultipleImages ? (
        <p className="text-center text-xs font-medium text-[#8A7A6E]">
          {activeIndex + 1} / {images.length}
        </p>
      ) : null}
    </section>
  );
}
