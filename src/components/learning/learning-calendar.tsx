"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Award, BookMarked, MapPin } from "lucide-react";
import clsx from "clsx";
import type {
  LearningCourse, LearningSession, LearningAssessment, LearningAssignment,
  TopicType, AssessmentType, AssignmentType,
} from "@/lib/schemas";

// ── Label maps ────────────────────────────────────────────────────────────────

const SESSION_LABELS: Record<TopicType, string> = {
  lecture: "Лекція", seminar: "Семінар", practical: "Практична",
  lab: "Лабораторна", self_study: "Самостійна", consultation: "Консультація",
};

const SESSION_DOT: Record<TopicType, string> = {
  lecture: "bg-indigo-500", seminar: "bg-purple-500", practical: "bg-amber-500",
  lab: "bg-emerald-500", self_study: "bg-slate-400", consultation: "bg-sky-500",
};

const SESSION_BADGE: Record<TopicType, string> = {
  lecture: "bg-indigo-100 text-indigo-700 border-indigo-200",
  seminar: "bg-purple-100 text-purple-700 border-purple-200",
  practical: "bg-amber-100 text-amber-700 border-amber-200",
  lab: "bg-emerald-100 text-emerald-700 border-emerald-200",
  self_study: "bg-slate-100 text-slate-600 border-slate-200",
  consultation: "bg-sky-100 text-sky-700 border-sky-200",
};

const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  exam: "Іспит", zalik: "Залік", midterm: "Модульна", test: "Тест", colloquium: "Колоквіум",
  seminar: "Семінар", practical_work: "Практична", essay: "Реферат",
  project: "Проєкт", coursework: "Курсова", lab_work: "Лаб. робота",
  notes_check: "Перевірка конспекту", oral: "Усна відповідь",
  presentation: "Презентація", other: "Інше",
};

const ASSIGN_TYPE_LABELS: Record<AssignmentType, string> = {
  homework: "ДЗ", essay: "Реферат", notes: "Конспект",
  report: "Звіт", project: "Проєкт", problem_set: "Задачі",
  lab_report: "Лаб. звіт", reading: "Читання", presentation: "Презентація", other: "Інше",
};

const MONTH_NAMES = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
];

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

// ── Types ─────────────────────────────────────────────────────────────────────

type CalEvent =
  | { kind: "session";    session:    LearningSession;    course?: LearningCourse }
  | { kind: "assessment"; assessment: LearningAssessment; course?: LearningCourse }
  | { kind: "assignment"; assignment: LearningAssignment; course?: LearningCourse };

function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

function buildMap(
  sessions: LearningSession[], assessments: LearningAssessment[],
  assignments: LearningAssignment[], courses: LearningCourse[],
): Map<string, CalEvent[]> {
  const map = new Map<string, CalEvent[]>();
  const add = (ds: string, ev: CalEvent) => {
    if (!ds) return;
    const d = new Date(ds);
    if (isNaN(d.getTime())) return;
    const k = isoDate(d);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(ev);
  };
  for (const s of sessions)    add(s.date,    { kind: "session",    session: s,    course: courses.find((c) => c._id === s.courseId) });
  for (const a of assessments) add(a.dueDate, { kind: "assessment", assessment: a, course: courses.find((c) => c._id === a.courseId) });
  for (const a of assignments) { if (a.dueDate) add(a.dueDate, { kind: "assignment", assignment: a, course: courses.find((c) => c._id === a.courseId) }); }
  return map;
}

// ── Day cell ──────────────────────────────────────────────────────────────────

