import {
  CalendarDays,
  CheckSquare,
  Clock,
  Flag,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { CalendarGrid } from "@/components/planning/calendar-grid";
import { MilestoneTimeline } from "@/components/planning/milestone-timeline";
import { TaskBoard } from "@/components/planning/task-board";
import { TaskForm } from "@/components/planning/task-form";
import { TimeLog } from "@/components/planning/time-log";
import { Breadcrumb, PageHeader, Tabs, type TabItem } from "@/components/ui";
import {
  listMilestones,
  listTasks,
  listTimeEntries,
} from "@/lib/planning";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { addMilestone } from "@/app/actions";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { listSafeUsersByIds } from "@/lib/users";

type Tab = "tasks" | "calendar" | "milestones" | "time";
const validTabs: Tab[] = ["tasks", "calendar", "milestones", "time"];

export default async function PlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    projectId?: string;
    tab?: string;
    month?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, tab, month, saved, error } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const d = dictionary.planning;

  const activeTab: Tab = validTabs.includes(tab as Tab)
    ? (tab as Tab)
    : "tasks";

  const isManager = canManageProject(project, user);
  const baseUrl = `/${localeParam}/app/planning?projectId=${project._id}`;

  // Load all planning data
  const [tasks, milestones, timeEntries, members] = await Promise.all([
    listTasks(project._id),
    listMilestones(project._id),
    listTimeEntries(project._id),
    listSafeUsersByIds([
      project.ownerId,
      project.supervisorId,
      ...project.memberIds,
    ]),
  ]);

  // Calendar month
  const now = new Date();
  let calYear = now.getFullYear();
  let calMonth = now.getMonth();

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (y >= 2020 && y <= 2040 && m >= 1 && m <= 12) {
      calYear = y;
      calMonth = m - 1;
    }
  }

  // Quick stats
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "done" || t.status === "cancelled")
      return false;
    return new Date(t.dueDate) < new Date(now.toISOString().slice(0, 10));
  });
  const activeTasks = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "review",
  );
  const upcomingMilestones = milestones.filter(
    (m) => m.status === "upcoming",
  );

  const tabs: TabItem<Tab>[] = [
    {
      id: "tasks",
      label: d.tabTasks,
      href: `${baseUrl}&tab=tasks`,
      icon: <CheckSquare className="h-4 w-4" />,
      badge:
        tasks.filter((t) => t.status !== "done" && t.status !== "cancelled")
          .length || undefined,
    },
    {
      id: "calendar",
      label: d.tabCalendar,
      href: `${baseUrl}&tab=calendar`,
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: "milestones",
      label: d.tabMilestones,
      href: `${baseUrl}&tab=milestones`,
      icon: <Flag className="h-4 w-4" />,
      badge: upcomingMilestones.length || undefined,
    },
    {
      id: "time",
      label: d.tabTime,
      href: `${baseUrl}&tab=time`,
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="planning"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={d.title}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: d.title },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={d.summary}
        stats={
          <div className="flex flex-wrap gap-2">
            <StatChip
              value={tasks.filter((t) => t.status === "todo").length}
              label="todo"
              tone="slate"
            />
            <StatChip value={activeTasks.length} label="active" tone="blue" />
            <StatChip value={overdueTasks.length} label="overdue" tone="red" />
            <StatChip
              value={tasks.filter((t) => t.status === "done").length}
              label="done"
              tone="green"
            />
            <StatChip
              value={upcomingMilestones.length}
              label="milestones"
              tone="purple"
            />
          </div>
        }
      />

      {/* Status messages */}
      {saved && (
        <p className="status-note border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {saved === "task" && d.taskSaved}
          {saved === "status" && d.statusChanged}
          {saved === "milestone" && d.milestoneSaved}
          {saved === "reached" && d.milestoneReached}
          {saved === "time" && d.timeSaved}
        </p>
      )}
      {error && (
        <p className="status-note border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {d.invalidError}
        </p>
      )}

      <Tabs items={tabs} activeId={activeTab} />

      {/* ── Tab: Tasks ───────────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <>
          {/* Add task form */}
          <section className="surface">
            <details>
              <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-blue-800">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                + {d.addTask}
              </summary>
              <div className="border-t border-stone-200 px-5 pb-6 pt-4">
                <TaskForm
                  dictionary={dictionary}
                  locale={localeParam}
                  projectId={project._id}
                  members={members}
                  tasks={tasks}
                />
              </div>
            </details>
          </section>

          {/* Task board */}
          <section>
            <TaskBoard
              tasks={tasks}
              members={members}
              dictionary={dictionary}
              locale={localeParam}
              projectId={project._id}
              todayIso={now.toISOString().slice(0, 10)}
            />
          </section>
        </>
      )}

      {/* ── Tab: Calendar ─────────────────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <>
          {/* Overdue / upcoming strip */}
          {overdueTasks.length > 0 && (
            <section className="status-note border border-rose-200 bg-rose-50 p-4">
              <p className="mb-2 text-sm font-semibold text-rose-800">
                {d.overdue}: {overdueTasks.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {overdueTasks.map((t) => (
                  <span
                    key={t._id}
                    className="border border-rose-300 bg-white px-2 py-1 text-xs text-rose-700"
                  >
                    {t.title} · {t.dueDate}
                  </span>
                ))}
              </div>
            </section>
          )}

          <CalendarGrid
            tasks={tasks}
            milestones={milestones}
            year={calYear}
            month={calMonth}
            dictionary={dictionary}
            locale={localeParam}
            projectId={project._id}
          />
        </>
      )}

      {/* ── Tab: Milestones ──────────────────────────────────────────────── */}
      {activeTab === "milestones" && (
        <>
          {/* Add milestone form */}
          {isManager && (
            <section className="surface">
              <details>
                <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-blue-800">
                  <Flag className="h-4 w-4 text-blue-600" />
                  + {d.addMilestone}
                </summary>
                <div className="border-t border-stone-200 px-5 pb-6 pt-4">
                  <form action={addMilestone} className="space-y-4">
                    <input type="hidden" name="locale" value={localeParam} />
                    <input type="hidden" name="projectId" value={project._id} />

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-stone-700">
                          {d.milestoneTitle} *
                        </label>
                        <input
                          name="title"
                          required
                          minLength={2}
                          maxLength={200}
                          placeholder={d.milestoneTitlePlaceholder}
                          className="input-control px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-stone-700">
                          {d.milestoneDueDate} *
                        </label>
                        <input
                          name="dueDate"
                          type="date"
                          required
                          className="input-control px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-stone-700">
                          {d.milestoneDescription}
                        </label>
                        <textarea
                          name="description"
                          maxLength={1000}
                          rows={2}
                          className="input-control px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="control-primary px-4 py-2 text-sm font-semibold"
                    >
                      {d.saveMilestone}
                    </button>
                  </form>
                </div>
              </details>
            </section>
          )}

          <MilestoneTimeline
            milestones={milestones}
            dictionary={dictionary}
            locale={localeParam}
            projectId={project._id}
            canManage={isManager}
          />
        </>
      )}

      {/* ── Tab: Time log ────────────────────────────────────────────────── */}
      {activeTab === "time" && (
        <TimeLog
          entries={timeEntries}
          tasks={tasks}
          members={members}
          dictionary={dictionary}
          locale={localeParam}
          projectId={project._id}
          currentUser={user}
        />
      )}
    </ProjectShell>
  );
}

function StatChip({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "slate" | "blue" | "red" | "green" | "purple";
}) {
  const colors = {
    slate: "border-slate-200 bg-white text-slate-600",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div className={`flex items-center gap-2 rounded border px-3 py-1.5 text-xs shadow-sm ${colors[tone]}`}>
      <span className="font-mono text-sm font-bold">{value}</span>
      <span>{label}</span>
    </div>
  );
}
