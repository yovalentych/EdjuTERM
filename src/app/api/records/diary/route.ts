import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listDiaryEntries, createDiaryEntry } from "@/lib/diary";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const entries = await listDiaryEntries(projectId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Diary GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const entry = await createDiaryEntry(body);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Diary POST API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
