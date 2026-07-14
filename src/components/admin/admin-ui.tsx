import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

type AdminSectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

type AdminPlannedButtonProps = {
  children: ReactNode;
  label?: "Rencana" | "Segera hadir";
};

export function AdminPageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="-m-4 min-h-[calc(100%+2rem)] bg-[#f8f2ea] text-[#1f2922] sm:-m-5 sm:min-h-[calc(100%+2.5rem)] lg:-m-6 lg:min-h-[calc(100%+3rem)]"
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
      <div
        className={`mx-auto grid gap-4 px-4 py-5 sm:px-6 lg:px-7 ${
          wide ? "max-w-[1660px]" : "max-w-[1320px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start gap-4 text-[#173d2d]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
            {title}
          </h1>
          {action}
        </div>
        {description ? (
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#566258]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminSectionCard({
  title,
  description,
  children,
  className = "",
}: AdminSectionCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-[#e3d9ca] bg-white shadow-[0_2px_10px_rgba(47,38,20,0.08)] ${className}`}
    >
      {title || description ? (
        <div className="border-b border-[#eee6d9] bg-[#fffdf9] px-4 py-3 sm:px-5">
          {title ? (
            <h2 className="text-sm font-semibold text-[#173d2d]">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-[11px] leading-relaxed text-[#7a7166]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function AdminTableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[#edf0e9]">
      {children}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="grid min-h-[140px] place-items-center rounded-md border border-[#edf0e9] bg-[#fbfdf9] px-4 py-8 text-center">
      <div>
        <p className="text-sm font-semibold text-[#303b34]">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-[#6f746f]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminUnavailableState({
  title = "Data belum dapat dimuat",
  description = "Koneksi database sedang tidak tersedia. Coba muat ulang halaman beberapa saat lagi.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="grid min-h-[140px] place-items-center rounded-md border border-[#edd2c5] bg-[#fff7f2] px-4 py-8 text-center">
      <div>
        <p className="text-sm font-semibold text-[#8a3d23]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#8a3d23]/80">
          {description}
        </p>
      </div>
    </div>
  );
}

export function AdminStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const styles = {
    neutral: "border-[#d7d9e5] bg-[#f4f5fa] text-[#4e5566]",
    success: "border-[#cce3d3] bg-[#eef9f1] text-[#2f6b44]",
    warning: "border-[#e2d7b8] bg-[#fff8e6] text-[#745411]",
    danger: "border-[#f1c6c6] bg-[#fff0f0] text-[#8f1d1d]",
    info: "border-[#c9ddf0] bg-[#edf7ff] text-[#285b7c]",
  };

  return (
    <Badge
      variant="outline"
      className={`rounded-sm border px-2.5 py-0.5 text-[10px] font-semibold ${styles[tone]}`}
    >
      {children}
    </Badge>
  );
}

export function AdminPlannedButton({
  children,
  label = "Rencana",
}: AdminPlannedButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled
      className="h-8 rounded-md border-[#e1d8ca] bg-white px-3 text-[11px] font-semibold text-[#8a8175] disabled:opacity-100"
      title={label}
    >
      {children}
      <span className="ml-2 rounded-sm border border-[#e1d8ca] bg-[#faf7ef] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#8a8175]">
        {label}
      </span>
    </Button>
  );
}

export function AdminLinkButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      asChild
      size="sm"
      className="h-8 rounded-md bg-[#0f3d2e] px-3 text-[11px] font-semibold text-white hover:bg-[#164b39]"
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
