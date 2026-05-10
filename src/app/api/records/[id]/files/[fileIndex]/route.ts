import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { readStoredFile } from "@/lib/file-storage";
import { getProjectForUser } from "@/lib/projects";
import { getProjectRecordById } from "@/lib/repositories";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<unknown>;
  },
) {
  const user = await getCurrentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id, fileIndex } = await params as { id: string; fileIndex: string };
  const record = await getProjectRecordById(id);

  if (!record) {
    return new NextResponse("Not found", { status: 404 });
  }

  const project = await getProjectForUser(record.projectId, user);

  if (!project) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const index = Number.parseInt(fileIndex, 10);
  const file = Number.isInteger(index) ? record.rawDataFiles[index] : null;

  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = await readStoredFile(file.storageUri);
  const headers = new Headers({
    "Content-Type": file.mimeType || "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  });

  if (file.bytes) {
    headers.set("Content-Length", String(file.bytes));
  }

  return new NextResponse(body, { headers });
}
