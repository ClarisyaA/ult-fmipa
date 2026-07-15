"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { confirmToast } from "@/lib/confirm-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type {
  ServiceSuggestionStatus,
} from "@/lib/service-suggestions";

export type ServiceSuggestionViewItem = {
  id: string;
  nama: string;
  npm: string;
  layananDiajukan: string;
  detailLayanan: string;
  saranPeningkatan: string | null;
  status: ServiceSuggestionStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type ServiceSuggestionsViewProps = {
  title: string;
  description: string;
  rolePrefix: "admin" | "staff";
  suggestions: ServiceSuggestionViewItem[];
};

const statusLabels: Record<ServiceSuggestionStatus, string> = {
  new: "Baru",
  reviewed: "Ditinjau",
  archived: "Diarsipkan",
};

const statusClasses: Record<ServiceSuggestionStatus, string> = {
  new: "border-amber-200 bg-amber-50 text-amber-700",
  reviewed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-50 text-slate-600",
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object") {
    if ("error" in body && typeof body.error === "string") {
      return body.error;
    }

    if ("message" in body && typeof body.message === "string") {
      return body.message;
    }
  }

  return fallback;
}

function StatusBadge({ status }: { status: ServiceSuggestionStatus }) {
  return (
    <Badge className={`rounded-full border px-2.5 py-1 ${statusClasses[status]}`}>
      {statusLabels[status]}
    </Badge>
  );
}

function FieldBlock({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="grid gap-1 rounded-lg border border-[#e8dfd0] bg-[#fffdf9] p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a8174]">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#222823]">
        {value || "-"}
      </p>
    </div>
  );
}

export function ServiceSuggestionsView({
  title,
  description,
  rolePrefix,
  suggestions,
}: ServiceSuggestionsViewProps) {
  const [items, setItems] = useState(suggestions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const canDelete = rolePrefix === "admin";
  const newCount = items.filter((item) => item.status === "new").length;

  function openDetail(item: ServiceSuggestionViewItem) {
    setSelectedId(item.id);
    setNote(item.adminNote ?? "");
  }

  async function updateStatus(id: string, status: ServiceSuggestionStatus) {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/${rolePrefix}/service-suggestions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNote: note,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: ServiceSuggestionViewItem;
      } | null;

      if (!response.ok || !body?.data) {
        const message = getErrorMessage(
          body,
          "Status usulan layanan gagal diperbarui.",
        );
        toast.error(message);
        return;
      }

      setItems((current) =>
        current.map((item) => (item.id === id ? body.data! : item)),
      );
      setNote(body.data.adminNote ?? "");
      toast.success("Status usulan layanan berhasil diperbarui.");
    } catch {
      toast.error("Status usulan layanan gagal diperbarui.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function deleteSuggestion(item: ServiceSuggestionViewItem) {
    const confirmed = await confirmToast({
      title: "Hapus usulan layanan?",
      description:
        "Hapus usulan layanan ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
      confirmLabel: "Hapus",
      variant: "destructive",
    });

    if (!confirmed) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/${rolePrefix}/service-suggestions/${item.id}`,
        {
          method: "DELETE",
        },
      );
      const body = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message = getErrorMessage(
          body,
          "Usulan layanan gagal dihapus.",
        );
        toast.error(message);
        return;
      }

      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      if (selectedId === item.id) {
        setSelectedId(null);
      }
      toast.success("Usulan layanan berhasil dihapus.");
    } catch {
      toast.error("Usulan layanan gagal dihapus.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <header className="min-w-0 rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-sm">
        <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-[#1f261f]">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6f766f]">
              {description}
            </p>
          </div>
          <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left sm:w-auto sm:min-w-32 sm:text-right">
            <p className="text-2xl font-black text-amber-700">{newCount}</p>
            <p className="text-xs font-semibold text-amber-700">Usulan baru</p>
          </div>
        </div>
      </header>

      <section
        className="overflow-hidden rounded-2xl border border-[#e8dfd0] bg-white shadow-sm"
        data-tour="admin-service-suggestions-list"
      >
        <div className="grid gap-3 p-4 md:hidden">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid gap-3 rounded-xl border border-[#efe7da] bg-[#fffdf9] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-[#1f261f]">
                    {item.layananDiajukan}
                  </p>
                  <p className="mt-1 text-xs text-[#6f766f]">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="grid gap-1 text-sm">
                <p className="font-semibold text-[#1f261f]">{item.nama}</p>
                <p className="text-[#6f766f]">NPM: {item.npm}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openDetail(item)}
                >
                  Detail
                </Button>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => deleteSuggestion(item)}
                  >
                    Hapus
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#efe7da] px-4 py-10 text-center text-sm text-[#7a746b]">
              Belum ada usulan layanan.
            </div>
          ) : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#f3f8f4] text-xs uppercase tracking-[0.08em] text-[#536058]">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">NPM</th>
                <th className="px-4 py-3">Layanan yang ingin diajukan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efe7da]">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3 text-[#5f665f]">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1f261f]">
                    {item.nama}
                  </td>
                  <td className="px-4 py-3 text-[#5f665f]">{item.npm}</td>
                  <td className="px-4 py-3 font-semibold text-[#1f261f]">
                    {item.layananDiajukan}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDetail(item)}
                    >
                      Detail
                    </Button>
                    {canDelete ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => deleteSuggestion(item)}
                      >
                        Hapus
                      </Button>
                    ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-[#7a746b]"
                  >
                    Belum ada usulan layanan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent
          className="max-h-[86vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl"
          data-tour="admin-service-suggestions-detail"
        >
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Detail Usulan Layanan</DialogTitle>
                <DialogDescription>
                  Dikirim pada {formatDate(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-xs text-[#7a746b]">
                    Diperbarui: {formatDate(selected.updatedAt)}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldBlock label="Nama" value={selected.nama} />
                  <FieldBlock label="NPM" value={selected.npm} />
                </div>
                <FieldBlock
                  label="Layanan yang ingin diajukan"
                  value={selected.layananDiajukan}
                />
                <FieldBlock
                  label="Detail Layanan yang ingin diajukan"
                  value={selected.detailLayanan}
                />
                <FieldBlock
                  label="Saran peningkatan layanan yang sudah ada"
                  value={selected.saranPeningkatan}
                />

                <div className="grid gap-2">
                  <label
                    htmlFor="adminNote"
                    className="text-sm font-bold text-[#1f261f]"
                  >
                    Catatan admin/staff
                  </label>
                  <Textarea
                    id="adminNote"
                    value={note}
                    maxLength={2000}
                    className="min-h-24"
                    onChange={(event) => setNote(event.currentTarget.value)}
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-[#efe7da] pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => updateStatus(selected.id, "reviewed")}
                  >
                    Tandai Ditinjau
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => updateStatus(selected.id, "archived")}
                  >
                    Arsipkan
                  </Button>
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isUpdating}
                      onClick={() => deleteSuggestion(selected)}
                    >
                      Hapus
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
