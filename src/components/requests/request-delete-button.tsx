"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { confirmToast } from "@/lib/confirm-toast";

type RequestDeleteButtonProps = {
  serviceSlug: string;
  id: string;
  label?: string;
  redirectTo?: string;
  compact?: boolean;
};

export function RequestDeleteButton({
  serviceSlug,
  id,
  label = "Hapus",
  redirectTo,
  compact = false,
}: RequestDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleDelete() {
    if (
      !(await confirmToast({
        title: "Hapus pengajuan?",
        description:
          "Hapus pengajuan ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
        confirmLabel: "Hapus",
        variant: "destructive",
      }))
    ) {
      return;
    }

    setIsDeleting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(
        `/api/admin/requests/${serviceSlug}/${id}`,
        {
          method: "DELETE",
        }
      );
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setIsError(true);
        setMessage(body?.error ?? "Pengajuan gagal dihapus.");
        return;
      }

      setMessage(body?.message ?? "Pengajuan berhasil dihapus.");

      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className={
          compact
            ? "h-7 w-full rounded-md px-2 text-[10px] font-semibold"
            : undefined
        }
      >
        {isDeleting ? (compact ? "..." : "Menghapus...") : label}
      </Button>
      {message ? (
        <p
          className={`max-w-56 text-xs ${
            isError ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
