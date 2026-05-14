import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listSessionsForProject, listAssignmentsForProject } from "@/lib/learning";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const [sessions, assignments] = await Promise.all([
      listSessionsForProject(projectId),
      listAssignmentsForProject(projectId),
    ]);

    // Map to mobile shapes
    const mobileSessions = sessions.map(s => ({
      id: s._id,
      title: s.title,
      time: `${s.startTime} - ${s.endTime}`,
      location: s.location || "Online",
      type: s.sessionType || "lecture",
    }));

    const mobileAssignments = assignments.map(a => ({
      id: a._id,
      title: a.title,
      dueDate: a.dueDate,
      course: a.courseId, // simplified
      priority: (a.status === "late" || a.status === "missing") ? "high" : "medium",
    }));

    return NextResponse.json({
      sessions: mobileSessions,
      assignments: mobileAssignments,
    });
  } catch (error) {
    console.error("Learning API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
