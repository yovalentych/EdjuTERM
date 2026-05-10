import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type Report,
  type ReportInput,
  type ReportStatus,
  type SafeUser,
  reportSchema,
} from "@/lib/schemas";

// ── in-memory fallback ────────────────────────────────────────────────────────

const localReports: Report[] = [];

// ── Reports ───────────────────────────────────────────────────────────────────

export async function createReport(
  input: ReportInput,
  user: SafeUser,
): Promise<Report> {
  const now = new Date();
  const report: Report = {
    ...input,
    status: "draft",
    submittedAt: null,
    approvedAt: null,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local: Report = {
      ...report,
      _id: `local-report-${localReports.length + 1}`,
    };
    localReports.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureReportIndexes(db);
  const { _id, ...insert } = report;
  void _id;
  const result = await db.collection("project_reports").insertOne(insert);
  return { ...report, _id: result.insertedId.toString() };
}

export async function listReports(projectId: string): Promise<Report[]> {
  if (!hasMongoConfig()) {
    return localReports
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("project_reports")
    .find({ projectId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    reportSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function getReport(
  reportId: string,
  projectId: string,
): Promise<Report | null> {
  if (!hasMongoConfig()) {
    return (
      localReports.find(
        (r) => r._id === reportId && r.projectId === projectId,
      ) ?? null
    );
  }

  if (!ObjectId.isValid(reportId)) return null;

  const db = await getMongoDb();
  const doc = await db
    .collection("project_reports")
    .findOne({ _id: new ObjectId(reportId), projectId });

  if (!doc) return null;
  return reportSchema.parse({ ...doc, _id: doc._id.toString() });
}

export async function updateReport(
  reportId: string,
  input: Partial<ReportInput>,
): Promise<void> {
  const now = new Date();
  const update = { ...input, updatedAt: now };

  if (!hasMongoConfig()) {
    const report = localReports.find((r) => r._id === reportId);
    if (report) Object.assign(report, update);
    return;
  }

  if (!ObjectId.isValid(reportId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("project_reports")
    .updateOne({ _id: new ObjectId(reportId) }, { $set: update });
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  user: SafeUser,
): Promise<void> {
  void user;
  const now = new Date();

  const update: Record<string, unknown> = { status, updatedAt: now };
  if (status === "submitted") update.submittedAt = now;
  if (status === "approved") update.approvedAt = now;

  if (!hasMongoConfig()) {
    const report = localReports.find((r) => r._id === reportId);
    if (report) Object.assign(report, update);
    return;
  }

  if (!ObjectId.isValid(reportId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("project_reports")
    .updateOne({ _id: new ObjectId(reportId) }, { $set: update });
}

export async function deleteReport(
  reportId: string,
  projectId: string,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localReports.findIndex(
      (r) => r._id === reportId && r.projectId === projectId,
    );
    if (idx !== -1) localReports.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(reportId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("project_reports")
    .deleteOne({ _id: new ObjectId(reportId), projectId });
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function ensureReportIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await db
    .collection("project_reports")
    .createIndex({ projectId: 1, createdAt: -1 });
}
