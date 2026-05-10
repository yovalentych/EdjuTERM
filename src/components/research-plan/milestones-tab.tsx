import type { Dictionary } from "@/lib/i18n";
import type { Milestone, ResearchStage } from "@/lib/schemas";
import { addMilestone, updateMilestone, deleteMilestone } from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui";

const statusBadge: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 border-blue-200",
  reached: "bg-emerald-100 text-emerald-700 border-emerald-200",
  missed: "bg-rose-100 text-rose-700 border-rose-200",
};

const statusDot: Record<string, string> = {
  upcoming: "bg-blue-400",
  reached: "bg-emerald-500",
  missed: "bg-rose-500",
};

function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("uk-UA", { day: "2-digit", month: "short", year: "numeric" });
}

export function MilestonesTab({
  milestones,
  stages,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  milestones: Milestone[];
  stages: ResearchStage[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const isUk = locale === "uk";
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const upcoming = milestones.filter((m) => m.status === "upcoming" && m.dueDate >= todayStr);
  const reached = milestones.filter((m) => m.status === "reached");
  const missed = milestones.filter(
    (m) => m.status === "missed" || (m.status === "upcoming" && m.dueDate < todayStr),
  );
  const overduePct =
    milestones.length > 0 ? Math.round((missed.length / milestones.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Stats */}
      {milestones.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded border border-stone-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <p className="text-2xl font-bold text-stone-900">{milestones.length}</p>
            <p className="text-xs text-stone-500">{isUk ? "Всього" : "Total"}</p>
          </div>
          <div className="rounded border border-blue-200 bg-blue-50 px-4 py-2.5 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-700">{upcoming.length}</p>
            <p className="text-xs text-blue-600">{isUk ? "Заплановано" : "Upcoming"}</p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-700">{reached.length}</p>
            <p className="text-xs text-emerald-600">{isUk ? "Досягнуто" : "Reached"}</p>
          </div>
          {missed.length > 0 && (
            <div className="rounded border border-rose-200 bg-rose-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-rose-700">{missed.length}</p>
              <p className="text-xs text-rose-600">{isUk ? "Прострочено" : "Overdue"}</p>
            </div>
          )}
          {reached.length > 0 && (
            <div className="rounded border border-stone-200 bg-white px-4 py-2.5 text-center shadow-sm">
              <p className="font-mono text-xl font-bold text-stone-700">
                {Math.round((reached.length / milestones.length) * 100)}%
              </p>
              <p className="text-xs text-stone-500">{isUk ? "Виконано" : "Completion"}</p>
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {canManage && (
        <details className="surface group overflow-hidden rounded-lg border border-stone-200" open={milestones.length === 0}>
          <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-4 font-semibold text-stone-700 hover:bg-stone-50">
            <span className="font-mono text-indigo-600 transition-transform group-open:rotate-45">+</span>
            {isUk ? "Додати ключову дату" : "Add milestone"}
          </summary>
          <div className="border-t border-stone-100 px-5 pb-6 pt-4">
            <form action={addMilestone} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="projectId" value={projectId} />
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    {isUk ? "Назва ключової дати *" : "Milestone title *"}
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    minLength={2}
                    placeholder={isUk ? "Наприклад: Перший проміжний звіт" : "e.g. First interim report submitted"}
                    className="input-control w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    {isUk ? "Дата *" : "Due date *"}
                  </label>
                  <input type="date" name="dueDate" required className="input-control w-full" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  {isUk ? "Опис / критерій виконання" : "Description / completion criterion"}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder={isUk ? "Що саме вважається виконаним?" : "What counts as done?"}
                  className="input-control w-full"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="control-primary">
                  {isUk ? "Зберегти ключову дату" : "Save milestone"}
                </button>
              </div>
            </form>
          </div>
        </details>
      )}

      {/* Milestone list */}
      {milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center">
          <p className="text-2xl">🏁</p>
          <p className="mt-2 text-sm font-semibold text-stone-600">
            {isUk ? "Ключових дат ще немає" : "No milestones yet"}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {isUk
              ? "Ключові дати (milestones) — це контрольні точки проєкту: звіти, захисти, дедлайни грантодавця."
              : "Milestones mark key project checkpoints: reports, defences, funder deadlines."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...milestones]
            .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
            .map((ms) => {
              const isOverdue =
                ms.status === "upcoming" && ms.dueDate < todayStr;
              const effectiveStatus = isOverdue ? "missed" : ms.status;
              const linkedStage = stages.find((s) => s.linkedMilestoneId === ms._id);
              const daysUntil = ms.dueDate
                ? Math.round(
                    (new Date(ms.dueDate).getTime() - now.getTime()) / 86400000,
                  )
                : null;

              return (
                <details key={ms._id} className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
                  <summary className="flex cursor-pointer select-none items-center gap-3 px-5 py-3.5 hover:bg-stone-50">
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDot[effectiveStatus] ?? "bg-stone-300"}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {ms.title}
                      </p>
                      {ms.description && (
                        <p className="mt-0.5 truncate text-xs text-stone-400">{ms.description}</p>
                      )}
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      {linkedStage && (
                        <span className="hidden rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 sm:inline">
                          Е{linkedStage.stageNumber}
                        </span>
                      )}
                      <span className="font-mono text-xs text-stone-500">
                        {fmtDate(ms.dueDate)}
                      </span>
                      {daysUntil !== null && ms.status === "upcoming" && !isOverdue && (
                        <span className="text-[10px] text-stone-400">
                          ({daysUntil >= 0 ? `+${daysUntil}d` : `${daysUntil}d`})
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold ${statusBadge[effectiveStatus] ?? statusBadge.upcoming}`}
                      >
                        {effectiveStatus === "upcoming"
                          ? isUk ? "Заплановано" : "Upcoming"
                          : effectiveStatus === "reached"
                          ? isUk ? "Досягнуто" : "Reached"
                          : isUk ? "Прострочено" : "Overdue"}
                      </span>
                      <span className="text-xs text-stone-400 transition-transform group-open:rotate-180">▼</span>
                    </div>
                  </summary>

                  {/* Expanded: edit form + actions */}
                  <div className="border-t border-stone-100 bg-stone-50/50 px-5 pb-5 pt-4 space-y-4">
                    {canManage && (
                      <form action={updateMilestone} className="space-y-3">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="milestoneId" value={ms._id} />
                        <div className="grid gap-3 sm:grid-cols-[1fr_160px_140px]">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">
                              {isUk ? "Назва" : "Title"}
                            </label>
                            <input
                              type="text"
                              name="title"
                              defaultValue={ms.title}
                              required
                              className="input-control w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">
                              {isUk ? "Дата" : "Due date"}
                            </label>
                            <input
                              type="date"
                              name="dueDate"
                              defaultValue={ms.dueDate}
                              required
                              className="input-control w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-stone-600">
                              {isUk ? "Статус" : "Status"}
                            </label>
                            <select name="status" defaultValue={ms.status} className="input-control w-full text-sm">
                              <option value="upcoming">{isUk ? "Заплановано" : "Upcoming"}</option>
                              <option value="reached">{isUk ? "Досягнуто" : "Reached"}</option>
                              <option value="missed">{isUk ? "Пропущено" : "Missed"}</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-stone-600">
                            {isUk ? "Опис" : "Description"}
                          </label>
                          <textarea
                            name="description"
                            rows={2}
                            defaultValue={ms.description}
                            className="input-control w-full text-sm"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <ConfirmDeleteButton
                            formAction={deleteMilestone}
                            message={isUk ? "Видалити ключову дату?" : "Delete this milestone?"}
                            label={isUk ? "Видалити" : "Delete"}
                            className="text-xs text-stone-400 underline hover:text-rose-600"
                          />
                          <button type="submit" className="control-primary text-xs">
                            {isUk ? "Зберегти" : "Save changes"}
                          </button>
                        </div>
                      </form>
                    )}

                    {!canManage && ms.description && (
                      <p className="text-sm leading-relaxed text-stone-600">{ms.description}</p>
                    )}
                  </div>
                </details>
              );
            })}
        </div>
      )}

      {/* Timeline mini-view */}
      {milestones.length > 1 && (() => {
        const sorted = [...milestones].sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);
        const first = new Date(sorted[0].dueDate).getTime();
        const last = new Date(sorted[sorted.length - 1].dueDate).getTime();
        const span = last - first || 1;
        return (
          <div className="surface rounded-lg border border-stone-200 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-400">
              {isUk ? "Часова лінія" : "Timeline"}
            </p>
            <div className="relative h-6">
              <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-stone-200" />
              {sorted.map((ms) => {
                const msTime = new Date(ms.dueDate).getTime();
                const leftPct = ((msTime - first) / span) * 100;
                const isOverdue = ms.status === "upcoming" && ms.dueDate < todayStr;
                const color = ms.status === "reached" ? "bg-emerald-500" : isOverdue ? "bg-rose-500" : "bg-blue-400";
                return (
                  <div
                    key={ms._id}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${leftPct}%` }}
                    title={`${ms.title} (${ms.dueDate})`}
                  >
                    <div className={`h-3.5 w-3.5 rotate-45 ${color} shadow-sm`} />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-stone-400">
              <span>{sorted[0].dueDate}</span>
              <span>{sorted[sorted.length - 1].dueDate}</span>
            </div>
          </div>
        );
      })()}

      {overduePct >= 50 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">
            ⚠ {isUk
              ? `${overduePct}% ключових дат прострочено. Перегляньте план та оновіть дати.`
              : `${overduePct}% of milestones are overdue. Review your plan and update dates.`}
          </p>
        </div>
      )}
    </div>
  );
}
