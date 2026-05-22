import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { endAffiliation, deleteAffiliation } from "@/lib/users";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const updated = await endAffiliation(user._id!, id);
  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const updated = await deleteAffiliation(user._id!, id);
  return NextResponse.json({ user: updated });
}
