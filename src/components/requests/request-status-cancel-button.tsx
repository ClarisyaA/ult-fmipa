"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RequestStatusAction } from "@/types/request-action";

type RequestStatusCancelButtonProps = {
  serviceSlug: string;
  id: string;
  rolePrefix: "admin" | "staff";
  staffName: string;
  action: Extract<
    RequestStatusAction,
    "cancelProcess" | "cancelComplete" | "cancelDeliver"
  >;
  label: string;
  confirmation: string;
};

export function RequestStatusCancelButton({
  serviceSlug,
  id,
  rolePrefix,
  staffName,
  action,
  label,
  confirmation,
}: RequestStatusCancelButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function cancelStatus() {
    if (!window.confirm(confirmation)) {
      return;
    }

    setError("");
    setIsPending(true);

    const response = await fetch(
      `/api/${rolePrefix}/requests/${serviceSlug}/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          staffName,
        }),
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Status pengajuan gagal dibatalkan.");
      setIsPending(false);
      return;
    }

    setIsPending(false);
    router.refresh();
  }

  return (
    <div className="mt-2 grid gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit border-[#d8b4a0] text-[#9a3412] hover:bg-[#fff7ed] hover:text-[#7c2d12]"
        disabled={isPending}
        onClick={cancelStatus}
      >
        <RotateCcw className="size-3.5" />
        {isPending ? "Membatalkan..." : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
