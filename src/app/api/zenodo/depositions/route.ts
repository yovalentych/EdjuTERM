import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { listProjectsForUser } from "@/lib/projects";
import { getProjectRecordById } from "@/lib/repositories";
import {
  publishRecordToZenodo,
  syncRecordFilesToZenodo,
  syncRecordMetadataToZenodo,
  validateZenodoPublishReadiness,
} from "@/lib/zenodo";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: "metadata" | "files" | "publish";
    confirmPublish?: boolean;
    recordId?: string;
  } | null;
  const recordId = body?.recordId;
  const action = body?.action ?? "metadata";

  if (!recordId) {
    return NextResponse.json({ error: "recordId is required" }, { status: 400 });
  }

  const record = await getProjectRecordById(recordId);
  if (!record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const projects = await listProjectsForUser(user);
  if (!projects.some((project) => project._id === record.projectId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (action === "publish" && !body?.confirmPublish) {
      return NextResponse.json(
        { error: "confirmPublish is required" },
        { status: 400 },
      );
    }

    if (action === "publish") {
      const readiness = validateZenodoPublishReadiness(record);
      if (!readiness.ready) {
        return NextResponse.json(
          { error: "Zenodo publish is not ready", issues: readiness.issues },
          { status: 400 },
        );
      }
    }

    const updated =
      action === "files"
        ? await syncRecordFilesToZenodo(record, user)
        : action === "publish"
          ? await publishRecordToZenodo(record, user)
          : await syncRecordMetadataToZenodo(record, user);

    return NextResponse.json({
      recordId: updated._id,
      zenodoDepositionId: updated.zenodoDepositionId,
      zenodoRecordId: updated.zenodoRecordId,
      zenodoDoi: updated.zenodoDoi,
      zenodoConceptDoi: updated.zenodoConceptDoi,
      zenodoUrl: updated.zenodoUrl,
      zenodoDraftUrl: updated.zenodoDraftUrl,
      zenodoState: updated.zenodoState,
      zenodoSubmitted: updated.zenodoSubmitted,
      zenodoFileCount: updated.zenodoFileCount,
      zenodoFilesSyncedAt: updated.zenodoFilesSyncedAt,
      zenodoPublishedAt: updated.zenodoPublishedAt,
      zenodoSyncedAt: updated.zenodoSyncedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Zenodo sync failed" },
      { status: 502 },
    );
  }
}
