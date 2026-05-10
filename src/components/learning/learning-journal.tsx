"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Calendar, Plus, ChevronRight, ChevronDown,
  Users, Settings, Layers, FileText, Clock, Award, Trash2, X,
  TrendingUp, AlertCircle, CheckCircle2, Check,
  BookOpen, GraduationCap, ClipboardList, Edit3, BookMarked, Wand2,
} from "lucide-react";
import clsx from "clsx";
import type {
  LearningCourse, LearningModule, LearningTopic, LearningAssessment,
  LearningSession, LearningAssignment,
  CourseType, CourseStatus, TopicType, AssessmentType, AssessmentStatus,
} from "@/lib/schemas";
import { scoreToGrade, gradeColor } from "@/lib/learning-utils";
import { ScheduleTab } from "@/components/learning/schedule-tab";
import { AssignmentsPanel } from "@/components/learning/assignments-panel";
import { LearningCalendar } from "@/components/learning/learning-calendar";
import {
  addCourse, saveCourse, removeCourse,
  addModule, saveModule, removeModule,
  addTopic, saveTopic, removeTopic,
  addAssessment, saveAssessment, removeAssessment,
  generateTopicsFromLectures,
} from "@/app/learning-actions";
import { creditFromLearning } from "@/app/phd-plan-actions";

// ── Label maps ────────────────────────────────────────────────────────────────

const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  mandatory: "Обов'язковий", elective: "За вибором", optional: "Вільний вибір",
  language: "Мовний", physical: "Фізична культура", practice: "Практика", research: "Наукова робота",
};

const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  planned: "Заплановано", active: "Активний", completed: "Завершено",
  failed: "Не зараховано", withdrawn: "Відраховано",
};

const COURSE_STATUS_COLORS: Record<CourseStatus, string> = {
  planned: "bg-slate-100 text-slate-600 border-slate-200",
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-rose-100 text-rose-700 border-rose-200",
  withdrawn: "bg-slate-100 text-slate-400 border-slate-200",
};

const TOPIC_TYPE_LABELS: Record<TopicType, string> = {
  lecture: "Лекція", seminar: "Семінар", practical: "Практична", lab: "Лабораторна",
  self_study: "Самостійна", consultation: "Консультація",
};

const TOPIC_TYPE_COLORS: Record<TopicType, string> = {
  lecture: "bg-indigo-100 text-indigo-700",
  seminar: "bg-purple-100 text-purple-700",
  practical: "bg-amber-100 text-amber-700",
  lab: "bg-emerald-100 text-emerald-700",
  self_study: "bg-slate-100 text-slate-600",
  consultation: "bg-sky-100 text-sky-700",
};

const TOPIC_LEFT_BORDER: Record<TopicType, string> = {
  lecture: "border-l-indigo-400",
  seminar: "border-l-purple-400",
  practical: "border-l-amber-400",
  lab: "border-l-emerald-400",
  self_study: "border-l-slate-300",
  consultation: "border-l-sky-400",
};

const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  exam: "Іспит", zalik: "Залік", midterm: "Модульна КР", test: "Тест",
  colloquium: "Колоквіум", seminar: "Семінарська", practical_work: "Практична",
  essay: "Реферат", project: "Проєкт", coursework: "Курсова",
  lab_work: "Лаб. робота", notes_check: "Конспект", oral: "Усна відповідь",
  presentation: "Презентація", other: "Інше",
};

const ASSESSMENT_TYPE_BADGE: Record<AssessmentType, string> = {
  exam: "bg-rose-100 text-rose-700 border-rose-200",
  zalik: "bg-pink-100 text-pink-700 border-pink-200",
  midterm: "bg-orange-100 text-orange-700 border-orange-200",
  test: "bg-amber-100 text-amber-700 border-amber-200",
  colloquium: "bg-purple-100 text-purple-700 border-purple-200",
  seminar: "bg-indigo-100 text-indigo-700 border-indigo-200",
  practical_work: "bg-emerald-100 text-emerald-700 border-emerald-200",
  essay: "bg-sky-100 text-sky-700 border-sky-200",
  project: "bg-violet-100 text-violet-700 border-violet-200",
  coursework: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  lab_work: "bg-teal-100 text-teal-700 border-teal-200",
  notes_check: "bg-slate-100 text-slate-600 border-slate-200",
  oral: "bg-blue-100 text-blue-700 border-blue-200",
  presentation: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-slate-100 text-slate-500 border-slate-200",
};

const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  upcoming: "Майбутній", in_progress: "Виконується", completed: "Завершено",
  missed: "Пропущено", retake_needed: "Перескладання", passed_retake: "Перескладано",
};

const ASSESSMENT_STATUS_COLORS: Record<AssessmentStatus, string> = {
  upcoming: "text-blue-600 bg-blue-50 border-blue-200",
  in_progress: "text-amber-600 bg-amber-50 border-amber-200",
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  missed: "text-rose-600 bg-rose-50 border-rose-200",
  retake_needed: "text-orange-600 bg-orange-50 border-orange-200",
  passed_retake: "text-indigo-600 bg-indigo-50 border-indigo-200",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtShort(s: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
}

function courseProgress(course: LearningCourse, topics: LearningTopic[]): number {
  const t = topics.filter((t) => t.courseId === course._id);
  if (!t.length) return 0;
  return Math.round((t.filter((t) => t.isCompleted).length / t.length) * 100);
}

function courseWeightedScore(course: LearningCourse, assessments: LearningAssessment[]): number | null {
  if (course.finalScore !== null) return course.finalScore;
  const graded = assessments.filter((a) => a.courseId === course._id && a.achievedScore !== null && a.maxScore > 0);
  if (!graded.length) return null;
  const totalWeight = graded.reduce((s, a) => s + a.weight, 0);
  if (totalWeight > 0)
    return Math.round(graded.reduce((s, a) => s + ((a.achievedScore! / a.maxScore) * 100 * a.weight), 0) / totalWeight);
  return Math.round(graded.reduce((s, a) => s + (a.achievedScore! / a.maxScore) * 100, 0) / graded.length);
}

// ── Atoms ─────────────────────────────────────────────────────────────────────

function ScoreBadge({ score, max = 100 }: { score: number | null; max?: number }) {
  if (score === null) return <span className="text-xs text-slate-300">—</span>;
  const grade = scoreToGrade((score / max) * 100);
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold", gradeColor(grade))}>
      {score}/{max} <span className="font-black">{grade}</span>
    </span>
  );
}

