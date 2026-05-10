import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  phdPlanSchema,
  phdCurriculumCourseSchema,
  phdMilestoneSchema,
  phdYearlyCourseSchema,
  phdYearlyScientificItemSchema,
  type PhdPlan,
  type PhdPlanMeta,
  type PhdCurriculumCourse,
  type PhdMilestone,
  type PhdYearlyCourse,
  type PhdYearlyScientificItem,
  type PhdYearlyPlan,
  type SafeUser,
} from "@/lib/schemas";

// ── in-memory fallback ────────────────────────────────────────────────────────

const localPlans: PhdPlan[] = [];

function blankPlan(projectId: string, userId: string): PhdPlan {
  const now = new Date();
  return phdPlanSchema.parse({
    projectId,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  });
}

async function ensureIndex() {
  if (!hasMongoConfig()) return;
  const db = await getMongoDb();
  await db.collection("phdPlans").createIndex({ projectId: 1 }, { unique: true });
}

function parseDoc(doc: Record<string, unknown>): PhdPlan {
  const { _id, ...rest } = doc;
  return phdPlanSchema.parse({ ...rest, _id: _id?.toString() });
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getPhdPlan(projectId: string): Promise<PhdPlan | null> {
  if (!hasMongoConfig()) {
    return localPlans.find((p) => p.projectId === projectId) ?? null;
  }
  const db = await getMongoDb();
  const doc = await db.collection("phdPlans").findOne({ projectId });
  if (!doc) return null;
  return parseDoc(doc as any);
}

// ── Meta ──────────────────────────────────────────────────────────────────────

export async function savePhdPlanMeta(
  projectId: string,
  meta: Omit<PhdPlanMeta, "projectId">,
  user: SafeUser,
): Promise<PhdPlan> {
  const now = new Date();
  if (!hasMongoConfig()) {
    let plan = localPlans.find((p) => p.projectId === projectId);
    if (!plan) {
      plan = blankPlan(projectId, user._id ?? "");
      localPlans.push(plan);
    }
    Object.assign(plan, { ...meta, updatedAt: now });
    return plan;
  }
  await ensureIndex();
  const db = await getMongoDb();
  await db.collection("phdPlans").updateOne(
    { projectId },
    {
      $set: { ...meta, updatedAt: now },
      $setOnInsert: {
        projectId,
        createdBy: user._id ?? "",
        createdAt: now,
        curriculumCourses: [],
        milestones: [],
        yearlyPlans: [],
      },
    },
    { upsert: true },
  );
  return (await getPhdPlan(projectId))!;
}

// ── Curriculum courses ────────────────────────────────────────────────────────

export async function upsertCurriculumCourse(
  projectId: string,
  course: PhdCurriculumCourse,
  user: SafeUser,
): Promise<void> {
  const validated = phdCurriculumCourseSchema.parse(course);
  const now = new Date();
  if (!hasMongoConfig()) {
    let plan = localPlans.find((p) => p.projectId === projectId);
    if (!plan) {
      plan = blankPlan(projectId, user._id ?? "");
      localPlans.push(plan);
    }
    const idx = plan.curriculumCourses.findIndex((c) => c.cid === validated.cid);
    if (idx >= 0) plan.curriculumCourses[idx] = validated;
    else plan.curriculumCourses.push(validated);
    plan.updatedAt = now;
    return;
  }
  await ensureIndex();
  const db = await getMongoDb();
  const existing = await db.collection("phdPlans").findOne({ projectId, "curriculumCourses.cid": validated.cid });
  if (existing) {
    await db.collection("phdPlans").updateOne(
      { projectId, "curriculumCourses.cid": validated.cid },
      { $set: { "curriculumCourses.$": validated, updatedAt: now } },
    );
  } else {
    await db.collection("phdPlans").updateOne(
      { projectId },
      {
        $push: { curriculumCourses: validated } as any,
        $set: { updatedAt: now },
        $setOnInsert: {
          projectId,
          createdBy: user._id ?? "",
          createdAt: now,
          milestones: [],
          yearlyPlans: [],
        },
      },
      { upsert: true },
    );
  }
}

export async function deleteCurriculumCourse(projectId: string, cid: string): Promise<void> {
  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId);
    if (plan) plan.curriculumCourses = plan.curriculumCourses.filter((c) => c.cid !== cid);
    return;
  }
  const db = await getMongoDb();
  await db.collection("phdPlans").updateOne(
    { projectId },
    { $pull: { curriculumCourses: { cid } } as any },
  );
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function upsertMilestone(
  projectId: string,
  milestone: PhdMilestone,
  user: SafeUser,
): Promise<void> {
  const validated = phdMilestoneSchema.parse(milestone);
  const now = new Date();
  if (!hasMongoConfig()) {
    let plan = localPlans.find((p) => p.projectId === projectId);
    if (!plan) { plan = blankPlan(projectId, user._id ?? ""); localPlans.push(plan); }
    const idx = plan.milestones.findIndex((m) => m.mid === validated.mid);
    if (idx >= 0) plan.milestones[idx] = validated;
    else plan.milestones.push(validated);
    plan.updatedAt = now;
    return;
  }
  await ensureIndex();
  const db = await getMongoDb();
  const existing = await db.collection("phdPlans").findOne({ projectId, "milestones.mid": validated.mid });
  if (existing) {
    await db.collection("phdPlans").updateOne(
      { projectId, "milestones.mid": validated.mid },
      { $set: { "milestones.$": validated, updatedAt: now } },
    );
  } else {
    await db.collection("phdPlans").updateOne(
      { projectId },
      {
        $push: { milestones: validated } as any,
        $set: { updatedAt: now },
        $setOnInsert: { projectId, createdBy: user._id ?? "", createdAt: now, curriculumCourses: [], yearlyPlans: [] },
      },
      { upsert: true },
    );
  }
}

