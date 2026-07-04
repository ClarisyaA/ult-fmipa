import type { ReactNode } from "react";

type AdminEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export function AdminEmptyState({
  icon,
  title,
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground/40">{icon}</div>
      )}
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground/70">
          {description}
        </p>
      )}
    </div>
  );
}
