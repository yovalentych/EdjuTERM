"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectForUser } from "@/lib/projects";
import {
  createCourse, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  createTopic, updateTopic, deleteTopic,
  createAssessment, updateAssessment, deleteAssessment,
  createSession, updateSession, deleteSession,
  bulkCreateSessions, bulkDeleteSessionsByCourse, shiftSessionsInGroup,
  createAssignment, updateAssignment, deleteAssignment,
  listTopicsForProject, listSessions,
} from "@/lib/learning";
import type { TopicType } from "@/lib/schemas";
import {
  learningCourseInputSchema,
  learningModuleInputSchema,
  learningTopicInputSchema,
  learningAssessmentInputSchema,
  learningSessionInputSchema,
  learningAssignmentInputSchema,
} from "@/lib/schemas";

function revalidate(locale: string, projectId: string) {
  revalidatePath(`/${locale}/app/learning?projectId=${projectId}`);
}

// ── Courses ───────────────────────────────────────────────────────────────────

export async function addCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const input = learningCourseInputSchema.parse({
    projectId,
    title: formData.get("title"),
    code: formData.get("code") ?? "",
    semester: formData.get("semester") ?? 1,
    year: formData.get("year") ?? 1,
    credits: formData.get("credits") ?? 3,
    courseType: formData.get("courseType") ?? "mandatory",
    instructor: formData.get("instructor") ?? "",
    note: formData.get("note") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await createCourse(input, user);
  revalidate(locale, projectId);
}

export async function saveCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("courseId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  await updateCourse(id, {
    title: (formData.get("title") as string) ?? "",
    code: (formData.get("code") as string) ?? "",
    semester: Number(formData.get("semester") ?? 1),
    year: Number(formData.get("year") ?? 1),
    credits: Number(formData.get("credits") ?? 3),
    courseType: (formData.get("courseType") as "mandatory") ?? "mandatory",
    instructor: (formData.get("instructor") as string) ?? "",
    status: (formData.get("status") as "planned") ?? "planned",
    finalScore: formData.get("finalScore") ? Number(formData.get("finalScore")) : null,
    finalGrade: (formData.get("finalGrade") as string) ?? "",
    note: (formData.get("note") as string) ?? "",
  });
  revalidate(locale, projectId);
}

export async function removeCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("courseId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  await deleteCourse(id);
  revalidate(locale, projectId);
}

// ── Modules ───────────────────────────────────────────────────────────────────

