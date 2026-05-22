import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { courseMemberInputSchema } from "@/lib/schemas";
import { removeMember, updateMember } from "@/lib/learning";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const input = courseMemberInputSchema.partial().parse(body);
    await updateMember(id, input);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await removeMember(id);
  return NextResponse.json({ ok: true });
}
