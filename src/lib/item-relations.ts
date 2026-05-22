import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "./mongodb";
import { listItemsForUser, type WorkspaceItem } from "./workspaces";
import type { SafeUser } from "./schemas";

const COL = "workspace_item_relations";

export type ItemRelation = {
  _id?: string;
  fromId: string;
  toId: string;
  createdAt: string;
  ownerId: string;
};

export async function listLinkedItems(
  itemId: string,
  user: SafeUser,
): Promise<WorkspaceItem[]> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();
  const col = db.collection(COL);

  const relations = await col
    .find({ $or: [{ fromId: itemId }, { toId: itemId }] })
    .toArray();

  const relatedIds = relations.map((r) =>
    r.fromId === itemId ? r.toId : r.fromId,
  );
  if (relatedIds.length === 0) return [];

  const allItems = await listItemsForUser(user);
  return allItems.filter((i) => i._id && relatedIds.includes(i._id));
}

export async function linkItems(
  itemId: string,
  targetId: string,
  user: SafeUser,
): Promise<void> {
  if (!hasMongoConfig() || itemId === targetId) return;
  const db = await getMongoDb();
  const col = db.collection(COL);

  const exists = await col.findOne({
    $or: [
      { fromId: itemId, toId: targetId },
      { fromId: targetId, toId: itemId },
    ],
  });
  if (exists) return;

  await col.insertOne({
    _id: new ObjectId(),
    fromId: itemId,
    toId: targetId,
    ownerId: user._id as string,
    createdAt: new Date().toISOString(),
  });
}

export async function unlinkItems(
  itemId: string,
  targetId: string,
): Promise<void> {
  if (!hasMongoConfig()) return;
  const db = await getMongoDb();
  const col = db.collection(COL);

  await col.deleteMany({
    $or: [
      { fromId: itemId, toId: targetId },
      { fromId: targetId, toId: itemId },
    ],
  });
}
