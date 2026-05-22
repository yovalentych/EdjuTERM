import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Institution, SafeUser } from "@/lib/schemas";
import { logout } from "@/app/actions";
import { LanguageToggle } from "@/components/language-toggle";
import { PrivateThemeToggle } from "@/components/private-theme-toggle";
import { LiquidBg } from "@/components/ui/liquid";
import { InstitutionSidebar } from "@/components/institution/institution-sidebar";

/**
 * InstitutionShell — окремий shell для адміністрування НЗ.
 * Заміняє LiquidAppShell, бо НЗ-адмін не має пунктів "Простір/Довідка/Профіль".
 *
 * Layout: header (logo + НЗ-бейдж + actions) + sidebar (НЗ-навігація) + main.
 */
export function InstitutionShell({
  children,
  locale,
  user,
  institution,
  alternateLocale,
}: {
  children: ReactNode;
  locale: Locale;
  user: SafeUser;
  institution: Institution;
  alternateLocale: "uk" | "en";
}) {
  const isUk = locale === "uk";

  return (
    <LiquidBg tint="teal" className="min-h-screen">
      <div className="flex min-h-screen flex-col">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-4">
          <div className="liquid-card flex items-center gap-3 px-4 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/80 p-1">
                <Image src="/logo.svg" alt="Logo" width={28} height={28} priority />
              </div>
              <div className="min-w-0">
                <p className="liquid-eyebrow text-emerald-700">
                  {isUk ? "Адмін-панель закладу" : "Institution admin"}
                </p>
                <p className="truncate text-sm font-bold leading-tight text-slate-900">
                  {institution.shortName || institution.name}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center gap-2 rounded-full bg-emerald-50/80 px-3 py-1.5 text-xs text-emerald-800 sm:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span className="font-semibold">
                  {isUk ? "Адміністратор" : "Admin"}
                </span>
                <span className="text-emerald-300">·</span>
                <span className="truncate max-w-[140px]">{user.email}</span>
              </div>
              {institution._id && (
                <Link
                  href={`/${locale}/institutions/${institution._id}`}
                  target="_blank"
                  rel="noreferrer"
                  title={isUk ? "Публічний профіль закладу" : "Public institution profile"}
                  className="liquid-pill text-slate-500 hover:text-emerald-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isUk ? "Профіль" : "Profile"}</span>
                </Link>
              )}
              <PrivateThemeToggle />
              <LanguageToggle locale={locale} alternateLocale={alternateLocale} />
              <form action={logout}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="liquid-pill !text-rose-600 hover:!bg-rose-50"
                  title={isUk ? "Вийти" : "Sign out"}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isUk ? "Вийти" : "Sign out"}</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* ── Mobile horizontal nav ──────────────────────────────────── */}
        <div className="px-3 pt-2 lg:hidden">
          <InstitutionSidebar locale={locale} variant="horizontal" />
        </div>

        {/* ── Desktop: sidebar + main ───────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-4 px-3 py-4 lg:flex-row lg:px-5 lg:py-5">
          <aside className="hidden w-[220px] shrink-0 lg:block">
            <div className="liquid-card sticky top-[88px] flex flex-col gap-1 p-2.5">
              <InstitutionSidebar locale={locale} variant="vertical" />
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </LiquidBg>
  );
}
