"use client";

import {
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AppNavItem = {
  id: "dashboard" | "library" | "profile" | "settings" | "admin";
  label: string;
  href: string;
};

const icons: Record<AppNavItem["id"], LucideIcon> = {
  dashboard: LayoutDashboard,
  library: BookOpen,
  profile: UserRound,
  settings: Settings,
  admin: ShieldCheck,
};

export function AppSidebarNav({
  items,
  isVertical = false,
}: {
  items: AppNavItem[];
  isVertical?: boolean;
}) {
  const pathname = usePathname();

  if (!isVertical) {
    return (
      <nav className="shell-scrollbar flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const Icon = icons[item.id];
          const isActive =
            item.id === "dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex min-h-10 shrink-0 items-center gap-2.5 rounded border px-3 py-2 text-sm transition duration-200 ${
                isActive
                  ? "border-blue-200 bg-blue-50 font-medium text-blue-700"
                  : "border-transparent bg-transparent text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <span
                className={`absolute inset-x-2 bottom-0 h-0.5 bg-blue-600 transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                }`}
              />
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition ${
                  isActive
                    ? "text-blue-700"
                    : "text-slate-500 group-hover:text-blue-700"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex-1 space-y-1 py-2">
      {items.map((item) => {
        const Icon = icons[item.id];
        const isActive =
          item.id === "dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.id}
            href={item.href}
            title={item.label}
            aria-current={isActive ? "page" : undefined}
            className="sidebar-nav-link"
          >
            <Icon className="sidebar-nav-icon h-4 w-4 shrink-0" />
            <span className="sidebar-expanded-only truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
