import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { UploadPolicyError } from "@/lib/file-storage";
import { listItemFiles, uploadItemFiles, deleteItemFile } from "@/lib/item-files";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const files = await listItemFiles(id);
  return NextResponse.json({ files });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const files = formData
    .getAll("files")
    .filter((v): v is File => v instanceof File && v.size > 0);

  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

  try {
    const stored = await uploadItemFiles(id, files, user._id ?? "");
    return NextResponse.json({ files: stored }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadPolicyError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  const ok = await deleteItemFile(fileId, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
