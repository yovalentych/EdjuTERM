"use client";

import {
  LayoutDashboard,
  Database,
  FlaskConical,
  ClipboardList,
  BookMarked,
  CalendarDays,
  Wallet,
  Globe,
  Microscope,
  FileSignature,
  FileText,
  BookOpen,
  NotebookPen,
  GraduationCap,
  Briefcase,
  Users,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  SquareStack,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, SafeUser } from "@/lib/schemas";
import { logout } from "@/app/actions";

// ── Types ──────────────────────────────────────────────────────────────────

export type NavIconId =
  | "layout-dashboard"
  | "database"
  | "flask-conical"
  | "clipboard-list"
  | "book-marked"
  | "calendar-days"
  | "wallet"
  | "globe"
  | "microscope"
  | "file-signature"
  | "file-text"
  | "book-open"
  | "notebook-pen"
  | "graduation-cap"
  | "briefcase"
  | "users"
  | "user-round"
  | "settings"
  | "shield-check"
  | "square-stack";

const ICON_MAP: Record<NavIconId, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "database": Database,
  "flask-conical": FlaskConical,
  "clipboard-list": ClipboardList,
  "book-marked": BookMarked,
  "calendar-days": CalendarDays,
  "wallet": Wallet,
  "globe": Globe,
  "microscope": Microscope,
  "file-signature": FileSignature,
  "file-text": FileText,
  "book-open": BookOpen,
  "notebook-pen": NotebookPen,
  "graduation-cap": GraduationCap,
  "briefcase": Briefcase,
  "users": Users,
  "user-round": UserRound,
  "settings": Settings,
  "shield-check": ShieldCheck,
  "square-stack": SquareStack,
};

export type NavItem = {
  id: string;
  label: string;
  icon: NavIconId;
  href: string;
  tooltip?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// ── Components ───────────────────────────────────────────────────────────────

export function WorkspaceShell({
  children,
  dictionary,
  locale,
  user,
  project,
  navGroups,
  headerActions,
  footerWidgets,
}: {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  user: SafeUser;
  project?: Project;
  navGroups: NavGroup[];
  headerActions?: ReactNode;
  footerWidgets?: ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync with localStorage preference
  useEffect(() => {
    const saved = localStorage.getItem("workspace-sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("workspace-sidebar-collapsed", String(next));
    document.documentElement.dataset.sidebarCollapsed = String(next);
  };

  return (
    <div className="workspace-shell">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="workspace-header px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {/* Logo / Brand */}
            <Link href={`/${locale}/app`} className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50/50 p-1.5 shadow-sm">
                <Image src="/logo.svg" alt="Logo" width={24} height={24} priority />
              </div>
              <div className={`${isCollapsed ? "hidden" : "hidden md:block"} min-w-0`}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  {project?.acronym || dictionary.shell.eyebrow}
                </p>
                <h1 className="truncate text-sm font-bold text-slate-900">
                  {project?.title || dictionary.shell.title}
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            
            <div className="h-6 w-px bg-slate-200 mx-1" />
            
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:block text-xs font-medium text-slate-500 mr-1">
                {user.firstName} {user.lastName}
              </span>
              <form action={logout}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title={dictionary.auth.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside 
          className={`workspace-sidebar flex flex-col ${isCollapsed ? "w-[68px]" : "w-64"}`}
        >
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-3 pt-4 custom-scrollbar">
            {navGroups.map((group, groupIdx) => (
              <div key={group.label} className={groupIdx > 0 ? "mt-6" : ""}>
                {!isCollapsed && (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = ICON_MAP[item.icon as NavIconId] || Sparkles;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                          isActive
                            ? "bg-blue-50 text-blue-700 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                        {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto border-t border-slate-100 p-3">
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 mx-auto" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{(dictionary as any).common?.collapse || "Collapse"}</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
          <div className="workspace-main mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      
      {footerWidgets}
    </div>
  );
}
