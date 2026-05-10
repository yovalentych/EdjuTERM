import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type OpenScienceUpdate,
  type OpenScienceUpdateInput,
  type SafeUser,
  openScienceUpdateSchema,
} from "@/lib/schemas";

const collectionName = "open_science_updates";
const localUpdates: OpenScienceUpdate[] = [];

export async function createOpenScienceUpdate(
  input: OpenScienceUpdateInput,
  user: SafeUser,
) {
  if (!user._id) {
    throw new Error("USER_ID_REQUIRED");
  }

  const now = new Date();
  const update: OpenScienceUpdate = {
    ...input,
    createdBy: user._id,
    publishedAt: input.status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const localUpdate = {
      ...update,
      _id: `local-open-science-${localUpdates.length + 1}`,
    };
    localUpdates.unshift(localUpdate);
    return localUpdate;
  }

  const db = await getMongoDb();
  await ensureOpenScienceIndexes();
  const { _id, ...insertUpdate } = update;
  void _id;
  const result = await db.collection(collectionName).insertOne(insertUpdate);

  return { ...update, _id: result.insertedId.toString() };
}

export async function getOpenScienceUpdateById(id: string): Promise<OpenScienceUpdate | null> {
  if (!hasMongoConfig()) {
    return localUpdates.find((u) => u._id === id) ?? null;
  }
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });
  return doc ? openScienceUpdateSchema.parse({ ...doc, _id: doc._id.toString() }) : null;
}

export async function getOpenScienceUpdateByLinkedRecord(
  projectId: string,
  recordId: string,
): Promise<OpenScienceUpdate | null> {
  if (!projectId || !recordId) return null;

  if (!hasMongoConfig()) {
    return localUpdates.find((update) =>
      update.projectId === projectId && update.linkedRecordIds.includes(recordId),
    ) ?? null;
  }

  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({
    projectId,
    linkedRecordIds: recordId,
  });

  return doc ? openScienceUpdateSchema.parse({ ...doc, _id: doc._id.toString() }) : null;
}

export async function updateOpenScienceUpdate(
  id: string,
  patch: Partial<OpenScienceUpdateInput>,
  user: SafeUser,
): Promise<OpenScienceUpdate | null> {
  if (!hasMongoConfig()) {
    const local = localUpdates.find((u) => u._id === id);
    if (local) {
      Object.assign(local, patch, {
        updatedBy: user._id,
        updatedAt: new Date(),
        publishedAt: patch.status === "published" && !local.publishedAt ? new Date() : local.publishedAt,
      });
      return local;
    }
    return null;
  }
  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const now = new Date();
  const setPatch: Record<string, unknown> = { ...patch, updatedBy: user._id, updatedAt: now };
  if (patch.status === "published") setPatch.publishedAt = now;
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: setPatch },
    { returnDocument: "after" },
  );
  return result ? openScienceUpdateSchema.parse({ ...result, _id: result._id.toString() }) : null;
}

export async function deleteOpenScienceUpdate(id: string): Promise<boolean> {
  if (!hasMongoConfig()) {
    const idx = localUpdates.findIndex((u) => u._id === id);
    if (idx !== -1) { localUpdates.splice(idx, 1); return true; }
    return false;
  }
  if (!ObjectId.isValid(id)) return false;
  const db = await getMongoDb();
  const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function listOpenScienceUpdatesForProjects(projectIds: string[]) {
  if (projectIds.length === 0) {
    return [];
  }

  if (!hasMongoConfig()) {
    return localUpdates.filter((update) => projectIds.includes(update.projectId));
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ projectId: { $in: projectIds } })
    .sort({ updatedAt: -1 })
    .toArray();

  return docs.map((doc) =>
    openScienceUpdateSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function listPublishedOpenScienceUpdates() {
  if (!hasMongoConfig()) {
    return localUpdates.filter((update) => update.status === "published");
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ status: "published" })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .toArray();

  return docs.map((doc) =>
    openScienceUpdateSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function listAllOpenScienceUpdates(limit = 200) {
  if (!hasMongoConfig()) {
    return localUpdates.slice(0, limit);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({})
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) =>
    openScienceUpdateSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

async function ensureOpenScienceIndexes() {
  const db = await getMongoDb();
  // Drop any existing text index before (re)creating — MongoDB rejects index
  // updates when fields or name differ from the stored definition.
  try {
    await db.collection(collectionName).dropIndex("title_text_summary_text_content_text");
  } catch {
    // Index may not exist yet — ignore.
  }
  await db.collection(collectionName).createIndexes([
    { key: { projectId: 1 } },
    { key: { category: 1, publishedAt: -1 } },
    { key: { status: 1, publishedAt: -1 } },
    { key: { title: "text", summary: "text", content: "text", accessibilityNotes: "text" } },
  ]);
}
