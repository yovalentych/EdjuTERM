import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Target, ClipboardList, Microscope, DollarSign } from "lucide-react";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getItemForUser } from "@/lib/workspaces";
import { ITEM_TYPE_META, LEARNING_TYPES, type ItemType } from "@/lib/workspaces-meta";
import { listResearchStages } from "@/lib/research-plan";
import { listTasks, listMilestones } from "@/lib/planning";
import { listExperiments } from "@/lib/experiments";
import { listBudgetPeriods } from "@/lib/budget";
import { TaskBoard } from "@/components/planning/task-board";
import { ScienceTabsClient } from "./science-tabs-client";
import { AddStageInline, AddTaskInline } from "./inline-create";
import { LearningTopLevelNav } from "@/components/items/learning-top-level-nav";

const TAB_LABELS = {
  stages:        { icon: ClipboardList, uk: "Етапи дослідження",  en: "Research Stages"   },
  tasks:         { icon: Target,        uk: "Задачі",              en: "Tasks"             },
  experiments:   { icon: Microscope,    uk: "Експерименти",        en: "Experiments"       },
  budget:        { icon: DollarSign,    uk: "Бюджет",              en: "Budget"            },
} as const;

type TabKey = keyof typeof TAB_LABELS;
const ALL_TABS = Object.keys(TAB_LABELS) as TabKey[];

export default async function ItemSciencePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; wsId: string; itemId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale: localeParam, wsId, itemId } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);
  const item = await getItemForUser(itemId, user);
  if (!item) notFound();

  if (!LEARNING_TYPES.includes(item.type as ItemType)) {
    redirect(`/${localeParam}/app/space/${wsId}/items/${itemId}`);
  }

  const sp = await searchParams;
  if (sp.tab === "phd-plan") {
    redirect(`/${localeParam}/app/space/${wsId}/items/${itemId}/plan`);
  }
  const activeTab: TabKey = ALL_TABS.includes(sp.tab as TabKey) ? (sp.tab as TabKey) : "stages";
  const isPhd = item.type === "phd";
  const isUk = localeParam === "uk";
  const meta = ITEM_TYPE_META[item.type as ItemType];
  const dataId = item.legacyProjectId || item._id || "";
  const todayIso = new Date().toISOString().slice(0, 10);

  // Parallel data fetch — only what the active tab needs
  const [stages, tasks, milestones, experiments, budgetPeriods] = await Promise.all([
    (activeTab === "stages") ? listResearchStages(dataId).catch(() => []) : Promise.resolve([]),
    (activeTab === "tasks") ? listTasks(dataId).catch(() => []) : Promise.resolve([]),
    (activeTab === "tasks") ? listMilestones(dataId).catch(() => []) : Promise.resolve([]),
    (activeTab === "experiments") ? listExperiments(dataId).catch(() => []) : Promise.resolve([]),
    (activeTab === "budget") ? listBudgetPeriods(dataId).catch(() => []) : Promise.resolve([]),
  ]);

  const tabsMeta = (isPhd ? ALL_TABS : ALL_TABS.filter((t) => t !== "experiments")).map((t) => ({
    id: t,
    label: isUk ? TAB_LABELS[t].uk : TAB_LABELS[t].en,
  }));

  const sciLabel = isUk
    ? { bachelor: "Кваліфікаційна робота", master: "Магістерська робота", phd: "Дисертація" }[item.type as "bachelor" | "master" | "phd"] ?? "Наукова складова"
    : { bachelor: "Thesis", master: "Master's Thesis", phd: "Dissertation" }[item.type as "bachelor" | "master" | "phd"] ?? "Science Track";

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      <div className="flex flex-col gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href={`/${localeParam}/app/space/${wsId}/items/${itemId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold backdrop-blur transition hover:bg-white"
            style={{ color: meta.color }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {item.title.split(" — ")[0]}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <FlaskConical className="h-3.5 w-3.5" />
            {sciLabel}
          </span>
        </div>

        <LearningTopLevelNav
          locale={localeParam}
          wsId={wsId}
          itemId={itemId}
          learningType={item.type}
          active="science"
          color={meta.color}
        />

        {/* Tab nav */}
        <ScienceTabsClient
          tabs={tabsMeta}
          activeTab={activeTab}
          locale={localeParam}
          wsId={wsId}
          itemId={itemId}
          color={meta.color}
        />

        {/* ── stages ── */}
        {activeTab === "stages" && (
          <div className="flex flex-col gap-4">
            <AddStageInline dataId={dataId} color={meta.color} isUk={isUk} />
            <ResearchStagesSection
              stages={stages}
              dataId={dataId}
              locale={localeParam}
              wsId={wsId}
              itemId={itemId}
              color={meta.color}
              isUk={isUk}
            />
          </div>
        )}

        {/* ── tasks ── */}
        {activeTab === "tasks" && (
          <div className="flex flex-col gap-4">
            <AddTaskInline dataId={dataId} isUk={isUk} />
            <TaskBoard
              tasks={tasks}
              members={[user]}
              dictionary={dictionary}
              locale={localeParam}
              projectId={dataId}
              todayIso={todayIso}
            />
          </div>
        )}

        {/* ── experiments ── */}
        {activeTab === "experiments" && isPhd && (
          <ExperimentsSection
            experiments={experiments}
            dataId={dataId}
            locale={localeParam}
            color={meta.color}
            isUk={isUk}
          />
        )}

        {/* ── budget ── */}
        {activeTab === "budget" && (
          <BudgetSection
            budgetPeriods={budgetPeriods}
            dataId={dataId}
            locale={localeParam}
            color={meta.color}
            isUk={isUk}
          />
        )}
      </div>
    </LiquidAppShell>
  );
}