function DayCell({ date, events, isToday, isCurrentMonth, isSelected, onSelect }: {
  date: Date; events: CalEvent[]; isToday: boolean;
  isCurrentMonth: boolean; isSelected: boolean; onSelect: () => void;
}) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const sessions  = events.filter((e) => e.kind === "session");
  const assessments = events.filter((e) => e.kind === "assessment").length;
  const assignments = events.filter((e) => e.kind === "assignment").length;

  return (
    <motion.button type="button" onClick={onSelect}
      whileHover={{ scale: isCurrentMonth ? 1.03 : 1 }}
      whileTap={{ scale: 0.97 }}
      className={clsx(
        "relative flex min-h-[76px] w-full flex-col rounded-xl border p-1.5 text-left transition-all",
        isSelected
          ? "border-indigo-400 bg-indigo-50 shadow-md ring-2 ring-indigo-200"
          : isToday
            ? "border-indigo-300 bg-indigo-50/60 shadow-sm"
            : isCurrentMonth
              ? isWeekend
                ? "border-rose-100 bg-rose-50/30 hover:border-rose-200 hover:bg-rose-50/60 hover:shadow-sm"
                : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
              : "border-transparent bg-slate-50/30 opacity-30"
      )}>
      {/* Day number */}
      <span className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
        isToday ? "bg-indigo-600 text-white shadow-sm" :
        isWeekend && isCurrentMonth ? "text-rose-500" :
        isCurrentMonth ? "text-slate-700" : "text-slate-400"
      )}>
        {date.getDate()}
      </span>

      {/* Session dots */}
      {sessions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-0.5">
          {sessions.slice(0, 4).map((e, i) => {
            const s = (e as Extract<CalEvent, { kind: "session" }>).session;
            return (
              <span key={i} title={SESSION_LABELS[s.sessionType]}
                className={clsx("h-1.5 w-1.5 flex-shrink-0 rounded-full", SESSION_DOT[s.sessionType])} />
            );
          })}
          {sessions.length > 4 && (
            <span className="text-[8px] leading-none text-slate-400">+{sessions.length - 4}</span>
          )}
        </div>
      )}

      {/* Deadline badges */}
      <div className="mt-auto flex flex-wrap gap-0.5 pt-0.5">
        {assessments > 0 && (
          <span className="rounded bg-rose-100 px-1 py-0.5 text-[9px] font-black text-rose-700 leading-none">
            {assessments > 1 ? `${assessments}КЗ` : "КЗ"}
          </span>
        )}
        {assignments > 0 && (
          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-black text-amber-700 leading-none">
            {assignments > 1 ? `${assignments}ДЗ` : "ДЗ"}
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ── Event detail panel ────────────────────────────────────────────────────────

function EventDetail({ date, events }: { date: Date; events: CalEvent[] }) {
  const dayStr = date.toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" });

  if (events.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-4 py-3.5 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700 capitalize">{dayStr}</p>
        </div>
        <div className="px-4 py-8 text-center">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm text-slate-400">Немає подій на цей день</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-4 py-3.5">
        <p className="text-sm font-bold text-white capitalize">{dayStr}</p>
        <p className="text-xs text-indigo-300">{events.length} {events.length === 1 ? "подія" : "події"}</p>
      </div>
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {events.map((ev, i) => {
          if (ev.kind === "session") {
            const s = ev.session;
            return (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={clsx("h-1.5 w-1.5 flex-shrink-0 rounded-full", SESSION_DOT[s.sessionType])} />
                  <span className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-bold", SESSION_BADGE[s.sessionType])}>
                    {SESSION_LABELS[s.sessionType]}
                  </span>
                  {s.startTime && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />{s.startTime}{s.endTime ? `–${s.endTime}` : ""}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800">{s.title || SESSION_LABELS[s.sessionType]}</p>
                {ev.course && <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.course.title}</p>}
                {s.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />{s.location}
                  </p>
                )}
                {(s.attendance || s.grade !== null) && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    {s.attendance && (
                      <span className={clsx("rounded-full px-2 py-0.5 font-semibold",
                        s.attendance === "present" ? "bg-emerald-100 text-emerald-700" :
                        s.attendance === "absent" ? "bg-rose-100 text-rose-700" :
                        s.attendance === "excused" ? "bg-amber-100 text-amber-700" :
                        "bg-orange-100 text-orange-700")}>
                        {s.attendance === "present" ? "Присутній" :
                         s.attendance === "absent" ? "Відсутній" :
                         s.attendance === "excused" ? "Поважна причина" : "Запізнився"}
                      </span>
                    )}
                    {s.grade !== null && (
                      <span className="font-semibold text-indigo-700">Оцінка: {s.grade}</span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          if (ev.kind === "assessment") {
            const a = ev.assessment;
            return (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                  <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    КЗ · {ASSESSMENT_LABELS[a.assessmentType]}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">{a.title}</p>
                {ev.course && <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.course.title}</p>}
                <div className="mt-1.5 flex gap-3 text-xs text-slate-500">
                  <span>Макс: {a.maxScore} б.</span>
                  {a.weight > 0 && <span>Вага: {a.weight}%</span>}
                  {a.achievedScore !== null && (
                    <span className="font-bold text-emerald-700">Отримано: {a.achievedScore}</span>
                  )}
                </div>
              </div>
            );
          }

          if (ev.kind === "assignment") {
            const a = ev.assignment;
            return (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <BookMarked className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {ASSIGN_TYPE_LABELS[a.assignmentType]}
                  </span>
                  <span className={clsx("text-[10px] font-semibold",
                    a.status === "graded" ? "text-emerald-600" :
                    a.status === "missing" || a.status === "late" ? "text-rose-600" : "text-slate-500")}>
                    {a.status === "assigned" ? "Задано" : a.status === "graded" ? "Зараховано" :
                     a.status === "submitted" ? "Здано" : a.status === "in_progress" ? "Виконується" :
                     a.status === "late" ? "Прострочено" : "Не здано"}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">{a.title}</p>
                {ev.course && <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.course.title}</p>}
                {a.achievedScore !== null && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    Оцінка: {a.achievedScore}/{a.maxScore}
                  </p>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </motion.div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Легенда:</span>
      {(Object.keys(SESSION_LABELS) as TopicType[]).map((t) => (
        <span key={t} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className={clsx("h-2 w-2 rounded-full", SESSION_DOT[t])} />
          {SESSION_LABELS[t]}
        </span>
      ))}
      <span className="flex items-center gap-1 text-xs text-slate-600">
        <span className="rounded bg-rose-100 px-1 text-[10px] font-black text-rose-700">КЗ</span>
        Контрольний захід
      </span>
      <span className="flex items-center gap-1 text-xs text-slate-600">
        <span className="rounded bg-amber-100 px-1 text-[10px] font-black text-amber-700">ДЗ</span>
        Завдання / дедлайн
      </span>
    </div>
  );
}

// ── Main LearningCalendar ─────────────────────────────────────────────────────

export function LearningCalendar({ courses, sessions, assessments, assignments }: {
  courses: LearningCourse[]; sessions: LearningSession[];
  assessments: LearningAssessment[]; assignments: LearningAssignment[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [direction, setDirection] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventMap = buildMap(sessions, assessments, assignments, courses);
  const todayStr = isoDate(today);

  // Build grid
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < startDow; i++) cells.push(new Date(year, month, 1 - (startDow - i)));
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(new Date(year, month + 1, cells.length - startDow - daysInMonth + 1));

  const prevMonth = () => {
    setDirection(-1);
    if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    setDirection(1);
    if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1);
    setSelectedDate(null);
  };
  const goToday = () => {
    setDirection(0);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(today);
  };

  const selectedKey = selectedDate ? isoDate(selectedDate) : null;
  const selectedEvents = selectedKey ? (eventMap.get(selectedKey) ?? []) : [];

  // Month stats
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEntries = Array.from(eventMap.entries()).filter(([k]) => k.startsWith(prefix));
  const mSessions = monthEntries.flatMap(([, e]) => e.filter((x) => x.kind === "session")).length;
  const mAssessments = monthEntries.flatMap(([, e]) => e.filter((x) => x.kind === "assessment")).length;
  const mAssignments = monthEntries.flatMap(([, e]) => e.filter((x) => x.kind === "assignment")).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black text-slate-900">{MONTH_NAMES[month]}</h2>
            <span className="text-lg font-medium text-slate-400">{year}</span>
          </div>
          <div className="mt-1 flex gap-3 text-xs">
            {mSessions > 0 && (
              <span className="flex items-center gap-1 font-semibold text-indigo-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />{mSessions} занять
              </span>
            )}
            {mAssessments > 0 && (
              <span className="flex items-center gap-1 font-semibold text-rose-600">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{mAssessments} КЗ
              </span>
            )}
            {mAssignments > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{mAssignments} завдань
              </span>
            )}
            {mSessions + mAssessments + mAssignments === 0 && (
              <span className="text-slate-400">Немає записів на місяць</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goToday}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition">
            Сьогодні
          </button>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="w-px bg-slate-100" />
            <button type="button" onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50 transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_290px]">
        {/* Calendar grid */}
        <div>
          {/* Week header */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((d, i) => (
              <div key={d} className={clsx(
                "py-1 text-center text-[11px] font-bold uppercase tracking-wider",
                i >= 5 ? "text-rose-400" : "text-slate-400"
              )}>
                {d}
              </div>
            ))}
          </div>

          {/* Animated month grid */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${year}-${month}`}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : d < 0 ? -40 : 0 }),
                center: { opacity: 1, x: 0 },
                exit:  (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="grid grid-cols-7 gap-1"
            >
              {cells.map((date, i) => {
                const key = isoDate(date);
                const events = eventMap.get(key) ?? [];
                return (
                  <DayCell key={i} date={date} events={events}
                    isToday={key === todayStr}
                    isCurrentMonth={date.getMonth() === month}
                    isSelected={selectedKey === key}
                    onSelect={() => setSelectedDate(selectedKey === key ? null : date)} />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Detail panel */}
        <div>
          <AnimatePresence mode="wait">
            {selectedDate ? (
              <EventDetail key={isoDate(selectedDate)} date={selectedDate} events={selectedEvents} />
            ) : (
              <motion.div key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl border-2 border-dashed border-slate-200 px-4 py-10 text-center">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm font-semibold text-slate-500">Оберіть день</p>
                <p className="mt-1 text-xs text-slate-400">для перегляду занять та дедлайнів</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Legend />
    </div>
  );
}
