import { NextResponse } from "next/server";
import {
  insertProjectRecord,
  listProjectRecords,
} from "@/lib/repositories";
import { projectRecordInputSchema } from "@/lib/schemas";

export async function GET() {
  const records = await listProjectRecords();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const body = await request.json();
  const input = projectRecordInputSchema.parse(body);
  const record = await insertProjectRecord(input);
  return NextResponse.json({ record }, { status: 201 });
}
