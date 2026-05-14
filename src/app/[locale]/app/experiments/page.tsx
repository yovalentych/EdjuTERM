import { FlaskConical } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ExperimentsExplorer } from "@/components/experiments/experiments-explorer";
import {
  ProjectResearchHeader,
  ResearchChip,
  ResearchWorkspaceFrame,
} from "@/components/research-os";
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
      <ResearchWorkspaceFrame>
      <ProjectResearchHeader
        dictionary={dictionary}
        icon={FlaskConical}
        locale={localeParam}
        project={project}
        tone="cyan"
        title={localeParam === "uk" ? "Експерименти" : "Experiments"}
        description={
          localeParam === "uk"
            ? "Протоколи, методи та результати дослідів проєкту."
            : "Protocols, methods and results for project experiments."
        }
        metrics={
          <>
            <ResearchChip tone="cyan">
              {localeParam === "uk"
                ? `${experiments.length} дослідів`
                : `${experiments.length} experiments`}
            </ResearchChip>
            <ResearchChip tone="blue">
              {localeParam === "uk"
                ? `${stages.length} етапів`
                : `${stages.length} stages`}
            </ResearchChip>
          </>
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
      </ResearchWorkspaceFrame>
    </ProjectShell>
  );
}
