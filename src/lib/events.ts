import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type ResearchEvent,
  type ResearchEventInput,
  type EventParticipation,
  type EventParticipationInput,
  type SubmissionItem,
  researchEventSchema,
  eventParticipationSchema,
} from "@/lib/schemas";

const eventsCollection = "research_events";
const participationsCollection = "event_participations";

const localEvents: ResearchEvent[] = [];
const localParticipations: EventParticipation[] = [];

// ── Events ────────────────────────────────────────────────────────────────────

export async function createResearchEvent(input: ResearchEventInput): Promise<ResearchEvent> {
  const now = new Date();
  const event: ResearchEvent = { ...input, createdAt: now, updatedAt: now };

  if (!hasMongoConfig()) {
    const local = { ...event, _id: `local-event-${localEvents.length + 1}` };
    localEvents.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureIndexes(db);
  const { _id, ...doc } = event;
  void _id;
  const result = await db.collection(eventsCollection).insertOne(doc);
  return { ...event, _id: result.insertedId.toString() };
}

export async function listResearchEvents(projectId: string): Promise<ResearchEvent[]> {
  if (!hasMongoConfig()) {
    return localEvents.filter((e) => e.projectId === projectId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(eventsCollection)
    .find({ projectId })
    .sort({ startDate: 1, createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    researchEventSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function updateResearchEvent(
  eventId: string,
  input: Partial<ResearchEventInput>,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localEvents.findIndex((e) => e._id === eventId);
    if (idx >= 0) Object.assign(localEvents[idx], input, { updatedAt: new Date() });
    return;
  }

  if (!ObjectId.isValid(eventId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection(eventsCollection).updateOne(
    { _id: new ObjectId(eventId) },
    { $set: { ...input, updatedAt: new Date() } },
  );
}

export async function deleteResearchEvent(eventId: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localEvents.findIndex((e) => e._id === eventId);
    if (idx >= 0) localEvents.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(eventId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection(eventsCollection).deleteOne({ _id: new ObjectId(eventId) });
  await db.collection(participationsCollection).deleteMany({ eventId });
}

// ── Participations ────────────────────────────────────────────────────────────

export async function addEventParticipation(
  input: EventParticipationInput,
): Promise<EventParticipation> {
  const participation: EventParticipation = { ...input, createdAt: new Date(), submissions: [] };

  if (!hasMongoConfig()) {
    const local = {
      ...participation,
      _id: `local-participation-${localParticipations.length + 1}`,
    };
    localParticipations.push(local);
    return local;
  }

  const db = await getMongoDb();
  const { _id, ...doc } = participation;
  void _id;
  const result = await db.collection(participationsCollection).insertOne(doc);
  return { ...participation, _id: result.insertedId.toString() };
}

export async function listEventParticipations(eventId: string): Promise<EventParticipation[]> {
  if (!hasMongoConfig()) {
    return localParticipations.filter((p) => p.eventId === eventId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(participationsCollection)
    .find({ eventId })
    .sort({ createdAt: 1 })
    .toArray();

  return docs.map((doc) =>
    eventParticipationSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function listAllParticipationsForProject(
  projectId: string,
): Promise<EventParticipation[]> {
  if (!hasMongoConfig()) {
    return localParticipations.filter((p) => p.projectId === projectId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection(participationsCollection)
    .find({ projectId })
    .toArray();

  return docs.map((doc) =>
    eventParticipationSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function updateEventParticipation(
  participationId: string,
  input: Partial<EventParticipationInput>,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localParticipations.findIndex((p) => p._id === participationId);
    if (idx >= 0) Object.assign(localParticipations[idx], input);
    return;
  }

  if (!ObjectId.isValid(participationId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection(participationsCollection).updateOne(
    { _id: new ObjectId(participationId) },
    { $set: input },
  );
}

export async function removeEventParticipation(participationId: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localParticipations.findIndex((p) => p._id === participationId);
    if (idx >= 0) localParticipations.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(participationId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection(participationsCollection).deleteOne({ _id: new ObjectId(participationId) });
}

// ── Submission items (embedded in participation) ──────────────────────────────

export async function addSubmissionToParticipation(
  participationId: string,
  item: SubmissionItem,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localParticipations.findIndex((p) => p._id === participationId);
    if (idx >= 0) {
      const p = localParticipations[idx];
      if (!p.submissions) p.submissions = [];
      p.submissions.push(item);
    }
    return;
  }

  if (!ObjectId.isValid(participationId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection(participationsCollection).updateOne(
    { _id: new ObjectId(participationId) },
    { $push: { submissions: item } } as Record<string, unknown>,
  );
}

export async function updateSubmissionInParticipation(
  participationId: string,
  sid: string,
  update: Partial<Omit<SubmissionItem, "sid">>,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localParticipations.findIndex((p) => p._id === participationId);
    if (idx >= 0) {
      const subIdx = (localParticipations[idx].submissions ?? []).findIndex((s) => s.sid === sid);
      if (subIdx >= 0) Object.assign(localParticipations[idx].submissions![subIdx], update);
    }
    return;
  }

  if (!ObjectId.isValid(participationId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  const setObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(update)) {
    setObj[`submissions.$[elem].${k}`] = v;
  }
  await db.collection(participationsCollection).updateOne(
    { _id: new ObjectId(participationId) },
    { $set: setObj },
    { arrayFilters: [{ "elem.sid": sid }] },
  );
}

export async function removeSubmissionFromParticipation(
  participationId: string,
  sid: string,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localParticipations.findIndex((p) => p._id === participationId);
    if (idx >= 0) {
      localParticipations[idx].submissions = (localParticipations[idx].submissions ?? []).filter(
        (s) => s.sid !== sid,
      );
    }
    return;
  }

  if (!ObjectId.isValid(participationId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection(participationsCollection).updateOne(
    { _id: new ObjectId(participationId) },
    { $pull: { submissions: { sid } } } as Record<string, unknown>,
  );
}

// ── Indexes ───────────────────────────────────────────────────────────────────

async function ensureIndexes(db: Awaited<ReturnType<typeof getMongoDb>>) {
  await db.collection(eventsCollection).createIndexes([
    { key: { projectId: 1, startDate: 1 } },
    { key: { projectId: 1, status: 1 } },
  ]);
  await db.collection(participationsCollection).createIndexes([
    { key: { eventId: 1 } },
    { key: { projectId: 1, participantId: 1 } },
  ]);
}
