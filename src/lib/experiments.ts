import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type Experiment,
  type ExperimentInput,
  type ExperimentStatus,
  type SafeUser,
  experimentSchema,
} from "@/lib/schemas";

const localExperiments: Experiment[] = [];

export async function createExperiment(
  input: ExperimentInput,
  user: SafeUser,
): Promise<Experiment> {
  const now = new Date();
  const experiment: Experiment = {
    ...input,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local: Experiment = {
      ...experiment,
      _id: `local-exp-${localExperiments.length + 1}`,
    };
    localExperiments.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureExperimentIndexes(db);
  const { _id, ...insert } = experiment;
  void _id;
  const result = await db.collection("experiments").insertOne(insert);
  return { ...experiment, _id: result.insertedId.toString() };
}

export async function listExperiments(projectId: string): Promise<Experiment[]> {
  if (!hasMongoConfig()) {
    return localExperiments
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("experiments")
    .find({ projectId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    experimentSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function getExperimentById(experimentId: string): Promise<Experiment | null> {
  if (!hasMongoConfig()) {
    return localExperiments.find((e) => e._id === experimentId) ?? null;
  }
  if (!ObjectId.isValid(experimentId)) return null;
  const db = await getMongoDb();
  const doc = await db.collection("experiments").findOne({ _id: new ObjectId(experimentId) });
  return doc ? experimentSchema.parse({ ...doc, _id: doc._id.toString() }) : null;
}

export async function updateExperiment(
  experimentId: string,
  input: Partial<ExperimentInput>,
): Promise<void> {
  const update = { ...input, updatedAt: new Date() };

  if (!hasMongoConfig()) {
    const exp = localExperiments.find((e) => e._id === experimentId);
    if (exp) Object.assign(exp, update);
    return;
  }

  if (!ObjectId.isValid(experimentId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("experiments")
    .updateOne({ _id: new ObjectId(experimentId) }, { $set: update });
}

export async function updateExperimentStatus(
  experimentId: string,
  status: ExperimentStatus,
): Promise<void> {
  return updateExperiment(experimentId, { status });
}

export async function deleteExperiment(
  experimentId: string,
  projectId: string,
): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localExperiments.findIndex(
      (e) => e._id === experimentId && e.projectId === projectId,
    );
    if (idx !== -1) localExperiments.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(experimentId)) throw new Error("INVALID_ID");

  const db = await getMongoDb();
  await db
    .collection("experiments")
    .deleteOne({ _id: new ObjectId(experimentId), projectId });
}

async function ensureExperimentIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await db
    .collection("experiments")
    .createIndex({ projectId: 1, createdAt: -1 }, { background: true });
}
