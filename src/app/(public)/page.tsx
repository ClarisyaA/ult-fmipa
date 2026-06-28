"use client";

import { useState } from "react";
import { HomeHero } from "@/components/home/home-hero";
import { HomeLandingSections } from "@/components/home/home-landing-sections";

export default function HomePage() {
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);

  return (
    <main data-testid="home-page" className="relative min-h-screen bg-[#fffaf2] text-[#171412]">
      {/* Premium Full-Screen Page Loader with warm theme */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fffaf2] transition-all duration-700 ease-in-out ${
          isHeroLoaded ? "invisible opacity-0 pointer-events-none" : "visible opacity-100"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-[#EE1C25]/20 opacity-75" />
            {/* Spinning indicator */}
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EE1C25]/20 border-t-[#EE1C25]" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8A7A6E]">
            Memuat Halaman
          </p>
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
    </main>
  );
}
