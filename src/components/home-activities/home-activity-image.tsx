"use client";

import Image, { type ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

type HomeActivityImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string;
  alt: string;
  fallbackClassName?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onMissing?: () => void;
};

export function HomeActivityImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackTitle = "Gambar tidak tersedia",
  fallbackDescription = "File gambar belum ada di storage lokal. Silakan unggah ulang gambar.",
  onMissing,
  ...imageProps
}: HomeActivityImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = failedSrc === src;

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={
          fallbackClassName ??
          "grid aspect-video w-full place-items-center rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] p-3 text-center text-[#7a7166]"
        }
      >
        <div className="flex min-w-0 max-w-full flex-col items-center justify-center gap-1 overflow-hidden px-1 text-center">
          <ImageIcon className="size-5 text-[#8a8176]" aria-hidden="true" />
          <p className="max-w-full whitespace-normal break-words text-xs font-semibold leading-tight text-[#39433c]">
            {fallbackTitle}
          </p>
          {fallbackDescription ? (
            <p className="max-w-full whitespace-normal break-words text-[11px] leading-relaxed text-[#7a7166]">
              {fallbackDescription}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setFailedSrc(src);
        onMissing?.();
      }}
    />
  );
}
