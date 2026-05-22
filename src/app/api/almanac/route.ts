import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listAuditEvents } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const events = await listAuditEvents({ projectId, limit: 100 });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Almanac GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
