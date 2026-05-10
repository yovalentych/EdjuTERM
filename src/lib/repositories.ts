import { storeRecordFiles } from "@/lib/file-storage";
import { type Locale, getDictionary } from "@/lib/i18n";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import {
  type ProjectRecord,
  type ProjectRecordInput,
  projectRecordSchema,
} from "@/lib/schemas";

const collectionName = "project_records";
const localRecords: ProjectRecord[] = [];
type ProjectRecordPatch = Partial<ProjectRecordInput> &
  Partial<
    Pick<
      ProjectRecord,
      | "status"
      | "processingHistory"
      | "zenodoDepositionId"
      | "zenodoRecordId"
      | "zenodoConceptDoi"
      | "zenodoDoi"
      | "zenodoUrl"
      | "zenodoDraftUrl"
      | "zenodoState"
      | "zenodoSubmitted"
      | "zenodoFileCount"
      | "zenodoFilesSyncedAt"
      | "zenodoPublishedAt"
      | "zenodoSyncedAt"
      | "zenodoSyncError"
    >
  >;

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
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && process.env.MONGO_FALLBACK_TO_LOCAL === "true") {
      return localRecords.filter((record) => projectIds.includes(record.projectId));
    }

    throw error;
  }
}

export async function listAllProjectRecords(limit = 200) {
  if (!hasMongoConfig()) {
    return localRecords.slice(0, limit);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) =>
    projectRecordSchema.parse({
      ...doc,
      _id: doc._id.toString(),
    }),
  );
}

export async function listPublicProjectRecords(limit = 80) {
  if (!hasMongoConfig()) {
    return localRecords
      .filter((record) => record.access === "open" && record.processingStatus === "published")
      .slice(0, limit);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ access: "open", processingStatus: "published" })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) =>
    projectRecordSchema.parse({
      ...doc,
      _id: doc._id.toString(),
    }),
  );
}

export async function insertProjectRecord(
  input: ProjectRecordInput,
  files: File[] = [],
  createdBy: string = "",
  initialStatus: "planned" | "active" | "released" = "planned",
) {
  const now = new Date();
  const recordKey = buildRecordStorageKey(input);
  const rawDataFiles = await storeRecordFiles(recordKey, files, now);
  const record = {
    ...input,
    createdBy,
    status: initialStatus,
    processingHistory: [],
    relatedIds: [],
    rawDataFiles,
    zenodoConceptDoi: "",
    zenodoDoi: "",
    zenodoUrl: "",
    zenodoDraftUrl: "",
    zenodoState: "",
    zenodoSubmitted: false,
    zenodoFileCount: 0,
    zenodoFilesSyncedAt: null,
    zenodoPublishedAt: null,
    zenodoSyncedAt: null,
    zenodoSyncError: "",
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
  patch: ProjectRecordPatch,
) {
  if (!hasMongoConfig()) {
    const local = localRecords.find((record) => record._id === id);
    if (!local) return null;
    Object.assign(local, patch, { updatedAt: new Date() });
    return projectRecordSchema.parse(local);
  }

  const objectId = toObjectId(id);
  if (!objectId) return null;

  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: objectId },
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

  const objectId = toObjectId(id);
  if (!objectId) {
    return null;
  }

  const db = await getMongoDb();
  const doc = await db
    .collection(collectionName)
    .findOne({ _id: objectId });

  return doc
    ? projectRecordSchema.parse({ ...doc, _id: doc._id.toString() })
    : null;
}

export async function getProjectRecordByFileStorageUri(storageUri: string) {
  if (!storageUri) return null;

  if (!hasMongoConfig()) {
    return localRecords.find((record) =>
      record.rawDataFiles.some((file) => file.storageUri === storageUri),
    ) ?? null;
  }

  const db = await getMongoDb();
  const doc = await db
    .collection(collectionName)
    .findOne({ "rawDataFiles.storageUri": storageUri });

  return doc
    ? projectRecordSchema.parse({ ...doc, _id: doc._id.toString() })
    : null;
}

export async function archiveProjectRecord(id: string): Promise<ProjectRecord | null> {
  if (!hasMongoConfig()) {
    const local = localRecords.find((r) => r._id === id);
    if (local) { local.archivedAt = new Date(); local.updatedAt = new Date(); return local; }
    return null;
  }
  const objectId = toObjectId(id);
  if (!objectId) return null;

  const db = await getMongoDb();
  const now = new Date();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: objectId },
    { $set: { archivedAt: now, updatedAt: now } },
    { returnDocument: "after" },
  );
  return result ? projectRecordSchema.parse({ ...result, _id: result._id.toString() }) : null;
}

export async function restoreProjectRecord(id: string): Promise<ProjectRecord | null> {
  if (!hasMongoConfig()) {
    const local = localRecords.find((r) => r._id === id);
    if (local) { delete local.archivedAt; local.updatedAt = new Date(); return local; }
    return null;
  }
  const objectId = toObjectId(id);
  if (!objectId) return null;

  const db = await getMongoDb();
  const now = new Date();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: objectId },
    { $unset: { archivedAt: "" }, $set: { updatedAt: now } },
    { returnDocument: "after" },
  );
  return result ? projectRecordSchema.parse({ ...result, _id: result._id.toString() }) : null;
}

export async function hardDeleteProjectRecord(id: string): Promise<boolean> {
  if (!hasMongoConfig()) {
    const idx = localRecords.findIndex((r) => r._id === id);
    if (idx !== -1) { localRecords.splice(idx, 1); return true; }
    return false;
  }
  const objectId = toObjectId(id);
  if (!objectId) return false;
  const db = await getMongoDb();
  const result = await db.collection(collectionName).deleteOne({ _id: objectId });
  return result.deletedCount === 1;
}

