import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { UploadPolicyError } from "@/lib/file-storage";
import { getProjectForUser } from "@/lib/projects";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { addFilesToRecord, getProjectRecordById } from "@/lib/repositories";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await assertRateLimit("api:record-files:write", { limit: 30, windowMs: 60 * 1000 });
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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await getProjectRecordById(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await getProjectForUser(record.projectId, user);
  if (!project) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  let updated;
  try {
    updated = await addFilesToRecord(id, files);
  } catch (error) {
    if (error instanceof UploadPolicyError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
    }
    throw error;
  }
  if (!updated) return NextResponse.json({ error: "Failed to save files" }, { status: 500 });

  return NextResponse.json({ record: updated }, { status: 201 });
}
