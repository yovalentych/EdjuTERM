import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ExperimentDetailPage } from "@/components/experiments/experiment-detail-page";
import { getExperimentById } from "@/lib/experiments";
import { listResearchStages } from "@/lib/research-plan";
import { listProjectRecords } from "@/lib/repositories";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";

export default async function ExperimentDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; experimentId: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { locale: localeParam, experimentId } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const experiment = await getExperimentById(experimentId);
  if (!experiment || experiment.projectId !== project._id) notFound();

  const dictionary = getDictionary(localeParam);
  const isManager = canManageProject(project, user);

  const [stages, allRecords] = await Promise.all([
    listResearchStages(project._id),
    listProjectRecords([project._id]),
  ]);

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="experiments"
    >
      <ExperimentDetailPage
        experiment={experiment}
        project={project}
        stages={stages}
        allRecords={allRecords}
        locale={localeParam}
        dictionary={dictionary}
        canManage={isManager}
      />
    </ProjectShell>
  );
}
