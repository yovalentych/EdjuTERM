import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ActivityDiary } from "@/components/learning/activity-diary";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { listDiaryEntries } from "@/lib/diary";

export default async function DiaryPage({
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

  const dictionary = getDictionary(localeParam);
  const canManage = canManageProject(project, user);
  const isUk = localeParam === "uk";

  const diaryEntries = await listDiaryEntries(projectId);

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="diary"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={isUk ? "Щоденник діяльності" : "Activity Diary"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: isUk ? "Щоденник" : "Diary" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={
          isUk
            ? "Хронологічний журнал діяльності: нотатки, зустрічі, заяви, запити та події."
            : "Chronological activity log: notes, meetings, applications, requests and events."
        }
      />
      <ActivityDiary
        projectId={projectId}
        canManage={canManage}
        initialEntries={diaryEntries}
      />
    </ProjectShell>
  );
}
