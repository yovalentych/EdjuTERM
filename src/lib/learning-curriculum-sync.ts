import "server-only";

import { getPhdPlan, upsertCurriculumCourse } from "@/lib/phd-plan";
import { createCourse, listCourses, updateCourse } from "@/lib/learning";
import { phdCurriculumCourseSchema, type LearningCourse, type PhdCurriculumCourse, type SafeUser } from "@/lib/schemas";

function norm(value: string) {
  return value.trim().toLowerCase();
}

function courseSubgroup(course: LearningCourse): PhdCurriculumCourse["subgroup"] {
  return course.courseType === "elective" || course.courseType === "optional" ? "elective" : "mandatory";
}

function learningCourseType(course: PhdCurriculumCourse): LearningCourse["courseType"] {
  return course.subgroup === "elective" ? "elective" : "mandatory";
}

function firstSemesterForStudyYear(studyYear: number) {
  return Math.max(1, (studyYear - 1) * 2 + 1);
}

export async function syncCurriculumFromLearningCourse(
  projectId: string,
  course: LearningCourse,
  user: SafeUser,
): Promise<void> {
  if (!course._id) return;

  const plan = await getPhdPlan(projectId);
  const existing = plan?.curriculumCourses.find((item) =>
    item.learningCourseId === course._id ||
    (course.curriculumCourseId && item.cid === course.curriculumCourseId) ||
    norm(item.title) === norm(course.title),
  );

  const cid = existing?.cid || course.curriculumCourseId || `cc-lc-${course._id}`;
  const next = phdCurriculumCourseSchema.parse({
    cid,
    title: course.title,
    credits: course.credits,
    cycle: existing?.cycle ?? "general",
    subgroup: courseSubgroup(course),
    controlForm: existing?.controlForm ?? "",
    studyYear: course.year ?? existing?.studyYear ?? Math.ceil(course.semester / 2),
    credited: course.status === "completed" || existing?.credited === true,
    learningCourseId: course._id,
  });

  await upsertCurriculumCourse(projectId, next, user);
  if (course.curriculumCourseId !== cid) {
    await updateCourse(course._id, { curriculumCourseId: cid });
  }
}

export async function syncLearningFromCurriculumCourse(
  projectId: string,
  curriculumCourse: PhdCurriculumCourse,
  user: SafeUser,
): Promise<void> {
  const courses = await listCourses(projectId);
  const existing = courses.find((course) =>
    course.curriculumCourseId === curriculumCourse.cid ||
    (curriculumCourse.learningCourseId && course._id === curriculumCourse.learningCourseId) ||
    norm(course.title) === norm(curriculumCourse.title),
  );

  const semester = existing?.semester ?? firstSemesterForStudyYear(curriculumCourse.studyYear);
  const patch = {
    title: curriculumCourse.title,
    credits: curriculumCourse.credits,
    year: curriculumCourse.studyYear,
    semester,
    semesterEnd: existing?.semesterEnd ?? semester,
    courseType: learningCourseType(curriculumCourse),
    status: curriculumCourse.credited ? "completed" as const : existing?.status ?? "planned" as const,
    curriculumCourseId: curriculumCourse.cid,
  };

  if (existing?._id) {
    await updateCourse(existing._id, patch);
    if (curriculumCourse.learningCourseId !== existing._id) {
      await upsertCurriculumCourse(
        projectId,
        phdCurriculumCourseSchema.parse({ ...curriculumCourse, learningCourseId: existing._id }),
        user,
      );
    }
    return;
  }

  const created = await createCourse({
    projectId,
    code: "",
    instructor: "",
    note: "",
    finalScore: null,
    finalGrade: "",
    ...patch,
  }, user);

  if (created._id) {
    await upsertCurriculumCourse(
      projectId,
      phdCurriculumCourseSchema.parse({ ...curriculumCourse, learningCourseId: created._id }),
      user,
    );
  }
}
