"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Calendar, Plus, ChevronRight, ChevronDown,
  Users, Settings, Layers, FileText, Clock, Award, Trash2, X,
  TrendingUp, AlertCircle, CheckCircle2, Check,
  BookOpen, GraduationCap, ClipboardList, Edit3, BookMarked, Wand2,
  ArrowUp, ArrowDown,
} from "lucide-react";
import clsx from "clsx";
import type {
  LearningCourse, LearningModule, LearningTopic, LearningAssessment,
  LearningSession, LearningAssignment,
  CourseType, CourseStatus, TopicType, AssessmentType, AssessmentStatus,
} from "@/lib/schemas";
import { scoreToGrade, gradeColor, gradeToNational } from "@/lib/learning-utils";
import { ScheduleTab } from "@/components/learning/schedule-tab";
import { AssignmentsPanel } from "@/components/learning/assignments-panel";
import { LearningCalendar } from "@/components/learning/learning-calendar";
import {
  addCourse, saveCourse, removeCourse,
  addModule, saveModule, removeModule,
  createModuleFromPlan, previewSyllabusPlan,
  previewAiSyllabusCourse, applyAiSyllabusCourse, createAiSyllabusCourse,
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
  const t = topics.filter((t) => t.courseId === course._id && isActionableTopic(t));
  if (!t.length) return 0;
  return Math.round((t.filter((t) => t.isCompleted).length / t.length) * 100);
}

