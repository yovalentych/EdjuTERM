import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { institutionProgramInputSchema } from "@/lib/schemas";
import { createProgram, listPrograms } from "@/lib/institutions-db";

export async function GET() {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const programs = await listPrograms(auth.institution._id!);
  return NextResponse.json({ programs });
}

export async function POST(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const input = institutionProgramInputSchema.parse({ ...body, institutionId: auth.institution._id });
    const program = await createProgram(input);
    return NextResponse.json({ program });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}
