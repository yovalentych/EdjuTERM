"use client";

import { BookOpen, GraduationCap, Layers, Users } from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type { CourseMember, LearningCourse, LearningModule, LearningTopic } from "@/lib/schemas";

function semesterLabel(course: LearningCourse, isUk: boolean) {
  const end = Math.max(course.semester, course.semesterEnd ?? course.semester);
  if (end > course.semester) return isUk ? `Семестри ${course.semester}-${end}` : `Sem. ${course.semester}-${end}`;
  return isUk ? `Семестр ${course.semester}` : `Sem. ${course.semester}`;
}

export function CoursesOverview({
  locale,
  courses,
  modules,
  topics,
  members,
  onPickCourse,
}: {
  locale: "uk" | "en";
  courses: LearningCourse[];
  modules: LearningModule[];
  topics: LearningTopic[];
  members: CourseMember[];
  onPickCourse: (id: string) => void;
}) {
  const isUk = locale === "uk";

  if (courses.length === 0) {
    return (
      <LiquidCard tint="blue" className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <GraduationCap className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {isUk ? "Курсів ще немає" : "No courses yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {isUk
              ? "Додайте перший курс вручну або імпортуйте його з силабусу через AI."
              : "Add your first course manually or import it from a syllabus using AI."}
          </p>
        </div>
      </LiquidCard>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((c) => {
        const cModules = modules.filter((m) => m.courseId === c._id);
        const cTopics  = topics.filter((t)  => t.courseId === c._id);
        const cMembers = members.filter((m) => m.courseId === c._id);
        const done = cTopics.filter((t: any) => t.isCompleted).length;
        const pct  = cTopics.length > 0 ? Math.round((done / cTopics.length) * 100) : 0;
        return (
          <LiquidCard key={c._id} tint="blue" className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md" accent>
            <button type="button" onClick={() => onPickCourse(c._id!)} className="block w-full text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="liquid-pill liquid-pill--tinted text-[10px]" data-liquid-tint="blue">
                  <BookOpen className="h-3 w-3" />
                  {c.code || "—"}
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {c.credits} ECTS
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold leading-snug tracking-tight text-slate-900">{c.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{c.instructor || (isUk ? "Викладач не вказаний" : "No instructor")}</p>

              <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {cModules.length} {isUk ? "мод" : "mod"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {cTopics.length} {isUk ? "тем" : "topics"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {cMembers.length}
                </span>
              </div>

              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{semesterLabel(c, isUk)}</span>
                  <span className="font-bold tabular-nums text-slate-600">{pct}%</span>
                </div>
              </div>
            </button>
          </LiquidCard>
        );
      })}
    </div>
  );
}
