import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type SafeUser,
  type TeamMessage,
  type TeamMessageInput,
  teamMessageSchema,
} from "@/lib/schemas";

const collectionName = "team_messages";
const localMessages: TeamMessage[] = [];

export async function createTeamMessage(input: TeamMessageInput, user: SafeUser) {
  if (!user._id) {
    throw new Error("USER_ID_REQUIRED");
  }

  const message: TeamMessage = {
    ...input,
    authorId: user._id,
    starredBy: [],
    pinned: false,
    createdAt: new Date(),
  };

  if (!hasMongoConfig()) {
    const localMessage = {
      ...message,
      _id: `local-team-message-${localMessages.length + 1}`,
    };
    localMessages.push(localMessage);
    return localMessage;
  }

  const db = await getMongoDb();
  await ensureTeamIndexes();
  const { _id, ...insertMessage } = message;
  void _id;
  const result = await db.collection(collectionName).insertOne(insertMessage);

  return { ...message, _id: result.insertedId.toString() };
}

export async function listTeamMessages(projectIds: string[]) {
  if (projectIds.length === 0) {
    return [];
  }

  if (!hasMongoConfig()) {
    return localMessages.filter((message) => projectIds.includes(message.projectId));
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ projectId: { $in: projectIds } })
    .sort({ createdAt: 1 })
    .limit(300)
    .toArray();

  return docs.map((doc) =>
    teamMessageSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function toggleStarMessage(messageId: string, userId: string) {
  if (!hasMongoConfig()) {
    const msg = localMessages.find((m) => m._id === messageId);
    if (msg) {
      const already = msg.starredBy.includes(userId);
      msg.starredBy = already
        ? msg.starredBy.filter((id) => id !== userId)
        : [...msg.starredBy, userId];
    }
    return;
  }

  if (!ObjectId.isValid(messageId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  const doc = await db.collection(collectionName).findOne({ _id: new ObjectId(messageId) });
  if (!doc) return;

  const msg = teamMessageSchema.parse({ ...doc, _id: doc._id.toString() });
  const already = msg.starredBy.includes(userId);

  const update = already
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? ({ $pull: { starredBy: userId } } as any)
    : { $addToSet: { starredBy: userId } };
  await db.collection(collectionName).updateOne({ _id: new ObjectId(messageId) }, update);
}

export async function setPinTeamMessage(messageId: string, pinned: boolean) {
  if (!hasMongoConfig()) {
    const msg = localMessages.find((m) => m._id === messageId);
    if (msg) msg.pinned = pinned;
    return;
  }

  if (!ObjectId.isValid(messageId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db.collection(collectionName).updateOne(
    { _id: new ObjectId(messageId) },
    { $set: { pinned } },
  );
}

async function ensureTeamIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { projectId: 1, topic: 1, createdAt: 1 } },
    { key: { authorId: 1 } },
  ]);
}
