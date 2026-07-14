"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { confirmToast } from "@/lib/confirm-toast";
import type { HomeActivity } from "@/lib/home-activities";

type HomeActivityActionsProps = {
  activity: HomeActivity;
  rolePrefix: "admin" | "staff";
};

export function HomeActivityActions({
  activity,
  rolePrefix,
}: HomeActivityActionsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive() {
    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", activity.title);
      formData.append("eyebrow", activity.eyebrow ?? "");
      formData.append("description", activity.description);
      formData.append("imageAlt", activity.imageAlt ?? "");
      formData.append("isActive", String(!activity.isActive));
      formData.append("sortOrder", String(activity.sortOrder));

      const response = await fetch(`/api/${rolePrefix}/home/activities/${activity.id}`, {
        method: "PATCH",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Status kegiatan gagal diperbarui.");
        return;
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteActivity() {
    if (
      !(await confirmToast({
        title: "Hapus kegiatan mahasiswa?",
        description:
          "Hapus kegiatan mahasiswa ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
        confirmLabel: "Hapus",
        variant: "destructive",
      }))
    ) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/${rolePrefix}/home/activities/${activity.id}`, {
        method: "DELETE",
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Kegiatan mahasiswa gagal dihapus.");
        return;
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleActive}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Menyimpan..."
            : activity.isActive
              ? "Nonaktifkan"
              : "Aktifkan"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={deleteActivity}
          disabled={isDeleting}
        >
          {isDeleting ? "Menghapus..." : "Hapus"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
