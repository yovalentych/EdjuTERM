import { Database, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";
import Image from "next/image";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getMongoStatus } from "@/lib/mongodb";
import type { SafeUser } from "@/lib/schemas";
import { logout } from "@/app/actions";
import { AppSidebarNav, type AppNavItem } from "@/components/app-sidebar-nav";
import { GlobalSearch } from "@/components/global-search";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { PrivateThemeToggle } from "@/components/private-theme-toggle";
import { SidebarCollapseToggle } from "@/components/sidebar-collapse-toggle";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/ui/page-transition";
import { readPrefs } from "@/lib/prefs";

export async function AppShell({
  children,
  dictionary,
  locale,
  user,
}: {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  user: SafeUser;
}) {
  const prefs = await readPrefs();
  const isUk = locale === "uk";

  const navItems: AppNavItem[] = [
    {
      id: "dashboard",
      label: dictionary.nav.dashboard,
      href: `/${locale}/app`,
    },
    {
      id: "library",
      label: isUk ? "Довідка" : "Library",
      href: `/${locale}/app/library`,
    },
    {
      id: "profile",
      label: dictionary.nav.profile,
      href: `/${locale}/app/profile`,
    },
    {
      id: "settings",
      label: dictionary.nav.settings,
      href: `/${locale}/app/settings`,
    },
    ...(user.role === "admin"
      ? [
          {
            id: "admin" as const,
            label: dictionary.nav.admin,
            href: `/${locale}/app/admin`,
          },
        ]
      : []),
  ];
  const databaseStatus = await getMongoStatus();

  return (
    <div className={`private-shell flex min-h-screen flex-col text-stone-950${prefs.compact ? " is-compact" : ""}`}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="private-shell-header sticky top-0 z-40 border-b border-slate-200/80 px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-blue-200 bg-blue-50 p-1">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={28}
                height={28}
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                {dictionary.shell.eyebrow}
              </p>
              <p className="truncate text-sm font-semibold leading-tight text-stone-900">
                {dictionary.shell.title}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <GlobalSearch locale={locale} />
            <SidebarCollapseToggle />
            {prefs.notifications && <NotificationBell />}
            <PrivateThemeToggle />
            <span className="shell-chip hidden border border-stone-200 bg-white/70 px-2 py-1 text-xs text-stone-600 sm:inline">
              {user.firstName} {user.lastName}
              <span className="mx-1 text-stone-300">·</span>
              {dictionary.roles[user.role as keyof typeof dictionary.roles]}
            </span>
            <LanguageToggle
              locale={locale}
              alternateLocale={dictionary.alternateLocale}
            />
            <form action={logout}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="shell-chip border border-rose-100 bg-white/80 px-2 py-1 text-xs text-stone-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                {dictionary.auth.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Mobile tab bar ───────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur lg:hidden">
        <AppSidebarNav items={navItems} />
      </div>

      {/* ── Desktop layout: grid sidebar + main ─────────────────────────── */}
      <div className="grid private-shell-layout flex-1">
        {/* Sidebar */}
        <aside className="private-shell-sidebar sticky top-[61px] hidden h-[calc(100vh-61px)] flex-col overflow-y-auto shell-scrollbar lg:flex">
          <div className="p-3 pb-2">
            <div className="sidebar-nav-link pointer-events-none opacity-50">
              <LayoutDashboard className="sidebar-nav-icon h-4 w-4 shrink-0" />
              <span className="sidebar-expanded-only text-[10px] font-bold uppercase tracking-wider">
                {isUk ? "Навігація" : "Navigation"}
              </span>
            </div>
          </div>

          <div className="sidebar-divider" />

          <AppSidebarNav items={navItems} isVertical />

          {/* Database status at bottom */}
          <div className="p-3 pt-2">
            <div className="sidebar-divider mb-3" />
            <div className="sidebar-expanded-only flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50/60 px-2.5 py-2">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full ${databaseStatus.connected ? "animate-ping bg-emerald-400 opacity-75" : "bg-rose-400"}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${databaseStatus.connected ? "bg-emerald-500" : "bg-rose-500"}`} />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                {databaseStatus.connected
                  ? dictionary.shell.databaseConnected
                  : (dictionary.shell.databaseDisconnected ?? "Disconnected")}
              </span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex min-w-0 flex-col">
          <PageTransition>
            <div className="private-shell-main app-workspace app-workspace--standard">
              {children}
            </div>
          </PageTransition>
          <SiteFooter dictionary={dictionary} />
        </main>
      </div>
    </div>
  );
}
