import {
  BarChart3,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { addBudgetPeriod } from "@/app/actions";
import { ProjectShell } from "@/components/project-shell";
import { BudgetItemRegistry } from "@/components/budget/budget-item-registry";
import { PurchaseRequestForm } from "@/components/budget/purchase-request-form";
import { PurchaseRequestList } from "@/components/budget/purchase-request-list";
import {
  Breadcrumb,
  Card,
  DataTable,
  DataTableBody,
  DataTableHead,
  EmptyState,
  PageHeader,
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

type Tab = "items" | "requests" | "analytics";
const validTabs: Tab[] = ["items", "requests", "analytics"];

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

  const available = summary.totalPlanned - summary.totalSpent;
  const utilizationPct =
    summary.totalPlanned > 0
      ? Math.min(100, Math.round((summary.totalSpent / summary.totalPlanned) * 100))
      : 0;

  const pendingRequests = requests.filter((r) => r.status === "submitted").length;

  return (
    <ProjectShell
      dictionary={dictionary}
      locale={localeParam}
      user={user}
      project={project}
      activeTab="budget"
    >
      <PageHeader
        eyebrow={project.acronym}
        title={d.title}
        description={d.summary}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: project.acronym, href: `/${localeParam}/app/project?projectId=${project._id}` },
              { label: d.title },
            ]}
            homeHref={`/${localeParam}/app`}
          />
        }
      />

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
        </p>
      )}
      {error && (
        <p className="status-note border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error === "forbidden" ? d.forbiddenError : d.invalidError}
        </p>
      )}

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={d.totalPlanned}
          value={fmt(summary.totalPlanned)}
          icon={<Wallet className="h-5 w-5" />}
          color="stone"
        />
        <KpiCard
          label={d.totalCommitted}
          value={fmt(summary.totalCommitted)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="amber"
        />
        <KpiCard
          label={d.totalSpent}
          value={fmt(summary.totalSpent)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="emerald"
        />
        <KpiCard
          label={d.totalAvailable}
          value={fmt(available)}
          icon={<CircleDollarSign className="h-5 w-5" />}
          color={available < 0 ? "rose" : "cyan"}
        />
      </section>

      <Tabs
        activeId={activeTab}
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
              id: "analytics",
              label: d.tabAnalytics,
              href: `${baseUrl}&tab=analytics`,
              icon: <BarChart3 className="h-4 w-4" />,
            },
          ] satisfies TabItem<Tab>[]
        }
      />

      {/* ── Tab: Items ───────────────────────────────────────────────────── */}
      {activeTab === "items" && (
        <>
          <BudgetItemRegistry
            lineItems={lineItems}
            periods={periods}
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
                          <span className="font-medium text-slate-800">{p.label}</span>
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
          <Card title={d.addRequest}>
            <PurchaseRequestForm
              dictionary={dictionary}
              locale={localeParam}
              projectId={project._id}
              periods={periods}
              lineItems={lineItems}
            />
          </Card>

          <Card
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
              dictionary={dictionary}
              locale={localeParam}
              projectId={project._id}
              currentUser={user}
              canManage={isManager}
            />
          </Card>
        </>
      )}

      {/* ── Tab: Analytics ──────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-stone-950">{d.utilization}</h2>
            <span className="ml-auto font-mono text-sm font-semibold text-stone-700">
              {utilizationPct}%
            </span>
          </div>

          {summary.totalPlanned > 0 ? (
            <>
              {/* Utilization bar */}
              <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-stone-200">
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
              <div className="overflow-hidden rounded border border-slate-200">
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
                            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
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
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold text-stone-950">
                        {fmt(summary.totalPlanned)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-bold text-stone-950">
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

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  color: "stone" | "amber" | "emerald" | "cyan" | "rose";
}) {
  const iconColors = {
    stone:   "bg-label-muted",
    amber:   "bg-label-warning",
    emerald: "bg-label-success",
    cyan:    "bg-label-info",
    rose:    "bg-label-danger",
  };

  return (
    <div className="metric-card flex items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1.5 font-mono text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconColors[color]}`}>
        {icon}
      </div>
    </div>
  );
}
