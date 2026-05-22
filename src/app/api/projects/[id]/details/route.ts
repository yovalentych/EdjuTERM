import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listResearchStages } from "@/lib/research-plan";
import { listTasks, listMilestones } from "@/lib/planning";
import { getBudgetSummary } from "@/lib/budget";
import { listResearchEvents, listAllParticipationsForProject } from "@/lib/events";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const [stages, tasks, milestones, budget, events, participations] = await Promise.all([
      listResearchStages(projectId),
      listTasks(projectId),
      listMilestones(projectId),
      getBudgetSummary(projectId),
      listResearchEvents(projectId),
      listAllParticipationsForProject(projectId),
    ]);

    return NextResponse.json({
      stages,
      tasks,
      milestones,
      budget,
      events,
      participations,
    });
  } catch (error) {
    console.error("Project details API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
