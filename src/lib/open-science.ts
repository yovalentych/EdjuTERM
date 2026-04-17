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

async function ensureOpenScienceIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { projectId: 1 } },
    { key: { status: 1, publishedAt: -1 } },
    { key: { title: "text", summary: "text", content: "text" } },
  ]);
}
