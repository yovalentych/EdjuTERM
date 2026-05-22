import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  learningCourseSchema,
  learningModuleSchema,
  learningTopicSchema,
  learningAssessmentSchema,
  learningSessionSchema,
  learningAssignmentSchema,
  courseMemberSchema,
  attendanceRecordSchema,
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
  type CourseMember,
  type CourseMemberInput,
  type AttendanceRecord,
  type AttendanceRecordInput,
  type SafeUser,
} from "@/lib/schemas";

// ── in-memory fallbacks ───────────────────────────────────────────────────────

const localCourses: LearningCourse[] = [];
const localModules: LearningModule[] = [];
const localTopics: LearningTopic[] = [];
const localAssessments: LearningAssessment[] = [];
const localSessions: LearningSession[] = [];
const localAssignments: LearningAssignment[] = [];
const localMembers: CourseMember[] = [];
const localAttendance: AttendanceRecord[] = [];

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

export async function bulkDeleteSessionsByCourse(projectId: string, courseId: string, onlyCancelled = false): Promise<number> {
  if (!hasMongoConfig()) {
    const before = localSessions.length;
    const keep = localSessions.filter(
      (s) => !(s.projectId === projectId && s.courseId === courseId && (!onlyCancelled || s.status === "cancelled")),
    );
    localSessions.splice(0, localSessions.length, ...keep);
    return before - localSessions.length;
  }
  const db = await getMongoDb();
  const query: Record<string, unknown> = { projectId, courseId };
  if (onlyCancelled) query.status = "cancelled";
  const result = await db.collection("learningSessions").deleteMany(query);
  return result.deletedCount;
}

export async function bulkCreateSessions(inputs: LearningSessionInput[]): Promise<void> {
  if (inputs.length === 0) return;
  const now = new Date();
  const docs = inputs.map((input) => ({ ...input, createdAt: now, updatedAt: now }));
  if (!hasMongoConfig()) {
    docs.forEach((d, i) => localSessions.push({ ...d, _id: `ls-bulk-${Date.now()}-${i}` }));
    return;
  }
  await ensureIndexes();
  const db = await getMongoDb();
  await db.collection("learningSessions").insertMany(docs);
}

