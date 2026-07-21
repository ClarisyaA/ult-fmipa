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
import type { ServiceSuggestionStatus } from "@/lib/service-suggestions";

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
    <Badge
      variant="outline"
      className={`rounded-sm border px-2.5 py-0.5 text-[10px] font-semibold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </Badge>
  );
}

function FieldBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid min-w-0 gap-1 rounded-md border border-[#e3d9ca] bg-[#fffdf9] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7a7166]">
        {label}
      </p>
      <p className="break-words whitespace-pre-wrap text-xs leading-relaxed text-[#303b34] sm:text-sm">
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
      const response = await fetch(
        `/api/${rolePrefix}/service-suggestions/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            adminNote: note,
          }),
        },
      );
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
        const message = getErrorMessage(body, "Usulan layanan gagal dihapus.");
        toast.error(message);
        return;
      }

      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id),
      );
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
    <div
      className="-m-4 min-h-[calc(100%+2rem)] min-w-0 overflow-x-hidden bg-[#f8f2ea] text-[#1f2922] sm:-m-5 sm:min-h-[calc(100%+2.5rem)] lg:-m-6 lg:min-h-[calc(100%+3rem)]"
      style={{
        backgroundImage: [
          "radial-gradient(ellipse 72% 30% at 55% -8%, transparent 67%, rgba(198,184,160,0.20) 67.15%, transparent 67.45%)",
          "radial-gradient(ellipse 62% 28% at 75% 6%, transparent 63%, rgba(205,192,170,0.18) 63.15%, transparent 63.45%)",
          "radial-gradient(circle at 74% 12%, rgba(247,238,224,0.92), transparent 34%)",
          "radial-gradient(circle at 100% 0%, rgba(243,230,211,0.48), transparent 30%)",
          "linear-gradient(180deg, #fbf8f2 0%, #f8f2ea 38%, #f5ecdf 100%)",
        ].join(", "),
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto grid w-full max-w-[1320px] min-w-0 gap-4 px-4 py-5 pb-8 sm:px-6 lg:px-7">
        <header className="flex min-w-0 flex-col gap-3 text-[#173d2d]">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#566258]">
              {description}
            </p>
          </div>
        </header>

        <section
          className="min-w-0 overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)]"
          data-tour="admin-service-suggestions-list"
        >
          <div className="flex min-w-0 flex-col gap-3 border-b border-[#eee6d9] bg-[#fffdf9] px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#173d2d]">
                Daftar Usulan
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7a7166]">
                Buka detail untuk meninjau isi usulan, menambahkan catatan, atau
                memperbarui status.
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-4 rounded-md border border-[#e3d9ca] bg-white px-3 py-2 shadow-sm sm:justify-start">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7a7166]">
                  Usulan baru
                </p>
                <p className="text-lg font-semibold leading-tight text-[#173d2d]">
                  {newCount}
                </p>
              </div>
              <div className="h-8 w-px bg-[#eee6d9]" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7a7166]">
                  Total
                </p>
                <p className="text-lg font-semibold leading-tight text-[#173d2d]">
                  {items.length}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full min-w-0 max-w-full touch-pan-x overflow-x-auto overscroll-x-contain p-4">
            <table className="w-full min-w-[900px] table-fixed overflow-hidden rounded-md border border-[#edf0e9] text-left">
              <colgroup>
                <col className="w-[17%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[27%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead className="bg-[#eef3ec]">
                <tr>
                  {[
                    "Tanggal",
                    "Nama",
                    "NPM",
                    "Layanan yang diajukan",
                    "Status",
                    "Aksi",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="h-8 border-b border-[#dfe6dd] px-4 text-[10px] font-bold text-[#244934]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#ece7dc] bg-white align-top transition-colors hover:bg-[#f8faf6]"
                  >
                    <td className="px-4 py-3 text-[11px] text-[#303b34]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="break-words px-4 py-3 text-[11px] font-semibold text-[#202923]">
                      {item.nama}
                    </td>
                    <td className="break-words px-4 py-3 text-[11px] text-[#303b34]">
                      {item.npm}
                    </td>
                    <td className="break-words px-4 py-3 text-[11px] font-semibold leading-snug text-[#202923]">
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
                          className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
                          onClick={() => openDetail(item)}
                        >
                          Detail
                        </Button>
                        {canDelete ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 rounded-md px-3 text-[11px] font-semibold"
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
      </div>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent
          className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-none overflow-y-auto rounded-lg border border-[#e3d9ca] bg-white p-4 sm:max-h-[86dvh] sm:max-w-3xl sm:p-5"
          data-tour="admin-service-suggestions-detail"
        >
          {selected ? (
            <>
              <DialogHeader className="pr-8">
                <DialogTitle className="text-base font-semibold text-[#173d2d]">
                  Detail Usulan Layanan
                </DialogTitle>
                <DialogDescription className="text-xs text-[#7a7166]">
                  Dikirim pada {formatDate(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-[11px] text-[#7a7166]">
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
                    className="text-xs font-semibold text-[#303b34]"
                  >
                    Catatan admin/staff
                  </label>
                  <Textarea
                    id="adminNote"
                    value={note}
                    maxLength={2000}
                    className="min-h-24 resize-y border-[#e3d9ca] text-sm"
                    onChange={(event) => setNote(event.currentTarget.value)}
                  />
                </div>

                <div className="grid gap-2 border-t border-[#eee6d9] pt-4 sm:flex sm:flex-wrap sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-md border-[#e1d8ca] text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8] sm:w-auto"
                    disabled={isUpdating}
                    onClick={() => updateStatus(selected.id, "reviewed")}
                  >
                    Tandai Ditinjau
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-md border-[#e1d8ca] text-xs font-semibold text-[#39433c] hover:bg-[#f6f1e8] sm:w-auto"
                    disabled={isUpdating}
                    onClick={() => updateStatus(selected.id, "archived")}
                  >
                    Arsipkan
                  </Button>
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full rounded-md text-xs font-semibold sm:w-auto"
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
