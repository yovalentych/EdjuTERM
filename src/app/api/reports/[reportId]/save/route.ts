import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectForUser } from "@/lib/projects";
import { updateReport } from "@/lib/reports";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    projectId: string;
    sectionGoals?: string;
    sectionTimeline?: string;
    sectionResults?: string;
    sectionPublications?: string;
    sectionFinancial?: string;
    sectionProblems?: string;
    sectionPlans?: string;
    sectionMeta?: string;
  };

  const { projectId, ...fields } = body;
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await updateReport(reportId, fields);
  return NextResponse.json({ ok: true });
}
