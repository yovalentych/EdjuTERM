"use client";

import { useTransition, useState } from "react";
import { Award, ClipboardList, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type { CourseMember, LearningAssessment, LearningCourse, AssessmentType, AssessmentStatus } from "@/lib/schemas";
import { scoreToGrade, gradeColor, gradeToNational } from "@/lib/learning-utils";
import { addAssessment, saveAssessment, removeAssessment } from "@/app/learning-actions";

// ── label maps ────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, { uk: string; en: string }> = {
  exam:           { uk: "Іспит",       en: "Exam" },
  zalik:          { uk: "Залік",       en: "Pass/Fail" },
  midterm:        { uk: "Модульна КР", en: "Midterm" },
  test:           { uk: "Тест",        en: "Test" },
  colloquium:     { uk: "Колоквіум",   en: "Colloquium" },
  seminar:        { uk: "Семінар",     en: "Seminar" },
  practical_work: { uk: "Практична",   en: "Practical" },
  essay:          { uk: "Реферат",     en: "Essay" },
  project:        { uk: "Проєкт",      en: "Project" },
  coursework:     { uk: "Курсова",     en: "Coursework" },
  lab_work:       { uk: "Лаб. робота", en: "Lab work" },
  notes_check:    { uk: "Конспект",    en: "Notes check" },
  oral:           { uk: "Усна",        en: "Oral" },
  presentation:   { uk: "Презентація", en: "Presentation" },
  other:          { uk: "Інше",        en: "Other" },
};

