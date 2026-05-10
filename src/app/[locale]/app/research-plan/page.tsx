import { notFound, redirect } from "next/navigation";
import { ProjectShell } from "@/components/project-shell";
import { ProjectGanttChart } from "@/components/research-plan/project-gantt-chart";
import { ResearchStageCard } from "@/components/research-plan/research-stage-card";
import { SetupChecklist } from "@/components/research-plan/setup-checklist";
import { PublicationsTab } from "@/components/research-plan/publications-tab";
import { DeliverablesTab } from "@/components/research-plan/deliverables-tab";
import { MilestonesTab } from "@/components/research-plan/milestones-tab";
import { Breadcrumb, PageHeader, Tabs, type TabItem } from "@/components/ui";
import { listResearchStages } from "@/lib/research-plan";
import { listPublications, listDeliverables } from "@/lib/research-publications";
import { listMilestones, listTasks } from "@/lib/planning";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { addResearchStage } from "@/app/actions";

type Tab = "timeline" | "stages" | "milestones" | "publications" | "deliverables";
const validTabs: Tab[] = ["timeline", "stages", "milestones", "publications", "deliverables"];

export default async function ResearchPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    projectId?: string;
    tab?: string;
    saved?: string;
    error?: string;
  }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, tab, saved, error } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const d = dictionary.researchPlan;

  const activeTab: Tab = validTabs.includes(tab as Tab) ? (tab as Tab) : "timeline";
  const isManager = canManageProject(project, user);
  const baseUrl = `/${localeParam}/app/research-plan?projectId=${project._id}`;

  const [stages, milestones, tasks, publications, deliverables] = await Promise.all([
    listResearchStages(project._id),
    listMilestones(project._id),
    listTasks(project._id),
    listPublications(project._id),
    listDeliverables(project._id),
  ]);

  // Summary stats
  const totalBudget = stages.reduce((sum, s) => sum + s.budget, 0);
  const activeCount = stages.filter((s) => s.status === "active").length;
  const completedCount = stages.filter(
    (s) => s.status === "completed" || s.status === "reported",
  ).length;
  const overallProgress =
    stages.length > 0
      ? Math.round(
          stages.reduce((sum, s) => sum + (s.progress ?? 0), 0) / stages.length,
        )
      : 0;
  const completedDeliverables = deliverables.filter((d) => d.status === "completed").length;

  const dExt = d as typeof d & {
    tabPublications?: string;
    tabDeliverables?: string;
    publicationSaved?: string;
    pubStatusSaved?: string;
    deliverableSaved?: string;
    delivStatusSaved?: string;
    progressSaved?: string;
    overallProgress?: string;
    stageProgressLabel?: string;
  };

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="research-plan"
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
        description={d.subtitle}
        stats={
          <div className="flex flex-wrap gap-3">
            <div className="rounded border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-stone-900">{stages.length}</p>
              <p className="text-xs text-stone-500">{d.totalStages}</p>
            </div>
            <div className="rounded border border-blue-200 bg-blue-50 px-4 py-2.5 text-center">
              <p className="text-2xl font-bold text-blue-700">{activeCount}</p>
              <p className="text-xs text-blue-600">Active</p>
            </div>
            <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-emerald-700">{completedCount}</p>
              <p className="text-xs text-emerald-600">{d.completedStages}</p>
            </div>
            {totalBudget > 0 && (
              <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2.5 text-center">
                <p className="font-mono text-xl font-bold text-amber-700">
                  {totalBudget.toLocaleString()}
                </p>
                <p className="text-xs text-amber-600">{d.totalBudget}</p>
              </div>
            )}
            <div className="rounded border border-blue-200 bg-blue-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-700">{publications.length}</p>
              <p className="text-xs text-blue-600">{dExt.tabPublications ?? "Публікації"}</p>
            </div>
            <div className="rounded border border-violet-200 bg-violet-50 px-4 py-2.5 text-center shadow-sm">
              <p className="text-2xl font-bold text-violet-700">{completedDeliverables}</p>
              <p className="text-xs text-violet-600">{dExt.tabDeliverables ?? "Результати"}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
              <p className="font-mono text-xl font-bold text-stone-700">{overallProgress}%</p>
              <p className="text-xs text-stone-500">{dExt.overallProgress ?? "Прогрес"}</p>
            </div>
          </div>
        }
      />

      {/* Status messages */}
      {/* Status messages */}
      {(saved || error) && (() => {
        const msgs: Record<string, [string, string]> = {
          stage:            ["indigo", localeParam === "uk" ? "Етап збережено." : "Stage saved."],
          stage_updated:    ["indigo", localeParam === "uk" ? "Етап оновлено." : "Stage updated."],
          stage_deleted:    ["stone",  localeParam === "uk" ? "Етап видалено." : "Stage deleted."],
          status:           ["blue",   d.statusChanged],
          progress:         ["indigo", localeParam === "uk" ? "Прогрес оновлено." : "Progress saved."],
          publication:      ["indigo", localeParam === "uk" ? "Публікацію збережено." : "Publication saved."],
          pub_status:       ["indigo", localeParam === "uk" ? "Статус публікації оновлено." : "Publication status updated."],
          pub_updated:      ["indigo", localeParam === "uk" ? "Публікацію оновлено." : "Publication updated."],
          pub_deleted:      ["stone",  localeParam === "uk" ? "Публікацію видалено." : "Publication deleted."],
          deliverable:      ["violet", localeParam === "uk" ? "Результат збережено." : "Deliverable saved."],
          deliv_status:     ["violet", localeParam === "uk" ? "Статус результату оновлено." : "Deliverable status updated."],
          deliv_updated:    ["violet", localeParam === "uk" ? "Результат оновлено." : "Deliverable updated."],
          deliv_deleted:    ["stone",  localeParam === "uk" ? "Результат видалено." : "Deliverable deleted."],
          linked:           ["emerald",localeParam === "uk" ? "Задачу прив'язано." : "Task linked."],
          unlinked:         ["stone",  localeParam === "uk" ? "Задачу від'єднано." : "Task unlinked."],
          milestone_updated:["amber",  localeParam === "uk" ? "Ключову дату оновлено." : "Milestone updated."],
          milestone_deleted:["stone",  localeParam === "uk" ? "Ключову дату видалено." : "Milestone deleted."],
          milestone:        ["amber",  localeParam === "uk" ? "Ключову дату збережено." : "Milestone saved."],
        };
        const errorMsgs: Record<string, string> = {
          invalid:   d.invalidError,
          forbidden: d.forbiddenError,
        };
        if (error && errorMsgs[error]) {
          return (
            <p className="status-note rounded border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {errorMsgs[error]}
            </p>
          );
        }
        const entry = saved ? msgs[saved] : undefined;
        if (!entry) return null;
        const [color, msg] = entry;
        const cls = color === "stone"
          ? "border-stone-200 bg-stone-50 text-stone-600"
          : color === "violet"
          ? "border-violet-200 bg-violet-50 text-violet-700"
          : color === "emerald"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : color === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : color === "blue"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-indigo-200 bg-indigo-50 text-indigo-700";
        return (
          <p className={`status-note rounded border px-4 py-2 text-sm ${cls}`}>
            ✓ {msg}
          </p>
        );
      })()}

      {/* Setup checklist — hidden once all steps are complete */}
      <SetupChecklist
        stages={stages}
        tasks={tasks}
        milestones={milestones}
        locale={localeParam}
        projectId={project._id ?? ""}
        baseUrl={baseUrl}
      />

      <Tabs
        activeId={activeTab}
        items={
          [
            { id: "timeline", label: d.tabOverview, href: `${baseUrl}&tab=timeline` },
            { id: "stages", label: d.tabStages, href: `${baseUrl}&tab=stages`, badge: stages.length || undefined },
            {
              id: "milestones",
              label: localeParam === "uk" ? "Ключові дати" : "Milestones",
              href: `${baseUrl}&tab=milestones`,
              badge: milestones.length || undefined,
            },
            {
              id: "publications",
              label: dExt.tabPublications ?? "Публікації",
              href: `${baseUrl}&tab=publications`,
              badge: publications.length || undefined,
            },
            {
              id: "deliverables",
              label: dExt.tabDeliverables ?? "Результати",
              href: `${baseUrl}&tab=deliverables`,
              badge: deliverables.length || undefined,
            },
          ] satisfies TabItem<Tab>[]
        }
      />

      {/* ── Timeline tab ─────────────────────────────────────────────────── */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          {stages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-6 py-10 text-center">
              <p className="text-2xl">📅</p>
              <p className="mt-2 text-sm font-semibold text-indigo-800">
                {localeParam === "uk" ? "Ганта ще немає" : "No Gantt chart yet"}
              </p>
              <p className="mt-1 text-xs text-indigo-600">
                {localeParam === "uk"
                  ? 'Перейдіть на вкладку "Етапи", створіть хоча б один етап і вкажіть дати початку та кінця.'
                  : 'Go to the "Stages" tab, create at least one stage, and set start and end dates.'}
              </p>
              <a
                href={`${baseUrl}&tab=stages`}
                className="mt-4 inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
              >
                {localeParam === "uk" ? "Перейти до Етапів →" : "Go to Stages →"}
              </a>
            </div>
          ) : (
            <ProjectGanttChart
              stages={stages}
              tasks={tasks}
              milestones={milestones}
              dictionary={dictionary}
              locale={localeParam}
            />
          )}

          {/* Compact stage list below gantt */}
          {stages.length > 0 && (
            <div className="surface overflow-hidden rounded-lg border border-stone-200">
              <div className="border-b border-stone-200 px-5 py-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">
                  {d.tabStages}
                </h3>
              </div>
              <ul className="divide-y divide-stone-100">
                {stages.map((stage) => {
                  const statusLabel =
                    d.statuses[stage.status as keyof typeof d.statuses] ??
                    stage.status;
                  const dateRange =
                    stage.startDate || stage.endDate
                      ? [stage.startDate, stage.endDate]
                          .filter(Boolean)
                          .join(" – ")
                      : d.noDateSet;

                  const badgeColor: Record<string, string> = {
                    planned: "bg-stone-100 text-stone-600",
                    active: "bg-blue-100 text-blue-700",
                    completed: "bg-indigo-100 text-indigo-700",
                    reported: "bg-purple-100 text-purple-700",
                    overdue: "bg-rose-100 text-rose-700",
                  };

                  return (
                    <li
                      key={stage._id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <span className="font-mono text-xs font-bold text-stone-400">
                        #{stage.stageNumber}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-stone-800">
                        {stage.title}
                      </span>
                      <span className="text-xs text-stone-400">{dateRange}</span>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          badgeColor[stage.status] ?? badgeColor.planned
                        }`}
                      >
                        {statusLabel}
                      </span>
                      {stage.budget > 0 && (
                        <span className="font-mono text-xs text-stone-500">
                          {stage.budget.toLocaleString()} {stage.currency}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Stage Progress section */}
          {stages.length > 0 && (
            <div className="surface overflow-hidden rounded-lg border border-stone-200">
              <div className="border-b border-stone-200 px-5 py-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600">
                  {dExt.stageProgressLabel ?? "Прогрес"}
                </h3>
              </div>
              <ul className="divide-y divide-stone-100">
                {stages.map((stage) => (
                  <li key={stage._id} className="px-5 py-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-stone-700">
                        <span className="mr-2 font-mono text-xs font-bold text-stone-400">
                          #{stage.stageNumber}
                        </span>
                        {stage.title.slice(0, 60)}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-semibold text-indigo-600">
                        {stage.progress ?? 0}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${stage.progress ?? 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Stages tab ───────────────────────────────────────────────────── */}
      {activeTab === "stages" && (
        <div className="space-y-5">
          {/* Add stage form — auto-open when no stages exist */}
          <details className="surface group overflow-hidden rounded-lg border border-stone-200" {...(stages.length === 0 ? { open: true } : {})}>
            <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-4 font-semibold text-stone-700 hover:bg-stone-50">
              <span className="font-mono text-indigo-600 transition-transform group-open:rotate-45">
                +
              </span>
              {d.addStage}
            </summary>
            <div className="border-t border-stone-100 px-5 pb-6 pt-4">
              <form action={addResearchStage} className="space-y-4">
                <input type="hidden" name="locale" value={localeParam} />
                <input type="hidden" name="projectId" value={project._id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.stageNumber} *
                    </label>
                    <input
                      type="number"
                      name="stageNumber"
                      min={1}
                      max={99}
                      defaultValue={stages.length + 1}
                      required
                      className="input-control w-full"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.startDate}
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      className="input-control w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    {d.stageTitle} *
                  </label>
                  <textarea
                    name="title"
                    rows={3}
                    required
                    placeholder={d.stageTitlePlaceholder}
                    className="input-control w-full"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.endDate}
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="input-control w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.budget}
                    </label>
                    <input
                      type="number"
                      name="budget"
                      min={0}
                      step="0.01"
                      defaultValue={0}
                      className="input-control w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    {d.goals}
                  </label>
                  <textarea
                    name="goals"
                    rows={4}
                    placeholder={d.goalsPlaceholder}
                    className="input-control w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    {d.tasksText}
                  </label>
                  <textarea
                    name="tasksText"
                    rows={5}
                    placeholder={d.tasksTextPlaceholder}
                    className="input-control w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-600">
                    {d.indicators}
                  </label>
                  <textarea
                    name="indicators"
                    rows={4}
                    placeholder={d.indicatorsPlaceholder}
                    className="input-control w-full"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {d.linkedMilestone}
                    </label>
                    <select name="linkedMilestoneId" className="input-control w-full">
                      <option value="">— {dictionary.planning.noAssignee} —</option>
                      {milestones.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title} ({m.dueDate})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      {dictionary.budget.currency}
                    </label>
                    <select name="currency" className="input-control w-full">
                      {(["UAH", "EUR", "USD"] as const).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="control-primary">
                    {d.saveStage}
                  </button>
                </div>
              </form>
            </div>
          </details>

          {/* Stage cards */}
          {stages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-8 text-center">
              <p className="text-xs text-stone-400">
                {localeParam === "uk"
                  ? "Заповніть форму вище, щоб додати перший етап ЕВП."
                  : "Fill in the form above to add your first research stage."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage) => {
                const stageTasks = tasks.filter((t) =>
                  stage.linkedTaskIds.includes(t._id ?? ""),
                );
                return (
                  <ResearchStageCard
                    key={stage._id}
                    stage={stage}
                    tasks={stageTasks}
                    allTasks={tasks}
                    milestones={milestones}
                    dictionary={dictionary}
                    locale={localeParam}
                    projectId={project._id ?? ""}
                    canManage={isManager}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Milestones tab ───────────────────────────────────────────────── */}
      {activeTab === "milestones" && (
        <MilestonesTab
          milestones={milestones}
          stages={stages}
          dictionary={dictionary}
          locale={localeParam}
          projectId={project._id ?? ""}
          canManage={isManager}
        />
      )}

      {/* ── Publications tab ─────────────────────────────────────────────── */}
      {activeTab === "publications" && (
        <PublicationsTab
          publications={publications}
          stages={stages}
          dictionary={dictionary}
          locale={localeParam}
          projectId={project._id ?? ""}
          canManage={isManager}
        />
      )}

      {/* ── Deliverables tab ─────────────────────────────────────────────── */}
      {activeTab === "deliverables" && (
        <DeliverablesTab
          deliverables={deliverables}
          stages={stages}
          dictionary={dictionary}
          locale={localeParam}
          projectId={project._id ?? ""}
          canManage={isManager}
        />
      )}
    </ProjectShell>
  );
}
