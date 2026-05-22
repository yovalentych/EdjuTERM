import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "./mongodb";
import {
  storeRecordFiles,
  validateRecordFiles,
  readStoredFile,
  type StoredRecordFile,
} from "./file-storage";

const COL = "workspace_item_files";

export type ItemFile = StoredRecordFile & {
  _id: string;
  itemId: string;
  uploadedBy: string;
};

export async function listItemFiles(itemId: string): Promise<ItemFile[]> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();
  const docs = await db.collection(COL)
    .find({ itemId })
    .sort({ uploadedAt: -1 })
    .toArray();
  return docs.map((d) => ({ ...d, _id: d._id.toString() }) as ItemFile);
}

export async function uploadItemFiles(
  itemId: string,
  files: File[],
  uploadedBy: string,
): Promise<ItemFile[]> {
  validateRecordFiles(files);
  const stored = await storeRecordFiles(`item-${itemId}`, files, new Date());

  if (!hasMongoConfig()) return [];

  const db = await getMongoDb();
  const docs = stored.map((f) => ({
    ...f,
    itemId,
    uploadedBy,
  }));
  const result = await db.collection(COL).insertMany(docs);
  return docs.map((d, i) => ({ ...d, _id: result.insertedIds[i].toString() }) as ItemFile);
}

export async function deleteItemFile(fileId: string, itemId: string): Promise<boolean> {
  if (!hasMongoConfig()) return false;
  const db = await getMongoDb();
  const oid = ObjectId.isValid(fileId) ? new ObjectId(fileId) : null;
  if (!oid) return false;
  const result = await db.collection(COL).deleteOne({ _id: oid, itemId });
  return result.deletedCount > 0;
}

export { readStoredFile };