const STATUS_META: Record<string, { uk: string; color: string }> = {
  upcoming:       { uk: "Очікує",     color: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress:    { uk: "В процесі",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  completed:      { uk: "Виконано",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  missed:         { uk: "Пропущ.",    color: "bg-rose-50 text-rose-700 border-rose-200" },
  retake_needed:  { uk: "Перездача",  color: "bg-amber-50 text-amber-700 border-amber-200" },
  passed_retake:  { uk: "Перезд. OK", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

// ── main component ────────────────────────────────────────────────────────────
export function AssessmentsView({
  locale,
  course,
  assessments,
  members,
  canManage,
  projectId,
}: {
  locale: "uk" | "en";
  course: LearningCourse | null;
  assessments: LearningAssessment[];
  members: CourseMember[];
  canManage: boolean;
  projectId: string;
}) {
  const isUk = locale === "uk";
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LearningAssessment | null>(null);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(a: LearningAssessment) { setEditing(a); setModalOpen(true); }

  if (!course) {
    return (
      <LiquidCard tint="amber" className="text-center">
        <h3 className="text-sm font-bold text-slate-900">
          {isUk ? "Оберіть курс" : "Pick a course"}
        </h3>
      </LiquidCard>
    );
  }

  const sorted = assessments.slice().sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const graded = assessments.filter((a) => a.achievedScore != null && a.maxScore > 0);
  const weighted = graded.filter((a) => a.weight > 0);
  const totalWeight = weighted.reduce((s, a) => s + a.weight, 0);
  const weightedScore = totalWeight > 0
    ? Math.round(weighted.reduce((s, a) => s + ((a.achievedScore! / a.maxScore) * 100 * a.weight), 0) / totalWeight)
    : graded.length > 0
      ? Math.round(graded.reduce((s, a) => s + (a.achievedScore! / a.maxScore) * 100, 0) / graded.length)
      : null;
  const finalGrade = weightedScore !== null ? scoreToGrade(weightedScore) : null;

  return (
    <>
      <LiquidCard tint="violet" className="overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-violet-50/60 via-white to-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              {isUk ? "Оцінювання курсу" : "Course assessments"}
            </h2>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
              {assessments.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {finalGrade && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">{gradeToNational(finalGrade)}</span>
                <span className={`rounded-lg border px-2 py-0.5 text-xs font-black ${gradeColor(finalGrade)}`}>
                  {finalGrade}
                </span>
                <span className="font-mono text-xs font-bold text-slate-600">{weightedScore}/100</span>
              </div>
            )}
            {canManage && (
              <button type="button" onClick={openAdd} className="liquid-cta text-xs">
                <Plus className="h-3.5 w-3.5" />
                {isUk ? "Додати" : "Add"}
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {assessments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <ClipboardList className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-bold text-slate-500">
              {isUk ? "Оцінювань ще немає" : "No assessments yet"}
            </p>
            {canManage && (
              <button type="button" onClick={openAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700">
                <Plus className="h-3.5 w-3.5" />
                {isUk ? "Додати перше оцінювання" : "Add first assessment"}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/40">
                  <Th>{isUk ? "Назва" : "Title"}</Th>
                  <Th>{isUk ? "Тип" : "Type"}</Th>
                  <Th align="right">{isUk ? "Бал" : "Score"}</Th>
                  <Th align="right">{isUk ? "Вага" : "Weight"}</Th>
                  <Th align="right">{isUk ? "Дедлайн" : "Due"}</Th>
                  <Th align="right">{isUk ? "Статус" : "Status"}</Th>
                  {canManage && <Th align="right" />}
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => (
                  <AssessmentRow
                    key={a._id}
                    assessment={a}
                    isUk={isUk}
                    canManage={canManage}
                    locale={locale}
                    projectId={projectId}
                    onEdit={() => openEdit(a)}
                  />
                ))}
              </tbody>
              {finalGrade && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200/80 bg-violet-50/40">
                    <td colSpan={2} className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-600">
                        {isUk ? "Підсумкова оцінка" : "Final grade"}
                        {totalWeight > 0 ? ` · ${isUk ? "зважена" : "weighted"} (${totalWeight}%)` : ""}
                      </p>
                      <p className="text-[11px] text-slate-400">{gradeToNational(finalGrade)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`rounded-lg border px-3 py-1 text-sm font-black ${gradeColor(finalGrade)}`}>
                        {weightedScore}/100
                      </span>
                    </td>
                    <td colSpan={canManage ? 3 : 2} />
                    <td className="px-4 py-3 text-right">
                      <span className={`rounded-lg border px-3 py-1 text-sm font-black ${gradeColor(finalGrade)}`}>
                        {finalGrade}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </LiquidCard>

      {modalOpen && course && (
        <AssessmentModal
          locale={locale}
          projectId={projectId}
          courseId={course._id!}
          assessment={editing}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function AssessmentRow({
  assessment: a, isUk, canManage, locale, projectId, onEdit,
}: {
  assessment: LearningAssessment;
  isUk: boolean;
  canManage: boolean;
  locale: string;
  projectId: string;
  onEdit: () => void;
}) {
  const [pending, start] = useTransition();
  const t = TYPE_LABELS[a.assessmentType] ?? { uk: a.assessmentType, en: a.assessmentType };
  const pct = a.achievedScore != null && a.maxScore > 0
    ? Math.round((a.achievedScore / a.maxScore) * 100) : null;
  const sm = STATUS_META[a.status] ?? { uk: a.status, color: "bg-slate-50 text-slate-600 border-slate-200" };

  function handleDelete() {
    if (!confirm(isUk ? `Видалити «${a.title}»?` : `Delete "${a.title}"?`)) return;
    const fd = new FormData();
    fd.set("assessmentId", a._id!);
    fd.set("projectId", projectId);
    fd.set("locale", locale);
    start(() => removeAssessment(fd));
  }

  return (
    <tr className="border-b border-slate-100/70 hover:bg-slate-50/30">
      <td className="px-4 py-2.5">
        <p className="font-bold text-slate-900">{a.title}</p>
      </td>
      <td className="px-4 py-2.5">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {isUk ? t.uk : t.en}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums">
        {a.achievedScore != null ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-bold text-slate-900">{a.achievedScore}/{a.maxScore}</span>
            {pct !== null && <span className="text-[10px] text-slate-400">{pct}%</span>}
          </div>
        ) : (
          <span className="text-sm text-slate-400">— /{a.maxScore}</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">{a.weight}%</td>
      <td className="px-4 py-2.5 text-right">
        <span className="font-mono text-xs text-slate-500">{a.dueDate || "—"}</span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sm.color}`}>
          <Award className="h-2.5 w-2.5" />
          {isUk ? sm.uk : a.status}
        </span>
      </td>
      {canManage && (
        <td className="px-3 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <button type="button" onClick={onEdit}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={handleDelete} disabled={pending}
              className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const ASSESSMENT_TYPES = Object.entries(TYPE_LABELS).map(([id, labels]) => ({ id, ...labels }));
const STATUSES = Object.entries(STATUS_META).map(([id, meta]) => ({ id, ...meta }));

function AssessmentModal({
  locale, projectId, courseId, assessment, onClose,
}: {
  locale: "uk" | "en";
  projectId: string;
  courseId: string;
  assessment: LearningAssessment | null;
  onClose: () => void;
}) {
  const isUk = locale === "uk";
  const [pending, start] = useTransition();
  const isEdit = assessment !== null;

  const [title, setTitle] = useState(assessment?.title ?? "");
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(assessment?.assessmentType ?? "test");
  const [dueDate, setDueDate] = useState(assessment?.dueDate ?? "");
  const [completedDate, setCompletedDate] = useState(assessment?.completedDate ?? "");
  const [maxScore, setMaxScore] = useState(String(assessment?.maxScore ?? 100));
  const [weight, setWeight] = useState(String(assessment?.weight ?? 10));
  const [achievedScore, setAchievedScore] = useState(
    assessment?.achievedScore != null ? String(assessment.achievedScore) : "",
  );
  const [status, setStatus] = useState<AssessmentStatus>(assessment?.status ?? "upcoming");
  const [notes, setNotes] = useState(assessment?.notes ?? "");

  function handleSubmit() {
    if (!title.trim()) return;
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", courseId);
    fd.set("title", title.trim());
    fd.set("assessmentType", assessmentType);
    fd.set("dueDate", dueDate);
    fd.set("completedDate", completedDate);
    fd.set("maxScore", maxScore);
    fd.set("weight", weight);
    fd.set("achievedScore", achievedScore);
    fd.set("status", status);
    fd.set("notes", notes);
    if (isEdit) {
      fd.set("assessmentId", assessment._id!);
      start(async () => { await saveAssessment(fd); onClose(); });
    } else {
      start(async () => { await addAssessment(fd); onClose(); });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
              <ClipboardList className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isEdit
                ? (isUk ? "Редагувати оцінювання" : "Edit assessment")
                : (isUk ? "Нове оцінювання" : "New assessment")}
            </h3>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-160px)] overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Назва *" : "Title *"}
            </label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="input-control w-full text-sm font-medium"
              placeholder={isUk ? "н-р, Модульна контрольна №1" : "e.g. Midterm exam #1"}
            />
          </div>

          {/* Type grid */}
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Тип" : "Type"}
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
              {ASSESSMENT_TYPES.map(({ id, uk, en }) => (
                <button key={id} type="button" onClick={() => setAssessmentType(id as AssessmentType)}
                  className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold transition ${
                    assessmentType === id
                      ? "border-violet-300 bg-violet-50 text-violet-800"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}>
                  {isUk ? uk : en}
                </button>
              ))}
            </div>
          </div>

          {/* Score + Weight row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isUk ? "Макс. балів" : "Max score"}
              </label>
              <input type="number" min={0} max={1000} value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="input-control w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isUk ? "Набрано" : "Achieved"}
              </label>
              <input type="number" min={0} max={Number(maxScore)} value={achievedScore}
                onChange={(e) => setAchievedScore(e.target.value)}
                placeholder="—"
                className="input-control w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isUk ? "Вага (%)" : "Weight (%)"}
              </label>
              <input type="number" min={0} max={100} value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-control w-full" />
            </div>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isUk ? "Дедлайн" : "Due date"}
              </label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="input-control w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isUk ? "Дата здачі" : "Completed"}
              </label>
              <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)}
                className="input-control w-full" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Статус" : "Status"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(({ id, uk, color }) => (
                <button key={id} type="button" onClick={() => setStatus(id as AssessmentStatus)}
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                    status === id ? color : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                  }`}>
                  {isUk ? uk : id}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isUk ? "Нотатки" : "Notes"}
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="input-control w-full resize-none text-sm"
              placeholder={isUk ? "Додаткова інформація…" : "Additional info…"} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
            {isUk ? "Скасувати" : "Cancel"}
          </button>
          <button type="button" onClick={handleSubmit} disabled={pending || !title.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-60">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
            {isEdit ? (isUk ? "Зберегти" : "Save") : (isUk ? "Створити" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
