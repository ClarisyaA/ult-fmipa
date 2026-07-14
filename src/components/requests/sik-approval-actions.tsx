"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type SikApprovalActionsProps = {
  rolePrefix: "admin" | "staff";
  id: string;
  approvalStatus?: string | null;
  finalSubmitted: boolean;
};

export function SikApprovalActions({
  rolePrefix,
  id,
  approvalStatus,
  finalSubmitted,
}: SikApprovalActionsProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [error, setError] = useState("");

  if (finalSubmitted || approvalStatus !== "pending") {
    return null;
  }

  async function submit(action: "approve" | "reject") {
    setError("");

    if (action === "reject" && !reason.trim()) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }

    setPendingAction(action);

    try {
      const response = await fetch(
        `/api/${rolePrefix}/requests/surat-izin-kegiatan/${id}/approval`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason,
          }),
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string | { message?: string };
        } | null;
        const message =
          typeof body?.error === "string" ? body.error : body?.error?.message;
        setError(message ?? "Approval SIK gagal diperbarui.");
        return;
      }

      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div
      className="grid gap-3 rounded-lg border bg-background p-4"
      data-tour="admin-sik-verification"
    >
      <div>
        <p className="text-sm font-medium">Verifikasi Surat Izin Kegiatan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Setujui bukti ACC untuk membuka form final SIK, atau tolak dengan
          alasan.
        </p>
      </div>
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Alasan penolakan jika bukti belum sesuai"
        maxLength={500}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => submit("approve")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "approve" ? "Menyetujui..." : "Setujui Verifikasi"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => submit("reject")}
          disabled={pendingAction !== null}
        >
          {pendingAction === "reject" ? "Menolak..." : "Tolak Verifikasi"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