// ── Research Stages ──────────────────────────────────────────────────────────

function ResearchStagesSection({
  stages, dataId, locale, wsId, itemId, color, isUk,
}: {
  stages: any[]; dataId: string; locale: string; wsId: string; itemId: string; color: string; isUk: boolean;
}) {
  const STATUS_LABEL: Record<string, { uk: string; en: string; cls: string }> = {
    planned:   { uk: "Заплановано", en: "Planned",   cls: "bg-slate-100 text-slate-600" },
    active:    { uk: "Активний",   en: "Active",     cls: "bg-emerald-100 text-emerald-700" },
    completed: { uk: "Завершено",  en: "Completed",  cls: "bg-blue-100 text-blue-700" },
    reported:  { uk: "Звітовано", en: "Reported",   cls: "bg-violet-100 text-violet-700" },
    paused:    { uk: "Пауза",     en: "Paused",     cls: "bg-amber-100 text-amber-700" },
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-slate-900">
        {isUk ? "Етапи дослідження" : "Research Stages"}
        {stages.length > 0 && (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
            {stages.length}
          </span>
        )}
      </h2>

      {stages.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-8 text-center">
          <ClipboardList className="mx-auto mb-2 h-7 w-7 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">
            {isUk ? "Використайте форму вище щоб додати перший етап" : "Use the form above to add the first stage"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {stages.map((s: any, i: number) => {
            const st = STATUS_LABEL[s.status] ?? STATUS_LABEL.planned;
            return (
              <div key={s._id} className="flex items-start gap-3 rounded-xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200/60">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black" style={{ backgroundColor: color + "15", color }}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{s.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                      {isUk ? st.uk : st.en}
                    </span>
                  </div>
                  {(s.startDate || s.endDate) && (
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {s.startDate && s.startDate.slice(0, 10)} {s.startDate && s.endDate && "→"} {s.endDate && s.endDate.slice(0, 10)}
                    </p>
                  )}
                  {s.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{s.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Experiments ──────────────────────────────────────────────────────────────

function ExperimentsSection({
  experiments, dataId, locale, color, isUk,
}: {
  experiments: any[]; dataId: string; locale: string; color: string; isUk: boolean;
}) {
  const EXP_STATUS: Record<string, { uk: string; en: string; cls: string }> = {
    planned:   { uk: "Заплановано", en: "Planned",    cls: "bg-slate-100 text-slate-600" },
    running:   { uk: "Виконується", en: "Running",    cls: "bg-emerald-100 text-emerald-700" },
    completed: { uk: "Завершено",   en: "Completed",  cls: "bg-blue-100 text-blue-700" },
    failed:    { uk: "Невдалий",    en: "Failed",     cls: "bg-rose-100 text-rose-700" },
    on_hold:   { uk: "Зупинено",    en: "On hold",    cls: "bg-amber-100 text-amber-700" },
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">{isUk ? "Експерименти" : "Experiments"}</h2>
        <Link
          href={`/${locale}/app/project?projectId=${dataId}#experiments`}
          className="text-[11px] font-bold hover:underline"
          style={{ color }}
        >
          {isUk ? "Перейти до проєкту →" : "Go to project →"}
        </Link>
      </div>

      {experiments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
          <Microscope className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">{isUk ? "Експериментів ще немає" : "No experiments yet"}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {experiments.map((e: any) => {
            const st = EXP_STATUS[e.status] ?? EXP_STATUS.planned;
            return (
              <div key={e._id} className="rounded-xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200/60">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm text-slate-900">{e.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>
                    {isUk ? st.uk : st.en}
                  </span>
                </div>
                {e.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{e.description}</p>}
                {e.startDate && <p className="mt-2 text-[10px] text-slate-400">{isUk ? "Початок:" : "Start:"} {e.startDate.slice(0, 10)}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Budget ───────────────────────────────────────────────────────────────────

function BudgetSection({
  budgetPeriods, dataId, locale, color, isUk,
}: {
  budgetPeriods: any[]; dataId: string; locale: string; color: string; isUk: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">{isUk ? "Бюджет" : "Budget"}</h2>
        <Link
          href={`/${locale}/app/budget?projectId=${dataId}`}
          className="text-[11px] font-bold hover:underline"
          style={{ color }}
        >
          {isUk ? "Повний бюджет →" : "Full budget →"}
        </Link>
      </div>

      {budgetPeriods.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
          <DollarSign className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">{isUk ? "Бюджет не заповнено" : "No budget yet"}</p>
          <Link
            href={`/${locale}/app/budget?projectId=${dataId}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white"
            style={{ background: color }}
          >
            <DollarSign className="h-3.5 w-3.5" />
            {isUk ? "Відкрити бюджет" : "Open budget"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {budgetPeriods.map((p: any) => (
            <div key={p._id} className="flex items-center justify-between rounded-xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-200/60">
              <div>
                <p className="font-bold text-sm text-slate-900">{p.title}</p>
                {p.totalBudget && (
                  <p className="text-xs text-slate-500">{isUk ? "Сума:" : "Amount:"} {p.totalBudget.toLocaleString()} грн</p>
                )}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {p.status === "active" ? (isUk ? "Активний" : "Active") : (isUk ? "Закрито" : "Closed")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
