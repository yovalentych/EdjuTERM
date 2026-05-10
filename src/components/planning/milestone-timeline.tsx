import { reachMilestone } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import type { Milestone } from "@/lib/schemas";

const statusStyle: Record<string, { badge: string; dot: string }> = {
  upcoming: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-400",
  },
  reached: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  missed: {
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
};

function autoStatus(ms: Milestone): Milestone["status"] {
  if (ms.status !== "upcoming") return ms.status;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(ms.dueDate);
  return due < now ? "missed" : "upcoming";
}

function dateParts(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return { day: "--", month: date };
  }

  return {
    day: String(parsed.getDate()).padStart(2, "0"),
    month: parsed.toLocaleDateString("uk-UA", { month: "short" }),
  };
}

export function MilestoneTimeline({
  milestones,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  milestones: Milestone[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.planning;

  if (milestones.length === 0) {
    return (
      <p className="surface-muted border-dashed p-6 text-sm text-stone-500">
        {d.noMilestones}
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {milestones.map((ms, idx) => {
        const effectiveStatus = autoStatus(ms);
        const style = statusStyle[effectiveStatus];
        const isLast = idx === milestones.length - 1;
        const date = dateParts(ms.dueDate);

        return (
          <li key={ms._id} className="relative flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`mt-5 h-3 w-3 shrink-0 rounded-full ${style.dot}`} />
              {!isLast && (
                <div className="mt-1 w-px flex-1 bg-stone-200" />
              )}
            </div>

            <div className="mb-6 min-w-0 flex-1 surface p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="h-fit min-w-16 border border-stone-200 bg-stone-50 px-3 py-2 text-center">
                    <p className="font-mono text-2xl font-semibold leading-none text-stone-950">
                      {date.day}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase text-stone-500">
                      {date.month}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`border px-2 py-0.5 text-xs font-semibold ${style.badge}`}
                      >
                        {d.milestoneStatuses[effectiveStatus as keyof typeof d.milestoneStatuses]}
                      </span>
                      <span className="font-mono text-xs text-stone-400">
                        {ms.dueDate}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-stone-950">
                      {ms.title}
                    </h3>
                    {ms.description && (
                      <p className="mt-1 text-sm leading-6 text-stone-500">
                        {ms.description}
                      </p>
                    )}
                    {ms.reachedAt && (
                      <p className="mt-1 text-xs text-emerald-600">
                        ✓ {ms.reachedAt.toLocaleDateString("uk-UA")}
                      </p>
                    )}
                  </div>
                </div>

                {canManage && effectiveStatus === "upcoming" && (
                  <form action={reachMilestone} className="shrink-0">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="projectId" value={projectId} />
                    <input
                      type="hidden"
                      name="milestoneId"
                      value={ms._id ?? ""}
                    />
                    <button
                      type="submit"
                      className="border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      {d.markReached}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
