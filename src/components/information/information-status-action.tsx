"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { InformationPost, InformationPostStatus } from "@/lib/information-posts";

type InformationStatusActionProps = {
  id: string;
  rolePrefix: "admin" | "staff";
  post: InformationPost;
  targetStatus: InformationPostStatus;
  label: string;
  confirmMessage: string;
};

export function InformationStatusAction({
  id,
  rolePrefix,
  post,
  targetStatus,
  label,
  confirmMessage,
}: InformationStatusActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", post.title);
      formData.append("category", post.category ?? "");
      formData.append("summary", post.summary ?? "");
      formData.append("content", post.content);
      formData.append("status", targetStatus);
      formData.append("featured", String(post.featured));
      formData.append("isActive", String(post.isActive));
      formData.append("displayStartAt", post.displayStartAt ?? "");
      formData.append("displayEndAt", post.displayEndAt ?? "");

      const response = await fetch(`/api/${rolePrefix}/information/${id}`, {
        method: "PATCH",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Status informasi gagal diperbarui.");
        return;
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
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
        {isSubmitting ? "Menyimpan..." : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