export async function addModule(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const input = learningModuleInputSchema.parse({
    projectId,
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await createModule(input);
  revalidate(locale, projectId);
}

export async function saveModule(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("moduleId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  await updateModule(id, {
    title: (formData.get("title") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    isCompleted: formData.get("isCompleted") === "true",
  });
  revalidate(locale, projectId);
}

export async function removeModule(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("moduleId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  await deleteModule(id);
  revalidate(locale, projectId);
}

// ── Topics ────────────────────────────────────────────────────────────────────

export async function addTopic(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const input = learningTopicInputSchema.parse({
    projectId,
    courseId: formData.get("courseId"),
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    topicType: formData.get("topicType") ?? "lecture",
    durationHours: formData.get("durationHours") ?? 2,
    orderIndex: formData.get("orderIndex") ?? 0,
    notes: "",
  });
  await createTopic(input);
  revalidate(locale, projectId);
}

export async function saveTopic(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("topicId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  const isCompleted = formData.get("isCompleted") === "true";
  await updateTopic(id, {
    title: (formData.get("title") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    topicType: (formData.get("topicType") as "lecture") ?? "lecture",
    durationHours: Number(formData.get("durationHours") ?? 2),
    isCompleted,
    completedAt: isCompleted ? new Date() : null,
    notes: (formData.get("notes") as string) ?? "",
  });
  revalidate(locale, projectId);
}

export async function removeTopic(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("topicId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  await deleteTopic(id);
  revalidate(locale, projectId);
}

export async function generateTopicsFromLectures(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) return { ok: false, count: 0 };
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const courseId = formData.get("courseId") as string;
  const moduleId = formData.get("moduleId") as string;
  const topicType = (formData.get("topicType") as string) ?? "seminar";
  const project = await getProjectForUser(projectId, user);
  if (!project) return { ok: false, count: 0 };

  // Fetch all topics in this module to find lectures and already-linked generated topics
  const { listTopics } = await import("@/lib/learning");
  const allModuleTopics = (await listTopics(courseId)).filter((t) => t.moduleId === moduleId);

  const lectures = allModuleTopics.filter((t) => t.topicType === "lecture");
  if (!lectures.length) return { ok: true, count: 0 };

  // Find lecture IDs that already have a generated topic of this type
  const alreadyLinked = new Set(
    allModuleTopics
      .filter((t) => t.topicType === topicType && t.linkedLectureId)
      .map((t) => t.linkedLectureId),
  );

  const toGenerate = lectures.filter((l) => !alreadyLinked.has(l._id ?? ""));
  if (!toGenerate.length) return { ok: true, count: 0 };

  const baseOrder = allModuleTopics.length;
  await Promise.all(
    toGenerate.map((lecture, i) =>
      createTopic({
        projectId,
        courseId,
        moduleId,
        title: lecture.title,
        description: "",
        topicType: topicType as "seminar" | "practical" | "lab",
        orderIndex: baseOrder + i,
        isCompleted: false,
        completedAt: null,
        durationHours: lecture.durationHours,
        notes: "",
        linkedLectureId: lecture._id ?? "",
      }),
    ),
  );

  revalidate(locale, projectId);
  return { ok: true, count: toGenerate.length };
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function addAssessment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const linkedTopicIds = (formData.get("linkedTopicIds") as string ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const linkedModuleIds = (formData.get("linkedModuleIds") as string ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  const input = learningAssessmentInputSchema.parse({
    projectId,
    courseId: formData.get("courseId"),
    moduleId: formData.get("moduleId") ?? "",
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    assessmentType: formData.get("assessmentType") ?? "test",
    linkedTopicIds,
    linkedModuleIds,
    dueDate: formData.get("dueDate") ?? "",
    maxScore: formData.get("maxScore") ?? 100,
    weight: formData.get("weight") ?? 0,
    notes: formData.get("notes") ?? "",
  });
  await createAssessment(input, user);
  revalidate(locale, projectId);
}

export async function saveAssessment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("assessmentId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const linkedTopicIds = (formData.get("linkedTopicIds") as string ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const linkedModuleIds = (formData.get("linkedModuleIds") as string ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  const rawScore = formData.get("achievedScore");
  await updateAssessment(id, {
    title: (formData.get("title") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    assessmentType: (formData.get("assessmentType") as "test") ?? "test",
    linkedTopicIds,
    linkedModuleIds,
    dueDate: (formData.get("dueDate") as string) ?? "",
    completedDate: (formData.get("completedDate") as string) ?? "",
    maxScore: Number(formData.get("maxScore") ?? 100),
    achievedScore: rawScore !== null && rawScore !== "" ? Number(rawScore) : null,
    weight: Number(formData.get("weight") ?? 0),
    status: (formData.get("status") as "upcoming") ?? "upcoming",
    notes: (formData.get("notes") as string) ?? "",
    feedback: (formData.get("feedback") as string) ?? "",
  });
  revalidate(locale, projectId);
}

export async function removeAssessment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("assessmentId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  await deleteAssessment(id);
  revalidate(locale, projectId);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function addSession(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  const input = learningSessionInputSchema.parse({
    projectId,
    courseId: formData.get("courseId"),
    topicId: formData.get("topicId") ?? "",
    moduleId: formData.get("moduleId") ?? "",
    title: formData.get("title") ?? "",
    sessionType: formData.get("sessionType") ?? "lecture",
    date: formData.get("date") ?? "",
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
    durationHours: formData.get("durationHours") ?? 1.5,
    attendance: formData.get("attendance") || null,
    grade: formData.get("grade") ? Number(formData.get("grade")) : null,
    notes: formData.get("notes") ?? "",
    location: formData.get("location") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await createSession(input);
  revalidate(locale, projectId);
}

export async function saveSession(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("sessionId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  const rawGrade = formData.get("grade");
  const rawAtt = formData.get("attendance");
  await updateSession(id, {
    title: (formData.get("title") as string) ?? "",
    sessionType: (formData.get("sessionType") as "lecture") ?? "lecture",
    date: (formData.get("date") as string) ?? "",
    startTime: (formData.get("startTime") as string) ?? "",
    endTime: (formData.get("endTime") as string) ?? "",
    durationHours: Number(formData.get("durationHours") ?? 1.5),
    attendance: (rawAtt && rawAtt !== "null" ? rawAtt as "present" | "absent" | "excused" | "late" : null),
    grade: rawGrade !== null && rawGrade !== "" ? Number(rawGrade) : null,
    notes: (formData.get("notes") as string) ?? "",
    location: (formData.get("location") as string) ?? "",
    topicId: (formData.get("topicId") as string) ?? "",
    moduleId: (formData.get("moduleId") as string) ?? "",
  });
  revalidate(locale, projectId);
}

export async function removeSession(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("sessionId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  await deleteSession(id);
  revalidate(locale, projectId);
}

// ── Assignments ───────────────────────────────────────────────────────────────

export async function addAssignment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  const input = learningAssignmentInputSchema.parse({
    projectId,
    courseId: formData.get("courseId"),
    sessionId: formData.get("sessionId") ?? "",
    topicId: formData.get("topicId") ?? "",
    moduleId: formData.get("moduleId") ?? "",
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    assignmentType: formData.get("assignmentType") ?? "homework",
    dueDate: formData.get("dueDate") ?? "",
    maxScore: formData.get("maxScore") ?? 100,
    status: formData.get("status") ?? "assigned",
    notes: formData.get("notes") ?? "",
  });
  await createAssignment(input, user);
  revalidate(locale, projectId);
}

export async function saveAssignmentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("assignmentId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  const rawScore = formData.get("achievedScore");
  await updateAssignment(id, {
    title: (formData.get("title") as string) ?? "",
    description: (formData.get("description") as string) ?? "",
    assignmentType: (formData.get("assignmentType") as "homework") ?? "homework",
    dueDate: (formData.get("dueDate") as string) ?? "",
    submittedDate: (formData.get("submittedDate") as string) ?? "",
    maxScore: Number(formData.get("maxScore") ?? 100),
    achievedScore: rawScore !== null && rawScore !== "" ? Number(rawScore) : null,
    status: (formData.get("status") as "assigned") ?? "assigned",
    notes: (formData.get("notes") as string) ?? "",
    feedback: (formData.get("feedback") as string) ?? "",
    sessionId: (formData.get("sessionId") as string) ?? "",
    topicId: (formData.get("topicId") as string) ?? "",
    moduleId: (formData.get("moduleId") as string) ?? "",
  });
  revalidate(locale, projectId);
}

export async function removeAssignmentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const id = formData.get("assignmentId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;
  await deleteAssignment(id);
  revalidate(locale, projectId);
}

// ── Recurring schedule ────────────────────────────────────────────────────────

export async function generateRecurringSchedule(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const courseId = formData.get("courseId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return { ok: false };

  const weekdays = (formData.get("weekdays") as string).split(",").map(Number).filter((n) => !isNaN(n));
  const startDate = formData.get("startDate") as string;
  const count = Number(formData.get("count") || 0);
  const startTime = (formData.get("startTime") as string) || "";
  const endTime = (formData.get("endTime") as string) || "";
  const durationHours = Number(formData.get("durationHours") || 1.5);
  const location = (formData.get("location") as string) || "";
  const assignMode = (formData.get("assignMode") as string) || "single_type";
  const singleType = (formData.get("singleType") as TopicType) || "lecture";
  const patternStr = (formData.get("pattern") as string) || "lecture";
  const pattern = patternStr.split(",") as TopicType[];

  if (!startDate || count <= 0 || weekdays.length === 0) return { ok: false, reason: "no_params" };
  const dates: string[] = [];
  const cur = new Date(startDate);
  let safety = 0;
  while (dates.length < count && safety < 500) {
    if (weekdays.includes(cur.getDay())) dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
    safety++;
  }
  if (dates.length === 0) return { ok: false, reason: "no_dates" };

  let courseTopics: { _id?: string; moduleId: string; title: string; topicType: TopicType }[] = [];
  if (assignMode === "sequential") {
    const allTopics = await listTopicsForProject(projectId);
    courseTopics = allTopics.filter((t) => t.courseId === courseId);
  }

  const existingCount = (await listSessions(courseId)).length;
  const recurringGroupId = `rg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const inputs = dates.map((date, i) => {
    let topicId = "";
    let moduleId = "";
    let title = "";
    let sessionType: TopicType = singleType;

    if (assignMode === "sequential" && courseTopics.length > 0) {
      const t = courseTopics[i % courseTopics.length];
      topicId = t._id ?? "";
      moduleId = t.moduleId;
      title = t.title;
      sessionType = t.topicType;
    } else if (assignMode === "alternating" && pattern.length > 0) {
      sessionType = pattern[i % pattern.length];
    }

    return learningSessionInputSchema.parse({
      projectId, courseId, topicId, moduleId, title,
      sessionType, date, startTime, endTime, durationHours,
      location, notes: "", attendance: null, grade: null,
      orderIndex: existingCount + i,
      status: "active", cancellationReason: "", originalDate: "", recurringGroupId,
    });
  });

  await bulkCreateSessions(inputs);
  revalidate(locale, projectId);
  return { ok: true, count: dates.length };
}

export async function cancelSessionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const sessionId = formData.get("sessionId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return { ok: false };

  const reason = (formData.get("cancellationReason") as string) || "";
  const mode = (formData.get("cancelMode") as string) || "drop";
  const shiftDays = Number(formData.get("shiftDays") || 7);
  const recurringGroupId = (formData.get("recurringGroupId") as string) || "";
  const sessionDate = (formData.get("sessionDate") as string) || "";

  await updateSession(sessionId, { status: "cancelled", cancellationReason: reason });

  if (mode === "shift" && recurringGroupId && sessionDate) {
    await shiftSessionsInGroup(projectId, recurringGroupId, sessionDate, shiftDays);
  }

  revalidate(locale, projectId);
  return { ok: true };
}

export async function rescheduleSessionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const sessionId = formData.get("sessionId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return { ok: false };

  const oldDate = (formData.get("originalDate") as string) || "";
  const newDate = (formData.get("newDate") as string) || "";
  const newStartTime = (formData.get("newStartTime") as string) || "";
  const newEndTime = (formData.get("newEndTime") as string) || "";
  const shiftSubsequent = formData.get("shiftSubsequent") === "true";
  const shiftDays = Number(formData.get("shiftDays") || 7);
  const recurringGroupId = (formData.get("recurringGroupId") as string) || "";

  await updateSession(sessionId, {
    status: "rescheduled",
    date: newDate,
    startTime: newStartTime,
    endTime: newEndTime,
    originalDate: oldDate,
  });

  if (shiftSubsequent && recurringGroupId && oldDate) {
    await shiftSessionsInGroup(projectId, recurringGroupId, oldDate, shiftDays);
  }

  revalidate(locale, projectId);
  return { ok: true };
}

export async function restoreSessionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const sessionId = formData.get("sessionId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  await updateSession(sessionId, { status: "active", cancellationReason: "" });
  revalidate(locale, projectId);
}

export async function clearCourseSchedule(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const courseId = formData.get("courseId") as string;
  const mode = (formData.get("mode") as string) || "all";
  const project = await getProjectForUser(projectId, user);
  if (!project) return { ok: false };

  const count = await bulkDeleteSessionsByCourse(projectId, courseId, mode === "cancelled");
  revalidate(locale, projectId);
  return { ok: true, count };
}

export async function addUnscheduledTopicsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const courseId = formData.get("courseId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return { ok: false };

  type TopicEntry = {
    topicId: string; moduleId: string; title: string; sessionType: TopicType;
    durationHours: number; date: string; startTime: string; endTime: string; location: string;
  };
  const entries = JSON.parse((formData.get("topicsJson") as string) || "[]") as TopicEntry[];
  const existingCount = Number(formData.get("existingCount") ?? 0);

  const inputs = entries.map((t, i) => learningSessionInputSchema.parse({
    projectId, courseId, topicId: t.topicId, moduleId: t.moduleId,
    title: t.title, sessionType: t.sessionType, date: t.date,
    startTime: t.startTime, endTime: t.endTime, durationHours: t.durationHours,
    location: t.location, notes: "", attendance: null, grade: null,
    orderIndex: existingCount + i,
    status: "active", cancellationReason: "", originalDate: "", recurringGroupId: "",
  }));

  await bulkCreateSessions(inputs);
  revalidate(locale, projectId);
  return { ok: true, count: inputs.length };
}
