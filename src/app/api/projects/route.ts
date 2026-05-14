import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await listProjectsForUser(user);

    // Map to MobileProject shape
    const mobileProjects = projects.map((p) => ({
      id: p._id,
      acronym: p.acronym,
      title: p.title,
      status: p.status,
      // For now, return basic info. Future refinement can include real budget/counters.
      budget: {
        planned: 0,
        committed: 0,
        spent: 0,
        remaining: 0,
      },
      counters: {
        records: 0,
        tasks: 0,
        events: 0,
        warnings: 0,
      },
    }));

    return NextResponse.json({ projects: mobileProjects });
  } catch (error) {
    console.error("Projects API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
