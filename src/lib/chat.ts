import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { chatMessageSchema, type ChatMessage } from "@/lib/schemas";

// ── in-memory fallback ────────────────────────────────────────────────────────
const localMessages: ChatMessage[] = [];

// ── public API ────────────────────────────────────────────────────────────────

export async function postChatMessage(
  projectId: string,
  userId: string,
  displayName: string,
  initials: string,
  content: string,
): Promise<ChatMessage> {
  const now = new Date();
  const msg: ChatMessage = {
    projectId,
    userId,
    authorId: userId,
    displayName,
    initials,
    content: content.trim(),
    body: content.trim(),
    createdAt: now,
  };

  if (!hasMongoConfig()) {
    const local = { ...msg, _id: `local-msg-${localMessages.length + 1}` };
    localMessages.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureIndexes(db);
  const { _id, ...insert } = msg;
  void _id;
  const result = await db.collection("chat_messages").insertOne(insert);
  return { ...msg, _id: result.insertedId.toString() };
}

export async function getChatMessages(
  projectId: string,
  limit = 60,
  after?: string, // ISO timestamp — only return messages newer than this
): Promise<ChatMessage[]> {
  if (!hasMongoConfig()) {
    let msgs = localMessages.filter((m) => m.projectId === projectId);
    if (after) {
      const afterDate = new Date(after);
      msgs = msgs.filter((m) => m.createdAt > afterDate);
    }
    return msgs.slice(-limit);
  }

  const db = await getMongoDb();
  const filter: Record<string, unknown> = { projectId };
  if (after) {
    filter.createdAt = { $gt: new Date(after) };
  }

  const docs = await db
    .collection("chat_messages")
    .find(filter)
    .sort({ createdAt: after ? 1 : -1 })
    .limit(limit)
    .toArray();

  const msgs = docs.map((doc) =>
    chatMessageSchema.parse({ ...doc, _id: doc._id.toString() }),
  );

  return after ? msgs : msgs.reverse();
}

// ── internal ──────────────────────────────────────────────────────────────────

async function ensureIndexes(db: Awaited<ReturnType<typeof getMongoDb>>) {
  await db.collection("chat_messages").createIndexes([
    { key: { projectId: 1, createdAt: 1 } },
  ]);
}
