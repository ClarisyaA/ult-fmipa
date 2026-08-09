"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { confirmToast } from "@/lib/confirm-toast";

type InformationDeleteButtonProps = {
  id: string;
  rolePrefix?: "admin" | "staff";
};

export function InformationDeleteButton({
  id,
  rolePrefix = "admin",
}: InformationDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleDelete() {
    if (
      !(await confirmToast({
        title: "Hapus informasi?",
        description:
          "Hapus informasi ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
        confirmLabel: "Hapus",
        variant: "destructive",
      }))
    ) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/${rolePrefix}/information/${id}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Informasi gagal dihapus.");
        return;
      }

      setSuccess(body?.message ?? "Informasi berhasil dihapus.");
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
      >
        {isDeleting ? "Menghapus..." : "Hapus"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-xs text-muted-foreground">{success}</p>
      ) : null}
    </div>
  );
}
