"use client";

import Link from "next/link";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { RequestNotificationSnapshot } from "@/types/dashboard";

type RolePrefix = "admin" | "staff";

function buildRowKey(
  row: RequestNotificationSnapshot["requests"][number],
) {
  return `${row.serviceSlug}:${row.id}:${row.requestDate ?? "unknown"}`;
}

function getItemsBeforeKey(
  rows: RequestNotificationSnapshot["requests"],
  stopKey: string | null,
) {
  if (!stopKey) {
    return [];
  }

  const items: RequestNotificationSnapshot["requests"] = [];

  for (const row of rows) {
    if (buildRowKey(row) === stopKey) {
      break;
    }
    items.push(row);
  }

  return items;
}

function getCategoryParam(category: string) {
  if (category === "Layanan Mahasiswa") return "mahasiswa";
  if (category === "Layanan Alumni") return "alumni";
  if (category === "Layanan Perpustakaan") return "perpustakaan";

  return undefined;
}

function buildPreviewHref(
  role: RolePrefix,
  row: RequestNotificationSnapshot["requests"][number],
) {
  const params = new URLSearchParams({
    service: row.serviceSlug,
    previewService: row.serviceSlug,
    previewId: row.id,
  });
  const category = getCategoryParam(row.serviceCategory);

  if (category) {
    params.set("category", category);
  }

  return `/${role}/requests?${params.toString()}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OpsRequestNotifier({ role }: { role: RolePrefix }) {
  const [snapshot, setSnapshot] = useState<RequestNotificationSnapshot | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isUnavailable, setIsUnavailable] = useState(false);
  const initializedRef = useRef(false);
  const hasLoggedFailureRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPermission(Notification.permission);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const seenKeyStorage = `ult:${role}:request-notification:seen`;
    const notifiedKeyStorage = `ult:${role}:request-notification:notified`;

    let cancelled = false;

    async function loadNotifications(signal?: AbortSignal) {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;

      try {
        const response = await fetch(`/api/${role}/notifications/requests`, {
          cache: "no-store",
          signal,
        });

        if (cancelled || signal?.aborted) {
          return;
        }

        if (!response.ok) {
          setIsUnavailable(true);
          if (
            process.env.NODE_ENV !== "production" &&
            !hasLoggedFailureRef.current
          ) {
            hasLoggedFailureRef.current = true;
            console.warn(
              `Request notifications unavailable (${response.status}).`,
            );
          }
          return;
        }

        const payload = (await response.json()) as {
          data: RequestNotificationSnapshot;
        };

        if (cancelled || signal?.aborted) {
          return;
        }

        const nextSnapshot = payload.data;
        setSnapshot(nextSnapshot);
        setIsUnavailable(false);
        hasLoggedFailureRef.current = false;

        const latestKey = nextSnapshot.latestKey;
        const seenKey = window.localStorage.getItem(seenKeyStorage);
        const notifiedKey = window.localStorage.getItem(notifiedKeyStorage);

        if (!initializedRef.current) {
          initializedRef.current = true;

          if (latestKey) {
            window.localStorage.setItem(seenKeyStorage, seenKey ?? latestKey);
            window.localStorage.setItem(notifiedKeyStorage, notifiedKey ?? latestKey);
          }

          const baseSeenKey = window.localStorage.getItem(seenKeyStorage);
          const unreadItems = getItemsBeforeKey(nextSnapshot.requests, baseSeenKey);
          setUnreadCount(unreadItems.length);
          return;
        }

        if (!latestKey) {
          setUnreadCount(0);
          return;
        }

        const newItems = getItemsBeforeKey(nextSnapshot.requests, notifiedKey);

        if (newItems.length > 0) {
          window.localStorage.setItem(notifiedKeyStorage, latestKey);
          const latestItem = newItems[0];
          toast.info(`${newItems.length} pengajuan baru masuk`, {
            description: `${latestItem.serviceTitle} dari ${latestItem.requesterName}`,
            action: {
              label: "Lihat",
              onClick: () => {
                window.location.href = buildPreviewHref(role, latestItem);
              },
            },
          });

          if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("Pengajuan baru ULT FMIPA", {
              body: `${latestItem.serviceTitle} dari ${latestItem.requesterName}`,
            });

            notification.onclick = () => {
              window.focus();
              window.location.href = buildPreviewHref(role, latestItem);
            };
          }
        }

        const refreshedSeenKey = window.localStorage.getItem(seenKeyStorage);
        const unreadItems = getItemsBeforeKey(nextSnapshot.requests, refreshedSeenKey);
        setUnreadCount(unreadItems.length);
      } catch (error) {
        if (cancelled || signal?.aborted) {
          return;
        }

        setIsUnavailable(true);
        const isTransientFetchFailure =
          error instanceof TypeError &&
          error.message.toLowerCase().includes("failed to fetch");

        if (
          process.env.NODE_ENV !== "production" &&
          !hasLoggedFailureRef.current &&
          !isTransientFetchFailure
        ) {
          hasLoggedFailureRef.current = true;
          console.warn("Request notifications unavailable.", error);
        }
      } finally {
        inFlightRef.current = false;
      }
    }

    const controller = new AbortController();

    void loadNotifications(controller.signal);
    const interval = window.setInterval(() => {
      void loadNotifications(controller.signal);
    }, 30000);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [role]);

  function markAsRead() {
    if (!snapshot?.latestKey) {
      setUnreadCount(0);
      return;
    }

    const seenKeyStorage = `ult:${role}:request-notification:seen`;
    window.localStorage.setItem(seenKeyStorage, snapshot.latestKey);
    setUnreadCount(0);
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
  }

  return (
    <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-5">
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          data-tour={`${role}-notification-button`}
          className="relative size-11 rounded-full border-[#d7e3d4] bg-white text-[#173d2d] shadow-[0_10px_28px_rgba(18,53,39,0.16)] hover:bg-[#f7fbf6]"
          aria-label="Buka notifikasi pengajuan"
          onClick={() => {
            setIsOpen((current) => !current);
            markAsRead();
          }}
        >
          {unreadCount > 0 ? (
            <BellRing className="size-5 text-[#0f5b45]" />
          ) : (
            <Bell className="size-5" />
          )}
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#d92027] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>

        {isOpen ? (
          <div className="absolute right-0 mt-3 w-[min(92vw,380px)] rounded-lg border border-[#dde4d9] bg-white p-3 shadow-[0_18px_44px_rgba(18,53,39,0.18)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#173d2d]">
                  Notifikasi Pengajuan
                </p>
                <p className="mt-1 text-[11px] text-[#6c736b]">
                  {snapshot?.totalPending ?? 0} pending,{" "}
                  {snapshot?.highPriorityCount ?? 0} di antaranya mendesak.
                </p>
              </div>
              <button
                type="button"
                className="text-[11px] font-semibold text-[#2f6b44]"
                onClick={() => {
                  markAsRead();
                  setIsOpen(false);
                }}
              >
                Tutup
              </button>
            </div>

            {permission === "default" ? (
              <button
                type="button"
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-[#dce6da] bg-[#f8fbf6] px-3 py-2 text-xs font-semibold text-[#173d2d]"
                onClick={enableBrowserNotifications}
              >
                <CheckCheck className="size-4 text-[#2f6b44]" />
                Aktifkan notifikasi browser
              </button>
            ) : null}

            {isUnavailable ? (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                Notifikasi sementara tidak dapat dimuat. Sistem akan mencoba lagi
                otomatis.
              </div>
            ) : null}

            <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1">
              {snapshot?.requests.length ? (
                snapshot.requests.map((row) => (
                  <Link
                    key={`${row.serviceSlug}-${row.id}`}
                    href={buildPreviewHref(role, row)}
                    className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-3 py-2 transition-colors hover:bg-[#f2f8f0]"
                    onClick={() => {
                      markAsRead();
                      setIsOpen(false);
                    }}
                  >
                    <p className="text-xs font-semibold text-[#173d2d]">
                      {row.serviceTitle}
                    </p>
                    <p className="mt-1 text-[11px] text-[#404841]">
                      {row.requesterName} - {row.programStudy}
                    </p>
                    <p className="mt-1 text-[10px] text-[#7a7166]">
                      Masuk {formatDate(row.requestDate)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-3 py-6 text-center text-xs text-[#6f746f]">
                  Belum ada pengajuan baru.
                </div>
              )}
            </div>

            <div className="mt-3">
              <Button
                asChild
                className="h-9 w-full rounded-md bg-[#0f3d2e] text-xs font-semibold text-white hover:bg-[#164b39]"
              >
                <Link
                  href={`/${role}/requests`}
                  onClick={() => {
                    markAsRead();
                    setIsOpen(false);
                  }}
                >
                  Buka daftar pengajuan
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
