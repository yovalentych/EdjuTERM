import type { Dictionary } from "@/lib/i18n";
import type { Milestone, Task } from "@/lib/schemas";

// ── calendar logic ────────────────────────────────────────────────────────────

function buildCalendar(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0
  const startOffset = (firstDay.getDay() + 6) % 7;

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array<null>(startOffset).fill(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const dayNamesEn = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const priorityDot: Record<string, string> = {
  low: "bg-stone-400",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-rose-600",
};

// ── component ─────────────────────────────────────────────────────────────────

export function CalendarGrid({
  tasks,
  milestones,
  year,
  month,
  dictionary,
  locale,
  projectId,
}: {
  tasks: Task[];
  milestones: Milestone[];
  year: number;
  month: number;
  dictionary: Dictionary;
  locale: string;
  projectId: string;
}) {
  const d = dictionary.planning;
  const weeks = buildCalendar(year, month);
  const today = toISO(new Date());

  // Prev / next month links
  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);
  const prevParam = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextParam = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  const monthLabel = new Date(year, month, 1).toLocaleDateString(
    locale === "uk" ? "uk-UA" : "en-US",
    { month: "long", year: "numeric" },
  );

  const baseUrl = `/${locale}/app/planning?projectId=${projectId}&tab=calendar`;

  // Index tasks and milestones by date
  const tasksByDate = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.dueDate || task.status === "cancelled" || task.status === "done")
      continue;
    const key = task.dueDate.slice(0, 10);
    const existing = tasksByDate.get(key) ?? [];
    existing.push(task);
    tasksByDate.set(key, existing);
  }

  const milestonesByDate = new Map<string, Milestone[]>();
  for (const ms of milestones) {
    if (ms.status === "reached") continue;
    const key = ms.dueDate.slice(0, 10);
    const existing = milestonesByDate.get(key) ?? [];
    existing.push(ms);
    milestonesByDate.set(key, existing);
  }

  const names = locale === "uk" ? dayNames : dayNamesEn;

  return (
    <div className="surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <a
          href={`${baseUrl}&month=${prevParam}`}
          className="border border-stone-300 px-3 py-1.5 text-sm text-stone-600 transition hover:border-stone-500"
        >
          {d.prevMonth}
        </a>
        <h2 className="text-base font-semibold capitalize text-stone-950">
          {monthLabel}
        </h2>
        <a
          href={`${baseUrl}&month=${nextParam}`}
          className="border border-stone-300 px-3 py-1.5 text-sm text-stone-600 transition hover:border-stone-500"
        >
          {d.nextMonth}
        </a>
      </div>

      {/* Day name row */}
      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
        {names.map((name, i) => (
          <div
            key={name}
            className={`py-2 text-center text-xs font-medium ${
              i >= 5 ? "text-stone-400" : "text-stone-600"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div
          key={wi}
          className="grid grid-cols-7 divide-x divide-stone-200 border-b border-stone-200 last:border-b-0"
        >
          {week.map((day, di) => {
            if (!day) {
              return (
                <div key={di} className="min-h-[80px] bg-stone-50/50 p-2" />
              );
            }

            const iso = toISO(day);
            const dayTasks = tasksByDate.get(iso) ?? [];
            const dayMilestones = milestonesByDate.get(iso) ?? [];
            const isToday = iso === today;
            const isWeekend = di >= 5;
            const hasItems = dayTasks.length > 0 || dayMilestones.length > 0;

            return (
              <div
                key={di}
                className={`min-h-[80px] p-2 ${
                  isToday
                    ? "bg-emerald-50"
                    : isWeekend
                      ? "bg-stone-50/60"
                      : "bg-white"
                } ${hasItems ? "cursor-default" : ""}`}
              >
                <div
                  className={`mb-1.5 flex h-6 w-6 items-center justify-center text-xs font-semibold ${
                    isToday
                      ? "rounded-full bg-emerald-600 text-white"
                      : isWeekend
                        ? "text-stone-400"
                        : "text-stone-700"
                  }`}
                >
                  {day.getDate()}
                </div>

                {/* Milestone markers */}
                {dayMilestones.map((ms) => (
                  <div
                    key={ms._id}
                    className="mb-1 truncate border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-xs text-purple-800"
                    title={ms.title}
                  >
                    ◆ {ms.title}
                  </div>
                ))}

                {/* Task dots */}
                {dayTasks.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {dayTasks.slice(0, 5).map((task) => (
                      <span
                        key={task._id}
                        title={task.title}
                        className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`}
                      />
                    ))}
                    {dayTasks.length > 5 && (
                      <span className="text-xs text-stone-400">
                        +{dayTasks.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Task titles (only if ≤ 2) */}
                {dayTasks.slice(0, 2).map((task) => (
                  <p
                    key={task._id}
                    className="mt-0.5 truncate text-xs text-stone-600"
                    title={task.title}
                  >
                    {task.title}
                  </p>
                ))}
                {dayTasks.length > 2 && (
                  <p className="mt-0.5 text-xs text-stone-400">
                    +{dayTasks.length - 2}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-stone-200 px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-2 w-2 rounded-full bg-stone-400" /> Low
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Medium
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> High
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-2 w-2 rounded-full bg-rose-600" /> Critical
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="text-purple-700">◆</span> Milestone
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="h-5 w-5 rounded-full bg-emerald-600" />
          Today
        </div>
      </div>
    </div>
  );
}
