"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, HelpCircle, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * Liquid Glass design primitives for web (Next.js + Tailwind v4)
 * Pairs with .liquid-* utility classes from globals.css.
 * ───────────────────────────────────────────────────────────────────────── */

export type LiquidTint = "teal" | "violet" | "blue" | "amber" | "rose" | "emerald";

// ── LiquidBg ───────────────────────────────────────────────────────────────
// Wrap a page section to give it a mesh-gradient + tinted blob backdrop.
export function LiquidBg({
  tint = "teal",
  children,
  className,
}: {
  tint?: LiquidTint;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-liquid-tint={tint} className={cn("liquid-bg min-h-full", className)}>
      {children}
    </div>
  );
}

// ── LiquidCard ────────────────────────────────────────────────────────────
export function LiquidCard({
  children,
  className,
  accent,
  tint,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  tint?: LiquidTint;
  glow?: boolean;
}) {
  return (
    <div
      data-liquid-tint={tint}
      className={cn("liquid-card p-5", glow && "liquid-card-glow", className)}
    >
      {accent && <div className="liquid-card-accent" />}
      {children}
    </div>
  );
}

// ── LiquidPill ────────────────────────────────────────────────────────────
export function LiquidPill({
  children,
  onClick,
  tone = "ghost",
  tint,
  icon,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "ghost" | "tinted" | "filled";
  tint?: LiquidTint;
  icon?: ReactNode;
  className?: string;
}) {
  const Component = onClick ? "button" : "span";
  return (
    <Component
      data-liquid-tint={tint}
      onClick={onClick}
      className={cn(
        "liquid-pill",
        tone === "tinted" && "liquid-pill--tinted",
        tone === "filled" && "liquid-pill--filled",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </Component>
  );
}

// ── LiquidTabs (segmented control) ─────────────────────────────────────────
type LiquidTabItem<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: number | null;
};

export function LiquidTabs<T extends string>({
  tabs,
  active,
  onChange,
  tint,
  className,
}: {
  tabs: LiquidTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  tint?: LiquidTint;
  className?: string;
}) {
  return (
    <div data-liquid-tint={tint} className={cn("liquid-tabs w-fit max-w-full overflow-x-auto", className)}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            data-active={isActive}
            onClick={() => onChange(t.id)}
            className="liquid-tab whitespace-nowrap"
          >
            {t.icon}
            <span>{t.label}</span>
            {t.badge != null && t.badge > 0 && <span className="liquid-tab-badge">{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── LiquidStatTile ────────────────────────────────────────────────────────
export function LiquidStatTile({
  icon,
  label,
  value,
  sub,
  tint = "teal",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  tint?: LiquidTint;
}) {
  return (
    <div data-liquid-tint={tint} className="liquid-stat flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="liquid-eyebrow">{label}</span>
        <span className="text-[color:var(--liquid-accent)]">{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

// ── LiquidSwitcher (1-row dropdown) ────────────────────────────────────────
export function LiquidSwitcher({
  emoji,
  label,
  name,
  counter,
  tint = "teal",
  onClick,
}: {
  emoji: string;
  label: string;
  name: string;
  counter?: number;
  tint?: LiquidTint;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      data-liquid-tint={tint}
      onClick={onClick}
      className="liquid-switcher text-left"
    >
      <span className="text-3xl leading-none">{emoji}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="liquid-eyebrow">{label}</span>
        <span className="truncate text-lg font-bold tracking-tight text-slate-900">{name}</span>
      </span>
      {counter !== undefined && (
        <span className="rounded-lg bg-[color:color-mix(in_srgb,var(--liquid-accent)_15%,transparent)] px-2 py-1 text-xs font-bold text-[color:var(--liquid-accent)]">
          {counter}
        </span>
      )}
      <ChevronDown className="h-4 w-4 text-slate-400" />
    </button>
  );
}

// ── InfoBubble (?) ─────────────────────────────────────────────────────────
export function LiquidInfoBubble({
  title,
  body,
  tint = "teal",
}: {
  title: string;
  body: string;
  tint?: LiquidTint;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-liquid-tint={tint}
        className="liquid-info-q"
        onClick={() => setOpen(true)}
        aria-label="Info"
      >
        ?
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-6"
          onClick={() => setOpen(false)}
        >
          <div
            data-liquid-tint={tint}
            className="liquid-card relative w-full max-w-md p-0 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-[color:var(--liquid-accent)]" />
            <div className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[color:var(--liquid-accent)]" />
                <h3 className="text-sm font-bold tracking-tight text-[color:var(--liquid-accent)]">{title}</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{body}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 w-full rounded-lg bg-[color:color-mix(in_srgb,var(--liquid-accent)_15%,transparent)] px-3 py-2 text-xs font-bold text-[color:var(--liquid-accent)]"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
