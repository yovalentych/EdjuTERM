"use client";

import { useState, useEffect } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Milestone, ResearchStage, Task } from "@/lib/schemas";

type ZoomLevel = "month" | "quarter" | "year";

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseDate(s: string): number | null {
  if (!s) return null;
  const t = new Date(s).getTime();
  return isNaN(t) ? null : t;
}

function addDays(ms: number, d: number) {
  return ms + d * 86400000;
}

function msToDate(ms: number) {
  return new Date(ms);
}

function daysBetween(a: number, b: number) {
  return Math.round((b - a) / 86400000);
}

function fmt(d: Date, unit: "day" | "week" | "month" | "quarter" | "year") {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  if (unit === "day") return `${day}`;
  if (unit === "week") return `W${Math.ceil(day / 7)}`;
  if (unit === "month") return d.toLocaleString("default", { month: "short" }) + ` ${y}`;
  if (unit === "quarter") return `Q${Math.floor(m / 3) + 1} ${y}`;
  return `${y}`;
}

// ── Period generation ──────────────────────────────────────────────────────────

type Period = { label: string; startMs: number; endMs: number };

function generatePeriods(minMs: number, maxMs: number, zoom: ZoomLevel): Period[] {
  const periods: Period[] = [];
  const d = new Date(minMs);

  if (zoom === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() < maxMs) {
      const start = d.getTime();
      d.setMonth(d.getMonth() + 1);
      periods.push({ label: fmt(new Date(start), "month"), startMs: start, endMs: d.getTime() });
    }
  } else if (zoom === "quarter") {
    d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() < maxMs) {
      const start = d.getTime();
      d.setMonth(d.getMonth() + 3);
      periods.push({ label: fmt(new Date(start), "quarter"), startMs: start, endMs: d.getTime() });
    }
  } else {
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    while (d.getTime() < maxMs) {
      const start = d.getTime();
      d.setFullYear(d.getFullYear() + 1);
      periods.push({ label: fmt(new Date(start), "year"), startMs: start, endMs: d.getTime() });
    }
  }
  return periods;
}

// ── Status colours ─────────────────────────────────────────────────────────────

const stageBarColor: Record<string, string> = {
  planned: "bg-stone-300",
  active: "bg-emerald-500",
  completed: "bg-blue-500",
  reported: "bg-purple-500",
};
const stageProgressColor: Record<string, string> = {
  planned: "bg-stone-400",
  active: "bg-emerald-600",
  completed: "bg-blue-600",
  reported: "bg-purple-600",
};
const stageLegendBg: Record<string, string> = {
  planned: "bg-stone-300",
  active: "bg-emerald-500",
  completed: "bg-blue-500",
  reported: "bg-purple-500",
};
const taskDotColor: Record<string, string> = {
  todo: "text-stone-400",
  in_progress: "text-blue-500",
  review: "text-amber-500",
  done: "text-emerald-500",
  cancelled: "text-rose-400",
};

// ── Component ──────────────────────────────────────────────────────────────────

