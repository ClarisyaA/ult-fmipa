"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type InformationDeleteButtonProps = {
  id: string;
};

export function InformationDeleteButton({ id }: InformationDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!window.confirm("Hapus informasi ini?")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/information/${id}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Informasi gagal dihapus.");
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
      >
        {isDeleting ? "Menghapus..." : "Hapus"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
