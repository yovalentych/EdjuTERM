import type { Dictionary } from "@/lib/i18n";
import type { Milestone, ResearchStage, Task } from "@/lib/schemas";
import {
  addTaskToStage,
  removeTaskFromStage,
  setStageStatus,
  updateStageProgress,
  updateResearchStage,
  deleteResearchStage,
} from "@/app/actions";
import { ConfirmDeleteButton } from "@/components/ui";

const statusColors: Record<string, string> = {
  planned: "bg-stone-100 text-stone-700 border-stone-300",
  active: "bg-emerald-100 text-emerald-800 border-emerald-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  reported: "bg-purple-100 text-purple-800 border-purple-300",
  overdue: "bg-rose-100 text-rose-800 border-rose-300",
};

const statusBorderColor: Record<string, string> = {
  planned: "border-l-slate-300",
  active: "border-l-emerald-500",
  completed: "border-l-blue-500",
  reported: "border-l-violet-500",
  overdue: "border-l-rose-500",
};

const taskStatusColors: Record<string, string> = {
  todo: "bg-stone-100 text-stone-600",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-stone-100 text-stone-400 line-through",
};

function formatTextBlock(text: string) {
  if (!text.trim()) return null;
  return text.split("\n").map((line, i) => (
    <span key={i} className="block">{line || <br />}</span>
  ));
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
      {children}
    </p>
  );
}

