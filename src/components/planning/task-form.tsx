import {
  AlertTriangle,
  ChevronsDown,
  ChevronsUp,
  CircleDot,
  GitBranch,
} from "lucide-react";
import { addTask } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import { taskCategories, taskPriorities } from "@/lib/schemas";
import type { SafeUser, Task } from "@/lib/schemas";

const priorityStyles = {
  low: {
    icon: ChevronsDown,
    className:
      "border-stone-200 bg-stone-50 text-stone-600 has-checked:border-stone-500 has-checked:bg-stone-100 has-checked:text-stone-950",
  },
  medium: {
    icon: CircleDot,
    className:
      "border-blue-200 bg-blue-50 text-blue-700 has-checked:border-blue-600 has-checked:bg-blue-100 has-checked:text-blue-950",
  },
  high: {
    icon: ChevronsUp,
    className:
      "border-amber-200 bg-amber-50 text-amber-700 has-checked:border-amber-600 has-checked:bg-amber-100 has-checked:text-amber-950",
  },
  critical: {
    icon: AlertTriangle,
    className:
      "border-rose-200 bg-rose-50 text-rose-700 has-checked:border-rose-600 has-checked:bg-rose-100 has-checked:text-rose-950",
  },
} as const;

export function TaskForm({
  dictionary,
  locale,
  projectId,
  members,
  tasks,
}: {
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  members: SafeUser[];
  tasks: Task[];
}) {
  const d = dictionary.planning;
  const parentCandidates = tasks.filter(
    (task) => task.status !== "done" && task.status !== "cancelled",
  );

  return (
    <form action={addTask} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="projectId" value={projectId} />

      <div>
        <label className="mb-1 block text-xs font-medium text-stone-700">
          {d.taskTitle} *
        </label>
        <input
          name="title"
          required
          minLength={2}
          maxLength={240}
          placeholder={d.taskTitlePlaceholder}
          className="input-control px-3 py-2 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-stone-700">
          {d.taskDescription}
        </label>
        <textarea
          name="description"
          maxLength={2000}
          rows={2}
          placeholder={d.taskDescriptionPlaceholder}
          className="input-control px-3 py-2 text-sm outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-stone-700">
            {d.priority}
        </p>
        <div className="grid gap-2 sm:grid-cols-4">
          {taskPriorities.map((p) => {
            const Icon = priorityStyles[p].icon;
            return (
              <label
                key={p}
                title={d.priorities[p as keyof typeof d.priorities]}
                className={`group relative flex min-h-16 cursor-pointer items-center gap-2 border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${priorityStyles[p].className}`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  defaultChecked={p === "medium"}
                  className="peer sr-only"
                />
                <Icon className="h-4 w-4" />
                <span>{d.priorities[p as keyof typeof d.priorities]}</span>
                <span className="pointer-events-none absolute -top-9 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded border border-blue-200 bg-white/95 px-2 py-1 text-xs font-medium text-stone-700 shadow-lg shadow-blue-900/10 backdrop-blur group-hover:block">
                  {d.priority}: {d.priorities[p as keyof typeof d.priorities]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">
            {d.category}
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
            {d.dueDate}
          </label>
          <input
            name="dueDate"
            type="date"
            className="input-control px-3 py-2 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-stone-700">
            {d.assignee}
          </label>
          <select
            name="assigneeId"
            className="input-control px-3 py-2 text-sm outline-none"
          >
            <option value="">{d.noAssignee}</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="surface-muted p-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-800">
          <GitBranch className="h-4 w-4 text-blue-600" />
          Planning settings
        </summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-700">
              Parent task
            </label>
            <select
              name="parentTaskId"
              className="input-control px-3 py-2 text-sm outline-none"
              disabled={parentCandidates.length === 0}
            >
              <option value="">No parent task</option>
              {parentCandidates.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-stone-700">
              {d.estimatedHours}
            </label>
            <input
              name="estimatedHours"
              type="number"
              min={0}
              step={0.5}
              defaultValue={0}
              placeholder="0"
              className="input-control px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </details>

      <button
        type="submit"
        className="control-primary px-4 py-2 text-sm font-semibold"
      >
        {d.saveTask}
      </button>
    </form>
  );
}
