import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "record_created"
  | "record_archived"
  | "record_deleted"
  | "record_published"
  | "zenodo_published"
  | "approval_needed"
  | "approved"
  | "rejected"
  | "member_invited"
  | "member_joined"
  | "team_message_posted";

export type Notification = {
  _id: string;
  userId: string;
  actorId: string;
  actorName: string;
  type: NotificationType;
  title: string;
  body: string;
  projectId?: string;
  projectName?: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
};

type CreateParams = Omit<Notification, "_id" | "read" | "readAt" | "createdAt">;

const collectionName = "notifications";
const localNotifications: Notification[] = [];

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createNotification(params: CreateParams): Promise<void> {
  const doc: Omit<Notification, "_id"> = {
    ...params,
    read: false,
    createdAt: new Date(),
  };

  if (!hasMongoConfig()) {
    localNotifications.unshift({ ...doc, _id: `local-notif-${Date.now()}` });
    return;
  }

  const db = await getMongoDb();
  await ensureIndexes(db);
  await db.collection(collectionName).insertOne(doc);
}

/** Create the same notification for multiple recipients (excludes actor). */
export async function createNotificationsForUsers(
  userIds: string[],
  params: CreateParams,
): Promise<void> {
  const recipients = userIds.filter(
    (id) => id && id !== params.actorId,
  );
  if (recipients.length === 0) return;

  await Promise.all(recipients.map((userId) => createNotification({ ...params, userId })));
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function listNotificationsForUser(
  userId: string,
  limit = 40,
): Promise<Notification[]> {
  if (!hasMongoConfig()) {
    return localNotifications.filter((n) => n.userId === userId).slice(0, limit);
  }

  const db = await getMongoDb();
  await ensureIndexes(db);
  const docs = await db
    .collection(collectionName)
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map(docToNotification);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  if (!hasMongoConfig()) {
    return localNotifications.filter((n) => n.userId === userId && !n.read).length;
  }

  const db = await getMongoDb();
  return db.collection(collectionName).countDocuments({ userId, read: false });
}

// ── Mark read ─────────────────────────────────────────────────────────────────

export async function markNotificationsRead(
  userId: string,
  ids?: string[],
): Promise<void> {
  const now = new Date();

  if (!hasMongoConfig()) {
    localNotifications
      .filter((n) => n.userId === userId && (!ids || ids.includes(n._id)))
      .forEach((n) => {
        n.read = true;
        n.readAt = now;
      });
    return;
  }

  const db = await getMongoDb();
  const filter = ids
    ? { userId, _id: { $in: ids.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } }
    : { userId, read: false };

  await db
    .collection(collectionName)
    .updateMany(filter, { $set: { read: true, readAt: now } });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function docToNotification(doc: Record<string, unknown>): Notification {
  return {
    _id: (doc._id as ObjectId).toString(),
    userId: doc.userId as string,
    actorId: doc.actorId as string,
    actorName: doc.actorName as string,
    type: doc.type as NotificationType,
    title: doc.title as string,
    body: doc.body as string,
    projectId: doc.projectId as string | undefined,
    projectName: doc.projectName as string | undefined,
    link: doc.link as string | undefined,
    read: Boolean(doc.read),
    readAt: doc.readAt instanceof Date ? doc.readAt : undefined,
    createdAt: doc.createdAt as Date,
  };
}

let indexesEnsured = false;

async function ensureIndexes(db: Awaited<ReturnType<typeof getMongoDb>>) {
  if (indexesEnsured) return;
  await db.collection(collectionName).createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { userId: 1, read: 1 } },
  ]);
  indexesEnsured = true;
}