export function ResearchStageCard({
  stage,
  tasks,
  allTasks,
  milestones,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  stage: ResearchStage;
  tasks: Task[];
  allTasks: Task[];
  milestones: Milestone[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.researchPlan;
  const isUk = locale === "uk";

  const linkedMilestone = stage.linkedMilestoneId
    ? milestones.find((m) => m._id === stage.linkedMilestoneId)
    : null;

  const unlinkedTasks = allTasks.filter(
    (t) => !stage.linkedTaskIds.includes(t._id ?? ""),
  );

  const borderColor = statusBorderColor[stage.status] ?? statusBorderColor.planned;
  const statusBadge = statusColors[stage.status] ?? statusColors.planned;
  const statusLabel = d.statuses[stage.status as keyof typeof d.statuses] ?? stage.status;

  const dateRange =
    stage.startDate || stage.endDate
      ? [stage.startDate, stage.endDate].filter(Boolean).join(" – ")
      : d.noDateSet;

  const doneTasksCount = tasks.filter((t) => t.status === "done").length;
  const progressColor =
    stage.status === "active"
      ? "bg-emerald-500"
      : stage.status === "completed" || stage.status === "reported"
      ? "bg-blue-500"
      : "bg-stone-400";

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`border-l-4 ${borderColor} px-5 py-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-mono text-[11px] font-bold text-white shadow-sm">
                {stage.stageNumber}
              </span>
              <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${statusBadge}`}>
                {statusLabel}
              </span>
              {stage.progress != null && stage.progress > 0 && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-700">
                  {stage.progress}%
                </span>
              )}
            </div>
            <p className="text-base font-semibold leading-snug text-stone-900">
              {stage.title}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {dateRange !== d.noDateSet && (
              <p className="text-xs text-stone-500">{dateRange}</p>
            )}
            {stage.budget > 0 && (
              <p className="mt-1 font-mono text-sm font-bold text-amber-700">
                {stage.budget.toLocaleString()} {stage.currency}
              </p>
            )}
            {tasks.length > 0 && (
              <p className="mt-1 text-xs text-stone-400">
                {doneTasksCount}/{tasks.length} {isUk ? "задач" : "tasks"}
              </p>
            )}
          </div>
        </div>

        {linkedMilestone && (
          <div className="mt-2 flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
            <span>◆</span>
            <span className="font-semibold">{isUk ? "Ключова дата:" : "Milestone:"}</span>
            <span>{linkedMilestone.title}</span>
            {linkedMilestone.dueDate && (
              <span className="ml-auto font-mono text-amber-600">{linkedMilestone.dueDate}</span>
            )}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${stage.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* ── Body sections ──────────────────────────────────────────────────── */}
      <div className="divide-y divide-stone-100">

        {/* Goals / Tasks / Indicators — expandable read view */}
        {(stage.goals || stage.tasksText || stage.indicators) && (
          <details className="group">
            <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500 transition hover:bg-indigo-50 hover:text-indigo-700">
              <span className="text-stone-400 transition-transform group-open:rotate-90">▶</span>
              {isUk ? "Цілі · Завдання · Індикатори" : "Goals · Tasks · Indicators"}
            </summary>
            <div className="space-y-4 px-5 pb-5 pt-3">
              {stage.goals && (
                <div>
                  <SectionLabel>{d.goalsLabel}</SectionLabel>
                  <div className="text-sm leading-relaxed text-stone-700">
                    {formatTextBlock(stage.goals)}
                  </div>
                </div>
              )}
              {stage.tasksText && (
                <div>
                  <SectionLabel>{d.tasksLabel}</SectionLabel>
                  <div className="text-sm leading-relaxed text-stone-700">
                    {formatTextBlock(stage.tasksText)}
                  </div>
                </div>
              )}
              {stage.indicators && (
                <div>
                  <SectionLabel>{d.indicatorsLabel}</SectionLabel>
                  <div className="text-sm leading-relaxed text-stone-700">
                    {formatTextBlock(stage.indicators)}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}

        {/* ── Edit stage form ──────────────────────────────────────────────── */}
        {canManage && (
          <details className="group">
            <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500 transition hover:bg-indigo-50 hover:text-indigo-700">
              <span className="text-stone-400 transition-transform group-open:rotate-90">▶</span>
              {isUk ? "Редагувати етап" : "Edit stage"}
            </summary>
            <div className="border-t border-stone-100 bg-slate-50/50 px-5 pb-6 pt-4">
              <form action={updateResearchStage} className="space-y-4">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="stageId" value={stage._id} />

                <div className="grid gap-4 sm:grid-cols-[80px_1fr_160px_160px]">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{d.stageNumber}</label>
                    <input
                      type="number"
                      name="stageNumber"
                      min={1}
                      max={99}
                      defaultValue={stage.stageNumber}
                      className="input-control w-full"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{d.stageTitle} *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={stage.title}
                      required
                      className="input-control w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{d.startDate}</label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={stage.startDate}
                      className="input-control w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{d.endDate}</label>
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={stage.endDate}
                      className="input-control w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{d.goals}</label>
                  <textarea
                    name="goals"
                    rows={3}
                    defaultValue={stage.goals}
                    placeholder={d.goalsPlaceholder}
                    className="input-control w-full text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{d.tasksText}</label>
                  <textarea
                    name="tasksText"
                    rows={3}
                    defaultValue={stage.tasksText}
                    placeholder={d.tasksTextPlaceholder}
                    className="input-control w-full text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">{d.indicators}</label>
                  <textarea
                    name="indicators"
                    rows={2}
                    defaultValue={stage.indicators}
                    placeholder={d.indicatorsPlaceholder}
                    className="input-control w-full text-sm"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{d.budget}</label>
                    <input
                      type="number"
                      name="budget"
                      min={0}
                      step="0.01"
                      defaultValue={stage.budget}
                      className="input-control w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {dictionary.budget?.currency ?? "Валюта"}
                    </label>
                    <select name="currency" defaultValue={stage.currency} className="input-control w-full">
                      {(["UAH", "EUR", "USD"] as const).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{d.linkedMilestone}</label>
                    <select name="linkedMilestoneId" defaultValue={stage.linkedMilestoneId ?? ""} className="input-control w-full">
                      <option value="">—</option>
                      {milestones.map((m) => (
                        <option key={m._id} value={m._id ?? ""}>
                          {m.title} ({m.dueDate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <ConfirmDeleteButton
                    formAction={deleteResearchStage}
                    message={isUk ? `Видалити етап "${stage.title}"?` : `Delete stage "${stage.title}"?`}
                    label={`🗑 ${isUk ? "Видалити етап" : "Delete stage"}`}
                    className="text-xs font-semibold text-stone-400 underline hover:text-rose-600"
                  />
                  <button type="submit" className="control-primary text-xs">
                    {isUk ? "Зберегти зміни" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </details>
        )}

        {/* ── Linked tasks ─────────────────────────────────────────────────── */}
        <details className="group" open={tasks.length > 0}>
          <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500 transition hover:bg-indigo-50 hover:text-indigo-700">
            <span className="text-stone-400 transition-transform group-open:rotate-90">▶</span>
            {d.linkedTasksLabel}
            {tasks.length > 0 && (
              <span className="ml-auto rounded-full bg-stone-200 px-2 py-0.5 font-mono text-[10px] text-stone-600">
                {doneTasksCount}/{tasks.length}
              </span>
            )}
          </summary>

          <div className="px-5 pb-5 pt-2 space-y-3">
            {tasks.length === 0 ? (
              <p className="rounded border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-center text-xs text-stone-400">
                {d.noLinkedTasks}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {tasks.map((task) => (
                  <li
                    key={task._id}
                    className="flex items-center gap-2 rounded border border-stone-200 bg-stone-50 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          taskStatusColors[task.status] ?? taskStatusColors.todo
                        }`}
                      >
                        {d.taskStatuses[task.status as keyof typeof d.taskStatuses] ?? task.status}
                      </span>
                      <span className="text-sm text-stone-800">{task.title}</span>
                    </div>
                    {canManage && (
                      <form action={removeTaskFromStage}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="stageId" value={stage._id} />
                        <input type="hidden" name="taskId" value={task._id} />
                        <button type="submit" className="shrink-0 text-[11px] text-stone-400 underline hover:text-rose-600">
                          {d.unlinkTask}
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canManage && unlinkedTasks.length > 0 && (
              <form action={addTaskToStage} className="flex gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="stageId" value={stage._id} />
                <select name="taskId" className="input-control min-w-0 flex-1 text-sm" required>
                  {unlinkedTasks.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
                <button type="submit" className="control shrink-0 text-sm">
                  {d.linkTask}
                </button>
              </form>
            )}
          </div>
        </details>

        {/* ── Progress + Status management ─────────────────────────────────── */}
        {canManage && (
          <details className="group">
            <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500 transition hover:bg-indigo-50 hover:text-indigo-700">
              <span className="text-stone-400 transition-transform group-open:rotate-90">▶</span>
              {isUk ? "Прогрес та статус" : "Progress & status"}
              <span className="ml-auto rounded-full bg-stone-200 px-2 py-0.5 font-mono text-[10px] text-stone-600">
                {stage.progress ?? 0}% · {statusLabel}
              </span>
            </summary>

            <div className="space-y-4 border-t border-stone-100 bg-slate-50/50 px-5 pb-5 pt-4">
              {/* Progress slider */}
              <div>
                <SectionLabel>
                  {(d as { stageProgress?: string }).stageProgress ?? "Прогрес виконання, %"}
                </SectionLabel>
                <form action={updateStageProgress} className="space-y-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="stageId" value={stage._id} />
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      name="progress"
                      min={0}
                      max={100}
                      step={5}
                      defaultValue={stage.progress ?? 0}
                      className="h-2 flex-1 cursor-pointer accent-indigo-600"
                    />
                    <span className="w-10 shrink-0 text-right font-mono text-sm font-bold text-indigo-700">
                      {stage.progress ?? 0}%
                    </span>
                  </div>
                  <button type="submit" className="control text-xs">
                    {(d as { updateProgress?: string }).updateProgress ?? "Зберегти прогрес"}
                  </button>
                </form>
              </div>

              {/* Status */}
              <div>
                <SectionLabel>{isUk ? "Статус виконання" : "Stage status"}</SectionLabel>
                <form action={setStageStatus} className="space-y-3">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="stageId" value={stage._id} />
                  <div className="flex flex-wrap gap-2">
                    {(["planned", "active", "completed", "reported"] as const).map((s) => (
                      <label
                        key={s}
                        className={`flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-semibold transition has-[:checked]:ring-2 has-[:checked]:ring-indigo-400 ${statusColors[s]}`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          defaultChecked={stage.status === s}
                          className="sr-only"
                        />
                        {d.statuses[s]}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.completionNote}
                    </label>
                    <textarea
                      name="completionNote"
                      rows={2}
                      className="input-control w-full text-sm"
                      defaultValue={stage.completionNote}
                      placeholder={isUk ? "Примітка до статусу (необов'язково)" : "Status note (optional)"}
                    />
                  </div>
                  <button type="submit" className="control-primary text-xs">
                    {d.statusChanged}
                  </button>
                </form>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
