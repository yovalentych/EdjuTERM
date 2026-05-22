import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ProjectShell } from "@/components/project-shell";
import { LearningJournal } from "@/components/learning/learning-journal";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import {
  listCourses, listModulesForProject, listTopicsForProject,
  listAssessmentsForProject, listSessionsForProject, listAssignmentsForProject,
} from "@/lib/learning";

export default async function LearningPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string; courseId?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, courseId } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const canManage = canManageProject(project, user);

  const [courses, modules, allTopics, allAssessments, allSessions, allAssignments] = await Promise.all([
    listCourses(projectId),
    listModulesForProject(projectId),
    listTopicsForProject(projectId),
    listAssessmentsForProject(projectId),
    listSessionsForProject(projectId),
    listAssignmentsForProject(projectId),
  ]);

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
        title={localeParam === "uk" ? "Навчання" : "Learning"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: localeParam === "uk" ? "Навчання" : "Learning" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={
          localeParam === "uk"
            ? "Курси, модулі та прогрес навчання учасників проєкту."
            : "Courses, modules and learning progress for project members."
        }
        actions={
          <Link
            href={`/${localeParam}/app/learning/hub?projectId=${project._id}`}
            className="liquid-cta"
          >
            <Sparkles className="h-4 w-4" />
            {localeParam === "uk" ? "Електронний журнал (новий)" : "Electronic Journal (new)"}
          </Link>
        }
      />
      <LearningJournal
        projectId={projectId}
        locale={localeParam}
        canManage={canManage}
        initialCourseId={courseId ?? null}
        courses={courses}
        modules={modules}
        topics={allTopics}
        assessments={allAssessments}
        sessions={allSessions}
        assignments={allAssignments}
        isDissertation={project.projectType === "dissertation"}
      />
    </ProjectShell>
  );
}
