import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listInventoryItems, insertInventoryItem } from "@/lib/laboratory";
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

    // Fetch the project to find linked labs
    const project = await getProjectById(projectId);
    const linkedIds = project?.linkedLabIds || [];
    
    // We fetch inventory for the project itself AND any linked labs
    const idsToFetch = [projectId, ...linkedIds];

    const items = await listInventoryItems(idsToFetch);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Lab Inventory GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user._id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const item = await insertInventoryItem(body, user._id);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Lab Inventory POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
