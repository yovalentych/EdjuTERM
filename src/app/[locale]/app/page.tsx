import { Settings, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
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
}: {
  params: Promise<{ locale: string }>;
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
