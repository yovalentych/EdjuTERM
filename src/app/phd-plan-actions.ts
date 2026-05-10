"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectForUser } from "@/lib/projects";
import {
  getPhdPlan,
  savePhdPlanMeta,
  upsertCurriculumCourse,
  deleteCurriculumCourse,
  upsertMilestone,
  deleteMilestone,
  saveYearlyMeta,
  upsertYearlyCourse,
  deleteYearlyCourse,
  upsertYearlyScientificItem,
  deleteYearlyScientificItem,
  cascadeUpdateSemesterPeriods,
} from "@/lib/phd-plan";
import {
  phdPlanMetaSchema,
  phdCurriculumCourseSchema,
  phdMilestoneSchema,
  phdYearlyCourseSchema,
  phdYearlyScientificItemSchema,
} from "@/lib/schemas";

function revalidate(locale: string, projectId: string) {
  revalidatePath(`/${locale}/app/phd-plan?projectId=${projectId}`);
}

// ── Meta ──────────────────────────────────────────────────────────────────────

export async function savePhdMeta(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const meta = phdPlanMetaSchema.omit({ projectId: true }).parse({
    studentName: formData.get("studentName") ?? "",
    specialty: formData.get("specialty") ?? "",
    studyForm: formData.get("studyForm") ?? "full_time",
    enrollmentDate: formData.get("enrollmentDate") ?? "",
    enrollmentOrderDate: formData.get("enrollmentOrderDate") ?? "",
    enrollmentOrderNumber: formData.get("enrollmentOrderNumber") ?? "",
    supervisor: formData.get("supervisor") ?? "",
    supervisorTitle: formData.get("supervisorTitle") ?? "",
    dissertationTitle: formData.get("dissertationTitle") ?? "",
    dissertationApprovalDate: formData.get("dissertationApprovalDate") ?? "",
    dissertationApprovalProtocol: formData.get("dissertationApprovalProtocol") ?? "",
    justification: formData.get("justification") ?? "",
    department: formData.get("department") ?? "",
    institution: formData.get("institution") ?? "",
    totalCredits: formData.get("totalCredits") ?? 0,
  });
  await savePhdPlanMeta(projectId, meta, user);
  revalidate(locale, projectId);
}

// ── Curriculum courses ────────────────────────────────────────────────────────

export async function addCurriculumCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const course = phdCurriculumCourseSchema.parse({
    cid: `cc-${Date.now()}`,
    cycle: formData.get("cycle") ?? "general",
    subgroup: formData.get("subgroup") ?? "mandatory",
    title: formData.get("title"),
    credits: formData.get("credits") ?? 3,
    controlForm: formData.get("controlForm") ?? "",
    studyYear: formData.get("studyYear") ?? 1,
    orderIndex: formData.get("orderIndex") ?? 0,
    credited: false,
  });
  await upsertCurriculumCourse(projectId, course, user);
  revalidate(locale, projectId);
}

export async function updateCurriculumCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const course = phdCurriculumCourseSchema.parse({
    cid: formData.get("cid"),
    cycle: formData.get("cycle") ?? "general",
    subgroup: formData.get("subgroup") ?? "mandatory",
    title: formData.get("title"),
    credits: formData.get("credits") ?? 3,
    controlForm: formData.get("controlForm") ?? "",
    studyYear: formData.get("studyYear") ?? 1,
    orderIndex: formData.get("orderIndex") ?? 0,
    credited: formData.get("credited") === "true",
  });
  await upsertCurriculumCourse(projectId, course, user);
  revalidate(locale, projectId);
}

export async function removeCurriculumCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  await deleteCurriculumCourse(projectId, formData.get("cid") as string);
  revalidate(locale, projectId);
}

// Toggle credited status of a single curriculum course from the PhD plan UI
export async function toggleCurriculumCourseCredit(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const cid = formData.get("cid") as string;
  const credited = formData.get("credited") === "true";
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const plan = await getPhdPlan(projectId);
  const course = plan?.curriculumCourses.find((c) => c.cid === cid);
  if (!course) return;
  await upsertCurriculumCourse(projectId, { ...course, credited }, user);
  revalidate(locale, projectId);
}

