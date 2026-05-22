import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { addMemberByEmail, removeMember } from "@/lib/item-members";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { email, role = "member" } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const result = await addMemberByEmail(id, email, role, user);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ member: result.member });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const result = await removeMember(id, userId, user);
  if (!result.ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
