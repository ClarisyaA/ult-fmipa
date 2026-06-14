"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  InformationPost,
  InformationPostStatus,
} from "@/lib/information-posts";
import { slugifyInformationTitle } from "@/lib/slug";

type InformationPostFormProps = {
  rolePrefix: "admin" | "staff";
  mode: "create" | "edit";
  initialPost?: InformationPost | null;
};

export function InformationPostForm({
  rolePrefix,
  mode,
  initialPost,
}: InformationPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [category, setCategory] = useState(initialPost?.category ?? "");
  const [summary, setSummary] = useState(initialPost?.summary ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [status, setStatus] = useState<InformationPostStatus>(
    initialPost?.status ?? "draft"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const linkPreview = slugifyInformationTitle(title);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "edit" && initialPost
          ? `/api/${rolePrefix}/information/${initialPost.id}`
          : `/api/${rolePrefix}/information`;
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          summary,
          content,
          status,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Informasi gagal disimpan.");
        return;
      }

      router.push(`/${rolePrefix}/informasi`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">Pratinjau Tautan</p>
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {linkPreview ? `/informasi/${linkPreview}` : "/informasi/..."}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="category">Kategori</Label>
          <Input
            id="category"
            maxLength={100}
            value={category}
            onChange={(event) => setCategory(event.currentTarget.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={status}
            onChange={(event) =>
              setStatus(event.currentTarget.value as InformationPostStatus)
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="summary">Ringkasan</Label>
        <Textarea
          id="summary"
          maxLength={300}
          value={summary}
          onChange={(event) => setSummary(event.currentTarget.value)}
        />
        <p className="text-sm text-muted-foreground">
          {summary.length}/300 karakter
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="content">Konten</Label>
        <Textarea
          id="content"
          className="min-h-56"
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          required
        />
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan..." : "Simpan Informasi"}
      </Button>
    </form>
  );
}
