import { ObjectId } from "mongodb";
import { type Locale, getDictionary } from "@/lib/i18n";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type ProjectRecord,
  type ProjectRecordInput,
  projectRecordSchema,
} from "@/lib/schemas";

const collectionName = "project_records";
const localRecords: ProjectRecord[] = [];

export async function getDashboardData(locale: Locale, projectIds: string[]) {
  const dictionary = getDictionary(locale);
  const records = await listProjectRecords(projectIds);
  const openOrPrepared = records.filter((record) =>
    ["open", "embargoed"].includes(record.access),
  ).length;

  return {
    records,
    metrics: [
      {
        label: dictionary.metrics.records,
        value: records.length,
        detail: dictionary.metrics.recordsDetail,
      },
      {
        label: dictionary.metrics.datasets,
        value: records.filter((record) => record.kind === "dataset").length,
        detail: dictionary.metrics.datasetsDetail,
      },
      {
        label: dictionary.metrics.protocols,
        value: records.filter((record) => record.kind === "protocol").length,
        detail: dictionary.metrics.protocolsDetail,
      },
      {
        label: dictionary.metrics.openReady,
        value: openOrPrepared,
        detail: dictionary.metrics.openReadyDetail,
      },
    ],
  };
}

export async function listProjectRecords(
  projectIds: string[] = [],
): Promise<ProjectRecord[]> {
  if (!hasMongoConfig()) {
    return localRecords.filter((record) => projectIds.includes(record.projectId));
  }

  if (projectIds.length === 0) {
    return [];
  }

  try {
    const db = await getMongoDb();
    const docs = await db
      .collection(collectionName)
      .find({ projectId: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

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
    const localRecord = { ...record, _id: `local-${record.localId}` };
    localRecords.unshift(localRecord);
    return localRecord;
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

export async function getProjectRecordById(id: string) {
  if (!hasMongoConfig()) {
    return localRecords.find((record) => record._id === id) ?? null;
  }

  const db = await getMongoDb();
  const doc = await db
    .collection(collectionName)
    .findOne({ _id: new ObjectId(id) });

  return doc
    ? projectRecordSchema.parse({ ...doc, _id: doc._id.toString() })
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
    { key: { projectId: 1 } },
    { key: { kind: 1, stage: 1 } },
    { key: { access: 1 } },
    { key: { title: "text", summary: "text" } },
  ]);
}
