"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface StatusFilterProps {
  currentStatus: string;
  currentSearch: string;
  statusOptions: Array<{ value: string; label: string }>;
  baseUrl: string;
}

export function StatusFilter({
  currentStatus,
  currentSearch,
  statusOptions,
  baseUrl,
}: StatusFilterProps) {
  const router = useRouter();

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams();
    if (value && value !== "all") params.set("status", value);
    if (currentSearch) params.set("search", currentSearch);
    const query = params.toString();
    const url = query ? `${baseUrl}?${query}` : baseUrl;
    router.push(url);
  };

  return (
    <div className="relative w-full sm:w-48">
      <select
        className="h-10 w-full appearance-none rounded-xl border border-[#DDD5C3] bg-white px-4 pr-8 text-sm text-[#18130E] focus-visible:border-[#EE1C25]/50 focus-visible:ring-1 focus-visible:ring-[#EE1C25]/30 cursor-pointer"
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#A0917F]" />
    </div>
  );
}