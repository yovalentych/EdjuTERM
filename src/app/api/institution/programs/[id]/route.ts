import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { institutionProgramInputSchema } from "@/lib/schemas";
import { deleteProgram, updateProgram } from "@/lib/institutions-db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const input = institutionProgramInputSchema.partial().parse(body);
    await updateProgram(id, input);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteProgram(id);
  return NextResponse.json({ ok: true });
}
