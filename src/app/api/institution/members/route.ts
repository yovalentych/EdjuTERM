import { NextResponse } from "next/server";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { institutionMemberInputSchema } from "@/lib/schemas";
import { createMember, listMembers } from "@/lib/institutions-db";

export async function GET(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const unitId = url.searchParams.get("unitId") || undefined;
  const members = await listMembers(auth.institution._id!, unitId);
  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const input = institutionMemberInputSchema.parse({ ...body, institutionId: auth.institution._id });
    const member = await createMember(input);
    return NextResponse.json({ member });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}
