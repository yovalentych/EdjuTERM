import { Bell, Mail, Monitor, Moon, ShieldCheck, Sparkles, SunMedium, UserRound, Zap } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { savePrefs } from "@/app/actions";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { readPrefs } from "@/lib/prefs";
import Link from "next/link";

export default async function UserSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);
  const prefs = await readPrefs();
  const { saved } = await searchParams;

  const isUk = localeParam === "uk";

  const label = (uk: string, en: string) => (isUk ? uk : en);

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      <PageHeader
        eyebrow={label("Акаунт", "Account")}
        title={dictionary.account.settingsTitle}
        description={dictionary.account.settingsSummary}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: label("Кабінет", "Dashboard"), href: `/${localeParam}/app` },
              { label: dictionary.account.settingsTitle },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
      />

      {saved === "prefs" && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{label("Налаштування збережено.", "Settings saved.")}</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Preferences form ────────────────────────────────────── */}
        <section className="liquid-card p-0 overflow-hidden">
          <div className="border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow">
              {label("Зовнішній вигляд і поведінка", "Appearance & behaviour")}
            </span>
          </div>
          <form action={savePrefs} className="divide-y divide-slate-100/70">
            <input type="hidden" name="locale" value={localeParam} />

            {/* Theme */}
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {label("Тема інтерфейсу", "Interface theme")}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {label(
                    "Light — яскравий; Soft — тепліший, приглушений.",
                    "Light — bright; Soft — warmer, muted.",
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-emerald-700 text-slate-500">
                  <input type="radio" name="theme" value="light" defaultChecked={prefs.theme === "light"} className="sr-only" />
                  <SunMedium className="h-3.5 w-3.5" />
                  Light
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-emerald-700 text-slate-500">
                  <input type="radio" name="theme" value="soft" defaultChecked={prefs.theme === "soft"} className="sr-only" />
                  <Moon className="h-3.5 w-3.5" />
                  Soft
                </label>
              </div>
            </div>

            {/* Compact mode */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {label("Компактний режим", "Compact mode")}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {label("Зменшені відступи — більше даних на екрані.", "Reduced spacing — more content visible.")}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" name="compact" defaultChecked={prefs.compact} className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus:ring-2 peer-focus:ring-emerald-400 peer-focus:ring-offset-1 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {label("Сповіщення", "Notifications")}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {label("Показувати дзвоник сповіщень у шапці.", "Show notification bell in the header.")}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" name="notifications" defaultChecked={prefs.notifications} className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus:ring-2 peer-focus:ring-emerald-400 peer-focus:ring-offset-1 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-5" />
              </label>
            </div>

            <div className="px-5 py-4">
              <button type="submit" className="liquid-cta w-full sm:w-auto">
                <Sparkles className="h-4 w-4" />
                {label("Зберегти налаштування", "Save settings")}
              </button>
            </div>
          </form>
        </section>

        {/* ── Account info ──────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Account details */}
          <section className="liquid-card p-0 overflow-hidden">
            <div className="border-b border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/60 px-5 py-3.5">
              <span className="liquid-eyebrow">{label("Деталі акаунту", "Account details")}</span>
            </div>
            <div className="divide-y divide-slate-100/70">
              <SettingsRow label={dictionary.account.email} value={user.email} icon={<Mail className="h-3.5 w-3.5" />} />
              <SettingsRow
                label={dictionary.account.role}
                value={dictionary.roles[user.role as keyof typeof dictionary.roles]}
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
              />
              <SettingsRow
                label={label("Ім'я", "Name")}
                value={`${user.firstName} ${user.lastName}`}
                icon={<UserRound className="h-3.5 w-3.5" />}
              />
            </div>
          </section>

          {/* Security */}
          <section className="liquid-card p-0 overflow-hidden">
            <div className="border-b border-slate-200/60 bg-gradient-to-br from-rose-50/60 via-white to-slate-50/60 px-5 py-3.5">
              <span className="liquid-eyebrow">{label("Безпека", "Security")}</span>
            </div>
            <div className="divide-y divide-slate-100/70">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{label("Пароль", "Password")}</p>
                  <p className="text-xs text-slate-500">{label("Скинути через email-форму.", "Reset via email form.")}</p>
                </div>
                <Link
                  href={`/${localeParam}/forgot-password`}
                  className="liquid-pill liquid-pill--tinted shrink-0"
                  data-liquid-tint="emerald"
                >
                  {label("Змінити пароль", "Change password")}
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{label("Профіль", "Profile")}</p>
                  <p className="text-xs text-slate-500">{label("Ім'я, ORCID, посада, афіліація.", "Name, ORCID, position, affiliation.")}</p>
                </div>
                <Link
                  href={`/${localeParam}/app/profile`}
                  className="liquid-pill liquid-pill--tinted shrink-0"
                  data-liquid-tint="blue"
                >
                  {label("Редагувати", "Edit")}
                </Link>
              </div>
            </div>
          </section>

          {/* Current prefs summary */}
          <section className="liquid-card p-0 overflow-hidden">
            <div className="border-b border-slate-200/60 bg-gradient-to-br from-violet-50/60 via-white to-slate-50/60 px-5 py-3.5">
              <span className="liquid-eyebrow">{label("Поточні налаштування", "Current preferences")}</span>
            </div>
            <div className="flex flex-wrap gap-2 px-5 py-4">
              <span
                data-liquid-tint={prefs.theme === "soft" ? "violet" : "amber"}
                className="liquid-pill liquid-pill--tinted"
              >
                {prefs.theme === "soft" ? <Moon className="h-3 w-3" /> : <SunMedium className="h-3 w-3" />}
                {prefs.theme === "soft" ? "Soft" : "Light"}
              </span>
              <span
                data-liquid-tint={prefs.compact ? "emerald" : "blue"}
                className={`liquid-pill ${prefs.compact ? "liquid-pill--tinted" : ""}`}
              >
                <Zap className="h-3 w-3" />
                {label("Компактний", "Compact")}: {prefs.compact ? label("увімк.", "on") : label("вимк.", "off")}
              </span>
              <span
                data-liquid-tint={prefs.notifications ? "blue" : "amber"}
                className={`liquid-pill ${prefs.notifications ? "liquid-pill--tinted" : ""}`}
              >
                <Bell className="h-3 w-3" />
                {label("Сповіщення", "Notifications")}: {prefs.notifications ? label("увімк.", "on") : label("вимк.", "off")}
              </span>
              <span data-liquid-tint="teal" className="liquid-pill liquid-pill--tinted">
                <Monitor className="h-3 w-3" />
                {label("Мова", "Language")}: {localeParam.toUpperCase()}
              </span>
            </div>
          </section>
        </div>
      </div>
    </LiquidAppShell>
  );
}

function SettingsRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
