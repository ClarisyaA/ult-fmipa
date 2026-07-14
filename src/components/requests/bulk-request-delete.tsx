"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type BulkRequestItem = {
  key: string;
  serviceSlug: string;
  id: string;
  label: string;
};

type BulkRequestDeleteContextValue = {
  items: BulkRequestItem[];
  selectedKeys: Set<string>;
  selectedItems: BulkRequestItem[];
  isSelected: (key: string) => boolean;
  toggleItem: (item: BulkRequestItem) => void;
  toggleAll: () => void;
  clear: () => void;
};

const BulkRequestDeleteContext =
  createContext<BulkRequestDeleteContextValue | null>(null);

function useBulkRequestDelete() {
  const context = useContext(BulkRequestDeleteContext);

  if (!context) {
    throw new Error(
      "Bulk request delete components must be used inside BulkRequestDeleteProvider.",
    );
  }

  return context;
}

export function BulkRequestDeleteProvider({
  items,
  children,
}: {
  items: BulkRequestItem[];
  children: ReactNode;
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.has(item.key)),
    [items, selectedKeys],
  );

  const value = useMemo<BulkRequestDeleteContextValue>(
    () => ({
      items,
      selectedKeys,
      selectedItems,
      isSelected: (key) => selectedKeys.has(key),
      toggleItem: (item) => {
        setSelectedKeys((current) => {
          const next = new Set(current);

          if (next.has(item.key)) {
            next.delete(item.key);
          } else {
            next.add(item.key);
          }

          return next;
        });
      },
      toggleAll: () => {
        setSelectedKeys((current) => {
          if (current.size === items.length) {
            return new Set();
          }

          return new Set(items.map((item) => item.key));
        });
      },
      clear: () => setSelectedKeys(new Set()),
    }),
    [items, selectedItems, selectedKeys],
  );

  return (
    <BulkRequestDeleteContext.Provider value={value}>
      {children}
    </BulkRequestDeleteContext.Provider>
  );
}

export function BulkRequestSelectAll() {
  const { items, selectedItems, toggleAll } = useBulkRequestDelete();
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;
  const isPartiallySelected =
    selectedItems.length > 0 && selectedItems.length < items.length;

  return (
    <label className="inline-flex items-center justify-center" title="Pilih semua baris di halaman ini">
      <input
        type="checkbox"
        className="size-4 rounded border-[#cfc4b4] accent-[#0f3d2e]"
        checked={isAllSelected}
        ref={(input) => {
          if (input) {
            input.indeterminate = isPartiallySelected;
          }
        }}
        onChange={toggleAll}
        aria-label="Pilih semua pengajuan di halaman ini"
      />
    </label>
  );
}

export function BulkRequestSelectRow({ item }: { item: BulkRequestItem }) {
  const { isSelected, toggleItem } = useBulkRequestDelete();

  return (
    <label className="inline-flex items-center justify-center" title={`Pilih ${item.label}`}>
      <input
        type="checkbox"
        className="size-4 rounded border-[#cfc4b4] accent-[#0f3d2e]"
        checked={isSelected(item.key)}
        onChange={() => toggleItem(item)}
        aria-label={`Pilih ${item.label}`}
      />
    </label>
  );
}

export function BulkRequestDeleteToolbar() {
  const router = useRouter();
  const { selectedItems, clear } = useBulkRequestDelete();
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  if (selectedItems.length === 0) {
    return null;
  }

  async function handleDeleteSelected() {
    if (selectedItems.length === 0) {
      return;
    }

    if (
      !window.confirm(
        `Hapus ${selectedItems.length} pengajuan terpilih secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setMessage("");
    setIsError(false);

    const failedItems: string[] = [];

    try {
      for (const item of selectedItems) {
        const response = await fetch(
          `/api/admin/requests/${item.serviceSlug}/${item.id}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          failedItems.push(item.label);
        }
      }

      if (failedItems.length > 0) {
        setIsError(true);
        setMessage(
          `${failedItems.length} pengajuan gagal dihapus. Coba ulangi pengajuan yang masih tersisa.`,
        );
        router.refresh();
        return;
      }

      clear();
      setMessage(`${selectedItems.length} pengajuan berhasil dihapus.`);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#e8dfd0] bg-[#fffdf9] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#39433c]">
        {selectedItems.length} pengajuan dipilih
      </p>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="h-8 rounded-md px-3 text-[11px] font-semibold"
        disabled={isDeleting}
        onClick={handleDeleteSelected}
      >
        {isDeleting ? "Menghapus..." : "Hapus Terpilih"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#39433c] hover:bg-[#f6f1e8]"
        onClick={clear}
        disabled={isDeleting}
      >
        Batal Pilih
      </Button>
      {message ? (
        <p
          className={`text-[11px] ${
            isError ? "text-destructive" : "text-[#2d6a4f]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
