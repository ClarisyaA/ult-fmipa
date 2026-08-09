"use client";

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
import { Edit, Star, Trash2, Upload } from "lucide-react";

import { HomeActivityImage } from "@/components/home-activities/home-activity-image";
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
import { confirmToast } from "@/lib/confirm-toast";
import { getHomeActivityImageFileSrc } from "@/lib/home-activity-image-url";
import type { HomeActivity } from "@/lib/home-activities";
import type { HomeActivityImage as HomeActivityImageRecord, HomeActivityImageFit } from "@/lib/home-activity-images";

type HomeActivityFormProps = {
  rolePrefix: "admin" | "staff";
  mode: "create" | "edit";
  initialActivity?: (HomeActivity & { images?: HomeActivityImageRecord[] }) | null;
};

const MAX_IMAGES = 10;
const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);
const allowedImageExtensions = [".webp", ".png", ".jpg", ".jpeg", ".svg"];

type PendingImage = {
  tempId: string;
  file: File;
  previewUrl: string;
  altText: string;
  imageFit: HomeActivityImageFit;
  isCover: boolean;
};

function hasAllowedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return allowedImageExtensions.some((extension) => lowerName.endsWith(extension));
}

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getImagePreviewClass(imageFit: HomeActivityImageFit) {
  const baseClass = "aspect-video w-full rounded-md border border-[#edf0e9] object-center";

  return imageFit === "contain"
    ? `${baseClass} bg-[#f7f3ea] object-contain p-2`
    : `${baseClass} bg-[#f7f3ea] object-cover`;
}

