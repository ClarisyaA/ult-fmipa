"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const START_PROGRESS = 18;
const HOLD_PROGRESS = 82;
const DONE_PROGRESS = 100;
const AUTO_FINISH_MS = 6500;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function getInternalAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest("a");
  if (!anchor?.href) return null;

  const nextUrl = new URL(anchor.href, window.location.href);
  if (nextUrl.origin !== window.location.origin) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  if (nextUrl.href === window.location.href) return null;

  return anchor;
}

export function RouteLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const isLoadingRef = useRef(false);
  const routeRef = useRef("");

  const clearTimer = useCallback(() => {
    if (!timeoutRef.current) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimer();
    isLoadingRef.current = true;
    setIsLoading(true);
    setProgress(START_PROGRESS);

    window.requestAnimationFrame(() => {
      setProgress(HOLD_PROGRESS);
    });

    timeoutRef.current = window.setTimeout(() => {
      setProgress(DONE_PROGRESS);
      window.setTimeout(() => {
        isLoadingRef.current = false;
        setIsLoading(false);
        setProgress(0);
      }, 220);
    }, AUTO_FINISH_MS);
  }, [clearTimer]);

  const finish = useCallback(() => {
    clearTimer();
    setProgress(DONE_PROGRESS);
    window.setTimeout(() => {
      isLoadingRef.current = false;
      setIsLoading(false);
      setProgress(0);
    }, 220);
  }, [clearTimer]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) {
        return;
      }

      const anchor = getInternalAnchor(event.target);
      if (!anchor) return;

      start();
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const action = form.action ? new URL(form.action, window.location.href) : null;
      if (action && action.origin !== window.location.origin) return;

      start();
    };

    const onPageShow = () => finish();

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", start);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener("pageshow", onPageShow);
      clearTimer();
    };
  }, [clearTimer, finish, start]);

  useEffect(() => {
    const route = `${pathname}?${searchParams.toString()}`;

    if (!routeRef.current) {
      routeRef.current = route;
      return;
    }

    if (routeRef.current === route) return;

    routeRef.current = route;
    if (isLoadingRef.current) finish();
  }, [finish, pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 bg-transparent transition-opacity duration-200 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-[#EE1C25] via-[#FCB71B] to-[#03B36B] shadow-[0_0_18px_rgba(238,28,37,0.32)] transition-[width] duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
