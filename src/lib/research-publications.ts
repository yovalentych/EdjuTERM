import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type ResearchPublication,
  type ResearchPublicationInput,
  type PublicationStatus,
  type ResearchDeliverable,
  type ResearchDeliverableInput,
  type DeliverableStatus,
  type SafeUser,
  researchPublicationSchema,
  researchDeliverableSchema,
} from "@/lib/schemas";

// ── in-memory fallback ────────────────────────────────────────────────────────

const localPublications: ResearchPublication[] = [];
const localDeliverables: ResearchDeliverable[] = [];

// ── Publications ──────────────────────────────────────────────────────────────

export async function createPublication(
  input: ResearchPublicationInput,
  user: SafeUser,
): Promise<ResearchPublication> {
  const now = new Date();
  const pub: ResearchPublication = {
    ...input,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local: ResearchPublication = {
      ...pub,
      _id: `local-pub-${localPublications.length + 1}`,
    };
    localPublications.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensurePublicationIndexes(db);
  const { _id, ...insert } = pub;
  void _id;
  const result = await db.collection("research_publications").insertOne(insert);
  return { ...pub, _id: result.insertedId.toString() };
}

export async function listPublications(
  projectId: string,
): Promise<ResearchPublication[]> {
  if (!hasMongoConfig()) {
    return localPublications
      .filter((p) => p.projectId === projectId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("research_publications")
    .find({ projectId })
    .sort({ createdAt: 1 })
    .toArray();

  return docs.map((doc) =>
    researchPublicationSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function updatePublicationStatus(
  pubId: string,
  status: PublicationStatus,
  doi: string,
  url: string,
): Promise<void> {
  const now = new Date();

  if (!hasMongoConfig()) {
    const pub = localPublications.find((p) => p._id === pubId);
    if (pub) {
      pub.status = status;
      pub.doi = doi;
      pub.url = url;
      pub.updatedAt = now;
    }
    return;
  }

  if (!ObjectId.isValid(pubId)) {
    throw new Error("INVALID_ID");
  }

  const db = await getMongoDb();
  await db
    .collection("research_publications")
    .updateOne(
      { _id: new ObjectId(pubId) },
      { $set: { status, doi, url, updatedAt: now } },
    );
}

export async function updatePublication(
  pubId: string,
  fields: Partial<ResearchPublication>,
): Promise<void> {
  const update = { ...fields, updatedAt: new Date() };

  if (!hasMongoConfig()) {
    const pub = localPublications.find((p) => p._id === pubId);
    if (pub) Object.assign(pub, update);
    return;
  }

  if (!ObjectId.isValid(pubId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db
    .collection("research_publications")
    .updateOne({ _id: new ObjectId(pubId) }, { $set: update });
}

export async function deletePublication(pubId: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localPublications.findIndex((p) => p._id === pubId);
    if (idx !== -1) localPublications.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(pubId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection("research_publications").deleteOne({ _id: new ObjectId(pubId) });
}

// ── Deliverables ──────────────────────────────────────────────────────────────

export async function createDeliverable(
  input: ResearchDeliverableInput,
  user: SafeUser,
): Promise<ResearchDeliverable> {
  const now = new Date();
  const deliv: ResearchDeliverable = {
    ...input,
    completedAt: null,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local: ResearchDeliverable = {
      ...deliv,
      _id: `local-deliv-${localDeliverables.length + 1}`,
    };
    localDeliverables.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureDeliverableIndexes(db);
  const { _id, ...insert } = deliv;
  void _id;
  const result = await db.collection("research_deliverables").insertOne(insert);
  return { ...deliv, _id: result.insertedId.toString() };
}

export async function listDeliverables(
  projectId: string,
): Promise<ResearchDeliverable[]> {
  if (!hasMongoConfig()) {
    return localDeliverables
      .filter((d) => d.projectId === projectId)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("research_deliverables")
    .find({ projectId })
    .sort({ createdAt: 1 })
    .toArray();

  return docs.map((doc) =>
    researchDeliverableSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function updateDeliverableStatus(
  delivId: string,
  status: DeliverableStatus,
  user: SafeUser,
): Promise<void> {
  const now = new Date();
  const isCompleted = status === "completed";

  if (!hasMongoConfig()) {
    const deliv = localDeliverables.find((d) => d._id === delivId);
    if (deliv) {
      deliv.status = status;
      deliv.completedAt = isCompleted ? now : null;
      deliv.updatedAt = now;
    }
    return;
  }

  if (!ObjectId.isValid(delivId)) {
    throw new Error("INVALID_ID");
  }

  const db = await getMongoDb();
  await db
    .collection("research_deliverables")
    .updateOne(
      { _id: new ObjectId(delivId) },
      { $set: { status, completedAt: isCompleted ? now : null, updatedAt: now } },
    );

  void user;
}

export async function updateDeliverable(
  delivId: string,
  fields: Partial<ResearchDeliverable>,
): Promise<void> {
  const update = { ...fields, updatedAt: new Date() };

  if (!hasMongoConfig()) {
    const deliv = localDeliverables.find((d) => d._id === delivId);
    if (deliv) Object.assign(deliv, update);
    return;
  }

  if (!ObjectId.isValid(delivId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db
    .collection("research_deliverables")
    .updateOne({ _id: new ObjectId(delivId) }, { $set: update });
}

export async function deleteDeliverable(delivId: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localDeliverables.findIndex((d) => d._id === delivId);
    if (idx !== -1) localDeliverables.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(delivId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection("research_deliverables").deleteOne({ _id: new ObjectId(delivId) });
}

// ── Stage Progress ────────────────────────────────────────────────────────────

export async function updateStageProgress(
  stageId: string,
  progress: number,
): Promise<void> {
  const now = new Date();

  if (!hasMongoConfig()) {
    // In-memory stages are managed by research-plan.ts; nothing to do here
    return;
  }

  if (!ObjectId.isValid(stageId)) {
    throw new Error("INVALID_ID");
  }

  const db = await getMongoDb();
  await db
    .collection("research_stages")
    .updateOne(
      { _id: new ObjectId(stageId) },
      { $set: { progress, updatedAt: now } },
    );
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function ensurePublicationIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await db
    .collection("research_publications")
    .createIndexes([
      { key: { projectId: 1, createdAt: 1 } },
      { key: { projectId: 1, stageId: 1 } },
    ]);
}

async function ensureDeliverableIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await db
    .collection("research_deliverables")
    .createIndexes([
      { key: { projectId: 1, createdAt: 1 } },
      { key: { projectId: 1, stageId: 1 } },
    ]);
}