function makeTempId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  const [isActive, setIsActive] = useState(initialActivity?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(initialActivity?.sortOrder ?? 0));

  const [existingImages, setExistingImages] = useState<HomeActivityImageRecord[]>(
    initialActivity?.images ?? []
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [editingExistingId, setEditingExistingId] = useState<string | null>(null);

  const totalImageCount = existingImages.length + pendingImages.length;

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  async function refreshExistingImages() {
    if (mode !== "edit" || !initialActivity) return;

    const response = await fetch(
      `/api/${rolePrefix}/home/activities/${initialActivity.id}/images`,
      { cache: "no-store" }
    );
    const body = (await response.json().catch(() => null)) as {
      data?: HomeActivityImageRecord[];
    } | null;

    if (response.ok && body?.data) {
      setExistingImages(body.data);
    }
  }

  function addFiles(files: File[]) {
    setError("");

    if (files.length === 0) return;

    const availableSlots = MAX_IMAGES - totalImageCount;

    if (availableSlots <= 0) {
      setError(`Maksimal ${MAX_IMAGES} gambar per kegiatan.`);
      return;
    }

    const accepted: PendingImage[] = [];

    for (const file of files.slice(0, availableSlots)) {
      if (!allowedImageTypes.has(file.type) || !hasAllowedExtension(file.name)) {
        setError("Format gambar tidak didukung. Gunakan WEBP, PNG, JPG, JPEG, atau SVG.");
        continue;
      }

      if (file.size > maxImageSize) {
        setError(`Gambar ${file.name} melebihi 2 MB.`);
        continue;
      }

      const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

      accepted.push({
        tempId: makeTempId(),
        file,
        previewUrl: URL.createObjectURL(file),
        altText: "",
        imageFit: isSvg ? "contain" : "cover",
        isCover: false,
      });
    }

    if (files.length > availableSlots) {
      setError(`Hanya ${availableSlots} gambar yang ditambahkan (batas ${MAX_IMAGES} gambar per kegiatan).`);
    }

    if (accepted.length > 0) {
      setPendingImages((current) => [...current, ...accepted]);
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files ?? []));
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

  function removePendingImage(tempId: string) {
    setPendingImages((current) => {
      const target = current.find((image) => image.tempId === tempId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.tempId !== tempId);
    });
  }

  function updatePendingImage(tempId: string, patch: Partial<PendingImage>) {
    setPendingImages((current) =>
      current.map((image) => (image.tempId === tempId ? { ...image, ...patch } : image))
    );
  }

  function setPendingCover(tempId: string) {
    setPendingImages((current) =>
      current.map((image) => ({ ...image, isCover: image.tempId === tempId }))
    );
  }

  async function uploadPendingImages(activityId: string) {
    if (pendingImages.length === 0) return;

    const formData = new FormData();

    for (const image of pendingImages) {
      formData.append("images", image.file);
      formData.append("imageAlts", image.altText);
      formData.append("imageFits", image.imageFit);
      formData.append("isCovers", String(image.isCover));
    }

    const response = await fetch(`/api/${rolePrefix}/home/activities/${activityId}/images`, {
      method: "POST",
      body: formData,
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(body?.error ?? "Gambar gagal diunggah.");
    }
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
      formData.append("isActive", String(isActive));
      formData.append("sortOrder", sortOrder);

      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { id: string };
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Kegiatan mahasiswa gagal disimpan.");
        return;
      }

      const activityId = mode === "edit" ? initialActivity?.id : body?.data?.id;

      if (activityId && pendingImages.length > 0) {
        try {
          await uploadPendingImages(activityId);
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Kegiatan tersimpan, tetapi sebagian gambar gagal diunggah."
          );
          return;
        }
      }

      router.push(`/${rolePrefix}/beranda/kegiatan`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveExistingMetadata(image: HomeActivityImageRecord, altText: string, imageFit: HomeActivityImageFit) {
    if (!initialActivity) return;
    setBusyImageId(image.id);
    setError("");

    try {
      const response = await fetch(
        `/api/${rolePrefix}/home/activities/${initialActivity.id}/images/${image.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageAlt: altText, imageFit }),
        }
      );
      const responseBody = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(responseBody?.error ?? "Gambar gagal diperbarui.");
        return;
      }

      setEditingExistingId(null);
      await refreshExistingImages();
      router.refresh();
    } finally {
      setBusyImageId(null);
    }
  }

  async function setExistingCover(image: HomeActivityImageRecord) {
    if (!initialActivity) return;
    setBusyImageId(image.id);
    setError("");

    try {
      const response = await fetch(
        `/api/${rolePrefix}/home/activities/${initialActivity.id}/images/${image.id}/cover`,
        { method: "POST" }
      );
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(body?.error ?? "Cover gagal diperbarui.");
        return;
      }

      await refreshExistingImages();
      router.refresh();
    } finally {
      setBusyImageId(null);
    }
  }

  async function replaceExistingImage(image: HomeActivityImageRecord, file: File) {
    if (!initialActivity) return;

    if (!allowedImageTypes.has(file.type) || !hasAllowedExtension(file.name)) {
      setError("Format gambar tidak didukung. Gunakan WEBP, PNG, JPG, JPEG, atau SVG.");
      return;
    }

    if (file.size > maxImageSize) {
      setError(`Gambar ${file.name} melebihi 2 MB.`);
      return;
    }

    setBusyImageId(image.id);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `/api/${rolePrefix}/home/activities/${initialActivity.id}/images/${image.id}`,
        { method: "PATCH", body: formData }
      );
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(body?.error ?? "Gambar gagal diganti.");
        return;
      }

      await refreshExistingImages();
      router.refresh();
    } finally {
      setBusyImageId(null);
    }
  }

  async function deleteExistingImage(image: HomeActivityImageRecord) {
    if (!initialActivity) return;

    if (
      !(await confirmToast({
        title: "Hapus gambar?",
        description: "Gambar ini akan dihapus dari kegiatan dan storage.",
        confirmLabel: "Hapus",
        variant: "destructive",
      }))
    ) {
      return;
    }

    setBusyImageId(image.id);
    setError("");

    try {
      const response = await fetch(
        `/api/${rolePrefix}/home/activities/${initialActivity.id}/images/${image.id}`,
        { method: "DELETE" }
      );
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(body?.error ?? "Gambar gagal dihapus.");
        return;
      }

      await refreshExistingImages();
      router.refresh();
    } finally {
      setBusyImageId(null);
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
          data-tour="admin-activity-title"
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
            data-tour="admin-activity-eyebrow"
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
            data-tour="admin-activity-order"
          />
        </div>
      </div>

      <label
        className="inline-flex min-h-9 w-fit items-center gap-2 rounded-md border border-[#e8dfd0] bg-white px-3 text-sm text-[#303b34]"
        data-tour="admin-activity-active"
      >
        <input
          type="checkbox"
          className="size-4 accent-[#0f5b45]"
          checked={isActive}
          onChange={(event) => setIsActive(event.currentTarget.checked)}
        />
        Aktif tampil di homepage
      </label>

      <div className="grid gap-2">
        <Label htmlFor="description" className="text-xs font-semibold text-[#39433c]">
          Deskripsi
        </Label>
        <Textarea
          id="description"
          className="min-h-36 rounded-md border-[#e1d8ca] text-sm focus-visible:ring-[#0f5b45]"
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          required
          data-tour="admin-activity-description"
        />
      </div>

      <div className="grid gap-3 border-t border-[#eee6d9] pt-4">
        <div>
          <p className="text-xs font-semibold text-[#39433c]">
            Gambar kegiatan ({totalImageCount}/{MAX_IMAGES})
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#7a7166]">
            Tambahkan hingga {MAX_IMAGES} gambar. Setiap gambar punya Alt dan Tampilan Gambar
            sendiri. Tandai satu gambar sebagai cover; jika tidak ditandai, gambar pertama akan
            otomatis menjadi cover.
          </p>
        </div>

        {existingImages.length > 0 ? (
          <div className="grid gap-2" data-tour="admin-activity-existing-images">
            {existingImages.map((image) => (
              <div
                key={image.id}
                className="grid gap-2 rounded-md border border-[#e3d9ca] bg-white p-3 md:grid-cols-[180px_1fr]"
              >
                <HomeActivityImage
                  src={getHomeActivityImageFileSrc(image)}
                  alt={image.imageAlt ?? title}
                  width={480}
                  height={270}
                  unoptimized
                  className={getImagePreviewClass(image.imageFit)}
                  fallbackClassName="grid aspect-video w-full place-items-center rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] p-3 text-center text-[#7a7166]"
                />
                <div className="min-w-0">
                  {editingExistingId === image.id ? (
                    <ExistingImageEditForm
                      image={image}
                      disabled={busyImageId === image.id}
                      onCancel={() => setEditingExistingId(null)}
                      onSave={(altText, imageFit) => saveExistingMetadata(image, altText, imageFit)}
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#303b34]">
                          {image.imageAlt || "(tanpa alt)"}
                        </p>
                        {image.isCover ? (
                          <span className="rounded-sm border border-[#cce3d3] bg-[#eef9f1] px-2 py-0.5 text-[10px] font-semibold text-[#2f6b44]">
                            Cover
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-[#7a7166]">
                        {image.imageFit === "contain" ? "Tampilkan Utuh" : "Penuhi Card"} · Urutan{" "}
                        {image.sortOrder}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 border-[#e1d8ca] text-[11px] text-[#39433c] hover:bg-[#f6f1e8]"
                          onClick={() => setEditingExistingId(image.id)}
                        >
                          <Edit className="size-3.5" />
                          Edit
                        </Button>
                        {!image.isCover ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 border-[#e1d8ca] text-[11px] text-[#39433c] hover:bg-[#f6f1e8]"
                            disabled={busyImageId === image.id}
                            onClick={() => setExistingCover(image)}
                          >
                            <Star className="size-3.5" />
                            Jadikan Cover
                          </Button>
                        ) : null}
                        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]">
                          <Upload className="size-3.5" />
                          Ganti File
                          <input
                            type="file"
                            className="sr-only"
                            accept=".webp,.png,.jpg,.jpeg,.svg,image/webp,image/png,image/jpeg,image/svg+xml"
                            disabled={busyImageId === image.id}
                            onChange={(event) => {
                              const file = event.currentTarget.files?.[0];
                              event.currentTarget.value = "";
                              if (file) replaceExistingImage(image, file);
                            }}
                          />
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-8 text-[11px]"
                          disabled={busyImageId === image.id}
                          onClick={() => deleteExistingImage(image)}
                        >
                          <Trash2 className="size-3.5" />
                          Hapus
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".webp,.png,.jpg,.jpeg,.svg,image/webp,image/png,image/jpeg,image/svg+xml"
          className="sr-only"
          onChange={handleFileInputChange}
        />
        <div
          role="button"
          tabIndex={0}
          data-tour="admin-activity-image"
          className={`grid cursor-pointer place-items-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
            isDragging
              ? "border-[#0f5b45] bg-[#eef9f1] text-[#0f3d2e]"
              : "border-[#d8d4c8] bg-[#fffdf9] text-[#7a7166] hover:border-[#0f5b45]/55 hover:bg-[#fbfdf9]"
          } ${totalImageCount >= MAX_IMAGES ? "pointer-events-none opacity-50" : ""}`}
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
                Drop beberapa gambar di sini atau klik untuk memilih
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#7a7166]">
                WEBP, PNG, JPG, JPEG, atau SVG. Maksimal 2 MB per gambar, {MAX_IMAGES} gambar per
                kegiatan.
              </p>
            </div>
          </div>
        </div>

        {pendingImages.length > 0 ? (
          <div className="grid gap-2">
            {pendingImages.map((image) => (
              <div
                key={image.tempId}
                className="grid gap-2 rounded-md border border-[#e3d9ca] bg-white p-3 md:grid-cols-[180px_1fr]"
              >
                <HomeActivityImage
                  src={image.previewUrl}
                  alt={image.file.name}
                  width={480}
                  height={270}
                  unoptimized
                  className={getImagePreviewClass(image.imageFit)}
                  fallbackDescription=""
                />
                <div className="grid min-w-0 gap-2">
                  <p className="truncate text-sm font-semibold text-[#303b34]">
                    Gambar baru: {image.file.name}
                  </p>
                  <p className="text-xs text-[#7a7166]">{formatSize(image.file.size)}</p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-1">
                      <Label className="text-[11px] font-semibold text-[#39433c]">
                        Alt gambar
                      </Label>
                      <Input
                        className="h-9 rounded-md border-[#e1d8ca] text-xs"
                        value={image.altText}
                        onChange={(event) =>
                          updatePendingImage(image.tempId, { altText: event.currentTarget.value })
                        }
                        maxLength={150}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[11px] font-semibold text-[#39433c]">
                        Tampilan Gambar
                      </Label>
                      <Select
                        value={image.imageFit}
                        onValueChange={(value) =>
                          updatePendingImage(image.tempId, {
                            imageFit: value as HomeActivityImageFit,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-full rounded-md border-[#e1d8ca] bg-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Penuhi Card</SelectItem>
                          <SelectItem value="contain">Tampilkan Utuh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#39433c]">
                      <input
                        type="radio"
                        name="pending-cover"
                        className="size-3.5 accent-[#0f5b45]"
                        checked={image.isCover}
                        onChange={() => setPendingCover(image.tempId)}
                      />
                      Jadikan Cover
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#edd2c5] bg-white text-[11px] text-[#8a3d23] hover:bg-[#fff7f2]"
                      onClick={() => removePendingImage(image.tempId)}
                    >
                      <Trash2 className="size-3.5" />
                      Hapus pilihan
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {existingImages.length === 0 && pendingImages.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-[#d8d4c8] bg-[#fffdf9] px-3 py-4 text-sm text-[#7a7166]">
            <Upload className="size-4 shrink-0" />
            Belum ada gambar yang dipilih. Gambar bersifat opsional.
          </div>
        ) : null}
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
          data-tour="admin-activity-save"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Kegiatan"}
        </Button>
      </div>
    </form>
  );
}

function ExistingImageEditForm({
  image,
  disabled,
  onCancel,
  onSave,
}: {
  image: HomeActivityImageRecord;
  disabled: boolean;
  onCancel: () => void;
  onSave: (altText: string, imageFit: HomeActivityImageFit) => void;
}) {
  const [altText, setAltText] = useState(image.imageAlt ?? "");
  const [imageFit, setImageFit] = useState<HomeActivityImageFit>(image.imageFit);

  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <Label className="text-[11px] font-semibold text-[#39433c]">Alt gambar</Label>
        <Input
          className="h-9 rounded-md border-[#e1d8ca] text-xs"
          value={altText}
          onChange={(event) => setAltText(event.currentTarget.value)}
          maxLength={150}
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-[11px] font-semibold text-[#39433c]">Tampilan Gambar</Label>
        <Select value={imageFit} onValueChange={(value) => setImageFit(value as HomeActivityImageFit)}>
          <SelectTrigger className="h-9 w-full rounded-md border-[#e1d8ca] bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Penuhi Card</SelectItem>
            <SelectItem value="contain">Tampilkan Utuh</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 text-[11px]"
          disabled={disabled}
          onClick={() => onSave(altText, imageFit)}
        >
          Simpan
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  );
}
