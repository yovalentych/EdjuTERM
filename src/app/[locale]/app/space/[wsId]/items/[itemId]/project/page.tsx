import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Target, ClipboardList, DollarSign,
  Rocket, Handshake, BookOpen, Globe, Lightbulb, Mic, Coins, FlaskConical,
} from "lucide-react";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getItemForUser } from "@/lib/workspaces";
import { ITEM_TYPE_META, LEARNING_TYPES, PROJECT_TYPES, type ItemType } from "@/lib/workspaces-meta";
import { listResearchStages } from "@/lib/research-plan";
import { listTasks, listMilestones } from "@/lib/planning";
import { listBudgetPeriods } from "@/lib/budget";
import { TaskBoard } from "@/components/planning/task-board";
import { ScienceTabsClient } from "../science/science-tabs-client";

// ── Tab config per item type ─────────────────────────────────────────────────

const TYPE_TABS: Record<string, string[]> = {
  individual_research: ["stages", "tasks", "budget"],
  grant:               ["stages", "tasks", "budget"],
  collaboration:       ["tasks", "stages"],
  study_group:         ["tasks"],
  seminar:             ["tasks"],
  open_science:        ["tasks"],
  idea:                ["tasks"],
};

const TAB_LABELS: Record<string, { icon: typeof Target; uk: string; en: string }> = {
  stages:  { icon: ClipboardList, uk: "Етапи", en: "Stages" },
  tasks:   { icon: Target,        uk: "Задачі", en: "Tasks"  },
  budget:  { icon: DollarSign,    uk: "Бюджет", en: "Budget" },
};

const TYPE_ICON: Record<string, typeof Target> = {
  individual_research: FlaskConical,
  grant:               Coins,
  collaboration:       Handshake,
  study_group:         BookOpen,
  seminar:             Mic,
  open_science:        Globe,
  idea:                Lightbulb,
};

const TYPE_LABEL_UK: Record<string, string> = {
  individual_research: "Дослідження",
  grant:               "Грант",
  collaboration:       "Колаборація",
  study_group:         "Навч. група",
  seminar:             "Семінар",
  open_science:        "Open Science",
  idea:                "Ідея",
};

