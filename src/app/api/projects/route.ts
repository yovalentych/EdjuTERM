import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import { listTasks } from "@/lib/planning";
import { listResearchEvents } from "@/lib/events";
import { listDiaryEntries } from "@/lib/diary";
import { getBudgetSummary } from "@/lib/budget";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await listProjectsForUser(user);

    const mobileProjects = await Promise.all(projects.map(async (p) => {
      const [tasks, events, records, budget] = await Promise.all([
        listTasks(p._id ?? ""),
        listResearchEvents(p._id ?? ""),
        listDiaryEntries(p._id ?? ""),
        getBudgetSummary(p._id ?? "")
      ]);

      const memberCount = 1 + (p.memberIds?.length || 0);

      return {
        id: p._id,
        acronym: p.acronym,
        title: p.title,
        projectType: p.projectType,
        status: p.status,
        budget: {
          planned: budget.totalPlanned,
          committed: budget.totalCommitted,
          spent: budget.totalSpent,
          remaining: budget.totalRemaining,
        },
        counters: {
          records: records.length,
          tasks: tasks.length,
          events: events.length,
          warnings: budget.overBudgetCategories.length,
        },
        memberCount,
        institution: p.institution || p.grantProgram || "",
        roomNumber: p.roomNumber || "",
      };
    }));

    return NextResponse.json({ projects: mobileProjects });
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