export async function shiftSessionsInGroup(
  projectId: string,
  recurringGroupId: string,
  afterDate: string,
  shiftDays: number,
): Promise<void> {
  if (!recurringGroupId || shiftDays === 0) return;
  if (!hasMongoConfig()) {
    localSessions
      .filter((s) => s.projectId === projectId && s.recurringGroupId === recurringGroupId && s.date > afterDate && s.status !== "cancelled")
      .forEach((s) => {
        const d = new Date(s.date);
        d.setDate(d.getDate() + shiftDays);
        s.date = d.toISOString().slice(0, 10);
        s.updatedAt = new Date();
      });
    return;
  }
  const db = await getMongoDb();
  const toShift = await db.collection("learningSessions")
    .find({ projectId, recurringGroupId, date: { $gt: afterDate }, status: { $ne: "cancelled" } })
    .toArray();
  for (const doc of toShift) {
    const d = new Date(doc.date as string);
    d.setDate(d.getDate() + shiftDays);
    await db.collection("learningSessions").updateOne(
      { _id: doc._id },
      { $set: { date: d.toISOString().slice(0, 10), updatedAt: new Date() } },
    );
  }
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

// ── Course members (electronic dean's office) ────────────────────────────────

const MEMBERS_COLLECTION = "courseMembers";
const ATTENDANCE_COLLECTION = "attendanceRecords";

export async function listCourseMembers(courseId: string): Promise<CourseMember[]> {
  if (!hasMongoConfig()) {
    return localMembers.filter((m) => m.courseId === courseId);
  }
  const db = await getMongoDb();
  const docs = await db.collection(MEMBERS_COLLECTION)
    .find({ courseId })
    .sort({ fullName: 1 })
    .toArray();
  return docs.map((d) => courseMemberSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function listProjectMembers(projectId: string): Promise<CourseMember[]> {
  if (!hasMongoConfig()) {
    return localMembers.filter((m) => m.projectId === projectId);
  }
  const db = await getMongoDb();
  const docs = await db.collection(MEMBERS_COLLECTION)
    .find({ projectId })
    .sort({ fullName: 1 })
    .toArray();
  return docs.map((d) => courseMemberSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function enrollMember(input: CourseMemberInput, user: SafeUser): Promise<CourseMember> {
  const now = new Date();
  const enrolledAt = input.enrolledAt || now.toISOString().slice(0, 10);
  const doc: Omit<CourseMember, "_id"> = {
    ...input,
    enrolledAt,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local = { ...doc, _id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localMembers.push(local);
    return local;
  }
  const db = await getMongoDb();
  await db.collection(MEMBERS_COLLECTION).createIndexes([
    { key: { courseId: 1, fullName: 1 } },
    { key: { projectId: 1 } },
  ]);
  const result = await db.collection(MEMBERS_COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateMember(id: string, patch: Partial<CourseMemberInput>): Promise<void> {
  if (!hasMongoConfig()) {
    const m = localMembers.find((x) => x._id === id);
    if (m) Object.assign(m, patch, { updatedAt: new Date() });
    return;
  }
  const db = await getMongoDb();
  await db.collection(MEMBERS_COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
  );
}

export async function removeMember(id: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localMembers.findIndex((x) => x._id === id);
    if (idx >= 0) localMembers.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await db.collection(MEMBERS_COLLECTION).deleteOne({ _id: new ObjectId(id) });
  // Каскадно прибираємо attendance records для цього учасника.
  await db.collection(ATTENDANCE_COLLECTION).deleteMany({ memberId: id });
}

// ── Attendance / Gradebook ───────────────────────────────────────────────────

export async function listAttendanceForSession(sessionId: string): Promise<AttendanceRecord[]> {
  if (!hasMongoConfig()) {
    return localAttendance.filter((r) => r.sessionId === sessionId);
  }
  const db = await getMongoDb();
  const docs = await db.collection(ATTENDANCE_COLLECTION).find({ sessionId }).toArray();
  return docs.map((d) => attendanceRecordSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function listAttendanceForCourse(courseId: string): Promise<AttendanceRecord[]> {
  if (!hasMongoConfig()) {
    return localAttendance.filter((r) => r.courseId === courseId);
  }
  const db = await getMongoDb();
  const docs = await db.collection(ATTENDANCE_COLLECTION).find({ courseId }).toArray();
  return docs.map((d) => attendanceRecordSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function listAttendanceForMember(memberId: string): Promise<AttendanceRecord[]> {
  if (!hasMongoConfig()) {
    return localAttendance.filter((r) => r.memberId === memberId);
  }
  const db = await getMongoDb();
  const docs = await db.collection(ATTENDANCE_COLLECTION).find({ memberId }).toArray();
  return docs.map((d) => attendanceRecordSchema.parse({ ...d, _id: d._id.toString() }));
}

/**
 * Upsert одного запису attendance.
 * Унікальний ключ: (sessionId, memberId).
 */
export async function setAttendance(
  input: AttendanceRecordInput,
  user: SafeUser,
): Promise<AttendanceRecord> {
  const now = new Date();
  const base: Omit<AttendanceRecord, "_id"> = {
    ...input,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const existing = localAttendance.find(
      (r) => r.sessionId === input.sessionId && r.memberId === input.memberId,
    );
    if (existing) {
      Object.assign(existing, input, { updatedAt: now });
      return existing;
    }
    const local: AttendanceRecord = { ...base, _id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    localAttendance.push(local);
    return local;
  }

  const db = await getMongoDb();
  await db.collection(ATTENDANCE_COLLECTION).createIndexes([
    { key: { sessionId: 1, memberId: 1 }, unique: true },
    { key: { courseId: 1 } },
    { key: { memberId: 1 } },
  ]);
  const filter = { sessionId: input.sessionId, memberId: input.memberId };
  const update = {
    $set: { ...input, updatedAt: now },
    $setOnInsert: { createdBy: user._id ?? "", createdAt: now },
  };
  const result = await db.collection(ATTENDANCE_COLLECTION).findOneAndUpdate(
    filter,
    update,
    { upsert: true, returnDocument: "after" },
  );
  if (!result) throw new Error("Attendance upsert failed");
  return attendanceRecordSchema.parse({ ...result, _id: result._id.toString() });
}

export async function bulkSetAttendance(
  records: AttendanceRecordInput[],
  user: SafeUser,
): Promise<number> {
  let count = 0;
  for (const r of records) {
    try {
      await setAttendance(r, user);
      count++;
    } catch (e) {
      console.error("[attendance] bulk record failed", e);
    }
  }
  return count;
}

export async function deleteAttendance(sessionId: string, memberId: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localAttendance.findIndex((r) => r.sessionId === sessionId && r.memberId === memberId);
    if (idx >= 0) localAttendance.splice(idx, 1);
    return;
  }
  const db = await getMongoDb();
  await db.collection(ATTENDANCE_COLLECTION).deleteOne({ sessionId, memberId });
}

// ── Helpers (re-exported from utils for server-side callers) ──────────────────
export { scoreToGrade, gradeColor } from "@/lib/learning-utils";
