import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import {
  insertProjectRecord,
  listProjectRecords,
} from "@/lib/repositories";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
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
  try {
    await assertRateLimit("api:records:write", { limit: 60, windowMs: 60 * 1000 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited" },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = projectRecordInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid record payload" }, { status: 400 });
  }
  const input = parsed.data;
  const projects = await listProjectsForUser(user);

  if (!projects.some((project) => project._id === input.projectId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = await insertProjectRecord(input);
  return NextResponse.json({ record }, { status: 201 });
}
