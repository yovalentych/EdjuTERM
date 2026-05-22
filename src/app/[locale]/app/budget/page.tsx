import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addBudgetPeriod } from "@/app/actions";
import { ProjectShell } from "@/components/project-shell";
import { BudgetItemRegistry } from "@/components/budget/budget-item-registry";
import { FinanceDonut, FinanceStackedBars } from "@/components/budget/budget-fintech-charts";
import { BudgetReportView } from "@/components/budget/budget-report-view";
import { ExpenseLedger } from "@/components/budget/expense-ledger";
import { PurchaseRequestForm } from "@/components/budget/purchase-request-form";
import { PurchaseRequestList } from "@/components/budget/purchase-request-list";
import {
  Card,
  DataTable,
  DataTableBody,
  DataTableHead,
  EmptyState,
  Tabs,
  type TabItem,
} from "@/components/ui";
import {
  getBudgetSummary,
  listBudgetLineItems,
  listBudgetPeriods,
  listPurchaseRequests,
} from "@/lib/budget";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { canManageProject, getProjectForUser } from "@/lib/projects";
import { budgetCategories } from "@/lib/schemas";

function fmt(amount: number, currency = "UAH") {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

type Tab = "items" | "requests" | "expenses" | "reports" | "analytics";
const validTabs: Tab[] = ["items", "requests", "expenses", "reports", "analytics"];

export default async function BudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    projectId?: string;
    tab?: string;
    saved?: string;
    error?: string;
    reportCategory?: string;
    reportIssue?: string;
    reportPeriod?: string;
    reportStatus?: string;
  }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const { projectId, tab, saved, error, reportCategory, reportIssue, reportPeriod, reportStatus } = await searchParams;
  if (!projectId) redirect(`/${localeParam}/app`);

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) notFound();

  const dictionary = getDictionary(localeParam);
  const d = dictionary.budget;
  const isManager = canManageProject(project, user);

  const activeTab: Tab = validTabs.includes(tab as Tab) ? (tab as Tab) : "items";
  const baseUrl = `/${localeParam}/app/budget?projectId=${project._id}`;

  const [periods, lineItems, requests, summary] = await Promise.all([
    listBudgetPeriods(project._id),
    listBudgetLineItems(project._id),
    listPurchaseRequests(project._id),
    getBudgetSummary(project._id),
  ]);

  const utilizationPct =
    summary.totalPlanned > 0
      ? Math.min(100, Math.round(((summary.totalSpent + summary.totalCommitted) / summary.totalPlanned) * 100))
      : 0;

  const pendingRequests = requests.filter((r) => r.status === "submitted").length;
  const actualExpenses = requests.filter((r) => r.status === "purchased" || r.status === "delivered").length;
  const firstPaidRequest = requests
    .filter((r) => r.status === "purchased" || r.status === "delivered")
    .sort((a, b) => new Date(a.purchasedAt ?? a.updatedAt).getTime() - new Date(b.purchasedAt ?? b.updatedAt).getTime())[0];
  const burnRate = firstPaidRequest
    ? Math.round(summary.totalSpent / Math.max(1, monthsBetween(new Date(firstPaidRequest.purchasedAt ?? firstPaidRequest.updatedAt), new Date())))
    : 0;

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="budget"
    >
      {/* Status messages */}
      {saved && (
        <p className="status-note border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {saved === "period" && d.periodSaved}
          {saved === "lineitem" && d.itemSaved}
          {saved === "submitted" && d.requestSubmitted}
          {saved === "draft" && d.requestSaved}
          {saved === "approved" && d.requestApproved}
          {saved === "rejected" && d.requestRejected}
          {saved === "purchased" && d.requestPurchased}
          {saved === "documents" && d.documentsUploaded}
        </p>
      )}
      {error && (
        <p className="status-note border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error === "forbidden" ? d.forbiddenError : d.invalidError}
        </p>
      )}

      <div className="grant-finance-workspace space-y-5">
        <section className="grant-finance-masthead">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-50/80">
              <Link href={`/${localeParam}/app/project?projectId=${project._id}`} className="transition hover:text-white">
                {project.acronym}
              </Link>
              <span>/</span>
              <span className="text-white">Кошторис</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">Grant finance console</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Кошторис наукового гранту
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-teal-50/85">
              Планування, закупівлі, фактичні витрати і звітність в одному фінансовому контурі проєкту.
            </p>
          </div>

          <div className="grant-finance-ledger-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-50/70">Доступний залишок</p>
            <p className="mt-2 font-mono text-3xl font-bold text-white">{fmt(summary.totalRemaining)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-teal-50/65">Використано</p>
                <p className="mt-1 font-mono text-lg font-bold text-white">{utilizationPct}%</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-teal-50/65">Заявки</p>
                <p className="mt-1 font-mono text-lg font-bold text-white">{requests.length}</p>
              </div>
            </div>
          </div>
        </section>

        <FinanceCommandCenter
          baseUrl={baseUrl}
          burnRate={burnRate}
          dictionary={dictionary}
          requests={requests}
          summary={summary}
          utilizationPct={utilizationPct}
        />

        <Tabs
          activeId={activeTab}
          className="grant-finance-tabs"
          items={
            [
              {
                id: "items",
                label: d.tabItems,
                href: `${baseUrl}&tab=items`,
                icon: <Wallet className="h-4 w-4" />,
              },
              {
                id: "requests",
                label: d.tabRequests,
                href: `${baseUrl}&tab=requests`,
                icon: <CircleDollarSign className="h-4 w-4" />,
                badge: pendingRequests || undefined,
              },
              {
                id: "expenses",
                label: d.tabExpenses,
                href: `${baseUrl}&tab=expenses`,
                icon: <FileText className="h-4 w-4" />,
                badge: actualExpenses || undefined,
              },
              {
                id: "reports",
                label: d.tabReports,
                href: `${baseUrl}&tab=reports`,
                icon: <ClipboardList className="h-4 w-4" />,
              },
              {
                id: "analytics",
                label: d.tabAnalytics,
                href: `${baseUrl}&tab=analytics`,
                icon: <BarChart3 className="h-4 w-4" />,
              },
            ] satisfies TabItem<Tab>[]
          }
        />
      </div>

      {/* ── Tab: Items ───────────────────────────────────────────────────── */}
      {activeTab === "items" && (
        <>
          <BudgetItemRegistry
            lineItems={lineItems}
            periods={periods}
            requests={requests}
            dictionary={dictionary}
            locale={localeParam}
            projectId={project._id}
            canManage={isManager}
          />

          {/* Period management */}
          {isManager && (
            <div className="surface overflow-hidden">
              <details>
                <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  {d.periodsTitle}
                  {periods.length > 0 && (
                    <span className="ml-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-500">
                      {periods.length}
                    </span>
                  )}
                </summary>
                <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                  {periods.length > 0 && (
                    <div className="mb-4 divide-y divide-slate-50 overflow-hidden rounded-lg border border-slate-200">
                      {periods.map((p) => (
                        <div
                          key={p._id}
                          className="flex items-center justify-between bg-white px-4 py-3 text-sm transition hover:bg-slate-50"
                        >
                          <span className="font-medium text-slate-800">{p.title}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                              {p.startDate} — {p.endDate}
                            </span>
                            <span
                              className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                                p.status === "active"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-500"
                              }`}
                            >
                              {d.periodStatuses[p.status]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {periods.length === 0 && (
                    <p className="mb-4 text-sm text-slate-400">{d.noPeriods}</p>
                  )}
                  <form action={addBudgetPeriod} className="space-y-3">
                    <p className="text-xs font-semibold text-slate-600">+ {d.addPeriod}</p>
                    <input type="hidden" name="locale" value={localeParam} />
                    <input type="hidden" name="projectId" value={project._id} />
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {d.periodLabel} *
                        </label>
                        <input
                          name="label"
                          required
                          minLength={2}
                          maxLength={100}
                          placeholder={d.periodLabelPlaceholder}
                          className="input-control px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {d.periodStart}
                        </label>
                        <input
                          name="startDate"
                          type="date"
                          className="input-control px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          {d.periodEnd}
                        </label>
                        <input
                          name="endDate"
                          type="date"
                          className="input-control px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="control-primary px-4 py-2 text-sm font-semibold"
                    >
                      {d.savePeriod}
                    </button>
                  </form>
                </div>
              </details>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Requests ───────────────────────────────────────────────── */}
      {activeTab === "requests" && (
        <>
          <Card title={d.addRequest} className="finance-tab-card" bodyClassName="finance-tab-body">
            <PurchaseRequestForm
              dictionary={dictionary}
              locale={localeParam}
              projectId={project._id}
              periods={periods}
              lineItems={lineItems}
            />
          </Card>

          <Card
            className="finance-tab-card"
            bodyClassName="finance-tab-body"
            title={
              <>
                {d.requestsTitle}
              {pendingRequests > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded bg-amber-500 px-1 text-xs font-bold text-white">
                  {pendingRequests}
                </span>
              )}
              </>
            }
          >
            <PurchaseRequestList
              requests={requests}
              periods={periods}
              lineItems={lineItems}
              dictionary={dictionary}
              locale={localeParam}
              projectId={project._id}
              currentUser={user}
              canManage={isManager}
            />
          </Card>
        </>
      )}

      {/* ── Tab: Expenses ───────────────────────────────────────────────── */}
      {activeTab === "expenses" && (
        <Card title={d.expensesTitle} className="finance-tab-card" bodyClassName="finance-tab-body">
          <ExpenseLedger
            dictionary={dictionary}
            locale={localeParam}
            periods={periods}
            lineItems={lineItems}
            projectId={project._id}
            requests={requests}
          />
        </Card>
      )}

      {/* ── Tab: Reports ────────────────────────────────────────────────── */}
      {activeTab === "reports" && (
        <Card title={d.reportsTitle} className="finance-tab-card" bodyClassName="finance-tab-body">
          <BudgetReportView
            dictionary={dictionary}
            filters={{
              category: reportCategory ?? "",
              issue: reportIssue ?? "",
              period: reportPeriod ?? "",
              status: reportStatus ?? "",
            }}
            periods={periods}
            lineItems={lineItems}
            projectId={project._id}
            requests={requests}
          />
        </Card>
      )}

      {/* ── Tab: Analytics ──────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <Card className="finance-tab-card" bodyClassName="finance-tab-body">
          <div className="finance-soft-panel mb-5 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Analytics</p>
                <h2 className="text-base font-semibold text-slate-950">{d.utilization}</h2>
              </div>
            </div>
            <span className="w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm font-bold text-slate-700">
              {utilizationPct}%
            </span>
          </div>

          {summary.totalPlanned > 0 ? (
            <>
              {/* Utilization bar */}
              <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-3 rounded-full transition-all ${
                    utilizationPct > 90
                      ? "bg-rose-500"
                      : utilizationPct > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>

              {/* Category breakdown */}
              <div className="finance-table-shell">
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">{d.category}</th>
                      <th className="px-3 py-2.5 text-right font-medium">{d.totalPlanned}</th>
                      <th className="px-3 py-2.5 text-right font-medium">{d.totalSpent}</th>
                      <th className="px-3 py-2.5 text-right font-medium">%</th>
                      <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">
                        {d.utilization}
                      </th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {budgetCategories.map((cat) => {
                      const catSummary = summary.byCategory.find((c) => c.category === cat);
                      if (!catSummary || catSummary.planned === 0) return null;
                      const pct =
                        catSummary.planned > 0
                          ? Math.min(100, Math.round((catSummary.spent / catSummary.planned) * 100))
                          : 0;
                      return (
                        <tr key={cat} className="bg-white transition hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {d.categories[cat]}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-600">
                            {fmt(catSummary.planned)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-900">
                            {fmt(catSummary.spent)}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-xs">
                            <span
                              className={
                                pct > 90
                                  ? "font-semibold text-rose-700"
                                  : pct > 70
                                    ? "font-semibold text-amber-700"
                                    : "text-emerald-700"
                              }
                            >
                              {pct}%
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-2 rounded-full ${
                                  pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-400" : "bg-emerald-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </DataTableBody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Разом
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold text-slate-950">
                        {fmt(summary.totalPlanned)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold text-slate-950">
                        {fmt(summary.totalSpent)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold">
                        {utilizationPct}%
                      </td>
                      <td className="hidden md:table-cell" />
                    </tr>
                  </tfoot>
                </DataTable>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title="Немає даних для аналітики"
              description="Додайте позиції до кошторису, щоб побачити використання бюджету."
            />
          )}
        </Card>
      )}
    </ProjectShell>
  );
}

function monthsBetween(start: Date, end: Date) {
  const years = end.getFullYear() - start.getFullYear();
  const months = years * 12 + end.getMonth() - start.getMonth() + 1;
  return Math.max(1, months);
}

function FinanceCommandCenter({
  baseUrl,
  burnRate,
  dictionary,
  requests,
  summary,
  utilizationPct,
}: {
  baseUrl: string;
  burnRate: number;
  dictionary: ReturnType<typeof getDictionary>;
  requests: Awaited<ReturnType<typeof listPurchaseRequests>>;
  summary: Awaited<ReturnType<typeof getBudgetSummary>>;
  utilizationPct: number;
}) {
  const d = dictionary.budget;
  const hasBudget = summary.totalPlanned > 0;
  const isOverBudget = summary.totalRemaining < 0 || summary.overBudgetCategories.length > 0;
  const hasWarnings = !hasBudget || isOverBudget || summary.pendingRequests > 0 || summary.unlinkedRequests > 0;
  const topCategories = [...summary.byCategory]
    .filter((c) => c.planned > 0 || c.committed > 0 || c.spent > 0)
    .sort((a, b) => (b.spent + b.committed) - (a.spent + a.committed))
    .slice(0, 4);
  const timeline = buildFinanceTimeline(requests);
  const donutData = topCategories.map((category) => ({
    label: d.categories[category.category as keyof typeof d.categories] ?? category.category,
    value: category.spent + category.committed,
  }));

  return (
    <section className="grant-finance-overview">
      <div className="grant-finance-header">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Finance</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Кошторис наукового гранту</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Операційний контроль бюджету: план, погоджені зобов&apos;язання, фактичні витрати, документи та готовність до звіту.
          </p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold ${
          isOverBudget
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : hasWarnings
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {isOverBudget || hasWarnings ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {isOverBudget ? "Потрібна перевірка" : hasWarnings ? "Є відкриті дії" : "Готово до звітності"}
        </span>
      </div>

      <div className="grant-finance-overview-grid">
        <div className="space-y-4">
          <div className="grant-finance-metrics">
            <GrantFinanceMetric label={d.totalPlanned} value={fmt(summary.totalPlanned)} detail="Затверджений план" />
            <GrantFinanceMetric label={d.totalCommitted} value={fmt(summary.totalCommitted)} detail={`${summary.approvedRequests} погоджено`} />
            <GrantFinanceMetric label={d.totalSpent} value={fmt(summary.totalSpent)} detail={burnRate > 0 ? `${fmt(burnRate)}/міс` : "Без витрат"} />
            <GrantFinanceMetric label={d.totalAvailable} value={fmt(summary.totalRemaining)} detail="Доступний залишок" danger={summary.totalRemaining < 0} />
          </div>

          <div className="grant-finance-panel grant-finance-chart-panel">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">План проти факту</h3>
                <p className="text-xs text-slate-500">Зобов&apos;язання та фактичні витрати за останні 6 місяців.</p>
              </div>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Операційний зріз
              </span>
            </div>
            <FinanceStackedBars data={timeline} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="grant-finance-panel grant-finance-utilization-panel">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Використання бюджету</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <h3 className="text-2xl font-bold text-slate-950">{utilizationPct}%</h3>
                <span className="text-xs font-semibold text-slate-500">витрачено + зарезервовано</span>
              </div>
            </div>
            <FinanceDonut data={donutData} total={summary.totalPlanned} />
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${isOverBudget ? "bg-rose-500" : utilizationPct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, utilizationPct)}%` }}
              />
            </div>
          </div>

          <div className="grant-finance-panel">
            <h3 className="text-sm font-bold text-slate-950">Контрольні дії</h3>
            <div className="mt-3 space-y-2">
              {!hasBudget && (
                <FinanceAction href={`${baseUrl}&tab=items`} tone="amber" text="Додати перші позиції кошторису" value="Plan" />
              )}
              {summary.pendingRequests > 0 && (
                <FinanceAction href={`${baseUrl}&tab=requests`} tone="amber" text="Розглянути заявки на закупівлю" value={String(summary.pendingRequests)} />
              )}
              {summary.unlinkedRequests > 0 && (
                <FinanceAction href={`${baseUrl}&tab=requests`} tone="slate" text="Прив'язати заявки до рядків кошторису" value={String(summary.unlinkedRequests)} />
              )}
              {summary.overBudgetCategories.length > 0 && (
                <FinanceAction href={`${baseUrl}&tab=analytics`} tone="rose" text="Перевірити категорії з перевищенням" value={String(summary.overBudgetCategories.length)} />
              )}
              {!hasWarnings && (
                <FinanceAction href={`${baseUrl}&tab=reports`} tone="emerald" text="Переглянути фінансовий звіт" value="OK" />
              )}
            </div>
          </div>
        </aside>
      </div>

      {topCategories.length > 0 && (
        <div className="grid gap-3 border-t border-slate-200 bg-slate-50/60 p-4 md:grid-cols-2 xl:grid-cols-4">
          {topCategories.map((category) => (
            <CategoryUsageRow
              key={category.category}
              category={d.categories[category.category as keyof typeof d.categories] ?? category.category}
              committed={category.committed}
              planned={category.planned}
              remaining={category.remaining}
              spent={category.spent}
              utilizationPct={category.utilizationPct}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function buildFinanceTimeline(requests: Awaited<ReturnType<typeof listPurchaseRequests>>) {
  const monthFormatter = new Intl.DateTimeFormat("uk-UA", { month: "short" });
  const map = new Map<string, { label: string; actual: number; committed: number; sort: string }>();

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, {
      label: monthFormatter.format(date),
      actual: 0,
      committed: 0,
      sort: key,
    });
  }

  for (const request of requests) {
    const date = new Date(request.purchasedAt ?? request.updatedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key);
    if (!entry) continue;

    if (request.status === "purchased" || request.status === "delivered") {
      entry.actual += request.amount;
    } else if (request.status === "submitted" || request.status === "approved") {
      entry.committed += request.amount;
    }
  }

  return [...map.values()].sort((a, b) => a.sort.localeCompare(b.sort));
}

function GrantFinanceMetric({
  danger = false,
  detail,
  label,
  value,
}: {
  danger?: boolean;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="grant-finance-metric">
      <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 truncate font-mono text-xl font-bold ${danger ? "text-rose-700" : "text-slate-950"}`}>{value}</p>
      <p className="mt-1 truncate text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function FinanceAction({
  href,
  text,
  tone,
  value,
}: {
  href: string;
  text: string;
  tone: "amber" | "emerald" | "rose" | "slate";
  value: string;
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
    emerald: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
    rose: "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
    slate: "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
  };

  return (
    <Link href={href} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition ${toneClasses[tone]}`}>
      <span className="min-w-0 truncate font-semibold">{text}</span>
      <span className="shrink-0 font-mono text-xs font-bold">{value}</span>
    </Link>
  );
}

function CategoryUsageRow({
  category,
  committed,
  planned,
  remaining,
  spent,
  utilizationPct,
}: {
  category: string;
  committed: number;
  planned: number;
  remaining: number;
  spent: number;
  utilizationPct: number;
}) {
  const isOver = remaining < 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-bold text-slate-800">{category}</p>
        <span className={`font-mono text-xs font-bold ${isOver ? "text-rose-700" : utilizationPct > 80 ? "text-amber-700" : "text-emerald-700"}`}>
          {utilizationPct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${isOver ? "bg-rose-500" : utilizationPct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${Math.min(100, utilizationPct)}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
        <AmountLabel label="Plan" value={fmt(planned)} />
        <AmountLabel label="Commit" value={fmt(committed)} />
        <AmountLabel label="Actual" value={fmt(spent)} />
        <AmountLabel label="Left" value={fmt(remaining)} danger={isOver} />
      </div>
    </div>
  );
}

function AmountLabel({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-slate-400">{label}</p>
      <p className={`truncate font-mono font-bold ${danger ? "text-rose-700" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}
