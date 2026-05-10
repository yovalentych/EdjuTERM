import type { ReactNode } from "react";

export type BadgeTone =
  | "slate"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple"
  | "orange";

export type BadgeDot = "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<BadgeTone, string> = {
  slate:  "border-slate-200 bg-slate-100 text-slate-700",
  blue:   "border-blue-200 bg-blue-50 text-blue-700",
  green:  "border-emerald-200 bg-emerald-50 text-emerald-700",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
  red:    "border-rose-200 bg-rose-50 text-rose-700",
  purple: "border-violet-200 bg-violet-50 text-violet-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
};

const dotClasses: Record<BadgeDot, string> = {
  success: "status-dot status-dot-success",
  warning: "status-dot status-dot-warning",
  danger:  "status-dot status-dot-danger",
  info:    "status-dot status-dot-info",
  muted:   "status-dot status-dot-muted",
};

export function Badge({
  tone = "slate",
  dot,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  /** Adds a colored status dot before the label */
  dot?: BadgeDot;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {dot && <span className={dotClasses[dot]} />}
      {children}
    </span>
  );
}
