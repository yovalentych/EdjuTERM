import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { institutionUnitInputSchema } from "@/lib/schemas";
import { createUnit, listUnits } from "@/lib/institutions-db";

export async function GET() {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const units = await listUnits(auth.institution._id!);
  return NextResponse.json({ units });
}

export async function POST(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const input = institutionUnitInputSchema.parse({ ...body, institutionId: auth.institution._id });
    const unit = await createUnit(input);
    return NextResponse.json({ unit });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}
