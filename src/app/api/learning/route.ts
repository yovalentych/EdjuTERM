import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectForUser } from "@/lib/projects";
import { getItemForUser } from "@/lib/workspaces";
import { 
  listCourses, listModulesForProject, listTopicsForProject, 
  listAssessmentsForProject, listSessionsForProject, listAssignmentsForProject,
  updateAssessment,
} from "@/lib/learning";

async function canAccessLearningProject(projectId: string, user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return false;
  const project = await getProjectForUser(projectId, user);
  if (project) return true;
  const item = await getItemForUser(projectId, user);
  return Boolean(item);
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }
    if (!await canAccessLearningProject(projectId, user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [courses, modules, topics, assessments, sessions, assignments] = await Promise.all([
      listCourses(projectId),
      listModulesForProject(projectId),
      listTopicsForProject(projectId),
      listAssessmentsForProject(projectId),
      listSessionsForProject(projectId),
      listAssignmentsForProject(projectId),
    ]);

    return NextResponse.json({
      courses,
      modules,
      topics,
      assessments,
      sessions,
      assignments,
    });
  } catch (error) {
    console.error("Learning API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      projectId?: string;
      assessmentId?: string;
      achievedScore?: number | null;
    };
    const projectId = body.projectId?.trim();
    const assessmentId = body.assessmentId?.trim();

    if (!projectId || !assessmentId) {
      return NextResponse.json({ error: "Project ID and assessment ID required" }, { status: 400 });
    }
    if (!await canAccessLearningProject(projectId, user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assessments = await listAssessmentsForProject(projectId);
    const assessment = assessments.find((item) => item._id === assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const score = body.achievedScore;
    if (score !== null && (typeof score !== "number" || !Number.isFinite(score))) {
      return NextResponse.json({ error: "Score must be a number or null" }, { status: 400 });
    }
    if (typeof score === "number" && assessment.maxScore > 0 && (score < 0 || score > assessment.maxScore)) {
      return NextResponse.json({ error: `Score must be between 0 and ${assessment.maxScore}` }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const patch = {
      achievedScore: score ?? null,
      status: score == null
        ? assessment.status
        : assessment.status === "passed_retake"
          ? "passed_retake"
          : "completed",
      completedDate: score == null ? assessment.completedDate : (assessment.completedDate || today),
    };

    await updateAssessment(assessmentId, patch);

    return NextResponse.json({
      assessment: {
        ...assessment,
        ...patch,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Learning API update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
