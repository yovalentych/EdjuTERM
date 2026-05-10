import type { Dictionary } from "@/lib/i18n";
import type { ResearchStage } from "@/lib/schemas";

const statusBarColors: Record<string, string> = {
  planned: "bg-stone-400",
  active: "bg-emerald-500",
  completed: "bg-blue-500",
  reported: "bg-purple-500",
  overdue: "bg-rose-500",
};

const statusTextColors: Record<string, string> = {
  planned: "text-stone-600",
  active: "text-emerald-700",
  completed: "text-blue-700",
  reported: "text-purple-700",
  overdue: "text-rose-700",
};

function toMs(dateStr: string): number {
  return new Date(dateStr).getTime();
}

function formatMonthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
    month: "short",
    year: "numeric",
  });
}

export function ResearchGantt({
  stages,
  dictionary,
  locale,
  todayMs,
}: {
  stages: ResearchStage[];
  dictionary: Dictionary;
  locale: string;
  todayMs: number;
}) {
  const d = dictionary.researchPlan;

  const stagesWithDates = stages.filter((s) => s.startDate && s.endDate);

  if (stagesWithDates.length === 0) {
    return (
      <div className="surface rounded-lg border border-stone-200 p-8 text-center">
        <p className="text-sm text-stone-400">{d.noDateSet}</p>
      </div>
    );
  }

  const allMs = stagesWithDates.flatMap((s) => [toMs(s.startDate), toMs(s.endDate)]);
  const minMs = Math.min(...allMs);
  const maxMs = Math.max(...allMs);
  const totalMs = maxMs - minMs;
  const todayPct =
    todayMs >= minMs && todayMs <= maxMs
      ? ((todayMs - minMs) / totalMs) * 100
      : null;

  // Generate month tick marks
  const monthTicks: { pct: number; label: string }[] = [];
  const startDate = new Date(minMs);
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (cursor.getTime() <= maxMs) {
    const pct = ((cursor.getTime() - minMs) / totalMs) * 100;
    if (pct >= 0 && pct <= 100) {
      monthTicks.push({ pct, label: formatMonthLabel(cursor, locale) });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="surface overflow-hidden rounded-lg border border-stone-200">
      <div className="border-b border-stone-200 px-5 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">
          {d.ganttTitle}
        </h3>
      </div>

      <div className="overflow-x-auto p-5">
        {/* Month labels */}
        <div className="relative mb-2 h-6" style={{ minWidth: "600px" }}>
          {monthTicks.map((tick, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 whitespace-nowrap text-xs text-stone-400"
              style={{ left: `${tick.pct}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        {/* Timeline bars */}
        <div className="relative space-y-2.5" style={{ minWidth: "600px" }}>
          {/* Month grid lines */}
          {monthTicks.map((tick, i) => (
            <div
              key={i}
              className="pointer-events-none absolute inset-y-0 w-px bg-stone-100"
              style={{ left: `${tick.pct}%` }}
            />
          ))}

          {/* Today marker */}
          {todayPct !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-rose-400/70"
              style={{ left: `${todayPct}%` }}
            >
              <span className="absolute -top-5 left-1 whitespace-nowrap text-xs font-semibold text-rose-500">
                ▼
              </span>
            </div>
          )}

          {stagesWithDates.map((stage) => {
            const startMs = toMs(stage.startDate);
            const endMs = toMs(stage.endDate);
            const leftPct = ((startMs - minMs) / totalMs) * 100;
            const widthPct = ((endMs - startMs) / totalMs) * 100;
            const barColor = statusBarColors[stage.status] ?? statusBarColors.planned;
            const textColor = statusTextColors[stage.status] ?? statusTextColors.planned;

            return (
              <div key={stage._id} className="relative flex items-center gap-3">
                {/* Stage number label */}
                <div className="w-16 shrink-0 text-right">
                  <span className={`font-mono text-xs font-bold ${textColor}`}>
                    #{stage.stageNumber}
                  </span>
                </div>

                {/* Bar track */}
                <div className="relative h-7 flex-1 rounded bg-stone-100">
                  <div
                    className={`absolute inset-y-0 ${barColor} flex items-center overflow-hidden rounded px-2 shadow-sm transition-all`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 1)}%`,
                    }}
                  >
                    <span className="truncate text-xs font-medium text-white">
                      {stage.title.slice(0, 60)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap gap-3 border-t border-stone-100 pt-4">
          {(["planned", "active", "completed", "reported"] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded-sm ${statusBarColors[s]}`} />
              <span className="text-xs text-stone-500">
                {d.statuses[s]}
              </span>
            </div>
          ))}
          {todayPct !== null && (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-0.5 bg-rose-400" />
              <span className="text-xs text-stone-500">Сьогодні / Today</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
