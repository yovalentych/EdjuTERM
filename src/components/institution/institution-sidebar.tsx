"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, Building2, Database, GraduationCap, LayoutDashboard,
  Layers, Mail, Settings, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: { uk: string; en: string };
  href: (locale: string) => string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

const ITEMS: NavItem[] = [
  { id: "overview",  label: { uk: "Огляд",          en: "Overview" },   href: (l) => `/${l}/app/institution`,            icon: LayoutDashboard },
  { id: "structure", label: { uk: "Структура",      en: "Structure" },  href: (l) => `/${l}/app/institution/structure`,  icon: Layers },
  { id: "staff",     label: { uk: "Працівники",      en: "Staff" },     href: (l) => `/${l}/app/institution/staff`,      icon: Users },
  { id: "programs",  label: { uk: "Програми",       en: "Programs" },   href: (l) => `/${l}/app/institution/programs`,   icon: GraduationCap },
  { id: "courses",   label: { uk: "Курси",          en: "Courses" },    href: (l) => `/${l}/app/institution/courses`,    icon: BookOpen },
  { id: "invites",   label: { uk: "Запрошення",      en: "Invites" },   href: (l) => `/${l}/app/institution/invites`,    icon: Mail },
  { id: "import",    label: { uk: "Міграція",        en: "Migration" },  href: (l) => `/${l}/app/institution/import`,     icon: Database },
  { id: "profile",   label: { uk: "Профіль закладу", en: "Profile" },   href: (l) => `/${l}/app/institution/profile`,    icon: Building2 },
  { id: "settings",  label: { uk: "Налаштування",   en: "Settings" },   href: (l) => `/${l}/app/institution/settings`,   icon: Settings },
];

export function InstitutionSidebar({
  locale,
  variant = "vertical",
}: {
  locale: "uk" | "en";
  variant?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const isUk = locale === "uk";

  if (variant === "horizontal") {
    return (
      <nav className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white/60 p-1.5 backdrop-blur">
        {ITEMS.map((it) => {
          const href = it.href(locale);
          const active = isActive(pathname, href, it.id === "overview");
          return (
            <Link
              key={it.id}
              href={it.comingSoon ? "#" : href}
              aria-disabled={it.comingSoon}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                it.comingSoon && "cursor-not-allowed opacity-50",
                !it.comingSoon && active && "bg-emerald-500 text-white shadow-[0_4px_10px_-2px_rgba(16,185,129,0.45)]",
                !it.comingSoon && !active && "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <it.icon className="h-3.5 w-3.5" />
              <span>{isUk ? it.label.uk : it.label.en}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-2 py-1.5 opacity-60">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span className="liquid-eyebrow text-emerald-700">
          {isUk ? "Управління" : "Administration"}
        </span>
      </div>
      {ITEMS.map((it) => {
        const href = it.href(locale);
        const active = isActive(pathname, href, it.id === "overview");
        return (
          <Link
            key={it.id}
            href={it.comingSoon ? "#" : href}
            aria-disabled={it.comingSoon}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
              it.comingSoon && "cursor-not-allowed opacity-50",
              !it.comingSoon && active && "bg-emerald-500 text-white shadow-[0_3px_8px_-1px_rgba(16,185,129,0.45)]",
              !it.comingSoon && !active && "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
            )}
          >
            <it.icon className={cn("h-4 w-4 shrink-0 transition",
              !it.comingSoon && active ? "text-white" : "text-slate-400 group-hover:text-slate-700",
            )} />
            <span className="truncate">{isUk ? it.label.uk : it.label.en}</span>
            {it.comingSoon && (
              <span className="ml-auto rounded bg-amber-100 px-1 text-[8px] font-bold uppercase tracking-wider text-amber-700">
                soon
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
