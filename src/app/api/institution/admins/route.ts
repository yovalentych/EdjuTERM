import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { institutionAdminInputSchema } from "@/lib/schemas";
import { listAdmins, createAdmin } from "@/lib/institutions-db";

export async function GET() {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admins = await listAdmins(auth.institution._id!);
  return NextResponse.json({ admins });
}

export async function POST(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const input = institutionAdminInputSchema.parse({ ...body, institutionId: auth.institution._id });
    const admin = await createAdmin(input);
    return NextResponse.json({ admin });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid input" }, { status: 400 });
  }
}