export async function deleteMilestone(projectId: string, mid: string): Promise<void> {
  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId);
    if (plan) plan.milestones = plan.milestones.filter((m) => m.mid !== mid);
    return;
  }
  const db = await getMongoDb();
  await db.collection("phdPlans").updateOne(
    { projectId },
    { $pull: { milestones: { mid } } as any },
  );
}

// ── Yearly plans ──────────────────────────────────────────────────────────────

async function ensurePlan(projectId: string, user: SafeUser): Promise<void> {
  if (!hasMongoConfig()) {
    if (!localPlans.find((p) => p.projectId === projectId)) {
      localPlans.push(blankPlan(projectId, user._id ?? ""));
    }
    return;
  }
  await ensureIndex();
  const db = await getMongoDb();
  const now = new Date();
  await db.collection("phdPlans").updateOne(
    { projectId },
    { $setOnInsert: { projectId, createdBy: user._id ?? "", createdAt: now, updatedAt: now, curriculumCourses: [], milestones: [], yearlyPlans: [] } },
    { upsert: true },
  );
}

export async function saveYearlyMeta(
  projectId: string,
  year: number,
  meta: Partial<Omit<PhdYearlyPlan, "year" | "educationalCourses" | "scientificWorkItems">>,
  user: SafeUser,
): Promise<void> {
  await ensurePlan(projectId, user);
  const now = new Date();
  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId)!;
    let yp = plan.yearlyPlans.find((y) => y.year === year);
    if (!yp) { yp = { year, educationalCourses: [], scientificWorkItems: [], headOfDeptName: "", headOfDeptDate: "", supervisorAssessment: "", committeeDecision: "", committeeChair: "", committeeDate: "", sem1Start: "", sem1End: "", sem2Start: "", sem2End: "" }; plan.yearlyPlans.push(yp); }
    Object.assign(yp, meta);
    plan.updatedAt = now;
    return;
  }
  const db = await getMongoDb();
  const existing = await db.collection("phdPlans").findOne({ projectId, "yearlyPlans.year": year });
  if (existing) {
    const setFields: Record<string, unknown> = { updatedAt: now };
    for (const [k, v] of Object.entries(meta)) setFields[`yearlyPlans.$.${k}`] = v;
    await db.collection("phdPlans").updateOne({ projectId, "yearlyPlans.year": year }, { $set: setFields });
  } else {
    await db.collection("phdPlans").updateOne(
      { projectId },
      { $push: { yearlyPlans: { year, educationalCourses: [], scientificWorkItems: [], ...meta } } as any, $set: { updatedAt: now } },
    );
  }
}

