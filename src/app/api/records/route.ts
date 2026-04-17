import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
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

  const projects = await listProjectsForUser(user);
  const projectIds = projects
    .map((project) => project._id)
    .filter((id): id is string => Boolean(id));
  const records = await listProjectRecords(projectIds);
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const input = projectRecordInputSchema.parse(body);
  const projects = await listProjectsForUser(user);

  if (!projects.some((project) => project._id === input.projectId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await insertProjectRecord(input);
  return NextResponse.json({ record }, { status: 201 });
}
