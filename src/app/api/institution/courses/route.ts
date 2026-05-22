import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { institutionCourseInputSchema } from "@/lib/schemas";
import { createInstitutionCourse, listInstitutionCourses } from "@/lib/institutions-db";

export async function GET(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const programId = url.searchParams.get("programId") || undefined;
  const courses = await listInstitutionCourses(auth.institution._id!, programId);
  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const input = institutionCourseInputSchema.parse({ ...body, institutionId: auth.institution._id });
    const course = await createInstitutionCourse(input);
    return NextResponse.json({ course });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}
