import {
  Building2,
  Cpu,
  FileText,
  FlaskConical,
  GitFork,
  Monitor,
  MoreHorizontal,
  Package,
  Plane,
  Users,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";
import { addBudgetLineItem } from "@/app/actions";
import { DataTable, DataTableBody, DataTableHead, EmptyState } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n";
import { budgetCategories, currencyOptions } from "@/lib/schemas";
import type { BudgetLineItem, BudgetCategory, BudgetPeriod } from "@/lib/schemas";

// ── category config ───────────────────────────────────────────────────────────

const categoryIcon: Record<BudgetCategory, ComponentType<{ className?: string }>> = {
  personnel: Users,
  equipment: Cpu,
  reagents: FlaskConical,
  consumables: Package,
  travel: Plane,
  services: Wrench,
  subcontracting: GitFork,
  overhead: Building2,
  software: Monitor,
  publications: FileText,
  other: MoreHorizontal,
};

const categoryColor: Record<
  BudgetCategory,
  { header: string; dot: string; icon: string; text: string }
> = {
  personnel:     { header: "bg-blue-50 border-blue-200",       dot: "bg-blue-500",    icon: "text-blue-600",    text: "text-blue-800" },
  equipment:     { header: "bg-blue-50 border-blue-200",       dot: "bg-blue-500",    icon: "text-blue-600",    text: "text-blue-800" },
  reagents:      { header: "bg-purple-50 border-purple-200",   dot: "bg-purple-500",  icon: "text-purple-600",  text: "text-purple-800" },
  consumables:   { header: "bg-amber-50 border-amber-200",     dot: "bg-amber-500",   icon: "text-amber-600",   text: "text-amber-800" },
  travel:        { header: "bg-cyan-50 border-cyan-200",       dot: "bg-cyan-500",    icon: "text-cyan-600",    text: "text-cyan-800" },
  services:      { header: "bg-orange-50 border-orange-200",   dot: "bg-orange-500",  icon: "text-orange-600",  text: "text-orange-800" },
  subcontracting:{ header: "bg-indigo-50 border-indigo-200",   dot: "bg-indigo-500",  icon: "text-indigo-600",  text: "text-indigo-800" },
  overhead:      { header: "bg-slate-50 border-slate-200",     dot: "bg-slate-400",   icon: "text-slate-600",   text: "text-slate-700" },
  software:      { header: "bg-violet-50 border-violet-200",   dot: "bg-violet-500",  icon: "text-violet-600",  text: "text-violet-800" },
  publications:  { header: "bg-teal-50 border-teal-200",       dot: "bg-teal-500",    icon: "text-teal-600",    text: "text-teal-800" },
  other:         { header: "bg-stone-50 border-stone-200",     dot: "bg-stone-400",   icon: "text-stone-500",   text: "text-stone-700" },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = "UAH") {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── component ─────────────────────────────────────────────────────────────────

export function BudgetItemRegistry({
  lineItems,
  periods,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  lineItems: BudgetLineItem[];
  periods: BudgetPeriod[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.budget;
  const grandTotal = lineItems.reduce((s, i) => s + i.plannedAmount, 0);
  const currency = lineItems[0]?.currency ?? "UAH";
  const periodsById = new Map(periods.map((p) => [p._id ?? "", p]));

  return (
    <div className="space-y-4">
      {/* Grand total bar */}
      {lineItems.length > 0 && (
        <div className="surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex flex-wrap gap-4">
            {budgetCategories.map((cat) => {
              const catItems = lineItems.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;
              const catTotal = catItems.reduce((s, i) => s + i.plannedAmount, 0);
              const pct = grandTotal > 0 ? Math.round((catTotal / grandTotal) * 100) : 0;
              const colors = categoryColor[cat];
              return (
                <div key={cat} className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  {d.categories[cat]}
                  <span className="font-mono font-semibold text-stone-800">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500">{d.totalPlanned}</p>
            <p className="font-mono text-xl font-bold text-stone-950">{fmt(grandTotal, currency)}</p>
          </div>
        </div>
      )}

      {/* Add item form */}
      {canManage && (
        <div className="surface overflow-hidden">
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-slate-800 transition select-none hover:bg-blue-50 hover:text-blue-800">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-base font-bold text-blue-700">+</span>
              {d.addItem}
            </summary>
            <div className="border-t border-slate-200 bg-slate-50/50 px-5 pb-6 pt-5">
              <form action={addBudgetLineItem} className="space-y-4">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="projectId" value={projectId} />

                {/* Category + Name */}
                <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.category} *</label>
                    <select name="category" required className="input-control px-3 py-2 text-sm outline-none">
                      {budgetCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {d.categories[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.itemName} *</label>
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={300}
                      placeholder={d.itemNamePlaceholder}
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Specs */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-700">{d.specs}</label>
                  <textarea
                    name="description"
                    maxLength={1000}
                    rows={2}
                    placeholder={d.specsPlaceholder}
                    className="input-control px-3 py-2 text-sm outline-none"
                  />
                </div>

                {/* Qty + Unit + Unit price + Currency */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.quantity}</label>
                    <input
                      name="quantity"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={1}
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.unit}</label>
                    <input
                      name="unit"
                      maxLength={50}
                      placeholder={d.unitPlaceholder}
                      defaultValue="шт."
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">
                      {d.unitPrice}
                      <span className="ml-1 text-stone-400 font-normal">→ авто-підсумок</span>
                    </label>
                    <input
                      name="unitPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.currency}</label>
                    <select name="currency" defaultValue="UAH" className="input-control px-3 py-2 text-sm outline-none">
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Planned amount override + Vendor + URL */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">
                      {d.plannedAmount}
                      <span className="ml-1 text-stone-400 font-normal">(якщо без ціни/од.)</span>
                    </label>
                    <input
                      name="plannedAmount"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0"
                      defaultValue={0}
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.vendor}</label>
                    <input
                      name="vendor"
                      maxLength={200}
                      placeholder={d.vendorPlaceholder}
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.url}</label>
                    <input
                      name="url"
                      type="url"
                      maxLength={500}
                      placeholder={d.urlPlaceholder}
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Period + Notes */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {periods.length > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-stone-700">{d.linkedPeriod}</label>
                      <select name="periodId" className="input-control px-3 py-2 text-sm outline-none">
                        <option value="">{d.notLinked}</option>
                        {periods.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-700">{d.notes}</label>
                    <input
                      name="notes"
                      maxLength={600}
                      placeholder={d.notesPlaceholder}
                      className="input-control px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <button type="submit" className="control-primary px-5 py-2.5 text-sm font-semibold">
                  {d.saveItem}
                </button>
              </form>
            </div>
          </details>
        </div>
      )}

      {/* Category sections */}
      {budgetCategories.map((category) => {
        const items = lineItems.filter((i) => i.category === category);
        const categoryTotal = items.reduce((s, i) => s + i.plannedAmount, 0);
        const Icon = categoryIcon[category];
        const colors = categoryColor[category];
        const catCurrency = items[0]?.currency ?? currency;

        return (
          <div key={category} className="surface overflow-hidden">
            {/* Category header */}
            <div className={`flex items-center justify-between border-b px-5 py-3.5 ${colors.header}`}>
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${colors.icon}`} />
                <div>
                  <p className={`text-sm font-semibold ${colors.text}`}>
                    {d.categories[category]}
                  </p>
                  <p className="text-xs text-stone-500">
                    {items.length > 0
                      ? `${items.length} ${d.itemsCount}`
                      : <span className="italic">немає позицій</span>}
                  </p>
                </div>
              </div>
              <p className={`font-mono text-base font-bold ${items.length > 0 ? "text-stone-950" : "text-stone-300"}`}>
                {items.length > 0 ? fmt(categoryTotal, catCurrency) : "—"}
              </p>
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">{d.itemName}</th>
                      <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">{d.quantity}</th>
                      <th className="hidden px-3 py-2.5 text-left font-medium md:table-cell">{d.unit}</th>
                      <th className="hidden px-3 py-2.5 text-right font-medium lg:table-cell">{d.unitPrice}</th>
                      <th className="px-3 py-2.5 text-right font-medium">{d.plannedAmount}</th>
                      <th className="hidden px-3 py-2.5 text-left font-medium xl:table-cell">{d.vendor}</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {items.map((item) => {
                      const period = item.periodId ? periodsById.get(item.periodId) : undefined;
                      return (
                        <tr key={item._id} className="transition hover:bg-blue-50/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-stone-900">{item.name}</p>
                            {item.description && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-stone-400">
                                {item.description}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {period && (
                                <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                                  {period.label}
                                </span>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-xs text-blue-600 hover:underline"
                                >
                                  ↗ посилання
                                </a>
                              )}
                              {item.notes && (
                                <span className="text-xs italic text-stone-400">{item.notes}</span>
                              )}
                            </div>
                          </td>
                          <td className="hidden px-3 py-3 text-right font-mono text-stone-700 md:table-cell">
                            {item.quantity > 0 ? item.quantity : "—"}
                          </td>
                          <td className="hidden px-3 py-3 text-stone-500 md:table-cell">
                            {item.unit || "—"}
                          </td>
                          <td className="hidden px-3 py-3 text-right font-mono text-stone-600 lg:table-cell">
                            {item.unitPrice > 0 ? fmt(item.unitPrice, item.currency) : "—"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <p className="font-mono font-semibold text-stone-950">
                              {fmt(item.plannedAmount, item.currency)}
                            </p>
                            {item.unitPrice > 0 && item.quantity > 1 && (
                              <p className="text-xs text-stone-400">
                                {item.quantity} × {fmt(item.unitPrice, item.currency)}
                              </p>
                            )}
                          </td>
                          <td className="hidden px-3 py-3 text-xs text-stone-500 xl:table-cell">
                            {item.vendor || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </DataTableBody>
                  <tfoot className="border-t-2 border-stone-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-2.5 text-xs text-stone-500">
                        {items.length} {d.itemsCount}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-stone-950">
                        {fmt(categoryTotal, catCurrency)}
                      </td>
                      <td className="hidden xl:table-cell" />
                    </tr>
                  </tfoot>
                </DataTable>
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {lineItems.length === 0 && (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title={d.noItems}
          description="Додайте першу позицію кошторису, щоб сформувати категорії, суми та періоди."
        />
      )}
    </div>
  );
}
