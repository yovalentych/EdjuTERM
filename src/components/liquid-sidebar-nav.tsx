"use client";

import {
  BookOpen, LayoutDashboard, LayoutGrid, ShieldCheck, Settings, UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type LiquidNavIconId = "space" | "dashboard" | "library" | "profile" | "settings" | "admin";

export type LiquidNavItem = {
  id: LiquidNavIconId;
  label: string;
  href: string;
  icon: LiquidNavIconId;
};

const icons: Record<LiquidNavIconId, LucideIcon> = {
  space: LayoutGrid,
  dashboard: LayoutDashboard,
  library: BookOpen,
  profile: UserRound,
  settings: Settings,
  admin: ShieldCheck,
};

export function LiquidSidebarNav({
  items,
  variant = "vertical",
}: {
  items: LiquidNavItem[];
  variant?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  if (variant === "horizontal") {
    return (
      <nav className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white/60 p-1.5 backdrop-blur">
        {items.map((item) => {
          const Icon = icons[item.icon];
          const isActive = pathname === item.href || (item.icon !== "dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                isActive
                  ? "bg-[color:var(--liquid-accent)] text-white shadow-[0_4px_10px_-2px_color-mix(in_srgb,var(--liquid-accent)_40%,transparent)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const isActive = pathname === item.href || (item.icon !== "dashboard" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-[color:var(--liquid-accent)] text-white shadow-[0_3px_8px_-1px_color-mix(in_srgb,var(--liquid-accent)_40%,transparent)]"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0 transition", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700")} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
