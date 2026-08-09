"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";

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
import { confirmToast } from "@/lib/confirm-toast";
import type {
  ProfileStructureNode,
  ProfileStructureNodeType,
  ProfileStructureSettings,
} from "@/lib/profile-structure-cms";

type ProfileStructureManagerProps = {
  rolePrefix: "admin" | "staff";
  initialSettings: ProfileStructureSettings | null;
  initialNodes: ProfileStructureNode[];
  unavailable: boolean;
};

const nodeTypeOptions: Array<{ value: ProfileStructureNodeType; label: string }> = [
  { value: "primary", label: "Utama / Lebar" },
  { value: "standard", label: "Menengah" },
  { value: "leaf", label: "Kecil / Leaf" },
];

function flattenTree(
  nodes: ProfileStructureNode[],
  depth = 0
): Array<{ node: ProfileStructureNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

function buildTree(nodes: ProfileStructureNode[]) {
  const byId = new Map<string, ProfileStructureNode>();
  const roots: ProfileStructureNode[] = [];

  nodes.forEach((node) => byId.set(node.id, { ...node, children: [] }));
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (items: ProfileStructureNode[]) => {
    items.sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
    items.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);
  return roots;
}

function descendantsOf(nodes: ProfileStructureNode[], nodeId: string): Set<string> {
  const result = new Set<string>();
  const target = nodes.find((node) => node.id === nodeId);

  function visit(node: ProfileStructureNode | undefined) {
    node?.children.forEach((child) => {
      result.add(child.id);
      visit(child);
    });
  }

  visit(target);
  return result;
}

function emptyNodeForm() {
  return {
    id: "",
    parentId: "root",
    label: "",
    nodeType: "standard" as ProfileStructureNodeType,
    isActive: true,
    sortOrder: "0",
  };
}

export function ProfileStructureManager({
  rolePrefix,
  initialSettings,
  initialNodes,
  unavailable,
}: ProfileStructureManagerProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [settingsDraft, setSettingsDraft] = useState({
    title: initialSettings?.title ?? "Struktur Organisasi ULT",
    subtitle: initialSettings?.subtitle ?? "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [nodes, setNodes] = useState(initialNodes);
  const [nodeForm, setNodeForm] = useState(emptyNodeForm);
  const [isSubmittingNode, setIsSubmittingNode] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [newItemContent, setNewItemContent] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemContent, setEditingItemContent] = useState("");
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const flatNodes = useMemo(() => flattenTree(tree), [tree]);
  const blockedParentIds = nodeForm.id ? descendantsOf(tree, nodeForm.id) : new Set<string>();
  const activeNode = activeNodeId ? nodes.find((node) => node.id === activeNodeId) ?? null : null;

  function flash(kind: "error" | "message", text: string) {
    if (kind === "error") {
      setError(text);
      setMessage("");
    } else {
      setMessage(text);
      setError("");
    }
  }

  async function refreshState() {
    const response = await fetch(`/api/${rolePrefix}/profile/structure`, {
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as {
      data?: {
        settings: ProfileStructureSettings | null;
        nodes: ProfileStructureNode[];
      };
    } | null;

    if (response.ok && body?.data) {
      setSettings(body.data.settings);
      setNodes(body.data.nodes);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSavingSettings(true);

    try {
      const response = await fetch(`/api/${rolePrefix}/profile/structure/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        flash("error", body?.error ?? "Pengaturan section gagal disimpan.");
        return;
      }

      await refreshState();
      flash("message", "Pengaturan section berhasil disimpan.");
      router.refresh();
    } finally {
      setIsSavingSettings(false);
    }
  }

  function startEditNode(node: ProfileStructureNode) {
    setError("");
    setNodeForm({
      id: node.id,
      parentId: node.parentId ?? "root",
      label: node.label,
      nodeType: node.nodeType,
      isActive: node.isActive,
      sortOrder: String(node.sortOrder),
    });
  }

  function startAddChild(parentId: string) {
    setError("");
    setNodeForm({ ...emptyNodeForm(), parentId });
  }

  function resetNodeForm() {
    setError("");
    setNodeForm(emptyNodeForm());
  }

  async function submitNodeForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmittingNode(true);

    try {
      const payload = {
        parentId: nodeForm.parentId,
        label: nodeForm.label,
        nodeType: nodeForm.nodeType,
        isActive: nodeForm.isActive,
        sortOrder: nodeForm.sortOrder,
      };

      const endpoint = nodeForm.id
        ? `/api/${rolePrefix}/profile/structure/nodes/${nodeForm.id}`
        : `/api/${rolePrefix}/profile/structure/nodes`;

      const response = await fetch(endpoint, {
        method: nodeForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        flash("error", body?.error ?? "Node struktur gagal disimpan.");
        return;
      }

      await refreshState();
      flash("message", nodeForm.id ? "Node berhasil diperbarui." : "Node berhasil ditambahkan.");
      resetNodeForm();
      router.refresh();
    } finally {
      setIsSubmittingNode(false);
    }
  }

  async function toggleNodeActive(node: ProfileStructureNode) {
    setError("");

    const response = await fetch(`/api/${rolePrefix}/profile/structure/nodes/${node.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId: node.parentId ?? "root",
        label: node.label,
        nodeType: node.nodeType,
        isActive: !node.isActive,
        sortOrder: node.sortOrder,
      }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      flash("error", body?.error ?? "Status node gagal diperbarui.");
      return;
    }

    await refreshState();
    router.refresh();
  }

  async function deleteNode(node: ProfileStructureNode, cascade: boolean) {
    const response = await fetch(
      `/api/${rolePrefix}/profile/structure/nodes/${node.id}${cascade ? "?cascade=true" : ""}`,
      { method: "DELETE" }
    );
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      return body?.error ?? "Node struktur gagal dihapus.";
    }

    return null;
  }

  async function handleDeleteNode(node: ProfileStructureNode) {
    const hasChildren = node.children.length > 0;

    if (
      !(await confirmToast({
        title: "Hapus node struktur?",
        description: hasChildren
          ? `"${node.label}" masih memiliki node turunan. Menghapus node ini juga akan menghapus seluruh turunannya. Lanjutkan?`
          : `Hapus "${node.label}"? Tindakan ini tidak bisa dibatalkan.`,
        confirmLabel: "Hapus",
        variant: "destructive",
      }))
    ) {
      return;
    }

    setError("");
    const errorMessage = await deleteNode(node, hasChildren);

    if (errorMessage) {
      flash("error", errorMessage);
      return;
    }

    if (activeNodeId === node.id) {
      setActiveNodeId(null);
    }

    await refreshState();
    flash("message", "Node struktur berhasil dihapus.");
    router.refresh();
  }

  async function addItem() {
    if (!activeNode) return;
    const content = newItemContent.trim();
    if (!content) return;

    setError("");
    setIsAddingItem(true);

    try {
      const response = await fetch(`/api/${rolePrefix}/profile/structure/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: activeNode.id,
          content,
          sortOrder: activeNode.items.length + 1,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        flash("error", body?.error ?? "Isian gagal ditambahkan.");
        return;
      }

      setNewItemContent("");
      await refreshState();
      router.refresh();
    } finally {
      setIsAddingItem(false);
    }
  }

  function handleAddItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addItem();
  }

  function startEditItem(itemId: string, content: string) {
    setError("");
    setEditingItemId(itemId);
    setEditingItemContent(content);
  }

  function cancelEditItem() {
    setEditingItemId(null);
    setEditingItemContent("");
  }

  async function saveItem(itemId: string, sortOrder: number, isActive: boolean) {
    const content = editingItemContent.trim();

    if (!content) {
      flash("error", "Isi tidak boleh kosong.");
      return;
    }

    setError("");
    setSavingItemId(itemId);

    try {
      const response = await fetch(`/api/${rolePrefix}/profile/structure/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sortOrder, isActive }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        flash("error", body?.error ?? "Isian gagal diperbarui.");
        return;
      }

      cancelEditItem();
      await refreshState();
      router.refresh();
    } finally {
      setSavingItemId(null);
    }
  }

  async function toggleItemActive(itemId: string, content: string, sortOrder: number, isActive: boolean) {
    setError("");

    const response = await fetch(`/api/${rolePrefix}/profile/structure/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, sortOrder, isActive: !isActive }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      flash("error", body?.error ?? "Status isian gagal diperbarui.");
      return;
    }

    await refreshState();
    router.refresh();
  }

  async function deleteItem(itemId: string, content: string) {
    if (
      !(await confirmToast({
        title: "Hapus isian?",
        description: `Hapus baris "${content}"?`,
        confirmLabel: "Hapus",
        variant: "destructive",
      }))
    ) {
      return;
    }

    setError("");
    const response = await fetch(`/api/${rolePrefix}/profile/structure/items/${itemId}`, {
      method: "DELETE",
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      flash("error", body?.error ?? "Isian gagal dihapus.");
      return;
    }

    await refreshState();
    router.refresh();
  }

  return (
    <div className="grid min-w-0 gap-4">
      {unavailable ? (
        <p className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] p-4 text-center text-sm text-[#6f746f]">
          Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-[#edd2c5] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3d23]">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-md border border-[#cce3d3] bg-[#eef9f1] px-3 py-2 text-sm text-[#2f6b44]">
          {message}
        </p>
      ) : null}

      <form
        className="grid min-w-0 gap-3 rounded-lg border border-[#e3d9ca] bg-white p-4"
        data-tour="admin-profile-structure-settings"
        onSubmit={saveSettings}
      >
        <div>
          <h2 className="text-sm font-semibold text-[#173d2d]">Pengaturan Section</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-[#7a7166]">
            Judul dan subjudul bagian Struktur Organisasi ULT di halaman publik.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Judul Section</Label>
            <Input
              value={settingsDraft.title}
              onChange={(event) =>
                setSettingsDraft((current) => ({ ...current, title: event.currentTarget.value }))
              }
              maxLength={150}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Subjudul Section</Label>
            <Input
              value={settingsDraft.subtitle}
              onChange={(event) =>
                setSettingsDraft((current) => ({ ...current, subtitle: event.currentTarget.value }))
              }
              maxLength={255}
            />
          </div>
        </div>
        <div>
          <Button type="submit" size="sm" disabled={isSavingSettings}>
            {isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
        {settings?.updatedAt ? (
          <p className="text-[11px] text-[#8a8175]">
            Terakhir diperbarui {new Date(settings.updatedAt).toLocaleString("id-ID")}
            {settings.updatedBy ? ` oleh ${settings.updatedBy}` : ""}
          </p>
        ) : null}
      </form>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
        <div
          className="min-w-0 overflow-hidden rounded-lg border border-[#e3d9ca] bg-white"
          data-tour="admin-profile-structure-list"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#eee6d9] bg-[#fffdf9] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#173d2d]">Daftar Node Struktur</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7a7166]">
                Atur parent, urutan, jenis tampilan, dan status aktif tiap node.
              </p>
            </div>
            <Button type="button" size="sm" onClick={() => startAddChild("root")}>
              <Plus className="size-4" />
              Tambah Node
            </Button>
          </div>
          <div className="grid min-w-0 gap-2 p-3 sm:p-4">
            {nodes.length === 0 ? (
              <p className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] p-4 text-center text-sm text-[#6f746f]">
                {unavailable
                  ? "Koneksi database sedang tidak tersedia. Coba lagi beberapa saat lagi."
                  : "Belum ada node struktur organisasi."}
              </p>
            ) : (
              flatNodes.map(({ node, depth }) => (
                <div
                  key={node.id}
                  className={`grid min-w-0 gap-2 rounded-md border p-3 shadow-[0_1px_4px_rgba(47,38,20,0.05)] ${
                    activeNodeId === node.id
                      ? "border-[#0f5b45] bg-[#f3fbf6]"
                      : "border-[#e3d9ca] bg-white"
                  }`}
                  style={{ marginLeft: `${Math.min(depth, 4) * 16}px` }}
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-semibold text-[#202923]">
                      {node.label}
                    </p>
                    <Badge
                      variant="outline"
                      className="rounded-sm border-[#d8d4c8] bg-[#fffdf9] px-2 py-0.5 text-[10px] font-semibold text-[#566258]"
                    >
                      {nodeTypeOptions.find((option) => option.value === node.nodeType)?.label ??
                        node.nodeType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        node.isActive
                          ? "rounded-sm border-[#cce3d3] bg-[#eef9f1] px-2.5 py-0.5 text-[10px] font-semibold text-[#2f6b44]"
                          : "rounded-sm border-[#d7d9e5] bg-[#f4f5fa] px-2.5 py-0.5 text-[10px] font-semibold text-[#4e5566]"
                      }
                    >
                      {node.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="break-words text-[11px] text-[#7a7166]">
                    Parent: {node.parentId ?? "Root"} | Urutan: {node.sortOrder} | Isian:{" "}
                    {node.items.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                      onClick={() => setActiveNodeId(node.id)}
                    >
                      Kelola Isian
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                      onClick={() => startEditNode(node)}
                    >
                      <Edit className="size-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                      onClick={() => startAddChild(node.id)}
                    >
                      <Plus className="size-4" />
                      Tambah Child
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                      onClick={() => toggleNodeActive(node)}
                    >
                      {node.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-8 rounded-md px-3 text-[11px] font-semibold"
                      onClick={() => handleDeleteNode(node)}
                    >
                      <Trash2 className="size-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid min-w-0 gap-4 xl:sticky xl:top-4">
          <form
            className="grid min-w-0 content-start gap-4 rounded-lg border border-[#e3d9ca] bg-white p-4"
            data-tour="admin-profile-structure-form"
            onSubmit={submitNodeForm}
          >
            <div>
              <h2 className="text-sm font-semibold text-[#173d2d]">
                {nodeForm.id ? "Edit Node Struktur" : "Tambah Node Struktur"}
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7a7166]">
                Parent Root berarti node berada di level paling atas.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Label Node</Label>
              <Input
                value={nodeForm.label}
                onChange={(event) =>
                  setNodeForm({ ...nodeForm, label: event.currentTarget.value })
                }
                required
                maxLength={150}
                data-tour="admin-profile-structure-label"
              />
            </div>

            <div className="grid gap-2">
              <Label>Parent / Atasan</Label>
              <Select
                value={nodeForm.parentId}
                onValueChange={(value) => setNodeForm({ ...nodeForm, parentId: value })}
              >
                <SelectTrigger className="w-full bg-white" data-tour="admin-profile-structure-parent">
                  <SelectValue placeholder="Pilih parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Tidak ada parent / Root</SelectItem>
                  {flatNodes.map(({ node, depth }) => (
                    <SelectItem
                      key={node.id}
                      value={node.id}
                      disabled={node.id === nodeForm.id || blockedParentIds.has(node.id)}
                    >
                      {"- ".repeat(depth)}
                      {node.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Jenis / Layout</Label>
                <Select
                  value={nodeForm.nodeType}
                  onValueChange={(value) =>
                    setNodeForm({ ...nodeForm, nodeType: value as ProfileStructureNodeType })
                  }
                >
                  <SelectTrigger className="w-full bg-white" data-tour="admin-profile-structure-type">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={nodeForm.sortOrder}
                  onChange={(event) =>
                    setNodeForm({ ...nodeForm, sortOrder: event.currentTarget.value })
                  }
                  data-tour="admin-profile-structure-order"
                />
              </div>
            </div>

            <label
              className="inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm"
              data-tour="admin-profile-structure-active"
            >
              <input
                type="checkbox"
                className="size-4 accent-[#0f5b45]"
                checked={nodeForm.isActive}
                onChange={(event) =>
                  setNodeForm({ ...nodeForm, isActive: event.currentTarget.checked })
                }
              />
              Aktif tampil di publik
            </label>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button type="submit" disabled={isSubmittingNode} data-tour="admin-profile-structure-save">
                <Plus className="size-4" />
                {isSubmittingNode
                  ? "Menyimpan..."
                  : nodeForm.id
                    ? "Simpan Perubahan"
                    : "Tambah Node"}
              </Button>
              {nodeForm.id || nodeForm.parentId !== "root" ? (
                <Button type="button" variant="outline" onClick={resetNodeForm}>
                  Batal
                </Button>
              ) : null}
            </div>
          </form>

          {activeNode ? (
            <div
              className="grid min-w-0 gap-3 rounded-lg border border-[#e3d9ca] bg-white p-4"
              data-tour="admin-profile-structure-items"
            >
              <div>
                <h2 className="text-sm font-semibold text-[#173d2d]">
                  Isian: {activeNode.label}
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-[#7a7166]">
                  Baris isi yang tampil di dalam kotak node ini pada halaman publik.
                </p>
              </div>

              {activeNode.items.length === 0 ? (
                <p className="rounded-md border border-[#edf0e9] bg-[#fbfdf9] p-3 text-center text-xs text-[#6f746f]">
                  Belum ada isian.
                </p>
              ) : (
                <div className="grid gap-2">
                  {activeNode.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid min-w-0 gap-2 rounded-md border border-[#e3d9ca] bg-white p-3"
                    >
                      {editingItemId === item.id ? (
                        <Input
                          value={editingItemContent}
                          onChange={(event) => setEditingItemContent(event.currentTarget.value)}
                          maxLength={255}
                          autoFocus
                        />
                      ) : (
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="break-words text-sm text-[#202923]">{item.content}</p>
                          {!item.isActive ? (
                            <Badge
                              variant="outline"
                              className="rounded-sm border-[#d7d9e5] bg-[#f4f5fa] px-2 py-0.5 text-[10px] font-semibold text-[#4e5566]"
                            >
                              Nonaktif
                            </Badge>
                          ) : null}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {editingItemId === item.id ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={savingItemId === item.id}
                              onClick={() => saveItem(item.id, item.sortOrder, item.isActive)}
                            >
                              {savingItemId === item.id ? "Menyimpan..." : "Simpan"}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={cancelEditItem}>
                              Batal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                              onClick={() => startEditItem(item.id, item.content)}
                            >
                              <Edit className="size-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-md border-[#e1d8ca] px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                              onClick={() =>
                                toggleItemActive(item.id, item.content, item.sortOrder, item.isActive)
                              }
                            >
                              {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 rounded-md px-3 text-[11px] font-semibold"
                              onClick={() => deleteItem(item.id, item.content)}
                            >
                              <Trash2 className="size-4" />
                              Hapus
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form className="flex flex-wrap gap-2 border-t border-[#eee6d9] pt-3" onSubmit={handleAddItemSubmit}>
                <Input
                  value={newItemContent}
                  onChange={(event) => setNewItemContent(event.currentTarget.value)}
                  placeholder="Tambah baris isi baru"
                  maxLength={255}
                  className="max-w-md"
                />
                <Button type="submit" size="sm" disabled={isAddingItem}>
                  <Plus className="size-4" />
                  {isAddingItem ? "Menambahkan..." : "Tambah"}
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
