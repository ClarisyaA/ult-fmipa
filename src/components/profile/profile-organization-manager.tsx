"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Edit, Plus, Trash2, Upload, UserRound } from "lucide-react";

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
import type {
  ProfileColorVariant,
  ProfileOrganizationNode,
} from "@/lib/profile-cms";

type ProfileOrganizationManagerProps = {
  rolePrefix: "admin" | "staff";
  initialNodes: ProfileOrganizationNode[];
  unavailable: boolean;
};

const maxImageSize = 2 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/svg+xml",
]);
const allowedImageExtensions = [".webp", ".png", ".jpg", ".jpeg", ".svg"];

const colorOptions: Array<{ value: ProfileColorVariant; label: string }> = [
  { value: "emerald", label: "Hijau" },
  { value: "red", label: "Merah" },
  { value: "amber", label: "Kuning" },
];

function hasAllowedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return allowedImageExtensions.some((extension) => lowerName.endsWith(extension));
}

function flattenTree(
  nodes: ProfileOrganizationNode[],
  depth = 0
): Array<{ node: ProfileOrganizationNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

function buildTree(nodes: ProfileOrganizationNode[]) {
  const byId = new Map<string, ProfileOrganizationNode>();
  const roots: ProfileOrganizationNode[] = [];

  nodes.forEach((node) => byId.set(node.id, { ...node, children: [] }));
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (items: ProfileOrganizationNode[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
    items.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);
  return roots;
}

function descendantsOf(nodes: ProfileOrganizationNode[], nodeId: string): Set<string> {
  const result = new Set<string>();
  const target = nodes.find((node) => node.id === nodeId);

  function visit(node: ProfileOrganizationNode | undefined) {
    node?.children.forEach((child) => {
      result.add(child.id);
      visit(child);
    });
  }

  visit(target);
  return result;
}

function emptyForm() {
  return {
    id: "",
    parentId: "root",
    name: "",
    positionTitle: "",
    roleLabel: "",
    photoAlt: "",
    colorVariant: "emerald" as ProfileColorVariant,
    isActive: true,
    sortOrder: "0",
    existingPhotoUrl: "",
  };
}

function getRoleLabelFromPosition(positionTitle: string) {
  return positionTitle.slice(0, 100);
}

export function ProfileOrganizationManager({
  rolePrefix,
  initialNodes,
  unavailable,
}: ProfileOrganizationManagerProps) {
  const router = useRouter();
  const [nodes, setNodes] = useState(initialNodes);
  const [form, setForm] = useState(emptyForm);
  const [pendingPhoto, setPendingPhoto] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingPhotoRef = useRef<typeof pendingPhoto>(null);
  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const flatNodes = useMemo(() => flattenTree(tree), [tree]);
  const blockedParentIds = form.id ? descendantsOf(tree, form.id) : new Set<string>();

  useEffect(() => {
    pendingPhotoRef.current = pendingPhoto;
  }, [pendingPhoto]);

  useEffect(() => {
    return () => {
      if (pendingPhotoRef.current) {
        URL.revokeObjectURL(pendingPhotoRef.current.previewUrl);
      }
    };
  }, []);

  function selectPhotoFile(file: File | null) {
    setError("");

    if (!file) return;

    if (!allowedImageTypes.has(file.type) || !hasAllowedExtension(file.name)) {
      setError("Format foto tidak didukung. Gunakan WEBP, PNG, JPG, JPEG, atau SVG.");
      return;
    }

    if (file.size > maxImageSize) {
      setError(`${file.name} melebihi 2 MB.`);
      return;
    }

    setPendingPhoto((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }

  function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    selectPhotoFile(event.currentTarget.files?.[0] ?? null);
    event.currentTarget.value = "";
  }

  function startEdit(node: ProfileOrganizationNode) {
    setError("");
    setPendingPhoto((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    setForm({
      id: node.id,
      parentId: node.parentId ?? "root",
      name: node.name,
      positionTitle: node.positionTitle,
      roleLabel: getRoleLabelFromPosition(node.positionTitle),
      photoAlt: node.photoAlt ?? "",
      colorVariant: node.colorVariant,
      isActive: node.isActive,
      sortOrder: String(node.sortOrder),
      existingPhotoUrl: node.photoUrl ?? "",
    });
  }

  function resetForm() {
    setError("");
    setPendingPhoto((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    setForm(emptyForm());
  }

  async function refreshNodes() {
    const response = await fetch(`/api/${rolePrefix}/profile/organization`, {
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as {
      data?: ProfileOrganizationNode[];
    } | null;

    if (response.ok && body?.data) {
      setNodes(body.data);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("parentId", form.parentId);
      formData.append("name", form.name);
      formData.append("positionTitle", form.positionTitle);
      formData.append("roleLabel", getRoleLabelFromPosition(form.positionTitle));
      formData.append("photoAlt", form.photoAlt);
      formData.append("colorVariant", form.colorVariant);
      formData.append("isActive", String(form.isActive));
      formData.append("sortOrder", form.sortOrder);

      if (pendingPhoto) {
        formData.append("image", pendingPhoto.file);
      }

      const endpoint = form.id
        ? `/api/${rolePrefix}/profile/organization/${form.id}`
        : `/api/${rolePrefix}/profile/organization`;
      const response = await fetch(endpoint, {
        method: form.id ? "PATCH" : "POST",
        body: formData,
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "Struktur organisasi gagal disimpan.");
        return;
      }

      await refreshNodes();
      resetForm();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(node: ProfileOrganizationNode) {
    const formData = new FormData();
    formData.append("parentId", node.parentId ?? "root");
    formData.append("name", node.name);
    formData.append("positionTitle", node.positionTitle);
    formData.append("roleLabel", getRoleLabelFromPosition(node.positionTitle));
    formData.append("photoAlt", node.photoAlt ?? "");
    formData.append("colorVariant", node.colorVariant);
    formData.append("isActive", String(!node.isActive));
    formData.append("sortOrder", String(node.sortOrder));

    const response = await fetch(`/api/${rolePrefix}/profile/organization/${node.id}`, {
      method: "PATCH",
      body: formData,
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(body?.error ?? "Status node gagal diperbarui.");
      return;
    }

    await refreshNodes();
    router.refresh();
  }

  async function deleteNode(node: ProfileOrganizationNode) {
    if (
      !window.confirm(
        `Hapus ${node.name}? Node yang masih punya bawahan akan ditolak.`
      )
    ) {
      return;
    }

    const response = await fetch(`/api/${rolePrefix}/profile/organization/${node.id}`, {
      method: "DELETE",
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(body?.error ?? "Node struktur gagal dihapus.");
      return;
    }

    await refreshNodes();
    router.refresh();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectPhotoFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleDropZoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-xl border bg-white">
        <div className="border-b p-4">
          <h2 className="font-semibold">Daftar Struktur</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Atur atasan, cabang, urutan, dan status aktif.
          </p>
        </div>
        <div className="grid gap-3 p-4">
          {nodes.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {unavailable
                ? "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
                : "Belum ada node struktur organisasi."}
            </p>
          ) : (
            flatNodes.map(({ node, depth }) => (
              <div
                key={node.id}
                className="grid gap-3 rounded-lg border border-[#eee6d9] bg-[#fffdf9] p-3 md:grid-cols-[auto_1fr_auto]"
                style={{ marginLeft: `${Math.min(depth, 4) * 18}px` }}
              >
                <div className="grid size-14 place-items-center overflow-hidden rounded-full border bg-white">
                  {node.photoUrl ? (
                    <Image
                      src={node.photoUrl}
                      alt={node.photoAlt ?? node.name}
                      width={96}
                      height={96}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{node.name}</p>
                    <Badge variant={node.isActive ? "secondary" : "outline"}>
                      {node.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {node.positionTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Parent: {node.parentId ?? "Root"} | Urutan: {node.sortOrder}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button type="button" size="sm" variant="outline" onClick={() => startEdit(node)}>
                    <Edit className="size-4" />
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => toggleActive(node)}>
                    {node.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => deleteNode(node)}>
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <form className="grid content-start gap-4 rounded-xl border bg-white p-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="font-semibold">
            {form.id ? "Edit Node Struktur" : "Tambah Node Struktur"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan root, koordinator, atau staff sesuai kebutuhan.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Nama Orang</Label>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.currentTarget.value })} required maxLength={150} />
        </div>

        <div className="grid gap-2">
          <Label>Jabatan / Position Title</Label>
          <Input
            value={form.positionTitle}
            onChange={(event) => {
              const positionTitle = event.currentTarget.value;
              setForm({
                ...form,
                positionTitle,
                roleLabel: getRoleLabelFromPosition(positionTitle),
              });
            }}
            required
            maxLength={150}
          />
        </div>

        <div className="grid gap-2">
          <Label>Label Role</Label>
          <Input
            value={form.roleLabel}
            readOnly
            maxLength={100}
            className="bg-muted/40 text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Label role otomatis mengikuti Jabatan / Position Title.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Parent / Atasan</Label>
          <Select value={form.parentId} onValueChange={(value) => setForm({ ...form, parentId: value })}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Pilih atasan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Tidak ada atasan / Root</SelectItem>
              {flatNodes.map(({ node, depth }) => (
                <SelectItem
                  key={node.id}
                  value={node.id}
                  disabled={node.id === form.id || blockedParentIds.has(node.id)}
                >
                  {"- ".repeat(depth)}
                  {node.name} - {node.positionTitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Urutan</Label>
            <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.currentTarget.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Warna Cabang</Label>
            <Select value={form.colorVariant} onValueChange={(value) => setForm({ ...form, colorVariant: value as ProfileColorVariant })}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Pilih warna" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <label className="inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[#0f5b45]"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.currentTarget.checked })}
          />
          Aktif tampil di publik
        </label>

        <div className="grid gap-2">
          <Label>Alt Foto</Label>
          <Input value={form.photoAlt} onChange={(event) => setForm({ ...form, photoAlt: event.currentTarget.value })} maxLength={150} />
        </div>

        <div className="grid gap-2">
          <Label>Foto</Label>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".webp,.png,.jpg,.jpeg,.svg,image/webp,image/png,image/jpeg,image/svg+xml"
            className="sr-only"
            onChange={handlePhotoSelection}
          />
          <div
            role="button"
            tabIndex={0}
            className={`grid cursor-pointer place-items-center rounded-lg border border-dashed px-4 py-6 text-center text-sm ${
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
            Drop foto di sini atau klik untuk memilih
          </div>
          {pendingPhoto || form.existingPhotoUrl ? (
            <Image
              src={pendingPhoto?.previewUrl ?? form.existingPhotoUrl}
              alt="Preview foto"
              width={240}
              height={240}
              unoptimized
              className="size-28 rounded-full border bg-[#f7f3ea] object-cover"
            />
          ) : null}
        </div>

        {error ? (
          <p className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3d23]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button type="submit" disabled={isSubmitting}>
            <Plus className="size-4" />
            {isSubmitting ? "Menyimpan..." : form.id ? "Simpan Perubahan" : "Tambah Node"}
          </Button>
          {form.id ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Batal Edit
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
