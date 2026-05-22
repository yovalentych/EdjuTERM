import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import { listProjectRecords } from "@/lib/repositories";
import { listTasks, listMilestones } from "@/lib/planning";
import { listResearchStages } from "@/lib/research-plan";
import { listTeamMessages } from "@/lib/team";

export type SearchResult = {
  id: string;
  type: "project" | "record" | "task" | "milestone" | "stage" | "message";
  title: string;
  excerpt?: string;
  projectName?: string;
  projectId?: string;
  href: string;
};

function match(text: string, q: string) {
  return text.toLowerCase().includes(q);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?._id) return NextResponse.json({ results: [] });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const locale = url.searchParams.get("locale") ?? "uk";

  if (q.length < 2) return NextResponse.json({ results: [] });

  const projects = await listProjectsForUser(user);
  const projectIds = projects.map((p) => p._id).filter((id): id is string => Boolean(id));

  const [records, messages, ...perProjectData] = await Promise.all([
    listProjectRecords(projectIds),
    listTeamMessages(projectIds),
    ...projects.map((p) =>
      p._id
        ? Promise.all([
            listTasks(p._id),
            listMilestones(p._id),
            listResearchStages(p._id),
          ])
        : Promise.resolve([[], [], []] as [never[], never[], never[]]),
    ),
  ]);

  const results: SearchResult[] = [];

  // Projects
  for (const project of projects) {
    if (
      match(project.title, q) ||
      match(project.acronym, q) ||
      match(project.summary ?? "", q)
    ) {
      results.push({
        id: project._id ?? project.acronym,
        type: "project",
        title: project.title,
        excerpt: project.acronym,
        href: `/${locale}/app/project?projectId=${project._id}&tab=overview`,
      });
    }
  }

  // Records
  for (const record of records) {
    if (match(record.title, q) || match(record.summary ?? "", q) || match(record.localId, q)) {
      const project = projects.find((p) => p._id === record.projectId);
      results.push({
        id: record._id ?? record.localId,
        type: "record",
        title: record.title,
        excerpt: record.localId,
        projectName: project?.acronym,
        projectId: record.projectId,
        href: `/${locale}/app/project?projectId=${record.projectId}&tab=records`,
      });
    }
  }

  // Team messages
  for (const msg of messages) {
    if (match(msg.content, q)) {
      const project = projects.find((p) => p._id === msg.projectId);
      results.push({
        id: msg._id ?? msg.createdAt.toISOString(),
        type: "message",
        title: msg.content.slice(0, 80),
        excerpt: msg.displayName,
        projectName: project?.acronym,
        projectId: msg.projectId,
        href: `/${locale}/app/project?projectId=${msg.projectId}&tab=team`,
      });
    }
  }

  // Per-project: tasks, milestones, stages
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    if (!project._id) continue;
    const [tasks, milestones, stages] = perProjectData[i] as [
      Awaited<ReturnType<typeof listTasks>>,
      Awaited<ReturnType<typeof listMilestones>>,
      Awaited<ReturnType<typeof listResearchStages>>,
    ];

    for (const task of tasks) {
      if (match(task.title, q) || match(task.category ?? "", q)) {
        results.push({
          id: task._id ?? task.title,
          type: "task",
          title: task.title,
          excerpt: task.status,
          projectName: project.acronym,
          projectId: project._id,
          href: `/${locale}/app/planning?projectId=${project._id}&tab=board`,
        });
      }
    }

    for (const ms of milestones) {
      if (match(ms.title, q)) {
        results.push({
          id: ms._id ?? ms.title,
          type: "milestone",
          title: ms.title,
          excerpt: ms.dueDate,
          projectName: project.acronym,
          projectId: project._id,
          href: `/${locale}/app/planning?projectId=${project._id}&tab=milestones`,
        });
      }
    }

    for (const stage of stages) {
      if (match(stage.title, q)) {
        results.push({
          id: stage._id ?? stage.title,
          type: "stage",
          title: `#${stage.stageNumber} ${stage.title}`,
          excerpt: stage.status,
          projectName: project.acronym,
          projectId: project._id,
          href: `/${locale}/app/research-plan?projectId=${project._id}&tab=stages`,
        });
      }
    }
  }

  return NextResponse.json({ results: results.slice(0, 25) });
}
