import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listEquipment, insertEquipment } from "@/lib/laboratory";
import { getProjectById } from "@/lib/projects";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    const linkedIds = project?.linkedLabIds || [];
    const idsToFetch = [projectId, ...linkedIds];

    const equipment = await listEquipment(idsToFetch);
    return NextResponse.json({ equipment });
  } catch (error) {
    console.error("Lab Equipment GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const equipment = await insertEquipment(body, user._id);

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    console.error("Lab Equipment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