function InlineScore({ value, max, onSave, disabled }: {
  value: number | null; max: number; onSave: (v: number | null) => void; disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value !== null ? String(value) : "");

  if (!editing) {
    return (
      <button type="button"
        onClick={() => { setEditing(true); setVal(value !== null ? String(value) : ""); }}
        disabled={disabled}
        className={clsx(
          "min-w-[52px] rounded-lg border px-2 py-1 text-center text-xs font-bold transition hover:shadow-sm",
          value !== null
            ? gradeColor(scoreToGrade((value / max) * 100))
            : "border-dashed border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500"
        )}>
        {value !== null ? value : "—"}
      </button>
    );
  }
  return (
    <input autoFocus type="number" min={0} max={max} value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        onSave(val === "" ? null : Math.min(max, Math.max(0, Number(val))));
        setEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") { setEditing(false); setVal(value !== null ? String(value) : ""); }
      }}
      className="w-16 rounded-lg border-2 border-indigo-400 px-1.5 py-0.5 text-center text-xs font-bold text-indigo-700 focus:outline-none" />
  );
}

// ── Add Course Modal ──────────────────────────────────────────────────────────

const COURSE_TYPE_ICONS: Record<CourseType, string> = {
  mandatory: "📚", elective: "🎯", optional: "✨",
  language: "🌐", physical: "🏃", practice: "🔬", research: "🔭",
};

