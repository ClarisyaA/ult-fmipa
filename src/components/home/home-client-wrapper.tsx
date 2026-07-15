"use client";

import Image from "next/image";
import { useState } from "react";
import { HomeHero } from "./home-hero";
import { HomeLandingSections } from "./home-landing-sections";

export function HomeClientWrapper() {
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);

  return (
    <>
      {/* Premium Full-Screen Page Loader with warm theme */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fffaf2] transition-all duration-700 ease-in-out ${
          isHeroLoaded ? "invisible opacity-0 pointer-events-none" : "visible opacity-100"
        }`}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#EE1C25]/10 bg-white/50 shadow-[0_20px_46px_rgba(238,28,37,0.12)]" />
            <div className="absolute inset-1 animate-spin rounded-full border-[3px] border-[#EE1C25]/12 border-t-[#EE1C25] border-r-[#FCB71B]" />
            <div className="absolute inset-4 animate-ping rounded-full bg-[#EE1C25]/8 opacity-70" />
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-white shadow-[0_14px_34px_rgba(24,19,14,0.10)]">
              <Image
                src="/Beranda-Section1/Turah1.svg"
                alt="Logo ULT FMIPA"
                width={68}
                height={68}
                priority
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>
          <div className="grid gap-1 text-center">
            <p className="text-sm font-semibold text-[#5f5146]">
              Memuat halaman
            </p>
            <p className="text-xs text-[#8A7A6E]">
              Unit Layanan Terpadu FMIPA Unpad
            </p>
          </div>
        </div>
      </div>

      {/* Main landing content - revealed smoothly once hero preloads fully */}
      <div
        className={`transition-all duration-700 ease-in-out ${
          isHeroLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <HomeHero onLoadComplete={() => setIsHeroLoaded(true)} />
        <HomeLandingSections />
      </div>
    </>
  );
}
