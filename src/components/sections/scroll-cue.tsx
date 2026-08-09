"use client";

import { ArrowDown } from "lucide-react";

type ScrollCueProps = {
  targetId: string;
  label?: string;
};

export function ScrollCue({ targetId, label = "Scroll" }: ScrollCueProps) {
  function scrollToTarget() {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <button
      type="button"
      onClick={scrollToTarget}
      className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white/70 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-red-500/60 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      <span>{label}</span>
      <span className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/25 transition duration-300 group-hover:translate-y-0.5 group-hover:bg-red-500">
        <ArrowDown className="size-4" />
      </span>
    </button>
  );
}
