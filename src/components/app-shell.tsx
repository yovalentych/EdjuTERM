import {
  ClipboardList,
  Database,
  FileText,
  FlaskConical,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { SafeUser } from "@/lib/schemas";
import { logout } from "@/app/actions";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({
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
  const navItems = [
    { label: dictionary.nav.dashboard, icon: LayoutDashboard, href: `/${locale}/app` },
    { label: dictionary.nav.datasets, icon: Database, href: `/${locale}/app` },
    { label: dictionary.nav.protocols, icon: ClipboardList, href: `/${locale}/app` },
    { label: dictionary.nav.experiments, icon: FlaskConical, href: `/${locale}/app` },
    { label: dictionary.nav.outputs, icon: FileText, href: `/${locale}/app` },
    { label: dictionary.nav.team, icon: UsersRound, href: `/${locale}/app/team` },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4ef] text-stone-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-stone-200 bg-stone-950 px-4 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-emerald-500 text-stone-950">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-stone-300">
                {dictionary.shell.appName}
              </p>
              <p className="font-semibold">
                {dictionary.shell.projectShortName}
              </p>
            </div>
          </div>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-stone-300 transition hover:bg-stone-800 hover:text-white"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 border border-stone-800 bg-stone-900 p-4">
            <p className="text-sm font-medium text-stone-200">
              {dictionary.shell.databaseTarget}
            </p>
            <p className="mt-2 font-mono text-xs leading-5 text-stone-400">
              {dictionary.shell.databaseCollections}
            </p>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="border-b border-stone-200 bg-white px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-stone-500">
                  {dictionary.shell.eyebrow}
                </p>
                <p className="font-semibold text-stone-950">
                  {dictionary.shell.title}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="border border-stone-200 bg-stone-50 px-2 py-1 text-stone-700">
                  {user.firstName} {user.lastName} · {dictionary.roles[user.role]}
                </span>
                <form action={logout}>
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="border border-stone-300 bg-white px-2 py-1 text-stone-700 transition hover:border-rose-700 hover:text-rose-800"
                  >
                    {dictionary.auth.logout}
                  </button>
                </form>
                <Link
                  href={`/${dictionary.alternateLocale}`}
                  hrefLang={dictionary.alternateLocale}
                  className="border border-stone-300 bg-white px-2 py-1 text-stone-700 transition hover:border-emerald-700 hover:text-emerald-800"
                >
                  {dictionary.shell.languageSwitch}
                </Link>
                <span className="border border-stone-200 bg-stone-50 px-2 py-1 text-stone-600">
                  {locale.toUpperCase()}
                </span>
                <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                  FAIR
                </span>
                <span className="border border-cyan-200 bg-cyan-50 px-2 py-1 text-cyan-800">
                  DOI-ready
                </span>
                <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
                  DMP
                </span>
              </div>
            </div>
          </header>
          <div className="space-y-4 p-4 md:p-5">{children}</div>
          <SiteFooter dictionary={dictionary} />
        </main>
      </div>
    </div>
  );
}
