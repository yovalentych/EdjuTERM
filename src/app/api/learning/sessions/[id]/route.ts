import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { updateSession, deleteSession } from "@/lib/learning";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    await updateSession(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Session PATCH error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await deleteSession(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Session DELETE error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
