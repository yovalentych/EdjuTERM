import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  learningCourseSchema,
  learningModuleSchema,
  learningTopicSchema,
  learningAssessmentSchema,
  learningSessionSchema,
  learningAssignmentSchema,
  type LearningCourse,
  type LearningCourseInput,
  type LearningModule,
  type LearningModuleInput,
  type LearningTopic,
  type LearningTopicInput,
  type LearningAssessment,
  type LearningAssessmentInput,
  type LearningSession,
  type LearningSessionInput,
  type LearningAssignment,
  type LearningAssignmentInput,
  type SafeUser,
} from "@/lib/schemas";

// ── in-memory fallbacks ───────────────────────────────────────────────────────

const localCourses: LearningCourse[] = [];
const localModules: LearningModule[] = [];
const localTopics: LearningTopic[] = [];
const localAssessments: LearningAssessment[] = [];
const localSessions: LearningSession[] = [];
const localAssignments: LearningAssignment[] = [];

async function ensureIndexes() {
  if (!hasMongoConfig()) return;
  const db = await getMongoDb();
  await Promise.all([
    db.collection("learningCourses").createIndex({ projectId: 1, semester: 1, orderIndex: 1 }),
    db.collection("learningModules").createIndex({ courseId: 1, orderIndex: 1 }),
    db.collection("learningTopics").createIndex({ moduleId: 1, orderIndex: 1 }),
    db.collection("learningAssessments").createIndex({ courseId: 1, dueDate: 1 }),
    db.collection("learningSessions").createIndex({ courseId: 1, date: 1 }),
    db.collection("learningAssignments").createIndex({ courseId: 1, dueDate: 1 }),
  ]);
}

function parseDoc<T>(schema: { parse: (v: unknown) => T }, doc: Record<string, unknown>): T {
  const { _id, ...rest } = doc;
  return schema.parse({ ...rest, _id: _id?.toString() });
}

// ── Courses ───────────────────────────────────────────────────────────────────

export async function createCourse(input: LearningCourseInput, user: SafeUser): Promise<LearningCourse> {
  const now = new Date();
  const course: LearningCourse = {
    ...input,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };
  if (!hasMongoConfig()) {
    const local = { ...course, _id: `lc-${Date.now()}` };
    localCourses.push(local);
    return local;
  }
  await ensureIndexes();
  const db = await getMongoDb();
  const { _id, ...insert } = course; void _id;
  const result = await db.collection("learningCourses").insertOne(insert);
  return { ...course, _id: result.insertedId.toString() };
}

export async function listCourses(projectId: string): Promise<LearningCourse[]> {
  if (!hasMongoConfig()) {
    return localCourses.filter((c) => c.projectId === projectId);
  }
  const db = await getMongoDb();
  const docs = await db
    .collection("learningCourses")
    .find({ projectId })
    .sort({ semester: 1, orderIndex: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => parseDoc(learningCourseSchema, d as Record<string, unknown>));
}

export async function updateCourse(id: string, patch: Partial<LearningCourseInput>): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localCourses.findIndex((c) => c._id === id);
    if (idx >= 0) localCourses[idx] = { ...localCourses[idx], ...patch, updatedAt: new Date() };
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningCourses").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteCourse(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localCourses.findIndex((c) => c._id === id);
    if (idx >= 0) localCourses.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await Promise.all([
    db.collection("learningCourses").deleteOne({ _id: new ObjectId(id) }),
    db.collection("learningModules").deleteMany({ courseId: id }),
    db.collection("learningTopics").deleteMany({ courseId: id }),
    db.collection("learningAssessments").deleteMany({ courseId: id }),
  ]);
}

// ── Modules ───────────────────────────────────────────────────────────────────

export async function createModule(input: LearningModuleInput): Promise<LearningModule> {
  const now = new Date();
  const mod: LearningModule = { ...input, createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local = { ...mod, _id: `lm-${Date.now()}` };
    localModules.push(local);
    return local;
  }
  const db = await getMongoDb();
  const { _id, ...insert } = mod; void _id;
  const result = await db.collection("learningModules").insertOne(insert);
  return { ...mod, _id: result.insertedId.toString() };
}

