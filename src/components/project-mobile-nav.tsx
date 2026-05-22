"use client";

import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Database,
  FileSignature,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Microscope,
  NotebookPen,
  Settings,
  Sparkles,
  SquareStack,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProjectTab } from "@/components/project-shell";

const tabIcons: Record<ProjectTab, LucideIcon> = {
  overview: SquareStack,
  records: Database,
  experiments: FlaskConical,
  "research-plan": ClipboardList,
  almanac: BookMarked,
  planning: CalendarDays,
  budget: Wallet,
  openscience: Globe,
  events: Microscope,
  manuscripts: FileSignature,
  reports: FileText,
  learning: BookOpen,
  diary: NotebookPen,
  "phd-plan": GraduationCap,
  portfolio: Briefcase,
  team: Users,
  inventory: Database,
  equipment: Microscope,
  logs: NotebookPen,
  settings: Settings,
};

export type MobileNavGroup = {
  label: string;
  items: { id: ProjectTab; label: string; href: string }[];
};

export function ProjectMobileNav({
  groups,
  activeTab,
  backHref,
  backLabel,
  menuLabel,
  closeLabel,
  projectTitle,
  projectAcronym,
}: {
  groups: MobileNavGroup[];
  activeTab: ProjectTab;
  backHref: string;
  backLabel: string;
  menuLabel: string;
  closeLabel: string;
  projectTitle: string;
  projectAcronym: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const allItems = groups.flatMap((g) => g.items);
  const currentItem = allItems.find((i) => i.id === activeTab);
  const CurrentIcon = activeTab ? tabIcons[activeTab] : null;

  return (
    <>
      {/* Mobile top bar: back link + current section + hamburger */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur lg:hidden">
        <Link
          href={backHref}
          className="flex shrink-0 items-center gap-1 text-xs text-slate-400 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {CurrentIcon && (
            <CurrentIcon className="h-4 w-4 shrink-0 text-blue-600" />
          )}
          <span className="truncate text-sm font-medium text-slate-800">
            {currentItem?.label ?? ""}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={menuLabel}
          className="flex shrink-0 items-center gap-1.5 rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Menu className="h-4 w-4" />
          <ChevronRight className="h-3 w-3 text-slate-400" />
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl">
            {/* Panel header */}
            <div className="flex items-center gap-3 border-b border-slate-200 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-blue-200 bg-blue-50">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  {projectAcronym}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {projectTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={closeLabel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Back to dashboard */}
            <div className="border-b border-slate-100 p-2">
              <Link
                href={backHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-400" />
                {backLabel}
              </Link>
            </div>

            {/* Grouped nav */}
            <nav className="shell-scrollbar flex-1 overflow-y-auto p-2 pb-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="flex items-center justify-between gap-2 px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="truncate">{group.label}</span>
                    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] tracking-normal text-slate-400">
                      {group.items.length}
                    </span>
                  </p>
                  {group.items.map((item) => {
                    const Icon = tabIcons[item.id];
                    const isActive = activeTab === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded px-3 py-2 text-sm transition ${
                          isActive
                            ? "bg-blue-50 font-medium text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-blue-600" : "text-slate-400"
                          }`}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
