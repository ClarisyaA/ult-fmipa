"use client";

import { useCallback } from "react";
import { Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminFilterToolbarProps = {
  /** Search value (controlled) */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Date range filter */
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  /** Tampilkan button */
  onApply?: () => void;
  /** Download button */
  onDownload?: () => void;
  downloadDisabled?: boolean;
  downloadLabel?: string;
  /** Extra slot for custom filters like dropdowns */
  children?: React.ReactNode;
};

export function AdminFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Cari...",
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onDownload,
  downloadDisabled,
  downloadLabel = "Download Data",
  children,
}: AdminFilterToolbarProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange?.(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        {onSearchChange !== undefined && (
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Pencarian
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                value={search ?? ""}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Date range */}
        {onDateFromChange && (
          <div className="w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Dari Tanggal
            </label>
            <Input
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>
        )}
        {onDateToChange && (
          <div className="w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Sampai Tanggal
            </label>
            <Input
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        )}

        {/* Extra filters */}
        {children}

        {/* Action buttons */}
        <div className="flex gap-2">
          {onApply && (
            <Button onClick={onApply} size="sm" className="h-9">
              Tampilkan
            </Button>
          )}
          {onDownload !== undefined && (
            <Button
              onClick={onDownload}
              variant="outline"
              size="sm"
              className="h-9"
              disabled={downloadDisabled}
            >
              <Download className="mr-1.5 size-3.5" />
              {downloadDisabled ? "Segera hadir" : downloadLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
