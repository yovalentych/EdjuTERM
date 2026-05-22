import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listExperiments, insertExperiment } from "@/lib/laboratory";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

    const experiments = await listExperiments(projectId);
    return NextResponse.json({ experiments });
  } catch (error) {
    console.error("Experiments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const experiment = await insertExperiment(body, user._id);
    return NextResponse.json({ experiment }, { status: 201 });
  } catch (error) {
    console.error("Experiments POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
