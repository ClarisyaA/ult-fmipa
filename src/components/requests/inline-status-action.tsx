"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { RequestStatusAction } from "@/types/request-action";
import type { RequestStatus } from "@/types/request";

type InlineStatusActionProps = {
  rolePrefix: "admin" | "staff";
  serviceSlug: string;
  id: string;
  status: RequestStatus;
  staffName: string;
  supported: boolean;
};

const actionByStatus: Partial<
  Record<
    RequestStatus,
    {
      action: RequestStatusAction;
      label: string;
      confirmation: string;
    }
  >
> = {
  pending: {
    action: "process",
    label: "Proses",
    confirmation: "Proses pengajuan ini?",
  },
  inProgress: {
    action: "complete",
    label: "Selesaikan",
    confirmation: "Tandai pengajuan ini selesai?",
  },
  completed: {
    action: "deliver",
    label: "Tandai Diambil/Dikirim",
    confirmation: "Tandai pengajuan ini sudah diambil/dikirim?",
  },
};

export function InlineStatusAction({
  rolePrefix,
  serviceSlug,
  id,
  status,
  staffName,
  supported,
}: InlineStatusActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const actionConfig = supported ? actionByStatus[status] : undefined;

  async function handleClick() {
    if (!actionConfig || !window.confirm(actionConfig.confirmation)) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/${rolePrefix}/requests/${serviceSlug}/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionConfig.action,
            staffName,
          }),
        }
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "Status pengajuan gagal diperbarui.");
        return;
      }

      setMessage(body?.message ?? "Status pengajuan berhasil diperbarui.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!actionConfig) {
    return (
      <span className="text-sm text-muted-foreground">
        {status === "delivered" ? "Selesai" : ""}
      </span>
    );
  }

  return (
    <div className="grid gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Memproses..." : actionConfig.label}
      </Button>
      {message ? (
        <p className="max-w-48 text-xs text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