export async function addFilesToRecord(id: string, files: File[]): Promise<ProjectRecord | null> {
  const record = await getProjectRecordById(id);
  if (!record) return null;

  const recordKey = safeFilename(`${record.projectId}-${record.localId}`);
  const now = new Date();
  const newFiles = await storeRecordFiles(recordKey, files, now);
  if (newFiles.length === 0) return record;

  if (!hasMongoConfig()) {
    const local = localRecords.find((r) => r._id === id);
    if (local) {
      local.rawDataFiles.push(...newFiles);
      local.updatedAt = now;
      return local;
    }
    return null;
  }

  const objectId = toObjectId(id);
  if (!objectId) return null;

  const db = await getMongoDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = { $push: { rawDataFiles: { $each: newFiles } }, $set: { updatedAt: now } };
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: objectId },
    update,
    { returnDocument: "after" },
  );

  return result
    ? projectRecordSchema.parse({ ...result, _id: result._id.toString() })
    : null;
}

export async function forkRecordAsVersion(
  sourceId: string,
  patch: { versionNote?: string; version?: string; title?: string },
  createdBy: string = "",
): Promise<ProjectRecord | null> {
  const source = await getProjectRecordById(sourceId);
  if (!source) return null;

  const rootRecordId = source.rootRecordId || source._id || "";
  const { _id: _removed, createdAt: _ca, updatedAt: _ua, status: _st, processingHistory: _ph, relatedIds: _ri, rawDataFiles: _rf,
    archivedAt: _aa, zenodoDepositionId: _zd, zenodoRecordId: _zr, zenodoConceptDoi: _zcd, zenodoDoi: _zdoi,
    zenodoUrl: _zu, zenodoDraftUrl: _zdu, zenodoState: _zs, zenodoSubmitted: _zsub, zenodoFileCount: _zfc,
    zenodoFilesSyncedAt: _zfs, zenodoPublishedAt: _zpa, zenodoSyncedAt: _zsa, zenodoSyncError: _zse,
    createdBy: _cb, ...inputFields } = source;

  const input: ProjectRecordInput = {
    ...inputFields,
    localId: `${source.localId}-v${Date.now().toString(36)}`,
    rootRecordId,
    parentVersionId: sourceId,
    variantLabel: source.variantLabel || "",
    versionNote: patch.versionNote ?? "",
    version: patch.version ?? "",
    title: patch.title || source.title,
  };

  return insertProjectRecord(input, [], createdBy, "planned");
}

export async function forkRecordAsVariant(
  sourceId: string,
  variantLabel: string,
  patch: { versionNote?: string; title?: string },
  createdBy: string = "",
): Promise<ProjectRecord | null> {
  const source = await getProjectRecordById(sourceId);
  if (!source) return null;

  const rootRecordId = source.rootRecordId || source._id || "";
  const { _id: _removed, createdAt: _ca, updatedAt: _ua, status: _st, processingHistory: _ph, relatedIds: _ri, rawDataFiles: _rf,
    archivedAt: _aa, zenodoDepositionId: _zd, zenodoRecordId: _zr, zenodoConceptDoi: _zcd, zenodoDoi: _zdoi,
    zenodoUrl: _zu, zenodoDraftUrl: _zdu, zenodoState: _zs, zenodoSubmitted: _zsub, zenodoFileCount: _zfc,
    zenodoFilesSyncedAt: _zfs, zenodoPublishedAt: _zpa, zenodoSyncedAt: _zsa, zenodoSyncError: _zse,
    createdBy: _cb, ...inputFields } = source;

  const input: ProjectRecordInput = {
    ...inputFields,
    localId: `${source.localId}-var-${Date.now().toString(36)}`,
    rootRecordId,
    parentVersionId: sourceId,
    variantLabel,
    versionNote: patch.versionNote ?? "",
    title: patch.title || source.title,
  };

  return insertProjectRecord(input, [], createdBy, "planned");
}

export async function deleteProjectRecord(id: string) {
  if (!hasMongoConfig()) {
    return false;
  }

  const objectId = toObjectId(id);
  if (!objectId) return false;

  const db = await getMongoDb();
  const result = await db
    .collection(collectionName)
    .deleteOne({ _id: objectId });
  return result.deletedCount === 1;
}

async function ensureIndexes() {
  const db = await getMongoDb();
  const col = db.collection(collectionName);

  // Drop any existing text index that lacks language_override — MongoDB cannot update
  // index options in-place, so we must drop and recreate when options change.
  try {
    const existing = await col.indexes();
    const badTextIndex = existing.find(
      (idx) =>
        Object.values(idx.key as Record<string, unknown>).includes("text") &&
        idx.language_override !== "_textLanguage",
    );
    if (badTextIndex?.name) await col.dropIndex(badTextIndex.name);
  } catch {
    // Collection may not exist yet — that's fine, createIndexes will create it.
  }

  await col.createIndexes([
    { key: { localId: 1 }, unique: true },
    { key: { projectId: 1 } },
    { key: { group: 1, createdAt: -1 } },
    { key: { kind: 1, stage: 1 } },
    { key: { access: 1 } },
    {
      key: { title: "text", summary: "text", usageNotes: "text", keywords: "text" },
      // Prevent MongoDB from treating the `language` document field as a language override.
      // MongoDB only supports a limited set of languages (e.g. "en", "fr"); "uk" is not among them.
      language_override: "_textLanguage",
    },
  ]);
}

function buildRecordStorageKey(input: ProjectRecordInput) {
  return safeFilename(`${input.projectId}-${input.localId}-${Date.now()}`);
}

function safeFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file";
}
