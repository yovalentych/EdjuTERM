import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listWorkspacesForUser, createWorkspaceForUser, workspaceInputSchema } from "@/lib/workspaces";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaces = await listWorkspacesForUser(user);
  return NextResponse.json({ workspaces });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = workspaceInputSchema.parse(body);
    const workspace = await createWorkspaceForUser(input, user);
    return NextResponse.json({ workspace });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}
