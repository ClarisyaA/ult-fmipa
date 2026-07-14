"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HomeActivity } from "@/lib/home-activities";

type HomeActivityFormProps = {
  rolePrefix: "admin" | "staff";
  mode: "create" | "edit";
  initialActivity?: HomeActivity | null;
};

const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);
const allowedImageExtensions = [".webp", ".png", ".jpg", ".jpeg", ".svg"];

function hasAllowedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();

  return allowedImageExtensions.some((extension) => lowerName.endsWith(extension));
}

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function HomeActivityForm({
  rolePrefix,
  mode,
  initialActivity,
}: HomeActivityFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialActivity?.title ?? "");
  const [eyebrow, setEyebrow] = useState(initialActivity?.eyebrow ?? "");
  const [description, setDescription] = useState(initialActivity?.description ?? "");
  const [imageAlt, setImageAlt] = useState(initialActivity?.imageAlt ?? "");
  const [isActive, setIsActive] = useState(initialActivity?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initialActivity?.sortOrder ?? 0));
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageRef = useRef<typeof pendingImage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pendingImageRef.current = pendingImage;
  }, [pendingImage]);

  useEffect(() => {
    return () => {
      if (pendingImageRef.current) {
        URL.revokeObjectURL(pendingImageRef.current.previewUrl);
      }
    };
  }, []);

  function selectImageFile(file: File | null) {
    setError("");

    if (!file) {
      return;
    }

    if (!allowedImageTypes.has(file.type) || !hasAllowedExtension(file.name)) {
      setError("Format gambar tidak didukung. Gunakan WEBP, PNG, JPG, JPEG, atau SVG.");
      return;
    }

    if (file.size > maxImageSize) {
      setError(`Gambar ${file.name} melebihi 2 MB.`);
      return;
    }

    setPendingImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    selectImageFile(event.currentTarget.files?.[0] ?? null);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectImageFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  }

  function handleDropZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  function removePendingImage() {
    setPendingImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "edit" && initialActivity
          ? `/api/${rolePrefix}/home/activities/${initialActivity.id}`
          : `/api/${rolePrefix}/home/activities`;
      const formData = new FormData();
      formData.append("title", title);
      formData.append("eyebrow", eyebrow);
      formData.append("description", description);
      formData.append("imageAlt", imageAlt);
      formData.append("isActive", String(isActive));
      formData.append("sortOrder", sortOrder);

      if (pendingImage) {
        formData.append("image", pendingImage.file);
      }

      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Kegiatan mahasiswa gagal disimpan.");
        return;
      }

      router.push(`/${rolePrefix}/beranda/kegiatan`);
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
          maxLength={150}
          className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          required
        />
        <p className="text-xs text-[#7a7166]">{title.length}/150 karakter</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="eyebrow" className="text-xs font-semibold text-[#39433c]">
            Eyebrow / Kategori
          </Label>
          <Input
            id="eyebrow"
            maxLength={80}
            className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
            value={eyebrow}
            onChange={(event) => setEyebrow(event.currentTarget.value)}
            placeholder="Agenda Sivitas"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sortOrder" className="text-xs font-semibold text-[#39433c]">
            Urutan
          </Label>
          <Input
            id="sortOrder"
            type="number"
            className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.currentTarget.value)}
          />
        </div>
      </div>

      <label className="inline-flex min-h-9 w-fit items-center gap-2 rounded-md border border-[#e8dfd0] bg-white px-3 text-sm text-[#303b34]">
        <input
          type="checkbox"
          className="size-4 accent-[#0f5b45]"
          checked={isActive}
          onChange={(event) => setIsActive(event.currentTarget.checked)}
        />
        Aktif tampil di homepage
      </label>

      <div className="grid gap-2">
        <Label
          htmlFor="description"
          className="text-xs font-semibold text-[#39433c]"
        >
          Deskripsi
        </Label>
        <Textarea
          id="description"
          className="min-h-36 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="imageAlt" className="text-xs font-semibold text-[#39433c]">
          Alt gambar
        </Label>
        <Input
          id="imageAlt"
          maxLength={150}
          className="h-10 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
          value={imageAlt}
          onChange={(event) => setImageAlt(event.currentTarget.value)}
          placeholder="Deskripsi singkat gambar"
        />
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="image" className="text-xs font-semibold text-[#39433c]">
            Gambar kegiatan
          </Label>
          <Input
            ref={fileInputRef}
            id="image"
            name="image"
            type="file"
            accept=".webp,.png,.jpg,.jpeg,.svg,image/webp,image/png,image/jpeg,image/svg+xml"
            className="sr-only"
            onChange={handleImageSelection}
          />
          <div
            role="button"
            tabIndex={0}
            className={`grid cursor-pointer place-items-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? "border-[#0f5b45] bg-[#eef9f1] text-[#0f3d2e]"
                : "border-[#d8d4c8] bg-[#fffdf9] text-[#7a7166] hover:border-[#0f5b45]/55 hover:bg-[#fbfdf9]"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={handleDropZoneKeyDown}
          >
            <div className="grid justify-items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-[#0f3d2e] text-white">
                <Upload className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#303b34]">
                  Drop gambar di sini atau klik untuk memilih
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#7a7166]">
                  WEBP, PNG, JPG, JPEG, atau SVG. Maksimal 2 MB.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-[#7a7166]">
            Jika memilih file baru saat edit, gambar lama akan diganti setelah disimpan.
          </p>
        </div>

        {initialActivity?.imagePath && !pendingImage ? (
          <div className="grid gap-2 rounded-md border border-[#e3d9ca] bg-white p-3 md:grid-cols-[220px_1fr]">
            <Image
              src={`/api/home/activities/images/${initialActivity.id}`}
              alt={initialActivity.imageAlt ?? initialActivity.title}
              width={640}
              height={360}
              unoptimized
              className="aspect-video w-full rounded-md border border-[#edf0e9] object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#303b34]">Gambar tersimpan</p>
              <p className="mt-1 truncate text-xs text-[#7a7166]">
                {initialActivity.imageOriginalName ?? "Gambar kegiatan"}
              </p>
              {initialActivity.imageSizeBytes ? (
                <p className="mt-1 text-xs text-[#7a7166]">
                  {formatSize(initialActivity.imageSizeBytes)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {pendingImage ? (
          <div className="grid gap-2 rounded-md border border-[#e3d9ca] bg-white p-3 md:grid-cols-[220px_1fr]">
            <Image
              src={pendingImage.previewUrl}
              alt={pendingImage.file.name}
              width={640}
              height={360}
              unoptimized
              className="aspect-video w-full rounded-md border border-[#edf0e9] object-cover"
            />
            <div className="flex min-w-0 flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#303b34]">Gambar baru</p>
                <p className="mt-1 truncate text-xs text-[#7a7166]">
                  {pendingImage.file.name}
                </p>
                <p className="mt-1 text-xs text-[#7a7166]">
                  {formatSize(pendingImage.file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit border-[#edd2c5] bg-white text-[#8a3d23] hover:bg-[#fff7f2]"
                onClick={removePendingImage}
              >
                <Trash2 className="size-4" />
                Hapus pilihan
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] px-3 py-4 text-sm text-[#7a7166]">
            {mode === "edit" ? (
              <ImageIcon className="size-4 shrink-0" />
            ) : (
              <Upload className="size-4 shrink-0" />
            )}
            {mode === "edit"
              ? "Pilih gambar baru jika ingin mengganti gambar tersimpan."
              : "Belum ada gambar yang dipilih."}
          </div>
        )}
      </div>

      {error ? (
        <p className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3d23]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t border-[#eee6d9] pt-4 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full rounded-md bg-[#0f3d2e] px-5 text-sm font-semibold text-white hover:bg-[#164b39] sm:w-auto"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Kegiatan"}
        </Button>
      </div>
    </form>
  );
}
