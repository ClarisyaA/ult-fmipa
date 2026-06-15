"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, Star, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InformationPostImage } from "@/lib/information-post-images";
import type {
  InformationPost,
  InformationPostStatus,
} from "@/lib/information-posts";
import { slugifyInformationTitle } from "@/lib/slug";

type InformationPostFormProps = {
  rolePrefix: "admin" | "staff";
  mode: "create" | "edit";
  initialPost?: InformationPost | null;
  initialImages?: InformationPostImage[];
};

type PendingImage = {
  file: File;
  previewUrl: string;
};

const maxImages = 5;
const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = new Set(["image/webp", "image/png", "image/jpeg"]);
const allowedImageExtensions = [".webp", ".png", ".jpg", ".jpeg"];

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return offsetDate.toISOString().slice(0, 16);
}

function hasAllowedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();

  return allowedImageExtensions.some((extension) => lowerName.endsWith(extension));
}

export function InformationPostForm({
  rolePrefix,
  mode,
  initialPost,
  initialImages = [],
}: InformationPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [category, setCategory] = useState(initialPost?.category ?? "");
  const [summary, setSummary] = useState(initialPost?.summary ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [status, setStatus] = useState<InformationPostStatus>(
    initialPost?.status ?? "draft"
  );
  const [featured, setFeatured] = useState(initialPost?.featured ?? false);
  const [isActive, setIsActive] = useState(initialPost?.isActive ?? true);
  const [displayStartAt, setDisplayStartAt] = useState(
    toDateTimeLocal(initialPost?.displayStartAt)
  );
  const [displayEndAt, setDisplayEndAt] = useState(
    toDateTimeLocal(initialPost?.displayEndAt)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const [existingImages, setExistingImages] = useState(initialImages);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialImages.map((image) => [image.id, image.altText ?? ""]))
  );
  const linkPreview = slugifyInformationTitle(title);
  const totalImages = existingImages.length + pendingImages.length;

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl)
      );
    };
  }, []);

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setError("");
    setSuccess("");

    if (files.length === 0) {
      return;
    }

    if (totalImages + files.length > maxImages) {
      setError("Maksimal 5 gambar per informasi.");
      return;
    }

    const validImages: PendingImage[] = [];

    for (const file of files) {
      if (!allowedImageTypes.has(file.type) || !hasAllowedExtension(file.name)) {
        setError(`Format gambar ${file.name} tidak didukung.`);
        validImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return;
      }

      if (file.size > maxImageSize) {
        setError(`Gambar ${file.name} melebihi 2 MB.`);
        validImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return;
      }

      validImages.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPendingImages((current) => [...current, ...validImages]);
  }

  function removePendingImage(index: number) {
    setPendingImages((current) => {
      const removed = current[index];

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function refreshAfterImageAction(message: string) {
    setSuccess(message);
    setError("");
    router.refresh();
  }

  async function handleExistingImageAction(
    endpoint: string,
    options: RequestInit,
    optimisticUpdate?: () => void
  ) {
    setError("");
    setSuccess("");

    const response = await fetch(endpoint, options);
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      setError(body?.error ?? "Gambar gagal diperbarui.");
      return;
    }

    optimisticUpdate?.();
    await refreshAfterImageAction(body?.message ?? "Gambar berhasil diperbarui.");
  }

  async function deleteExistingImage(imageId: string) {
    if (!confirm("Hapus gambar ini?")) {
      return;
    }

    await handleExistingImageAction(
      `/api/${rolePrefix}/information/${initialPost?.id}/images/${imageId}`,
      { method: "DELETE" },
      () => setExistingImages((current) => current.filter((image) => image.id !== imageId))
    );
  }

  async function setCoverImage(imageId: string) {
    await handleExistingImageAction(
      `/api/${rolePrefix}/information/${initialPost?.id}/images/${imageId}/cover`,
      { method: "POST" },
      () =>
        setExistingImages((current) =>
          current.map((image) => ({
            ...image,
            isCover: image.id === imageId,
          }))
        )
    );
  }

  async function saveAltText(imageId: string) {
    await handleExistingImageAction(
      `/api/${rolePrefix}/information/${initialPost?.id}/images/${imageId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          altText: altDrafts[imageId] ?? "",
        }),
      },
      () =>
        setExistingImages((current) =>
          current.map((image) =>
            image.id === imageId
              ? {
                  ...image,
                  altText: altDrafts[imageId] ?? "",
                }
              : image
          )
        )
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "edit" && initialPost
          ? `/api/${rolePrefix}/information/${initialPost.id}`
          : `/api/${rolePrefix}/information`;
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("summary", summary);
      formData.append("content", content);
      formData.append("status", status);
      formData.append("featured", String(featured));
      formData.append("isActive", String(isActive));
      formData.append("displayStartAt", displayStartAt);
      formData.append("displayEndAt", displayEndAt);
      pendingImages.forEach(({ file }) => formData.append("images", file));

      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        body: formData,
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
          data-testid="information-title"
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
            <option value="published">Dipublikasikan</option>
            <option value="archived">Diarsipkan</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border p-3">
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.currentTarget.checked)}
            />
            Aktif
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.currentTarget.checked)}
            />
            Unggulan
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="displayStartAt">Mulai Tampil</Label>
            <Input
              id="displayStartAt"
              type="datetime-local"
              value={displayStartAt}
              onChange={(event) => setDisplayStartAt(event.currentTarget.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayEndAt">Selesai Tampil</Label>
            <Input
              id="displayEndAt"
              type="datetime-local"
              value={displayEndAt}
              onChange={(event) => setDisplayEndAt(event.currentTarget.value)}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Opsional. Jika dikosongkan, informasi akan mengikuti status publish dan
          aktif/non-aktif.
        </p>
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
          data-testid="information-content"
        />
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="images">Gambar Informasi</Label>
          <Input
            id="images"
            name="images"
            type="file"
            multiple
            accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg"
            onChange={handleImageSelection}
            disabled={totalImages >= maxImages}
          />
          <p className="text-sm text-muted-foreground">
            {totalImages} dari 5 gambar dipilih. Format WEBP, PNG, JPG, atau
            JPEG. Maksimal 2 MB per gambar.
          </p>
        </div>

        {existingImages.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Gambar Tersimpan</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {existingImages.map((image) => (
                <div key={image.id} className="grid gap-2 rounded-md border p-3">
                  <Image
                    src={`/api/information/images/${image.id}`}
                    alt={image.altText ?? image.originalName}
                    width={640}
                    height={360}
                    className="aspect-video w-full rounded-md border object-cover"
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {image.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(image.sizeBytes)}
                      </p>
                    </div>
                    {image.isCover ? (
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                        <Star className="size-3" />
                        Cover
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`alt-${image.id}`}>Alt text</Label>
                    <Input
                      id={`alt-${image.id}`}
                      maxLength={200}
                      value={altDrafts[image.id] ?? ""}
                      onChange={(event) =>
                        setAltDrafts((current) => ({
                          ...current,
                          [image.id]: event.currentTarget.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => saveAltText(image.id)}
                    >
                      Simpan Alt
                    </Button>
                    {!image.isCover ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCoverImage(image.id)}
                      >
                        <Star className="size-4" />
                        Jadikan Cover
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExistingImage(image.id)}
                    >
                      <Trash2 className="size-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {pendingImages.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Gambar Baru</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingImages.map((image, index) => (
                <div key={image.previewUrl} className="grid gap-2 rounded-md border p-3">
                  <Image
                    src={image.previewUrl}
                    alt={image.file.name}
                    width={640}
                    height={360}
                    unoptimized
                    className="aspect-video w-full rounded-md border object-cover"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {image.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(image.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePendingImage(index)}
                    >
                      <Trash2 className="size-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            {mode === "edit" ? (
              <ImageIcon className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            Belum ada gambar baru yang dipilih.
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan..." : "Simpan Informasi"}
      </Button>
    </form>
  );
}
