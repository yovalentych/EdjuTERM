"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar, Check, ChevronDown, ClipboardList, Link2, Plus, Sparkles, X,
} from "lucide-react";
import clsx from "clsx";
import type {
  AssignmentStatus, AssignmentType, LearningAssignment, LearningModule, LearningSession, LearningTopic,
} from "@/lib/schemas";
import { addAssignment, removeAssignmentAction, saveAssignmentAction } from "@/app/learning-actions";
import { gradeColor, scoreToGrade } from "@/lib/learning-utils";

const ASSIGN_TYPE_LABELS: Record<AssignmentType, string> = {
  homework: "Домашнє завдання",
  essay: "Реферат",
  notes: "Конспект",
  report: "Звіт",
  project: "Проєкт",
  problem_set: "Задачі",
  lab_report: "Лаб. звіт",
  reading: "Читання",
  presentation: "Презентація",
  other: "Інше",
};

const ASSIGN_TYPE_COLORS: Record<AssignmentType, string> = {
  homework: "bg-amber-100 text-amber-700 border-amber-200",
  essay: "bg-purple-100 text-purple-700 border-purple-200",
  notes: "bg-indigo-100 text-indigo-700 border-indigo-200",
  report: "bg-blue-100 text-blue-700 border-blue-200",
  project: "bg-violet-100 text-violet-700 border-violet-200",
  problem_set: "bg-orange-100 text-orange-700 border-orange-200",
  lab_report: "bg-teal-100 text-teal-700 border-teal-200",
  reading: "bg-sky-100 text-sky-700 border-sky-200",
  presentation: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-slate-100 text-slate-500 border-slate-200",
};

const ASSIGN_TYPE_BAR: Record<AssignmentType, string> = {
  homework: "bg-amber-400",
  essay: "bg-purple-500",
  notes: "bg-indigo-500",
  report: "bg-blue-500",
  project: "bg-violet-500",
  problem_set: "bg-orange-400",
  lab_report: "bg-teal-500",
  reading: "bg-sky-500",
  presentation: "bg-pink-500",
  other: "bg-slate-400",
};

const ASSIGN_STATUS_LABELS: Record<AssignmentStatus, string> = {
  assigned: "Задано",
  in_progress: "Виконується",
  submitted: "Здано",
  graded: "Зараховано",
  late: "Прострочено",
  missing: "Не здано",
};

const ASSIGN_STATUS_COLORS: Record<AssignmentStatus, string> = {
  assigned: "text-blue-600 bg-blue-50 border-blue-200",
  in_progress: "text-amber-600 bg-amber-50 border-amber-200",
  submitted: "text-indigo-600 bg-indigo-50 border-indigo-200",
  graded: "text-emerald-700 bg-emerald-50 border-emerald-200",
  late: "text-orange-600 bg-orange-50 border-orange-200",
  missing: "text-rose-600 bg-rose-50 border-rose-200",
};

const STATUS_CYCLE_ICON: Record<AssignmentStatus, string> = {
  assigned: "○",
  in_progress: "⟳",
  submitted: "↑",
  graded: "✓",
  late: "!",
  missing: "!",
};

function fmtDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysLeft(dueDate: string) {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function moduleMap(modules: LearningModule[]) {
  return new Map(modules.map((mod) => [mod._id ?? "", mod]));
}

function topicMap(topics: LearningTopic[]) {
  return new Map(topics.map((topic) => [topic._id ?? "", topic]));
}

function sessionLabel(session: LearningSession, topicMapById: Map<string, LearningTopic>) {
  const topic = topicMapById.get(session.topicId);
  const title = topic?.title || session.title || ASSIGN_TYPE_LABELS.homework;
  const date = session.date ? new Date(session.date).toLocaleDateString("uk-UA") : "Без дати";
  return `${date} · ${title}`;
}

function AddAssignmentModal({ courseId, projectId, locale, sessions, topics, modules, onClose }: {
  courseId: string;
  projectId: string;
  locale: string;
  sessions: LearningSession[];
  topics: LearningTopic[];
  modules: LearningModule[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [selectedType, setSelectedType] = useState<AssignmentType>("homework");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const topicLookup = topicMap(topics);
  const moduleLookup = moduleMap(modules);
  const selectedSession = sessions.find((session) => session._id === selectedSessionId);
  const derivedTopic = selectedSession?.topicId ? topicLookup.get(selectedSession.topicId) : undefined;
  const selectedTopic = topicLookup.get(selectedTopicId) ?? derivedTopic;
  const selectedModule = selectedTopic ? moduleLookup.get(selectedTopic.moduleId) : undefined;
  const visibleSessions = sessions.filter((session) => !selectedTopicId || session.topicId === selectedTopicId);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-violet-900 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Нове завдання</h3>
                <p className="text-xs text-violet-200">Спочатку оберіть тему або заняття, а потім додайте саму роботу.</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <form
            action={(fd) => {
              fd.set("assignmentType", selectedType);
              fd.set("topicId", selectedTopic?._id ?? "");
              fd.set("moduleId", selectedTopic?.moduleId ?? "");
              fd.set("sessionId", selectedSessionId);
              start(async () => {
                await addAssignment(fd);
                onClose();
              });
            }}
            className="space-y-5 px-6 py-5"
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="courseId" value={courseId} />

            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Тема курсу</label>
                <select
                  value={selectedTopicId}
                  onChange={(event) => {
                    setSelectedTopicId(event.target.value);
                    if (selectedSessionId) {
                      const linkedSession = sessions.find((session) => session._id === selectedSessionId);
                      if (linkedSession && linkedSession.topicId !== event.target.value) {
                        setSelectedSessionId("");
                      }
                    }
                  }}
                  className="input-control w-full"
                >
                  <option value="">— можна без теми, але краще прив'язати —</option>
                  {topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Заняття</label>
                <select
                  value={selectedSessionId}
                  onChange={(event) => {
                    const nextSessionId = event.target.value;
                    setSelectedSessionId(nextSessionId);
                    const nextSession = sessions.find((session) => session._id === nextSessionId);
                    if (nextSession?.topicId) {
                      setSelectedTopicId(nextSession.topicId);
                    }
                  }}
                  className="input-control w-full"
                >
                  <option value="">— без конкретного заняття —</option>
                  {visibleSessions.map((session) => (
                    <option key={session._id} value={session._id}>
                      {sessionLabel(session, topicLookup)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Контекст завдання</span>
                {selectedModule && (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {selectedModule.title}
                  </span>
                )}
                {selectedTopic && (
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {selectedTopic.title}
                  </span>
                )}
                {selectedSession && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {selectedSession.date ? new Date(selectedSession.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }) : "Без дати"}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Завдання буде видно разом із відповідною темою та заняттям, тому далі менше ручної синхронізації.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Назва *</label>
              <input
                name="title"
                required
                autoFocus
                className="input-control w-full text-base font-medium"
                placeholder={selectedTopic ? `Завдання до теми “${selectedTopic.title}”` : "Назва завдання"}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Тип роботи</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(Object.keys(ASSIGN_TYPE_LABELS) as AssignmentType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={clsx(
                      "rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition",
                      selectedType === type
                        ? clsx(ASSIGN_TYPE_COLORS[type], "ring-2 ring-indigo-300 ring-offset-1")
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {ASSIGN_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Дедлайн</label>
                <input name="dueDate" type="date" className="input-control w-full" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Макс. балів</label>
                <input name="maxScore" type="number" min={0} max={1000} defaultValue={100} className="input-control w-full" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Умова / опис</label>
              <textarea
                name="description"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Коротка умова, очікуваний формат, посилання на матеріали"
              />
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button type="button" onClick={onClose} className="control px-4 py-2 text-sm">Скасувати</button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {pending ? "..." : <><Plus className="h-4 w-4" />Додати завдання</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AssignmentCard({ assignment, sessions, topics, modules, projectId, locale, canManage }: {
  assignment: LearningAssignment;
  sessions: LearningSession[];
  topics: LearningTopic[];
  modules: LearningModule[];
  projectId: string;
  locale: string;
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, start] = useTransition();

  const session = sessions.find((item) => item._id === assignment.sessionId);
  const topicLookup = topicMap(topics);
  const moduleLookup = moduleMap(modules);
  const topic = topicLookup.get(assignment.topicId || session?.topicId || "");
  const mod = moduleLookup.get(assignment.moduleId || topic?.moduleId || "");
  const days = daysLeft(assignment.dueDate);
  const pct = assignment.achievedScore !== null && assignment.maxScore > 0
    ? (assignment.achievedScore / assignment.maxScore) * 100
    : null;
  const grade = pct !== null ? scoreToGrade(pct) : null;
  const isOverdue = assignment.status !== "submitted" && assignment.status !== "graded" && days !== null && days < 0;

  const cycleStatus = () => {
    const order: AssignmentStatus[] = ["assigned", "in_progress", "submitted", "graded"];
    const idx = order.indexOf(assignment.status);
    const next = order[(idx + 1) % order.length];
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("assignmentId", assignment._id ?? "");
    fd.set("title", assignment.title);
    fd.set("description", assignment.description);
    fd.set("assignmentType", assignment.assignmentType);
    fd.set("dueDate", assignment.dueDate);
    fd.set("submittedDate", assignment.submittedDate);
    fd.set("maxScore", String(assignment.maxScore));
    fd.set("achievedScore", assignment.achievedScore !== null ? String(assignment.achievedScore) : "");
    fd.set("status", next);
    fd.set("notes", assignment.notes);
    fd.set("feedback", assignment.feedback);
    fd.set("sessionId", assignment.sessionId ?? "");
    fd.set("topicId", assignment.topicId ?? "");
    fd.set("moduleId", assignment.moduleId ?? "");
    start(() => saveAssignmentAction(fd));
  };

  return (
    <motion.div
      layout
      className={clsx(
        "group overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
        assignment.status === "graded" ? "border-emerald-200" : isOverdue || assignment.status === "missing" ? "border-rose-200" : "border-slate-200",
      )}
    >
      <div className={clsx("h-1 w-full", ASSIGN_TYPE_BAR[assignment.assignmentType])} />

      <div className="flex items-start gap-3 px-4 pb-3 pt-3">
        <motion.button
          type="button"
          onClick={canManage ? cycleStatus : undefined}
          disabled={pending}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className={clsx("mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-black transition", ASSIGN_STATUS_COLORS[assignment.status])}
          title={`${ASSIGN_STATUS_LABELS[assignment.status]} — клік для зміни`}
        >
          {STATUS_CYCLE_ICON[assignment.status]}
        </motion.button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={clsx("inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold", ASSIGN_TYPE_COLORS[assignment.assignmentType])}>
              {ASSIGN_TYPE_LABELS[assignment.assignmentType]}
            </span>
            {mod && (
              <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {mod.title}
              </span>
            )}
            <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 truncate text-left text-sm font-bold text-slate-800 transition hover:text-indigo-700">
              {assignment.title}
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {assignment.dueDate && (
              <span className={clsx(
                "flex items-center gap-1 text-xs font-medium",
                days !== null && days < 0 ? "text-rose-600" : days !== null && days <= 3 ? "text-orange-500" : "text-slate-400",
              )}>
                <Calendar className="h-3 w-3" />
                {fmtDate(assignment.dueDate)}
                {days !== null && days > 0 && (
                  <span className={clsx("rounded-full px-1.5 py-0.5 text-[10px] font-bold", days <= 3 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500")}>
                    {days} дн.
                  </span>
                )}
                {days !== null && days < 0 && (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                    прострочено
                  </span>
                )}
              </span>
            )}
            {topic && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Link2 className="h-3 w-3" />
                {topic.title}
              </span>
            )}
            {session && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {session.date ? new Date(session.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }) : "Без дати"}
              </span>
            )}
            <span className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-semibold", ASSIGN_STATUS_COLORS[assignment.status])}>
              {ASSIGN_STATUS_LABELS[assignment.status]}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-start gap-1">
          {grade && (
            <span className={clsx("rounded-xl border px-2 py-0.5 text-xs font-black", gradeColor(grade))}>
              {assignment.achievedScore}/{assignment.maxScore} {grade}
            </span>
          )}
          <div className="flex flex-col gap-0.5 opacity-0 transition group-hover:opacity-100">
            <button type="button" onClick={() => setExpanded((value) => !value)} className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-slate-600">
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.div>
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  const fd = new FormData();
                  fd.set("locale", locale);
                  fd.set("projectId", projectId);
                  fd.set("assignmentId", assignment._id ?? "");
                  start(() => removeAssignmentAction(fd));
                }}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {pct !== null && (
        <div className="mx-4 mb-2 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className={clsx("h-full rounded-full transition-all duration-700", pct >= 60 ? "bg-emerald-500" : "bg-rose-400")} style={{ width: `${pct}%` }} />
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
              {assignment.description && (
                <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {assignment.description}
                </p>
              )}

              <div className="mb-4 flex flex-wrap gap-2">
                {mod && <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{mod.title}</span>}
                {topic && <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{topic.title}</span>}
                {session && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{sessionLabel(session, topicLookup)}</span>}
              </div>

              {canManage && (
                <form
                  action={(fd) => {
                    fd.set("sessionId", assignment.sessionId ?? "");
                    fd.set("topicId", assignment.topicId ?? "");
                    fd.set("moduleId", assignment.moduleId ?? "");
                    start(async () => {
                      await saveAssignmentAction(fd);
                      setExpanded(false);
                    });
                  }}
                  className="space-y-3"
                >
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="assignmentId" value={assignment._id ?? ""} />

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Назва</label>
                    <input name="title" defaultValue={assignment.title} required className="input-control w-full py-1.5 text-xs font-semibold" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Тип роботи</label>
                      <select name="assignmentType" defaultValue={assignment.assignmentType} className="input-control w-full py-1.5 text-xs">
                        {(Object.keys(ASSIGN_TYPE_LABELS) as AssignmentType[]).map((type) => (
                          <option key={type} value={type}>{ASSIGN_TYPE_LABELS[type]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Дедлайн</label>
                      <input name="dueDate" type="date" defaultValue={assignment.dueDate} className="input-control w-full py-1.5 text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Макс. балів</label>
                      <input name="maxScore" type="number" min={0} max={1000} defaultValue={assignment.maxScore} className="input-control w-full py-1.5 text-xs font-bold" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Умова / опис</label>
                    <textarea
                      name="description"
                      defaultValue={assignment.description}
                      rows={2}
                      placeholder="Умова, очікуваний формат, посилання"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Статус</label>
                        <select name="status" defaultValue={assignment.status} className="input-control w-full py-1.5 text-xs">
                          {(Object.keys(ASSIGN_STATUS_LABELS) as AssignmentStatus[]).map((status) => (
                            <option key={status} value={status}>{ASSIGN_STATUS_LABELS[status]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Отримано балів</label>
                        <input
                          name="achievedScore"
                          type="number"
                          min={0}
                          max={assignment.maxScore}
                          defaultValue={assignment.achievedScore ?? ""}
                          placeholder="—"
                          className="input-control w-full py-1.5 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Дата здачі</label>
                        <input name="submittedDate" type="date" defaultValue={assignment.submittedDate} className="input-control w-full py-1.5 text-xs" />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Відгук / коментар викладача</label>
                      <input name="feedback" defaultValue={assignment.feedback} placeholder="Коментар викладача…" className="input-control w-full py-1.5 text-xs" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700">
                      <Check className="h-3.5 w-3.5" /> Зберегти
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AssignmentInsights({ topics, assignments }: {
  topics: LearningTopic[];
  assignments: LearningAssignment[];
}) {
  const linkedTopicIds = new Set(assignments.map((assignment) => assignment.topicId).filter(Boolean));
  const topicsWithoutAssignments = topics.filter((topic) => !linkedTopicIds.has(topic._id ?? ""));
  const contextlessAssignments = assignments.filter((assignment) => !assignment.topicId && !assignment.sessionId).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">Логіка журналу</p>
          <p className="text-xs text-slate-500">Завдання мають бути прив’язані до тем або конкретних занять, інакше журнал втрачає навчальний контекст.</p>
        </div>
        {contextlessAssignments > 0 && (
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
            {contextlessAssignments} без прив'язки
          </span>
        )}
      </div>

      {topicsWithoutAssignments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {topicsWithoutAssignments.slice(0, 6).map((topic) => (
            <span key={topic._id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {topic.title}
            </span>
          ))}
          {topicsWithoutAssignments.length > 6 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              +{topicsWithoutAssignments.length - 6} ще без завдань
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function AssignmentsPanel({ courseId, projectId, locale, canManage, assignments, sessions, topics, modules }: {
  courseId: string;
  projectId: string;
  locale: string;
  canManage: boolean;
  assignments: LearningAssignment[];
  sessions: LearningSession[];
  topics: LearningTopic[];
  modules: LearningModule[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AssignmentType | "all">("all");

  const courseSessions = sessions.filter((session) => session.courseId === courseId);
  const allCourseAssignments = assignments.filter((assignment) => assignment.courseId === courseId);
  const courseAssignments = allCourseAssignments
    .filter((assignment) => statusFilter === "all" || assignment.status === statusFilter)
    .filter((assignment) => typeFilter === "all" || assignment.assignmentType === typeFilter)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const graded = allCourseAssignments.filter((assignment) => assignment.achievedScore !== null && assignment.maxScore > 0);
  const avgScore = graded.length
    ? Math.round(graded.reduce((sum, assignment) => sum + (assignment.achievedScore! / assignment.maxScore) * 100, 0) / graded.length)
    : null;
  const missing = allCourseAssignments.filter((assignment) =>
    assignment.status !== "submitted" && assignment.status !== "graded" && assignment.dueDate && new Date(assignment.dueDate) < new Date(),
  ).length;

  return (
    <div className="space-y-4">
      {allCourseAssignments.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Завдань", value: allCourseAssignments.length, tone: "text-indigo-600 bg-indigo-50" },
            { label: "Прив'язаних", value: allCourseAssignments.filter((assignment) => !!assignment.topicId || !!assignment.sessionId).length, tone: "text-sky-600 bg-sky-50" },
            { label: "Середній бал", value: avgScore !== null ? `${avgScore}` : "—", tone: "text-amber-600 bg-amber-50" },
            { label: "Прострочено", value: missing, tone: missing > 0 ? "text-rose-600 bg-rose-50" : "text-slate-400 bg-slate-50" },
          ].map(({ label, value, tone }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className={clsx("mx-auto flex h-10 w-10 items-center justify-center rounded-2xl", tone)}>
                <ClipboardList className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <AssignmentInsights topics={topics} assignments={allCourseAssignments} />

      <div className="flex flex-wrap gap-1.5">
        {(["all", "assigned", "in_progress", "submitted", "graded", "late", "missing"] as (AssignmentStatus | "all")[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              statusFilter === status ? "border-indigo-500 bg-indigo-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
            )}
          >
            {status === "all" ? "Всі статуси" : ASSIGN_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={clsx(
            "rounded-full border px-3 py-1 text-xs font-semibold transition",
            typeFilter === "all" ? "border-slate-700 bg-slate-700 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300",
          )}
        >
          Всі типи
        </button>
        {(Object.keys(ASSIGN_TYPE_LABELS) as AssignmentType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              typeFilter === type ? ASSIGN_TYPE_COLORS[type] : "border-slate-200 text-slate-500 hover:border-slate-300",
            )}
          >
            {ASSIGN_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {courseAssignments.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
            <span className="text-2xl">📝</span>
          </div>
          <p className="font-bold text-slate-700">Немає завдань</p>
          <p className="mt-1 text-sm text-slate-400">Додавайте ДЗ, реферати, звіти та прив'язуйте їх до тем курсу.</p>
          {canManage && (
            <button type="button" onClick={() => setShowModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Додати завдання
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {courseAssignments.map((assignment, index) => (
              <motion.div key={assignment._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ delay: index * 0.04 }}>
                <AssignmentCard
                  assignment={assignment}
                  sessions={courseSessions}
                  topics={topics}
                  modules={modules}
                  projectId={projectId}
                  locale={locale}
                  canManage={canManage}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {canManage && courseAssignments.length > 0 && (
        <motion.button
          type="button"
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.01 }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
        >
          <Plus className="h-4 w-4" /> Додати завдання
        </motion.button>
      )}

      <AnimatePresence>
        {showModal && (
          <AddAssignmentModal
            courseId={courseId}
            projectId={projectId}
            locale={locale}
            sessions={courseSessions}
            topics={topics}
            modules={modules}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
