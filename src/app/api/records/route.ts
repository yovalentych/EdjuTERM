import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import {
  insertProjectRecord,
  listProjectRecords,
} from "@/lib/repositories";
import { projectRecordInputSchema } from "@/lib/schemas";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await listProjectRecords();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const input = projectRecordInputSchema.parse(body);
  const record = await insertProjectRecord(input);
  return NextResponse.json({ record }, { status: 201 });
}