export async function upsertYearlyCourse(
  projectId: string,
  year: number,
  course: PhdYearlyCourse,
  user: SafeUser,
): Promise<void> {
  const validated = phdYearlyCourseSchema.parse(course);
  await ensurePlan(projectId, user);
  const now = new Date();
  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId)!;
    let yp = plan.yearlyPlans.find((y) => y.year === year);
    if (!yp) { yp = { year, educationalCourses: [], scientificWorkItems: [], headOfDeptName: "", headOfDeptDate: "", supervisorAssessment: "", committeeDecision: "", committeeChair: "", committeeDate: "", sem1Start: "", sem1End: "", sem2Start: "", sem2End: "" }; plan.yearlyPlans.push(yp); }
    const idx = yp.educationalCourses.findIndex((c) => c.ycid === validated.ycid);
    if (idx >= 0) yp.educationalCourses[idx] = validated;
    else yp.educationalCourses.push(validated);
    plan.updatedAt = now;
    return;
  }
  const db = await getMongoDb();
  const yearlyPlanExists = await db.collection("phdPlans").findOne({ projectId, "yearlyPlans.year": year });
  if (!yearlyPlanExists) {
    await db.collection("phdPlans").updateOne(
      { projectId },
      { $push: { yearlyPlans: { year, educationalCourses: [validated], scientificWorkItems: [] } } as any, $set: { updatedAt: now } },
    );
    return;
  }
  const courseExists = await db.collection("phdPlans").findOne({ projectId, "yearlyPlans": { $elemMatch: { year, "educationalCourses.ycid": validated.ycid } } });
  if (courseExists) {
    await db.collection("phdPlans").updateOne(
      { projectId, "yearlyPlans.year": year },
      { $set: { "yearlyPlans.$[yp].educationalCourses.$[c]": validated, updatedAt: now } },
      { arrayFilters: [{ "yp.year": year }, { "c.ycid": validated.ycid }] },
    );
  } else {
    await db.collection("phdPlans").updateOne(
      { projectId, "yearlyPlans.year": year },
      { $push: { "yearlyPlans.$.educationalCourses": validated } as any, $set: { updatedAt: now } },
    );
  }
}

export async function deleteYearlyCourse(projectId: string, year: number, ycid: string): Promise<void> {
  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId);
    if (plan) { const yp = plan.yearlyPlans.find((y) => y.year === year); if (yp) yp.educationalCourses = yp.educationalCourses.filter((c) => c.ycid !== ycid); }
    return;
  }
  const db = await getMongoDb();
  await db.collection("phdPlans").updateOne(
    { projectId, "yearlyPlans.year": year },
    { $pull: { "yearlyPlans.$.educationalCourses": { ycid } } as any },
  );
}

