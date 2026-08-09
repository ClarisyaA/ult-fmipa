"use client";

import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";

type InformationImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string;
  alt: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackClassName?: string;
  onMissing?: () => void;
};

export function InformationImage({
  src,
  alt,
  className,
  fallbackTitle = "Gambar tidak tersedia",
  fallbackDescription,
  fallbackClassName,
  onMissing,
  ...imageProps
}: InformationImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = failedSrc === src;

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={
          fallbackClassName ??
          "flex h-full min-h-[180px] w-full items-center justify-center bg-[#f7f3ea] p-4 text-center text-[#7a6a5c]"
        }
      >
        <div className="grid justify-items-center gap-2">
          <ImageOff className="size-7 text-[#c9bead]" aria-hidden="true" />
          <p className="text-sm font-semibold text-[#4c443b]">
            {fallbackTitle}
          </p>
          {fallbackDescription ? (
            <p className="max-w-xs text-xs leading-relaxed text-[#7a6a5c]">
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
