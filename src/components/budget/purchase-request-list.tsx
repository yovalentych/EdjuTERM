import {
  approvePurchaseRequest,
  markPurchaseRequestPurchased,
  rejectPurchaseRequest,
} from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import type { BudgetPeriod, PurchaseRequest, SafeUser } from "@/lib/schemas";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusColors: Record<string, string> = {
  draft: "border-stone-300 bg-stone-50 text-stone-600",
  submitted: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-300 bg-rose-50 text-rose-800",
  purchased: "border-cyan-300 bg-cyan-50 text-cyan-800",
  delivered: "border-blue-300 bg-blue-50 text-blue-800",
};

export function PurchaseRequestList({
  requests,
  periods,
  dictionary,
  locale,
  projectId,
  currentUser,
  canManage,
}: {
  requests: PurchaseRequest[];
  periods: BudgetPeriod[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  currentUser: SafeUser;
  canManage: boolean;
}) {
  const d = dictionary.budget;

  if (requests.length === 0) {
    return (
      <p className="surface-muted border-dashed p-6 text-sm text-stone-500">
        {d.noRequests}
      </p>
    );
  }

  const periodsById = new Map(periods.map((p) => [p._id ?? "", p]));

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const period = req.linkedPeriodId
          ? periodsById.get(req.linkedPeriodId)
          : undefined;

        const isOwner = req.requesterId === currentUser._id;
        const canApprove =
          canManage &&
          (req.status === "submitted" || req.status === "draft");
        const canMarkPurchased =
          req.status === "approved" &&
          (canManage || isOwner);

        return (
          <article key={req._id} className="surface">
            <div className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`border px-2 py-0.5 text-xs font-semibold ${
                      statusColors[req.status] ?? ""
                    }`}
                  >
                    {d.requestStatuses[req.status as keyof typeof d.requestStatuses]}
                  </span>
                  <span className="border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-600">
                    {d.categories[req.category as keyof typeof d.categories]}
                  </span>
                  {period && (
                    <span className="border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      {period.label}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-semibold text-stone-950">{req.title}</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {req.description}
                </p>
                {req.vendor && (
                  <p className="mt-1 text-xs text-stone-500">
                    {d.vendor}: {req.vendor}
                  </p>
                )}
                {req.justification && (
                  <p className="mt-1 text-xs text-stone-400 italic">
                    {req.justification}
                  </p>
                )}
                {req.reviewNote && (
                  <p className="mt-2 border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
                    {d.reviewedBy}: {req.reviewNote}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-xl font-semibold text-stone-950">
                  {formatAmount(req.estimatedAmount, req.currency)}
                </p>
                {req.actualAmount !== undefined && (
                  <p className="mt-1 font-mono text-sm text-emerald-700">
                    {d.actualAmount}: {formatAmount(req.actualAmount, req.currency)}
                  </p>
                )}
                <p className="mt-1 text-xs text-stone-400">
                  {d.requestedOn}:{" "}
                  {req.createdAt.toLocaleDateString("uk-UA")}
                </p>
              </div>
            </div>

            {(canApprove || canMarkPurchased) && (
              <div className="flex flex-wrap gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3">
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
  );
}
