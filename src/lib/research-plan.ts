import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type ResearchStage,
  type ResearchStageInput,
  type ResearchStageStatus,
  type SafeUser,
  researchStageSchema,
} from "@/lib/schemas";

export type StageUpdateFields = Partial<
  Pick<
    ResearchStage,
    | "title"
    | "goals"
    | "tasksText"
    | "startDate"
    | "endDate"
    | "indicators"
    | "budget"
    | "currency"
    | "linkedMilestoneId"
    | "stageNumber"
    | "progress"
  >
>;

// ── in-memory fallback ────────────────────────────────────────────────────────

const localStages: ResearchStage[] = [];

// ── Research Stages ───────────────────────────────────────────────────────────

export async function createResearchStage(
  input: ResearchStageInput,
  user: SafeUser,
): Promise<ResearchStage> {
  const now = new Date();
  const stage: ResearchStage = {
    ...input,
    status: "planned",
    linkedTaskIds: [],
    completionNote: "",
    completedAt: null,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local: ResearchStage = {
      ...stage,
      _id: `local-stage-${localStages.length + 1}`,
    };
    localStages.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureResearchIndexes(db);
  const { _id, ...insert } = stage;
  void _id;
  const result = await db.collection("research_stages").insertOne(insert);
  return { ...stage, _id: result.insertedId.toString() };
}

export async function listResearchStages(
  projectId: string,
): Promise<ResearchStage[]> {
  if (!hasMongoConfig()) {
    return localStages
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => a.stageNumber - b.stageNumber);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("research_stages")
    .find({ projectId })
    .sort({ stageNumber: 1 })
    .toArray();

  return docs.map((doc) =>
    researchStageSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function updateStageStatus(
  stageId: string,
  status: ResearchStageStatus,
  note: string,
  user: SafeUser,
): Promise<void> {
  const now = new Date();
  const isFinished = status === "completed" || status === "reported";

  const update: Partial<ResearchStage> & { updatedAt: Date } = {
    status,
    completionNote: note,
    completedAt: isFinished ? now : null,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const stage = localStages.find((s) => s._id === stageId);
    if (stage) {
      Object.assign(stage, update);
    }
    return;
  }

  if (!ObjectId.isValid(stageId)) {
    throw new Error("INVALID_ID");
  }

  const db = await getMongoDb();
  await db
    .collection("research_stages")
    .updateOne({ _id: new ObjectId(stageId) }, { $set: update });

  void user;
}

export async function linkTaskToStage(
  stageId: string,
  taskId: string,
): Promise<void> {
  if (!hasMongoConfig()) {
    const stage = localStages.find((s) => s._id === stageId);
    if (stage) {
      stage.linkedTaskIds = Array.from(new Set([...stage.linkedTaskIds, taskId]));
    }
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
      { $addToSet: { linkedTaskIds: taskId } },
    );
}

export async function unlinkTaskFromStage(
  stageId: string,
  taskId: string,
): Promise<void> {
  if (!hasMongoConfig()) {
    const stage = localStages.find((s) => s._id === stageId);
    if (stage) {
      stage.linkedTaskIds = stage.linkedTaskIds.filter((id) => id !== taskId);
    }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $pull: { linkedTaskIds: taskId } as any },
    );
}

export async function updateResearchStage(
  stageId: string,
  fields: StageUpdateFields,
): Promise<void> {
  const update = { ...fields, updatedAt: new Date() };

  if (!hasMongoConfig()) {
    const stage = localStages.find((s) => s._id === stageId);
    if (stage) Object.assign(stage, update);
    return;
  }

  if (!ObjectId.isValid(stageId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db
    .collection("research_stages")
    .updateOne({ _id: new ObjectId(stageId) }, { $set: update });
}

export async function deleteResearchStage(stageId: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localStages.findIndex((s) => s._id === stageId);
    if (idx !== -1) localStages.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(stageId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db
    .collection("research_stages")
    .deleteOne({ _id: new ObjectId(stageId) });
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function ensureResearchIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await db
    .collection("research_stages")
    .createIndexes([
      { key: { projectId: 1, stageNumber: 1 } },
      { key: { projectId: 1 } },
    ]);
}
