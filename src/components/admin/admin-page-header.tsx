import { Button } from "@/components/ui/button";

type AdminPageHeaderProps = {
  /** Small label above the title (breadcrumb-like) */
  section?: string;
  title: string;
  description?: string;
  /** Optional action button on the right */
  action?: {
    label: string;
    href?: string;
    disabled?: boolean;
    disabledLabel?: string;
    onClick?: () => void;
  };
};

export function AdminPageHeader({
  section,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {section && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button
          asChild={!!action.href && !action.disabled}
          disabled={action.disabled}
          variant={action.disabled ? "outline" : "default"}
          className={action.disabled ? "cursor-not-allowed opacity-60" : ""}
        >
          {action.href && !action.disabled ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            <span>{action.disabled ? action.disabledLabel ?? action.label : action.label}</span>
          )}
        </Button>
      )}
    </div>
  );
}
