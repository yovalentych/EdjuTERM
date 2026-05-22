import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type Milestone,
  type MilestoneInput,
  type SafeUser,
  type Task,
  type TaskInput,
  type TaskStatus,
  type TimeEntry,
  type TimeEntryInput,
  milestoneSchema,
  taskSchema,
  timeEntrySchema,
} from "@/lib/schemas";

// ── in-memory fallbacks ───────────────────────────────────────────────────────

const localTasks: Task[] = [];
const localMilestones: Milestone[] = [];
const localTimeEntries: TimeEntry[] = [];

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function createTask(
  input: TaskInput,
  user: SafeUser,
): Promise<Task> {
  const now = new Date();
  const task: Task = {
    ...input,
    status: "todo",
    createdBy: user._id ?? "",
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local = { ...task, _id: `local-task-${localTasks.length + 1}` };
    localTasks.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensurePlanningIndexes(db);
  const { _id, ...insert } = task;
  void _id;
  const result = await db.collection("tasks").insertOne(insert);
  return { ...task, _id: result.insertedId.toString() };
}

export async function listTasks(projectId: string): Promise<Task[]> {
  if (!hasMongoConfig()) {
    return localTasks.filter((t) => t.projectId === projectId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("tasks")
    .find({ projectId })
    .sort({ dueDate: 1, priority: -1, createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    taskSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  user: SafeUser,
): Promise<void> {
  const completedAt =
    status === "done" ? new Date() : null;

  const update = {
    status,
    completedAt,
    updatedAt: new Date(),
    ...(status === "in_progress" && !completedAt ? { completedAt: null } : {}),
  };

  if (!hasMongoConfig()) {
    const task = localTasks.find((t) => t._id === taskId);
    if (task) Object.assign(task, update);
    return;
  }

  if (!ObjectId.isValid(taskId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db
    .collection("tasks")
    .updateOne({ _id: new ObjectId(taskId) }, { $set: update });
  void user;
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function insertMilestone(
  input: MilestoneInput,
  user: SafeUser,
): Promise<Milestone> {
  const now = new Date();
  const milestone: Milestone = {
    ...input,
    status: "upcoming",
    reachedAt: null,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local = {
      ...milestone,
      _id: `local-ms-${localMilestones.length + 1}`,
    };
    localMilestones.push(local);
    return local;
  }

  const db = await getMongoDb();
  const { _id, ...insert } = milestone;
  void _id;
  const result = await db.collection("milestones").insertOne(insert);
  return { ...milestone, _id: result.insertedId.toString() };
}

export async function createMilestone(
  input: MilestoneInput,
  user: SafeUser,
): Promise<Milestone> {
  return insertMilestone(input, user);
}

export async function listMilestones(projectId: string): Promise<Milestone[]> {
  if (!hasMongoConfig()) {
    return localMilestones.filter((m) => m.projectId === projectId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("milestones")
    .find({ projectId })
    .sort({ dueDate: 1 })
    .toArray();

  return docs.map((doc) =>
    milestoneSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function markMilestoneReached(
  milestoneId: string,
  user: SafeUser,
): Promise<void> {
  const update = {
    status: "reached",
    reachedAt: new Date(),
    updatedAt: new Date(),
  };

  if (!hasMongoConfig()) {
    const ms = localMilestones.find((m) => m._id === milestoneId);
    if (ms) Object.assign(ms, update);
    return;
  }

  if (!ObjectId.isValid(milestoneId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db
    .collection("milestones")
    .updateOne({ _id: new ObjectId(milestoneId) }, { $set: update });
  void user;
}

export async function updateMilestone(
  milestoneId: string,
  fields: { title?: string; description?: string; dueDate?: string; status?: string },
): Promise<void> {
  const update = { ...fields, updatedAt: new Date() };

  if (!hasMongoConfig()) {
    const ms = localMilestones.find((m) => m._id === milestoneId);
    if (ms) Object.assign(ms, update);
    return;
  }

  if (!ObjectId.isValid(milestoneId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db
    .collection("milestones")
    .updateOne({ _id: new ObjectId(milestoneId) }, { $set: update });
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  if (!hasMongoConfig()) {
    const idx = localMilestones.findIndex((m) => m._id === milestoneId);
    if (idx !== -1) localMilestones.splice(idx, 1);
    return;
  }

  if (!ObjectId.isValid(milestoneId)) throw new Error("INVALID_ID");
  const db = await getMongoDb();
  await db.collection("milestones").deleteOne({ _id: new ObjectId(milestoneId) });
}

// ── Time Entries ──────────────────────────────────────────────────────────────

export async function createTimeEntry(
  input: TimeEntryInput,
  user: SafeUser,
): Promise<TimeEntry> {
  const now = new Date();
  const entry: TimeEntry = {
    ...input,
    userId: user._id ?? "",
    createdAt: now,
  };

  if (!hasMongoConfig()) {
    const local = {
      ...entry,
      _id: `local-te-${localTimeEntries.length + 1}`,
    };
    localTimeEntries.push(local);
    return local;
  }

  const db = await getMongoDb();
  const { _id, ...insert } = entry;
  void _id;
  const result = await db.collection("time_entries").insertOne(insert);
  return { ...entry, _id: result.insertedId.toString() };
}

export async function listTimeEntries(
  projectId: string,
  userId?: string,
): Promise<TimeEntry[]> {
  const filter: Record<string, string> = { projectId };
  if (userId) filter.userId = userId;

  if (!hasMongoConfig()) {
    return localTimeEntries.filter(
      (e) =>
        e.projectId === projectId && (userId === undefined || e.userId === userId),
    );
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("time_entries")
    .find(filter)
    .sort({ date: -1 })
    .toArray();

  return docs.map((doc) =>
    timeEntrySchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export type MonthlyHoursSummary = {
  userId: string;
  totalHours: number;
  entries: { date: string; hours: number; category: string; description: string }[];
};

export async function getMonthlyHours(
  projectId: string,
  year: number,
  month: number,
): Promise<MonthlyHoursSummary[]> {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const all = await listTimeEntries(projectId);
  const monthEntries = all.filter((e) => e.date.startsWith(prefix));

  const byUser = new Map<string, MonthlyHoursSummary>();

  for (const entry of monthEntries) {
    const existing = byUser.get(entry.userId) ?? {
      userId: entry.userId,
      totalHours: 0,
      entries: [],
    };
    existing.totalHours += entry.hours;
    existing.entries.push({
      date: entry.date,
      hours: entry.hours,
      category: entry.category,
      description: entry.description,
    });
    byUser.set(entry.userId, existing);
  }

  return Array.from(byUser.values());
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensurePlanningIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await Promise.all([
    db
      .collection("tasks")
      .createIndexes([
        { key: { projectId: 1 } },
        { key: { assigneeId: 1 } },
        { key: { dueDate: 1 } },
        { key: { status: 1 } },
      ]),
    db
      .collection("milestones")
      .createIndexes([{ key: { projectId: 1 } }, { key: { dueDate: 1 } }]),
    db
      .collection("time_entries")
      .createIndexes([
        { key: { projectId: 1 } },
        { key: { userId: 1 } },
        { key: { date: 1 } },
      ]),
  ]);
}
