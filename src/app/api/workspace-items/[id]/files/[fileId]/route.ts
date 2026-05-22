import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listItemFiles, readStoredFile } from "@/lib/item-files";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id, fileId } = await params;
  const files = await listItemFiles(id);
  const file = files.find((f) => f._id === fileId);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const body = await readStoredFile(file.storageUri);
  const headers = new Headers({
    "Content-Type": file.mimeType ?? "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  });
  if (file.bytes) headers.set("Content-Length", String(file.bytes));
  return new NextResponse(body, { headers });
}
