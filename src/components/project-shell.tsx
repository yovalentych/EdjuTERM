import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Database,
  FileSignature,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Briefcase,
  LayoutDashboard,
  Microscope,
  Settings,
  Sparkles,
  SquareStack,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project, SafeUser } from "@/lib/schemas";
import { logout } from "@/app/actions";
import { GlobalSearch } from "@/components/global-search";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { PrivateThemeToggle } from "@/components/private-theme-toggle";
import { SidebarCollapseToggle } from "@/components/sidebar-collapse-toggle";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/ui/page-transition";
import { ProjectChatWidget } from "@/components/chat/project-chat-widget";

export type ProjectTab =
  | "overview"
  | "records"
  | "openscience"
  | "manuscripts"
  | "team"
  | "budget"
  | "planning"
  | "research-plan"
  | "experiments"
  | "events"
  | "reports"
  | "learning"
  | "phd-plan"
  | "portfolio"
  | "settings";

type NavItem = {
  id: ProjectTab;
  label: string;
  icon: LucideIcon;
  href: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export function ProjectShell({
  children,
  dictionary,
  locale,
  user,
  project,
  activeTab,
}: {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  user: SafeUser;
  project: Project;
  activeTab: ProjectTab;
}) {
  const d = dictionary;
  const isUk = locale === "uk";
  const isDissertation = project.projectType === "dissertation";

  const allItems: NavItem[] = [
    {
      id: "overview",
      label: d.projects.tabOverview,
      icon: SquareStack,
      href: `/${locale}/app/project?projectId=${project._id}&tab=overview`,
    },
    {
      id: "records",
      label: d.projects.tabRecords,
      icon: Database,
      href: `/${locale}/app/project?projectId=${project._id}&tab=records`,
    },
    {
      id: "experiments",
      label: d.experiments.openExperiments,
      icon: FlaskConical,
      href: `/${locale}/app/experiments?projectId=${project._id}`,
    },
    {
      id: "research-plan",
      label: d.researchPlan.openPlan,
      icon: ClipboardList,
      href: `/${locale}/app/research-plan?projectId=${project._id}`,
    },
    {
      id: "planning",
      label: d.planning.openPlanning,
      icon: CalendarDays,
      href: `/${locale}/app/planning?projectId=${project._id}`,
    },
    {
      id: "budget",
      label: d.budget.openBudget,
      icon: Wallet,
      href: `/${locale}/app/budget?projectId=${project._id}`,
    },
    {
      id: "openscience",
      label: d.projects.tabOpenScience,
      icon: Globe,
      href: `/${locale}/app/project?projectId=${project._id}&tab=openscience`,
    },
    {
      id: "events",
      label: isUk ? "Події" : "Events",
      icon: Microscope,
      href: `/${locale}/app/events?projectId=${project._id}`,
    },
    {
      id: "manuscripts",
      label: isUk ? "Рукописи" : "Manuscripts",
      icon: FileSignature,
      href: `/${locale}/app/project?projectId=${project._id}&tab=manuscripts`,
    },
    {
      id: "reports",
      label: d.reports.openReports,
      icon: FileText,
      href: `/${locale}/app/reports?projectId=${project._id}`,
    },
    {
      id: "learning",
      label: isUk ? "Журнал навчання" : "Learning Journal",
      icon: BookOpen,
      href: `/${locale}/app/learning?projectId=${project._id}`,
    },
    {
      id: "phd-plan",
      label: isUk ? "Інд. план аспіранта" : "PhD Individual Plan",
      icon: GraduationCap,
      href: `/${locale}/app/phd-plan?projectId=${project._id}`,
    },
    {
      id: "portfolio",
      label: isUk ? "Портфоліо" : "Portfolio",
      icon: Briefcase,
      href: `/${locale}/app/portfolio?projectId=${project._id}`,
    },
    {
      id: "team",
      label: d.projects.tabTeam,
      icon: Users,
      href: `/${locale}/app/project?projectId=${project._id}&tab=team`,
    },
    {
      id: "settings",
      label: d.projects.settings,
      icon: Settings,
      href: `/${locale}/app/project-settings?projectId=${project._id}`,
    },
  ];

  const dissertationOnly = new Set<ProjectTab>(["phd-plan", "portfolio"]);
  const visibleItems = allItems.filter(
    (i) => !dissertationOnly.has(i.id) || isDissertation,
  );

  const groups: NavGroup[] = [
    {
      label: isUk ? "Дослідження" : "Research",
      items: allItems.filter((i) =>
        ["overview", "records", "experiments"].includes(i.id),
      ),
    },
    {
      label: isUk ? "Планування" : "Planning",
      items: allItems.filter((i) =>
        ["research-plan", "planning", "budget"].includes(i.id),
      ),
    },
    {
      label: isUk ? "Виходи" : "Output",
      items: allItems.filter((i) =>
        ["openscience", "events", "manuscripts", "reports"].includes(i.id),
      ),
    },
    {
      label: isUk ? "Навчання" : "Education",
      items: allItems.filter((i) =>
        isDissertation
          ? ["learning", "phd-plan", "portfolio"].includes(i.id)
          : ["learning"].includes(i.id),
      ),
    },
    {
      label: isUk ? "Управління" : "Manage",
      items: allItems.filter((i) => ["team", "settings"].includes(i.id)),
    },
  ];

  return (
    <div className="private-shell flex min-h-screen flex-col text-stone-950">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="private-shell-header sticky top-0 z-40 border-b border-slate-200/80 px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                {project.acronym}
              </p>
              <p className="truncate text-sm font-semibold leading-tight text-stone-900">
                {project.title}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <GlobalSearch locale={locale} />
            <SidebarCollapseToggle />
            <NotificationBell />
            <PrivateThemeToggle />
            <span className="shell-chip hidden border border-stone-200 bg-white/70 px-2 py-1 text-xs text-stone-600 sm:inline">
              {user.firstName} {user.lastName}
              <span className="mx-1 text-stone-300">·</span>
              {d.roles[user.role]}
            </span>
            <LanguageToggle
              locale={locale}
              alternateLocale={d.alternateLocale}
            />
            <form action={logout}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="shell-chip border border-rose-100 bg-white/80 px-2 py-1 text-xs text-stone-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                {d.auth.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Mobile tab bar ───────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mb-1.5">
          <Link
            href={`/${locale}/app`}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-3 w-3" />
            {isUk ? "Всі проєкти" : "All projects"}
          </Link>
        </div>
        <nav className="shell-scrollbar flex gap-1 overflow-x-auto pb-0.5">
          {visibleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Desktop layout: grid sidebar + main ─────────────────────────── */}
      <div className="grid private-shell-layout flex-1">
        {/* Sidebar */}
        <aside className="private-shell-sidebar sticky top-[61px] hidden h-[calc(100vh-61px)] flex-col overflow-y-auto shell-scrollbar lg:flex">
          {/* Back to dashboard */}
          <div className="p-3 pb-2">
            <Link
              href={`/${locale}/app`}
              title={isUk ? "Всі проєкти" : "All projects"}
              className="sidebar-nav-link"
            >
              <LayoutDashboard className="sidebar-nav-icon h-4 w-4 shrink-0" />
              <span className="sidebar-expanded-only text-[11px] font-semibold uppercase tracking-wider opacity-60">
                {isUk ? "Всі проєкти" : "All projects"}
              </span>
            </Link>
          </div>

          <div className="sidebar-divider" />

          {/* Nav groups */}
          <nav className="flex-1 py-2">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="sidebar-section-label">{group.label}</p>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      title={item.label}
                      aria-current={isActive ? "page" : undefined}
                      className="sidebar-nav-link"
                    >
                      <item.icon className="sidebar-nav-icon h-4 w-4 shrink-0" />
                      <span className="sidebar-expanded-only truncate">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Project identity at bottom */}
          <div className="p-3 pt-2">
            <div className="sidebar-divider mb-3" />
            <div className="sidebar-expanded-only rounded border border-blue-200 bg-blue-50/60 p-2.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                {project.acronym}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                {project.title}
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          <PageTransition>
            <div className="private-shell-main mx-auto w-full max-w-[1100px] space-y-4 p-4 md:p-5 lg:p-6">
              {children}
            </div>
          </PageTransition>
          <SiteFooter dictionary={d} />
        </main>
      </div>

      <ProjectChatWidget
        projectId={project._id ?? ""}
        currentUserId={user._id ?? ""}
        dictionary={d}
      />
    </div>
  );
}
