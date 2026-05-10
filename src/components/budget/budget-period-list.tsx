"use client";

import { budgetCategories } from "@/lib/schemas";
import type { BudgetLineItem, BudgetPeriod } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import { addBudgetLineItem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown, ChevronUp, Wallet, Calendar } from "lucide-react";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const lineItemSchema = z.object({
  category: z.string().min(1),
  currency: z.string().min(1),
  description: z.string().min(2).max(300),
  plannedAmount: z.number().min(0),
  notes: z.string().max(600).optional(),
});

export function BudgetPeriodList({
  periods,
  lineItems,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  periods: BudgetPeriod[];
  lineItems: BudgetLineItem[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.budget;

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
        <Wallet className="h-12 w-12 text-slate-300" />
        <p className="mt-4 text-sm font-medium text-stone-500">{d.noPeriods}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {periods.map((period) => (
        <BudgetPeriodCard
          key={period._id}
          period={period}
          lineItems={lineItems.filter((item) => item.periodId === period._id)}
          dictionary={dictionary}
          locale={locale}
          projectId={projectId}
          canManage={canManage}
        />
      ))}
    </div>
  );
}

function BudgetPeriodCard({
  period,
  lineItems,
  dictionary,
  locale,
  projectId,
  canManage,
}: {
  period: BudgetPeriod;
  lineItems: BudgetLineItem[];
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  canManage: boolean;
}) {
  const d = dictionary.budget;
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddAddForm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const periodTotal = lineItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const currency = lineItems[0]?.currency ?? "UAH";

  const form = useForm({
    initialValues: {
      category: budgetCategories[0] as (typeof budgetCategories)[number],
      currency: "UAH",
      description: "",
      plannedAmount: 0,
      notes: "",
    },
    validate: zodResolver(lineItemSchema),
  });

  const categoryOptions = budgetCategories.map((cat) => ({
    value: cat,
    label: d.categories[cat as keyof typeof d.categories],
  }));

  const handleAddLineItem = async (values: typeof form.values) => {
    setIsPending(true);
    const formData = new FormData();
    formData.append("locale", locale);
    formData.append("projectId", projectId);
    formData.append("periodId", period._id!);
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    try {
      await addBudgetLineItem(formData);
      form.reset();
      setShowAddAddForm(false);
    } catch (error) {
      console.error("Failed to add line item", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div 
        className="flex cursor-pointer flex-col gap-3 bg-slate-50/50 px-5 py-4 transition-colors hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-stone-950">{period.label}</h3>
            <p className="text-[11px] font-medium text-stone-400 uppercase tracking-widest">
              {period.startDate} — {period.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                period.status === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {d.periodStatuses[period.status]}
            </span>
            <p className="mt-1 text-sm font-bold text-blue-700">
              {formatAmount(periodTotal, currency)}
            </p>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-5">
              {lineItems.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-stone-400 italic">{d.noLineItems}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <th className="pb-3 pr-4">{d.category}</th>
                        <th className="pb-3 pr-4">{d.description}</th>
                        <th className="pb-3 pr-4 text-right">{d.plannedAmount}</th>
                        <th className="pb-3">{d.notes}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lineItems.map((item) => (
                        <tr key={item._id} className="group transition-colors hover:bg-slate-50/50">
                          <td className="py-3 pr-4">
                            <span className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                              {d.categories[item.category as keyof typeof d.categories]}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium text-stone-800">
                            {item.description}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono font-bold text-blue-700">
                            {formatAmount(item.plannedAmount, item.currency)}
                          </td>
                          <td className="py-3 text-xs text-stone-400 max-w-[200px] truncate">
                            {item.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {canManage && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  {!showAddForm ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 border-dashed"
                      onClick={() => setShowAddAddForm(true)}
                    >
                      <Plus className="h-4 w-4" />
                      {d.addLineItem}
                    </Button>
                  ) : (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-blue-700">{d.addLineItem}</h4>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setShowAddAddForm(false)}>
                          {"Скасувати"}
                        </Button>
                      </div>
                      <form onSubmit={form.onSubmit(handleAddLineItem)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-blue-700 uppercase tracking-wide">{d.category}</Label>
                            <Combobox
                              options={categoryOptions}
                              value={form.values.category}
                              onValueChange={(val) => form.setFieldValue("category", val as typeof form.values.category)}
                              placeholder={d.category}
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-blue-700 uppercase tracking-wide">{d.currency}</Label>
                            <Select
                              value={form.values.currency}
                              onValueChange={(val) => form.setFieldValue("currency", val)}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="UAH" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UAH">UAH</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-blue-700 uppercase tracking-wide">{d.description}</Label>
                          <Input
                            {...form.getInputProps("description")}
                            placeholder={d.descriptionPlaceholder}
                            className="bg-white"
                            required
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-blue-700 uppercase tracking-wide">{d.plannedAmount}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...form.getInputProps("plannedAmount")}
                              className="bg-white font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-blue-700 uppercase tracking-wide">{d.notes}</Label>
                            <Input
                              {...form.getInputProps("notes")}
                              placeholder={d.notesPlaceholder}
                              className="bg-white"
                            />
                          </div>
                        </div>

                        <Button type="submit" size="sm" disabled={isPending} className="w-full sm:w-auto">
                          {isPending ? "..." : d.saveLineItem}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
