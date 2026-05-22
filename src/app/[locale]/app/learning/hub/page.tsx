import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { LearningHub } from "@/components/learning/hub/learning-hub";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import {
  listAssessmentsForProject,
  listCourses,
  listModulesForProject,
  listProjectMembers,
  listSessionsForProject,
  listTopicsForProject,
  listAttendanceForCourse,
} from "@/lib/learning";

export default async function LearningHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string; courseId?: string; tab?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, courseId, tab } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const canManage = canManageProject(project, user);

  const [courses, modules, topics, assessments, sessions, members] = await Promise.all([
    listCourses(projectId),
    listModulesForProject(projectId),
    listTopicsForProject(projectId),
    listAssessmentsForProject(projectId),
    listSessionsForProject(projectId),
    listProjectMembers(projectId),
  ]);

  // Завантажимо attendance для активного курсу (або першого).
  const activeCourseId = courseId ?? courses[0]?._id ?? null;
  const attendance = activeCourseId ? await listAttendanceForCourse(activeCourseId) : [];

  const isUk = localeParam === "uk";

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="learning"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={isUk ? "Електронний журнал" : "Electronic Journal"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: isUk ? "Навчання" : "Learning", href: `/${localeParam}/app/learning?projectId=${project._id}` },
              { label: isUk ? "Журнал (Hub)" : "Journal (Hub)" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={
          isUk
            ? "Електронний деканат: відвідуваність, оцінки, розклад пар, учасники курсу."
            : "Electronic dean's office: attendance, grades, schedule, course members."
        }
      />

      <LearningHub
        locale={localeParam}
        projectId={projectId}
        canManage={canManage}
        initialTab={(tab as any) ?? "gradebook"}
        initialCourseId={activeCourseId}
        courses={courses}
        modules={modules}
        topics={topics}
        assessments={assessments}
        sessions={sessions}
        members={members}
        attendance={attendance}
      />
    </ProjectShell>
  );
}
