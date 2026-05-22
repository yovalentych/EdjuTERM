import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { updateWorkspaceForUser, deleteWorkspaceForUser, workspaceInputSchema } from "@/lib/workspaces";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const input = workspaceInputSchema.partial().parse(body);
    const workspace = await updateWorkspaceForUser(id, input, user);
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ workspace });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteWorkspaceForUser(id, user);
  if (!ok) return NextResponse.json({ error: "Cannot delete (default or not found)" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
