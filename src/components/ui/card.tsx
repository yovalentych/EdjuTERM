import type { ReactNode } from "react";

export function Card({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`surface overflow-hidden ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children && <div className={bodyClassName || "p-5"}>{children}</div>}
    </section>
  );
}

