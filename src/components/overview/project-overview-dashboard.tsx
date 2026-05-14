import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Database,
  Globe,
  ListChecks,
  Milestone,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { Project, ProjectRecord, SafeUser, TeamMessage } from "@/lib/schemas";
import { getBudgetSummary } from "@/lib/budget";
import { DashboardLayout, DashboardSection } from "@/components/dashboard/dashboard-layout";
import { listMilestones, listTasks, listTimeEntries } from "@/lib/planning";
import { listResearchStages } from "@/lib/research-plan";
import { listDeliverables, listPublications } from "@/lib/research-publications";
import { HoursAreaChart, MilestoneStatusBar, ActivityHeatmap } from "./charts";

// ── Label maps ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  personnel: "Персонал",
  equipment: "Обладнання",
  reagents: "Реагенти",
  consumables: "Витратні",
  travel: "Відрядження",
  services: "Послуги",
  subcontracting: "Субпідряд",
  overhead: "Накладні",
  software: "ПЗ",
  publications: "Публікації",
  other: "Інше",
};

const STAGE_STATUS_LABELS: Record<string, string> = {
  planned: "Заплановано",
  active: "В роботі",
  completed: "Завершено",
  reported: "Звітовано",
  paused: "Пауза",
};

const PUB_STATUS_LABELS: Record<string, string> = {
  published: "Опублікована",
  submitted: "Подана",
  under_review: "На рецензії",
  in_progress: "В роботі",
  planned: "Заплановано",
  rejected: "Відхилена",
};

const KIND_LABELS: Record<string, string> = {
  dataset: "Датасет",
  protocol: "Протокол",
  analysis: "Аналіз",
  report: "Звіт",
  other: "Інше",
};

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString("uk-UA"); }
function formatMoney(n: number) { return `${fmt(Math.round(n))} ₴`; }

