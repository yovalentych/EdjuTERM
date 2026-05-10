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
    <section className={`surface overflow-hidden ${className}`}>
      <div className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="min-w-0">
          {breadcrumb && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
              {breadcrumb}
            </div>
          )}
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {stats && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 md:px-6">
          {stats}
        </div>
      )}
    </section>
  );
}
