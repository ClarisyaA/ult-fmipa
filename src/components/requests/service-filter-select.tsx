"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ServiceFilterSelectProps = {
  services: {
    title: string;
    slug: string;
  }[];
  currentService?: string;
};

export function ServiceFilterSelect({
  services,
  currentService,
}: ServiceFilterSelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value) {
      nextParams.set("service", value);
    } else {
      nextParams.delete("service");
    }

    nextParams.delete("page");
    nextParams.delete("previewService");
    nextParams.delete("previewId");

    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="grid gap-1.5 sm:max-w-sm">
      <label
        htmlFor="request-service-filter"
        className="text-[11px] font-semibold uppercase tracking-wide text-[#7a7166]"
      >
        Jenis Pengajuan
      </label>
      <select
        id="request-service-filter"
        value={currentService ?? ""}
        onChange={(event) => handleChange(event.currentTarget.value)}
        className="h-9 w-full rounded-md border border-[#e1d8ca] bg-white px-3 text-[12px] font-semibold text-[#39433c] shadow-sm outline-none transition-colors hover:bg-[#fdfbf7] focus:border-[#0f5b45] focus:ring-2 focus:ring-[#0f5b45]/15"
      >
        <option value="">Semua Pengajuan</option>
        {services.map((service) => (
          <option key={service.slug} value={service.slug}>
            {service.title}
          </option>
        ))}
      </select>
    </div>
  );
}
