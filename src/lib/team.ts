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

async function ensureTeamIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { projectId: 1, createdAt: 1 } },
    { key: { authorId: 1 } },
  ]);
}
