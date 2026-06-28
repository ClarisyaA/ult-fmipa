"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 320;
const RING_SIZE = 54;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const scrollTop = window.scrollY;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      setIsVisible(scrollTop > SHOW_AFTER_PX);
      setProgress(scrollable > 0 ? Math.min(scrollTop / scrollable, 1) : 0);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      aria-label="Kembali ke atas"
      onClick={scrollToTop}
      className={`fixed bottom-5 right-5 z-[80] flex size-[54px] items-center justify-center rounded-full bg-[#FEFDF9]/95 text-[#18130E] shadow-xl shadow-[#5C3A1E]/15 ring-1 ring-[#E8DECE] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-[#EE1C25] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EE1C25] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEFDF9] sm:bottom-7 sm:right-7 ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#F0EAD8"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#EE1C25"
          strokeLinecap="round"
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_STROKE / 2}
          r="2"
          fill="#FCB71B"
        />
        <circle
          cx={RING_SIZE - RING_STROKE / 2}
          cy={RING_SIZE / 2}
          r="2"
          fill="#03B36B"
        />
      </svg>
      <ArrowUp className="relative size-5" strokeWidth={2.4} />
    </button>
  );
}
