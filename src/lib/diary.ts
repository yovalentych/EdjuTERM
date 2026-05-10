import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  diaryEntrySchema,
  diaryEntryInputSchema,
  type DiaryEntry,
  type DiaryEntryInput,
} from "@/lib/schemas";
import type { Document, WithId } from "mongodb";

const collectionName = "diary_entries";
const localEntries: DiaryEntry[] = [];

function normalizeEntry(doc: WithId<Document>): DiaryEntry {
  return diaryEntrySchema.parse({
    ...doc,
    _id: doc._id.toString(),
    tags: doc.tags ?? [],
    person: doc.person ?? "",
    place: doc.place ?? "",
    recipient: doc.recipient ?? "",
    docRef: doc.docRef ?? "",
    outcome: doc.outcome ?? "",
    body: doc.body ?? "",
  });
}

export async function listDiaryEntries(projectId: string): Promise<DiaryEntry[]> {
  if (!hasMongoConfig()) {
    return localEntries.filter((e) => e.projectId === projectId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ projectId })
    .sort({ date: -1, createdAt: -1 })
    .limit(500)
    .toArray();

  return docs.map(normalizeEntry);
}

export async function createDiaryEntry(input: DiaryEntryInput): Promise<DiaryEntry> {
  const validated = diaryEntryInputSchema.parse(input);
  const now = new Date();
  const entry: DiaryEntry = { ...validated, createdAt: now, updatedAt: now };

  if (!hasMongoConfig()) {
    const local = { ...entry, _id: `local-diary-${localEntries.length + 1}` };
    localEntries.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureIndexes();
  const { _id, ...insertData } = entry;
  void _id;
  const result = await db.collection(collectionName).insertOne({ ...insertData });
  return { ...entry, _id: result.insertedId.toString() };
}

export async function updateDiaryEntry(id: string, input: Partial<DiaryEntryInput>): Promise<DiaryEntry | null> {
  if (!hasMongoConfig()) {
    const idx = localEntries.findIndex((e) => e._id === id);
    if (idx === -1) return null;
    Object.assign(localEntries[idx], input, { updatedAt: new Date() });
    return localEntries[idx];
  }

  if (!ObjectId.isValid(id)) return null;
  const db = await getMongoDb();
  const result = await db.collection(collectionName).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return result ? normalizeEntry(result) : null;
}

export async function deleteDiaryEntry(id: string): Promise<boolean> {
  if (!hasMongoConfig()) {
    const idx = localEntries.findIndex((e) => e._id === id);
    if (idx === -1) return false;
    localEntries.splice(idx, 1);
    return true;
  }

  if (!ObjectId.isValid(id)) return false;
  const db = await getMongoDb();
  const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

async function ensureIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { projectId: 1, date: -1 } },
    { key: { userId: 1 } },
  ]);
}