export async function listModules(courseId: string): Promise<LearningModule[]> {
  if (!hasMongoConfig()) {
    return localModules.filter((m) => m.courseId === courseId);
  }
  const db = await getMongoDb();
  const docs = await db
    .collection("learningModules")
    .find({ courseId })
    .sort({ orderIndex: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => parseDoc(learningModuleSchema, d as Record<string, unknown>));
}

export async function listModulesForProject(projectId: string): Promise<LearningModule[]> {
  if (!hasMongoConfig()) {
    return localModules.filter((m) => m.projectId === projectId);
  }
  const db = await getMongoDb();
  const docs = await db.collection("learningModules").find({ projectId }).toArray();
  return docs.map((d) => parseDoc(learningModuleSchema, d as Record<string, unknown>));
}

export async function updateModule(id: string, patch: Partial<LearningModuleInput>): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localModules.findIndex((m) => m._id === id);
    if (idx >= 0) localModules[idx] = { ...localModules[idx], ...patch, updatedAt: new Date() };
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningModules").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteModule(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localModules.findIndex((m) => m._id === id);
    if (idx >= 0) localModules.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await Promise.all([
    db.collection("learningModules").deleteOne({ _id: new ObjectId(id) }),
    db.collection("learningTopics").deleteMany({ moduleId: id }),
  ]);
}

// ── Topics ────────────────────────────────────────────────────────────────────

export async function createTopic(input: LearningTopicInput): Promise<LearningTopic> {
  const now = new Date();
  const topic: LearningTopic = { ...input, createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local = { ...topic, _id: `lt-${Date.now()}` };
    localTopics.push(local);
    return local;
  }
  const db = await getMongoDb();
  const { _id, ...insert } = topic; void _id;
  const result = await db.collection("learningTopics").insertOne(insert);
  return { ...topic, _id: result.insertedId.toString() };
}

