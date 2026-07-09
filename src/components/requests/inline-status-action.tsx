"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

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

const nextStatusByAction = {
  process: "inProgress",
  complete: "completed",
  deliver: "delivered",
} satisfies Record<RequestStatusAction, RequestStatus>;

function getDisabledTitle(
  action: RequestStatusAction,
  status: RequestStatus,
  supported: boolean,
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
  const [optimisticStatus, setOptimisticStatus] =
    useState<RequestStatus | null>(null);
  const [submittingAction, setSubmittingAction] =
    useState<RequestStatusAction | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const currentStatus = optimisticStatus ?? status;

  if (currentStatus === "delivered") {
    return (
      <div className="rounded-md border border-[#cddfd4] bg-[#f1faf4] px-3 py-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2d6a4f]" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#173d2d]">
              Pengajuan selesai
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#5d6f62]">
              Dokumen sudah diambil atau dikirim. Tidak ada aksi lanjutan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="rounded-md border border-[#ded8eb] bg-[#fbfaff] px-3 py-2">
        <p className="text-xs font-semibold text-[#4f4a5f]">
          Workflow belum tersedia
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-[#7a7485]">
          Aksi status untuk layanan ini belum diaktifkan.
        </p>
      </div>
    );
  }

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
        },
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
      setOptimisticStatus(nextStatusByAction[config.action]);
      router.refresh();
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 gap-2">
        {actions.map((config) => {
          const enabled = currentStatus === config.activeStatus;
          const title = enabled
            ? config.confirmation
            : getDisabledTitle(config.action, currentStatus, supported);

          return (
            <Button
              key={config.action}
              type="button"
              variant={enabled ? "default" : "outline"}
              size="sm"
              className={
                enabled
                  ? "h-8 rounded-md bg-[#111111] px-3 text-xs text-white hover:bg-[#252525]"
                  : "h-8 rounded-md border-[#e2dee8] bg-white px-3 text-xs text-[#9b98a3]"
              }
              onClick={() => handleClick(config)}
              disabled={!enabled || submittingAction !== null}
              title={title}
            >
              {submittingAction === config.action
                ? "Menyimpan..."
                : config.label}
            </Button>
          );
        })}
      </div>
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
