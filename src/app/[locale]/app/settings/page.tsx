import { Bell, Monitor, Moon, SunMedium, Zap } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { savePrefs } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
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
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
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
        <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {label("Налаштування збережено.", "Settings saved.")}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">

        {/* ── Preferences form ── */}
        <section className="surface overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              {label("Зовнішній вигляд і поведінка", "Appearance & behaviour")}
            </h2>
          </div>
          <form action={savePrefs} className="divide-y divide-slate-50">
            <input type="hidden" name="locale" value={localeParam} />

            {/* Theme */}
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-stone-800">
                  {label("Тема інтерфейсу", "Interface theme")}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {label(
                    "Light — яскравий; Soft — тепліший, приглушений.",
                    "Light — bright; Soft — warmer, muted.",
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded border border-stone-200 bg-stone-50 p-0.5">
                <label className="flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-stone-800 text-stone-500">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    defaultChecked={prefs.theme === "light"}
                    className="sr-only"
                  />
                  <SunMedium className="h-3.5 w-3.5" />
                  Light
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold has-[:checked]:bg-white has-[:checked]:shadow-sm has-[:checked]:text-stone-800 text-stone-500">
                  <input
                    type="radio"
                    name="theme"
                    value="soft"
                    defaultChecked={prefs.theme === "soft"}
                    className="sr-only"
                  />
                  <Moon className="h-3.5 w-3.5" />
                  Soft
                </label>
              </div>
            </div>

            {/* Compact mode */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-stone-800">
                  {label("Компактний режим", "Compact mode")}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {label(
                    "Зменшені відступи — більше даних на екрані.",
                    "Reduced spacing — more content visible.",
                  )}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="compact"
                  defaultChecked={prefs.compact}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-stone-200 transition peer-checked:bg-emerald-600 peer-focus:ring-2 peer-focus:ring-emerald-400 peer-focus:ring-offset-1 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-stone-800">
                  {label("Сповіщення", "Notifications")}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {label(
                    "Показувати дзвоник сповіщень у шапці.",
                    "Show notification bell in the header.",
                  )}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="notifications"
                  defaultChecked={prefs.notifications}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-stone-200 transition peer-checked:bg-emerald-600 peer-focus:ring-2 peer-focus:ring-emerald-400 peer-focus:ring-offset-1 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition after:content-[''] peer-checked:after:translate-x-5" />
              </label>
            </div>

            <div className="px-5 py-4">
              <button type="submit" className="control-primary">
                {label("Зберегти налаштування", "Save settings")}
              </button>
            </div>
          </form>
        </section>

        {/* ── Account info ── */}
        <div className="space-y-5">

          {/* Account details */}
          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                {label("Деталі акаунту", "Account details")}
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              <div className="flex justify-between gap-3 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {dictionary.account.email}
                </span>
                <span className="text-sm text-stone-800">{user.email}</span>
              </div>
              <div className="flex justify-between gap-3 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {dictionary.account.role}
                </span>
                <span className="text-sm text-stone-800">
                  {dictionary.roles[user.role]}
                </span>
              </div>
              <div className="flex justify-between gap-3 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {label("Ім'я", "Name")}
                </span>
                <span className="text-sm text-stone-800">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                {label("Безпека", "Security")}
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {label("Пароль", "Password")}
                  </p>
                  <p className="text-xs text-stone-500">
                    {label("Скинути через email-форму.", "Reset via email form.")}
                  </p>
                </div>
                <Link
                  href={`/${localeParam}/forgot-password`}
                  className="shrink-0 rounded border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {label("Змінити пароль", "Change password")}
                </Link>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {label("Профіль", "Profile")}
                  </p>
                  <p className="text-xs text-stone-500">
                    {label("Ім'я, ORCID, посада, афіліація.", "Name, ORCID, position, affiliation.")}
                  </p>
                </div>
                <Link
                  href={`/${localeParam}/app/profile`}
                  className="shrink-0 rounded border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                >
                  {label("Редагувати", "Edit")}
                </Link>
              </div>
            </div>
          </section>

          {/* Current prefs summary */}
          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                {label("Поточні налаштування", "Current preferences")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 px-5 py-4">
              <span className="inline-flex items-center gap-1.5 rounded border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600">
                {prefs.theme === "soft" ? <Moon className="h-3 w-3" /> : <SunMedium className="h-3 w-3" />}
                {prefs.theme === "soft" ? "Soft" : "Light"}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs ${prefs.compact ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-500"}`}>
                <Zap className="h-3 w-3" />
                {label("Компактний", "Compact")}: {prefs.compact ? label("увімк.", "on") : label("вимк.", "off")}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs ${prefs.notifications ? "border-blue-200 bg-blue-50 text-blue-700" : "border-stone-200 bg-stone-50 text-stone-500"}`}>
                <Bell className="h-3 w-3" />
                {label("Сповіщення", "Notifications")}: {prefs.notifications ? label("увімк.", "on") : label("вимк.", "off")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600">
                <Monitor className="h-3 w-3" />
                {label("Мова", "Language")}: {localeParam.toUpperCase()}
              </span>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
