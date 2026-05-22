import { AlertTriangle, CheckCircle2, Download, FileWarning, ReceiptText, Table2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import { budgetCategories, purchaseRequestStatuses } from "@/lib/schemas";
import type { BudgetCategory, BudgetLineItem, BudgetPeriod, PurchaseRequest } from "@/lib/schemas";
import { DataTable, DataTableBody, DataTableHead, EmptyState } from "@/components/ui";

function formatAmount(amount: number, currency = "UAH") {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function filterLineItems(
  lineItems: BudgetLineItem[],
  filters: { category: string; period: string },
) {
  return lineItems.filter((item) =>
    (!filters.category || item.category === filters.category) &&
    (!filters.period || item.periodId === filters.period)
  );
}

function filterRequests(
  requests: PurchaseRequest[],
  filters: {
    category: string;
    issue: string;
    period: string;
    status: string;
  },
) {
  return requests.filter((request) => {
    if (filters.category && request.category !== filters.category) return false;
    if (filters.period && request.linkedPeriodId !== filters.period) return false;
    if (filters.status && request.status !== filters.status) return false;
    if (filters.issue === "missingDocuments" && request.documents.length > 0) return false;
    if (filters.issue === "missingActual" && request.actualAmount !== undefined) return false;
    if (filters.issue === "unlinked" && request.linkedLineItemId) return false;
    return true;
  });
}

function buildReportSummary(lineItems: BudgetLineItem[], requests: PurchaseRequest[]) {
  const totalPlanned = lineItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const totalCommitted = requests
    .filter((request) => request.status === "submitted" || request.status === "approved")
    .reduce((sum, request) => sum + (request.estimatedAmount ?? 0), 0);
  const totalSpent = requests
    .filter((request) => request.status === "purchased" || request.status === "delivered")
    .reduce((sum, request) => sum + (request.actualAmount ?? request.estimatedAmount ?? 0), 0);
  const categoryMap = new Map<BudgetCategory, { committed: number; planned: number; remaining: number; spent: number; utilizationPct: number }>();

  for (const category of budgetCategories) {
    categoryMap.set(category, { committed: 0, planned: 0, remaining: 0, spent: 0, utilizationPct: 0 });
  }

  for (const item of lineItems) {
    const entry = categoryMap.get(item.category);
    if (!entry) continue;
    entry.planned += item.plannedAmount;
  }

  for (const request of requests) {
    const entry = request.category ? categoryMap.get(request.category) : undefined;
    if (!entry) continue;
    if (request.status === "purchased" || request.status === "delivered") {
      entry.spent += request.actualAmount ?? request.estimatedAmount ?? 0;
    } else if (request.status === "submitted" || request.status === "approved") {
      entry.committed += request.estimatedAmount ?? 0;
    }
  }

  const byCategory = [...categoryMap.entries()].map(([category, value]) => {
    const used = value.committed + value.spent;
    const remaining = value.planned - used;
    return {
      category,
      ...value,
      remaining,
      utilizationPct: value.planned > 0 ? Math.round((used / value.planned) * 100) : used > 0 ? 100 : 0,
    };
  });

  return {
    byCategory,
    overBudgetCategories: byCategory.filter((category) => category.planned > 0 && category.remaining < 0).length,
    totalCommitted,
    totalPlanned,
    totalRemaining: totalPlanned - totalCommitted - totalSpent,
    totalSpent,
  };
}

export function BudgetReportView({
  dictionary,
  filters,
  lineItems,
  periods,
  projectId,
  requests,
}: {
  dictionary: Dictionary;
  filters: {
    category: string;
    issue: string;
    period: string;
    status: string;
  };
  lineItems: BudgetLineItem[];
  periods: BudgetPeriod[];
  projectId: string;
  requests: PurchaseRequest[];
}) {
  const d = dictionary.budget;
  const filteredLineItems = filterLineItems(lineItems, filters);
  const filteredRequests = filterRequests(requests, filters);
  const reportSummary = buildReportSummary(filteredLineItems, filteredRequests);
  const actualRequests = filteredRequests.filter((request) => request.status === "purchased" || request.status === "delivered");
  const unlinkedRequests = filteredRequests.filter((request) => !request.linkedLineItemId);
  const missingActualAmount = actualRequests.filter((request) => request.actualAmount === undefined);
  const missingDocuments = actualRequests.filter((request) => request.documents.length === 0);
  const hasWarnings =
    reportSummary.overBudgetCategories > 0 ||
    unlinkedRequests.length > 0 ||
    missingActualAmount.length > 0 ||
    missingDocuments.length > 0;
  const exportQuery = new URLSearchParams({
    projectId,
    reportCategory: filters.category,
    reportIssue: filters.issue,
    reportPeriod: filters.period,
    reportStatus: filters.status,
  });

  return (
    <div className="space-y-5">
      <section className="finance-soft-panel p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{d.reportGenerated}</p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">{d.reportsTitle}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{d.reportsSummary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/budget/export?${exportQuery.toString()}&format=xlsx`}
              className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700 transition hover:bg-teal-100"
            >
              <Table2 className="h-4 w-4" />
              {d.exportXlsx}
            </a>
            <a
              href={`/api/budget/export?${exportQuery.toString()}&format=csv`}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              {d.exportCsv}
            </a>
            <span className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold ${
              hasWarnings
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}>
              {hasWarnings ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {hasWarnings ? d.reportNeedsReview : d.reportReady}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ReportMetric label={d.totalPlanned} value={formatAmount(reportSummary.totalPlanned)} />
          <ReportMetric label={d.totalCommitted} value={formatAmount(reportSummary.totalCommitted)} />
          <ReportMetric label={d.totalSpent} value={formatAmount(reportSummary.totalSpent)} />
          <ReportMetric
            danger={reportSummary.totalRemaining < 0}
            label={d.totalAvailable}
            value={formatAmount(reportSummary.totalRemaining)}
          />
        </div>
      </section>

      <form method="get" className="finance-soft-panel grid gap-3 p-4 md:grid-cols-5">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="tab" value="reports" />
        <ReportSelect label={d.reportFilterPeriod} name="reportPeriod" value={filters.period}>
          <option value="">{d.reportFilterAll}</option>
          {periods.map((period) => (
            <option key={period._id} value={period._id}>{period.label}</option>
          ))}
        </ReportSelect>
        <ReportSelect label={d.reportFilterCategory} name="reportCategory" value={filters.category}>
          <option value="">{d.reportFilterAll}</option>
          {budgetCategories.map((category) => (
            <option key={category} value={category}>{d.categories[category]}</option>
          ))}
        </ReportSelect>
        <ReportSelect label={d.reportFilterStatus} name="reportStatus" value={filters.status}>
          <option value="">{d.reportFilterAll}</option>
          {purchaseRequestStatuses.map((status) => (
            <option key={status} value={status}>{d.requestStatuses[status]}</option>
          ))}
        </ReportSelect>
        <ReportSelect label={d.reportFilterIssue} name="reportIssue" value={filters.issue}>
          <option value="">{d.reportFilterAll}</option>
          <option value="missingDocuments">{d.documentMissing}</option>
          <option value="missingActual">{d.missingActual}</option>
          <option value="unlinked">{d.unlinkedExpenses}</option>
        </ReportSelect>
        <div className="flex items-end">
          <button type="submit" className="control-primary w-full px-4 py-2 text-sm font-semibold">
            {d.applyFilters}
          </button>
        </div>
      </form>

      <section className="app-grid-main-aside">
        <div className="finance-soft-panel overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-950">{d.reportCategoryUsage}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {filteredLineItems.length} {d.itemsCount} · {periods.length} {d.reportPeriods}
            </p>
          </div>
          {reportSummary.byCategory.length > 0 ? (
            <div className="finance-table-shell rounded-none border-0">
            <DataTable minWidth="720px">
              <DataTableHead>
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">{d.category}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{d.totalPlanned}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{d.totalCommitted}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{d.totalSpent}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{d.totalAvailable}</th>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {reportSummary.byCategory
                  .filter((category) => category.planned > 0 || category.committed > 0 || category.spent > 0)
                  .map((category) => (
                    <tr key={category.category} className="bg-white transition hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {d.categories[category.category as keyof typeof d.categories] ?? category.category}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-slate-600">
                        {formatAmount(category.planned)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-amber-700">
                        {formatAmount(category.committed)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm text-emerald-700">
                        {formatAmount(category.spent)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-sm font-bold ${
                        category.remaining < 0 ? "text-rose-700" : "text-slate-900"
                      }`}>
                        {formatAmount(category.remaining)}
                      </td>
                    </tr>
                  ))}
              </DataTableBody>
            </DataTable>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<ReceiptText className="h-5 w-5" />}
                title={d.noItems}
                description={d.noExpensesDescription}
              />
            </div>
          )}
        </div>

        <div className="finance-soft-panel p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-slate-950">{d.reportWarnings}</h3>
          </div>
          <div className="space-y-2">
            <WarningRow label={d.reportOverBudget} value={reportSummary.overBudgetCategories} danger={reportSummary.overBudgetCategories > 0} />
            <WarningRow label={d.unlinkedExpenses} value={unlinkedRequests.length} danger={unlinkedRequests.length > 0} />
            <WarningRow label={d.missingActual} value={missingActualAmount.length} danger={missingActualAmount.length > 0} />
            <WarningRow label={d.documentMissing} value={missingDocuments.length} danger={missingDocuments.length > 0} />
          </div>
        </div>
      </section>

      <section className="finance-soft-panel overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold text-slate-950">{d.reportActualExpenses}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {actualRequests.length} {d.actualRecords}
          </p>
        </div>
        {actualRequests.length > 0 ? (
          <div className="finance-table-shell rounded-none border-0">
          <DataTable minWidth="840px">
            <DataTableHead>
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">{d.expenseDate}</th>
                <th className="px-4 py-2.5 text-left font-medium">{d.expense}</th>
                <th className="px-3 py-2.5 text-left font-medium">{d.category}</th>
                <th className="px-3 py-2.5 text-right font-medium">{d.expensePlan}</th>
                <th className="px-3 py-2.5 text-right font-medium">{d.expenseActual}</th>
                <th className="px-4 py-2.5 text-left font-medium">{d.documents}</th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {actualRequests.map((request) => {
                const actualAmount = request.actualAmount ?? request.estimatedAmount ?? 0;
                const date = new Date(request.purchasedAt ?? request.updatedAt);
                return (
                  <tr key={request._id} className="bg-white transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{date.toLocaleDateString("uk-UA")}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{request.title}</p>
                      {request.vendor && <p className="mt-1 text-xs text-slate-500">{d.vendor}: {request.vendor}</p>}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">
                      {d.categories[request.category as keyof typeof d.categories]}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm text-slate-500">
                      {formatAmount(request.estimatedAmount ?? 0, request.currency)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-sm font-bold text-slate-950">
                      {formatAmount(actualAmount, request.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`finance-chip ${
                        request.documents.length > 0
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}>
                        {request.documents.length > 0
                          ? `${d.documentReady} · ${request.documents.length} ${d.documentCount}`
                          : d.documentMissing}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </DataTableBody>
          </DataTable>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<ReceiptText className="h-5 w-5" />}
              title={d.noExpenses}
              description={d.noExpensesDescription}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function ReportMetric({
  danger = false,
  label,
  value,
}: {
  danger?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="finance-stat-tile px-4 py-3">
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 truncate font-mono text-xl font-bold ${danger ? "text-rose-700" : "text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}

function ReportSelect({
  children,
  label,
  name,
  value,
}: {
  children: ReactNode;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <select name={name} defaultValue={value} className="input-control px-3 py-2 text-sm outline-none">
        {children}
      </select>
    </label>
  );
}

function WarningRow({
  danger,
  label,
  value,
}: {
  danger: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
      danger ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"
    }`}>
      <span className="min-w-0 truncate font-medium">{label}</span>
      <span className="shrink-0 font-mono text-xs font-bold">{value}</span>
    </div>
  );
}
