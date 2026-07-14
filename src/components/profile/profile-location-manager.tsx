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
import { Plus, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  ProfileImageFit,
  ProfileLocationHour,
  ProfileLocationSettings,
} from "@/lib/profile-cms";

type ProfileLocationManagerProps = {
  rolePrefix: "admin" | "staff";
  initialLocation: ProfileLocationSettings | null;
  unavailable: boolean;
};

const fallbackLocation = {
  eyebrow: "Location & Access",
  title: "Lokasi Kami",
  description:
    "Lokasi ULT FMIPA berada di Lt. 1 Gedung Otto Sumarwoto Fakultas MIPA (Gedung Dekanat), Jl. Ir. Sukarno Km. 21, Jatinangor, Sumedang dan berada di pusat kawasan Universitas Padjadjaran Kampus Jatinangor.",
  directionLabel: "Petunjuk Arah",
  directionUrl: "https://www.google.com/maps/search/?api=1&query=FMIPA%20Unpad%20Jatinangor",
  email: "ult.fmipa@unpad.ac.id",
  imageAlt: "Denah lokasi FMIPA Unpad",
  imageFit: "cover" as ProfileImageFit,
  isActive: true,
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

function getPreviewImageClass(imageFit: ProfileImageFit) {
  return imageFit === "contain"
    ? "aspect-video w-full rounded-lg border bg-[#f7f3ea] object-contain object-center p-3"
    : "aspect-video w-full rounded-lg border bg-[#f7f3ea] object-cover object-center";
}

export function ProfileLocationManager({
  rolePrefix,
  initialLocation,
  unavailable,
}: ProfileLocationManagerProps) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [eyebrow, setEyebrow] = useState(initialLocation?.eyebrow ?? fallbackLocation.eyebrow);
  const [title, setTitle] = useState(initialLocation?.title ?? fallbackLocation.title);
  const [description, setDescription] = useState(
    initialLocation?.description ?? fallbackLocation.description
  );
  const [directionLabel, setDirectionLabel] = useState(
    initialLocation?.directionLabel ?? fallbackLocation.directionLabel
  );
  const [directionUrl, setDirectionUrl] = useState(
    initialLocation?.directionUrl ?? fallbackLocation.directionUrl
  );
  const [email, setEmail] = useState(initialLocation?.email ?? fallbackLocation.email);
  const [imageAlt, setImageAlt] = useState(
    initialLocation?.imageAlt ?? fallbackLocation.imageAlt
  );
  const [imageFit, setImageFit] = useState<ProfileImageFit>(
    initialLocation?.imageFit ?? fallbackLocation.imageFit
  );
  const [isActive, setIsActive] = useState(initialLocation?.isActive ?? true);
  const [hours, setHours] = useState<ProfileLocationHour[]>(
    initialLocation?.hours ?? []
  );
  const [hourForm, setHourForm] = useState({
    id: "",
    dayLabel: "",
    timeLabel: "",
    sortOrder: "0",
    isActive: true,
  });
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHourSubmitting, setIsHourSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageRef = useRef<typeof pendingImage>(null);

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

    if (!file) return;

    if (!allowedImageTypes.has(file.type) || !hasAllowedExtension(file.name)) {
      setError("Format gambar tidak didukung. Gunakan WEBP, PNG, JPG, JPEG, atau SVG.");
      return;
    }

    if (file.size > maxImageSize) {
      setError(`${file.name} melebihi 2 MB.`);
      return;
    }

    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      setImageFit("contain");
    }

    setPendingImage((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
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

  function handleDropZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  async function refreshLocation() {
    const response = await fetch(`/api/${rolePrefix}/profile/location`, {
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as {
      data?: ProfileLocationSettings | null;
    } | null;

    if (response.ok && body?.data) {
      setLocation(body.data);
      setHours(body.data.hours);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("eyebrow", eyebrow);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("directionLabel", directionLabel);
      formData.append("directionUrl", directionUrl);
      formData.append("email", email);
      formData.append("imageAlt", imageAlt);
      formData.append("imageFit", imageFit);
      formData.append("isActive", String(isActive));

      if (pendingImage) {
        formData.append("image", pendingImage.file);
      }

      const response = await fetch(`/api/${rolePrefix}/profile/location`, {
        method: "PATCH",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as {
        data?: ProfileLocationSettings;
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Pengaturan lokasi gagal disimpan.");
        return;
      }

      if (body?.data) {
        setLocation(body.data);
        setHours(body.data.hours);
      }
      setPendingImage((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return null;
      });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveHour(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsHourSubmitting(true);

    try {
      const endpoint = hourForm.id
        ? `/api/${rolePrefix}/profile/location/hours/${hourForm.id}`
        : `/api/${rolePrefix}/profile/location/hours`;
      const response = await fetch(endpoint, {
        method: hourForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayLabel: hourForm.dayLabel,
          timeLabel: hourForm.timeLabel,
          sortOrder: hourForm.sortOrder,
          isActive: hourForm.isActive,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: ProfileLocationSettings;
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Jam layanan gagal disimpan.");
        return;
      }

      if (body?.data) {
        setLocation(body.data);
        setHours(body.data.hours);
      } else {
        await refreshLocation();
      }
      setHourForm({ id: "", dayLabel: "", timeLabel: "", sortOrder: "0", isActive: true });
      router.refresh();
    } finally {
      setIsHourSubmitting(false);
    }
  }

  async function deleteHour(hour: ProfileLocationHour) {
    if (!window.confirm(`Hapus jam layanan ${hour.dayLabel}?`)) {
      return;
    }

    const response = await fetch(`/api/${rolePrefix}/profile/location/hours/${hour.id}`, {
      method: "DELETE",
    });
    const body = (await response.json().catch(() => null)) as {
      data?: ProfileLocationSettings;
      error?: string;
    } | null;

    if (!response.ok) {
      setError(body?.error ?? "Jam layanan gagal dihapus.");
      return;
    }

    if (body?.data) {
      setLocation(body.data);
      setHours(body.data.hours);
    } else {
      await refreshLocation();
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <form className="grid gap-4 rounded-xl border bg-white p-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="font-semibold">Pengaturan Lokasi Kami</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit copy, kontak, link arah, dan gambar kanan section lokasi.
          </p>
        </div>

        {unavailable ? (
          <p className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3d23]">
            Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi.
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Eyebrow</Label>
            <Input value={eyebrow} onChange={(event) => setEyebrow(event.currentTarget.value)} maxLength={100} />
          </div>
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.currentTarget.value)} maxLength={150} required />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(event) => setDescription(event.currentTarget.value)} required className="min-h-32" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Direction Label</Label>
            <Input value={directionLabel} onChange={(event) => setDirectionLabel(event.currentTarget.value)} required maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label>Direction URL</Label>
            <Input value={directionUrl} onChange={(event) => setDirectionUrl(event.currentTarget.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Image Fit</Label>
            <Select value={imageFit} onValueChange={(value) => setImageFit(value as ProfileImageFit)}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Pilih tampilan gambar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Penuhi Card</SelectItem>
                <SelectItem value="contain">Tampilkan Utuh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <label className="inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[#0f5b45]"
            checked={isActive}
            onChange={(event) => setIsActive(event.currentTarget.checked)}
          />
          Aktif tampil di publik
        </label>

        <div className="grid gap-2">
          <Label>Image Alt</Label>
          <Input value={imageAlt} onChange={(event) => setImageAlt(event.currentTarget.value)} maxLength={150} />
        </div>

        <div className="grid gap-2">
          <Label>Location Image</Label>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".webp,.png,.jpg,.jpeg,.svg,image/webp,image/png,image/jpeg,image/svg+xml"
            className="sr-only"
            onChange={handleImageSelection}
          />
          <div
            role="button"
            tabIndex={0}
            className={`grid cursor-pointer place-items-center rounded-lg border border-dashed px-4 py-8 text-center text-sm ${
              isDragging ? "border-[#0f5b45] bg-[#eef9f1]" : "border-[#d8d4c8] bg-[#fffdf9]"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onKeyDown={handleDropZoneKeyDown}
          >
            <Upload className="mb-2 size-5" />
            Drop gambar di sini atau klik untuk memilih
          </div>
          {pendingImage || location?.imageUrl ? (
            <Image
              src={pendingImage?.previewUrl ?? location?.imageUrl ?? ""}
              alt={imageAlt || "Preview lokasi"}
              width={800}
              height={450}
              unoptimized
              className={getPreviewImageClass(imageFit)}
            />
          ) : null}
        </div>

        {error ? (
          <p className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3d23]">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Menyimpan..." : "Simpan Lokasi"}
        </Button>
      </form>

      <div className="grid content-start gap-4 rounded-xl border bg-white p-4">
        <div>
          <h2 className="font-semibold">Jam Operasional</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambah, edit, hapus, dan urutkan baris jam layanan.
          </p>
        </div>

        <div className="grid gap-3">
          {hours.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Belum ada jam layanan.
            </p>
          ) : (
            hours.map((hour) => (
              <div key={hour.id} className="grid gap-2 rounded-lg border bg-[#fffdf9] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{hour.dayLabel}</p>
                    <p className="text-sm text-muted-foreground">{hour.timeLabel}</p>
                  </div>
                  <Badge variant={hour.isActive ? "secondary" : "outline"}>
                    {hour.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Urutan: {hour.sortOrder}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setHourForm({
                        id: hour.id,
                        dayLabel: hour.dayLabel,
                        timeLabel: hour.timeLabel,
                        sortOrder: String(hour.sortOrder),
                        isActive: hour.isActive,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => deleteHour(hour)}>
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="grid gap-3 border-t pt-4" onSubmit={saveHour}>
          <h3 className="text-sm font-semibold">
            {hourForm.id ? "Edit Jam Layanan" : "Tambah Jam Layanan"}
          </h3>
          <div className="grid gap-2">
            <Label>Day Label</Label>
            <Input value={hourForm.dayLabel} onChange={(event) => setHourForm({ ...hourForm, dayLabel: event.currentTarget.value })} required maxLength={100} />
          </div>
          <div className="grid gap-2">
            <Label>Time Label</Label>
            <Input value={hourForm.timeLabel} onChange={(event) => setHourForm({ ...hourForm, timeLabel: event.currentTarget.value })} required maxLength={100} />
          </div>
          <div className="grid gap-2">
            <Label>Sort Order</Label>
            <Input type="number" value={hourForm.sortOrder} onChange={(event) => setHourForm({ ...hourForm, sortOrder: event.currentTarget.value })} />
          </div>
          <label className="inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[#0f5b45]"
              checked={hourForm.isActive}
              onChange={(event) => setHourForm({ ...hourForm, isActive: event.currentTarget.checked })}
            />
            Aktif
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isHourSubmitting}>
              <Plus className="size-4" />
              {isHourSubmitting ? "Menyimpan..." : hourForm.id ? "Simpan Jam" : "Tambah Jam"}
            </Button>
            {hourForm.id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setHourForm({ id: "", dayLabel: "", timeLabel: "", sortOrder: "0", isActive: true })}
              >
                Batal Edit
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
