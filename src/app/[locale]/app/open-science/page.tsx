import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { OpenScienceForm } from "@/components/open-science/open-science-form";
import { OpenScienceList } from "@/components/open-science/open-science-list";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listOpenScienceUpdatesForProjects } from "@/lib/open-science";
import { listProjectsForUser } from "@/lib/projects";

export default async function ManageOpenSciencePage({
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
  const projects = await listProjectsForUser(user);
  const projectIds = projects
    .map((project) => project._id)
    .filter((id): id is string => Boolean(id));
  const updates = await listOpenScienceUpdatesForProjects(projectIds);

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border border-stone-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold">
            {dictionary.openScience.manageTitle}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {dictionary.openScience.manageSummary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/${localeParam}/app`}
              className="border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              {dictionary.nav.dashboard}
            </Link>
            <Link
              href={`/${localeParam}/open-science`}
              target="_blank"
              className="bg-stone-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              {dictionary.openScience.publicPage}
            </Link>
          </div>
          <div className="mt-5">
            <OpenScienceForm
              dictionary={dictionary}
              locale={localeParam}
              projects={projects}
            />
          </div>
        </div>

        <div>
          <OpenScienceList updates={updates} dictionary={dictionary} />
        </div>
      </section>
    </AppShell>
  );
}
