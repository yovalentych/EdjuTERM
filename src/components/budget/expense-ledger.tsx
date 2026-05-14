import { AlertTriangle, CheckCircle2, FileText, ReceiptText } from "lucide-react";
import type { ReactNode } from "react";
import { uploadPurchaseRequestDocuments } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import type { BudgetLineItem, BudgetPeriod, PurchaseRequest } from "@/lib/schemas";
import { DataTable, DataTableBody, DataTableHead, EmptyState } from "@/components/ui";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ExpenseLedger({
  dictionary,
  lineItems,
  locale,
  periods,
  projectId,
  requests,
}: {
  dictionary: Dictionary;
  lineItems: BudgetLineItem[];
  locale: string;
  periods: BudgetPeriod[];
  projectId: string;
  requests: PurchaseRequest[];
}) {
  const d = dictionary.budget;
  const actualRequests = requests
    .filter((request) => request.status === "purchased" || request.status === "delivered")
    .sort(
      (a, b) =>
        new Date(b.purchasedAt ?? b.updatedAt).getTime() -
        new Date(a.purchasedAt ?? a.updatedAt).getTime(),
    );

  const periodsById = new Map(periods.map((period) => [period._id ?? "", period]));
  const lineItemsById = new Map(lineItems.map((item) => [item._id ?? "", item]));
  const actualTotal = actualRequests.reduce(
    (sum, request) => sum + (request.actualAmount ?? request.estimatedAmount),
    0,
  );
  const missingActualAmount = actualRequests.filter((request) => request.actualAmount === undefined).length;
  const unlinkedExpenses = actualRequests.filter((request) => !request.linkedLineItemId).length;
  const missingDocuments = actualRequests.filter((request) => request.documents.length === 0).length;

  if (actualRequests.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText className="h-5 w-5" />}
        title={d.noExpenses}
        description={d.noExpensesDescription}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <LedgerStat
          icon={<ReceiptText className="h-4 w-4" />}
          label={d.actualRecords}
          tone="cyan"
          value={String(actualRequests.length)}
        />
        <LedgerStat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label={d.actualTotal}
          tone="emerald"
          value={formatAmount(actualTotal, "UAH")}
        />
        <LedgerStat
          icon={<AlertTriangle className="h-4 w-4" />}
          label={d.missingActual}
          tone={missingActualAmount > 0 ? "amber" : "slate"}
          value={String(missingActualAmount)}
        />
        <LedgerStat
          icon={<FileText className="h-4 w-4" />}
          label={d.documentMissing}
          tone={missingDocuments > 0 ? "rose" : "slate"}
          value={String(missingDocuments)}
        />
      </div>

      {(missingActualAmount > 0 || unlinkedExpenses > 0 || missingDocuments > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>{d.expenseWarning}</p>
          </div>
        </div>
      )}

      <div className="finance-table-shell">
        <DataTable>
          <DataTableHead>
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">{d.expenseDate}</th>
              <th className="px-4 py-2.5 text-left font-medium">{d.expense}</th>
              <th className="hidden px-3 py-2.5 text-left font-medium lg:table-cell">{d.category}</th>
              <th className="hidden px-3 py-2.5 text-left font-medium xl:table-cell">{d.expensePeriod}</th>
              <th className="hidden px-3 py-2.5 text-left font-medium lg:table-cell">{d.expenseLineItem}</th>
              <th className="px-3 py-2.5 text-right font-medium">{d.expensePlan}</th>
              <th className="px-4 py-2.5 text-right font-medium">{d.expenseActual}</th>
              <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">{d.documents}</th>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {actualRequests.map((request) => {
              const period = request.linkedPeriodId ? periodsById.get(request.linkedPeriodId) : undefined;
              const lineItem = request.linkedLineItemId ? lineItemsById.get(request.linkedLineItemId) : undefined;
              const actualAmount = request.actualAmount ?? request.estimatedAmount;
              const hasExactActual = request.actualAmount !== undefined;
              const purchasedDate = new Date(request.purchasedAt ?? request.updatedAt);

              return (
                <tr key={request._id} className="bg-white transition hover:bg-slate-50">
                  <td className="px-4 py-3 align-top font-mono text-xs text-slate-500">
                    {purchasedDate.toLocaleDateString("uk-UA")}
                  </td>
                  <td className="min-w-56 px-4 py-3 align-top">
                    <p className="font-semibold text-slate-900">{request.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{request.description}</p>
                    {request.vendor && (
                      <p className="mt-1 text-xs text-slate-400">
                        {d.vendor}: {request.vendor}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 align-top text-sm text-slate-600 lg:table-cell">
                    {d.categories[request.category as keyof typeof d.categories]}
                  </td>
                  <td className="hidden px-3 py-3 align-top text-sm text-slate-600 xl:table-cell">
                    {period?.label ?? "—"}
                  </td>
                  <td className="hidden px-3 py-3 align-top lg:table-cell">
                    {lineItem ? (
                      <span className="finance-chip border-blue-200 bg-blue-50 text-blue-700">
                        {lineItem.name}
                      </span>
                    ) : (
                      <span className="finance-chip border-amber-200 bg-amber-50 text-amber-800">
                        no budget line
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-right font-mono text-sm text-slate-500">
                    {formatAmount(request.estimatedAmount, request.currency)}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <p className="font-mono text-sm font-bold text-slate-950">
                      {formatAmount(actualAmount, request.currency)}
                    </p>
                    {!hasExactActual && (
                      <p className="mt-1 text-xs font-semibold text-amber-700">{d.estimatedBadge}</p>
                    )}
                  </td>
                  <td className="hidden min-w-56 px-4 py-3 align-top md:table-cell">
                    <ExpenseDocuments
                      dictionary={dictionary}
                      locale={locale}
                      projectId={projectId}
                      request={request}
                    />
                  </td>
                </tr>
              );
            })}
          </DataTableBody>
        </DataTable>
      </div>
    </div>
  );
}

function ExpenseDocuments({
  dictionary,
  locale,
  projectId,
  request,
}: {
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  request: PurchaseRequest;
}) {
  const d = dictionary.budget;
  const requestId = request._id ?? "";

  return (
    <div className="space-y-2">
      {request.documents.length > 0 ? (
        <div className="space-y-1">
          <span className="finance-chip border-emerald-200 bg-emerald-50 text-emerald-700">
            {d.documentReady} · {request.documents.length} {d.documentCount}
          </span>
          <div className="space-y-1">
            {request.documents.map((document, index) => (
              <a
                key={`${document.storageUri}-${index}`}
                href={`/api/budget/purchase-requests/${requestId}/documents/${index}`}
                className="block truncate rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {document.name}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <span className="finance-chip border-amber-200 bg-amber-50 text-amber-800">
          {d.documentMissing}
        </span>
      )}

      {requestId && (
        <form action={uploadPurchaseRequestDocuments} className="space-y-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="requestId" value={requestId} />
          <input
            name="files"
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.zip"
            className="block w-full text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          />
          <button
            type="submit"
            className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {d.uploadDocuments}
          </button>
        </form>
      )}
    </div>
  );
}

function LedgerStat({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "amber" | "cyan" | "emerald" | "rose" | "slate";
  value: string;
}) {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <div className={`finance-stat-tile px-4 py-3 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 truncate font-mono text-2xl font-bold">{value}</p>
    </div>
  );
}
