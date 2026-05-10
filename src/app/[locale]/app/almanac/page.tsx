import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ResearchAlmanac } from "@/components/almanac/research-almanac";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { listResearchStages } from "@/lib/research-plan";
import { listPublications, listDeliverables } from "@/lib/research-publications";
import { listMilestones, listTasks } from "@/lib/planning";
import { listExperiments } from "@/lib/experiments";
import { listResearchEvents } from "@/lib/events";
import type { AlmanacItem } from "@/components/almanac/research-almanac";

export default async function AlmanacPage({
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

  const [stages, milestones, tasks, experiments, events, publications, deliverables] = await Promise.all([
    listResearchStages(projectId),
    listMilestones(projectId),
    listTasks(projectId),
    listExperiments(projectId),
    listResearchEvents(projectId),
    listPublications(projectId),
    listDeliverables(projectId),
  ]);

  const baseHref = (tab: string) =>
    `/${localeParam}/app/planning?projectId=${projectId}&tab=${tab}`;

  // ── Transform all sources into unified AlmanacItem[] ──────────────────────

  const items: AlmanacItem[] = [
    ...tasks.map((t) => ({
      id: t._id!,
      source: "task" as const,
      date: t.dueDate || "",
      title: t.title,
      status: t.status,
      priority: t.priority,
      meta: t.category,
      href: baseHref("tasks"),
      projectId,
    })),

    ...milestones.map((m) => ({
      id: m._id!,
      source: "milestone" as const,
      date: m.dueDate,
      title: m.title,
      status: m.status,
      meta: m.description?.slice(0, 60) || undefined,
      href: `/${localeParam}/app/research-plan?projectId=${projectId}&tab=milestones`,
      projectId,
    })),

    ...stages.map((s) => ({
      id: s._id!,
      source: "stage" as const,
      date: s.startDate || "",
      endDate: s.endDate || undefined,
      title: `Етап ${s.stageNumber}: ${s.title.slice(0, 80)}`,
      status: s.status,
      meta: s.progress ? `${s.progress}%` : undefined,
      href: `/${localeParam}/app/research-plan?projectId=${projectId}&tab=stages`,
      projectId,
    })),

    ...experiments.map((e) => ({
      id: e._id!,
      source: "experiment" as const,
      date: e.startDate || "",
      endDate: e.endDate || undefined,
      title: e.title,
      status: e.status,
      priority: e.priority,
      meta: e.type,
      href: `/${localeParam}/app/experiments?projectId=${projectId}`,
      projectId,
    })),

    ...events.map((ev) => ({
      id: ev._id!,
      source: "event" as const,
      date: ev.startDate || "",
      endDate: ev.endDate || undefined,
      title: ev.title,
      status: ev.status,
      meta: [ev.type, ev.location].filter(Boolean).join(" · "),
      href: `/${localeParam}/app/events?projectId=${projectId}`,
      projectId,
      // Deadlines as separate sub-items (passed via meta for now)
      deadlines: [
        ev.abstractDeadline && { label: isUk ? "Дедлайн тез" : "Abstract deadline", date: ev.abstractDeadline },
        ev.fullPaperDeadline && { label: isUk ? "Дедлайн статті" : "Full paper deadline", date: ev.fullPaperDeadline },
        ev.registrationDeadline && { label: isUk ? "Реєстрація до" : "Registration by", date: ev.registrationDeadline },
      ].filter(Boolean) as Array<{ label: string; date: string }>,
    })),

    ...publications.map((p) => ({
      id: p._id!,
      source: "publication" as const,
      date: p.expectedYear ? `${p.expectedYear}-06-01` : "",
      title: p.title,
      status: p.status,
      meta: p.type,
      href: `/${localeParam}/app/research-plan?projectId=${projectId}&tab=publications`,
      projectId,
    })),

    ...deliverables.map((d) => ({
      id: d._id!,
      source: "deliverable" as const,
      date: d.plannedDate || "",
      title: d.title,
      status: d.status,
      meta: d.type,
      href: `/${localeParam}/app/research-plan?projectId=${projectId}&tab=deliverables`,
      projectId,
    })),
  ];

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="almanac"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={isUk ? "Альманах дослідження" : "Research Almanac"}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: isUk ? "Альманах" : "Almanac" },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={
          isUk
            ? "Хронологічна стрічка всього дослідження: задачі, етапи, експерименти, події, публікації."
            : "Chronological feed of all research: tasks, stages, experiments, events, publications."
        }
      />
      <ResearchAlmanac
        items={items}
        projectId={projectId}
        locale={localeParam}
        canManage={canManage}
      />
    </ProjectShell>
  );
}
