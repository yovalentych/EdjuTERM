"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban, CalendarClock, CalendarDays, CalendarPlus, Check, Clock, FileText, Layers, MapPin,
  Pencil, Plus, RotateCcw, Sparkles, Trash2, Users, Wand2, X,
} from "lucide-react";
import clsx from "clsx";
import type {
  AttendanceStatus, LearningModule, LearningSession, LearningTopic, SessionStatus, TopicType,
} from "@/lib/schemas";
import {
  addSession, removeSession, saveSession,
  generateRecurringSchedule, cancelSessionAction, rescheduleSessionAction, restoreSessionAction,
  clearCourseSchedule, addUnscheduledTopicsAction,
} from "@/app/learning-actions";
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

const STATUS_ROW_BG: Record<SessionStatus, string> = {
  active: "",
  cancelled: "bg-rose-50/70",
  rescheduled: "bg-amber-50/50",
  makeup: "bg-emerald-50/50",
};

const WEEKDAY_LABELS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

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

// ── Attendance toggle ─────────────────────────────────────────────────────────

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

// ── Grade cell ────────────────────────────────────────────────────────────────

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
        onClick={() => { setEditing(true); setValue(String(grade ?? "")); }}
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

// ── Time select ───────────────────────────────────────────────────────────────

const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      opts.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
})();

function TimeSelect({ value, onChange, className }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [custom, setCustom] = useState(false);
  const isStandard = TIME_OPTIONS.includes(value);

  if (custom) {
    return (
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setCustom(false)}
        autoFocus
        className={className}
      />
    );
  }

  return (
    <select
      value={isStandard ? value : "__nonstandard__"}
      onChange={(e) => {
        if (e.target.value === "__custom__") { setCustom(true); }
        else { onChange(e.target.value); }
      }}
      className={className}
    >
      {!isStandard && value && <option value="__nonstandard__">{value}</option>}
      {TIME_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      <option value="__custom__">Інший час…</option>
    </select>
  );
}

// ── Recurring generator modal ─────────────────────────────────────────────────

