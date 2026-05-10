"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Clock, FileText, Layers, MapPin, Plus, Sparkles, Users, X,
} from "lucide-react";
import clsx from "clsx";
import type {
  AttendanceStatus, LearningModule, LearningSession, LearningTopic, TopicType,
} from "@/lib/schemas";
import { addSession, removeSession, saveSession } from "@/app/learning-actions";
import { gradeColor, scoreToGrade } from "@/lib/learning-utils";

const SESSION_TYPE_LABELS: Record<TopicType, string> = {
  lecture: "Лекція",
  seminar: "Семінар",
  practical: "Практична",
  lab: "Лабораторна",
  self_study: "Самостійна",
  consultation: "Консультація",
};

const SESSION_TYPE_COLORS: Record<TopicType, string> = {
  lecture: "bg-indigo-100 text-indigo-700 border-indigo-200",
  seminar: "bg-purple-100 text-purple-700 border-purple-200",
  practical: "bg-amber-100 text-amber-700 border-amber-200",
  lab: "bg-emerald-100 text-emerald-700 border-emerald-200",
  self_study: "bg-slate-100 text-slate-600 border-slate-200",
  consultation: "bg-sky-100 text-sky-700 border-sky-200",
};

const SESSION_TYPE_BAR: Record<TopicType, string> = {
  lecture: "bg-indigo-500",
  seminar: "bg-purple-500",
  practical: "bg-amber-500",
  lab: "bg-emerald-500",
  self_study: "bg-slate-400",
  consultation: "bg-sky-500",
};

const ATT_CONFIG: Record<AttendanceStatus, { label: string; short: string; cls: string }> = {
  present: { label: "Присутній", short: "✓", cls: "bg-emerald-500 text-white border-emerald-600" },
  absent: { label: "Відсутній", short: "✗", cls: "bg-rose-500 text-white border-rose-600" },
  excused: { label: "Поважна причина", short: "~", cls: "bg-amber-400 text-white border-amber-500" },
  late: { label: "Запізнився", short: "≈", cls: "bg-orange-400 text-white border-orange-500" },
};

function fmtDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
}

function fmtDay(s: string) {
  if (!s) return "";
  return ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][new Date(s).getDay()];
}

function moduleMap(modules: LearningModule[]) {
  return new Map(modules.map((mod) => [mod._id ?? "", mod]));
}

function topicMap(topics: LearningTopic[]) {
  return new Map(topics.map((topic) => [topic._id ?? "", topic]));
}

function AttToggle({ current, onChange, disabled }: {
  current: AttendanceStatus | null;
  onChange: (value: AttendanceStatus | null) => void;
  disabled?: boolean;
}) {
  const cycle: (AttendanceStatus | null)[] = [null, "present", "absent", "excused", "late"];
  const next = () => {
    const idx = cycle.indexOf(current);
    onChange(cycle[(idx + 1) % cycle.length]);
  };

  if (!current) {
    return (
      <button
        type="button"
        onClick={next}
        disabled={disabled}
        className="h-8 w-8 rounded-full border-2 border-dashed border-slate-200 text-xs text-slate-300 transition hover:border-slate-400 hover:text-slate-500"
        title="Відмітити відвідуваність"
      >
        ?
      </button>
    );
  }

  const cfg = ATT_CONFIG[current];
  return (
    <motion.button
      type="button"
      onClick={next}
      disabled={disabled}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className={clsx("h-8 w-8 rounded-full border-2 text-sm font-bold transition", cfg.cls)}
      title={cfg.label}
    >
      {cfg.short}
    </motion.button>
  );
}

