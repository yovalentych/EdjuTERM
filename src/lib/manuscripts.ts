import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type Manuscript,
  type ManuscriptInput,
  type ManuscriptStatus,
  type SafeUser,
  manuscriptSchema,
  manuscriptInputSchema,
} from "@/lib/schemas";

// ── in-memory fallback ────────────────────────────────────────────────────────

const localManuscripts: Manuscript[] = [];

// ── Manuscripts ──────────────────────────────────────────────────────────────

export async function createManuscript(
  input: ManuscriptInput,
  user: SafeUser,
): Promise<Manuscript> {
  const now = new Date();
  const parsed = manuscriptInputSchema.parse(input);
  const manuscript: Manuscript = {
    ...parsed,
    status: parsed.status ?? "draft",
    createdBy: parsed.createdBy ?? user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local: Manuscript = {
      ...manuscript,
      _id: `local-ms-${localManuscripts.length + 1}`,
    };
    localManuscripts.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureManuscriptIndexes(db);
  const { _id, ...insert } = manuscript;
  void _id;
  const result = await db.collection("project_manuscripts").insertOne(insert);
  return { ...manuscript, _id: result.insertedId.toString() };
}

export async function listManuscripts(projectId: string): Promise<Manuscript[]> {
  if (!hasMongoConfig()) {
    return localManuscripts
      .filter((m) => m.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("project_manuscripts")
    .find({ projectId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    manuscriptSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function getManuscript(
  manuscriptId: string,
  projectId: string,
): Promise<Manuscript | null> {
  if (!hasMongoConfig()) {
    return (
      localManuscripts.find(
        (m) => m._id === manuscriptId && m.projectId === projectId,
      ) ?? null
    );
  }

  if (!ObjectId.isValid(manuscriptId)) return null;

  const db = await getMongoDb();
  const doc = await db
    .collection("project_manuscripts")
    .findOne({ _id: new ObjectId(manuscriptId), projectId });

  if (!doc) return null;
  return manuscriptSchema.parse({ ...doc, _id: doc._id.toString() });
}

export async function updateManuscript(
  manuscriptId: string,
  input: Partial<ManuscriptInput>,
): Promise<void> {
  const now = new Date();
  const update = { ...input, updatedAt: now };

  if (!hasMongoConfig()) {
    const manuscript = localManuscripts.find((m) => m._id === manuscriptId);
    if (manuscript) Object.assign(manuscript, update);
    return;
  }

  if (!ObjectId.isValid(manuscriptId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("project_manuscripts")
    .updateOne({ _id: new ObjectId(manuscriptId) }, { $set: update });
}

export async function updateManuscriptStatus(
  manuscriptId: string,
  status: ManuscriptStatus,
): Promise<void> {
  const now = new Date();
  const update = { status, updatedAt: now };

  if (!hasMongoConfig()) {
    const manuscript = localManuscripts.find((m) => m._id === manuscriptId);
    if (manuscript) Object.assign(manuscript, update);
    return;
  }

  if (!ObjectId.isValid(manuscriptId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("project_manuscripts")
    .updateOne({ _id: new ObjectId(manuscriptId) }, { $set: update });
}

export async function deleteManuscript(
  manuscriptId: string,
  projectId: string,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localManuscripts.findIndex(
      (m) => m._id === manuscriptId && m.projectId === projectId,
    );
    if (idx !== -1) localManuscripts.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(manuscriptId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("project_manuscripts")
    .deleteOne({ _id: new ObjectId(manuscriptId), projectId });
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function ensureManuscriptIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await db
    .collection("project_manuscripts")
    .createIndex({ projectId: 1, createdAt: -1 });
}