function AddCourseModal({ projectId, locale, semesterHint, onClose }: {
  projectId: string; locale: string; semesterHint: number; onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [selectedType, setSelectedType] = useState<CourseType>("mandatory");

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}>
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <BookOpen className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Новий курс</h3>
              <p className="text-xs text-slate-400">Навчальна дисципліна</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          action={(fd) => { fd.set("courseType", selectedType); start(async () => { await addCourse(fd); onClose(); }); }}
          className="space-y-4 px-6 py-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Назва курсу *</label>
            <input name="title" required autoFocus className="input-control w-full text-base font-medium"
              placeholder="Молекулярна біологія…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Код</label>
              <input name="code" className="input-control w-full font-mono" placeholder="BIO401" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Викладач</label>
              <input name="instructor" className="input-control w-full" placeholder="Прізвище І.І." />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Семестр</label>
              <input name="semester" type="number" min={1} max={12} defaultValue={semesterHint} className="input-control w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Кредити (ECTS)</label>
              <input name="credits" type="number" min={0} max={30} defaultValue={3} className="input-control w-full" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Тип дисципліни</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(COURSE_TYPE_LABELS) as CourseType[]).map((t) => (
                <button key={t} type="button" onClick={() => setSelectedType(t)}
                  className={clsx(
                    "flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center text-[11px] transition",
                    selectedType === t ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  )}>
                  <span className="text-base">{COURSE_TYPE_ICONS[t]}</span>
                  <span className="font-medium leading-tight">{COURSE_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="control px-4 py-2 text-sm">Скасувати</button>
            <button type="submit" disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
              {pending ? "…" : <><Plus className="h-4 w-4" />Додати курс</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Sidebar course item ───────────────────────────────────────────────────────

function CourseItem({ course, topics, assessments, isActive, onClick }: {
  course: LearningCourse; topics: LearningTopic[]; assessments: LearningAssessment[];
  isActive: boolean; onClick: () => void;
}) {
  const pct = courseProgress(course, topics);
  const score = courseWeightedScore(course, assessments);
  const grade = scoreToGrade(score);

  return (
    <button type="button" onClick={onClick}
      className={clsx(
        "group w-full rounded-lg px-3 py-2.5 text-left transition-all",
        isActive
          ? "border-l-[3px] border-l-indigo-500 border border-slate-200 bg-white shadow-sm"
          : "hover:bg-white/80 hover:shadow-sm"
      )}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {course.code && <p className="font-mono text-[10px] text-slate-400 leading-none mb-0.5">{course.code}</p>}
          <p className={clsx("text-sm font-semibold leading-snug truncate",
            isActive ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800")}>
            {course.title}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{course.credits} кр. · Сем.{course.semester}</p>
        </div>
        {score !== null && (
          <span className={clsx(
            "flex-shrink-0 mt-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-black",
            score >= 90 ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
            score >= 75 ? "border-blue-200 bg-blue-50 text-blue-700" :
            score >= 60 ? "border-amber-200 bg-amber-50 text-amber-700" :
            "border-rose-200 bg-rose-50 text-rose-700"
          )}>{grade}</span>
        )}
      </div>
      {pct > 0 && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
          <div className={clsx("h-full rounded-full transition-all duration-700",
            pct === 100 ? "bg-emerald-500" : isActive ? "bg-indigo-500" : "bg-slate-400")}
            style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  );
}

// ── Add Module ────────────────────────────────────────────────────────────────

function AddModuleRow({ projectId, locale, courseId, orderIndex, onDone }: {
  projectId: string; locale: string; courseId: string; orderIndex: number; onDone: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3">
      <form action={(fd) => { start(async () => { await addModule(fd); onDone(); }); }}
        className="flex flex-1 items-center gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="orderIndex" value={orderIndex} />
        <Layers className="h-4 w-4 flex-shrink-0 text-indigo-400" />
        <input name="title" required autoFocus
          className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Назва модуля…" />
        <button type="submit" disabled={pending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {pending ? "…" : "Додати"}
        </button>
      </form>
      <button type="button" onClick={onDone}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ── Add Topic ─────────────────────────────────────────────────────────────────

function AddTopicRow({ projectId, locale, courseId, moduleId, orderIndex, onDone }: {
  projectId: string; locale: string; courseId: string; moduleId: string; orderIndex: number; onDone: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
      <form action={(fd) => { start(async () => { await addTopic(fd); onDone(); }); }}
        className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="moduleId" value={moduleId} />
        <input type="hidden" name="orderIndex" value={orderIndex} />
        <select name="topicType"
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {(Object.keys(TOPIC_TYPE_LABELS) as TopicType[]).map((t) => (
            <option key={t} value={t}>{TOPIC_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <input name="title" required autoFocus maxLength={300}
          className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Назва теми…" />
        <input name="durationHours" type="number" min={0} max={100} defaultValue={2}
          className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <span className="text-xs text-slate-400">год</span>
        <button type="submit" disabled={pending}
          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {pending ? "…" : "+"}
        </button>
      </form>
      <button type="button" onClick={onDone}
        className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-600">
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ── Topic row ─────────────────────────────────────────────────────────────────

function TopicRow({ topic, projectId, locale, canManage, linkedAssessments }: {
  topic: LearningTopic; projectId: string; locale: string; canManage: boolean;
  linkedAssessments: LearningAssessment[];
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [pending, start] = useTransition();

  const toggleComplete = () => {
    const fd = new FormData();
    fd.set("locale", locale); fd.set("projectId", projectId);
    fd.set("topicId", topic._id ?? ""); fd.set("title", topic.title);
    fd.set("description", topic.description); fd.set("topicType", topic.topicType);
    fd.set("durationHours", String(topic.durationHours));
    fd.set("isCompleted", topic.isCompleted ? "false" : "true");
    fd.set("notes", topic.notes);
    start(async () => { await saveTopic(fd); });
  };

  return (
    <div className={clsx(
      "group rounded-lg border-l-4 border border-slate-100 bg-white transition-all",
      TOPIC_LEFT_BORDER[topic.topicType],
      topic.isCompleted && "opacity-60"
    )}>
      <div className="flex items-center gap-2.5 px-3 py-2">
        <button type="button" onClick={canManage ? toggleComplete : undefined} disabled={pending}
          className={clsx(
            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition",
            topic.isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"
          )}>
          {topic.isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>

        <span className={clsx("flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", TOPIC_TYPE_COLORS[topic.topicType])}>
          {TOPIC_TYPE_LABELS[topic.topicType].slice(0, 4)}
        </span>

        <span className={clsx("flex-1 text-sm min-w-0 truncate",
          topic.isCompleted ? "text-slate-400 line-through" : "font-medium text-slate-800")}>
          {topic.title}
        </span>

        {topic.linkedLectureId && (
          <span className="flex-shrink-0 flex items-center gap-0.5 rounded bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-500"
            title="Автоматично прив'язано до лекції">
            <Wand2 className="h-2.5 w-2.5" />л
          </span>
        )}

        {topic.durationHours > 0 && (
          <span className="flex-shrink-0 flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            <Clock className="h-2.5 w-2.5" />{topic.durationHours}г
          </span>
        )}

        {linkedAssessments.length > 0 && (
          <div className="hidden sm:flex gap-1">
            {linkedAssessments.map((a) => (
              <span key={a._id} className={clsx("rounded border px-1 py-0.5 text-[9px] font-semibold", ASSESSMENT_TYPE_BADGE[a.assessmentType])}>
                {ASSESSMENT_TYPE_LABELS[a.assessmentType].slice(0, 3)}
              </span>
            ))}
          </div>
        )}

        {canManage && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
            <button type="button" onClick={() => setShowEdit((v) => !v)}
              className={clsx("rounded p-1 transition",
                showEdit ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-indigo-50 hover:text-indigo-600")}>
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <form action={async (fd) => { start(() => removeTopic(fd)); }}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="topicId" value={topic._id ?? ""} />
              <button type="submit" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-indigo-50 bg-slate-50/60 px-4 pb-4 pt-3">
              <form action={async (fd) => { start(async () => { await saveTopic(fd); setShowEdit(false); }); }}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="topicId" value={topic._id ?? ""} />
                <input type="hidden" name="isCompleted" value={String(topic.isCompleted)} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Назва</label>
                    <input name="title" defaultValue={topic.title} maxLength={300}
                      className="input-control w-full py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Тип</label>
                    <select name="topicType" defaultValue={topic.topicType} className="input-control w-full py-1.5 text-xs">
                      {(Object.keys(TOPIC_TYPE_LABELS) as TopicType[]).map((t) => (
                        <option key={t} value={t}>{TOPIC_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Годин</label>
                    <input name="durationHours" type="number" min={0} max={100} step={0.5}
                      defaultValue={topic.durationHours} className="input-control w-full py-1.5 text-sm" />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Опис</label>
                    <input name="description" defaultValue={topic.description}
                      placeholder="Короткий опис теми" className="input-control w-full py-1.5 text-xs" />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Конспект / нотатки</label>
                    <textarea name="notes" rows={3} defaultValue={topic.notes}
                      placeholder="Нотатки, посилання, конспект…"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none transition" />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowEdit(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition">
                    Скасувати
                  </button>
                  <button type="submit" disabled={pending}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60">
                    <Check className="h-3 w-3" />Зберегти
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Module card ───────────────────────────────────────────────────────────────

function ModuleCard({ mod, topics, assessments, projectId, locale, canManage }: {
  mod: LearningModule; topics: LearningTopic[]; assessments: LearningAssessment[];
  projectId: string; locale: string; canManage: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [editMod, setEditMod] = useState(false);
  const [modTitle, setModTitle] = useState(mod.title);
  const [modDesc, setModDesc] = useState(mod.description);
  const [addingTopic, setAddingTopic] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const modTopics = topics.filter((t) => t.moduleId === mod._id);
  const modAssessments = assessments.filter((a) => a.linkedModuleIds.includes(mod._id ?? ""));
  const done = modTopics.filter((t) => t.isCompleted).length;
  const pct = modTopics.length ? Math.round((done / modTopics.length) * 100) : 0;
  const totalHours = modTopics.reduce((s, t) => s + (t.durationHours || 0), 0);
  const hasLectures = modTopics.some((t) => t.topicType === "lecture");

  function handleGenerate(topicType: "seminar" | "practical" | "lab") {
    setGenerateOpen(false);
    setGenerateStatus(null);
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", mod.courseId);
    fd.set("moduleId", mod._id ?? "");
    fd.set("topicType", topicType);
    start(async () => {
      const res = await generateTopicsFromLectures(fd);
      if (res?.ok) {
        setGenerateStatus(res.count > 0 ? `✓ Створено: ${res.count}` : "Всі вже є");
      } else {
        setGenerateStatus("Помилка");
      }
      setTimeout(() => setGenerateStatus(null), 3000);
    });
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {editMod ? (
        /* ── Inline module edit form ── */
        <form
          className="flex items-start gap-2 px-4 py-3"
          action={(fd) => {
            fd.set("locale", locale); fd.set("projectId", projectId);
            fd.set("moduleId", mod._id ?? "");
            fd.set("isCompleted", String(mod.isCompleted));
            start(async () => { await saveModule(fd); setEditMod(false); });
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 space-y-2">
            <input name="title" value={modTitle} onChange={(e) => setModTitle(e.target.value)}
              className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input name="description" value={modDesc} onChange={(e) => setModDesc(e.target.value)}
              placeholder="Опис модуля (необов'язково)"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex shrink-0 gap-1 pt-0.5">
            <button type="submit" disabled={pending}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => { setEditMod(false); setModTitle(mod.title); setModDesc(mod.description); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex cursor-pointer select-none items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
          onClick={() => setOpen((v) => !v)}>
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">{mod.title}</span>
              {mod.isCompleted && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <Check className="h-2.5 w-2.5" />завершено
                </span>
              )}
              {totalHours > 0 && <span className="text-[11px] text-slate-400">{totalHours}г</span>}
            </div>
            {modTopics.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={clsx("h-full rounded-full transition-all duration-500",
                    pct === 100 ? "bg-emerald-500" : "bg-indigo-400")} style={{ width: `${pct}%` }} />
                </div>
                <span className="flex-shrink-0 text-[11px] text-slate-400">{done}/{modTopics.length}</span>
              </div>
            )}
          </div>
          {modAssessments.length > 0 && (
            <div className="hidden sm:flex flex-shrink-0 gap-1">
              {modAssessments.slice(0, 2).map((a) => (
                <span key={a._id} className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-semibold", ASSESSMENT_TYPE_BADGE[a.assessmentType])}>
                  {ASSESSMENT_TYPE_LABELS[a.assessmentType]}
                </span>
              ))}
            </div>
          )}
          {canManage && (
            <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => { setEditMod(true); setModTitle(mod.title); setModDesc(mod.description); }}
                className="rounded p-1 text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <form action={(fd) => { start(() => removeModule(fd)); }}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="moduleId" value={mod._id ?? ""} />
                <button type="submit"
                  className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
            <div className="border-t border-slate-100 px-4 py-3 space-y-1.5">
              {modTopics.length === 0 && !addingTopic && (
                <p className="py-1 text-xs italic text-slate-400">Теми ще не додані</p>
              )}
              {modTopics.map((topic) => (
                <TopicRow key={topic._id} topic={topic} projectId={projectId} locale={locale} canManage={canManage}
                  linkedAssessments={assessments.filter((a) => a.linkedTopicIds.includes(topic._id ?? ""))} />
              ))}
              {addingTopic && (
                <AddTopicRow projectId={projectId} locale={locale}
                  courseId={mod.courseId} moduleId={mod._id ?? ""}
                  orderIndex={modTopics.length} onDone={() => setAddingTopic(false)} />
              )}
              {canManage && !addingTopic && (
                <div className="ml-7 flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={() => setAddingTopic(true)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600">
                    <Plus className="h-3 w-3" /> Додати тему
                  </button>

                  {hasLectures && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setGenerateOpen((v) => !v)}
                        disabled={pending}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-violet-500 transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                      >
                        <Wand2 className="h-3 w-3" />
                        Згенерувати…
                        <ChevronDown className="h-2.5 w-2.5" />
                      </button>

                      {generateOpen && (
                        <div className="absolute bottom-full left-0 mb-1 z-10 flex flex-col overflow-hidden rounded-xl border border-violet-100 bg-white shadow-lg">
                          {(["seminar", "practical", "lab"] as const).map((type) => {
                            const labels: Record<string, string> = {
                              seminar: "Семінари",
                              practical: "Практичні",
                              lab: "Лабораторні",
                            };
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleGenerate(type)}
                                className="px-4 py-2 text-left text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
                              >
                                {labels[type]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {generateStatus && (
                    <span className="text-xs text-violet-600 font-medium">{generateStatus}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Assessment modal ──────────────────────────────────────────────────────────

function AssessmentModal({ projectId, locale, courseId, modules, topics, assessment, onClose }: {
  projectId: string; locale: string; courseId: string;
  modules: LearningModule[]; topics: LearningTopic[];
  assessment: LearningAssessment | null; onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(assessment?.linkedTopicIds ?? []);
  const [selectedModules, setSelectedModules] = useState<string[]>(assessment?.linkedModuleIds ?? []);
  const isEdit = !!assessment;

  const toggleTopic = (id: string) =>
    setSelectedTopics((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleModule = (id: string) =>
    setSelectedModules((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const action = isEdit ? saveAssessment : addAssessment;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 24 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}>
        <div className="h-1 bg-gradient-to-r from-rose-400 to-orange-400" />
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              <Award className="h-4 w-4 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{isEdit ? "Редагування" : "Новий контрольний захід"}</h3>
              <p className="text-xs text-slate-400">Іспит, залік, контрольна, реферат…</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          action={(fd) => {
            fd.set("linkedTopicIds", selectedTopics.join(","));
            fd.set("linkedModuleIds", selectedModules.join(","));
            start(async () => { await action(fd); onClose(); });
          }}
          className="space-y-4 px-6 py-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="courseId" value={courseId} />
          {isEdit && <input type="hidden" name="assessmentId" value={assessment._id ?? ""} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Назва *</label>
              <input name="title" required defaultValue={assessment?.title ?? ""}
                className="input-control w-full text-base font-medium" placeholder="Модульна контрольна №1…" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Тип</label>
              <select name="assessmentType" defaultValue={assessment?.assessmentType ?? "test"} className="input-control w-full">
                {(Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]).map((t) => (
                  <option key={t} value={t}>{ASSESSMENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Статус</label>
              <select name="status" defaultValue={assessment?.status ?? "upcoming"} className="input-control w-full">
                {(Object.keys(ASSESSMENT_STATUS_LABELS) as AssessmentStatus[]).map((s) => (
                  <option key={s} value={s}>{ASSESSMENT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Термін</label>
              <input name="dueDate" type="date" defaultValue={assessment?.dueDate ?? ""} className="input-control w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Дата виконання</label>
              <input name="completedDate" type="date" defaultValue={assessment?.completedDate ?? ""} className="input-control w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Макс. балів</label>
              <input name="maxScore" type="number" min={0} max={1000} defaultValue={assessment?.maxScore ?? 100} className="input-control w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Отримано балів</label>
              <input name="achievedScore" type="number" min={0} max={1000}
                defaultValue={assessment?.achievedScore ?? ""} className="input-control w-full" placeholder="—" />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Вага у підсумку, %</label>
              <input name="weight" type="number" min={0} max={100} defaultValue={assessment?.weight ?? 0} className="input-control w-full" />
            </div>
          </div>

          {modules.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Охоплені модулі</label>
              <div className="flex flex-wrap gap-2">
                {modules.map((m) => (
                  <button key={m._id} type="button" onClick={() => toggleModule(m._id ?? "")}
                    className={clsx(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      selectedModules.includes(m._id ?? "")
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}>
                    {selectedModules.includes(m._id ?? "") && <Check className="mr-1 inline h-3 w-3" />}
                    {m.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {topics.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Охоплені теми</label>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-3 space-y-1">
                {modules.map((m) => {
                  const mTopics = topics.filter((t) => t.moduleId === m._id);
                  if (!mTopics.length) return null;
                  return (
                    <div key={m._id}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.title}</p>
                      {mTopics.map((t) => (
                        <label key={t._id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 text-xs">
                          <div className={clsx(
                            "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition",
                            selectedTopics.includes(t._id ?? "") ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                          )}>
                            {selectedTopics.includes(t._id ?? "") && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-semibold", TOPIC_TYPE_COLORS[t.topicType])}>
                            {TOPIC_TYPE_LABELS[t.topicType].slice(0, 3)}
                          </span>
                          <span className="flex-1 truncate text-slate-700">{t.title}</span>
                          <input type="checkbox" className="sr-only" checked={selectedTopics.includes(t._id ?? "")}
                            onChange={() => toggleTopic(t._id ?? "")} />
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Нотатки</label>
            <textarea name="notes" rows={2} defaultValue={assessment?.notes ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white resize-none transition" />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="control px-4 py-2 text-sm">Скасувати</button>
            <button type="submit" disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
              {pending ? "Збереження…" : isEdit ? <><Check className="h-4 w-4" />Зберегти</> : <><Plus className="h-4 w-4" />Додати</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Grade Book ────────────────────────────────────────────────────────────────

function GradeBookRow({ assessment, projectId, locale, canManage, onEdit }: {
  assessment: LearningAssessment; projectId: string; locale: string;
  canManage: boolean; onEdit: (a: LearningAssessment) => void;
}) {
  const [pending, start] = useTransition();
  const pct = assessment.achievedScore !== null ? (assessment.achievedScore / assessment.maxScore) * 100 : null;
  const grade = pct !== null ? scoreToGrade(pct) : null;
  const daysLeft = assessment.dueDate
    ? Math.ceil((new Date(assessment.dueDate).getTime() - Date.now()) / 86400000) : null;

  const saveScore = (score: number | null) => {
    const fd = new FormData();
    fd.set("locale", locale); fd.set("projectId", projectId);
    fd.set("assessmentId", assessment._id ?? "");
    fd.set("courseId", assessment.courseId);
    fd.set("title", assessment.title);
    fd.set("assessmentType", assessment.assessmentType);
    fd.set("status", assessment.status);
    fd.set("dueDate", assessment.dueDate ?? "");
    fd.set("completedDate", assessment.completedDate ?? "");
    fd.set("maxScore", String(assessment.maxScore));
    fd.set("achievedScore", score !== null ? String(score) : "");
    fd.set("weight", String(assessment.weight));
    fd.set("notes", assessment.notes ?? "");
    fd.set("linkedTopicIds", (assessment.linkedTopicIds ?? []).join(","));
    fd.set("linkedModuleIds", (assessment.linkedModuleIds ?? []).join(","));
    start(() => saveAssessment(fd));
  };

  return (
    <tr className="group border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="py-2.5 pl-4 pr-2">
        <span className={clsx("inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none", ASSESSMENT_TYPE_BADGE[assessment.assessmentType])}>
          {ASSESSMENT_TYPE_LABELS[assessment.assessmentType]}
        </span>
      </td>
      <td className="px-2 py-2.5 max-w-[200px]">
        <p className="text-sm font-medium text-slate-800 truncate">{assessment.title}</p>
        {assessment.notes && (
          <p className="mt-0.5 text-[11px] text-slate-400 truncate">{assessment.notes}</p>
        )}
      </td>
      <td className="px-2 py-2.5 text-xs text-slate-500 whitespace-nowrap">
        {assessment.dueDate ? (
          <span>
            {fmtShort(assessment.dueDate)}
            {daysLeft !== null && assessment.status === "upcoming" && (
              <span className={clsx("ml-1.5 rounded px-1 py-0.5 text-[10px] font-semibold",
                daysLeft <= 0 ? "bg-rose-100 text-rose-600" :
                daysLeft <= 7 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>
                {daysLeft > 0 ? `${daysLeft}д` : "!"}
              </span>
            )}
          </span>
        ) : "—"}
      </td>
      <td className="px-2 py-2.5 text-center text-xs font-medium text-slate-500">
        {assessment.weight > 0 ? `${assessment.weight}%` : "—"}
      </td>
      <td className="px-2 py-2.5">
        <span className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-semibold", ASSESSMENT_STATUS_COLORS[assessment.status])}>
          {ASSESSMENT_STATUS_LABELS[assessment.status]}
        </span>
      </td>
      <td className="px-2 py-2.5 text-center">
        <InlineScore value={assessment.achievedScore} max={assessment.maxScore}
          onSave={saveScore} disabled={!canManage || pending} />
      </td>
      <td className="px-2 py-2.5 text-center">
        {grade ? (
          <span className={clsx("rounded-lg border px-2 py-0.5 text-xs font-black", gradeColor(grade))}>{grade}</span>
        ) : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="py-2.5 pl-2 pr-4">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          {canManage && (
            <>
              <button type="button" onClick={() => onEdit(assessment)}
                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <Edit3 className="h-3 w-3" />
              </button>
              <form action={(fd) => { start(() => removeAssessment(fd)); }}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="assessmentId" value={assessment._id ?? ""} />
                <button type="submit"
                  className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
                  <X className="h-3 w-3" />
                </button>
              </form>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function GradeBook({ assessments, projectId, locale, canManage, onAdd, onEdit }: {
  assessments: LearningAssessment[];
  projectId: string; locale: string; canManage: boolean;
  onAdd: () => void; onEdit: (a: LearningAssessment) => void;
}) {
  const graded = assessments.filter((a) => a.achievedScore !== null && a.maxScore > 0);
  const weighted = graded.filter((a) => a.weight > 0);
  const totalWeight = weighted.reduce((s, a) => s + a.weight, 0);
  const weightedScore = totalWeight > 0
    ? Math.round(weighted.reduce((s, a) => s + ((a.achievedScore! / a.maxScore) * 100 * a.weight), 0) / totalWeight)
    : graded.length > 0
      ? Math.round(graded.reduce((s, a) => s + (a.achievedScore! / a.maxScore) * 100, 0) / graded.length)
      : null;
  const finalGrade = weightedScore !== null ? scoreToGrade(weightedScore) : null;

  if (assessments.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
            <Award className="h-5 w-5 text-rose-400" />
          </div>
          <p className="font-semibold text-slate-600">Немає контрольних заходів</p>
          <p className="mt-1 text-sm text-slate-400">Іспити, заліки, контрольні, реферати</p>
        </div>
        {canManage && (
          <button type="button" onClick={onAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition">
            <Plus className="h-4 w-4" /> Додати контрольний захід
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2.5 pl-4 pr-2 text-left">Тип</th>
              <th className="px-2 py-2.5 text-left">Назва</th>
              <th className="px-2 py-2.5 text-left">Термін</th>
              <th className="px-2 py-2.5 text-center">Вага</th>
              <th className="px-2 py-2.5 text-left">Статус</th>
              <th className="px-2 py-2.5 text-center">Бал</th>
              <th className="px-2 py-2.5 text-center">Оцінка</th>
              <th className="py-2.5 pl-2 pr-4 w-16" />
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <GradeBookRow key={a._id} assessment={a}
                projectId={projectId} locale={locale}
                canManage={canManage} onEdit={onEdit} />
            ))}
          </tbody>
          {finalGrade && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={4} className="py-3 pl-4 pr-2 text-xs font-bold text-slate-500">
                  Підсумкова оцінка {totalWeight > 0 ? `· зважена (${totalWeight}%)` : "· середня"}
                </td>
                <td />
                <td className="px-2 py-3 text-center">
                  <span className={clsx("rounded-lg border px-3 py-1 text-sm font-black", gradeColor(finalGrade))}>
                    {weightedScore}/100
                  </span>
                </td>
                <td className="px-2 py-3 text-center">
                  <span className={clsx("rounded-lg border px-3 py-1 text-sm font-black", gradeColor(finalGrade))}>
                    {finalGrade}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {canManage && (
        <button type="button" onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition">
          <Plus className="h-4 w-4" /> Додати контрольний захід
        </button>
      )}
    </div>
  );
}

// ── Course view ───────────────────────────────────────────────────────────────

const COURSE_TABS = [
  { id: "modules",     label: "Модулі",    icon: Layers },
  { id: "assessments", label: "Оцінки",    icon: Award },
  { id: "schedule",    label: "Розклад",   icon: Clock },
  { id: "assignments", label: "Завдання",  icon: ClipboardList },
  { id: "settings",    label: "Параметри", icon: Settings },
] as const;

type CourseTab = typeof COURSE_TABS[number]["id"];

function CourseView({ course, modules, topics, assessments, sessions, assignments, projectId, locale, canManage, isDissertation }: {
  course: LearningCourse; modules: LearningModule[]; topics: LearningTopic[];
  assessments: LearningAssessment[]; sessions: LearningSession[]; assignments: LearningAssignment[];
  projectId: string; locale: string; canManage: boolean; isDissertation?: boolean;
}) {
  const [tab, setTab] = useState<CourseTab>("modules");
  const [addingModule, setAddingModule] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [editAssessment, setEditAssessment] = useState<LearningAssessment | null>(null);
  const [creditStatus, setCreditStatus] = useState<"idle" | "pending" | "done">("idle");
  const [pending, start] = useTransition();

  const courseMods = modules.filter((m) => m.courseId === course._id);
  const courseAssessments = assessments.filter((a) => a.courseId === course._id);
  const courseTopics = topics.filter((t) => t.courseId === course._id);
  const pct = courseProgress(course, topics);
  const score = courseWeightedScore(course, assessments);
  const grade = scoreToGrade(score);

  return (
    <div className="space-y-4">
      {/* Course header */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-l-4 border-indigo-500 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {course.code && <p className="font-mono text-xs text-slate-400 mb-0.5">{course.code}</p>}
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{course.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {course.instructor && (
                  <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Users className="h-3.5 w-3.5 text-slate-400" />{course.instructor}
                  </span>
                )}
                <span className={clsx("rounded-full border px-2 py-0.5 text-[11px] font-semibold", COURSE_STATUS_COLORS[course.status])}>
                  {COURSE_STATUS_LABELS[course.status]}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {course.credits} ECTS
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Сем. {course.semester}
                </span>

                {isDissertation && course.status === "completed" && (
                  <button
                    type="button"
                    disabled={creditStatus !== "idle"}
                    onClick={() => {
                      setCreditStatus("pending");
                      const fd = new FormData();
                      fd.set("locale", locale);
                      fd.set("projectId", projectId);
                      fd.set("title", course.title);
                      fd.set("credits", String(course.credits));
                      fd.set("studyYear", String(course.year ?? 1));
                      start(async () => {
                        await creditFromLearning(fd);
                        setCreditStatus("done");
                      });
                    }}
                    className={clsx(
                      "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition",
                      creditStatus === "done"
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-60",
                    )}
                  >
                    {creditStatus === "done" ? (
                      <><CheckCircle2 className="h-3 w-3" /> Зараховано до ІНД. ПЛАНУ</>
                    ) : creditStatus === "pending" ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    ) : (
                      <><Award className="h-3 w-3" /> Зарахувати до ІНД. ПЛАНУ</>
                    )}
                  </button>
                )}
              </div>
            </div>
            {score !== null && (
              <div className="flex-shrink-0 flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                <span className={clsx("text-2xl font-black", gradeColor(grade).split(" ")[0])}>{grade}</span>
                <span className="text-xs text-slate-500">{score}/100</span>
              </div>
            )}
          </div>
          {courseTopics.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{courseTopics.filter((t) => t.isCompleted).length}/{courseTopics.length} тем завершено</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className={clsx("h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }} />
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto border-t border-slate-100">
          {COURSE_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id;
            let count: number | null = null;
            if (id === "assessments") count = courseAssessments.length;
            if (id === "schedule")    count = sessions.filter((s) => s.courseId === course._id).length;
            if (id === "assignments") count = assignments.filter((a) => a.courseId === course._id).length;
            return (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={clsx(
                  "relative flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition",
                  isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
                )}>
                {isActive && (
                  <motion.div layoutId="course-tab-line"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{label}</span>
                {count !== null && count > 0 && (
                  <span className={clsx("relative rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    isActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

          {tab === "modules" && (
            <div className="space-y-2">
              {courseMods.length === 0 && !addingModule ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <Layers className="h-5 w-5 text-indigo-400" />
                  </div>
                  <p className="font-semibold text-slate-700">Немає модулів</p>
                  <p className="mt-1 text-sm text-slate-400">Тематичні блоки курсу</p>
                  {canManage && (
                    <button type="button" onClick={() => setAddingModule(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                      <Plus className="h-4 w-4" /> Додати перший модуль
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {courseMods.map((mod) => (
                    <ModuleCard key={mod._id} mod={mod} topics={courseTopics}
                      assessments={courseAssessments} projectId={projectId}
                      locale={locale} canManage={canManage} />
                  ))}
                  {addingModule ? (
                    <AddModuleRow projectId={projectId} locale={locale}
                      courseId={course._id ?? ""} orderIndex={courseMods.length}
                      onDone={() => setAddingModule(false)} />
                  ) : canManage && (
                    <button type="button" onClick={() => setAddingModule(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition">
                      <Plus className="h-4 w-4" /> Додати модуль
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "assessments" && (
            <GradeBook assessments={courseAssessments}
              projectId={projectId} locale={locale} canManage={canManage}
              onAdd={() => { setEditAssessment(null); setShowAssessmentModal(true); }}
              onEdit={(a) => { setEditAssessment(a); setShowAssessmentModal(true); }} />
          )}

          {tab === "schedule" && (
            <ScheduleTab courseId={course._id ?? ""} projectId={projectId} locale={locale}
              canManage={canManage} sessions={sessions} topics={courseTopics} modules={courseMods} />
          )}

          {tab === "assignments" && (
            <AssignmentsPanel courseId={course._id ?? ""} projectId={projectId} locale={locale}
              canManage={canManage} assignments={assignments} sessions={sessions} topics={courseTopics} modules={courseMods} />
          )}

          {tab === "settings" && canManage && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Settings className="h-4 w-4 text-slate-400" /> Параметри курсу
                </p>
              </div>
              <form action={(fd) => { start(() => saveCourse(fd)); }} className="px-5 py-5">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="courseId" value={course._id ?? ""} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Назва курсу</label>
                    <input name="title" defaultValue={course.title} className="input-control w-full text-base font-medium" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Код</label>
                    <input name="code" defaultValue={course.code} className="input-control w-full font-mono" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Викладач</label>
                    <input name="instructor" defaultValue={course.instructor} className="input-control w-full" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Семестр</label>
                    <input name="semester" type="number" defaultValue={course.semester} className="input-control w-full" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Рік</label>
                    <input name="year" type="number" defaultValue={course.year} className="input-control w-full" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Кредити (ECTS)</label>
                    <input name="credits" type="number" defaultValue={course.credits} className="input-control w-full" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Тип</label>
                    <select name="courseType" defaultValue={course.courseType} className="input-control w-full">
                      {(Object.keys(COURSE_TYPE_LABELS) as CourseType[]).map((t) => (
                        <option key={t} value={t}>{COURSE_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Статус</label>
                    <select name="status" defaultValue={course.status} className="input-control w-full">
                      {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map((s) => (
                        <option key={s} value={s}>{COURSE_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Підсумковий бал</label>
                    <input name="finalScore" type="number" min={0} max={100}
                      defaultValue={course.finalScore ?? ""} className="input-control w-full" placeholder="—" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Нотатки</label>
                    <textarea name="note" rows={3} defaultValue={course.note}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white resize-none transition" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <button type="button"
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("locale", locale); fd.set("projectId", projectId); fd.set("courseId", course._id ?? "");
                      start(() => removeCourse(fd));
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition">
                    <Trash2 className="h-3.5 w-3.5" /> Видалити курс
                  </button>
                  <button type="submit"
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                    <Check className="h-4 w-4" /> Зберегти
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {showAssessmentModal && (
        <AssessmentModal projectId={projectId} locale={locale}
          courseId={course._id ?? ""} modules={courseMods} topics={courseTopics}
          assessment={editAssessment}
          onClose={() => { setShowAssessmentModal(false); setEditAssessment(null); }} />
      )}
    </div>
  );
}

// ── Overview panel ────────────────────────────────────────────────────────────

function OverviewPanel({ courses, topics, assessments, assignments }: {
  courses: LearningCourse[]; topics: LearningTopic[];
  assessments: LearningAssessment[]; assignments: LearningAssignment[];
}) {
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
  const completedCredits = courses.filter((c) => c.status === "completed").reduce((s, c) => s + c.credits, 0);
  const graded = assessments.filter((a) => a.achievedScore !== null && a.maxScore > 0);
  const avgScore = graded.length
    ? Math.round(graded.reduce((s, a) => s + (a.achievedScore! / a.maxScore) * 100, 0) / graded.length) : null;
  const semesterGroups = Array.from(new Set(courses.map((c) => c.semester))).sort();

  const now = Date.now();
  type DeadlineItem = { title: string; course: string; date: string; kind: "assessment" | "assignment" };
  const deadlines: DeadlineItem[] = [
    ...assessments.filter((a) => a.status === "upcoming" && a.dueDate).map((a) => ({
      title: a.title,
      course: courses.find((c) => c._id === a.courseId)?.title ?? "",
      date: a.dueDate,
      kind: "assessment" as const,
    })),
    ...assignments.filter((a) => !["graded", "submitted"].includes(a.status) && a.dueDate).map((a) => ({
      title: a.title,
      course: courses.find((c) => c._id === a.courseId)?.title ?? "",
      date: a.dueDate,
      kind: "assignment" as const,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);

  const stats = [
    { label: "Курсів", value: courses.length, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Кредитів", value: `${completedCredits}/${totalCredits}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Ср. бал", value: avgScore !== null ? String(avgScore) : "—", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    {
      label: "Оцінка", icon: Award,
      value: avgScore !== null ? scoreToGrade(avgScore) : "—",
      color: avgScore !== null ? gradeColor(scoreToGrade(avgScore)).split(" ")[0] : "text-slate-400",
      bg: "bg-slate-50",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className={clsx("mb-2 flex h-7 w-7 items-center justify-center rounded-lg", bg)}>
              <Icon className={clsx("h-3.5 w-3.5", color)} />
            </div>
            <p className={clsx("text-xl font-black", color)}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {deadlines.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">Найближчі дедлайни</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {deadlines.map((d, i) => {
              const dl = Math.ceil((new Date(d.date).getTime() - now) / 86400000);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={clsx("h-1.5 w-1.5 flex-shrink-0 rounded-full",
                    d.kind === "assessment" ? "bg-rose-500" : "bg-amber-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{d.title}</p>
                    {d.course && <p className="text-xs text-slate-400 truncate">{d.course}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-medium text-slate-600">{fmtShort(d.date)}</p>
                    <p className={clsx("text-[11px] font-semibold",
                      dl <= 0 ? "text-rose-500" : dl <= 3 ? "text-orange-500" : dl <= 7 ? "text-amber-500" : "text-slate-400")}>
                      {dl > 0 ? `${dl} дн.` : dl === 0 ? "сьогодні" : "прострочено"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {semesterGroups.map((sem) => {
        const semCourses = courses.filter((c) => c.semester === sem);
        return (
          <div key={sem} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-slate-700">Семестр {sem}</h3>
              <span className="text-xs text-slate-400">{semCourses.reduce((s, c) => s + c.credits, 0)} кр.</span>
            </div>
            <div className="divide-y divide-slate-50">
              {semCourses.map((course) => {
                const sc = courseWeightedScore(course, assessments);
                const g = scoreToGrade(sc);
                const p = courseProgress(course, topics);
                return (
                  <div key={course._id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{course.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className={clsx("h-full rounded-full", p === 100 ? "bg-emerald-500" : "bg-indigo-400")}
                            style={{ width: `${p}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-400">{p}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-semibold", COURSE_STATUS_COLORS[course.status])}>
                        {COURSE_STATUS_LABELS[course.status]}
                      </span>
                      {sc !== null && (
                        <span className={clsx("rounded-lg border px-1.5 py-0.5 text-xs font-black", gradeColor(g))}>{g}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {courses.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <BookOpen className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-slate-600">Журнал навчання порожній</p>
          <p className="mt-1 text-sm text-slate-400">Натисніть «+ Додати курс» щоб почати</p>
        </div>
      )}
    </div>
  );
}

// ── Main LearningJournal ──────────────────────────────────────────────────────

export function LearningJournal({
  projectId, locale, canManage, initialCourseId,
  courses, modules, topics, assessments, sessions, assignments,
  isDissertation,
}: {
  projectId: string; locale: string; canManage: boolean; initialCourseId: string | null;
  courses: LearningCourse[]; modules: LearningModule[]; topics: LearningTopic[];
  assessments: LearningAssessment[]; sessions: LearningSession[]; assignments: LearningAssignment[];
  isDissertation?: boolean;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    initialCourseId ?? (courses.length > 0 ? (courses[0]._id ?? null) : null),
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);

  const selectedCourse = courses.find((c) => c._id === selectedCourseId) ?? null;
  const maxSemester = courses.length ? Math.max(...courses.map((c) => c.semester)) : 1;
  const semesterGroups = Array.from(new Set(courses.map((c) => c.semester))).sort();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2.5 text-xl font-bold text-slate-900">
          <GraduationCap className="h-5 w-5 text-indigo-600" />
          {locale === "uk" ? "Журнал навчання" : "Learning Journal"}
        </h1>
        {canManage && (
          <button type="button" onClick={() => setShowAddCourse(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition">
            <Plus className="h-4 w-4" />Додати курс
          </button>
        )}
      </div>

      <div className="flex min-h-[calc(100vh-220px)] gap-4 items-start">
        {/* Light sidebar */}
        <aside className="w-60 flex-shrink-0">
          <div className="sticky top-[76px] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 max-h-[calc(100vh-105px)]">
            <div className="border-b border-slate-200 p-2 space-y-0.5">
              {[
                { label: "Огляд", icon: BarChart3, active: !selectedCourseId && !showCalendar,
                  onClick: () => { setSelectedCourseId(null); setShowCalendar(false); } },
                { label: "Календар", icon: Calendar, active: showCalendar,
                  onClick: () => { setSelectedCourseId(null); setShowCalendar(true); } },
              ].map(({ label, icon: Icon, active, onClick }) => (
                <button key={label} type="button" onClick={onClick}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active ? "bg-white border border-slate-200 shadow-sm text-indigo-700"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                  )}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {semesterGroups.length === 0 && (
                <p className="px-2 py-4 text-xs text-center text-slate-400">Курси ще не додані</p>
              )}
              {semesterGroups.map((sem) => (
                <div key={sem}>
                  <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Сем. {sem}
                  </p>
                  <div className="space-y-0.5">
                    {courses.filter((c) => c.semester === sem).map((course) => (
                      <CourseItem key={course._id} course={course} topics={topics} assessments={assessments}
                        isActive={selectedCourseId === course._id}
                        onClick={() => { setSelectedCourseId(course._id ?? null); setShowCalendar(false); }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {canManage && (
              <div className="border-t border-slate-200 p-2">
                <button type="button" onClick={() => setShowAddCourse(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-400 transition hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50">
                  <Plus className="h-3.5 w-3.5" /> Додати курс
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <AnimatePresence mode="wait">
          {selectedCourse ? (
            <motion.div key={selectedCourse._id} className="flex-1 min-w-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              <CourseView course={selectedCourse} modules={modules} topics={topics}
                assessments={assessments} sessions={sessions} assignments={assignments}
                projectId={projectId} locale={locale} canManage={canManage}
                isDissertation={isDissertation} />
            </motion.div>
          ) : showCalendar ? (
            <motion.div key="calendar" className="flex-1 min-w-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              <LearningCalendar courses={courses} sessions={sessions}
                assessments={assessments} assignments={assignments} />
            </motion.div>
          ) : (
            <motion.div key="overview" className="flex-1 min-w-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              <OverviewPanel courses={courses} topics={topics}
                assessments={assessments} assignments={assignments} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddCourse && (
          <AddCourseModal projectId={projectId} locale={locale}
            semesterHint={maxSemester > 1 ? maxSemester : 1}
            onClose={() => setShowAddCourse(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
