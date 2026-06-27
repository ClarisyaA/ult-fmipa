"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
  once?: boolean;
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);

          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once]);

  const hiddenState = {
    up: "translate-y-6 opacity-0 blur-sm",
    left: "-translate-x-10 opacity-0 blur-sm",
    right: "translate-x-10 opacity-0 blur-sm",
  };

  return (
    <div
      ref={ref}
      className={`${className} transform-gpu transition-all duration-700 ease-out ${
        isVisible
          ? "translate-x-0 translate-y-0 opacity-100 blur-0"
          : hiddenState[direction]
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
