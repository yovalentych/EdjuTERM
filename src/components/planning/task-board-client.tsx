"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClock, GripVertical, Layers3, Timer, UserRound } from "lucide-react";
import { changeTaskStatus } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";

type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";

export type TaskBoardTask = {
  _id: string;
  title: string;
  description: string;
  parentTaskId: string;
  assigneeId: string;
  dueDate: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  estimatedHours: number;
  status: TaskStatus;
};

export type TaskBoardMember = {
  _id: string;
  firstName: string;
  lastName: string;
};

const groupOrder: TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "done",
  "cancelled",
];

const priorityBorder: Record<string, string> = {
  low: "border-l-stone-300",
  medium: "border-l-blue-400",
  high: "border-l-amber-500",
  critical: "border-l-rose-600",
};

const priorityBadge: Record<string, string> = {
  low: "border-stone-200 bg-stone-50 text-stone-500",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusBadge: Record<string, string> = {
  todo: "border-stone-200 bg-stone-50 text-stone-600",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-stone-200 bg-stone-100 text-stone-400",
};

const groupColors: Record<string, string> = {
  todo: "bg-slate-50 border-slate-200",
  in_progress: "bg-blue-50 border-blue-200",
  review: "bg-amber-50 border-amber-200",
  done: "bg-emerald-50 border-emerald-200",
  cancelled: "bg-slate-50 border-slate-200",
};

function dueDateLabel(
  dueDate: string,
  d: Dictionary["planning"],
  todayIso: string,
): { label: string; color: string } | null {
  if (!dueDate) return null;
  const [todayYear, todayMonth, todayDay] = todayIso.split("-").map(Number);
  const [dueYear, dueMonth, dueDay] = dueDate.split("-").map(Number);
  const todayMs = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const dueMs = Date.UTC(dueYear, dueMonth - 1, dueDay);
  const diff = Math.round((dueMs - todayMs) / 86_400_000);

  if (diff < 0)
    return {
      label: `${d.overdue} ${Math.abs(diff)}д`,
      color: "text-rose-600 font-semibold",
    };
  if (diff === 0)
    return { label: d.dueToday, color: "text-amber-600 font-semibold" };
  if (diff <= 3)
    return { label: `${d.dueSoon} (${diff}д)`, color: "text-amber-500" };
  return { label: dueDate, color: "text-stone-400" };
}

export function TaskBoardClient({
  tasks,
  members,
  dictionary,
  locale,
  projectId,
  todayIso,
}: {
  tasks: TaskBoardTask[];
  members: TaskBoardMember[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  todayIso: string;
}) {
  const d = dictionary.planning;
  const [localTasks, setLocalTasks] = useState(tasks);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const [, startTransition] = useTransition();

  const usersById = useMemo(
    () => new Map(members.map((member) => [member._id, member])),
    [members],
  );
  const tasksById = useMemo(
    () => new Map(localTasks.map((task) => [task._id, task])),
    [localTasks],
  );

  const activeGroups = groupOrder
    .map((status) => ({
      status,
      tasks: localTasks.filter((task) => task.status === status),
    }))
    .filter((group) => group.status !== "cancelled" || group.tasks.length > 0);

  function moveTask(taskId: string, status: TaskStatus) {
    const task = localTasks.find((item) => item._id === taskId);
    if (!task || task.status === status) return;

    setLocalTasks((current) =>
      current.map((item) =>
        item._id === taskId ? { ...item, status } : item,
      ),
    );

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("projectId", projectId);
    formData.set("taskId", taskId);
    formData.set("status", status);

    startTransition(() => {
      void changeTaskStatus(formData);
    });
  }

  if (localTasks.length === 0) {
    return (
      <div className="surface-muted border-dashed p-8 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-600">
          <Layers3 className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-700">{d.noTasks}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {activeGroups.map(({ status, tasks: group }) => (
        <section
          key={status}
          onDragOver={(event) => {
            event.preventDefault();
            setOverStatus(status);
          }}
          onDragLeave={() => setOverStatus(null)}
          onDrop={(event) => {
            event.preventDefault();
            const taskId = event.dataTransfer.getData("text/plain");
            if (taskId) moveTask(taskId, status);
            setDraggedId(null);
            setOverStatus(null);
          }}
          className={`min-h-60 overflow-hidden rounded border shadow-sm transition ${groupColors[status]} ${
            overStatus === status ? "ring-2 ring-blue-400 ring-offset-2" : ""
          }`}
        >
          <div className="flex items-center gap-2 border-b border-inherit bg-white/65 px-4 py-3 backdrop-blur">
            <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${statusBadge[status]}`}>
              {d.taskStatuses[status as keyof typeof d.taskStatuses]}
            </span>
            <span className="ml-auto rounded bg-white/80 px-2 py-0.5 font-mono text-xs font-semibold text-slate-500">
              {group.length}
            </span>
          </div>
          <div className="space-y-2.5 p-3">
            {group.length === 0 ? (
              <p className="rounded border border-dashed border-slate-300 bg-white/65 p-3 text-center text-xs font-medium text-slate-400">
                Перетягніть завдання сюди
              </p>
            ) : (
              group.map((task) => {
                const assignee = task.assigneeId
                  ? usersById.get(task.assigneeId)
                  : undefined;
                const parent = task.parentTaskId
                  ? tasksById.get(task.parentTaskId)
                  : undefined;
                const children = localTasks.filter(
                  (candidate) => candidate.parentTaskId === task._id,
                );
                const due = task.dueDate
                  ? dueDateLabel(task.dueDate, d, todayIso)
                  : null;

                return (
                  <article
                    key={task._id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", task._id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggedId(task._id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    className={`rounded border border-slate-200 border-l-4 bg-white px-3 py-3 shadow-sm transition ${
                      priorityBorder[task.priority]
                    } ${draggedId === task._id ? "opacity-50" : "hover:-translate-y-0.5 hover:shadow-md"}`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-stone-300" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${priorityBadge[task.priority]}`}>
                            {d.priorities[task.priority as keyof typeof d.priorities]}
                          </span>
                          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500">
                            {d.taskCategories[task.category as keyof typeof d.taskCategories]}
                          </span>
                          {children.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-700">
                              <Layers3 className="h-3 w-3" />
                              {children.length} sub
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 font-semibold text-stone-950">
                          {task.title}
                        </p>
                        {parent ? (
                          <p className="mt-1 text-xs text-stone-400">
                            ↳ {parent.title}
                          </p>
                        ) : null}
                        {task.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                            {task.description}
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                          {assignee ? (
                            <span className="inline-flex items-center gap-1 text-stone-500">
                              <UserRound className="h-3 w-3" />
                              {assignee.firstName} {assignee.lastName}
                            </span>
                          ) : null}
                          {due ? (
                            <span className={`inline-flex items-center gap-1 ${due.color}`}>
                              <CalendarClock className="h-3 w-3" />
                              {due.label}
                            </span>
                          ) : null}
                          {task.estimatedHours > 0 ? (
                            <span className="inline-flex items-center gap-1 text-stone-400">
                              <Timer className="h-3 w-3" />
                              {task.estimatedHours} {d.hoursShort}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
