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

type ActionConfig = {
  action: RequestStatusAction;
  label: string;
  activeStatus: RequestStatus;
  confirmation: string;
  successMessage: string;
};

const actions: ActionConfig[] = [
  {
    action: "process",
    label: "Proses",
    activeStatus: "pending",
    confirmation: "Proses pengajuan ini?",
    successMessage: "Pengajuan berhasil diproses.",
  },
  {
    action: "complete",
    label: "Selesai",
    activeStatus: "inProgress",
    confirmation: "Tandai pengajuan ini selesai?",
    successMessage: "Pengajuan berhasil ditandai selesai.",
  },
  {
    action: "deliver",
    label: "Diambil/Dikirim",
    activeStatus: "completed",
    confirmation: "Tandai pengajuan ini sudah diambil/dikirim?",
    successMessage: "Pengajuan berhasil ditandai diambil/dikirim.",
  },
];

function getDisabledTitle(
  action: RequestStatusAction,
  status: RequestStatus,
  supported: boolean
) {
  if (!supported) {
    return "Aksi status belum tersedia untuk layanan ini.";
  }

  if (action === "process") {
    return status === "pending" ? "" : "Sudah diproses";
  }

  if (action === "complete") {
    if (status === "pending") {
      return "Proses dulu";
    }

    return status === "inProgress" ? "" : "Sudah selesai";
  }

  if (status === "pending" || status === "inProgress") {
    return "Selesaikan dulu";
  }

  return status === "completed" ? "" : "Sudah diambil/dikirim";
}

export function InlineStatusAction({
  rolePrefix,
  serviceSlug,
  id,
  status,
  staffName,
  supported,
}: InlineStatusActionProps) {
  const router = useRouter();
  const [submittingAction, setSubmittingAction] =
    useState<RequestStatusAction | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleClick(config: ActionConfig) {
    if (!window.confirm(config.confirmation)) {
      return;
    }

    setSubmittingAction(config.action);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(
        `/api/${rolePrefix}/requests/${serviceSlug}/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: config.action,
            staffName,
          }),
        }
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setIsError(true);
        setMessage(body?.error ?? "Status pengajuan gagal diperbarui.");
        return;
      }

      setMessage(config.successMessage);
      router.refresh();
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap gap-2">
        {actions.map((config) => {
          const enabled = supported && status === config.activeStatus;
          const title = enabled
            ? config.confirmation
            : getDisabledTitle(config.action, status, supported);

          return (
            <Button
              key={config.action}
              type="button"
              variant={enabled ? "default" : "outline"}
              size="sm"
              onClick={() => handleClick(config)}
              disabled={!enabled || submittingAction !== null}
              title={title}
            >
              {submittingAction === config.action ? "Menyimpan..." : config.label}
            </Button>
          );
        })}
      </div>
      {status === "delivered" ? (
        <p className="text-xs text-muted-foreground">Sudah selesai</p>
      ) : null}
      {message ? (
        <p
          className={`max-w-72 text-xs ${
            isError ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
