import { Settings, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { joinProjectWithCode } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ProjectList } from "@/components/projects/project-list";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listProjectsForUser } from "@/lib/projects";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : "uk";

  return {
    title: locale === "uk" ? "Мій dashboard" : "My dashboard",
    description:
      locale === "uk"
        ? "Персональний dashboard користувача"
        : "Personal user dashboard",
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${localeParam}/login`);
  }

  const projects = await listProjectsForUser(user);
  const { error, saved } = await searchParams;

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
          {dictionary.account.dashboardTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          {dictionary.account.dashboardSummary}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AccountCard
          href={`/${localeParam}/app/profile`}
          icon={<UserRound className="h-5 w-5" />}
          title={dictionary.account.profileTitle}
          summary={dictionary.account.profileSummary}
        />
        <AccountCard
          href={`/${localeParam}/app/settings`}
          icon={<Settings className="h-5 w-5" />}
          title={dictionary.account.settingsTitle}
          summary={dictionary.account.settingsSummary}
        />
      </section>

      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              {dictionary.projects.joinByCode}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {dictionary.projects.emailInviteNote}
            </p>
          </div>
          <form action={joinProjectWithCode} className="flex w-full flex-col gap-2 md:w-auto md:min-w-80">
            <input type="hidden" name="locale" value={localeParam} />
            <input
              name="joinCode"
              placeholder={dictionary.projects.joinCodePlaceholder}
              className="w-full border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              required
            />
            <button
              type="submit"
              className="bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              {dictionary.projects.joinByCode}
            </button>
          </form>
        </div>
        {error === "join-code" ? (
          <p className="mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {dictionary.projects.invalidJoinCode}
          </p>
        ) : null}
        {saved === "joined" ? (
          <p className="mt-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {dictionary.projects.saved}
          </p>
        ) : null}
      </section>

      <ProjectList
        projects={projects}
        dictionary={dictionary}
        locale={localeParam}
      />
    </AppShell>
  );
}

function AccountCard({
  href,
  icon,
  summary,
  title,
}: {
  href: string;
  icon: ReactNode;
  summary: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-700"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{summary}</p>
    </Link>
  );
}