function formatDate(value?: string) {
  if (!value) return "Без дати";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("uk-UA", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(value: string, now: Date) {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;
  return Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function ratio(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

function initials(user: SafeUser) {
  return `${(user.firstName?.[0] ?? "").toUpperCase()}${(user.lastName?.[0] ?? "").toUpperCase()}`;
}

// ── Small components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  eyebrow,
  icon,
  href,
  insight,
  insightTone = "slate",
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  href?: string;
  insight?: string;
  insightTone?: "blue" | "emerald" | "amber" | "rose" | "slate";
  children: ReactNode;
  className?: string;
}) {
  const insightColors = {
    blue: "bg-blue-50/80 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50/80 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50/80 text-amber-700 border-amber-100",
    rose: "bg-rose-50/80 text-rose-700 border-rose-100",
    slate: "bg-slate-50/80 text-slate-600 border-slate-100",
  };

  return (
    <DashboardSection className={`surface overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100/50 bg-white/40 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50 text-blue-700 shadow-sm">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{eyebrow}</p>}
            <h2 className="truncate font-serif text-lg font-bold text-slate-900">{title}</h2>
          </div>
        </div>
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
            Відкрити <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {insight && (
        <div className={`border-b px-6 py-3 text-xs font-semibold ${insightColors[insightTone]}`}>
          {insight}
        </div>
      )}
      <div className="flex-1 p-6">{children}</div>
    </DashboardSection>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm font-medium text-slate-400 shadow-sm">
      {children}
    </div>
  );
}

function TaskChip({ label, count, tone }: { label: string; count: number; tone: "blue" | "emerald" | "amber" | "rose" | "slate" }) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 shadow-blue-100/50",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100/50",
    amber: "border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100/50",
    rose: "border-rose-200 bg-rose-50 text-rose-700 shadow-rose-100/50",
    slate: "border-slate-200 bg-slate-50 text-slate-600 shadow-slate-100/50",
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border p-3 shadow-sm transition-transform hover:-translate-y-0.5 ${colors[tone]}`}>
      <span className="font-serif text-2xl font-bold leading-none">{count}</span>
      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
    </div>
  );
}

function MiniBar({ label, value, max, color = "bg-blue-500" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="truncate text-slate-700">{label}</span>
        <span className="shrink-0 font-mono text-slate-500">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <div className="text-right">
        <span className="font-bold text-slate-900">{value}</span>
        {sub && <span className="ml-1 text-[11px] text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-4 border-t border-slate-100/70" />;
}

function ActionRow({
  title,
  meta,
  tone = "slate",
}: {
  title: string;
  meta?: string;
  tone?: "rose" | "amber" | "blue" | "emerald" | "slate";
}) {
  const dot = {
    rose: "bg-rose-500",
    amber: "bg-amber-400",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white/70 px-4 py-3 text-sm shadow-sm transition hover:bg-white hover:shadow-md">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot[tone]} shadow-sm`} />
      <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{title}</span>
      {meta && <span className="shrink-0 font-mono text-[10px] text-slate-500">{meta}</span>}
    </div>
  );
}

function CommandMetric({
  label,
  value,
  detail,
  icon,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: ReactNode;
  tone?: "rose" | "amber" | "blue" | "emerald" | "slate";
}) {
  const toneClasses = {
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-white text-slate-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${toneClasses[tone]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function NextActionLink({
  href,
  title,
  meta,
  tone = "slate",
}: {
  href: string;
  title: string;
  meta: string;
  tone?: "rose" | "amber" | "blue" | "emerald" | "slate";
}) {
  const dot = {
    rose: "bg-rose-500",
    amber: "bg-amber-400",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    slate: "bg-slate-300",
  };

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-blue-200 hover:bg-blue-50/60"
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot[tone]}`} />
      <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{title}</span>
      <span className="shrink-0 font-mono text-[10px] text-slate-500">{meta}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export async function ProjectOverviewDashboard({
  project,
  records,
  members,
  teamMessages,
  openScienceCount,
  locale,
}: {
  project: Project;
  records: ProjectRecord[];
  members: SafeUser[];
  teamMessages: TeamMessage[];
  openScienceCount: number;
  locale: Locale;
}) {
  const pid = project._id ?? "";
  const base = `/${locale}/app/project?projectId=${pid}`;
  const planHref = `/${locale}/app/planning?projectId=${pid}`;
  const budgetHref = `/${locale}/app/budget?projectId=${pid}`;
  const researchHref = `/${locale}/app/research-plan?projectId=${pid}`;
  const now = new Date();
  const nowMs = now.getTime();

  const [budget, tasks, milestones, stages, publications, deliverables, timeEntries] = await Promise.all([
    getBudgetSummary(pid),
    listTasks(pid),
    listMilestones(pid),
    listResearchStages(pid),
    listPublications(pid),
    listDeliverables(pid),
    listTimeEntries(pid),
  ]);

  // ── Budget ────────────────────────────────────────────────────────────────
  const budgetTotal = budget.totalPlanned;
  const budgetSpent = budget.totalSpent;
  const budgetCommitted = budget.totalCommitted;
  const budgetPct = ratio(budgetSpent, budgetTotal);
  const committedPct = ratio(budgetSpent + budgetCommitted, budgetTotal);
  const topCategories = budget.byCategory
    .filter((c) => c.planned > 0 || c.spent > 0)
    .sort((a, b) => b.planned - a.planned)
    .slice(0, 5)
    .map((c) => ({ ...c, label: CATEGORY_LABELS[c.category] ?? c.category }));

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const reviewTasks = tasks.filter((t) => t.status === "review").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const overdueList = tasks
    .filter((t) => t.dueDate && t.status !== "done" && t.status !== "cancelled" && new Date(t.dueDate) < now)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const urgentList = [
    ...overdueList,
    ...tasks.filter((t) => {
      if (!t.dueDate || t.status === "done" || t.status === "cancelled") return false;
      const d = daysUntil(t.dueDate, now);
      return d !== null && d >= 0 && d <= 7;
    }),
  ]
    .filter((t, i, arr) => arr.findIndex((x) => x._id === t._id) === i)
    .slice(0, 5);

  // ── Milestones ────────────────────────────────────────────────────────────
  const milestonesReached = milestones.filter((m) => m.status === "reached").length;
  const milestonesUpcoming = milestones.filter((m) => m.status === "upcoming").length;
  const milestonesMissed = milestones.filter((m) => m.status === "missed").length;
  const nextMilestone = milestones
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  // ── Stages ────────────────────────────────────────────────────────────────
  const avgStageProgress = stages.length > 0
    ? Math.round(stages.reduce((s, st) => s + (st.progress ?? 0), 0) / stages.length)
    : 0;
  const activeStages = stages.filter((s) => s.status === "active");
  const displayStages = [...activeStages, ...stages.filter((s) => s.status === "planned")]
    .sort((a, b) => a.stageNumber - b.stageNumber)
    .slice(0, 4);

  // ── Records ───────────────────────────────────────────────────────────────
  const totalFiles = records.reduce((s, r) => s + r.rawDataFiles.length, 0);
  const openReadyRecords = records.filter((r) => r.access === "open" || r.access === "embargoed").length;
  const kindCounts: Record<string, number> = {};
  for (const r of records) kindCounts[r.kind] = (kindCounts[r.kind] ?? 0) + 1;

  // ── Publications & deliverables ───────────────────────────────────────────
  const completedDeliverables = deliverables.filter((d) => d.status === "completed").length;
  const delayedDeliverables = deliverables.filter((d) => d.status === "delayed").length;
  const upcomingDeliverables = deliverables
    .filter((d) => d.status !== "completed")
    .sort((a, b) => (a.plannedDate || "9999").localeCompare(b.plannedDate || "9999"))
    .slice(0, 3);

  // ── Team & hours ──────────────────────────────────────────────────────────
  const monthlyHours: { month: string; hours: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("uk-UA", { month: "short" });
    const hours = timeEntries
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
      })
      .reduce((s, e) => s + e.hours, 0);
    monthlyHours.push({ month: label, hours });
  }
  const last30Hours = timeEntries
    .filter((e) => nowMs - new Date(e.date).getTime() <= 30 * 24 * 60 * 60 * 1000)
    .reduce((s, e) => s + e.hours, 0);
  const recentMessages = [...teamMessages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const recentMsgCount = teamMessages.filter(
    (m) => nowMs - new Date(m.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
  ).length;

  // ── Activity data ──────────────────────────────────────────────────────────
  const activityData: Record<string, number> = {};
  const allEvents = [
    ...tasks.map(t => t.updatedAt || t.createdAt),
    ...records.map(r => r.updatedAt || r.createdAt),
    ...teamMessages.map(m => m.createdAt),
  ];
  allEvents.forEach(e => {
    if (!e) return;
    const d = new Date(e).toISOString().split("T")[0];
    activityData[d] = (activityData[d] ?? 0) + 1;
  });
  const heatmapData = Object.entries(activityData).map(([date, value]) => ({ date, value }));

  // ── Health ────────────────────────────────────────────────────────────────
  const budgetAhead = budgetTotal > 0 && budgetPct > avgStageProgress + 20;
  const hasRisk = overdueList.length > 0 || milestonesMissed > 0 || delayedDeliverables > 0 || budgetAhead;
  const hasWarning = hasRisk || urgentList.length > 0;
  const healthTone = hasRisk ? "rose" : hasWarning ? "amber" : "emerald";
  const healthLabel = hasRisk ? "Потрібна увага" : hasWarning ? "Є найближчі ризики" : "Стабільно";
  const nextActions = [
    ...(overdueList.length > 0
      ? [{
          href: planHref,
          title: `Закрити прострочені задачі (${overdueList.length})`,
          meta: "Planning",
          tone: "rose" as const,
        }]
      : []),
    ...(urgentList.length > 0
      ? [{
          href: planHref,
          title: `Перевірити найближчі дедлайни (${urgentList.length})`,
          meta: "7 днів",
          tone: "amber" as const,
        }]
      : []),
    ...(budgetAhead
      ? [{
          href: budgetHref,
          title: "Звірити бюджет із фактичним прогресом",
          meta: `${budgetPct}%`,
          tone: "amber" as const,
        }]
      : []),
    ...(delayedDeliverables > 0
      ? [{
          href: researchHref,
          title: `Оновити затримані deliverables (${delayedDeliverables})`,
          meta: "Outputs",
          tone: "rose" as const,
        }]
      : []),
    ...(records.length === 0
      ? [{
          href: `${base}&tab=records`,
          title: "Додати перші записи доказової бази",
          meta: "Evidence",
          tone: "blue" as const,
        }]
      : []),
    ...(nextMilestone
      ? [{
          href: researchHref,
          title: `Підготувати milestone: ${nextMilestone.title}`,
          meta: formatDate(nextMilestone.dueDate),
          tone: "blue" as const,
        }]
      : []),
  ].slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Command center ───────────────────────────────────────────────── */}
        <DashboardSection className="surface overflow-hidden rounded-lg bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Project command center</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Стан проєкту і найближчі дії</h2>
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold ${
                healthTone === "rose"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : healthTone === "amber"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}>
                {healthTone === "emerald"
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <AlertTriangle className="h-4 w-4" />}
                {healthLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            <CommandMetric
              label="Наступна точка"
              value={nextMilestone ? formatDate(nextMilestone.dueDate) : "—"}
              detail={nextMilestone ? nextMilestone.title : "Milestone ще не заплановано."}
              icon={<Milestone className="h-4 w-4" />}
              tone={nextMilestone ? "blue" : "slate"}
            />
            <CommandMetric
              label="Evidence"
              value={records.length}
              detail={`${totalFiles} файлів · ${openReadyRecords} записів готові до open science`}
              icon={<Database className="h-4 w-4" />}
              tone={records.length > 0 ? "emerald" : "slate"}
            />
            <CommandMetric
              label="Execution"
              value={`${avgStageProgress}%`}
              detail={`${tasks.length} задач · ${overdueList.length} прострочено · ${milestonesUpcoming} milestone в плані`}
              icon={<ListChecks className="h-4 w-4" />}
              tone={overdueList.length > 0 ? "rose" : urgentList.length > 0 ? "amber" : "blue"}
            />
            <CommandMetric
              label="Budget"
              value={budgetTotal > 0 ? `${budgetPct}%` : "—"}
              detail={budgetTotal > 0 ? `${formatMoney(budgetSpent)} витрачено з ${formatMoney(budgetTotal)}` : "Кошторис ще не налаштовано."}
              icon={<Wallet className="h-4 w-4" />}
              tone={budgetAhead ? "amber" : budgetTotal > 0 ? "blue" : "slate"}
            />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Next actions</p>
              <Link href={planHref} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Відкрити planning →
              </Link>
            </div>
            {nextActions.length > 0 ? (
              <div className="grid gap-2 xl:grid-cols-2">
                {nextActions.map((action) => (
                  <NextActionLink
                    key={`${action.href}-${action.title}`}
                    href={action.href}
                    title={action.title}
                    meta={action.meta}
                    tone={action.tone}
                  />
                ))}
              </div>
            ) : (
              <EmptyState>Критичних дій немає. Продовжуй оновлювати записи, задачі та результати.</EmptyState>
            )}
          </div>
        </DashboardSection>

        {/* ── Row 1: Execution + Finance ─────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

          {/* Execution */}
          <SectionCard
            title="Виконання"
            eyebrow="Execution"
            icon={<TrendingUp className="h-4 w-4" />}
            href={planHref}
            insight={
              overdueList.length > 0
                ? `${overdueList.length} прострочених задач — закрий їх першими`
                : urgentList.length > 0
                  ? `${urgentList.length} задач закінчуються найближчими 7 днями`
                  : "Критичних блокерів не виявлено"
            }
            insightTone={overdueList.length > 0 ? "rose" : urgentList.length > 0 ? "amber" : "emerald"}
          >
            {/* Task status chips */}
            <div className="grid grid-cols-4 gap-3">
              <TaskChip label="В роботі" count={inProgressTasks} tone="blue" />
              <TaskChip label="Перевірка" count={reviewTasks} tone="amber" />
              <TaskChip label="Готово" count={doneTasks} tone="emerald" />
              <TaskChip label="Заплановано" count={todoTasks} tone="slate" />
            </div>

            {/* Urgent tasks */}
            {urgentList.length > 0 && (
              <>
                <Divider />
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Потребують дії</p>
                <div className="space-y-2">
                  {urgentList.map((t) => (
                    <ActionRow
                      key={t._id ?? t.title}
                      title={t.title}
                      meta={t.dueDate ? formatDate(t.dueDate) : undefined}
                      tone={new Date(t.dueDate) < now ? "rose" : "amber"}
                    />
                  ))}
                </div>
              </>
            )}

            {urgentList.length === 0 && tasks.length === 0 && (
              <><Divider /><EmptyState>Задачі ще не додані. Відкрий планування та створи перший спринт.</EmptyState></>
            )}

            {/* Next milestone */}
            <Divider />
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Контрольна точка</p>
            {nextMilestone ? (
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-blue-100/50 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-serif text-lg font-bold text-slate-900">{nextMilestone.title}</p>
                  <span className="shrink-0 rounded-lg border border-blue-300 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-blue-700 shadow-sm">
                    {formatDate(nextMilestone.dueDate)}
                  </span>
                </div>
                {(() => {
                  const d = daysUntil(nextMilestone.dueDate, now);
                  return d !== null && (
                    <p className="mt-2 text-xs font-semibold text-blue-700">
                      {d <= 0 ? "Вже настала" : d === 1 ? "Завтра" : `За ${d} дн.`}
                    </p>
                  );
                })()}
              </div>
            ) : (
              <EmptyState>Контрольних точок ще немає. Додай milestone, щоб бачити дедлайн.</EmptyState>
            )}

            {/* Milestone bar */}
            {milestones.length > 0 && (
              <>
                <div className="mt-4">
                  <MilestoneStatusBar reached={milestonesReached} upcoming={milestonesUpcoming} missed={milestonesMissed} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs font-medium text-slate-500">
                  <span><b className="block font-serif text-xl font-bold text-emerald-700">{milestonesReached}</b>досягнуто</span>
                  <span><b className="block font-serif text-xl font-bold text-blue-700">{milestonesUpcoming}</b>план</span>
                  <span><b className="block font-serif text-xl font-bold text-rose-700">{milestonesMissed}</b>зрив</span>
                </div>
              </>
            )}

            {/* Stage progress */}
            {displayStages.length > 0 && (
              <>
                <Divider />
                <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Наукові етапи</p>
                <div className="space-y-4">
                  {displayStages.map((s) => (
                    <div key={s._id ?? s.stageNumber}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm font-semibold">
                        <span className="truncate text-slate-800">{s.stageNumber}. {s.title}</span>
                        <span className="shrink-0 font-mono text-slate-500">{s.progress ?? 0}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className={`h-full rounded-full ${s.status === "completed" || s.status === "reported" ? "bg-emerald-500" : s.status === "planned" ? "bg-slate-300" : "bg-blue-500"}`}
                          style={{ width: `${s.progress ?? 0}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-400">
                        {STAGE_STATUS_LABELS[s.status] ?? s.status}{s.endDate ? ` · до ${formatDate(s.endDate)}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          {/* Finance */}
          <SectionCard
            title="Фінансовий контроль"
            eyebrow="Finance"
            icon={<Wallet className="h-4 w-4" />}
            href={budgetHref}
            insight={
              budgetAhead
                ? `Бюджет випереджає прогрес: витрачено ${budgetPct}%, прогрес ${avgStageProgress}%`
                : budgetTotal > 0
                  ? `Витрачено ${formatMoney(budgetSpent)} з ${formatMoney(budgetTotal)}`
                  : "Бюджет ще не налаштовано"
            }
            insightTone={budgetAhead ? "amber" : budgetTotal > 0 ? "blue" : "slate"}
          >
            {budgetTotal > 0 ? (
              <>
                {/* Burn bar */}
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>Загальний бюджет</span>
                    <span className="font-mono text-lg font-bold text-slate-900">{formatMoney(budgetTotal)}</span>
                  </div>
                  <div className="relative h-6 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                    {committedPct > budgetPct && (
                      <div
                        className="absolute h-full rounded-full bg-amber-200"
                        style={{ width: `${committedPct}%` }}
                      />
                    )}
                    <div
                      className={`absolute h-full rounded-full shadow-sm ${budgetPct > 90 ? "bg-rose-500" : budgetPct > 70 ? "bg-amber-400" : "bg-gradient-to-r from-blue-400 to-blue-500"}`}
                      style={{ width: `${budgetPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold text-white drop-shadow-md">
                      {budgetPct}% витрачено
                    </span>
                  </div>
                  {budgetCommitted > 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      З урахуванням резервів: {committedPct}% ({formatMoney(budgetCommitted)} зарезервовано)
                    </p>
                  )}
                </div>

                {/* Quick stats */}
                <Divider />
                <div className="divide-y divide-slate-100/50">
                  <StatRow label="Витрачено" value={formatMoney(budgetSpent)} />
                  <StatRow label="Залишок" value={formatMoney(Math.max(0, budgetTotal - budgetSpent - budgetCommitted))} />
                  {budgetCommitted > 0 && <StatRow label="Зарезервовано" value={formatMoney(budgetCommitted)} />}
                </div>

                {/* Categories */}
                {topCategories.length > 0 && (
                  <>
                    <Divider />
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Топ категорії</p>
                    <div className="space-y-4">
                      {topCategories.map((c) => (
                        <MiniBar
                          key={c.category}
                          label={`${c.label} — ${formatMoney(c.spent)} / ${formatMoney(c.planned)}`}
                          value={c.spent}
                          max={c.planned}
                          color={c.spent / c.planned > 0.9 ? "bg-rose-500" : c.spent / c.planned > 0.7 ? "bg-amber-400" : "bg-blue-500"}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <EmptyState>Бюджет ще не налаштовано. Перейди в кошторис, щоб додати планові витрати.</EmptyState>
            )}
          </SectionCard>
        </div>

        {/* ── Row 2: Research Outputs + Team & Activity ──────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-2">

          {/* Research Outputs */}
          <SectionCard
            title="Дані та результати"
            eyebrow="Research Outputs"
            icon={<Database className="h-4 w-4" />}
            href={`${base}&tab=records`}
            insight={
              records.length > 0
                ? `${records.length} записів · ${totalFiles} файлів · ${openReadyRecords} open-ready`
                : "Записів даних ще немає"
            }
            insightTone={openReadyRecords > 0 ? "emerald" : "slate"}
          >
            {/* Record kind chips */}
            {records.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(kindCounts).map(([kind, count]) => (
                  <span key={kind} className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                    {KIND_LABELS[kind] ?? kind} <span className="ml-1.5 font-bold text-blue-600">{count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState>Записів даних ще немає. Перейди в Data Repository.</EmptyState>
            )}

            {/* Publications */}
            <Divider />
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Публікації</p>
              <Link href={researchHref} className="rounded-md px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-800">Усі →</Link>
            </div>
            {publications.length > 0 ? (
              <div className="mt-3 space-y-2">
                {publications.slice(0, 4).map((p) => (
                  <ActionRow
                    key={p._id ?? p.title}
                    title={p.title}
                    meta={PUB_STATUS_LABELS[p.status] ?? p.status}
                    tone={p.status === "published" ? "emerald" : p.status === "under_review" || p.status === "submitted" ? "amber" : "slate"}
                  />
                ))}
                {publications.length > 4 && (
                  <p className="mt-2 text-center text-xs font-medium text-slate-400">ще {publications.length - 4} публікацій</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-400">Публікацій ще немає.</p>
            )}

            {/* Deliverables */}
            <Divider />
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Результати (Deliverables)</p>
              <span className="font-mono text-[11px] font-semibold text-slate-500">{completedDeliverables}/{deliverables.length}</span>
            </div>
            {deliverables.length > 0 ? (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${ratio(completedDeliverables, deliverables.length)}%` }}
                  />
                </div>
                {delayedDeliverables > 0 && (
                  <p className="mt-2 text-xs font-semibold text-rose-600">{delayedDeliverables} результатів затримуються</p>
                )}
                <div className="mt-4 space-y-2">
                  {upcomingDeliverables.map((d) => (
                    <ActionRow
                      key={d._id ?? d.title}
                      title={d.title}
                      meta={d.plannedDate ? formatDate(d.plannedDate) : undefined}
                      tone={d.status === "delayed" ? "rose" : d.status === "in_progress" ? "blue" : "slate"}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-400">Deliverables ще не додані.</p>
            )}

            {/* Open science */}
            <Divider />
            <StatRow
              label="Публічних оновлень (Open Science)"
              value={openScienceCount}
              sub={openScienceCount === 0 ? "— ще немає" : undefined}
            />
          </SectionCard>

          {/* Team & Activity */}
          <SectionCard
            title="Команда та активність"
            eyebrow="Team & Activity"
            icon={<Users className="h-4 w-4" />}
            href={`${base}&tab=team`}
            insight={`${members.length} учасників · ${recentMsgCount} повідомлень за 7 днів · ${last30Hours.toFixed(0)} год за місяць`}
            insightTone="blue"
          >
            {/* Member avatars */}
            <div className="flex flex-wrap gap-2.5">
              {members.slice(0, 12).map((m) => (
                <div
                  key={m._id ?? m.email}
                  title={`${m.firstName} ${m.lastName}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50/80 text-xs font-bold text-blue-700 shadow-sm"
                >
                  {initials(m)}
                </div>
              ))}
              {members.length > 12 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 shadow-sm">
                  +{members.length - 12}
                </div>
              )}
              {members.length === 0 && <p className="text-sm font-medium text-slate-400">Учасників ще немає.</p>}
            </div>

            {/* Activity heatmap */}
            <Divider />
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Активність (6 міс.)</p>
            <ActivityHeatmap data={heatmapData} />

            {/* Hours sparkline */}
            <Divider />
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Години за 6 місяців</p>
            <HoursAreaChart data={monthlyHours} />

            {/* Recent messages */}
            <Divider />
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Останні повідомлення</p>
              <Link href={`${base}&tab=team`} className="rounded-md px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-800">Відкрити →</Link>
            </div>
            {recentMessages.length > 0 ? (
              <div className="mt-3 space-y-3">
                {recentMessages.map((msg) => (
                  <div key={msg._id ?? msg.createdAt.toString()} className="rounded-xl border border-slate-200/60 bg-white/70 p-4 shadow-sm transition hover:bg-white">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        {members.find((m) => m._id === msg.authorId)
                          ? `${members.find((m) => m._id === msg.authorId)!.firstName} ${members.find((m) => m._id === msg.authorId)!.lastName}`
                          : "Учасник"}
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        {new Date(msg.createdAt).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{msg.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-400">Повідомлень у команді ще немає.</p>
            )}

            {/* Quick stats */}
            <Divider />
            <div className="divide-y divide-slate-100/50">
              <StatRow label="Години (30 дн.)" value={`${last30Hours.toFixed(1)} год`} />
              <StatRow label="Повідомлень (7 дн.)" value={recentMsgCount} />
              <StatRow label="Учасників у команді" value={members.length} />
            </div>
          </SectionCard>
        </div>

        {/* ── Quick links ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: `${base}&tab=team`, icon: <Users className="h-5 w-5 text-blue-600" />, label: "Команда і чат" },
            { href: `${base}&tab=records`, icon: <Database className="h-5 w-5 text-emerald-600" />, label: "Репозиторій" },
            { href: `${base}&tab=openscience`, icon: <Globe className="h-5 w-5 text-cyan-600" />, label: "Відкрита наука" },
            { href: planHref, icon: <CalendarCheck className="h-5 w-5 text-amber-600" />, label: "Планування" },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="surface flex items-center gap-3 overflow-hidden rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50">
                {icon}
              </div>
              <span className="min-w-0 truncate font-semibold text-slate-800">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
