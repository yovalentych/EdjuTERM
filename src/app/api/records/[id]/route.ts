import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import {
  deleteProjectRecord,
  getProjectRecordById,
  updateProjectRecord,
} from "@/lib/repositories";
import { projectRecordInputSchema } from "@/lib/schemas";

export async function PATCH(request: Request, ctx: RouteContext<"/api/records/[id]">) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const existingRecord = await getProjectRecordById(id);
  const projects = await listProjectsForUser(user);

  if (
    !existingRecord ||
    !projects.some((project) => project._id === existingRecord.projectId)
  ) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const body = await request.json();
  const patch = projectRecordInputSchema.partial().parse(body);
  const record = await updateProjectRecord(id, patch);

  if (!record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  return NextResponse.json({ record });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/records/[id]">) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const existingRecord = await getProjectRecordById(id);
  const projects = await listProjectsForUser(user);

  if (
    !existingRecord ||
    !projects.some((project) => project._id === existingRecord.projectId)
  ) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const deleted = await deleteProjectRecord(id);

  if (!deleted) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted });
}
