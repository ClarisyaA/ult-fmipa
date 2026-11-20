"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type StaffAccessToggleProps = {
  userName: string;
  feature: string;
  label: string;
  initialGranted: boolean;
};

export function StaffAccessToggle({
  userName,
  feature,
  label,
  initialGranted,
}: StaffAccessToggleProps) {
  const router = useRouter();
  const [granted, setGranted] = useState(initialGranted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function change(next: boolean) {
    setError(null);
    setGranted(next);

    try {
      const response = await fetch("/api/admin/system/access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, feature, granted: next }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Akses gagal diperbarui.");
      }

      startTransition(() => router.refresh());
    } catch (caught) {
      setGranted(!next);
      setError(caught instanceof Error ? caught.message : "Akses gagal diperbarui.");
    }
  }

  return (
    <div className="grid gap-1">
      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#303b34]">
        <input
          type="checkbox"
          checked={granted}
          disabled={isPending}
          onChange={(event) => change(event.target.checked)}
          aria-label={`${label} untuk ${userName}`}
          className="size-4 accent-[#0f3d2e]"
        />
        {granted ? "Diizinkan" : "Tidak"}
      </label>
      {error ? (
        <p className="text-[11px] font-semibold text-[#8a2d1b]">{error}</p>
      ) : null}
    </div>
  );
}