// Called from Learning Journal: find or create a curriculum course and mark it credited
export async function creditFromLearning(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const title = (formData.get("title") as string).trim();
  const credits = Number(formData.get("credits") ?? 3);
  const studyYear = Number(formData.get("studyYear") ?? 1);
  const project = await getProjectForUser(projectId, user);
  if (!project) return { ok: false };

  const plan = await getPhdPlan(projectId);
  const existing = plan?.curriculumCourses.find(
    (c) => c.title.trim().toLowerCase() === title.toLowerCase(),
  );

  if (existing) {
    await upsertCurriculumCourse(projectId, { ...existing, credited: true }, user);
  } else {
    await upsertCurriculumCourse(
      projectId,
      phdCurriculumCourseSchema.parse({
        cid: `cc-${Date.now()}`,
        cycle: "general",
        subgroup: "mandatory",
        title,
        credits,
        controlForm: "Залік",
        studyYear,
        orderIndex: (plan?.curriculumCourses.length ?? 0),
        credited: true,
      }),
      user,
    );
  }

  revalidate(locale, projectId);
  revalidatePath(`/${locale}/app/phd-plan?projectId=${projectId}`);
  return { ok: true, created: !existing };
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function addMilestone(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const milestone = phdMilestoneSchema.parse({
    mid: `ms-${Date.now()}`,
    title: formData.get("title"),
    period: formData.get("period") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await upsertMilestone(projectId, milestone, user);
  revalidate(locale, projectId);
}

export async function updateMilestone(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const milestone = phdMilestoneSchema.parse({
    mid: formData.get("mid"),
    title: formData.get("title"),
    period: formData.get("period") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await upsertMilestone(projectId, milestone, user);
  revalidate(locale, projectId);
}

export async function removeMilestone(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  await deleteMilestone(projectId, formData.get("mid") as string);
  revalidate(locale, projectId);
}

// ── Semester dates ────────────────────────────────────────────────────────────

export async function saveSemesterDates(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  const sem1Start = (formData.get("sem1Start") as string) ?? "";
  const sem1End = (formData.get("sem1End") as string) ?? "";
  const sem2Start = (formData.get("sem2Start") as string) ?? "";
  const sem2End = (formData.get("sem2End") as string) ?? "";
  await saveYearlyMeta(projectId, year, { sem1Start, sem1End, sem2Start, sem2End }, user);
  await cascadeUpdateSemesterPeriods(projectId, year, sem1Start, sem1End, sem2Start, sem2End);
  revalidate(locale, projectId);
}

// ── Yearly plan meta ──────────────────────────────────────────────────────────

export async function saveYearMeta(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  await saveYearlyMeta(projectId, year, {
    headOfDeptName: (formData.get("headOfDeptName") as string) ?? "",
    headOfDeptDate: (formData.get("headOfDeptDate") as string) ?? "",
    supervisorAssessment: (formData.get("supervisorAssessment") as string) ?? "",
    committeeDecision: (formData.get("committeeDecision") as string) ?? "",
    committeeChair: (formData.get("committeeChair") as string) ?? "",
    committeeDate: (formData.get("committeeDate") as string) ?? "",
  }, user);
  revalidate(locale, projectId);
}

// ── Yearly educational courses ────────────────────────────────────────────────

export async function addYearlyCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  const course = phdYearlyCourseSchema.parse({
    ycid: `yc-${Date.now()}`,
    cycle: formData.get("cycle") ?? "general",
    subgroup: formData.get("subgroup") ?? "mandatory",
    title: formData.get("title"),
    controlForm: formData.get("controlForm") ?? "",
    period: formData.get("period") ?? "",
    termType: formData.get("period_termType") ?? "",
    grade: formData.get("grade") ?? "",
    teacherName: formData.get("teacherName") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await upsertYearlyCourse(projectId, year, course, user);
  revalidate(locale, projectId);
}

export async function updateYearlyCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  const course = phdYearlyCourseSchema.parse({
    ycid: formData.get("ycid"),
    cycle: formData.get("cycle") ?? "general",
    subgroup: formData.get("subgroup") ?? "mandatory",
    title: formData.get("title"),
    controlForm: formData.get("controlForm") ?? "",
    period: formData.get("period") ?? "",
    termType: formData.get("period_termType") ?? "",
    grade: formData.get("grade") ?? "",
    teacherName: formData.get("teacherName") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await upsertYearlyCourse(projectId, year, course, user);
  revalidate(locale, projectId);
}

export async function removeYearlyCourse(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  await deleteYearlyCourse(projectId, year, formData.get("ycid") as string);
  revalidate(locale, projectId);
}

// ── Yearly scientific work items ──────────────────────────────────────────────

export async function addYearlyScientificItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  const item = phdYearlyScientificItemSchema.parse({
    wsid: `ws-${Date.now()}`,
    title: formData.get("title"),
    content: formData.get("content") ?? "",
    period: formData.get("period") ?? "",
    termType: formData.get("period_termType") ?? "",
    status: formData.get("status") ?? "pending",
    supervisorNote: formData.get("supervisorNote") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await upsertYearlyScientificItem(projectId, year, item, user);
  revalidate(locale, projectId);
}

export async function updateYearlyScientificItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  const item = phdYearlyScientificItemSchema.parse({
    wsid: formData.get("wsid"),
    title: formData.get("title"),
    content: formData.get("content") ?? "",
    period: formData.get("period") ?? "",
    termType: formData.get("period_termType") ?? "",
    status: formData.get("status") ?? "pending",
    supervisorNote: formData.get("supervisorNote") ?? "",
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  await upsertYearlyScientificItem(projectId, year, item, user);
  revalidate(locale, projectId);
}

// ── Import courses from yearly plans → curriculum ─────────────────────────────

export async function importCoursesFromYearly(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const plan = await getPhdPlan(projectId);
  if (!plan) return;

  const existingTitles = new Set(plan.curriculumCourses.map((c) => c.title.toLowerCase().trim()));
  let orderIndex = plan.curriculumCourses.length;

  for (const yp of plan.yearlyPlans) {
    for (const yc of yp.educationalCourses) {
      const key = yc.title.toLowerCase().trim();
      if (!key || existingTitles.has(key)) continue;
      existingTitles.add(key);
      const course = phdCurriculumCourseSchema.parse({
        cid: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        cycle: yc.cycle,
        subgroup: yc.subgroup,
        title: yc.title,
        credits: 3,
        controlForm: yc.controlForm,
        studyYear: yp.year,
        orderIndex: orderIndex++,
      });
      await upsertCurriculumCourse(projectId, course, user);
    }
  }
  revalidate(locale, projectId);
}

export async function removeYearlyScientificItem(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const locale = (formData.get("locale") as string) ?? "uk";
  const projectId = formData.get("projectId") as string;
  const project = await getProjectForUser(projectId, user);
  if (!project) return;

  const year = Number(formData.get("year"));
  await deleteYearlyScientificItem(projectId, year, formData.get("wsid") as string);
  revalidate(locale, projectId);
}
