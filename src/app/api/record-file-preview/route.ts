import { NextResponse } from "next/server";
import { GET as previewRecordFile } from "@/app/api/records/[id]/files/[fileIndex]/preview/route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const recordId = url.searchParams.get("recordId");
  const fileIndex = url.searchParams.get("fileIndex");

  if (!recordId || fileIndex === null) {
    return NextResponse.json({
      error: "Не передано recordId або fileIndex для попереднього перегляду.",
    });
  }

  return previewRecordFile(request, {
    params: Promise.resolve({ id: recordId, fileIndex }),
  });
}
