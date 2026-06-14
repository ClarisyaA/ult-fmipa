"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { InformationPostImage } from "@/lib/information-post-images";

type InformationImageGalleryProps = {
  images: InformationPostImage[];
};

export function InformationImageGallery({ images }: InformationImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[activeIndex] ?? images[0];
  const hasMultipleImages = images.length > 1;

  function move(direction: -1 | 1) {
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

  return (
    <section className="mt-8 grid gap-3">
      <div className="relative overflow-hidden rounded-md border bg-muted">
        <Image
          src={`/api/information/images/${activeImage.id}`}
          alt={activeImage.altText ?? activeImage.originalName}
          width={1200}
          height={675}
          priority
          className="aspect-video w-full object-cover"
        />
        {hasMultipleImages ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              onClick={() => move(-1)}
              aria-label="Gambar sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => move(1)}
              aria-label="Gambar berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="absolute bottom-3 right-3 rounded-md bg-background/90 px-2 py-1 text-xs">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`overflow-hidden rounded-md border ${
                index === activeIndex ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Tampilkan gambar ${index + 1}`}
            >
              <Image
                src={`/api/information/images/${image.id}`}
                alt={image.altText ?? image.originalName}
                width={240}
                height={135}
                className="aspect-video w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
