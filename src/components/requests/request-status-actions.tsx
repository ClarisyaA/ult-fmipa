"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RequestEmailHelper } from "@/components/requests/request-email-helper";
import type { RequestStatusAction } from "@/types/request-action";
import type { RequestStatus } from "@/types/request";

type RequestStatusActionsProps = {
  serviceSlug: string;
  id: string;
  currentStatus: RequestStatus;
  rolePrefix: "admin" | "staff";
  staffName: string;
};

type ActionButton = {
  action: RequestStatusAction;
  label: string;
  disabledFor: RequestStatus[];
};

const actions: ActionButton[] = [
  {
    action: "process",
    label: "Tandai Diproses",
    disabledFor: [
      "inProgress",
      "completed",
      "delivered",
      "sikApprovalPending",
      "sikApprovalRejected",
      "sikApprovalVerified",
    ],
  },
  {
    action: "complete",
    label: "Tandai Selesai",
    disabledFor: [
      "pending",
      "completed",
      "delivered",
      "sikApprovalPending",
      "sikApprovalRejected",
      "sikApprovalVerified",
      "sikFinalSubmitted",
    ],
  },
  {
    action: "deliver",
    label: "Tandai Diambil/Dikirim",
    disabledFor: [
      "pending",
      "inProgress",
      "delivered",
      "sikApprovalPending",
      "sikApprovalRejected",
      "sikApprovalVerified",
      "sikFinalSubmitted",
    ],
  },
];

export function RequestStatusActions({
  serviceSlug,
  id,
  currentStatus,
  rolePrefix,
  staffName,
}: RequestStatusActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<RequestStatusAction | null>(
    null
  );
  const [emailDialogSignal, setEmailDialogSignal] = useState(0);
  const [error, setError] = useState("");

  if (currentStatus === "delivered") {
    return (
      <div className="rounded-lg border border-[#cddfd4] bg-[#f1faf4] p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#2d6a4f]" />
          <div>
            <p className="text-sm font-semibold text-[#173d2d]">
              Pengajuan sudah diambil/dikirim
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function updateStatus(action: RequestStatusAction) {
    setError("");
    setPendingAction(action);

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
      }
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Status pengajuan gagal diperbarui.");
      setPendingAction(null);
      return;
    }

    setPendingAction(null);
    if (action === "complete") {
      // Defer refresh until the completion dialog is closed so the dialog
      // isn't cut short by a re-render triggered mid-interaction.
      setEmailDialogSignal((value) => value + 1);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-background p-4">
      <RequestEmailHelper
        serviceSlug={serviceSlug}
        id={id}
        mode="completion-dialog"
        openSignal={emailDialogSignal}
        onClose={() => router.refresh()}
      />
      <div>
        <p className="text-sm font-medium">Update Status</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aksi ini hanya mengubah kolom workflow yang sudah diizinkan.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((item) => {
          const isDisabled =
            item.disabledFor.includes(currentStatus) || pendingAction !== null;

          return (
            <Button
              key={item.action}
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisabled}
              onClick={() => updateStatus(item.action)}
            >
              {pendingAction === item.action ? "Memproses..." : item.label}
            </Button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