export default async function ItemProjectPage({
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

  // Only for project types (not learning, not lab)
  if (LEARNING_TYPES.includes(item.type as ItemType) || item.type === "laboratory") {
    redirect(`/${localeParam}/app/space/${wsId}/items/${itemId}`);
  }

  const meta = ITEM_TYPE_META[item.type as ItemType];
  const allowedTabs = TYPE_TABS[item.type] ?? ["tasks"];
  const isUk = localeParam === "uk";
  const dataId = item.legacyProjectId || item._id || "";
  const todayIso = new Date().toISOString().slice(0, 10);

  const sp = await searchParams;
  const activeTab = allowedTabs.includes(sp.tab ?? "") ? (sp.tab as string) : allowedTabs[0];

  // Parallel data fetch — only what the active tab needs
  const [stages, tasks, milestones, budgetPeriods] = await Promise.all([
    (activeTab === "stages") ? listResearchStages(dataId).catch(() => []) : Promise.resolve([]),
    (activeTab === "tasks")  ? listTasks(dataId).catch(() => [])          : Promise.resolve([]),
    (activeTab === "tasks")  ? listMilestones(dataId).catch(() => [])     : Promise.resolve([]),
    (activeTab === "budget") ? listBudgetPeriods(dataId).catch(() => [])  : Promise.resolve([]),
  ]);

  const tabsMeta = allowedTabs.map((t) => ({
    id: t,
    label: isUk ? TAB_LABELS[t].uk : TAB_LABELS[t].en,
  }));

  const TypeIcon = TYPE_ICON[item.type] ?? Rocket;
  const typeLabel = isUk
    ? (TYPE_LABEL_UK[item.type] ?? meta.label)
    : meta.label;

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
            <TypeIcon className="h-3.5 w-3.5" />
            {typeLabel}
          </span>
        </div>

        {/* Tab nav */}
        <ScienceTabsClient
          tabs={tabsMeta}
          activeTab={activeTab}
          locale={localeParam}
          wsId={wsId}
          itemId={itemId}
          basePath="project"
          color={meta.color}
        />

        {/* ── stages ── */}
        {activeTab === "stages" && (
          <ProjectStagesSection
            stages={stages}
            dataId={dataId}
            locale={localeParam}
            wsId={wsId}
            itemId={itemId}
            color={meta.color}
            isUk={isUk}
          />
        )}

        {/* ── tasks ── */}
        {activeTab === "tasks" && (
          <TaskBoard
            tasks={tasks}
            members={[user]}
            dictionary={dictionary}
            locale={localeParam}
            projectId={dataId}
            todayIso={todayIso}
          />
        )}

        {/* ── budget ── */}
        {activeTab === "budget" && (
          <ProjectBudgetSection
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

function ProjectStagesSection({
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
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">{isUk ? "Етапи проєкту" : "Project Stages"}</h2>
        <Link
          href={`/${locale}/app/research-plan?projectId=${dataId}`}
          className="text-[11px] font-bold hover:underline"
          style={{ color }}
        >
          {isUk ? "Розширений вигляд →" : "Full view →"}
        </Link>
      </div>

      {stages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">
            {isUk ? "Етапи не додані" : "No stages yet"}
          </p>
          <Link
            href={`/${locale}/app/research-plan?projectId=${dataId}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {isUk ? "Додати перший етап →" : "Add first stage →"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {stages.map((stage: any) => {
            const s = STATUS_LABEL[stage.status] ?? STATUS_LABEL.planned;
            return (
              <div
                key={stage._id}
                className="flex items-center gap-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{ backgroundColor: color }}
                >
                  {stage.stageNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{stage.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {stage.startDate} — {stage.endDate}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>
                    {isUk ? s.uk : s.en}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${stage.progress ?? 0}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{stage.progress ?? 0}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Budget ───────────────────────────────────────────────────────────────────

function ProjectBudgetSection({
  budgetPeriods, dataId, locale, color, isUk,
}: {
  budgetPeriods: any[]; dataId: string; locale: string; color: string; isUk: boolean;
}) {
  const totalPlanned = budgetPeriods.reduce((s: number, p: any) => s + (p.totalPlanned ?? 0), 0);
  const totalSpent   = budgetPeriods.reduce((s: number, p: any) => s + (p.totalSpent ?? 0), 0);
  const pct = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">{isUk ? "Бюджет проєкту" : "Project Budget"}</h2>
        <Link
          href={`/${locale}/app/budget?projectId=${dataId}`}
          className="text-[11px] font-bold hover:underline"
          style={{ color }}
        >
          {isUk ? "Детальний бюджет →" : "Detailed budget →"}
        </Link>
      </div>

      {budgetPeriods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <DollarSign className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">
            {isUk ? "Бюджетних даних немає" : "No budget data yet"}
          </p>
          <Link
            href={`/${locale}/app/budget?projectId=${dataId}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {isUk ? "Відкрити бюджет →" : "Open budget →"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Summary bar */}
          <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">
                {isUk ? "Загальне освоєння" : "Overall spending"}
              </span>
              <span className="text-sm font-black text-slate-900">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? "#be123c" : color }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
              <span>{isUk ? "Витрачено" : "Spent"}: {formatMoney(totalSpent)}</span>
              <span>{isUk ? "Планово" : "Planned"}: {formatMoney(totalPlanned)}</span>
            </div>
          </div>

          {/* Periods */}
          {budgetPeriods.slice(0, 3).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-3.5 shadow-sm backdrop-blur">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xs font-black"
                   style={{ backgroundColor: color }}>
                {p.year ?? i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {isUk ? `Рік ${p.year ?? i + 1}` : `Year ${p.year ?? i + 1}`}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatMoney(p.totalSpent ?? 0)} / {formatMoney(p.totalPlanned ?? 0)}
                </p>
              </div>
              <span className="text-sm font-black" style={{ color }}>
                {p.totalPlanned > 0 ? `${Math.round(((p.totalSpent ?? 0) / p.totalPlanned) * 100)}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat("uk-UA").format(Math.round(v));
}
