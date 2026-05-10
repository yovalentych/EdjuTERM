import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { OpenScienceForm } from "@/components/open-science/open-science-form";
import { OpenScienceList } from "@/components/open-science/open-science-list";
import { Breadcrumb, PageHeader } from "@/components/ui";
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
      <PageHeader
        eyebrow="Open science"
        title={dictionary.openScience.manageTitle}
        breadcrumb={
          <Breadcrumb
            items={[{ label: dictionary.openScience.manageTitle }]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={dictionary.openScience.manageSummary}
        actions={
          <Link
            href={`/${localeParam}/open-science`}
            target="_blank"
            className="control-primary px-3 py-2 text-sm font-semibold"
          >
            {dictionary.openScience.publicPage}
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="surface p-5">
          <OpenScienceForm
            dictionary={dictionary}
            locale={localeParam}
            projects={projects}
          />
        </div>

        <div>
          <OpenScienceList updates={updates} dictionary={dictionary} />
        </div>
      </section>
    </AppShell>
  );
}
