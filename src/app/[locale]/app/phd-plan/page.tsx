import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { PhdPlanView } from "@/components/phd-plan/phd-plan-view";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { getPhdPlan } from "@/lib/phd-plan";

export default async function PhdPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  if (project.projectType !== "dissertation") notFound();

  const dictionary = getDictionary(localeParam);
  const canManage = canManageProject(project, user);
  const plan = await getPhdPlan(projectId);

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="phd-plan"
    >
      <PageHeader
        eyebrow={project.acronym}
        title="Індивідуальний план аспіранта"
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: "Інд. план аспіранта" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description="Індивідуальний план роботи аспіранта: навчальний план, науково-дослідницька діяльність та щорічні робочі плани."
      />
      <PhdPlanView
        projectId={projectId}
        locale={localeParam}
        canManage={canManage}
        initialPlan={plan}
        userDefaults={{
          studentName: `${user.lastName} ${user.firstName}`,
          specialty: user.defaultSpecialty,
          institution: user.affiliation,
        }}
      />
    </ProjectShell>
  );
}
