import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  Layers,
  Sparkles,
  BookMarked,
  LayoutGrid,
} from "lucide-react";
import { LiquidCard, LiquidStatTile } from "@/components/ui/liquid";
import {
  listCourses,
  listModulesForProject,
  listTopicsForProject,
  listAssessmentsForProject,
  listUpcomingAssessments,
} from "@/lib/learning";

function semesterLabel(course: { semester: number; semesterEnd?: number }, isUk: boolean) {
  const end = Math.max(course.semester, course.semesterEnd ?? course.semester);
  if (end > course.semester) return isUk ? `сем. ${course.semester}-${end}` : `sem. ${course.semester}-${end}`;
  return `${isUk ? "сем" : "sem"}. ${course.semester}`;
}

/**
 * Course-блок для item.type = "course".
 *
 * Серверний фетч courses + modules + topics + assessments → статистика
 * + список модулів + дедлайни.
 */
export async function CourseBlock({
  projectId,
  locale,
  legacyProjectId,
  wsId,
  itemId,
}: {
  projectId: string;
  locale: string;
  legacyProjectId?: string;
  wsId?: string;
  itemId?: string;
}) {
  const isUk = locale === "uk";
  if (!projectId) return <NewCourseHint locale={locale} legacyProjectId={legacyProjectId} wsId={wsId} itemId={itemId} />;

  const [courses, modules, topics, assessments, upcoming] = await Promise.all([
    listCourses(projectId).catch(() => []),
    listModulesForProject(projectId).catch(() => []),
    listTopicsForProject(projectId).catch(() => []),
    listAssessmentsForProject(projectId).catch(() => []),
    listUpcomingAssessments(projectId, 6).catch(() => []),
  ]);

  if (courses.length === 0 && modules.length === 0 && topics.length === 0) {
    return <NewCourseHint locale={locale} legacyProjectId={legacyProjectId} wsId={wsId} itemId={itemId} />;
  }

  const completedTopics = topics.filter((t) => (t as any).isCompleted).length;
  const totalEcts = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const activeCourses = courses.filter((c) => c.status === "active").length;
  const gradedAssessments = assessments.filter((a) => (a as any).achievedScore != null).length;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LiquidStatTile
          icon={<BookOpen className="h-4 w-4" />}
          label={isUk ? "Курсів" : "Courses"}
          value={`${activeCourses}/${courses.length}`}
          sub={isUk ? "активних" : "active"}
          tint="blue"
        />
        <LiquidStatTile
          icon={<Layers className="h-4 w-4" />}
          label={isUk ? "Модулі" : "Modules"}
          value={String(modules.length)}
          sub={`${topics.length} ${isUk ? "тем" : "topics"}`}
          tint="violet"
        />
        <LiquidStatTile
          icon={<CalendarCheck className="h-4 w-4" />}
          label={isUk ? "Опрацьовано" : "Completed"}
          value={`${completedTopics}/${topics.length}`}
          sub={isUk ? "тем" : "topics"}
          tint="emerald"
        />
        <LiquidStatTile
          icon={<Award className="h-4 w-4" />}
          label="ECTS"
          value={String(totalEcts)}
          sub={`${gradedAssessments} ${isUk ? "оцінок" : "graded"}`}
          tint="amber"
        />
      </section>

      {/* ── Two-column: Courses + Upcoming ────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <LiquidCard tint="blue" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-blue-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              {isUk ? "Курси" : "Courses"}
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {courses.length}
            </span>
          </div>
          {courses.length === 0 ? (
            <EmptyRow text={isUk ? "Курсів ще немає" : "No courses yet"} />
          ) : (
            <div className="divide-y divide-slate-100/70">
              {courses.slice(0, 8).map((c) => {
                const cModules = modules.filter((m) => (m as any).courseId === c._id).length;
                const cTopics = topics.filter((t) => (t as any).courseId === c._id);
                const done = cTopics.filter((t) => (t as any).isCompleted).length;
                const pct = cTopics.length > 0 ? Math.round((done / cTopics.length) * 100) : 0;
                const grade = gradeFromScore(c.finalScore);
                return (
                  <div key={c._id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {c.code && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                            {c.code}
                          </span>
                        )}
                        <p className="truncate text-sm font-bold text-slate-900">{c.title}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{c.credits} ECTS</span>
                        <span>·</span>
                        <span>{semesterLabel(c, isUk)}</span>
                        <span>·</span>
                        <span>{cModules} {isUk ? "мод" : "mod"}</span>
                        <span>·</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${gradeBadgeClass(grade)}`}>
                      {grade}
                    </div>
                  </div>
                );
              })}
              {courses.length > 8 && (
                <p className="px-4 py-2 text-center text-[10px] text-slate-400">
                  +{courses.length - 8} {isUk ? "ще" : "more"}
                </p>
              )}
            </div>
          )}
        </LiquidCard>

        <LiquidCard tint="rose" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-rose-50/60 via-white to-slate-50/60 px-5 py-3.5">
            <span className="liquid-eyebrow inline-flex items-center gap-1.5">
              <ClipboardList className="h-3 w-3" />
              {isUk ? "Дедлайни" : "Upcoming"}
            </span>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              {upcoming.length}
            </span>
          </div>
          {upcoming.length === 0 ? (
            <EmptyRow text={isUk ? "Дедлайнів немає" : "No upcoming deadlines"} />
          ) : (
            <div className="divide-y divide-slate-100/70">
              {upcoming.map((a) => {
                const daysLeft = (a as any).dueDate
                  ? Math.ceil((new Date((a as any).dueDate).getTime() - Date.now()) / (24 * 3600 * 1000))
                  : null;
                return (
                  <div key={a._id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${daysLeft != null && daysLeft < 7 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                      <ClipboardList className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{(a as any).title}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {assessmentTypeLabel((a as any).assessmentType, isUk)}
                        {(a as any).dueDate ? ` · ${(a as any).dueDate}` : ""}
                      </p>
                    </div>
                    {daysLeft != null && (
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${daysLeft < 7 ? "bg-rose-100 text-rose-700" : daysLeft < 14 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                        {daysLeft < 0 ? (isUk ? "прострочено" : "overdue") : `${daysLeft} ${isUk ? "дн" : "d"}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </LiquidCard>
      </div>

      {/* ── Nav tiles ────────────────────────────────────── */}
      {wsId && itemId && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/${locale}/app/space/${wsId}/items/${itemId}/learning`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition hover:shadow-md hover:border-blue-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <BookMarked className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-slate-800">
              {isUk ? "Журнал навчання" : "Learning Journal"}
            </span>
            <span className="text-[10px] text-slate-400">
              {isUk ? "Курси, модулі, оцінки →" : "Courses, modules, grades →"}
            </span>
          </Link>
          <Link
            href={`/${locale}/app/space/${wsId}/items/${itemId}/learning?tab=schedule`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm transition hover:shadow-md hover:border-rose-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-slate-800">
              {isUk ? "Розклад / Дедлайни" : "Schedule / Deadlines"}
            </span>
            <span className="text-[10px] text-slate-400">
              {isUk ? "Найближчі заходи →" : "Upcoming events →"}
            </span>
          </Link>
        </div>
      )}
      {!wsId && legacyProjectId && (
        <Link
          href={`/${locale}/app/project?projectId=${legacyProjectId}`}
          className="liquid-cta self-start inline-flex"
        >
          <ExternalLink className="h-4 w-4" />
          {isUk ? "Відкрити повний модуль навчання" : "Open full learning module"}
        </Link>
      )}
    </div>
  );
}

function gradeFromScore(score: number | null): string {
  if (score == null) return "—";
  if (score >= 90) return "A";
  if (score >= 82) return "B";
  if (score >= 75) return "C";
  if (score >= 64) return "D";
  if (score >= 60) return "E";
  if (score >= 35) return "FX";
  return "F";
}

function gradeBadgeClass(grade: string): string {
  if (grade === "A") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["B", "C"].includes(grade)) return "border-blue-200 bg-blue-50 text-blue-700";
  if (["D", "E"].includes(grade)) return "border-amber-200 bg-amber-50 text-amber-700";
  if (["F", "FX"].includes(grade)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-400";
}

function assessmentTypeLabel(t: string | undefined, isUk: boolean): string {
  const uk: Record<string, string> = {
    exam: "Іспит", zalik: "Залік", midterm: "Модульна КР", test: "Тест",
    colloquium: "Колоквіум", essay: "Реферат", project: "Проєкт", coursework: "Курсова",
    lab_work: "Лаб. робота", presentation: "Презентація",
  };
  const en: Record<string, string> = {
    exam: "Exam", zalik: "Pass/Fail", midterm: "Midterm", test: "Test",
    colloquium: "Colloquium", essay: "Essay", project: "Project", coursework: "Coursework",
    lab_work: "Lab work", presentation: "Presentation",
  };
  return (isUk ? uk : en)[t || ""] ?? (t || "—");
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-4 py-6 text-center text-xs text-slate-400">{text}</div>;
}

function NewCourseHint({
  locale, legacyProjectId, wsId, itemId,
}: { locale: string; legacyProjectId?: string; wsId?: string; itemId?: string }) {
  const isUk = locale === "uk";
  const href = wsId && itemId
    ? `/${locale}/app/space/${wsId}/items/${itemId}/learning`
    : legacyProjectId
      ? `/${locale}/app/project?projectId=${legacyProjectId}`
      : null;

  return (
    <LiquidCard tint="blue" className="text-center" accent>
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
        <GraduationCap className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">
        {isUk ? "Налаштуйте навчальний курс" : "Set up your course"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
        {isUk
          ? "Структура: модулі → теми (лекції, семінари, практичні) → оцінювання. ECTS, прогрес, оцінки."
          : "Structure: modules → topics (lectures, seminars, labs) → assessments. ECTS, progress, grades."}
      </p>
      {href && (
        <Link href={href} className="liquid-cta mt-4 inline-flex">
          <BookMarked className="h-4 w-4" />
          {isUk ? "Відкрити журнал навчання" : "Open learning journal"}
        </Link>
      )}
      <p className="mt-3 text-[10px] text-slate-400">
        <Sparkles className="mr-1 inline h-3 w-3" />
        {isUk ? "Курси, модулі, теми, оцінювання" : "Courses, modules, topics, grading"}
      </p>
    </LiquidCard>
  );
}
