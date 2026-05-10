import type { ReactNode } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy" | "away";

const COLOR_PALETTES = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h;
}

function initials(firstName?: string, lastName?: string): string {
  return `${(firstName?.[0] ?? "").toUpperCase()}${(lastName?.[0] ?? "").toUpperCase()}`;
}

export function Avatar({
  firstName,
  lastName,
  size = "md",
  status,
  className = "",
  colorClass,
  children,
}: {
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
  colorClass?: string;
  children?: ReactNode;
}) {
  const label = initials(firstName, lastName);
  const color =
    colorClass ??
    COLOR_PALETTES[hashName((firstName ?? "") + (lastName ?? "")) % COLOR_PALETTES.length];

  return (
    <span className={`avatar avatar-${size} ${color} ${className}`}>
      {children ?? label}
      {status && <span className={`avatar-status avatar-status-${status}`} />}
    </span>
  );
}

export function AvatarGroup({
  children,
  max,
  size = "md",
}: {
  children: ReactNode[];
  max?: number;
  size?: AvatarSize;
}) {
  const shown = max ? children.slice(0, max) : children;
  const rest = max ? children.length - max : 0;

  return (
    <span className="avatar-group">
      {rest > 0 && (
        <span className={`avatar avatar-${size} bg-slate-100 text-slate-600`}>
          +{rest}
        </span>
      )}
      {[...shown].reverse()}
    </span>
  );
}