function isActionableTopic(topic: LearningTopic) {
  return topic.topicType !== "self_study";
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

function courseSemesterEnd(course: LearningCourse) {
  return Math.max(course.semester, course.semesterEnd ?? course.semester);
}

function courseSemesterLabel(course: LearningCourse) {
  const end = courseSemesterEnd(course);
  return end > course.semester ? `Сем. ${course.semester}-${end}` : `Сем. ${course.semester}`;
}

function courseCoversSemester(course: LearningCourse, semester: number) {
  return semester >= course.semester && semester <= courseSemesterEnd(course);
}

function courseCoveredSemesters(course: LearningCourse) {
  const end = courseSemesterEnd(course);
  return Array.from({ length: end - course.semester + 1 }, (_, i) => course.semester + i);
}

type TopicBundle = {
  key: string;
  title: string;
  topics: LearningTopic[];
};

type AiCoursePlanPreview = {
  source?: {
    institution?: string;
    programName?: string;
    faculty?: string;
    department?: string;
    studyLevel?: string;
    evidence?: string;
  };
  course: {
    title: string;
    code: string;
    instructor: string;
    semester: number;
    semesterEnd: number;
    year: number;
    credits: number;
    courseType: CourseType;
    status: CourseStatus;
    note: string;
  };
  modules: Array<{
    title: string;
    description: string;
    topics: Array<{
      title: string;
      description: string;
      sessions: Array<{ type: TopicType; hours: number; notes: string }>;
    }>;
  }>;
  assessments: Array<{ title: string; type: AssessmentType; maxScore: number; weight: number; notes: string }>;
};

type AcademicSemesterSetting = {
  year: number;
  semester: number;
  startsAt?: string;
  endsAt?: string;
};

type AcademicSettings = {
  years?: number;
  semestersPerYear?: number;
  semesterDates?: AcademicSemesterSetting[];
  holidays?: string[];
  weekends?: number[];
};

type LearningProfile = {
  institution?: string;
  programName?: string;
  faculty?: string;
  department?: string;
  studyLevel?: string;
  academicSettings?: AcademicSettings | null;
};

function resolveAcademicSettings(settings?: AcademicSettings | null) {
  const years = Math.min(10, Math.max(1, Number(settings?.years || 4)));
  const semestersPerYear = Math.min(4, Math.max(1, Number(settings?.semestersPerYear || 2)));
  return {
    years,
    semestersPerYear,
    totalSemesters: years * semestersPerYear,
    semesterDates: settings?.semesterDates ?? [],
    holidays: settings?.holidays ?? [],
    weekends: settings?.weekends ?? [0, 6],
  };
}

function normalizeCompare(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contextMismatchWarnings(plan: AiCoursePlanPreview | null, profile?: LearningProfile) {
  if (!plan?.source || !profile) return [];
  const checks: Array<[string, string | undefined, string | undefined]> = [
    ["Інституція", profile.institution, plan.source.institution],
    ["Програма", profile.programName, plan.source.programName],
    ["Факультет/інститут", profile.faculty, plan.source.faculty],
  ];
  return checks
    .filter(([, expected, detected]) => {
      const a = normalizeCompare(expected);
      const b = normalizeCompare(detected);
      return a.length > 3 && b.length > 3 && !a.includes(b) && !b.includes(a);
    })
    .map(([label, expected, detected]) => `${label}: у профілі "${expected}", у силабусі "${detected}"`);
}

function topicBundleKey(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?()[\]«»"']/g, "")
    .trim();
}

function groupTopicBundles(topics: LearningTopic[]): TopicBundle[] {
  const map = new Map<string, TopicBundle>();

  topics.forEach((topic) => {
    const key = topicBundleKey(topic.title) || topic._id || topic.title;
    const existing = map.get(key);
    if (existing) {
      existing.topics.push(topic);
    } else {
      map.set(key, { key, title: topic.title, topics: [topic] });
    }
  });

  return [...map.values()].map((bundle) => ({
    ...bundle,
    topics: [...bundle.topics].sort((a, b) => a.orderIndex - b.orderIndex),
  }));
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

function CoursePeriodPicker({
  academic,
  year,
  semester,
  semesterEnd,
  onYearChange,
  onSemesterChange,
  onSemesterEndChange,
}: {
  academic: ReturnType<typeof resolveAcademicSettings>;
  year: number;
  semester: number;
  semesterEnd: number;
  onYearChange: (value: number) => void;
  onSemesterChange: (value: number) => void;
  onSemesterEndChange: (value: number) => void;
}) {
  const years = Array.from({ length: academic.years }, (_, i) => i + 1);
  const semesters = Array.from({ length: academic.totalSemesters }, (_, i) => i + 1);
  const selectedDate = academic.semesterDates.find((item) => item.semester === semester);

  function setYear(value: number) {
    const firstSemester = (value - 1) * academic.semestersPerYear + 1;
    onYearChange(value);
    onSemesterChange(firstSemester);
    onSemesterEndChange(Math.max(firstSemester, Math.min(semesterEnd, firstSemester + academic.semestersPerYear - 1)));
  }

  function setSemesterStart(value: number) {
    onSemesterChange(value);
    onYearChange(Math.ceil(value / academic.semestersPerYear));
    if (semesterEnd < value) onSemesterEndChange(value);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Період курсу</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
          {academic.years} р. · {academic.totalSemesters} сем.
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Рік навчання</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {years.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setYear(value)}
                className={clsx(
                  "rounded-lg border px-2 py-1.5 text-xs font-bold transition",
                  year === value
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {value} рік
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Семестр початку</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {semesters.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSemesterStart(value)}
                className={clsx(
                  "rounded-lg border px-2 py-1.5 text-xs font-bold transition",
                  semester === value
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                Сем. {value}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Кінець курсу</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {semesters.filter((value) => value >= semester).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSemesterEndChange(value)}
                className={clsx(
                  "rounded-lg border px-2 py-1.5 text-xs font-bold transition",
                  semesterEnd === value
                    ? "border-violet-400 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {value === semester ? "1 семестр" : `до ${value}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      {(selectedDate?.startsAt || selectedDate?.endsAt) && (
        <p className="mt-2 text-[11px] font-semibold text-slate-500">
          Семестр {semester}: {[selectedDate.startsAt, selectedDate.endsAt].filter(Boolean).join(" - ")}
        </p>
      )}
    </div>
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

const AI_ERRORS: Record<string, string> = {
  openai_key_missing: "Додайте OPENAI_API_KEY у .env і перезапустіть dev server",
  unsupported_file: "Підтримуються PDF, DOCX, XLSX, CSV, TXT/MD",
  file_too_large: "Файл завеликий (макс. 20 МБ)",
  empty: "Додайте файл або вставте текст силабуса",
};

function AddCourseModal({ projectId, locale, semesterHint, learningProfile, onClose }: {
  projectId: string; locale: string; semesterHint: number; learningProfile?: LearningProfile; onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [selectedType, setSelectedType] = useState<CourseType>("mandatory");
  const academic = resolveAcademicSettings(learningProfile?.academicSettings);
  const initialSemester = Math.min(Math.max(1, semesterHint), academic.totalSemesters);
  const [manualYear, setManualYear] = useState(Math.max(1, Math.ceil(initialSemester / academic.semestersPerYear)));
  const [manualSemester, setManualSemester] = useState(initialSemester);
  const [manualSemesterEnd, setManualSemesterEnd] = useState(initialSemester);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [titleHint, setTitleHint] = useState("");
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [aiStep, setAiStep] = useState<"input" | "preview">("input");
  const [aiPlan, setAiPlan] = useState<AiCoursePlanPreview | null>(null);
  const [aiSelectedModules, setAiSelectedModules] = useState<Set<number>>(new Set());
  const [aiExpandedModules, setAiExpandedModules] = useState<Set<number>>(new Set());
  const [aiStage, setAiStage] = useState("");
  const [userHint, setUserHint] = useState("");
  const aiFileRef = useRef<HTMLInputElement>(null);

  function buildPreviewFd() {
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseTitle", titleHint);
    fd.set("sourceText", aiText);
    fd.set("userHint", userHint);
    fd.set("expectedInstitution", learningProfile?.institution ?? "");
    fd.set("expectedProgramName", learningProfile?.programName ?? "");
    fd.set("expectedFaculty", learningProfile?.faculty ?? "");
    fd.set("expectedDepartment", learningProfile?.department ?? "");
    fd.set("expectedStudyLevel", learningProfile?.studyLevel ?? "");
    const file = aiFileRef.current?.files?.[0];
    if (file) fd.set("syllabusFile", file);
    return fd;
  }

  function runAiPreview() {
    setAiStatus(null);
    setAiStage(aiFileRef.current?.files?.[0] ? "Читаю файл…" : "Аналізую текст…");
    start(async () => {
      setAiStage("AI аналізує силабус…");
      const res = await previewAiSyllabusCourse(buildPreviewFd());
      setAiStage("");
      if (res.ok && res.plan) {
        const incoming = res.plan as AiCoursePlanPreview;
        setAiPlan(incoming);
        setAiSelectedModules(new Set(incoming.modules.map((_, i) => i)));
        setAiExpandedModules(new Set());
        setAiStep("preview");
      } else {
        setAiStatus(AI_ERRORS[res.error ?? ""] ?? `AI не вдався: ${res.error || "unknown"}`);
      }
    });
  }

  function rerunWithCorrections() {
    if (!aiPlan) return;
    setAiStatus(null);
    setAiStep("input");
    setAiStage("Переробляю з поправками…");
    start(async () => {
      setAiStage("AI аналізує силабус…");
      const res = await previewAiSyllabusCourse(buildPreviewFd());
      setAiStage("");
      if (res.ok && res.plan) {
        const incoming = res.plan as AiCoursePlanPreview;
        setAiPlan(incoming);
        setAiSelectedModules(new Set(incoming.modules.map((_, i) => i)));
        setAiExpandedModules(new Set());
        setAiStep("preview");
      } else {
        setAiStatus(AI_ERRORS[res.error ?? ""] ?? `AI не вдався: ${res.error || "unknown"}`);
      }
    });
  }

  function createFromAiPlan() {
    if (!aiPlan) return;
    const mismatches = contextMismatchWarnings(aiPlan, learningProfile);
    if (mismatches.length > 0 && !window.confirm(`Силабус схожий на документ з іншого контексту:\n\n${mismatches.join("\n")}\n\nПродовжити створення курсу?`)) {
      return;
    }
    const filteredPlan: AiCoursePlanPreview = {
      ...aiPlan,
      modules: aiPlan.modules.filter((_, i) => aiSelectedModules.has(i)),
    };
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseTitle", titleHint);
    fd.set("planJson", JSON.stringify(filteredPlan));

    setAiStatus(null);
    setAiStage("Створюю курс…");
    start(async () => {
      const res = await createAiSyllabusCourse(fd);
      setAiStage("");
      if (res.ok) {
        onClose();
      } else {
        setAiStatus(AI_ERRORS[res.error ?? ""] ?? `Не вдалося: ${res.error || "unknown"}`);
        setAiStep("input");
      }
    });
  }

  function toggleAiModule(index: number) {
    setAiSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function toggleAiModuleExpand(index: number) {
    setAiExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function updateAiPlan(mutator: (draft: AiCoursePlanPreview) => void) {
    if (!aiPlan) return;
    const next = structuredClone(aiPlan);
    mutator(next);
    next.course.semesterEnd = Math.max(next.course.semester, next.course.semesterEnd || next.course.semester);
    next.modules = next.modules.filter((module) => module.title.trim() || module.topics.length > 0);
    setAiPlan(next);
    setAiSelectedModules(new Set(next.modules.map((_, i) => i)));
  }

  function moveAiModule(index: number, delta: -1 | 1) {
    updateAiPlan((draft) => {
      const target = index + delta;
      if (target < 0 || target >= draft.modules.length) return;
      const [item] = draft.modules.splice(index, 1);
      draft.modules.splice(target, 0, item);
    });
  }

  function addAiModule() {
    updateAiPlan((draft) => {
      draft.modules.push({ title: `Новий модуль ${draft.modules.length + 1}`, description: "", topics: [] });
    });
  }

  function addAiTopic(moduleIndex: number) {
    updateAiPlan((draft) => {
      draft.modules[moduleIndex]?.topics.push({
        title: "Нова тема",
        description: "",
        sessions: [{ type: "lecture", hours: 2, notes: "" }],
      });
    });
    setAiExpandedModules((prev) => new Set(prev).add(moduleIndex));
  }

  function moveAiTopic(moduleIndex: number, topicIndex: number, delta: -1 | 1) {
    updateAiPlan((draft) => {
      const topics = draft.modules[moduleIndex]?.topics;
      if (!topics) return;
      const target = topicIndex + delta;
      if (target < 0 || target >= topics.length) return;
      const [item] = topics.splice(topicIndex, 1);
      topics.splice(target, 0, item);
    });
  }

  function addAiSession(moduleIndex: number, topicIndex: number, type: TopicType = "lecture") {
    updateAiPlan((draft) => {
      draft.modules[moduleIndex]?.topics[topicIndex]?.sessions.push({ type, hours: type === "consultation" ? 1 : 2, notes: "" });
    });
  }

  const aiSelectedPlanModules = aiPlan?.modules.filter((_, i) => aiSelectedModules.has(i)) ?? [];
  const aiTotalHours = aiSelectedPlanModules.reduce(
    (sum, module) => sum + module.topics.reduce(
      (topicSum, topic) => topicSum + topic.sessions.reduce((sessionSum, session) => sessionSum + Math.max(0, Number(session.hours) || 0), 0),
      0,
    ),
    0,
  );
  const aiTotalSessions = aiSelectedPlanModules.reduce(
    (sum, module) => sum + module.topics.reduce((topicSum, topic) => topicSum + topic.sessions.filter((session) => session.hours > 0).length, 0),
    0,
  );
  const aiWarnings = [
    aiPlan && !aiPlan.course.title.trim() ? "Немає назви курсу" : "",
    aiPlan && aiSelectedModules.size === 0 ? "Не вибрано жодного модуля" : "",
    aiPlan && aiTotalSessions === 0 ? "Немає занять з годинами більше 0" : "",
    aiPlan && aiPlan.course.semesterEnd < aiPlan.course.semester ? "Кінець семестру менший за початок" : "",
  ].filter(Boolean);
  const aiContextWarnings = contextMismatchWarnings(aiPlan, learningProfile);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative max-h-[calc(100vh-32px)] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
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
          action={(fd) => {
            fd.set("courseType", selectedType);
            fd.set("semester", String(manualSemester));
            fd.set("semesterEnd", String(Math.max(manualSemester, manualSemesterEnd)));
            fd.set("year", String(manualYear));
            start(async () => { await addCourse(fd); onClose(); });
          }}
          className="max-h-[calc(100vh-132px)] space-y-4 overflow-y-auto px-6 py-5">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Назва курсу *</label>
            <input name="title" required autoFocus value={titleHint} onChange={(e) => setTitleHint(e.target.value)}
              className="input-control w-full text-base font-medium"
              placeholder="Молекулярна біологія…" />
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-black text-violet-950">
                  <Wand2 className="h-4 w-4" /> Створити з силабуса
                </p>
                <p className="mt-0.5 text-xs text-violet-800/70">
                  AI заповнить модулі, теми, заняття та оцінювання — ви оберете, що залишити.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setAiOpen((v) => !v); setAiStep("input"); setAiPlan(null); setAiStatus(null); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700"
              >
                <FileText className="h-3.5 w-3.5" />
                {aiOpen ? "Сховати" : "AI імпорт"}
              </button>
            </div>
            {aiOpen && (
              <div className="mt-3 space-y-3">
                {/* ── Step 1: input ── */}
                {aiStep === "input" && (
                  <>
                    {/* File upload */}
                    <input
                      ref={aiFileRef}
                      type="file"
                      accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,application/pdf,text/plain"
                      className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-800 hover:file:bg-violet-200"
                    />
                    <textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none transition focus:ring-2 focus:ring-violet-300"
                      placeholder="Або вставте текст силабуса…"
                    />

                    {/* User hint */}
                    <textarea
                      value={userHint}
                      onChange={(e) => setUserHint(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-violet-100 bg-white/70 px-3 py-2 text-xs leading-relaxed text-slate-700 outline-none placeholder-slate-400 transition focus:ring-2 focus:ring-violet-300"
                      placeholder="Додаткові вказівки (необов'язково): як трактувати неоднозначні колонки, що об'єднати, що не додавати..."
                    />

                    {aiStatus && <p className="text-xs font-semibold text-rose-600">{aiStatus}</p>}
                    <button
                      type="button"
                      onClick={runAiPreview}
                      disabled={pending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                    >
                      <Wand2 className="h-4 w-4" />
                      {pending ? (aiStage || "Аналізую…") : "Переглянути план"}
                    </button>
                  </>
                )}

                {/* ── Step 2: preview ── */}
                {aiStep === "preview" && aiPlan && (
                  <div className="space-y-2.5">
                    {/* Course editor */}
                    <div className="rounded-xl border border-violet-100 bg-white/90 p-4 text-xs shadow-sm">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-black text-slate-900">Метадані курсу</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">Це буде записано в картку курсу перед створенням модулів.</p>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">
                            {aiSelectedModules.size} мод.
                          </span>
                          <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-700">
                            {aiTotalSessions} занять
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                            {aiTotalHours} год
                          </span>
                        </div>
                      </div>
                      {aiPlan.source && (aiPlan.source.institution || aiPlan.source.programName || aiPlan.source.faculty || aiPlan.source.evidence) && (
                        <div className={clsx(
                          "mb-3 rounded-xl border px-3 py-2",
                          aiContextWarnings.length > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50/70",
                        )}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className={clsx("text-[10px] font-black uppercase tracking-wider", aiContextWarnings.length > 0 ? "text-amber-800" : "text-emerald-800")}>
                                Перевірка контексту силабуса
                              </p>
                              <p className="mt-1 text-[11px] font-semibold text-slate-700">
                                {[aiPlan.source.institution, aiPlan.source.faculty, aiPlan.source.programName].filter(Boolean).join(" · ") || "Метадані не виявлені"}
                              </p>
                              {aiPlan.source.evidence && <p className="mt-0.5 text-[10px] text-slate-500">{aiPlan.source.evidence}</p>}
                            </div>
                            {aiContextWarnings.length > 0 && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                                потребує підтвердження
                              </span>
                            )}
                          </div>
                          {aiContextWarnings.length > 0 && (
                            <ul className="mt-2 space-y-1 text-[11px] font-semibold text-amber-800">
                              {aiContextWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                      <div className="grid gap-3 md:grid-cols-12">
                        <label className="md:col-span-8">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Назва курсу</span>
                          <input
                            value={aiPlan.course.title}
                            onChange={(e) => updateAiPlan((draft) => { draft.course.title = e.target.value; })}
                            className="input-control w-full py-2 text-sm font-semibold"
                            placeholder="Назва курсу"
                          />
                        </label>
                        <label className="md:col-span-4">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Код</span>
                          <input
                            value={aiPlan.course.code}
                            onChange={(e) => updateAiPlan((draft) => { draft.course.code = e.target.value; })}
                            className="input-control w-full py-2 font-mono text-sm"
                            placeholder="ОК4"
                          />
                        </label>
                        <label className="md:col-span-6">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Викладач</span>
                          <input
                            value={aiPlan.course.instructor}
                            onChange={(e) => updateAiPlan((draft) => { draft.course.instructor = e.target.value; })}
                            className="input-control w-full py-2 text-sm"
                            placeholder="ПІБ викладача"
                          />
                        </label>
                        <label className="md:col-span-2">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">ECTS</span>
                          <input
                            type="number"
                            min={0}
                            max={60}
                            step={0.5}
                            value={aiPlan.course.credits}
                            onChange={(e) => updateAiPlan((draft) => { draft.course.credits = Number(e.target.value); })}
                            className="input-control w-full py-2 text-sm"
                          />
                        </label>
                        <div className="md:col-span-4">
                          <CoursePeriodPicker
                            academic={academic}
                            year={aiPlan.course.year}
                            semester={aiPlan.course.semester}
                            semesterEnd={aiPlan.course.semesterEnd}
                            onYearChange={(value) => updateAiPlan((draft) => { draft.course.year = value; })}
                            onSemesterChange={(value) => updateAiPlan((draft) => { draft.course.semester = value; })}
                            onSemesterEndChange={(value) => updateAiPlan((draft) => { draft.course.semesterEnd = value; })}
                          />
                        </div>
                        <label className="md:col-span-3">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Тип дисципліни</span>
                          <select
                            value={aiPlan.course.courseType}
                            onChange={(e) => updateAiPlan((draft) => { draft.course.courseType = e.target.value as CourseType; })}
                            className="input-control w-full py-2 text-sm"
                          >
                            {(Object.keys(COURSE_TYPE_LABELS) as CourseType[]).map((type) => (
                              <option key={type} value={type}>{COURSE_TYPE_LABELS[type]}</option>
                            ))}
                          </select>
                        </label>
                        <label className="md:col-span-3">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Статус</span>
                          <select
                            value={aiPlan.course.status}
                            onChange={(e) => updateAiPlan((draft) => { draft.course.status = e.target.value as CourseStatus; })}
                            className="input-control w-full py-2 text-sm"
                          >
                            {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map((status) => (
                              <option key={status} value={status}>{COURSE_STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                        </label>
                        <label className="md:col-span-6">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Нотатка курсу</span>
                          <input
                            value={aiPlan.course.note}
                            onChange={(e) => updateAiPlan((draft) => { draft.course.note = e.target.value; })}
                            className="input-control w-full py-2 text-sm"
                            placeholder="Коротка службова нотатка"
                          />
                        </label>
                      </div>
                      {aiWarnings.length > 0 && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">
                          {aiWarnings.join(" · ")}
                        </div>
                      )}
                    </div>

                    {/* Module list */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                        Структура курсу · {aiSelectedModules.size}/{aiPlan.modules.length}
                      </p>
                      <button
                        type="button"
                        onClick={addAiModule}
                        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[10px] font-bold text-violet-700 transition hover:bg-violet-50"
                      >
                        <Plus className="h-3 w-3" /> Модуль
                      </button>
                    </div>
                    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
                      {aiPlan.modules.map((mod, i) => {
                        const checked = aiSelectedModules.has(i);
                        const expanded = aiExpandedModules.has(i);
                        const totalHours = mod.topics.reduce(
                          (sum, t) => sum + t.sessions.reduce((s, se) => s + (se.hours || 0), 0), 0,
                        );
                        const sessionTypeSummary = (() => {
                          const counts: Record<string, number> = {};
                          mod.topics.forEach((t) => t.sessions.forEach((se) => {
                            if (se.hours > 0) counts[se.type] = (counts[se.type] || 0) + se.hours;
                          }));
                          const TYPE_SHORT: Record<string, string> = {
                            lecture: "Лек", seminar: "Сем", practical: "Пр",
                            lab: "Лаб", self_study: "СР", consultation: "Конс",
                          };
                          return Object.entries(counts)
                            .map(([t, h]) => `${TYPE_SHORT[t] ?? t} ${h}г`)
                            .join(" · ");
                        })();
                        return (
                          <div
                            key={i}
                            className={clsx(
                              "rounded-xl border transition",
                              checked ? "border-violet-200 bg-violet-50/40" : "border-slate-100 bg-white opacity-50",
                            )}
                          >
                            <div className="flex items-start gap-2 px-2.5 py-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAiModule(i)}
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-violet-600"
                              />
                              <div className="min-w-0 flex-1">
                                <input
                                  value={mod.title}
                                  onChange={(e) => updateAiPlan((draft) => { draft.modules[i].title = e.target.value; })}
                                  className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-xs font-semibold leading-tight text-slate-800 outline-none transition focus:border-violet-200 focus:bg-white"
                                  placeholder="Назва модуля"
                                />
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  {mod.topics.length} тем · {totalHours}г
                                  {sessionTypeSummary && <span className="ml-1.5 text-slate-300">·</span>}
                                  {sessionTypeSummary && <span className="ml-1.5">{sessionTypeSummary}</span>}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-0.5">
                                <button type="button" onClick={() => moveAiModule(i, -1)} disabled={i === 0}
                                  className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition hover:bg-white hover:text-violet-500 disabled:opacity-30"
                                  title="Підняти модуль">
                                  <ArrowUp className="h-3 w-3" />
                                </button>
                                <button type="button" onClick={() => moveAiModule(i, 1)} disabled={i === aiPlan.modules.length - 1}
                                  className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition hover:bg-white hover:text-violet-500 disabled:opacity-30"
                                  title="Опустити модуль">
                                  <ArrowDown className="h-3 w-3" />
                                </button>
                                <button type="button" onClick={() => updateAiPlan((draft) => { draft.modules.splice(i, 1); })}
                                  className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                                  title="Видалити модуль">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleAiModuleExpand(i)}
                                className="shrink-0 rounded p-0.5 text-slate-300 hover:text-violet-500 transition"
                                title={expanded ? "Сховати теми" : "Показати теми"}
                              >
                                <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                              </button>
                            </div>
                            {/* Expanded topic list */}
                            {expanded && (
                              <div className="space-y-2 border-t border-violet-100/60 px-3 pb-2 pt-2">
                                <input
                                  value={mod.description}
                                  onChange={(e) => updateAiPlan((draft) => { draft.modules[i].description = e.target.value; })}
                                  className="input-control w-full py-1.5 text-[11px]"
                                  placeholder="Опис модуля"
                                />
                                {mod.topics.map((topic, ti) => {
                                  return (
                                    <div key={ti} className="rounded-lg border border-violet-100 bg-white p-2">
                                      <div className="flex items-start gap-1.5">
                                        <span className="mt-1 shrink-0 text-[9px] font-bold text-slate-300">{ti + 1}.</span>
                                        <div className="min-w-0 flex-1 space-y-1">
                                          <input
                                            value={topic.title}
                                            onChange={(e) => updateAiPlan((draft) => { draft.modules[i].topics[ti].title = e.target.value; })}
                                            className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[11px] font-bold leading-tight text-slate-800 outline-none transition focus:border-violet-200 focus:bg-violet-50"
                                            placeholder="Назва теми"
                                          />
                                          <input
                                            value={topic.description}
                                            onChange={(e) => updateAiPlan((draft) => { draft.modules[i].topics[ti].description = e.target.value; })}
                                            className="input-control w-full py-1 text-[10px]"
                                            placeholder="Опис / джерело / уточнення"
                                          />
                                        </div>
                                        <div className="flex shrink-0 items-center gap-0.5">
                                          <button type="button" onClick={() => moveAiTopic(i, ti, -1)} disabled={ti === 0}
                                            className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition hover:bg-violet-50 hover:text-violet-500 disabled:opacity-30"
                                            title="Підняти тему">
                                            <ArrowUp className="h-3 w-3" />
                                          </button>
                                          <button type="button" onClick={() => moveAiTopic(i, ti, 1)} disabled={ti === mod.topics.length - 1}
                                            className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition hover:bg-violet-50 hover:text-violet-500 disabled:opacity-30"
                                            title="Опустити тему">
                                            <ArrowDown className="h-3 w-3" />
                                          </button>
                                          <button type="button" onClick={() => updateAiPlan((draft) => { draft.modules[i].topics.splice(ti, 1); })}
                                            className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                                            title="Видалити тему">
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="mt-2 space-y-1">
                                        {topic.sessions.length > 0 && (
                                          <div className="grid grid-cols-[112px_64px_minmax(0,1fr)_24px] gap-1.5 px-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            <span>Тип</span>
                                            <span>Год.</span>
                                            <span>Нотатка</span>
                                            <span />
                                          </div>
                                        )}
                                        {topic.sessions.map((session, si) => (
                                          <div key={si} className="grid grid-cols-[112px_64px_minmax(0,1fr)_24px] items-center gap-1.5">
                                            <select
                                              value={session.type}
                                              onChange={(e) => updateAiPlan((draft) => { draft.modules[i].topics[ti].sessions[si].type = e.target.value as TopicType; })}
                                              className="input-control w-full py-1 text-[10px]"
                                            >
                                              {(Object.keys(TOPIC_TYPE_LABELS) as TopicType[]).map((type) => (
                                                <option key={type} value={type}>{TOPIC_TYPE_LABELS[type]}</option>
                                              ))}
                                            </select>
                                            <input
                                              type="number"
                                              min={0}
                                              max={200}
                                              step={0.5}
                                              value={session.hours}
                                              onChange={(e) => updateAiPlan((draft) => { draft.modules[i].topics[ti].sessions[si].hours = Number(e.target.value); })}
                                              className="input-control w-full py-1 text-[10px]"
                                              aria-label="Години"
                                            />
                                            <input
                                              value={session.notes}
                                              onChange={(e) => updateAiPlan((draft) => { draft.modules[i].topics[ti].sessions[si].notes = e.target.value; })}
                                              className="input-control w-full py-1 text-[10px]"
                                              placeholder="Нотатки"
                                            />
                                            <button type="button" onClick={() => updateAiPlan((draft) => { draft.modules[i].topics[ti].sessions.splice(si, 1); })}
                                              className="flex h-6 w-6 items-center justify-center rounded text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                                              title="Видалити заняття">
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))}
                                        <div className="flex flex-wrap gap-1">
                                          {(Object.keys(TOPIC_TYPE_LABELS) as TopicType[]).slice(0, 5).map((type) => (
                                            <button key={type} type="button" onClick={() => addAiSession(i, ti, type)}
                                              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[9px] font-bold text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
                                              + {TOPIC_TYPE_LABELS[type]}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                <button type="button" onClick={() => addAiTopic(i)}
                                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-violet-200 bg-white px-2 py-1.5 text-[11px] font-bold text-violet-600 transition hover:bg-violet-50">
                                  <Plus className="h-3 w-3" /> Додати тему
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Correction field */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Поправки / уточнення
                      </p>
                      <p className="text-[10px] text-amber-700/70">
                        Опишіть що не так — AI переробить план з урахуванням вказівок.
                      </p>
                      <textarea
                        value={userHint}
                        onChange={(e) => setUserHint(e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-lg border border-amber-100 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none placeholder-slate-400 focus:ring-2 focus:ring-amber-300 transition"
                        placeholder="Наприклад: об'єднай модулі 1 і 2, не додавай самостійну роботу, неоднозначну колонку трактуй як семінари..."
                      />
                      <button
                        type="button"
                        onClick={rerunWithCorrections}
                        disabled={pending}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-50 disabled:opacity-60"
                      >
                        <Wand2 className="h-3 w-3" />
                        {pending ? (aiStage || "Переробляю…") : "Переробити з поправками"}
                      </button>
                    </div>

                    {aiStatus && <p className="text-xs font-semibold text-rose-600">{aiStatus}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setAiStep("input"); setAiStatus(null); }}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        ← Назад
                      </button>
                      <button
                        type="button"
                        onClick={createFromAiPlan}
                        disabled={pending || aiWarnings.length > 0}
                        className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {pending ? (aiStage || "Створюю…") : `Створити курс (${aiSelectedModules.size} мод.)`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
            <div className="col-span-2">
              <CoursePeriodPicker
                academic={academic}
                year={manualYear}
                semester={manualSemester}
                semesterEnd={manualSemesterEnd}
                onYearChange={setManualYear}
                onSemesterChange={setManualSemester}
                onSemesterEndChange={setManualSemesterEnd}
              />
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
          <p className="mt-0.5 text-[11px] text-slate-400">{course.credits} кр. · {courseSemesterLabel(course)}</p>
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

function PlanModuleBuilder({ projectId, locale, courseId, orderIndex, onDone }: {
  projectId: string; locale: string; courseId: string; orderIndex: number; onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [extractPending, extractStart] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] = useState<string | null>(null);
  const [pattern, setPattern] = useState("lecture_practical");
  const [plan, setPlan] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const previewCount = pattern.includes("self") ? 3 : pattern === "lecture_only" ? 1 : 2;

  function extractFromSyllabus() {
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("courseId", courseId);
    fd.set("sourceText", plan);
    const file = fileRef.current?.files?.[0];
    if (file) fd.set("syllabusFile", file);

    setExtractStatus(null);
    extractStart(async () => {
      const res = await previewSyllabusPlan(fd);
      if (res.ok && res.topics.length > 0) {
        setPlan(res.topics.join("\n"));
        setExtractStatus(`Знайдено тем: ${res.topics.length}`);
      } else {
        const msg: Record<string, string> = {
          file_too_large: "Файл завеликий",
          unsupported_file: "Підтримуються PDF або текстові файли",
          no_topics: "Не знайшов теми. Спробуйте вставити фрагмент таблиці вручну.",
        };
        setExtractStatus(msg[res.error ?? ""] ?? "Не вдалося витягнути теми");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-violet-200 bg-violet-50/50"
    >
      <form
        action={(fd) => {
          setStatus(null);
          start(async () => {
            const res = await createModuleFromPlan(fd);
            if (res?.ok) {
              setStatus(`Створено занять: ${res.count}`);
              onDone();
            } else {
              setStatus(res?.error === "empty" ? "Вставте хоча б одну тему" : "Не вдалося створити план");
            }
          });
        }}
        className="space-y-3 p-4"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="orderIndex" value={orderIndex} />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-violet-900">
              <Wand2 className="h-4 w-4" /> Конструктор з плану курсу
            </p>
            <p className="mt-0.5 text-xs text-violet-700/70">
              Вставте список тем з PDF або силабуса. Кожен рядок стане темою з набором занять.
            </p>
          </div>
          <button type="button" onClick={onDone}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-violet-400 hover:bg-white hover:text-violet-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="space-y-2">
            <input
              name="moduleTitle"
              className="input-control w-full bg-white text-sm font-semibold"
              placeholder={`Назва модуля, напр. Змістовий модуль ${orderIndex + 1}`}
            />
            <div className="flex flex-col gap-2 rounded-xl border border-violet-100 bg-white/70 p-2 sm:flex-row sm:items-center">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,text/plain,.pdf,.txt,.md"
                className="min-w-0 flex-1 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700 hover:file:bg-violet-200"
              />
              <button
                type="button"
                onClick={extractFromSyllabus}
                disabled={extractPending}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60"
              >
                <FileText className="h-3.5 w-3.5" />
                {extractPending ? "Читаю…" : "Витягнути теми"}
              </button>
            </div>
            {extractStatus && (
              <p className="px-1 text-xs font-medium text-violet-700">{extractStatus}</p>
            )}
            <textarea
              name="plan"
              required
              rows={8}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full resize-none rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none transition focus:ring-2 focus:ring-violet-300"
              placeholder={[
                "Вступ до машинного навчання",
                "Підготовка даних",
                "Лінійна регресія",
                "Класифікація біомедичних даних",
              ].join("\n")}
            />
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-violet-500">Патерн занять</span>
              <select
                name="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="input-control w-full bg-white text-xs"
              >
                <option value="lecture_practical">Лекція + практична</option>
                <option value="lecture_seminar">Лекція + семінар</option>
                <option value="lecture_practical_self">Лекція + практична + самостійна</option>
                <option value="lecture_seminar_self">Лекція + семінар + самостійна</option>
                <option value="lecture_only">Тільки лекції</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-violet-500">Лекц.</span>
                <input name="lectureHours" type="number" min={0} step={0.5} defaultValue={2} className="input-control w-full bg-white text-xs" />
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-violet-500">Практ.</span>
                <input name="practicalHours" type="number" min={0} step={0.5} defaultValue={2} className="input-control w-full bg-white text-xs" />
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-violet-500">Сем.</span>
                <input name="seminarHours" type="number" min={0} step={0.5} defaultValue={2} className="input-control w-full bg-white text-xs" />
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-violet-500">Сам.</span>
                <input name="selfStudyHours" type="number" min={0} step={0.5} defaultValue={2} className="input-control w-full bg-white text-xs" />
              </label>
            </div>

            <div className="rounded-lg border border-violet-100 bg-white/80 px-3 py-2 text-xs text-violet-700">
              1 рядок = {previewCount} занят{previewCount === 1 ? "тя" : "тя"} в модулі
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-violet-100 pt-3">
          <span className="text-xs font-medium text-violet-700">{status}</span>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {pending ? "Створюю…" : "Створити модуль і заняття"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function AiSyllabusImporter({ projectId, locale, course, onDone }: {
  projectId: string;
  locale: string;
  course: LearningCourse;
  onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sourceText, setSourceText] = useState("");
  const [plan, setPlan] = useState<AiCoursePlanPreview | null>(null);
  const [selectedModules, setSelectedModules] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const [updateCourse, setUpdateCourse] = useState(true);
  const [pending, start] = useTransition();

  function runPreview() {
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", course._id ?? "");
    fd.set("courseTitle", course.title);
    fd.set("sourceText", sourceText);
    const file = fileRef.current?.files?.[0];
    if (file) fd.set("syllabusFile", file);

    setStatus(null);
    start(async () => {
      const res = await previewAiSyllabusCourse(fd);
      if (res.ok && res.plan) {
        const incoming = res.plan as AiCoursePlanPreview;
        setPlan(incoming);
        setSelectedModules(new Set(incoming.modules.map((_, i) => i)));
        setStatus("AI підготував структуру. Перевірте та оберіть модулі перед створенням.");
      } else {
        setStatus(AI_ERRORS[res.error ?? ""] ?? `AI імпорт не вдався: ${res.error || "unknown"}`);
      }
    });
  }

  function toggleModule(index: number) {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  }

  function applyPlan() {
    if (!plan) return;
    const filteredPlan = { ...plan, modules: plan.modules.filter((_, i) => selectedModules.has(i)) };
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", course._id ?? "");
    fd.set("planJson", JSON.stringify(filteredPlan));
    fd.set("updateCourse", String(updateCourse));
    setStatus(null);
    start(async () => {
      const res = await applyAiSyllabusCourse(fd);
      if (res.ok) {
        setStatus(`Створено елементів: ${res.count}`);
        onDone();
      } else {
        setStatus(`Не вдалося створити курс: ${res.error || "unknown"}`);
      }
    });
  }

  const selectedPlan = plan
    ? { ...plan, modules: plan.modules.filter((_, i) => selectedModules.has(i)) }
    : null;

  const totalSessions = selectedPlan?.modules.reduce(
    (sum, module) => sum + module.topics.reduce(
      (s, topic) => s + topic.sessions.filter((session) => session.hours > 0).length,
      0,
    ),
    0,
  ) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm"
    >
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-emerald-950">
              <Wand2 className="h-4 w-4" /> AI імпорт силабуса
            </p>
            <p className="mt-0.5 text-xs text-emerald-800/70">
              PDF/DOCX/XLSX/CSV/TXT → повна структура курсу з модулями, темами, заняттями й оцінюванням.
            </p>
          </div>
          <button type="button" onClick={onDone}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-emerald-500 hover:bg-white hover:text-emerald-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-2">
            <div className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-white/80 p-2 sm:flex-row sm:items-center">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,application/pdf,text/plain"
                className="min-w-0 flex-1 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-800 hover:file:bg-emerald-200"
              />
              <button
                type="button"
                onClick={runPreview}
                disabled={pending}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {pending ? "Аналізую…" : "AI проаналізувати"}
              </button>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={8}
              className="w-full resize-none rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none transition focus:ring-2 focus:ring-emerald-300"
              placeholder="Або вставте сюди текст силабуса / таблицю з темами, годинами та формами контролю..."
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <input
                type="checkbox"
                checked={updateCourse}
                onChange={(e) => setUpdateCourse(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              Оновити назву, код, кредити, викладача й нотатки курсу з силабуса
            </label>
            {status && <p className="text-xs font-semibold text-emerald-800">{status}</p>}
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-3">
            {plan ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Preview</p>
                  <h3 className="mt-1 text-sm font-black text-slate-900">{plan.course.title}</h3>
                  <p className="text-xs text-slate-500">
                    {plan.course.code || "без коду"} · {plan.course.credits} ECTS · Сем. {plan.course.semester}
                    {plan.course.semesterEnd > plan.course.semester ? `-${plan.course.semesterEnd}` : ""}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-slate-50 p-2 text-center">
                    <p className="text-lg font-black text-slate-900">{selectedModules.size}/{plan.modules.length}</p>
                    <p className="text-[10px] text-slate-400">модулів</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-center">
                    <p className="text-lg font-black text-slate-900">{totalSessions}</p>
                    <p className="text-[10px] text-slate-400">занять</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-center">
                    <p className="text-lg font-black text-slate-900">{plan.assessments.length}</p>
                    <p className="text-[10px] text-slate-400">оцінок</p>
                  </div>
                </div>
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {plan.modules.map((module, index) => {
                    const checked = selectedModules.has(index);
                    const sessCount = module.topics.reduce(
                      (s, t) => s + t.sessions.filter((se) => se.hours > 0).length, 0,
                    );
                    return (
                      <label
                        key={`${module.title}-${index}`}
                        className={clsx(
                          "flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition",
                          checked
                            ? "border-emerald-200 bg-emerald-50/60"
                            : "border-slate-100 bg-white opacity-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(index)}
                          className="mt-0.5 h-3.5 w-3.5 accent-emerald-600"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold leading-snug text-slate-800">{module.title}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {module.topics.length} тем · {sessCount} занять
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={applyPlan}
                  disabled={pending || selectedModules.size === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {pending ? "Створюю…" : `Створити курс (${selectedModules.size} мод.)`}
                </button>
              </div>
            ) : (
              <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
                <FileText className="h-8 w-8 text-emerald-200" />
                <p className="mt-2 text-sm font-bold text-slate-600">Preview з&apos;явиться тут</p>
                <p className="mt-1 max-w-64 text-xs text-slate-400">
                  AI не записує нічого в журнал, доки ви не підтвердите створення.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
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

function TopicRow({ topic, projectId, locale, canManage, linkedAssessments, hideTitle = false }: {
  topic: LearningTopic; projectId: string; locale: string; canManage: boolean;
  linkedAssessments: LearningAssessment[]; hideTitle?: boolean;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [pending, start] = useTransition();
  const isSelfStudy = topic.topicType === "self_study";

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
      "group overflow-hidden rounded-lg border-l-4 border border-slate-100 bg-white transition-all",
      hideTitle && "bg-slate-50/70",
      TOPIC_LEFT_BORDER[topic.topicType],
      topic.isCompleted && !isSelfStudy && "opacity-60",
      isSelfStudy && "bg-slate-50/80"
    )}>
      <div className={clsx("flex min-w-0 items-center gap-2.5 overflow-hidden px-3", hideTitle ? "py-1.5" : "py-2")}>
        {isSelfStudy ? (
          <span
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100"
            title="Самостійна робота враховується тільки в годинах"
          />
        ) : (
          <button type="button" onClick={canManage ? toggleComplete : undefined} disabled={pending}
            className={clsx(
              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition",
              topic.isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"
            )}>
            {topic.isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
          </button>
        )}

        <span className={clsx("flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", TOPIC_TYPE_COLORS[topic.topicType])}>
          {TOPIC_TYPE_LABELS[topic.topicType].slice(0, 4)}
        </span>

        {hideTitle ? (
          <span className="block min-w-0 flex-1 overflow-hidden truncate whitespace-nowrap text-xs text-slate-500">
            {topic.description || topic.notes || TOPIC_TYPE_LABELS[topic.topicType]}
          </span>
        ) : (
          <span className={clsx("block min-w-0 flex-1 overflow-hidden truncate whitespace-nowrap text-sm",
            topic.isCompleted && !isSelfStudy ? "text-slate-400 line-through" : "font-medium text-slate-800",
            isSelfStudy && "text-slate-500")}>
            {topic.title}
          </span>
        )}

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
          <div className="hidden shrink-0 gap-1 sm:flex">
            {linkedAssessments.map((a) => (
              <span key={a._id} className={clsx("rounded border px-1 py-0.5 text-[9px] font-semibold", ASSESSMENT_TYPE_BADGE[a.assessmentType])}>
                {ASSESSMENT_TYPE_LABELS[a.assessmentType].slice(0, 3)}
              </span>
            ))}
          </div>
        )}

        {canManage && (
          <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
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

function TopicBundleCard({ bundle, projectId, locale, canManage, assessments }: {
  bundle: TopicBundle;
  projectId: string;
  locale: string;
  canManage: boolean;
  assessments: LearningAssessment[];
}) {
  const [open, setOpen] = useState(true);
  const actionableTopics = bundle.topics.filter(isActionableTopic);
  const done = actionableTopics.filter((topic) => topic.isCompleted).length;
  const totalHours = bundle.topics.reduce((sum, topic) => sum + (topic.durationHours || 0), 0);
  const pct = actionableTopics.length ? Math.round((done / actionableTopics.length) * 100) : 0;
  const typeSummary = (Object.keys(TOPIC_TYPE_LABELS) as TopicType[])
    .map((type) => {
      const typeTopics = bundle.topics.filter((topic) => topic.topicType === type);
      const hours = typeTopics.reduce((sum, topic) => sum + (topic.durationHours || 0), 0);
      return { type, count: typeTopics.length, hours };
    })
    .filter((item) => item.count > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50"
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </motion.div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="block min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{bundle.title}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={clsx("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-indigo-400")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-medium text-slate-400">
              {actionableTopics.length > 0 ? `${done}/${actionableTopics.length}` : "години"}
            </span>
          </div>
        </div>

        <div className="hidden max-w-[46%] shrink-0 items-center justify-end gap-1 overflow-hidden md:flex">
          {typeSummary.map(({ type, count, hours }) => (
            <span
              key={type}
              className={clsx(
                "inline-flex min-w-0 shrink items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold",
                TOPIC_TYPE_COLORS[type],
              )}
            >
              <span className="truncate">{TOPIC_TYPE_LABELS[type]}{count > 1 ? ` x${count}` : ""}{hours > 0 ? ` · ${hours}г` : ""}</span>
            </span>
          ))}
          {totalHours > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
              <Clock className="h-2.5 w-2.5" />{totalHours}г
            </span>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2">
              <div className="mb-2 flex flex-wrap gap-1 md:hidden">
                {typeSummary.map(({ type, count, hours }) => (
                  <span key={type} className={clsx("rounded-full px-2 py-1 text-[10px] font-bold", TOPIC_TYPE_COLORS[type])}>
                    {TOPIC_TYPE_LABELS[type]}{count > 1 ? ` x${count}` : ""}{hours > 0 ? ` · ${hours}г` : ""}
                  </span>
                ))}
              </div>
              <div className="grid gap-1.5">
                {bundle.topics.map((topic) => (
                  <TopicRow
                    key={topic._id}
                    topic={topic}
                    projectId={projectId}
                    locale={locale}
                    canManage={canManage}
                    hideTitle
                    linkedAssessments={assessments.filter((a) => a.linkedTopicIds.includes(topic._id ?? ""))}
                  />
                ))}
              </div>
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
  const topicBundles = groupTopicBundles(modTopics);
  const modAssessments = assessments.filter((a) => a.linkedModuleIds.includes(mod._id ?? ""));
  const actionableModTopics = modTopics.filter(isActionableTopic);
  const done = actionableModTopics.filter((t) => t.isCompleted).length;
  const pct = actionableModTopics.length ? Math.round((done / actionableModTopics.length) * 100) : 0;
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
              {topicBundles.length > 0 && <span className="text-[11px] text-slate-400">{topicBundles.length} тем</span>}
              {totalHours > 0 && <span className="text-[11px] text-slate-400">{totalHours}г</span>}
            </div>
            {actionableModTopics.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={clsx("h-full rounded-full transition-all duration-500",
                    pct === 100 ? "bg-emerald-500" : "bg-indigo-400")} style={{ width: `${pct}%` }} />
                </div>
                <span className="flex-shrink-0 text-[11px] text-slate-400">{done}/{actionableModTopics.length} занять</span>
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
            <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 space-y-2">
              {modTopics.length === 0 && !addingTopic && (
                <p className="py-1 text-xs italic text-slate-400">Теми ще не додані</p>
              )}
              {topicBundles.map((bundle) => (
                <TopicBundleCard
                  key={bundle.key}
                  bundle={bundle}
                  projectId={projectId}
                  locale={locale}
                  canManage={canManage}
                  assessments={assessments}
                />
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
        {pct !== null ? (
          <span className="tabular-nums text-xs font-semibold text-slate-500">{Math.round(pct)}%</span>
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
              <th className="px-2 py-2.5 text-center">%</th>
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
                <td colSpan={4} className="py-3 pl-4 pr-2">
                  <p className="text-xs font-bold text-slate-600">
                    Підсумкова оцінка {totalWeight > 0 ? `· зважена (${totalWeight}%)` : "· середня"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{gradeToNational(finalGrade)}</p>
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

function CourseView({ course, modules, topics, assessments, sessions, assignments, projectId, locale, canManage, isDissertation, academic }: {
  course: LearningCourse; modules: LearningModule[]; topics: LearningTopic[];
  assessments: LearningAssessment[]; sessions: LearningSession[]; assignments: LearningAssignment[];
  projectId: string; locale: string; canManage: boolean; isDissertation?: boolean;
  academic: ReturnType<typeof resolveAcademicSettings>;
}) {
  const [tab, setTab] = useState<CourseTab>("modules");
  const [addingModule, setAddingModule] = useState(false);
  const [buildingFromPlan, setBuildingFromPlan] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
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
                  {courseSemesterLabel(course)}
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
          {courseTopics.filter(isActionableTopic).length > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>
                  {courseTopics.filter((t) => isActionableTopic(t) && t.isCompleted).length}/{courseTopics.filter(isActionableTopic).length} тем завершено
                </span>
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
              {courseMods.length === 0 && !addingModule && !buildingFromPlan && !aiImportOpen ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <Layers className="h-5 w-5 text-indigo-400" />
                  </div>
                  <p className="font-semibold text-slate-700">Немає модулів</p>
                  <p className="mt-1 text-sm text-slate-400">Тематичні блоки курсу</p>
                  {canManage && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button type="button" onClick={() => setAiImportOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                        <FileText className="h-4 w-4" /> AI імпорт силабуса
                      </button>
                      <button type="button" onClick={() => setBuildingFromPlan(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition">
                        <Wand2 className="h-4 w-4" /> Створити з плану
                      </button>
                      <button type="button" onClick={() => setAddingModule(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                        <Plus className="h-4 w-4" /> Додати вручну
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {aiImportOpen && (
                    <AiSyllabusImporter
                      projectId={projectId}
                      locale={locale}
                      course={course}
                      onDone={() => setAiImportOpen(false)}
                    />
                  )}
                  {buildingFromPlan && (
                    <PlanModuleBuilder
                      projectId={projectId}
                      locale={locale}
                      courseId={course._id ?? ""}
                      orderIndex={courseMods.length}
                      onDone={() => setBuildingFromPlan(false)}
                    />
                  )}
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
                    <div className="grid gap-2 lg:grid-cols-3">
                      <button type="button" onClick={() => setAiImportOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 py-3 text-sm text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition">
                        <FileText className="h-4 w-4" /> AI імпорт силабуса
                      </button>
                      <button type="button" onClick={() => setBuildingFromPlan(true)}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 py-3 text-sm text-violet-500 hover:border-violet-300 hover:bg-violet-50 transition">
                        <Wand2 className="h-4 w-4" /> Створити модуль з плану
                      </button>
                      <button type="button" onClick={() => setAddingModule(true)}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition">
                        <Plus className="h-4 w-4" /> Додати порожній модуль
                      </button>
                    </div>
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
            <CourseSettingsForm
              key={course._id}
              course={course}
              projectId={projectId}
              locale={locale}
              academic={academic}
              onDelete={() => {
                const fd = new FormData();
                fd.set("locale", locale); fd.set("projectId", projectId); fd.set("courseId", course._id ?? "");
                start(() => removeCourse(fd));
              }}
            />
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

// ── Course settings form (auto-save) ─────────────────────────────────────────

function CourseSettingsForm({
  course, projectId, locale, academic, onDelete,
}: {
  course: LearningCourse;
  projectId: string;
  locale: string;
  academic: ReturnType<typeof resolveAcademicSettings>;
  onDelete: () => void;
}) {
  const [title, setTitle]           = useState(course.title);
  const [code, setCode]             = useState(course.code ?? "");
  const [instructor, setInstructor] = useState(course.instructor ?? "");
  const [semester, setSemester]     = useState(String(course.semester ?? 1));
  const [semesterEnd, setSemEnd]    = useState(String(courseSemesterEnd(course)));
  const [year, setYear]             = useState(String(course.year ?? 1));
  const [credits, setCredits]       = useState(String(course.credits ?? 3));
  const [courseType, setCourseType] = useState<CourseType>(course.courseType ?? "mandatory");
  const [status, setStatus]         = useState<CourseStatus>(course.status ?? "planned");
  const [finalScore, setFinalScore] = useState(course.finalScore != null ? String(course.finalScore) : "");
  const [note, setNote]             = useState(course.note ?? "");
  const [saveState, setSaveState]   = useState<"idle" | "saving" | "saved">("idle");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  // Always-current snapshot for the debounce closure
  const latestRef = useRef({ title, code, instructor, semester, semesterEnd, year, credits, courseType, status, finalScore, note });
  latestRef.current = { title, code, instructor, semester, semesterEnd, year, credits, courseType, status, finalScore, note };

  function doSave(patch: Partial<typeof latestRef.current> = {}) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const v = { ...latestRef.current, ...patch };
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", course._id ?? "");
    fd.set("title", v.title);
    fd.set("code", v.code);
    fd.set("instructor", v.instructor);
    fd.set("semester", v.semester);
    fd.set("semesterEnd", v.semesterEnd);
    fd.set("year", v.year);
    fd.set("credits", v.credits);
    fd.set("courseType", v.courseType);
    fd.set("status", v.status);
    fd.set("finalScore", v.finalScore);
    fd.set("finalGrade", v.finalScore ? scoreToGrade(Number(v.finalScore)) : "");
    fd.set("note", v.note);
    setSaveState("saving");
    startTransition(async () => {
      await saveCourse(fd);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    });
  }

  function schedule(patch: Partial<typeof latestRef.current> = {}) {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Merge patch into latest so concurrent keystrokes accumulate correctly
    latestRef.current = { ...latestRef.current, ...patch };
    timerRef.current = setTimeout(() => doSave(), 800);
  }

  // When score changes: auto-derive status (only if currently "active")
  function handleScoreChange(raw: string) {
    const n = Number(raw);
    let nextStatus = status;
    if (raw && !isNaN(n)) {
      if (n >= 60 && status === "active") nextStatus = "completed";
      else if (n < 60 && n > 0 && status === "active") nextStatus = "failed";
    }
    setFinalScore(raw);
    if (nextStatus !== status) setStatus(nextStatus);
    schedule({ finalScore: raw, status: nextStatus });
  }

  const scoreNum = finalScore ? Number(finalScore) : null;
  const autoGrade = scoreNum != null && !isNaN(scoreNum) ? scoreToGrade(scoreNum) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Settings className="h-4 w-4 text-slate-400" /> Параметри курсу
        </p>
        <span className={clsx(
          "text-[11px] transition-opacity",
          saveState === "saving" && "animate-pulse text-slate-400",
          saveState === "saved" && "flex items-center gap-1 font-semibold text-emerald-600",
          saveState === "idle" && "opacity-0",
        )}>
          {saveState === "saving" && "Збереження…"}
          {saveState === "saved" && <><Check className="h-3 w-3 inline" /> Збережено</>}
        </span>
      </div>
      <div className="px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Назва курсу</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); schedule({ title: e.target.value }); }}
              className="input-control w-full text-base font-medium"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Код</label>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value); schedule({ code: e.target.value }); }}
              className="input-control w-full font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Викладач</label>
            <input
              value={instructor}
              onChange={(e) => { setInstructor(e.target.value); schedule({ instructor: e.target.value }); }}
              className="input-control w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <CoursePeriodPicker
              academic={academic}
              year={Number(year) || 1}
              semester={Number(semester) || 1}
              semesterEnd={Number(semesterEnd) || Number(semester) || 1}
              onYearChange={(value) => { setYear(String(value)); schedule({ year: String(value) }); }}
              onSemesterChange={(value) => { setSemester(String(value)); schedule({ semester: String(value) }); }}
              onSemesterEndChange={(value) => { setSemEnd(String(value)); schedule({ semesterEnd: String(value) }); }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Кредити (ECTS)</label>
            <input
              type="number" value={credits}
              onChange={(e) => { setCredits(e.target.value); schedule({ credits: e.target.value }); }}
              className="input-control w-full"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Тип</label>
            <select
              value={courseType}
              onChange={(e) => { setCourseType(e.target.value as CourseType); schedule({ courseType: e.target.value as CourseType }); }}
              className="input-control w-full"
            >
              {(Object.keys(COURSE_TYPE_LABELS) as CourseType[]).map((t) => (
                <option key={t} value={t}>{COURSE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Статус</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as CourseStatus); schedule({ status: e.target.value as CourseStatus }); }}
              className="input-control w-full"
            >
              {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map((s) => (
                <option key={s} value={s}>{COURSE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Підсумковий бал
              {autoGrade && (
                <span className="ml-2 font-bold" style={{ color: gradeColor(autoGrade) }}>
                  → {autoGrade} · {gradeToNational(autoGrade)}
                </span>
              )}
            </label>
            <input
              type="number" min={0} max={100}
              value={finalScore}
              onChange={(e) => handleScoreChange(e.target.value)}
              placeholder="—"
              className="input-control w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Нотатки</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => { setNote(e.target.value); schedule({ note: e.target.value }); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white resize-none transition"
            />
          </div>
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Видалити курс
          </button>
        </div>
      </div>
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
  const semesterGroups = Array.from(new Set(courses.flatMap(courseCoveredSemesters))).sort((a, b) => a - b);

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
        const semCourses = courses.filter((c) => courseCoversSemester(c, sem));
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
  isDissertation, learningProfile,
}: {
  projectId: string; locale: string; canManage: boolean; initialCourseId: string | null;
  courses: LearningCourse[]; modules: LearningModule[]; topics: LearningTopic[];
  assessments: LearningAssessment[]; sessions: LearningSession[]; assignments: LearningAssignment[];
  isDissertation?: boolean;
  learningProfile?: LearningProfile;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    initialCourseId ?? (courses.length > 0 ? (courses[0]._id ?? null) : null),
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);

  const selectedCourse = courses.find((c) => c._id === selectedCourseId) ?? null;
  const academic = resolveAcademicSettings(learningProfile?.academicSettings);
  const maxSemester = courses.length ? Math.max(...courses.map(courseSemesterEnd)) : 1;
  const yearGroups = Array.from(new Set(courses.map((c) => c.year ?? Math.ceil(c.semester / 2)))).sort((a, b) => a - b);

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
              {yearGroups.length === 0 && (
                <p className="px-2 py-4 text-xs text-center text-slate-400">Курси ще не додані</p>
              )}
              {yearGroups.map((yr) => {
                const yearCourses = courses.filter((c) => (c.year ?? Math.ceil(c.semester / 2)) === yr);
                const semGroups = Array.from(new Set(yearCourses.flatMap(courseCoveredSemesters))).sort((a, b) => a - b);
                return (
                  <div key={yr}>
                    <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                      {yr} рік навч.
                    </p>
                    {semGroups.map((sem) => (
                      <div key={sem} className="mb-2">
                        <p className="mb-0.5 px-1 text-[10px] font-semibold text-slate-400">Семестр {sem}</p>
                        <div className="space-y-0.5">
                          {yearCourses.filter((c) => courseCoversSemester(c, sem)).map((course) => (
                            <CourseItem key={course._id} course={course} topics={topics} assessments={assessments}
                              isActive={selectedCourseId === course._id}
                              onClick={() => { setSelectedCourseId(course._id ?? null); setShowCalendar(false); }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
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
                isDissertation={isDissertation} academic={academic} />
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
            semesterHint={maxSemester + 1}
            learningProfile={learningProfile}
            onClose={() => setShowAddCourse(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
