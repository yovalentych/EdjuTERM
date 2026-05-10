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
  createAssignment, updateAssignment, deleteAssignment,
} from "@/lib/learning";
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
