import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectRecords } from "@/lib/repositories";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Filter for literature related kinds
    const records = await listProjectRecords([projectId]);
    const libraryItems = records.filter(r => 
      ["literature_review", "literature_note", "output", "conference_abstract", "dissertation_chapter"].includes(r.kind)
    );

    return NextResponse.json({ items: libraryItems });
  } catch (error) {
    console.error("Library API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
