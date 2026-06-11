"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
    disabledFor: ["inProgress", "completed", "delivered"],
  },
  {
    action: "complete",
    label: "Tandai Selesai",
    disabledFor: ["pending", "completed", "delivered"],
  },
  {
    action: "deliver",
    label: "Tandai Diambil/Dikirim",
    disabledFor: ["pending", "inProgress", "delivered"],
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
  const [error, setError] = useState("");

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
    router.refresh();
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-background p-4">
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