function RecurringGeneratorModal({ courseId, projectId, locale, topics, modules, onClose }: {
  courseId: string;
  projectId: string;
  locale: string;
  topics: LearningTopic[];
  modules: LearningModule[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  const [startDate, setStartDate] = useState("");
  const [customCount, setCustomCount] = useState(16);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [durationHours, setDurationHours] = useState(1.5);
  const [location, setLocation] = useState("");
  const [assignMode, setAssignMode] = useState<"single_type" | "sequential" | "alternating">("single_type");
  const [singleType, setSingleType] = useState<TopicType>("lecture");
  const [pattern, setPattern] = useState<TopicType[]>(["lecture", "seminar"]);
  const [result, setResult] = useState<{ count: number } | null>(null);

  const courseTopics = topics.filter((t) => t.courseId === courseId);
  const moduleLookup = moduleMap(modules);

  const sessionCount = assignMode === "sequential" && courseTopics.length > 0
    ? courseTopics.length
    : customCount;

  const previewDates = useMemo(() => {
    if (!startDate || weekdays.length === 0 || sessionCount <= 0) return [];
    const dates: string[] = [];
    const cur = new Date(startDate);
    let safety = 0;
    while (dates.length < sessionCount && safety < 500) {
      if (weekdays.includes(cur.getDay())) dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
      safety++;
    }
    return dates;
  }, [startDate, weekdays, sessionCount]);

  const getPreviewType = (index: number): TopicType => {
    if (assignMode === "sequential" && courseTopics.length > 0) {
      return courseTopics[index % courseTopics.length].topicType;
    }
    if (assignMode === "alternating" && pattern.length > 0) {
      return pattern[index % pattern.length];
    }
    return singleType;
  };

  const getPreviewLabel = (index: number): string => {
    if (assignMode === "sequential" && courseTopics.length > 0) {
      const t = courseTopics[index % courseTopics.length];
      return `${SESSION_TYPE_LABELS[t.topicType]} — ${t.title}`;
    }
    return SESSION_TYPE_LABELS[getPreviewType(index)];
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  const submit = () => {
    if (!startDate || weekdays.length === 0 || sessionCount <= 0) return;
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", courseId);
    fd.set("weekdays", weekdays.join(","));
    fd.set("startDate", startDate);
    fd.set("count", String(sessionCount));
    fd.set("startTime", startTime);
    fd.set("endTime", endTime);
    fd.set("durationHours", String(durationHours));
    fd.set("location", location);
    fd.set("assignMode", assignMode);
    fd.set("singleType", singleType);
    fd.set("pattern", pattern.join(","));
    start(async () => {
      const res = await generateRecurringSchedule(fd);
      if (res?.ok) setResult({ count: res.count ?? 0 });
    });
  };

  const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={result ? onClose : undefined} />
        <motion.div
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <Wand2 className="h-5 w-5 text-indigo-300" /> Генератор регулярного розкладу
                </h3>
                <p className="mt-0.5 text-xs text-indigo-200">Оберіть дні, часовий проміжок і тип занять — заняття створиться автоматично.</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {result ? (
            <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">Готово!</p>
                <p className="mt-1 text-sm text-slate-500">Створено {result.count} занять у розкладі.</p>
              </div>
              <button onClick={onClose} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                Закрити
              </button>
            </div>
          ) : (
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="space-y-6 px-6 py-6">

                {/* Section 1: Schedule pattern */}
                <div>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Регулярність занять</p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {WEEKDAY_ORDER.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        className={clsx(
                          "h-10 w-10 rounded-xl border-2 text-xs font-bold transition",
                          weekdays.includes(day)
                            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300",
                        )}
                      >
                        {WEEKDAY_LABELS[day]}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Перший день занять</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={clsx(inputCls, "w-full")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Кількість занять
                        {assignMode === "sequential" && courseTopics.length > 0 && (
                          <span className="ml-1 font-normal text-indigo-500">(= тем курсу)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={assignMode === "sequential" && courseTopics.length > 0 ? courseTopics.length : customCount}
                        disabled={assignMode === "sequential" && courseTopics.length > 0}
                        onChange={(e) => setCustomCount(Math.max(1, Number(e.target.value)))}
                        className={clsx(inputCls, "w-28", assignMode === "sequential" && courseTopics.length > 0 && "bg-indigo-50 text-indigo-700")}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[auto_auto_auto_1fr]">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Початок</label>
                      <TimeSelect value={startTime} onChange={setStartTime} className={clsx(inputCls, "w-32")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Кінець</label>
                      <TimeSelect value={endTime} onChange={setEndTime} className={clsx(inputCls, "w-32")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Тривалість (год.)</label>
                      <input type="number" min={0.5} max={12} step={0.5} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className={clsx(inputCls, "w-24")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Місце / посилання</label>
                      <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Аудиторія, Zoom…" className={clsx(inputCls, "w-full")} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Topic assignment */}
                <div className="border-t border-slate-100 pt-5">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Призначення тем</p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {([
                      ["single_type", "Один тип для всіх"],
                      ["sequential", "Послідовно з тем курсу"],
                      ["alternating", "Чергування типів"],
                    ] as const).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAssignMode(mode)}
                        className={clsx(
                          "rounded-xl border px-4 py-2 text-xs font-semibold transition",
                          assignMode === mode
                            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {assignMode === "single_type" && (
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(SESSION_TYPE_LABELS) as TopicType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSingleType(type)}
                          className={clsx(
                            "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                            singleType === type ? clsx(SESSION_TYPE_COLORS[type], "ring-2 ring-indigo-300 ring-offset-1") : "border-slate-200 text-slate-500 hover:border-slate-300",
                          )}
                        >
                          {SESSION_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  )}

                  {assignMode === "sequential" && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
                      {courseTopics.length === 0 ? (
                        <p className="text-sm text-rose-600">У курсі немає тем. Спочатку додайте теми в модулях.</p>
                      ) : (
                        <>
                          <p className="mb-2 text-xs font-semibold text-indigo-700">Теми будуть призначатися по черзі:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {courseTopics.slice(0, 8).map((t, i) => (
                              <span key={t._id} className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-bold", SESSION_TYPE_COLORS[t.topicType])}>
                                {i + 1}. {t.title.slice(0, 30)}{t.title.length > 30 ? "…" : ""}
                              </span>
                            ))}
                            {courseTopics.length > 8 && (
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">
                                +{courseTopics.length - 8} ще
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {assignMode === "alternating" && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">Задайте послідовність типів, яка буде циклічно повторюватися:</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {pattern.map((type, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <select
                              value={type}
                              onChange={(e) => setPattern((prev) => prev.map((t, j) => j === i ? e.target.value as TopicType : t))}
                              className={clsx("rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none", SESSION_TYPE_COLORS[type])}
                            >
                              {(Object.keys(SESSION_TYPE_LABELS) as TopicType[]).map((t) => (
                                <option key={t} value={t}>{SESSION_TYPE_LABELS[t]}</option>
                              ))}
                            </select>
                            {pattern.length > 1 && (
                              <button type="button" onClick={() => setPattern((prev) => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-rose-500">
                                <X className="h-3 w-3" />
                              </button>
                            )}
                            {i < pattern.length - 1 && <span className="text-slate-300">→</span>}
                          </div>
                        ))}
                        {pattern.length < 6 && (
                          <button
                            type="button"
                            onClick={() => setPattern((prev) => [...prev, "lecture"])}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Preview */}
                {previewDates.length > 0 && (
                  <div className="border-t border-slate-100 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Попередній перегляд</p>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        {previewDates.length} занять
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-xs">
                        <tbody>
                          {previewDates.slice(0, 30).map((date, i) => {
                            const type = getPreviewType(i);
                            const dayIdx = new Date(date).getDay();
                            return (
                              <tr key={date} className={clsx("border-b border-slate-100 last:border-0", i % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                <td className="w-8 px-2 py-1.5 font-mono text-slate-400">{i + 1}</td>
                                <td className="px-2 py-1.5 font-bold text-slate-700">
                                  {new Date(date).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" })}
                                </td>
                                <td className="px-2 py-1.5">
                                  <span className={clsx(
                                    "inline-block rounded px-1 text-[10px] font-semibold",
                                    [0, 6].includes(dayIdx) ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500",
                                  )}>
                                    {WEEKDAY_LABELS[dayIdx]}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5">
                                  <span className={clsx("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", SESSION_TYPE_COLORS[type])}>
                                    {SESSION_TYPE_LABELS[type]}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5 text-slate-500">
                                  {getPreviewLabel(i)}
                                </td>
                              </tr>
                            );
                          })}
                          {previewDates.length > 30 && (
                            <tr className="bg-slate-50">
                              <td colSpan={5} className="px-3 py-2 text-center text-slate-400">
                                +{previewDates.length - 30} занять не показано
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {previewDates.length === 0 && startDate && weekdays.length > 0 && sessionCount > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    Немає підходящих дат. Перевірте вибрані дні тижня та дату початку.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50">
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending || previewDates.length === 0 || weekdays.length === 0 || !startDate}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4" />
                  {pending ? "Генерація…" : `Згенерувати ${previewDates.length > 0 ? previewDates.length : ""} занять`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Unscheduled topics modal ──────────────────────────────────────────────────

function UnscheduledTopicsModal({ courseId, projectId, locale, unscheduledTopics, modules, existingCount, onClose }: {
  courseId: string;
  projectId: string;
  locale: string;
  unscheduledTopics: LearningTopic[];
  modules: LearningModule[];
  existingCount: number;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(unscheduledTopics.map((t) => t._id ?? "")));
  const [topicDates, setTopicDates] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [location, setLocation] = useState("");
  const [autoStart, setAutoStart] = useState("");
  const [autoWeekdays, setAutoWeekdays] = useState<number[]>([1]);
  const [result, setResult] = useState<{ count: number } | null>(null);

  const moduleLookup = moduleMap(modules);

  const byModule = useMemo(() => {
    const map = new Map<string, LearningTopic[]>();
    for (const t of unscheduledTopics) {
      const list = map.get(t.moduleId) ?? [];
      list.push(t);
      map.set(t.moduleId, list);
    }
    return map;
  }, [unscheduledTopics]);

  const toggleTopic = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleModule = (mId: string) => {
    const mTopics = byModule.get(mId) ?? [];
    const allSelected = mTopics.every((t) => selectedIds.has(t._id ?? ""));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      mTopics.forEach((t) => allSelected ? next.delete(t._id ?? "") : next.add(t._id ?? ""));
      return next;
    });
  };

  const autoFill = () => {
    if (!autoStart || autoWeekdays.length === 0) return;
    const selected = unscheduledTopics.filter((t) => selectedIds.has(t._id ?? ""));
    const dates: string[] = [];
    const cur = new Date(autoStart);
    while (dates.length < selected.length) {
      if (autoWeekdays.includes(cur.getDay())) dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    const next: Record<string, string> = { ...topicDates };
    selected.forEach((t, i) => { next[t._id ?? ""] = dates[i]; });
    setTopicDates(next);
  };

  const readyCount = unscheduledTopics.filter((t) => selectedIds.has(t._id ?? "") && topicDates[t._id ?? ""]).length;

  const submit = () => {
    const entries = unscheduledTopics
      .filter((t) => selectedIds.has(t._id ?? "") && topicDates[t._id ?? ""])
      .map((t) => ({
        topicId: t._id ?? "",
        moduleId: t.moduleId,
        title: t.title,
        sessionType: t.topicType,
        durationHours: t.durationHours,
        date: topicDates[t._id ?? ""],
        startTime,
        endTime,
        location,
      }));
    if (entries.length === 0) return;
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", courseId);
    fd.set("topicsJson", JSON.stringify(entries));
    fd.set("existingCount", String(existingCount));
    start(async () => {
      const res = await addUnscheduledTopicsAction(fd);
      if (res?.ok) setResult({ count: res.count ?? 0 });
    });
  };

  const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={result ? onClose : undefined} />
        <motion.div
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <CalendarPlus className="h-5 w-5" /> Додати теми до розкладу
                </h3>
                <p className="mt-0.5 text-xs text-amber-100">{unscheduledTopics.length} тем без дати — вкажіть дати і вони стануть заняттями.</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white/80 hover:bg-white/30">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {result ? (
            <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-xl font-black text-slate-900">Додано {result.count} занять!</p>
              <button onClick={onClose} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">Закрити</button>
            </div>
          ) : (
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="space-y-5 px-6 py-5">

                {/* Global time/location */}
                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Час і місце (для всіх)</p>
                  <div className="grid gap-2 sm:grid-cols-[auto_auto_1fr]">
                    <TimeSelect value={startTime} onChange={setStartTime} className={inputCls} />
                    <TimeSelect value={endTime} onChange={setEndTime} className={inputCls} />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Аудиторія / Zoom" className={clsx(inputCls, "w-full")} />
                  </div>
                </div>

                {/* Auto-fill */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <p className="mb-3 text-xs font-bold text-indigo-700">Авто-розподіл дат</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">З дати</label>
                      <input type="date" value={autoStart} onChange={(e) => setAutoStart(e.target.value)} className={clsx(inputCls, "text-sm")} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Дні тижня</label>
                      <div className="flex gap-1">
                        {WEEKDAY_ORDER.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setAutoWeekdays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort())}
                            className={clsx("h-9 w-9 rounded-lg border text-xs font-bold transition", autoWeekdays.includes(day) ? "border-indigo-500 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300")}
                          >
                            {WEEKDAY_LABELS[day]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={autoFill}
                      disabled={!autoStart || autoWeekdays.length === 0}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Розподілити →
                    </button>
                  </div>
                </div>

                {/* Topic list by module */}
                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Теми ({selectedIds.size} обрано · {readyCount} з датою)
                  </p>
                  <div className="space-y-2">
                    {Array.from(byModule.entries()).map(([mId, mTopics]) => {
                      const mod = moduleLookup.get(mId);
                      const allSel = mTopics.every((t) => selectedIds.has(t._id ?? ""));
                      const noneSel = mTopics.every((t) => !selectedIds.has(t._id ?? ""));
                      return (
                        <div key={mId} className="overflow-hidden rounded-2xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => toggleModule(mId)}
                            className={clsx(
                              "flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-xs font-bold transition",
                              allSel ? "bg-indigo-50 text-indigo-800" : noneSel ? "bg-slate-50 text-slate-500" : "bg-amber-50 text-amber-800",
                            )}
                          >
                            <span className={clsx(
                              "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 text-[9px] font-black",
                              allSel ? "border-indigo-500 bg-indigo-500 text-white" : noneSel ? "border-slate-300" : "border-amber-500 bg-amber-100 text-amber-700",
                            )}>
                              {allSel ? "✓" : !noneSel ? "–" : ""}
                            </span>
                            {mod?.title ?? "Без модуля"}
                            <span className="ml-auto text-[10px] opacity-60">{mTopics.length} тем</span>
                          </button>
                          <div className="divide-y divide-slate-50">
                            {mTopics.map((t) => {
                              const isSelected = selectedIds.has(t._id ?? "");
                              const hasDate = !!topicDates[t._id ?? ""];
                              return (
                                <div key={t._id} className={clsx("flex items-center gap-3 px-4 py-2.5 transition", isSelected ? "bg-white" : "bg-slate-50/60 opacity-60")}>
                                  <button
                                    type="button"
                                    onClick={() => toggleTopic(t._id ?? "")}
                                    className={clsx(
                                      "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 text-[9px] font-black transition",
                                      isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300",
                                    )}
                                  >
                                    {isSelected ? "✓" : ""}
                                  </button>
                                  <span className={clsx("inline-flex flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold", SESSION_TYPE_COLORS[t.topicType])}>
                                    {SESSION_TYPE_LABELS[t.topicType]}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{t.title}</span>
                                  <span className="flex-shrink-0 text-[10px] text-slate-400">{t.durationHours}г</span>
                                  <input
                                    type="date"
                                    value={topicDates[t._id ?? ""] ?? ""}
                                    onChange={(e) => setTopicDates((prev) => ({ ...prev, [t._id ?? ""]: e.target.value }))}
                                    disabled={!isSelected}
                                    className={clsx(
                                      "w-36 rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400",
                                      hasDate ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500",
                                    )}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50">Скасувати</button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending || readyCount === 0}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {pending ? "Додавання…" : `Додати ${readyCount} занять до розкладу`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Add session row ───────────────────────────────────────────────────────────

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
      <td colSpan={7} className="px-4 py-4">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1.6fr_0.9fr]">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Модуль</label>
              <select
                value={selectedModuleId}
                onChange={(event) => { setSelectedModuleId(event.target.value); setSelectedTopicId(""); }}
                className={clsx(inputCls, "w-full")}
              >
                <option value="">Всі модулі</option>
                {modules.map((mod) => <option key={mod._id} value={mod._id}>{mod.title}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Тема заняття</label>
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
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Дата</label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={clsx(inputCls, "w-full")} />
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_0.9fr_0.8fr_1.2fr]">
            <TimeSelect value={startTime} onChange={setStartTime} className={inputCls} />
            <TimeSelect value={endTime} onChange={setEndTime} className={inputCls} />
            <input type="text" value={location} onChange={(event) => setLocation(event.target.value)} className={inputCls} placeholder="Аудиторія / Zoom" />
            <input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} className={inputCls} placeholder="Коротка примітка до заняття" />
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

// ── Session row ───────────────────────────────────────────────────────────────

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
  const [panel, setPanel] = useState<"none" | "edit" | "cancel" | "reschedule">("none");
  const [shiftMode, setShiftMode] = useState<"drop" | "shift">("drop");
  const [shiftDays, setShiftDays] = useState(7);
  const [shiftSubsequent, setShiftSubsequent] = useState(false);

  const topicLookup = topicMap(topics);
  const moduleLookup = moduleMap(modules);
  const topic = topicLookup.get(session.topicId);
  const mod = moduleLookup.get(session.moduleId || topic?.moduleId || "");

  const status: SessionStatus = (session.status as SessionStatus) ?? "active";
  const isCancelled = status === "cancelled";
  const isRescheduled = status === "rescheduled";

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

  const inputCls = "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400";

  const rowBg = isCancelled
    ? "bg-rose-50/70"
    : isRescheduled
      ? "bg-amber-50/50"
      : panel !== "none"
        ? (panel === "cancel" ? "bg-rose-50/30" : panel === "reschedule" ? "bg-amber-50/30" : "bg-indigo-50/30")
        : index % 2 === 0 ? "bg-white" : "bg-slate-50/50";

  return (
    <>
      <tr className={clsx("group border-b border-slate-100 transition-colors", !isCancelled && "hover:bg-indigo-50/30", rowBg, isCancelled && "opacity-70")}>
        {/* # */}
        <td className="relative w-12 px-3 py-3 text-center">
          <div className={clsx("absolute left-0 top-0 bottom-0 w-0.5 rounded-full", isCancelled ? "bg-rose-400" : SESSION_TYPE_BAR[session.sessionType])} />
          <span className="text-xs font-medium text-slate-400">{index + 1}</span>
        </td>

        {/* Date */}
        <td className="px-3 py-3">
          <div className={clsx("font-mono text-sm font-bold", isCancelled ? "text-slate-400 line-through" : "text-slate-700")}>
            {fmtDate(session.date)}
          </div>
          {!!session.date && (
            <div className={clsx(
              "mt-0.5 inline-block rounded px-1 text-[10px] font-semibold",
              [0, 6].includes(new Date(session.date).getDay()) ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500",
            )}>
              {fmtDay(session.date)}
            </div>
          )}
          {isRescheduled && session.originalDate && (
            <div className="mt-0.5 text-[10px] text-amber-600 line-through">{fmtDate(session.originalDate)}</div>
          )}
        </td>

        {/* Topic */}
        <td className="px-3 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {isCancelled && (
                <span className="inline-flex rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  Скасовано
                </span>
              )}
              {isRescheduled && (
                <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Перенесено
                </span>
              )}
              {status === "makeup" && (
                <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Компенсаційне
                </span>
              )}
              {!isCancelled && (
                <span className={clsx("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold", SESSION_TYPE_COLORS[session.sessionType])}>
                  {SESSION_TYPE_LABELS[session.sessionType]}
                </span>
              )}
              {mod && (
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {mod.title}
                </span>
              )}
            </div>
            <p className={clsx("mt-1 truncate text-sm font-semibold", isCancelled ? "text-slate-400 line-through" : "text-slate-800")}>
              {topic?.title || session.title || "Тема не прив'язана"}
            </p>
            {isCancelled && session.cancellationReason && (
              <p className="mt-0.5 truncate text-[11px] text-rose-500">{session.cancellationReason}</p>
            )}
            {!isCancelled && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {session.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {session.location}
                  </span>
                )}
                {session.recurringGroupId && (
                  <span className="inline-flex items-center gap-1 text-indigo-400">
                    <CalendarClock className="h-3 w-3" /> регулярне
                  </span>
                )}
              </div>
            )}
          </div>
        </td>

        {/* Time */}
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

        {/* Duration */}
        <td className="px-3 py-3 text-center">
          {session.durationHours > 0 ? (
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              {session.durationHours}г
            </span>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
        </td>

        {/* Attendance */}
        <td className="px-3 py-3 text-center">
          <AttToggle
            current={session.attendance}
            onChange={(value) => patch({ attendance: value })}
            disabled={!canManage || pending || isCancelled}
          />
        </td>

        {/* Actions */}
        <td className="px-3 py-3">
          <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
            {session.notes && panel === "none" && (
              <span title={session.notes} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <FileText className="h-3.5 w-3.5" />
              </span>
            )}
            {canManage && !isCancelled && (
              <>
                <button
                  type="button"
                  onClick={() => setPanel((p) => p === "edit" ? "none" : "edit")}
                  title="Редагувати"
                  className={clsx("flex h-7 w-7 items-center justify-center rounded-lg transition", panel === "edit" ? "bg-indigo-100 text-indigo-600" : "text-slate-300 hover:bg-indigo-50 hover:text-indigo-500")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPanel((p) => p === "reschedule" ? "none" : "reschedule")}
                  title="Перенести"
                  className={clsx("flex h-7 w-7 items-center justify-center rounded-lg transition", panel === "reschedule" ? "bg-amber-100 text-amber-600" : "text-slate-300 hover:bg-amber-50 hover:text-amber-500")}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPanel((p) => p === "cancel" ? "none" : "cancel")}
                  title="Скасувати заняття"
                  className={clsx("flex h-7 w-7 items-center justify-center rounded-lg transition", panel === "cancel" ? "bg-rose-100 text-rose-600" : "text-slate-300 hover:bg-rose-50 hover:text-rose-500")}
                >
                  <Ban className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {canManage && isCancelled && (
              <button
                type="button"
                title="Відновити заняття"
                onClick={() => {
                  const fd = new FormData();
                  fd.set("locale", locale);
                  fd.set("projectId", projectId);
                  fd.set("sessionId", session._id ?? "");
                  start(() => restoreSessionAction(fd));
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {canManage && (
              <button
                type="button"
                title="Видалити"
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

      {/* Edit panel */}
      {panel === "edit" && (
        <tr className="border-b border-indigo-100 bg-indigo-50/40">
          <td colSpan={7} className="px-4 py-3">
            <form
              action={(fd) => {
                fd.set("locale", locale);
                fd.set("projectId", projectId);
                fd.set("sessionId", session._id ?? "");
                fd.set("attendance", session.attendance ?? "null");
                fd.set("grade", session.grade !== null ? String(session.grade) : "");
                fd.set("topicId", session.topicId);
                fd.set("moduleId", session.moduleId ?? topic?.moduleId ?? "");
                start(async () => { await saveSession(fd); setPanel("none"); });
              }}
              className="space-y-2"
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <input name="title" defaultValue={session.title || topic?.title || ""} placeholder="Назва заняття" className={clsx(inputCls, "w-full")} />
                <select name="sessionType" defaultValue={session.sessionType} className={inputCls}>
                  {(Object.keys(SESSION_TYPE_LABELS) as TopicType[]).map((type) => (
                    <option key={type} value={type}>{SESSION_TYPE_LABELS[type]}</option>
                  ))}
                </select>
                <input name="date" type="date" defaultValue={session.date} className={inputCls} />
              </div>
              <div className="grid gap-2 sm:grid-cols-[auto_auto_auto_1fr]">
                <input name="startTime" type="time" defaultValue={session.startTime} className={inputCls} />
                <input name="endTime" type="time" defaultValue={session.endTime} className={inputCls} />
                <input name="durationHours" type="number" min={0} max={12} step={0.5} defaultValue={session.durationHours || ""} placeholder="Год." className={clsx(inputCls, "w-20")} />
                <input name="location" defaultValue={session.location} placeholder="Аудиторія / Zoom" className={clsx(inputCls, "w-full")} />
              </div>
              <textarea name="notes" defaultValue={session.notes} rows={2} placeholder="Примітки" className={clsx(inputCls, "w-full resize-none")} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPanel("none")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">Скасувати</button>
                <button type="submit" disabled={pending} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {pending ? "..." : "Зберегти"}
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}

      {/* Cancel panel */}
      {panel === "cancel" && (
        <tr className="border-b border-rose-100 bg-rose-50/50">
          <td colSpan={7} className="px-4 py-3">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-rose-700">Скасування заняття — {fmtDate(session.date)} ({topic?.title || session.title || "без теми"})</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Причина скасування</label>
                  <input
                    type="text"
                    placeholder="Хвороба викладача, свято…"
                    className={clsx(inputCls, "w-full")}
                    id={`cancel-reason-${session._id}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Режим скасування</label>
                  <div className="flex gap-2">
                    {([["drop", "Просто скасувати"], ["shift", "Зсунути наступні"]] as const).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setShiftMode(mode)}
                        className={clsx(
                          "flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                          shiftMode === mode ? (mode === "drop" ? "border-rose-500 bg-rose-600 text-white" : "border-amber-500 bg-amber-500 text-white") : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {shiftMode === "shift" && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="text-xs text-amber-700">Зсунути решту занять в цьому розкладі на</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={shiftDays}
                    onChange={(e) => setShiftDays(Number(e.target.value))}
                    className="w-16 rounded-lg border border-amber-300 px-2 py-1 text-xs font-bold text-amber-800 focus:outline-none"
                  />
                  <span className="text-xs text-amber-700">днів вперед</span>
                  {!session.recurringGroupId && (
                    <span className="text-[10px] text-amber-500">(заняття не в регулярній групі — зсув не буде)</span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPanel("none")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">Скасувати дію</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const reason = (document.getElementById(`cancel-reason-${session._id}`) as HTMLInputElement)?.value ?? "";
                    const fd = new FormData();
                    fd.set("locale", locale);
                    fd.set("projectId", projectId);
                    fd.set("sessionId", session._id ?? "");
                    fd.set("cancellationReason", reason);
                    fd.set("cancelMode", shiftMode);
                    fd.set("shiftDays", String(shiftDays));
                    fd.set("recurringGroupId", session.recurringGroupId ?? "");
                    fd.set("sessionDate", session.date);
                    start(async () => { await cancelSessionAction(fd); setPanel("none"); });
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {pending ? "..." : "Підтвердити скасування"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Reschedule panel */}
      {panel === "reschedule" && (
        <tr className="border-b border-amber-100 bg-amber-50/40">
          <td colSpan={7} className="px-4 py-3">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-700">Перенести заняття з {fmtDate(session.date)}</p>
              <div className="grid gap-2 sm:grid-cols-[auto_auto_auto_1fr]">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Нова дата</label>
                  <input type="date" defaultValue={session.date} className={inputCls} id={`reschedule-date-${session._id}`} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Початок</label>
                  <input type="time" defaultValue={session.startTime} className={inputCls} id={`reschedule-start-${session._id}`} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Кінець</label>
                  <input type="time" defaultValue={session.endTime} className={inputCls} id={`reschedule-end-${session._id}`} />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-amber-400">
                    <input
                      type="checkbox"
                      checked={shiftSubsequent}
                      onChange={(e) => setShiftSubsequent(e.target.checked)}
                      className="rounded"
                    />
                    Зсунути наступні заняття
                  </label>
                </div>
              </div>

              {shiftSubsequent && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="text-xs text-amber-700">Зсунути на</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={shiftDays}
                    onChange={(e) => setShiftDays(Number(e.target.value))}
                    className="w-16 rounded-lg border border-amber-300 px-2 py-1 text-xs font-bold text-amber-800 focus:outline-none"
                  />
                  <span className="text-xs text-amber-700">днів вперед</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPanel("none")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">Скасувати</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const newDate = (document.getElementById(`reschedule-date-${session._id}`) as HTMLInputElement)?.value ?? "";
                    const newStart = (document.getElementById(`reschedule-start-${session._id}`) as HTMLInputElement)?.value ?? "";
                    const newEnd = (document.getElementById(`reschedule-end-${session._id}`) as HTMLInputElement)?.value ?? "";
                    if (!newDate) return;
                    const fd = new FormData();
                    fd.set("locale", locale);
                    fd.set("projectId", projectId);
                    fd.set("sessionId", session._id ?? "");
                    fd.set("originalDate", session.date);
                    fd.set("newDate", newDate);
                    fd.set("newStartTime", newStart);
                    fd.set("newEndTime", newEnd);
                    fd.set("shiftSubsequent", String(shiftSubsequent));
                    fd.set("shiftDays", String(shiftDays));
                    fd.set("recurringGroupId", session.recurringGroupId ?? "");
                    start(async () => { await rescheduleSessionAction(fd); setPanel("none"); });
                  }}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                >
                  {pending ? "..." : "Перенести заняття"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Schedule insights ─────────────────────────────────────────────────────────

function ScheduleInsights({ topics, sessions, modules, onAddUnscheduled }: {
  topics: LearningTopic[];
  sessions: LearningSession[];
  modules: LearningModule[];
  onAddUnscheduled?: () => void;
}) {
  const moduleLookup = moduleMap(modules);
  const activeSessions = sessions.filter((s) => (s.status ?? "active") !== "cancelled");
  const scheduledTopicIds = new Set(activeSessions.map((session) => session.topicId).filter(Boolean));
  const unscheduledTopics = topics.filter((topic) => !scheduledTopicIds.has(topic._id ?? ""));
  const plannedHours = topics.reduce((sum, topic) => sum + (topic.durationHours || 0), 0);
  const scheduledHours = activeSessions.reduce((sum, session) => sum + (session.durationHours || 0), 0);
  const attendanceMarked = activeSessions.filter((session) => session.attendance !== null).length;
  const avgAttendance = activeSessions.length ? Math.round((attendanceMarked / activeSessions.length) * 100) : 0;
  const cancelledCount = sessions.filter((s) => (s.status ?? "active") === "cancelled").length;

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
      value: activeSessions.length,
      sub: cancelledCount > 0 ? `${cancelledCount} скасовано` : `${Math.max(topics.length - scheduledTopicIds.size, 0)} тем без занять`,
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
              <p className="text-xs text-slate-500">Вкажіть дати — теми стануть повноцінними заняттями.</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-700">
              {unscheduledTopics.length} не заплановано
            </span>
            {onAddUnscheduled && (
              <button
                type="button"
                onClick={onAddUnscheduled}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
              >
                <CalendarPlus className="h-3.5 w-3.5" /> Додати до розкладу
              </button>
            )}
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

// ── Main export ───────────────────────────────────────────────────────────────

export function ScheduleTab({ courseId, projectId, locale, canManage, sessions, topics, modules }: {
  courseId: string;
  projectId: string;
  locale: string;
  canManage: boolean;
  sessions: LearningSession[];
  topics: LearningTopic[];
  modules: LearningModule[];
}) {
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [filter, setFilter] = useState<TopicType | "all">("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const allCourseSessions = sessions
    .filter((session) => session.courseId === courseId)
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.startTime || "").localeCompare(b.startTime || ""));

  const activeSessions = allCourseSessions.filter((s) => (s.status ?? "active") !== "cancelled");
  const cancelledSessions = allCourseSessions.filter((s) => (s.status ?? "active") === "cancelled");

  const visibleSessions = (showCancelled ? allCourseSessions : activeSessions)
    .filter((session) => filter === "all" || session.sessionType === filter);

  const scheduledTopicIds = new Set(activeSessions.map((s) => s.topicId).filter(Boolean));
  const courseTopics = topics.filter((t) => t.courseId === courseId);
  const unscheduledTopics = courseTopics.filter((t) => !scheduledTopicIds.has(t._id ?? ""));

  const clearAll = (mode: "all" | "cancelled") => {
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("projectId", projectId);
    fd.set("courseId", courseId);
    fd.set("mode", mode);
    start(async () => { await clearCourseSchedule(fd); setClearConfirm(false); });
  };

  return (
    <div className="space-y-4">
      <ScheduleInsights
        topics={courseTopics}
        sessions={allCourseSessions}
        modules={modules}
        onAddUnscheduled={canManage && unscheduledTopics.length > 0 ? () => setShowUnscheduled(true) : undefined}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex flex-wrap items-center gap-2">
          {cancelledSessions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCancelled((v) => !v)}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                showCancelled ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
              )}
            >
              {showCancelled ? `Сховати скасовані (${cancelledSessions.length})` : `Скасовані (${cancelledSessions.length})`}
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              <Wand2 className="h-3.5 w-3.5" /> Генератор розкладу
            </button>
          )}
          {canManage && allCourseSessions.length > 0 && !clearConfirm && (
            <button
              type="button"
              onClick={() => setClearConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> Очистити
            </button>
          )}
        </div>

        {/* Clear confirmation */}
        {clearConfirm && (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <span className="flex-1 text-sm font-semibold text-rose-700">Видалити розклад курсу?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => clearAll("all")}
              className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {pending ? "…" : `Всі заняття (${allCourseSessions.length})`}
            </button>
            {cancelledSessions.length > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() => clearAll("cancelled")}
                className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
              >
                Тільки скасовані ({cancelledSessions.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setClearConfirm(false)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
            >
              Скасувати
            </button>
          </div>
        )}
      </div>

      {/* Table */}
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
              <th className="w-24 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {visibleSessions.length === 0 && !adding && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <CalendarDays className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-700">Розклад ще не сформований</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Використайте генератор для регулярного розкладу або додайте заняття вручну.
                  </p>
                  {canManage && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowGenerator(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <Wand2 className="h-4 w-4" /> Генератор розкладу
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4" /> Додати вручну
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}

            <AnimatePresence>
              {visibleSessions.map((session, index) => (
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

      {canManage && activeSessions.length > 0 && !adding && (
        <div className="flex flex-wrap gap-2">
          <motion.button
            type="button"
            onClick={() => setAdding(true)}
            whileHover={{ scale: 1.01 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
          >
            <Plus className="h-4 w-4" /> Запланувати наступну тему
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showGenerator && (
          <RecurringGeneratorModal
            courseId={courseId}
            projectId={projectId}
            locale={locale}
            topics={topics}
            modules={modules}
            onClose={() => setShowGenerator(false)}
          />
        )}
        {showUnscheduled && (
          <UnscheduledTopicsModal
            courseId={courseId}
            projectId={projectId}
            locale={locale}
            unscheduledTopics={unscheduledTopics}
            modules={modules}
            existingCount={allCourseSessions.length}
            onClose={() => setShowUnscheduled(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
