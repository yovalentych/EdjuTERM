import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type AuditAction,
  type AuditEvent,
  type SafeUser,
  auditEventSchema,
} from "@/lib/schemas";
import { getRequestId } from "@/lib/request-context";

const collectionName = "audit_events";
const localAuditEvents: AuditEvent[] = [];

export async function createAuditEvent({
  action,
  actor,
  projectId,
  targetUserId,
  targetEmail,
  targetEntity,
  before,
  after,
  metadata = {},
}: {
  action: AuditAction;
  actor: SafeUser;
  projectId?: string;
  targetUserId?: string;
  targetEmail?: string;
  targetEntity?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: AuditEvent["metadata"];
}) {
  if (!actor._id) {
    return null;
  }

  const requestId = await getRequestId();
  const event: AuditEvent = {
    action,
    actorId: actor._id,
    actorEmail: actor.email,
    projectId,
    targetUserId,
    targetEmail,
    targetEntity,
    requestId,
    before,
    after,
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
    auditEventSchema.parse({
      ...doc,
      _id: (doc._id as ObjectId).toString(),
      projectId: doc.projectId ?? undefined,
      targetUserId: doc.targetUserId ?? undefined,
      targetEmail: doc.targetEmail ?? undefined,
      targetEntity: doc.targetEntity ?? undefined,
      requestId: doc.requestId ?? undefined,
      before: doc.before ?? undefined,
      after: doc.after ?? undefined,
    }),
  );
}

export async function listAuditEventsForRecord(
  recordId: string,
  limit = 20,
): Promise<AuditEvent[]> {
  if (!hasMongoConfig()) {
    return localAuditEvents
      .filter((e) => e.metadata?.recordId === recordId)
      .slice(0, limit);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ "metadata.recordId": recordId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) =>
    auditEventSchema.parse({
      ...doc,
      _id: (doc._id as ObjectId).toString(),
      projectId: doc.projectId ?? undefined,
      targetUserId: doc.targetUserId ?? undefined,
      targetEmail: doc.targetEmail ?? undefined,
      targetEntity: doc.targetEntity ?? undefined,
      requestId: doc.requestId ?? undefined,
      before: doc.before ?? undefined,
      after: doc.after ?? undefined,
    }),
  );
}

async function ensureAuditIndexes() {
  const db = await getMongoDb();
  await db.collection(collectionName).createIndexes([
    { key: { createdAt: -1 } },
    { key: { projectId: 1, createdAt: -1 } },
    { key: { actorId: 1, createdAt: -1 } },
    { key: { action: 1, createdAt: -1 } },
    { key: { requestId: 1 } },
  ]);
}
