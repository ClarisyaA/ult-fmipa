"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InformationPostImage } from "@/lib/information-post-images";

type InformationImageGalleryProps = {
  images: InformationPostImage[];
};

export function InformationImageGallery({ images }: InformationImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(() => (images.length > 1 ? 1 : 0));
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const hasMultipleImages = images.length > 1;

  function move(direction: -1 | 1) {
    if (!hasMultipleImages) {
      return;
    }

    setIsTransitionEnabled(true);
    setTrackIndex((current) => current + direction);
    setActiveIndex((current) => {
      const next = current + direction;

      if (next < 0) {
        return images.length - 1;
      }

      if (next >= images.length) {
        return 0;
      }

      return next;
    });
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
      setIsTransitionEnabled(true);
      setTrackIndex((current) => current + 1);
      setActiveIndex((current) => (current + 1 >= images.length ? 0 : current + 1));
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
                  <Image
                    src={`/api/information/images/${image.id}`}
                    alt={image.altText ?? image.originalName}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 90vw, 896px"
                    className={imageClass}
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
                if (index === activeIndex) {
                  return;
                }
                setActiveIndex(index);
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
