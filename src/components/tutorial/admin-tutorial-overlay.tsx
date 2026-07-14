"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminTutorialSteps } from "@/lib/admin-tutorial-steps";
import { getAdminPageTutorialSteps } from "@/lib/admin-page-tutorial-steps";
import type { TutorialMode, TutorialStep } from "@/lib/tutorial-types";

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const activeKey = "ult-admin-tutorial-active";
const stepKey = "ult-admin-tutorial-step";
const modeKey = "ult-admin-tutorial-mode";
const completedKey = "ult-admin-tutorial-completed";
const dismissedKey = "ult-admin-tutorial-dismissed";
const pageDismissedKey = "ult-admin-page-tutorial-dismissed";

function getMode(searchParams: URLSearchParams): TutorialMode | null {
  const mode = searchParams.get("tour");
  return mode === "admin" || mode === "page" ? mode : null;
}

function clampStep(value: number, length: number) {
  if (length <= 0) return 0;
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), length - 1);
}

function splitRoute(route: string) {
  const url = new URL(route, "http://local.tour");
  return {
    pathname: url.pathname,
    searchParams: url.searchParams,
  };
}

function buildTourHref(route: string, stepIndex: number, mode: TutorialMode) {
  const { pathname, searchParams } = splitRoute(route);
  searchParams.set("tour", mode);
  searchParams.set("step", String(stepIndex));
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildCurrentPageTourHref(
  pathname: string,
  searchParams: URLSearchParams,
  stepIndex: number,
) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("tour", "page");
  nextParams.set("step", String(stepIndex));
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function stripTourFromCurrent(pathname: string, searchParams: URLSearchParams) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.delete("tour");
  nextParams.delete("step");
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function currentRouteMatchesStep(
  pathname: string,
  searchParams: URLSearchParams,
  route: string,
) {
  const expected = splitRoute(route);

  if (pathname !== expected.pathname) {
    return false;
  }

  for (const [key, value] of expected.searchParams.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}

function getTargetElement(target?: string) {
  if (!target || typeof document === "undefined") {
    return null;
  }

  return document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
}

function getTargetRect(target?: string): HighlightRect | null {
  const element = getTargetElement(target);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getCardPosition(rect: HighlightRect | null) {
  if (typeof window === "undefined") {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  if (window.innerWidth < 640) {
    return {
      bottom: "16px",
      left: "16px",
      right: "16px",
      transform: "none",
    };
  }

  if (!rect) {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const cardWidth = Math.min(420, window.innerWidth - 32);
  const gap = 18;
  const rightSpace = window.innerWidth - (rect.left + rect.width);
  const leftSpace = rect.left;
  const belowTop = rect.top + rect.height + gap;
  const aboveTop = rect.top - gap;
  let left = rect.left;
  let top = belowTop;

  if (rightSpace >= cardWidth + gap) {
    left = rect.left + rect.width + gap;
    top = rect.top;
  } else if (leftSpace >= cardWidth + gap) {
    left = rect.left - cardWidth - gap;
    top = rect.top;
  } else {
    left = Math.min(Math.max(16, rect.left), window.innerWidth - cardWidth - 16);
  }

  if (top + 260 > window.innerHeight && aboveTop > 260) {
    top = aboveTop - 260;
  }

  top = Math.min(Math.max(16, top), window.innerHeight - 280);

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform: "none",
  };
}

function getFirstPreviewLink(previewService?: string) {
  const serviceSelector = previewService
    ? `[data-tutorial-service="${previewService}"]`
    : "";

  const target = document.querySelector<HTMLElement>(
    `[data-tour="admin-requests-row-detail-button"]${serviceSelector}`,
  );

  return target?.closest<HTMLAnchorElement>("a") ?? null;
}

function clickTutorialAction(action: string) {
  const target = document.querySelector<HTMLElement>(
    `[data-tutorial-action="${action}"]`,
  );

  if (!target) {
    return false;
  }

  target.click();
  return true;
}

function getHrefWithTour(
  rawHref: string,
  mode: TutorialMode,
  stepIndex: number,
) {
  const url = new URL(rawHref, window.location.origin);
  url.searchParams.set("tour", mode);
  url.searchParams.set("step", String(stepIndex));
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function getPageDismissedStorageKey(pathname: string) {
  return `${pageDismissedKey}:${pathname}`;
}

export function AdminTutorialOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationRef = useRef("");
  const previewAttemptRef = useRef("");
  const scrolledTargetRef = useRef("");
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isRoutePending, startTransition] = useTransition();

  const paramsString = searchParams.toString();
  const paramsSnapshot = useMemo(
    () => new URLSearchParams(paramsString),
    [paramsString],
  );
  const mode = getMode(paramsSnapshot);
  const pageSteps = useMemo(
    () => getAdminPageTutorialSteps(pathname, paramsSnapshot),
    [paramsSnapshot, pathname],
  );
  const steps: TutorialStep[] = mode === "page" ? pageSteps : adminTutorialSteps;
  const stepIndex = clampStep(Number(paramsSnapshot.get("step") ?? "0"), steps.length);
  const step = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const open = Boolean(mode && step);
  const isLoading = isNavigating || isRoutePending;

  const measureHighlight = useCallback(() => {
    setHighlightRect(getTargetRect(step?.target));
  }, [step?.target]);

  const scrollToTargetOnce = useCallback(() => {
    const element = getTargetElement(step?.target);

    if (!element) {
      setHighlightRect(null);
      return;
    }

    const targetKey = `${mode}:${stepIndex}:${pathname}:${step.target}`;

    if (scrolledTargetRef.current !== targetKey) {
      scrolledTargetRef.current = targetKey;
      element.scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "nearest",
      });
    }

    window.requestAnimationFrame(() => {
      setHighlightRect(getTargetRect(step?.target));
    });
  }, [mode, pathname, step, stepIndex]);

  const openFirstRequestPreview = useCallback(() => {
    if (!mode) return false;

    const link = getFirstPreviewLink(step?.previewService);

    if (!link) {
      return false;
    }

    setIsNavigating(true);
    startTransition(() => {
      router.push(getHrefWithTour(link.href, mode, stepIndex), { scroll: false });
    });
    return true;
  }, [mode, router, startTransition, step?.previewService, stepIndex]);

  const runStepCta = useCallback(() => {
    if (step?.onCta === "open-first-request-preview") {
      return openFirstRequestPreview();
    }

    if (step?.onCta === "open-user-create-form") {
      return clickTutorialAction("open-user-create-form");
    }

    if (step?.onCta === "open-user-reset-password") {
      return clickTutorialAction("open-user-reset-password");
    }

    return false;
  }, [openFirstRequestPreview, step?.onCta]);

  const goToStep = useCallback(
    (nextIndex: number) => {
      if (!mode) return;

      const safeIndex = clampStep(nextIndex, steps.length);
      const nextStep = steps[safeIndex];
      const href =
        mode === "admin"
          ? buildTourHref(nextStep.route ?? pathname, safeIndex, mode)
          : buildCurrentPageTourHref(pathname, paramsSnapshot, safeIndex);

      window.localStorage.setItem(activeKey, "true");
      window.localStorage.setItem(stepKey, String(safeIndex));
      window.localStorage.setItem(modeKey, mode);
      setIsNavigating(true);
      startTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [mode, paramsSnapshot, pathname, router, startTransition, steps],
  );

  const close = useCallback(
    (storeDismissed = false) => {
      if (storeDismissed && mode === "admin") {
        window.localStorage.setItem(dismissedKey, "true");
      }

      if (storeDismissed && mode === "page") {
        window.localStorage.setItem(pageDismissedKey, pathname);
        window.localStorage.setItem(getPageDismissedStorageKey(pathname), "true");
      }

      window.localStorage.removeItem(activeKey);
      window.localStorage.removeItem(stepKey);
      window.localStorage.removeItem(modeKey);
      setIsNavigating(true);
      startTransition(() => {
        router.replace(stripTourFromCurrent(pathname, paramsSnapshot), {
          scroll: false,
        });
      });
    },
    [mode, paramsSnapshot, pathname, router, startTransition],
  );

  const finish = useCallback(() => {
    if (mode === "admin") {
      window.localStorage.setItem(completedKey, "true");
    }

    close(dismissed);
  }, [close, dismissed, mode]);

  useEffect(() => {
    if (mode) {
      return;
    }

    if (window.localStorage.getItem(activeKey) !== "true") {
      return;
    }

    const savedMode = window.localStorage.getItem(modeKey) as TutorialMode | null;
    const safeMode = savedMode === "page" ? "page" : "admin";
    const savedStep = Number(window.localStorage.getItem(stepKey) ?? "0");
    const nextSteps =
      safeMode === "page"
        ? getAdminPageTutorialSteps(pathname, paramsSnapshot)
        : adminTutorialSteps;
    const safeStep = clampStep(savedStep, nextSteps.length);
    const href =
      safeMode === "page"
        ? buildCurrentPageTourHref(pathname, paramsSnapshot, safeStep)
        : buildTourHref(nextSteps[safeStep].route ?? "/admin/dashboard", safeStep, safeMode);

    window.requestAnimationFrame(() => {
      setIsNavigating(true);
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    });
  }, [mode, paramsSnapshot, pathname, router, startTransition]);

  useEffect(() => {
    if (!open || !step || !mode) {
      return;
    }

    window.localStorage.setItem(activeKey, "true");
    window.localStorage.setItem(stepKey, String(stepIndex));
    window.localStorage.setItem(modeKey, mode);

    if (
      mode === "admin" &&
      step.route &&
      !currentRouteMatchesStep(pathname, paramsSnapshot, step.route)
    ) {
      const href = buildTourHref(step.route, stepIndex, mode);
      if (navigationRef.current !== href) {
        navigationRef.current = href;
        setIsNavigating(true);
        startTransition(() => {
          router.replace(href, { scroll: false });
        });
      }
      return;
    }

    navigationRef.current = "";
  }, [mode, open, paramsSnapshot, pathname, router, startTransition, step, stepIndex]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsNavigating(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [paramsString, pathname]);

  useEffect(() => {
    if (!open || !step?.target) {
      return;
    }

    if (getTargetElement(step.target)) {
      return;
    }

    if (
      step.onCta !== "open-first-request-preview" &&
      step.onCta !== "open-user-create-form" &&
      step.onCta !== "open-user-reset-password"
    ) {
      return;
    }

    const attemptKey = `${mode}:${stepIndex}:${pathname}:${step.previewService ?? "any"}`;
    if (previewAttemptRef.current === attemptKey) {
      return;
    }

    previewAttemptRef.current = attemptKey;
    window.requestAnimationFrame(() => {
      runStepCta();
    });
  }, [mode, open, pathname, runStepCta, step, stepIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frameId = window.requestAnimationFrame(scrollToTargetOnce);
    window.addEventListener("resize", measureHighlight);
    window.addEventListener("scroll", measureHighlight, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measureHighlight);
      window.removeEventListener("scroll", measureHighlight, true);
    };
  }, [measureHighlight, open, scrollToTargetOnce]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isLoading) {
        return;
      }

      if (event.key === "Escape") {
        close(false);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToStep(stepIndex + 1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToStep(stepIndex - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close, goToStep, isLoading, open, stepIndex]);

  const cardStyle = useMemo(() => getCardPosition(highlightRect), [highlightRect]);
  const progressLabel = mode === "page" ? "Tutorial Halaman" : "Tutorial Admin";
  const missingPreviewTarget =
    !highlightRect && step?.onCta === "open-first-request-preview";
  const hasStepCta =
    step?.onCta === "open-first-request-preview" ||
    step?.onCta === "open-user-create-form" ||
    step?.onCta === "open-user-reset-password";

  if (!open || !step || !mode) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] bg-transparent p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-tutorial-title"
      aria-busy={isLoading}
    >
      {highlightRect ? (
        <div
          className="pointer-events-none fixed rounded-xl border-2 border-[#0f5b45] bg-[#dff7bd]/10 shadow-[0_0_0_4px_rgba(223,247,189,0.65),0_14px_34px_rgba(15,91,69,0.18)]"
          style={{
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
          }}
        />
      ) : null}

      <div
        className="pointer-events-auto fixed grid w-[min(420px,calc(100vw-32px))] gap-4 rounded-xl border border-[#e8dfd0] bg-white p-5 text-[#1f261f] shadow-[0_22px_60px_rgba(15,34,26,0.22)]"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0f5b45]">
              {progressLabel}
            </p>
            <h2 id="admin-tutorial-title" className="mt-1 text-xl font-black">
              {step.title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Tutup tutorial"
            onClick={() => close(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md border border-[#dbe8d9] bg-[#f6fbf4] px-3 py-2 text-xs font-semibold text-[#0f5b45]">
            <span className="size-2 animate-pulse rounded-full bg-[#0f5b45]" />
            Memuat step tutorial...
          </div>
        ) : null}

        <p className="text-sm leading-relaxed text-[#5f665f]">{step.body}</p>

        {!highlightRect && step.target ? (
          <p className="rounded-md border border-[#e8dfd0] bg-[#fffdf8] px-3 py-2 text-xs leading-relaxed text-[#756b5f]">
            {missingPreviewTarget
              ? "Belum ada contoh pengajuan yang bisa dibuka otomatis. Setelah ada data, klik Detail pada salah satu pengajuan untuk melihat bagian ini."
              : "Target belum terlihat di halaman ini. Jika data kosong, lanjutkan ke step berikutnya atau buka contoh data yang tersedia."}
          </p>
        ) : null}

        {hasStepCta ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit border-[#d7dfd0] bg-[#f8fbf6] text-[#0f5b45]"
            disabled={isLoading}
            onClick={runStepCta}
          >
            {isLoading ? "Membuka..." : (step.ctaLabel ?? "Buka bagian ini")}
          </Button>
        ) : null}

        <div className="grid gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-[#edf0e9]">
            <div
              className={`h-full rounded-full bg-[#0f5b45] transition-all ${
                isLoading ? "animate-pulse" : ""
              }`}
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-[#7a746b]">
            Step {stepIndex + 1} dari {steps.length}
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-[#5f665f]">
          <input
            type="checkbox"
            className="size-4 rounded border-[#d7dfd0] accent-[#0f5b45]"
            checked={dismissed}
            onChange={(event) => setDismissed(event.currentTarget.checked)}
          />
          Jangan tampilkan lagi di browser ini
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0e9] pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => close(dismissed)}
          >
            Lewati
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFirstStep || isLoading}
              onClick={() => goToStep(stepIndex - 1)}
            >
              {isLoading ? "Memuat..." : "Sebelumnya"}
            </Button>
            {isLastStep ? (
              <Button
                type="button"
                size="sm"
                className="bg-[#0f5b45] text-white hover:bg-[#0f3d2e]"
                disabled={isLoading}
                onClick={finish}
              >
                {isLoading ? "Memuat..." : "Selesai"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="bg-[#0f5b45] text-white hover:bg-[#0f3d2e]"
                disabled={isLoading}
                onClick={() => goToStep(stepIndex + 1)}
              >
                {isLoading ? "Memuat..." : "Lanjut"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
