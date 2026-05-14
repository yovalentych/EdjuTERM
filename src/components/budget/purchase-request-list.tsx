import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  WalletCards,
  XCircle,
} from "lucide-react";
import {
  approvePurchaseRequest,
  markPurchaseRequestPurchased,
  rejectPurchaseRequest,
} from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import type { BudgetLineItem, BudgetPeriod, PurchaseRequest, SafeUser } from "@/lib/schemas";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusColors: Record<string, string> = {
  draft: "border-slate-300 bg-slate-50 text-slate-600",
  submitted: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-300 bg-rose-50 text-rose-800",
  purchased: "border-cyan-300 bg-cyan-50 text-cyan-800",
  delivered: "border-blue-300 bg-blue-50 text-blue-800",
};

export function PurchaseRequestList({
  requests,
  periods,
  lineItems,
  dictionary,
  locale,
  projectId,
  currentUser,
  canManage,
}: {
  requests: PurchaseRequest[];
  periods: BudgetPeriod[];
  lineItems: BudgetLineItem[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  currentUser: SafeUser;
  canManage: boolean;
}) {
  const d = dictionary.budget;

  if (requests.length === 0) {
    return (
      <p className="surface-muted border-dashed p-6 text-sm text-slate-500">
        {d.noRequests}
      </p>
    );
  }

  const periodsById = new Map(periods.map((p) => [p._id ?? "", p]));
  const lineItemsById = new Map(lineItems.map((item) => [item._id ?? "", item]));
  const groups = [
    {
      id: "waiting",
      title: "Waiting approval",
      description: "Submitted requests that need a supervisor or manager decision.",
      icon: Clock3,
      tone: "amber" as const,
      requests: requests.filter((req) => req.status === "submitted"),
    },
    {
      id: "committed",
      title: "Approved / committed",
      description: "Approved obligations that reserve budget before actual payment.",
      icon: WalletCards,
      tone: "emerald" as const,
      requests: requests.filter((req) => req.status === "approved"),
    },
    {
      id: "actual",
      title: "Paid / actual",
      description: "Purchased or delivered requests that count as real expenses.",
      icon: CheckCircle2,
      tone: "cyan" as const,
      requests: requests.filter((req) => req.status === "purchased" || req.status === "delivered"),
    },
    {
      id: "draft",
      title: "Draft",
      description: "Requests that are not yet submitted for approval.",
      icon: FileText,
      tone: "slate" as const,
      requests: requests.filter((req) => req.status === "draft"),
    },
    {
      id: "closed",
      title: "Rejected / closed",
      description: "Requests that were rejected and do not affect commitments.",
      icon: XCircle,
      tone: "rose" as const,
      requests: requests.filter((req) => req.status === "rejected"),
    },
  ].filter((group) => group.requests.length > 0);
  const unlinkedActiveCount = requests.filter((req) =>
    (req.status === "submitted" || req.status === "approved") && !req.linkedLineItemId
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <WorkflowStat label="Waiting" value={requests.filter((req) => req.status === "submitted").length} tone="amber" />
        <WorkflowStat label="Committed" value={requests.filter((req) => req.status === "approved").length} tone="emerald" />
        <WorkflowStat label="Actual" value={requests.filter((req) => req.status === "purchased" || req.status === "delivered").length} tone="cyan" />
        <WorkflowStat label="Unlinked active" value={unlinkedActiveCount} tone={unlinkedActiveCount > 0 ? "rose" : "slate"} />
      </div>

      {unlinkedActiveCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            {unlinkedActiveCount} активних заявок не прив&apos;язані до рядка кошторису. Це ускладнює контроль залишків по категоріях.
          </p>
        </div>
      )}

      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.id} className="finance-soft-panel overflow-hidden">
            <div className={`flex flex-col gap-2 border-b px-5 py-4 md:flex-row md:items-center md:justify-between ${workflowHeaderClasses[group.tone]}`}>
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <div>
                  <h3 className="font-semibold text-slate-950">{group.title}</h3>
                  <p className="text-xs text-slate-500">{group.description}</p>
                </div>
              </div>
              <span className="w-fit rounded border border-white/70 bg-white/70 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                {group.requests.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {group.requests.map((req) => {
        const period = req.linkedPeriodId
          ? periodsById.get(req.linkedPeriodId)
          : undefined;
        const lineItem = req.linkedLineItemId
          ? lineItemsById.get(req.linkedLineItemId)
          : undefined;

        const isOwner = req.requesterId === currentUser._id;
        const canApprove =
          canManage &&
          req.status === "submitted";
        const canMarkPurchased =
          req.status === "approved" &&
          (canManage || isOwner);

        return (
          <article key={req._id} className="bg-white transition hover:bg-slate-50">
            <div className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`finance-chip ${
                      statusColors[req.status] ?? ""
                    }`}
                  >
                    {d.requestStatuses[req.status as keyof typeof d.requestStatuses]}
                  </span>
                  <span className="finance-chip border-slate-200 bg-slate-50 text-slate-600">
                    {d.categories[req.category as keyof typeof d.categories]}
                  </span>
                  {period && (
                    <span className="finance-chip border-indigo-200 bg-indigo-50 text-indigo-700">
                      {period.label}
                    </span>
                  )}
                  {lineItem ? (
                    <span className="finance-chip border-blue-200 bg-blue-50 text-blue-700">
                      {lineItem.name}
                    </span>
                  ) : (
                    <span className="finance-chip border-amber-200 bg-amber-50 text-amber-800">
                      no budget line
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-semibold text-slate-950">{req.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {req.description}
                </p>
                {req.vendor && (
                  <p className="mt-1 text-xs text-slate-500">
                    {d.vendor}: {req.vendor}
                  </p>
                )}
                {req.justification && (
                  <p className="mt-1 text-xs text-slate-400 italic">
                    {req.justification}
                  </p>
                )}
                {req.reviewNote && (
                  <p className="mt-2 border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {d.reviewedBy}: {req.reviewNote}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-xl font-semibold text-slate-950">
                  {formatAmount(req.estimatedAmount, req.currency)}
                </p>
                {req.actualAmount !== undefined && (
                  <p className="mt-1 font-mono text-sm text-emerald-700">
                    {d.actualAmount}: {formatAmount(req.actualAmount, req.currency)}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {d.requestedOn}:{" "}
                  {req.createdAt.toLocaleDateString("uk-UA")}
                </p>
              </div>
            </div>

            {(canApprove || canMarkPurchased) && (
              <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                {canApprove && (
                  <>
                    <form action={approvePurchaseRequest} className="flex gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="requestId" value={req._id ?? ""} />
                      <input
                        name="reviewNote"
                        placeholder={d.reviewNotePlaceholder}
                        maxLength={600}
                        className="input-control min-w-40 px-3 py-1.5 text-xs outline-none"
                      />
                      <button
                        type="submit"
                        className="control-primary px-3 py-1.5 text-xs font-semibold"
                      >
                        {d.approve}
                      </button>
                    </form>

                    <form action={rejectPurchaseRequest} className="flex gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="requestId" value={req._id ?? ""} />
                      <input
                        name="reviewNote"
                        placeholder={d.reviewNotePlaceholder}
                        maxLength={600}
                        className="input-control min-w-40 px-3 py-1.5 text-xs outline-none"
                      />
                      <button
                        type="submit"
                        className="border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        {d.reject}
                      </button>
                    </form>
                  </>
                )}

                {canMarkPurchased && (
                  <form action={markPurchaseRequestPurchased} className="flex gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="requestId" value={req._id ?? ""} />
                    <input
                      name="actualAmount"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      placeholder={d.actualAmount}
                      defaultValue={req.estimatedAmount}
                      className="input-control w-32 px-3 py-1.5 text-xs outline-none"
                    />
                    <button
                      type="submit"
                      className="border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
                    >
                      {d.markPurchased}
                    </button>
                  </form>
                )}
              </div>
            )}
          </article>
        );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const workflowHeaderClasses = {
  amber: "bg-amber-50 text-amber-900",
  cyan: "bg-cyan-50 text-cyan-900",
  emerald: "bg-emerald-50 text-emerald-900",
  rose: "bg-rose-50 text-rose-900",
  slate: "bg-slate-50 text-slate-900",
};

function WorkflowStat({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "amber" | "cyan" | "emerald" | "rose" | "slate";
  value: number;
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
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
    </div>
  );
}
