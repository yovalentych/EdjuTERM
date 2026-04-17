import { Settings } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function UserSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${localeParam}/login`);
  }

  const dictionary = getDictionary(localeParam);

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center bg-emerald-50 text-emerald-700">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
              {dictionary.account.settingsTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              {dictionary.account.settingsSummary}
            </p>
          </div>
        </div>
      </section>

      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-500">
              {dictionary.projects.defaultLocale}
            </p>
            <p className="mt-1 font-semibold text-stone-950">
              {dictionary.localeName}
            </p>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-500">
              {dictionary.account.email}
            </p>
            <p className="mt-1 font-semibold text-stone-950">{user.email}</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
