import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { updateTaskStatus } from "@/lib/planning";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;
    const { status } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json({ error: "Task ID and status required" }, { status: 400 });
    }

    await updateTaskStatus(taskId, status, user);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update task status API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