export function ProjectGanttChart({
  stages,
  tasks,
  milestones,
  locale,
}: {
  stages: ResearchStage[];
  tasks: Task[];
  milestones: Milestone[];
  dictionary: Dictionary;
  locale: string;
}) {
  const [zoom, setZoom] = useState<ZoomLevel>("quarter");
  const [todayMs, setTodayMs] = useState<number | null>(null);
  const isUk = locale === "uk";

  useEffect(() => {
    setTodayMs(Date.now());
  }, []);

  // ── Build rows ────────────────────────────────────────────────────────────

  type StageRow = { kind: "stage"; stage: ResearchStage; startMs: number; endMs: number };
  type TaskRow = { kind: "task"; task: Task; dateMs: number };
  type MilestoneRow = { kind: "milestone"; milestone: Milestone; dateMs: number };
  type Row = StageRow | TaskRow | MilestoneRow;

  const rows: Row[] = [];

  const stageById = new Map<string, ResearchStage>();
  stages.forEach((s) => s._id && stageById.set(s._id, s));

  stages.forEach((stage) => {
    const startMs = parseDate(stage.startDate);
    const endMs = parseDate(stage.endDate);
    if (startMs === null || endMs === null) return;

    rows.push({ kind: "stage", stage, startMs, endMs });

    (stage.linkedTaskIds ?? []).forEach((tid) => {
      const task = tasks.find((t) => t._id === tid);
      if (!task?.dueDate) return;
      const dateMs = parseDate(task.dueDate);
      if (dateMs === null) return;
      rows.push({ kind: "task", task, dateMs });
    });
  });

  milestones.forEach((ms) => {
    const dateMs = parseDate(ms.dueDate);
    if (dateMs === null) return;
    rows.push({ kind: "milestone", milestone: ms, dateMs });
  });

  if (rows.filter((r) => r.kind === "stage").length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
        <p className="text-sm text-stone-500">
          {isUk
            ? "Вкажіть дати початку та кінця для кожного етапу, щоб побачити діаграму Ганта."
            : "Set start and end dates for each stage to see the Gantt chart."}
        </p>
        <a
          href="?tab=stages"
          className="mt-3 inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
        >
          {isUk ? "Перейти до Етапів →" : "Go to Stages →"}
        </a>
      </div>
    );
  }

  // ── Timeline bounds ───────────────────────────────────────────────────────

  const allMs = rows.map((r) => {
    if (r.kind === "stage") return [r.startMs, r.endMs];
    if (r.kind === "task") return [r.dateMs];
    return [r.dateMs];
  }).flat();

  const rawMin = Math.min(...allMs);
  const rawMax = Math.max(...allMs);
  const span = rawMax - rawMin || 86400000 * 30;
  const minMs = rawMin - span * 0.05;
  const maxMs = rawMax + span * 0.05;
  const totalSpan = maxMs - minMs;

  const pct = (ms: number) => `${((ms - minMs) / totalSpan) * 100}%`;

  // ── Periods ───────────────────────────────────────────────────────────────

  const periods = generatePeriods(minMs, maxMs, zoom);
  const todayPct = todayMs !== null ? ((todayMs - minMs) / totalSpan) * 100 : null;
  const showToday = todayPct !== null && todayPct >= 0 && todayPct <= 100;

  // ── Zoom buttons ──────────────────────────────────────────────────────────

  const zoomBtns: { value: ZoomLevel; label: string }[] = [
    { value: "month", label: isUk ? "Міс." : "Mo." },
    { value: "quarter", label: isUk ? "Кв." : "Qt." },
    { value: "year", label: isUk ? "Рік" : "Yr." },
  ];

  // ── Left panel ────────────────────────────────────────────────────────────

  const LEFT_W = 320; // px
  const ROW_STAGE = 36;
  const ROW_TASK = 30;

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          {isUk ? "Діаграма Ганта" : "Gantt Chart"}
        </span>
        <div className="flex gap-0.5 rounded border border-stone-200 bg-stone-50 p-0.5">
          {zoomBtns.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setZoom(btn.value)}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                zoom === btn.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="overflow-x-auto" style={{ minWidth: 900 }}>
        <div style={{ minWidth: 900 }}>
          {/* Column header row */}
          <div className="flex border-b border-stone-200 bg-stone-50">
            {/* Left panel header */}
            <div
              className="sticky left-0 z-20 flex shrink-0 border-r border-stone-200 bg-stone-50"
              style={{ width: LEFT_W }}
            >
              <div className="flex w-8 shrink-0 items-center justify-center border-r border-stone-100 px-1 py-2 text-[10px] font-bold uppercase text-stone-400">
                #
              </div>
              <div className="flex flex-1 items-center px-2 py-2 text-[10px] font-bold uppercase text-stone-400">
                {isUk ? "Назва" : "Name"}
              </div>
              <div className="flex w-14 shrink-0 items-center justify-center border-l border-stone-100 px-1 py-2 text-[10px] font-bold uppercase text-stone-400">
                {isUk ? "Дн." : "Dur."}
              </div>
              <div className="flex w-11 shrink-0 items-center justify-center border-l border-stone-100 px-1 py-2 text-[10px] font-bold uppercase text-stone-400">
                %
              </div>
            </div>

            {/* Period labels */}
            <div className="relative flex-1 overflow-hidden">
              <div className="relative h-9">
                {periods.map((p, i) => {
                  const left = ((p.startMs - minMs) / totalSpan) * 100;
                  const width = ((p.endMs - p.startMs) / totalSpan) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute inset-y-0 flex items-center overflow-hidden border-l border-stone-200 px-2"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="truncate text-[10px] font-semibold text-stone-500">
                        {p.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Data rows */}
          {rows.map((row, idx) => {
            const isStage = row.kind === "stage";
            const isTask = row.kind === "task";
            const isMilestone = row.kind === "milestone";
            const rowH = isStage ? ROW_STAGE : ROW_TASK;

            return (
              <div
                key={idx}
                className={`flex border-b border-stone-100 ${isStage ? "bg-white hover:bg-stone-50" : "bg-white/60 hover:bg-indigo-50/30"}`}
                style={{ height: rowH }}
              >
                {/* Left panel cell */}
                <div
                  className="sticky left-0 z-10 flex shrink-0 items-center border-r border-stone-200 bg-inherit"
                  style={{ width: LEFT_W }}
                >
                  {/* # column */}
                  <div className="flex w-8 shrink-0 items-center justify-center border-r border-stone-100">
                    {isStage && (
                      <span className="text-[11px] font-bold text-indigo-600">
                        {row.stage.stageNumber}
                      </span>
                    )}
                    {isTask && (
                      <span className="text-[10px] text-stone-400">↳</span>
                    )}
                    {isMilestone && (
                      <span className="text-[11px] text-amber-500">◆</span>
                    )}
                  </div>

                  {/* Name column */}
                  <div
                    className="flex min-w-0 flex-1 items-center px-2"
                    style={{ paddingLeft: isTask ? 20 : undefined }}
                  >
                    <span
                      className={`truncate ${
                        isStage
                          ? "text-xs font-semibold text-stone-800"
                          : isMilestone
                          ? "text-[11px] font-semibold text-amber-700"
                          : "text-[11px] text-stone-600"
                      }`}
                      title={
                        isStage
                          ? row.stage.title
                          : isTask
                          ? row.task.title
                          : row.milestone.title
                      }
                    >
                      {isStage
                        ? row.stage.title
                        : isTask
                        ? row.task.title
                        : row.milestone.title}
                    </span>
                  </div>

                  {/* Duration column */}
                  <div className="flex w-14 shrink-0 items-center justify-center border-l border-stone-100">
                    {isStage && (
                      <span className="text-[10px] font-mono text-stone-500">
                        {daysBetween(row.startMs, row.endMs)}d
                      </span>
                    )}
                  </div>

                  {/* Progress column */}
                  <div className="flex w-11 shrink-0 items-center justify-center border-l border-stone-100">
                    {isStage && (
                      <span className="text-[10px] font-mono text-stone-500">
                        {row.stage.progress ?? 0}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline cell */}
                <div className="relative flex-1 overflow-hidden">
                  {/* Grid lines */}
                  {periods.map((p, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 w-px bg-stone-100"
                      style={{ left: `${((p.startMs - minMs) / totalSpan) * 100}%` }}
                    />
                  ))}

                  {/* Today line */}
                  {showToday && todayPct !== null && (
                    <div
                      className="absolute inset-y-0 w-px bg-rose-400"
                      style={{ left: `${todayPct}%`, zIndex: 2 }}
                    />
                  )}

                  {/* Stage bar */}
                  {isStage && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{
                        left: pct(row.startMs),
                        width: `max(4px, ${((row.endMs - row.startMs) / totalSpan) * 100}%)`,
                        height: 18,
                      }}
                    >
                      <div
                        className={`h-full w-full rounded-sm ${stageBarColor[row.stage.status] ?? "bg-stone-300"}`}
                      />
                      {/* Progress overlay */}
                      {(row.stage.progress ?? 0) > 0 && (
                        <div
                          className={`absolute inset-y-0 left-0 rounded-sm ${stageProgressColor[row.stage.status] ?? "bg-stone-400"} opacity-70`}
                          style={{ width: `${row.stage.progress}%` }}
                        />
                      )}
                    </div>
                  )}

                  {/* Task diamond */}
                  {isTask && (
                    <div
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: pct(row.dateMs), zIndex: 3 }}
                    >
                      <div
                        className={`h-2.5 w-2.5 rotate-45 border-2 bg-white ${taskDotColor[row.task.status] ?? "text-stone-400"}`}
                        style={{
                          borderColor: "currentColor",
                        }}
                      />
                    </div>
                  )}

                  {/* Milestone diamond */}
                  {isMilestone && (
                    <div
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: pct(row.dateMs), zIndex: 3 }}
                    >
                      <div className="h-3.5 w-3.5 rotate-45 bg-amber-500 shadow-sm" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 bg-stone-50 px-4 py-2.5">
        {(["planned", "active", "completed", "reported"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1 text-[10px] text-stone-500">
            <span className={`inline-block h-2.5 w-4 rounded-sm ${stageLegendBg[s]}`} />
            {isUk
              ? { planned: "Плановий", active: "Активний", completed: "Завершений", reported: "Звітований" }[s]
              : { planned: "Planned", active: "Active", completed: "Completed", reported: "Reported" }[s]}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[10px] text-stone-500">
          <span className="inline-block h-3 w-3 rotate-45 bg-amber-500" />
          {isUk ? "Ключова дата" : "Milestone"}
        </span>
        {showToday && (
          <span className="flex items-center gap-1 text-[10px] text-stone-500">
            <span className="inline-block h-3 w-px bg-rose-400" />
            {isUk ? "Сьогодні" : "Today"}
          </span>
        )}
      </div>
    </div>
  );
}
