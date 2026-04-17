import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { seedRecords, stages } from "@/lib/project-data";
import {
  type ProjectRecord,
  type ProjectRecordInput,
  projectRecordSchema,
} from "@/lib/schemas";

const collectionName = "project_records";
const localRecords = [...seedRecords];

export async function getDashboardData() {
  const records = await listProjectRecords();
  const openOrPrepared = records.filter((record) =>
    ["open", "embargoed"].includes(record.access),
  ).length;

  return {
    records,
    stages,
    metrics: [
      {
        label: "Project records",
        value: records.length,
        detail: "datasets, protocols, tasks, outputs",
      },
      {
        label: "Datasets",
        value: records.filter((record) => record.kind === "dataset").length,
        detail: "raw and processed data objects",
      },
      {
        label: "Protocols",
        value: records.filter((record) => record.kind === "protocol").length,
        detail: "protocols.io-ready records",
      },
      {
        label: "Open-ready",
        value: openOrPrepared,
        detail: "open or embargoed records",
      },
    ],
    readiness: [
      { label: "Data management plan", value: 45 },
      { label: "Protocol registry", value: 35 },
      { label: "Dataset metadata", value: 30 },
      { label: "Repository release path", value: 40 },
    ],
  };
}

export async function listProjectRecords(): Promise<ProjectRecord[]> {
  if (!hasMongoConfig()) {
    return localRecords;
  }

  try {
    const db = await getMongoDb();
    const docs = await db
      .collection(collectionName)
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    if (docs.length === 0) {
      return localRecords;
    }

    return docs.map((doc) =>
      projectRecordSchema.parse({
        ...doc,
        _id: doc._id.toString(),
      }),
    );
  } catch {
    return localRecords;
  }
}

export async function insertProjectRecord(input: ProjectRecordInput) {
  const now = new Date();
  const record = {
    ...input,
    status: "planned" as const,
    relatedIds: [],
    rawDataFiles: [],
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    localRecords.unshift(record);
    return { ...record, _id: `local-${record.localId}` };
  }

  const db = await getMongoDb();
  await ensureIndexes();
  const result = await db.collection(collectionName).insertOne(record);
  return { ...record, _id: result.insertedId.toString() };
}

export async function updateProjectRecord(
  id: string,
  patch: Partial<ProjectRecordInput> & { status?: ProjectRecord["status"] },
) {
  if (!hasMongoConfig()) {
    return null;
  }

  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  return result
    ? projectRecordSchema.parse({ ...result, _id: result._id.toString() })
    : null;
}

export async function deleteProjectRecord(id: string) {
  if (!hasMongoConfig()) {
    return false;
  }

  const db = await getMongoDb();
  const result = await db
    .collection(collectionName)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

async function ensureIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { localId: 1 }, unique: true },
    { key: { kind: 1, stage: 1 } },
    { key: { access: 1 } },
    { key: { title: "text", summary: "text" } },
  ]);
}
