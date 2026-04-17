import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type AuditAction,
  type AuditEvent,
  type SafeUser,
  auditEventSchema,
} from "@/lib/schemas";

const collectionName = "audit_events";
const localAuditEvents: AuditEvent[] = [];

export async function createAuditEvent({
  action,
  actor,
  projectId,
  targetUserId,
  targetEmail,
  metadata = {},
}: {
  action: AuditAction;
  actor: SafeUser;
  projectId?: string;
  targetUserId?: string;
  targetEmail?: string;
  metadata?: Record<string, string>;
}) {
  if (!actor._id) {
    return null;
  }

  const event: AuditEvent = {
    action,
    actorId: actor._id,
    actorEmail: actor.email,
    projectId,
    targetUserId,
    targetEmail,
    metadata,
    createdAt: new Date(),
  };

  if (!hasMongoConfig()) {
    const localEvent = {
      ...event,
      _id: `local-audit-${localAuditEvents.length + 1}`,
    };
    localAuditEvents.unshift(localEvent);
    return localEvent;
  }

  const db = await getMongoDb();
  await ensureAuditIndexes();
  const { _id, ...insertEvent } = event;
  void _id;
  const result = await db.collection(collectionName).insertOne(insertEvent);

  return { ...event, _id: result.insertedId.toString() };
}

export async function listAuditEvents({
  projectId,
  limit = 100,
}: {
  projectId?: string;
  limit?: number;
} = {}) {
  if (!hasMongoConfig()) {
    return localAuditEvents
      .filter((event) => !projectId || event.projectId === projectId)
      .slice(0, limit);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find(projectId ? { projectId } : {})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) =>
    auditEventSchema.parse({ ...doc, _id: (doc._id as ObjectId).toString() }),
  );
}

async function ensureAuditIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { createdAt: -1 } },
    { key: { projectId: 1, createdAt: -1 } },
    { key: { actorId: 1, createdAt: -1 } },
    { key: { action: 1, createdAt: -1 } },
  ]);
}
