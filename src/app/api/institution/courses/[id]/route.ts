import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { institutionCourseInputSchema } from "@/lib/schemas";
import { deleteInstitutionCourse, updateInstitutionCourse } from "@/lib/institutions-db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const input = institutionCourseInputSchema.partial().parse(body);
    await updateInstitutionCourse(id, input);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteInstitutionCourse(id);
  return NextResponse.json({ ok: true });
}