export async function upsertYearlyScientificItem(
  projectId: string,
  year: number,
  item: PhdYearlyScientificItem,
  user: SafeUser,
): Promise<void> {
  const validated = phdYearlyScientificItemSchema.parse(item);
  await ensurePlan(projectId, user);
  const now = new Date();
  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId)!;
    let yp = plan.yearlyPlans.find((y) => y.year === year);
    if (!yp) { yp = { year, educationalCourses: [], scientificWorkItems: [], headOfDeptName: "", headOfDeptDate: "", supervisorAssessment: "", committeeDecision: "", committeeChair: "", committeeDate: "", sem1Start: "", sem1End: "", sem2Start: "", sem2End: "" }; plan.yearlyPlans.push(yp); }
    const idx = yp.scientificWorkItems.findIndex((i) => i.wsid === validated.wsid);
    if (idx >= 0) yp.scientificWorkItems[idx] = validated;
    else yp.scientificWorkItems.push(validated);
    plan.updatedAt = now;
    return;
  }
  const db = await getMongoDb();
  const yearlyPlanExists = await db.collection("phdPlans").findOne({ projectId, "yearlyPlans.year": year });
  if (!yearlyPlanExists) {
    await db.collection("phdPlans").updateOne(
      { projectId },
      { $push: { yearlyPlans: { year, educationalCourses: [], scientificWorkItems: [validated] } } as any, $set: { updatedAt: now } },
    );
    return;
  }
  const itemExists = await db.collection("phdPlans").findOne({ projectId, "yearlyPlans": { $elemMatch: { year, "scientificWorkItems.wsid": validated.wsid } } });
  if (itemExists) {
    await db.collection("phdPlans").updateOne(
      { projectId, "yearlyPlans.year": year },
      { $set: { "yearlyPlans.$[yp].scientificWorkItems.$[i]": validated, updatedAt: now } },
      { arrayFilters: [{ "yp.year": year }, { "i.wsid": validated.wsid }] },
    );
  } else {
    await db.collection("phdPlans").updateOne(
      { projectId, "yearlyPlans.year": year },
      { $push: { "yearlyPlans.$.scientificWorkItems": validated } as any, $set: { updatedAt: now } },
    );
  }
}

export async function deleteYearlyScientificItem(projectId: string, year: number, wsid: string): Promise<void> {
  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId);
    if (plan) { const yp = plan.yearlyPlans.find((y) => y.year === year); if (yp) yp.scientificWorkItems = yp.scientificWorkItems.filter((i) => i.wsid !== wsid); }
    return;
  }
  const db = await getMongoDb();
  await db.collection("phdPlans").updateOne(
    { projectId, "yearlyPlans.year": year },
    { $pull: { "yearlyPlans.$.scientificWorkItems": { wsid } } as any },
  );
}

// ── Cascade semester period update ────────────────────────────────────────────

export async function cascadeUpdateSemesterPeriods(
  projectId: string,
  year: number,
  sem1Start: string,
  sem1End: string,
  sem2Start: string,
  sem2End: string,
): Promise<void> {
  const now = new Date();
  const periodMap: Record<string, string> = {
    sem1: sem1Start && sem1End ? `${sem1Start} — ${sem1End}` : "",
    sem2: sem2Start && sem2End ? `${sem2Start} — ${sem2End}` : "",
    academic_year: sem1Start && sem2End ? `${sem1Start} — ${sem2End}` : "",
  };

  if (!hasMongoConfig()) {
    const plan = localPlans.find((p) => p.projectId === projectId);
    if (!plan) return;
    const yp = plan.yearlyPlans.find((y) => y.year === year);
    if (!yp) return;
    for (const course of yp.educationalCourses) {
      const newPeriod = course.termType ? periodMap[course.termType] : undefined;
      if (newPeriod !== undefined && newPeriod) course.period = newPeriod;
    }
    for (const item of yp.scientificWorkItems) {
      const newPeriod = item.termType ? periodMap[item.termType] : undefined;
      if (newPeriod !== undefined && newPeriod) item.period = newPeriod;
    }
    plan.updatedAt = now;
    return;
  }

  const db = await getMongoDb();
  for (const [termType, newPeriod] of Object.entries(periodMap)) {
    if (!newPeriod) continue;
    await db.collection("phdPlans").updateOne(
      { projectId, "yearlyPlans.year": year },
      {
        $set: {
          "yearlyPlans.$[yp].educationalCourses.$[c].period": newPeriod,
          updatedAt: now,
        },
      },
      { arrayFilters: [{ "yp.year": year }, { "c.termType": termType }] },
    );
    await db.collection("phdPlans").updateOne(
      { projectId, "yearlyPlans.year": year },
      {
        $set: {
          "yearlyPlans.$[yp].scientificWorkItems.$[i].period": newPeriod,
          updatedAt: now,
        },
      },
      { arrayFilters: [{ "yp.year": year }, { "i.termType": termType }] },
    );
  }
}
