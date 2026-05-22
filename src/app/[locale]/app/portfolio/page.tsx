import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { getPortfolio } from "@/lib/portfolio";

export default async function PortfolioPage({
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
  const portfolio = await getPortfolio(projectId);

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="portfolio"
    >
      <PageHeader
        eyebrow={project.acronym}
        title="Портфоліо аспіранта"
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: "Портфоліо" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description="Публікації, участь у конференціях та наукові здобутки аспіранта."
      />
      <PortfolioView
        projectId={projectId}
        locale={localeParam}
        canManage={canManage}
        initialPortfolio={portfolio}
        userDefaults={{
          fullName: `${user.lastName} ${user.firstName}`,
          specialty: user.defaultSpecialty || "",
          institution: user.affiliation || "",
        }}
      />
    </ProjectShell>
  );
}
