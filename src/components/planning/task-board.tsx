import { TaskBoardClient, type TaskBoardMember, type TaskBoardTask } from "@/components/planning/task-board-client";
import type { Dictionary } from "@/lib/i18n";
import type { SafeUser, Task } from "@/lib/schemas";

export function TaskBoard({
  tasks,
  members,
  dictionary,
  locale,
  projectId,
  todayIso,
}: {
  tasks: Task[];
  members: SafeUser[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  todayIso: string;
}) {
  const boardTasks: TaskBoardTask[] = tasks.map((task) => ({
    _id: task._id ?? "",
    title: task.title,
    description: task.description,
    parentTaskId: task.parentTaskId,
    assigneeId: task.assigneeId,
    dueDate: task.dueDate,
    priority: task.priority as TaskBoardTask["priority"],
    category: task.category,
    estimatedHours: task.estimatedHours,
    status: (task.status as TaskBoardTask["status"]) ?? "todo",
  }));

  const boardMembers: TaskBoardMember[] = members.map((member) => ({
    _id: member._id ?? "",
    firstName: member.firstName,
    lastName: member.lastName,
  }));

  return (
    <TaskBoardClient
      tasks={boardTasks}
      members={boardMembers}
      dictionary={dictionary}
      locale={locale}
      projectId={projectId}
      todayIso={todayIso}
    />
  );
}
