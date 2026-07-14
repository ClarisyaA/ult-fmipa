"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, Star, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  InformationImageFit,
  InformationPostImage,
} from "@/lib/information-post-images";
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
  imageFit: InformationImageFit;
};

const maxImages = 5;
const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = new Set(["image/webp", "image/png", "image/jpeg"]);
const allowedImageExtensions = [".webp", ".png", ".jpg", ".jpeg"];

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getPreviewImageClass(imageFit: InformationImageFit) {
  const baseClass =
    "aspect-video w-full rounded-md border border-[#edf0e9] bg-[#f7f3ea] object-center";

  return imageFit === "contain"
    ? `${baseClass} object-contain p-2`
    : `${baseClass} object-cover`;
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
  const [imageFitDrafts, setImageFitDrafts] = useState<
    Record<string, InformationImageFit>
  >(() =>
    Object.fromEntries(
      initialImages.map((image) => [image.id, image.imageFit ?? "cover"])
    )
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
        imageFit: "cover",
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

  function updatePendingImageFit(index: number, imageFit: InformationImageFit) {
    setPendingImages((current) =>
      current.map((image, currentIndex) =>
        currentIndex === index ? { ...image, imageFit } : image
      )
    );
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
          imageFit: imageFitDrafts[imageId] ?? "cover",
        }),
      },
      () =>
        setExistingImages((current) =>
          current.map((image) =>
            image.id === imageId
              ? {
                  ...image,
                  altText: altDrafts[imageId] ?? "",
                  imageFit: imageFitDrafts[imageId] ?? "cover",
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
      pendingImages.forEach(({ file, imageFit }) => {
        formData.append("images", file);
        formData.append("imageFits", imageFit);
      });

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
    <form className="grid gap-4 sm:gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="title" className="text-xs font-semibold text-[#39433c]">
          Judul
        </Label>
        <Input
          id="title"
          maxLength={200}
          className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          required
          data-testid="information-title"
        />
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold text-[#39433c]">Pratinjau Tautan</p>
        <p className="min-w-0 break-all rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-3 py-2 text-xs text-[#6f746f] sm:text-sm">
          {linkPreview ? `/informasi/${linkPreview}` : "/informasi/..."}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label
            htmlFor="category"
            className="text-xs font-semibold text-[#39433c]"
          >
            Kategori
          </Label>
          <Input
            id="category"
            maxLength={100}
            className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
            value={category}
            onChange={(event) => setCategory(event.currentTarget.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label
            htmlFor="status"
            className="text-xs font-semibold text-[#39433c]"
          >
            Status
          </Label>
          <select
            id="status"
            className="h-10 w-full rounded-md border border-[#e1d8ca] bg-white px-3 text-sm text-[#303b34] outline-none transition-colors focus:border-[#0f5b45] focus:ring-2 focus:ring-[#0f5b45]/15"
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

      <div className="grid gap-3 rounded-md border border-[#e3d9ca] bg-[#fffdf9] p-3 sm:p-4">
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-4">
          <label className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#e8dfd0] bg-white px-3 text-sm text-[#303b34]">
            <input
              type="checkbox"
              className="size-4 accent-[#0f5b45]"
              checked={isActive}
              onChange={(event) => setIsActive(event.currentTarget.checked)}
            />
            Aktif
          </label>
          <label className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#e8dfd0] bg-white px-3 text-sm text-[#303b34]">
            <input
              type="checkbox"
              className="size-4 accent-[#0f5b45]"
              checked={featured}
              onChange={(event) => setFeatured(event.currentTarget.checked)}
            />
            Unggulan
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label
              htmlFor="displayStartAt"
              className="text-xs font-semibold text-[#39433c]"
            >
              Mulai Tampil
            </Label>
            <Input
              id="displayStartAt"
              type="datetime-local"
              className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
              value={displayStartAt}
              onChange={(event) => setDisplayStartAt(event.currentTarget.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="displayEndAt"
              className="text-xs font-semibold text-[#39433c]"
            >
              Selesai Tampil
            </Label>
            <Input
              id="displayEndAt"
              type="datetime-local"
              className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
              value={displayEndAt}
              onChange={(event) => setDisplayEndAt(event.currentTarget.value)}
            />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[#7a7166]">
          Opsional. Jika dikosongkan, informasi akan mengikuti status publish dan
          aktif/non-aktif.
        </p>
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="summary"
          className="text-xs font-semibold text-[#39433c]"
        >
          Ringkasan
        </Label>
        <Textarea
          id="summary"
          maxLength={300}
          className="min-h-24 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
          value={summary}
          onChange={(event) => setSummary(event.currentTarget.value)}
        />
        <p className="text-xs text-[#7a7166]">
          {summary.length}/300 karakter
        </p>
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="content"
          className="text-xs font-semibold text-[#39433c]"
        >
          Konten
        </Label>
        <Textarea
          id="content"
          className="min-h-56 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45] sm:min-h-64"
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          required
          data-testid="information-content"
        />
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label
            htmlFor="images"
            className="text-xs font-semibold text-[#39433c]"
          >
            Gambar Informasi
          </Label>
          <Input
            id="images"
            name="images"
            type="file"
            multiple
            accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg"
            className="min-h-10 rounded-md border-[#e1d8ca] text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#0f3d2e] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            onChange={handleImageSelection}
            disabled={totalImages >= maxImages}
          />
          <p className="text-xs leading-relaxed text-[#7a7166]">
            {totalImages} dari 5 gambar dipilih. Format WEBP, PNG, JPG, atau
            JPEG. Maksimal 2 MB per gambar.
          </p>
        </div>

        {existingImages.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs font-semibold text-[#39433c]">
              Gambar Tersimpan
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {existingImages.map((image) => (
                <div
                  key={image.id}
                  className="grid gap-3 rounded-md border border-[#e3d9ca] bg-white p-3"
                >
                  <Image
                    src={`/api/information/images/${image.id}`}
                    alt={image.altText ?? image.originalName}
                    width={640}
                    height={360}
                    className={getPreviewImageClass(imageFitDrafts[image.id] ?? "cover")}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#303b34]">
                        {image.originalName}
                      </p>
                      <p className="text-xs text-[#7a7166]">
                        {formatSize(image.sizeBytes)}
                      </p>
                    </div>
                    {image.isCover ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#e2d7b8] bg-[#fff8e6] px-2 py-1 text-xs font-semibold text-[#745411]">
                        <Star className="size-3" />
                        Cover
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor={`alt-${image.id}`}
                      className="text-xs font-semibold text-[#39433c]"
                    >
                      Alt text
                    </Label>
                    <Input
                      id={`alt-${image.id}`}
                      maxLength={200}
                      className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
                      value={altDrafts[image.id] ?? ""}
                      onChange={(event) =>
                        setAltDrafts((current) => ({
                          ...current,
                          [image.id]: event.currentTarget.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor={`image-fit-${image.id}`}
                      className="text-xs font-semibold text-[#39433c]"
                    >
                      Tampilan Gambar
                    </Label>
                    <Select
                      value={imageFitDrafts[image.id] ?? "cover"}
                      onValueChange={(value) =>
                        setImageFitDrafts((current) => ({
                          ...current,
                          [image.id]: value as InformationImageFit,
                        }))
                      }
                    >
                      <SelectTrigger
                        id={`image-fit-${image.id}`}
                        className="h-10 w-full rounded-md border-[#e1d8ca] bg-white text-sm focus-visible:ring-[#0f5b45]"
                      >
                        <SelectValue placeholder="Pilih tampilan gambar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Penuhi Card</SelectItem>
                        <SelectItem value="contain">Tampilkan Utuh</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-relaxed text-[#7a7166]">
                      Gunakan Penuhi Card untuk foto biasa. Gunakan Tampilkan Utuh
                      untuk logo, SVG, poster, atau gambar yang tidak boleh
                      terpotong.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                      onClick={() => saveAltText(image.id)}
                    >
                      Simpan Alt
                    </Button>
                    {!image.isCover ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
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
                      className="h-8 rounded-md border-[#edd2c5] bg-white px-3 text-[11px] font-semibold text-[#8a3d23] hover:bg-[#fff7f2]"
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
            <p className="text-xs font-semibold text-[#39433c]">Gambar Baru</p>
            <div className="grid gap-3 md:grid-cols-2">
              {pendingImages.map((image, index) => (
                <div
                  key={image.previewUrl}
                  className="grid gap-3 rounded-md border border-[#e3d9ca] bg-white p-3"
                >
                  <Image
                    src={image.previewUrl}
                    alt={image.file.name}
                    width={640}
                    height={360}
                    unoptimized
                    className={getPreviewImageClass(image.imageFit)}
                  />
                  <div className="grid gap-2">
                    <Label
                      htmlFor={`pending-image-fit-${index}`}
                      className="text-xs font-semibold text-[#39433c]"
                    >
                      Tampilan Gambar
                    </Label>
                    <Select
                      value={image.imageFit}
                      onValueChange={(value) =>
                        updatePendingImageFit(index, value as InformationImageFit)
                      }
                    >
                      <SelectTrigger
                        id={`pending-image-fit-${index}`}
                        className="h-10 w-full rounded-md border-[#e1d8ca] bg-white text-sm focus-visible:ring-[#0f5b45]"
                      >
                        <SelectValue placeholder="Pilih tampilan gambar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Penuhi Card</SelectItem>
                        <SelectItem value="contain">Tampilkan Utuh</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-relaxed text-[#7a7166]">
                      Gunakan Penuhi Card untuk foto biasa. Gunakan Tampilkan Utuh
                      untuk logo, SVG, poster, atau gambar yang tidak boleh
                      terpotong.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#303b34]">
                        {image.file.name}
                      </p>
                      <p className="text-xs text-[#7a7166]">
                        {formatSize(image.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-md border-[#edd2c5] bg-white px-3 text-[11px] font-semibold text-[#8a3d23] hover:bg-[#fff7f2]"
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
          <div className="flex items-center gap-2 rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] px-3 py-4 text-sm text-[#7a7166]">
            {mode === "edit" ? (
              <ImageIcon className="size-4 shrink-0" />
            ) : (
              <Upload className="size-4 shrink-0" />
            )}
            Belum ada gambar baru yang dipilih.
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3d23]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-[#cce3d3] bg-[#eef9f1] px-3 py-2 text-sm text-[#2f6b44]">
          {success}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t border-[#eee6d9] pt-4 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full rounded-md bg-[#0f3d2e] px-5 text-sm font-semibold text-white hover:bg-[#164b39] sm:w-auto"
        >
        {isSubmitting ? "Menyimpan..." : "Simpan Informasi"}
        </Button>
      </div>
    </form>
  );
}
