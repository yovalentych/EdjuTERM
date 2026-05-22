import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ResearchTone =
  | "amber"
  | "blue"
  | "cyan"
  | "emerald"
  | "indigo"
  | "orange"
  | "rose"
  | "slate"
  | "violet";

const iconToneClasses: Record<ResearchTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

const chipToneClasses: Record<ResearchTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export function ResearchWorkspaceFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`research-workspace space-y-4 ${className}`}>
      {children}
    </div>
  );
}

export function ResearchWorkspaceHeader({
  aside,
  description,
  eyebrow,
  icon: Icon,
  iconTone = "blue",
  title,
}: {
  aside?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  icon: LucideIcon;
  iconTone?: ResearchTone;
  title: ReactNode;
}) {
  return (
    <section className="research-compact-header">
      <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`research-icon-tile ${iconToneClasses[iconTone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            {eyebrow && (
              <div className="flex flex-wrap items-center gap-1.5">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-1 truncate text-base font-semibold leading-tight text-slate-950 md:text-lg">
              {title}
            </h1>
            {description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 md:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
        {aside && (
          <div className="flex flex-wrap gap-1.5 md:max-w-[430px] md:justify-end">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}

export function ResearchChip({
  children,
  className = "",
  tone = "slate",
}: {
  children: ReactNode;
  className?: string;
  tone?: ResearchTone;
}) {
  return (
    <span className={`research-chip ${chipToneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function ResearchPanel({
  actions,
  children,
  className = "",
  description,
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}) {
  return (
    <section className={`research-panel ${className}`}>
      {(title || description || actions) && (
        <div className="research-panel-header">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-sm font-semibold text-slate-950">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children && <div className="p-4">{children}</div>}
    </section>
  );
}