function GradeCell({ grade, maxScore = 100, onSave, disabled }: {
  grade: number | null;
  maxScore?: number;
  onSave: (value: number | null) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(grade ?? ""));
  const letter = grade !== null ? scoreToGrade((grade / maxScore) * 100) : null;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setEditing(true);
          setValue(String(grade ?? ""));
        }}
        disabled={disabled}
        className={clsx(
          "min-w-[56px] rounded-lg border px-2 py-1 text-center text-xs font-bold transition hover:shadow-sm",
          letter ? gradeColor(letter) : "border-dashed border-slate-200 text-slate-300 hover:border-slate-400",
        )}
      >
        {grade !== null ? `${grade} ${letter}` : "—"}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type="number"
      min={0}
      max={maxScore}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        onSave(value === "" ? null : Math.min(maxScore, Math.max(0, Number(value))));
        setEditing(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setEditing(false);
      }}
      className="w-16 rounded-lg border-2 border-indigo-400 px-1.5 py-0.5 text-center text-xs font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    />
  );
}

function AddSessionRow({ courseId, projectId, locale, modules, topics, orderIndex, onDone }: {
  courseId: string;
  projectId: string;
  locale: string;
  modules: LearningModule[];
  topics: LearningTopic[];
  orderIndex: number;
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const moduleLookup = moduleMap(modules);
  const topicLookup = topicMap(topics);
  const visibleTopics = topics.filter((topic) => !selectedModuleId || topic.moduleId === selectedModuleId);
  const selectedTopic = topicLookup.get(selectedTopicId);
  const selectedModule = selectedTopic ? moduleLookup.get(selectedTopic.moduleId) : moduleLookup.get(selectedModuleId);

  const submit = () => {
    if (!date || !selectedTopic) return;
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", courseId);
    fd.set("orderIndex", String(orderIndex));
    fd.set("date", date);
    fd.set("topicId", selectedTopic._id ?? "");
    fd.set("moduleId", selectedTopic.moduleId);
    fd.set("title", selectedTopic.title);
    fd.set("sessionType", selectedTopic.topicType);
    fd.set("durationHours", String(selectedTopic.durationHours));
    fd.set("startTime", startTime);
    fd.set("endTime", endTime);
    fd.set("location", location);
    fd.set("notes", notes);
    start(async () => {
      await addSession(fd);
      onDone();
    });
  };

  const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <motion.tr initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50/60">
      <td colSpan={8} className="px-4 py-4">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1.6fr_0.9fr]">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Модуль
              </label>
              <select
                value={selectedModuleId}
                onChange={(event) => {
                  setSelectedModuleId(event.target.value);
                  setSelectedTopicId("");
                }}
                className={clsx(inputCls, "w-full")}
              >
                <option value="">Всі модулі</option>
                {modules.map((mod) => (
                  <option key={mod._id} value={mod._id}>{mod.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Тема заняття
              </label>
              <select
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
                className={clsx(inputCls, "w-full")}
              >
                <option value="">Оберіть тему з модулів</option>
                {visibleTopics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {SESSION_TYPE_LABELS[topic.topicType]} · {topic.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Дата
              </label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={clsx(inputCls, "w-full")}
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_0.9fr_0.8fr_1.2fr]">
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={inputCls}
            />
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className={inputCls}
            />
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={inputCls}
              placeholder="Аудиторія / Zoom"
            />
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputCls}
              placeholder="Коротка примітка до заняття"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Підтягнеться з теми:</span>
            {selectedTopic ? (
              <>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {selectedModule?.title ?? "Без модуля"}
                </span>
                <span className={clsx("rounded-full border px-2.5 py-1 text-xs font-semibold", SESSION_TYPE_COLORS[selectedTopic.topicType])}>
                  {SESSION_TYPE_LABELS[selectedTopic.topicType]}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {selectedTopic.durationHours} год.
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-400">Спочатку оберіть тему курсу.</span>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onDone} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50">
              Скасувати
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !selectedTopic || !date}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Збереження..." : "Додати до розкладу"}
            </button>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function SessionRow({ session, topics, modules, projectId, locale, canManage, index }: {
  session: LearningSession;
  topics: LearningTopic[];
  modules: LearningModule[];
  projectId: string;
  locale: string;
  canManage: boolean;
  index: number;
}) {
  const [pending, start] = useTransition();
  const topicLookup = topicMap(topics);
  const moduleLookup = moduleMap(modules);
  const topic = topicLookup.get(session.topicId);
  const mod = moduleLookup.get(session.moduleId || topic?.moduleId || "");

  const patch = (update: Partial<LearningSession>) => {
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("sessionId", session._id ?? "");
    fd.set("title", update.title ?? session.title ?? topic?.title ?? "");
    fd.set("sessionType", update.sessionType ?? session.sessionType ?? topic?.topicType ?? "lecture");
    fd.set("date", update.date ?? session.date);
    fd.set("startTime", update.startTime ?? session.startTime);
    fd.set("endTime", update.endTime ?? session.endTime);
    fd.set("durationHours", String(update.durationHours ?? session.durationHours ?? topic?.durationHours ?? 0));
    fd.set("attendance", "attendance" in update ? (update.attendance ?? "null") : (session.attendance ?? "null"));
    fd.set("grade", "grade" in update ? String(update.grade ?? "") : String(session.grade ?? ""));
    fd.set("notes", update.notes ?? session.notes);
    fd.set("location", update.location ?? session.location);
    fd.set("topicId", update.topicId ?? session.topicId);
    fd.set("moduleId", update.moduleId ?? session.moduleId ?? topic?.moduleId ?? "");
    start(() => saveSession(fd));
  };

  return (
    <tr className={clsx(
      "group border-b border-slate-100 transition-colors hover:bg-indigo-50/40",
      index % 2 === 0 ? "bg-white" : "bg-slate-50/50",
    )}>
      <td className="relative w-12 px-3 py-3 text-center">
        <div className={clsx("absolute left-0 top-0 bottom-0 w-0.5 rounded-full", SESSION_TYPE_BAR[session.sessionType])} />
        <span className="text-xs font-medium text-slate-400">{index + 1}</span>
      </td>

      <td className="px-3 py-3">
        <div className="font-mono text-sm font-bold text-slate-700">{fmtDate(session.date)}</div>
        {!!session.date && (
          <div className={clsx(
            "mt-0.5 inline-block rounded px-1 text-[10px] font-semibold",
            [0, 6].includes(new Date(session.date).getDay()) ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500",
          )}>
            {fmtDay(session.date)}
          </div>
        )}
      </td>

      <td className="px-3 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={clsx("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", SESSION_TYPE_COLORS[session.sessionType])}>
              {SESSION_TYPE_LABELS[session.sessionType]}
            </span>
            {mod && (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {mod.title}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {topic?.title || session.title || "Тема не прив'язана"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            {session.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {session.location}
              </span>
            )}
            {!!topic && <span>джерело: тема курсу</span>}
          </div>
        </div>
      </td>

      <td className="px-3 py-3">
        {session.startTime && session.endTime ? (
          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
            {session.startTime}–{session.endTime}
          </span>
        ) : session.durationHours > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" /> без часу
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      <td className="px-3 py-3 text-center">
        {session.durationHours > 0 ? (
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {session.durationHours}г
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      <td className="px-3 py-3 text-center">
        <AttToggle current={session.attendance} onChange={(value) => patch({ attendance: value })} disabled={!canManage || pending} />
      </td>

      <td className="px-3 py-3 text-center">
        <GradeCell grade={session.grade} onSave={(value) => patch({ grade: value })} disabled={!canManage || pending} />
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
          {session.notes && (
            <span
              title={session.notes}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
            >
              <FileText className="h-3.5 w-3.5" />
            </span>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                const fd = new FormData();
                fd.set("locale", locale);
                fd.set("projectId", projectId);
                fd.set("sessionId", session._id ?? "");
                start(() => removeSession(fd));
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function ScheduleInsights({ topics, sessions, modules }: {
  topics: LearningTopic[];
  sessions: LearningSession[];
  modules: LearningModule[];
}) {
  const moduleLookup = moduleMap(modules);
  const scheduledTopicIds = new Set(sessions.map((session) => session.topicId).filter(Boolean));
  const unscheduledTopics = topics.filter((topic) => !scheduledTopicIds.has(topic._id ?? ""));
  const plannedHours = topics.reduce((sum, topic) => sum + (topic.durationHours || 0), 0);
  const scheduledHours = sessions.reduce((sum, session) => sum + (session.durationHours || 0), 0);
  const attendanceMarked = sessions.filter((session) => session.attendance !== null).length;
  const avgAttendance = sessions.length ? Math.round((attendanceMarked / sessions.length) * 100) : 0;

  const cards = [
    {
      label: "Тем у курсі",
      value: topics.length,
      sub: `${topics.filter((topic) => topic.isCompleted).length} завершено`,
      icon: Layers,
      tone: "text-slate-700 bg-slate-50",
    },
    {
      label: "У розкладі",
      value: scheduledTopicIds.size,
      sub: `${Math.max(topics.length - scheduledTopicIds.size, 0)} ще не рознесено`,
      icon: CalendarDays,
      tone: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Години",
      value: `${scheduledHours}/${plannedHours || 0}`,
      sub: "розклад / план тем",
      icon: Clock,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Відмітки",
      value: `${avgAttendance}%`,
      sub: `${attendanceMarked} занять із фіксацією`,
      icon: Users,
      tone: "text-emerald-700 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, tone }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{sub}</p>
              </div>
              <div className={clsx("flex h-10 w-10 items-center justify-center rounded-2xl", tone)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {unscheduledTopics.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">Є теми, які ще не потрапили в розклад</p>
              <p className="text-xs text-slate-500">Розклад має збиратися з тем курсу, щоб не дублювати зміст вручну.</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-700">
              {unscheduledTopics.length} не заплановано
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {unscheduledTopics.slice(0, 6).map((topic) => (
              <span key={topic._id} className="rounded-full border border-white bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {moduleLookup.get(topic.moduleId)?.title ? `${moduleLookup.get(topic.moduleId)?.title}: ` : ""}
                {topic.title}
              </span>
            ))}
            {unscheduledTopics.length > 6 && (
              <span className="rounded-full border border-white bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                +{unscheduledTopics.length - 6} ще
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ScheduleTab({ courseId, projectId, locale, canManage, sessions, topics, modules }: {
  courseId: string;
  projectId: string;
  locale: string;
  canManage: boolean;
  sessions: LearningSession[];
  topics: LearningTopic[];
  modules: LearningModule[];
}) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<TopicType | "all">("all");

  const allCourseSessions = sessions
    .filter((session) => session.courseId === courseId)
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || ""));

  const courseSessions = allCourseSessions.filter((session) => filter === "all" || session.sessionType === filter);

  return (
    <div className="space-y-4">
      <ScheduleInsights topics={topics} sessions={allCourseSessions} modules={modules} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Формат:</span>
        {(["all", ...Object.keys(SESSION_TYPE_LABELS)] as (TopicType | "all")[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              filter === type
                ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {type === "all" ? "Всі" : SESSION_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-12 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">#</th>
              <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Дата</th>
              <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Тема з модуля</th>
              <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Час</th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Год.</th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Відвід.</th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Оцінка</th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {courseSessions.length === 0 && !adding && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <CalendarDays className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700">Розклад ще не сформований</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Заняття мають створюватися з тем курсу, щоб далі коректно пов’язувати оцінки, відвідування й завдання.
                  </p>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4" /> Додати заняття з теми
                    </button>
                  )}
                </td>
              </tr>
            )}

            <AnimatePresence>
              {courseSessions.map((session, index) => (
                <SessionRow
                  key={session._id}
                  session={session}
                  topics={topics}
                  modules={modules}
                  projectId={projectId}
                  locale={locale}
                  canManage={canManage}
                  index={index}
                />
              ))}
            </AnimatePresence>

            {adding && (
              <AddSessionRow
                courseId={courseId}
                projectId={projectId}
                locale={locale}
                modules={modules}
                topics={topics}
                orderIndex={allCourseSessions.length}
                onDone={() => setAdding(false)}
              />
            )}
          </tbody>
        </table>
      </div>

      {canManage && allCourseSessions.length > 0 && !adding && (
        <motion.button
          type="button"
          onClick={() => setAdding(true)}
          whileHover={{ scale: 1.01 }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
        >
          <Plus className="h-4 w-4" /> Запланувати наступну тему
        </motion.button>
      )}
    </div>
  );
}