export async function listTopics(courseId: string): Promise<LearningTopic[]> {
  if (!hasMongoConfig()) {
    return localTopics.filter((t) => t.courseId === courseId);
  }
  const db = await getMongoDb();
  const docs = await db
    .collection("learningTopics")
    .find({ courseId })
    .sort({ moduleId: 1, orderIndex: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => parseDoc(learningTopicSchema, d as Record<string, unknown>));
}

export async function listTopicsForProject(projectId: string): Promise<LearningTopic[]> {
  if (!hasMongoConfig()) {
    return localTopics.filter((t) => t.projectId === projectId);
  }
  const db = await getMongoDb();
  const docs = await db
    .collection("learningTopics")
    .find({ projectId })
    .sort({ moduleId: 1, orderIndex: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => parseDoc(learningTopicSchema, d as Record<string, unknown>));
}

export async function listAssessmentsForProject(projectId: string): Promise<LearningAssessment[]> {
  if (!hasMongoConfig()) {
    return localAssessments.filter((a) => a.projectId === projectId);
  }
  const db = await getMongoDb();
  const docs = await db
    .collection("learningAssessments")
    .find({ projectId })
    .sort({ dueDate: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => parseDoc(learningAssessmentSchema, d as Record<string, unknown>));
}

export async function updateTopic(id: string, patch: Partial<LearningTopicInput>): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localTopics.findIndex((t) => t._id === id);
    if (idx >= 0) localTopics[idx] = { ...localTopics[idx], ...patch, updatedAt: new Date() };
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningTopics").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteTopic(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localTopics.findIndex((t) => t._id === id);
    if (idx >= 0) localTopics.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningTopics").deleteOne({ _id: new ObjectId(id) });
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function createAssessment(input: LearningAssessmentInput, user: SafeUser): Promise<LearningAssessment> {
  const now = new Date();
  const assessment: LearningAssessment = {
    ...input,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };
  if (!hasMongoConfig()) {
    const local = { ...assessment, _id: `la-${Date.now()}` };
    localAssessments.push(local);
    return local;
  }
  const db = await getMongoDb();
  const { _id, ...insert } = assessment; void _id;
  const result = await db.collection("learningAssessments").insertOne(insert);
  return { ...assessment, _id: result.insertedId.toString() };
}

export async function listAssessments(courseId: string): Promise<LearningAssessment[]> {
  if (!hasMongoConfig()) {
    return localAssessments.filter((a) => a.courseId === courseId);
  }
  const db = await getMongoDb();
  const docs = await db
    .collection("learningAssessments")
    .find({ courseId })
    .sort({ dueDate: 1, createdAt: 1 })
    .toArray();
  return docs.map((d) => parseDoc(learningAssessmentSchema, d as Record<string, unknown>));
}

export async function listUpcomingAssessments(projectId: string, limit = 10): Promise<LearningAssessment[]> {
  if (!hasMongoConfig()) {
    const now = new Date().toISOString().slice(0, 10);
    return localAssessments
      .filter((a) => a.projectId === projectId && a.dueDate >= now && a.status === "upcoming")
      .slice(0, limit);
  }
  const db = await getMongoDb();
  const now = new Date().toISOString().slice(0, 10);
  const docs = await db
    .collection("learningAssessments")
    .find({ projectId, dueDate: { $gte: now }, status: "upcoming" })
    .sort({ dueDate: 1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => parseDoc(learningAssessmentSchema, d as Record<string, unknown>));
}

export async function updateAssessment(id: string, patch: Partial<LearningAssessmentInput>): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localAssessments.findIndex((a) => a._id === id);
    if (idx >= 0) localAssessments[idx] = { ...localAssessments[idx], ...patch, updatedAt: new Date() };
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningAssessments").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteAssessment(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localAssessments.findIndex((a) => a._id === id);
    if (idx >= 0) localAssessments.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningAssessments").deleteOne({ _id: new ObjectId(id) });
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function createSession(input: LearningSessionInput): Promise<LearningSession> {
  const now = new Date();
  const session: LearningSession = { ...input, createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local = { ...session, _id: `ls-${Date.now()}` };
    localSessions.push(local);
    return local;
  }
  await ensureIndexes();
  const db = await getMongoDb();
  const { _id, ...insert } = session; void _id;
  const result = await db.collection("learningSessions").insertOne(insert);
  return { ...session, _id: result.insertedId.toString() };
}

export async function listSessionsForProject(projectId: string): Promise<LearningSession[]> {
  if (!hasMongoConfig()) return localSessions.filter((s) => s.projectId === projectId);
  const db = await getMongoDb();
  const docs = await db.collection("learningSessions").find({ projectId }).sort({ date: 1, startTime: 1 }).toArray();
  return docs.map((d) => parseDoc(learningSessionSchema, d as Record<string, unknown>));
}

export async function listSessions(courseId: string): Promise<LearningSession[]> {
  if (!hasMongoConfig()) return localSessions.filter((s) => s.courseId === courseId);
  const db = await getMongoDb();
  const docs = await db.collection("learningSessions").find({ courseId }).sort({ date: 1, startTime: 1 }).toArray();
  return docs.map((d) => parseDoc(learningSessionSchema, d as Record<string, unknown>));
}

export async function updateSession(id: string, patch: Partial<LearningSessionInput>): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localSessions.findIndex((s) => s._id === id);
    if (idx >= 0) localSessions[idx] = { ...localSessions[idx], ...patch, updatedAt: new Date() };
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningSessions").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteSession(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localSessions.findIndex((s) => s._id === id);
    if (idx >= 0) localSessions.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningSessions").deleteOne({ _id: new ObjectId(id) });
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function createAssignment(input: LearningAssignmentInput, user: SafeUser): Promise<LearningAssignment> {
  const now = new Date();
  const assignment: LearningAssignment = { ...input, createdBy: user._id ?? "", createdAt: now, updatedAt: now };
  if (!hasMongoConfig()) {
    const local = { ...assignment, _id: `la2-${Date.now()}` };
    localAssignments.push(local);
    return local;
  }
  const db = await getMongoDb();
  const { _id, ...insert } = assignment; void _id;
  const result = await db.collection("learningAssignments").insertOne(insert);
  return { ...assignment, _id: result.insertedId.toString() };
}

export async function listAssignmentsForProject(projectId: string): Promise<LearningAssignment[]> {
  if (!hasMongoConfig()) return localAssignments.filter((a) => a.projectId === projectId);
  const db = await getMongoDb();
  const docs = await db.collection("learningAssignments").find({ projectId }).sort({ dueDate: 1, createdAt: 1 }).toArray();
  return docs.map((d) => parseDoc(learningAssignmentSchema, d as Record<string, unknown>));
}

export async function updateAssignment(id: string, patch: Partial<LearningAssignmentInput>): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localAssignments.findIndex((a) => a._id === id);
    if (idx >= 0) localAssignments[idx] = { ...localAssignments[idx], ...patch, updatedAt: new Date() };
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningAssignments").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function deleteAssignment(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localAssignments.findIndex((a) => a._id === id);
    if (idx >= 0) localAssignments.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await db.collection("learningAssignments").deleteOne({ _id: new ObjectId(id) });
}

// ── Helpers (re-exported from utils for server-side callers) ──────────────────
export { scoreToGrade, gradeColor } from "@/lib/learning-utils";
