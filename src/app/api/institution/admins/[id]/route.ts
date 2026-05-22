import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { updateAdmin, deleteAdmin } from "@/lib/institutions-db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const patch = await req.json();
  await updateAdmin(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteAdmin(id);
  return NextResponse.json({ ok: true });
}
