import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  stats,
  breadcrumb,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Row of stat chips below the title area */
  stats?: ReactNode;
  /** Small breadcrumb shown above the eyebrow */
  breadcrumb?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`liquid-card relative overflow-hidden p-0 ${className}`}>
      {/* Decorative gradient backdrop — узгоджено з space.tsx / library hub. */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="min-w-0">
          {breadcrumb && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
              {breadcrumb}
            </div>
          )}
          {eyebrow && (
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-950 md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {stats && (
        <div className="relative border-t border-slate-200/60 bg-white/40 px-5 py-3 backdrop-blur md:px-6">
          {stats}
        </div>
      )}
    </section>
  );
}
