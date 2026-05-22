import { Database, LayoutDashboard, LayoutGrid, BookOpen, UserRound, Settings, ShieldCheck, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import Image from "next/image";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getMongoStatus } from "@/lib/mongodb";
import type { SafeUser } from "@/lib/schemas";
import { logout } from "@/app/actions";
import { GlobalSearch } from "@/components/global-search";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { PrivateThemeToggle } from "@/components/private-theme-toggle";
import { LiquidSidebarNav, type LiquidNavItem } from "@/components/liquid-sidebar-nav";
import { LiquidBg } from "@/components/ui/liquid";
import { EmailVerifyBanner } from "@/components/auth/email-verify-banner";
import { readPrefs } from "@/lib/prefs";

/**
 * LiquidAppShell — Liquid Glass alternative to AppShell.
 * - Frosted glass header with rounded pill buttons
 * - Floating glass sidebar (icon + label)
 * - Mesh-gradient bedrock через LiquidBg
 * - Зберігає весь функціонал AppShell: search, notifications, theme, language, logout
 */
export async function LiquidAppShell({
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
  const databaseStatus = await getMongoStatus();
  const isUk = locale === "uk";

  const navItems: LiquidNavItem[] = [
    {
      id: "space",
      label: isUk ? "Простір" : "Space",
      href: `/${locale}/app/space`,
      icon: "space",
    },
    {
      id: "library",
      label: isUk ? "Довідка" : "Library",
      href: `/${locale}/app/library`,
      icon: "library",
    },
    {
      id: "profile",
      label: dictionary.nav.profile,
      href: `/${locale}/app/profile`,
      icon: "profile",
    },
    {
      id: "settings",
      label: dictionary.nav.settings,
      href: `/${locale}/app/settings`,
      icon: "settings",
    },
    ...(user.role === "admin"
      ? [
          {
            id: "admin" as const,
            label: dictionary.nav.admin,
            href: `/${locale}/app/admin`,
            icon: "admin" as const,
          },
        ]
      : []),
  ];

  return (
    <LiquidBg tint="teal" className="min-h-screen">
      <div className="flex min-h-screen flex-col">
        {/* ── Header (frosted glass) ───────────────────────────────────── */}
        <header className="sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-4">
          <div className="liquid-card flex items-center gap-3 px-4 py-2.5">
            {/* Logo + title */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-blue-200 bg-blue-50/80 p-1">
                <Image src="/logo.svg" alt="Logo" width={28} height={28} priority />
              </div>
              <div className="min-w-0">
                <p className="liquid-eyebrow text-[color:var(--liquid-accent)]">
                  {dictionary.shell.eyebrow}
                </p>
                <p className="truncate text-sm font-bold leading-tight text-slate-900">
                  {dictionary.shell.title}
                </p>
              </div>
            </div>

            {/* Right-side actions */}
            <div className="flex shrink-0 items-center gap-1.5">
              <GlobalSearch locale={locale} />
              {prefs.notifications && <NotificationBell />}
              <PrivateThemeToggle />
              <div className="hidden items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-xs text-slate-600 sm:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[10px] font-bold text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
                <span className="font-semibold text-slate-900">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-slate-300">·</span>
                <span>{dictionary.roles[user.role as keyof typeof dictionary.roles]}</span>
              </div>
              <LanguageToggle locale={locale} alternateLocale={dictionary.alternateLocale} />
              <form action={logout}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="liquid-pill !text-rose-600 hover:!bg-rose-50"
                  title={dictionary.auth.logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{dictionary.auth.logout}</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* ── Mobile tab bar (горизонтальна стрічка під header) ─────────── */}
        <div className="px-3 pt-2 lg:hidden">
          <LiquidSidebarNav items={navItems} variant="horizontal" />
        </div>

        {/* ── Desktop: sidebar + main ───────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-4 px-3 py-4 lg:flex-row lg:px-5 lg:py-5">
          {/* Sidebar (floating glass column) */}
          <aside className="hidden w-[212px] shrink-0 lg:block">
            <div className="liquid-card sticky top-[88px] flex flex-col gap-1 p-2.5">
              <div className="flex items-center gap-2 px-2 py-1.5 opacity-60">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="liquid-eyebrow">
                  {isUk ? "Навігація" : "Navigation"}
                </span>
              </div>

              <LiquidSidebarNav items={navItems} variant="vertical" />

              {/* Connection status — без розкриття хоста (security). */}
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50/70 px-2.5 py-2 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {databaseStatus.connected
                    ? dictionary.shell.databaseConnected
                    : (dictionary.shell.databaseDisconnected ?? "Disconnected")}
                </span>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {!user.emailVerifiedAt && (
              <EmailVerifyBanner locale={locale} />
            )}
            {children}
          </main>
        </div>
      </div>
    </LiquidBg>
  );
}
