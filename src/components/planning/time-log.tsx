import { logTime } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import { taskCategories } from "@/lib/schemas";
import type { SafeUser, Task, TimeEntry } from "@/lib/schemas";

export function TimeLog({
  entries,
  tasks,
  members,
  dictionary,
  locale,
  projectId,
  currentUser,
}: {
  entries: TimeEntry[];
  tasks: Task[];
  members: SafeUser[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  currentUser: SafeUser;
}) {
  const d = dictionary.planning;
  const usersById = new Map(members.map((m) => [m._id ?? "", m]));
  const tasksById = new Map(tasks.map((t) => [t._id ?? "", t]));

  // Monthly totals per user
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthEntries = entries.filter((e) =>
    e.date.startsWith(thisMonthPrefix),
  );

  const userMonthTotals = new Map<string, number>();
  for (const e of thisMonthEntries) {
    userMonthTotals.set(e.userId, (userMonthTotals.get(e.userId) ?? 0) + e.hours);
  }

  const today = now.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Log time form */}
      <div className="surface p-5">
        <h3 className="mb-4 text-base font-semibold text-stone-950">
          {d.logTime}
        </h3>
        <form action={logTime} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">
                {d.timeDate} *
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={today}
                className="input-control px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">
                {d.timeHours} *
              </label>
              <input
                name="hours"
                type="number"
                required
                min={0.25}
                max={24}
                step={0.25}
                placeholder={d.timeHoursPlaceholder}
                className="input-control px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">
                {d.timeCategory}
              </label>
              <select
                name="category"
                defaultValue="research"
                className="input-control px-3 py-2 text-sm outline-none"
              >
                {taskCategories.map((c) => (
                  <option key={c} value={c}>
                    {d.taskCategories[c as keyof typeof d.taskCategories]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">
                {d.linkedTask}
              </label>
              <select
                name="taskId"
                className="input-control px-3 py-2 text-sm outline-none"
              >
                <option value="">{d.noLinkedTask}</option>
                {tasks
                  .filter((t) => t.status !== "cancelled" && t.status !== "done")
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-700">
              {d.timeDescription}
            </label>
            <input
              name="description"
              maxLength={500}
              placeholder={d.timeDescriptionPlaceholder}
              className="input-control px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            className="control-primary px-4 py-2 text-sm font-semibold"
          >
            {d.logTime}
          </button>
        </form>
      </div>

      {/* Monthly summary */}
      {userMonthTotals.size > 0 && (
        <div className="surface p-5">
          <h3 className="mb-4 text-base font-semibold text-stone-950">
            {d.thisMonth}
          </h3>
          <div className="space-y-2">
            {Array.from(userMonthTotals.entries()).map(([uid, hours]) => {
              const member = usersById.get(uid);
              const maxHours = Math.max(...Array.from(userMonthTotals.values()));
              const pct = Math.round((hours / maxHours) * 100);
              return (
                <div key={uid} className="flex items-center gap-3">
                  <p className="w-32 shrink-0 text-xs text-stone-700">
                    {member
                      ? `${member.firstName} ${member.lastName}`
                      : uid.slice(-6)}
                  </p>
                  <div className="flex-1 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="w-16 text-right font-mono text-xs font-semibold text-stone-700">
                    {hours} {d.hoursShort}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="surface">
        <div className="border-b border-stone-200 px-5 py-4">
          <h3 className="text-base font-semibold text-stone-950">
            {d.totalHours}:{" "}
            <span className="font-mono">
              {entries.reduce((sum, e) => sum + e.hours, 0)} {d.hoursShort}
            </span>
          </h3>
        </div>

        {entries.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-400">{d.noTimeEntries}</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {entries.map((entry) => {
              const member = usersById.get(entry.userId);
              const task = entry.taskId ? tasksById.get(entry.taskId) : undefined;
              const isOwn = entry.userId === currentUser._id;

              return (
                <div
                  key={entry._id}
                  className={`flex items-start gap-4 px-5 py-3 ${isOwn ? "bg-emerald-50/30" : ""}`}
                >
                  <div className="shrink-0 text-center">
                    <p className="font-mono text-sm font-bold text-stone-950">
                      {entry.hours}
                    </p>
                    <p className="text-xs text-stone-400">{d.hoursShort}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-stone-500">
                        {entry.date}
                      </span>
                      <span className="border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-xs text-stone-500">
                        {d.taskCategories[entry.category as keyof typeof d.taskCategories]}
                      </span>
                      {task && (
                        <span className="border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                          {task.title}
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="mt-0.5 text-sm text-stone-600">
                        {entry.description}
                      </p>
                    )}
                    {member && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        {member.firstName} {member.lastName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
