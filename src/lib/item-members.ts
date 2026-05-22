import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "./mongodb";
import { findUserByEmail } from "./users";
import type { SafeUser } from "./schemas";

const ITEMS_COL = "workspace_items";

export interface ItemMember {
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
}

export async function addMemberByEmail(
  itemId: string,
  email: string,
  role: string,
  _requester: SafeUser,
): Promise<{ ok: boolean; error?: string; member?: ItemMember }> {
  if (!hasMongoConfig()) return { ok: false, error: "No DB" };

  const target = await findUserByEmail(email);
  if (!target) return { ok: false, error: "Користувача не знайдено" };

  const member: ItemMember = {
    userId: String(target._id),
    userName: (target as any).name ?? email,
    role,
    joinedAt: new Date().toISOString(),
  };

  const oid = ObjectId.isValid(itemId) ? new ObjectId(itemId) : null;
  if (!oid) return { ok: false, error: "Invalid itemId" };

  const db = await getMongoDb();
  await db.collection(ITEMS_COL).updateOne({ _id: oid }, { $pull: { members: { userId: member.userId } } } as any);
  await db.collection(ITEMS_COL).updateOne({ _id: oid }, { $push: { members: member } } as any);

  return { ok: true, member };
}

export async function removeMember(
  itemId: string,
  userId: string,
  _requester: SafeUser,
): Promise<{ ok: boolean }> {
  if (!hasMongoConfig()) return { ok: false };

  const oid = ObjectId.isValid(itemId) ? new ObjectId(itemId) : null;
  if (!oid) return { ok: false };

  const db = await getMongoDb();
  await db.collection(ITEMS_COL).updateOne({ _id: oid }, { $pull: { members: { userId } } } as any);
  return { ok: true };
}
