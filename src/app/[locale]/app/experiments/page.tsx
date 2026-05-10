import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ExperimentsExplorer } from "@/components/experiments/experiments-explorer";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { listExperiments } from "@/lib/experiments";
import { listResearchStages } from "@/lib/research-plan";
import { listProjectRecords } from "@/lib/repositories";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";

export default async function ExperimentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    projectId?: string;
    exp?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, exp } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const isManager = canManageProject(project, user);

  const [experiments, stages, allRecords] = await Promise.all([
    listExperiments(project._id),
    listResearchStages(project._id),
    listProjectRecords([project._id ?? ""]),
  ]);

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="experiments"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={localeParam === "uk" ? "Експерименти" : "Experiments"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: localeParam === "uk" ? "Експерименти" : "Experiments" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={
          localeParam === "uk"
            ? "Протоколи, методи та результати дослідів проєкту."
            : "Protocols, methods and results for project experiments."
        }
      />
      <ExperimentsExplorer
        experiments={experiments}
        stages={stages}
        allRecords={allRecords}
        project={project}
        locale={localeParam}
        dictionary={dictionary}
        canManage={isManager}
        initialSelectedId={exp}
      />
    </ProjectShell>
  );
}
