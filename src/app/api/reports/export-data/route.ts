import { NextResponse } from "next/server";
import { collectReportExportData } from "@/lib/report-export-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const reportId = searchParams.get("reportId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const data = await collectReportExportData(projectId, reportId);
  if (!data) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  return NextResponse.json(data);
}
