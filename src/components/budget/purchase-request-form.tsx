"use client";

import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { submitPurchaseRequest } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import { budgetCategories } from "@/lib/schemas";
import type { BudgetLineItem, BudgetPeriod } from "@/lib/schemas";
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
import { useState } from "react";

const purchaseRequestSchema = z.object({
  title: z.string().min(3).max(240),
  description: z.string().min(3).max(2000),
  category: z.string().min(1),
  vendor: z.string().max(200).optional(),
  estimatedAmount: z.number().min(0),
  currency: z.string().min(1),
  linkedPeriodId: z.string().optional(),
  linkedLineItemId: z.string().optional(),
  justification: z.string().max(1200).optional(),
});

export function PurchaseRequestForm({
  dictionary,
  locale,
  projectId,
  periods,
  lineItems,
}: {
  dictionary: Dictionary;
  locale: string;
  projectId: string;
  periods: BudgetPeriod[];
  lineItems: BudgetLineItem[];
}) {
  const d = dictionary.budget;
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
      category: budgetCategories[0] as (typeof budgetCategories)[number],
      vendor: "",
      estimatedAmount: 0,
      currency: "UAH",
      linkedPeriodId: "",
      linkedLineItemId: "",
      justification: "",
    },
    validate: zodResolver(purchaseRequestSchema),
  });

  const handleSubmit = async (values: typeof form.values, e?: React.FormEvent) => {
    setIsPending(true);
    const formData = new FormData();
    formData.append("locale", locale);
    formData.append("projectId", projectId);
    
    // Check if it was a draft save
    if (e?.currentTarget instanceof HTMLFormElement) {
      const submitter = (e as any).nativeEvent.submitter;
      if (submitter?.name === "saveDraft") {
        formData.append("saveDraft", "1");
      }
    }

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert "none" back to empty string for the server
        const val = value === "none" ? "" : String(value);
        formData.append(key, val);
      }
    });

    try {
      await submitPurchaseRequest(formData);
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="title">{d.requestTitle} *</Label>
          <Input
            id="title"
            {...form.getInputProps("title")}
            placeholder={d.requestTitlePlaceholder}
            required
          />
          {form.errors.title && (
            <p className="text-[10px] font-bold text-rose-500 uppercase">{form.errors.title}</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="description">{d.requestDescription} *</Label>
          <textarea
            id="description"
            {...form.getInputProps("description")}
            rows={3}
            required
            placeholder={d.requestDescriptionPlaceholder}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          {form.errors.description && (
            <p className="text-[10px] font-bold text-rose-500 uppercase">{form.errors.description}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{d.category} *</Label>
          <Select
            value={form.values.category}
            onValueChange={(val) => form.setFieldValue("category", val as typeof form.values.category)}
          >
            <SelectTrigger>
              <SelectValue placeholder={d.category} />
            </SelectTrigger>
            <SelectContent>
              {budgetCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {d.categories[cat as keyof typeof d.categories]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vendor">{d.vendor}</Label>
          <Input
            id="vendor"
            {...form.getInputProps("vendor")}
            placeholder={d.vendorPlaceholder}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimatedAmount">{d.estimatedAmount} *</Label>
          <Input
            id="estimatedAmount"
            type="number"
            step="0.01"
            min="0"
            required
            {...form.getInputProps("estimatedAmount")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{d.currency}</Label>
          <Select
            value={form.values.currency}
            onValueChange={(val) => form.setFieldValue("currency", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="UAH" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UAH">UAH</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periods.length > 0 && (
          <>
            <div className="space-y-1.5">
              <Label>{d.linkedPeriod}</Label>
              <Select
                value={form.values.linkedPeriodId || "none"}
                onValueChange={(val) => form.setFieldValue("linkedPeriodId", val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={d.notLinked} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{d.notLinked}</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p._id} value={p._id!}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lineItems.length > 0 && (
              <div className="space-y-1.5">
                <Label>{d.linkedLineItem}</Label>
                <Select
                  value={form.values.linkedLineItemId || "none"}
                  onValueChange={(val) => form.setFieldValue("linkedLineItemId", val === "none" ? "" : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={d.notLinked} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{d.notLinked}</SelectItem>
                    {lineItems.map((item) => (
                      <SelectItem key={item._id} value={item._id!}>
                        {d.categories[item.category as keyof typeof d.categories]} —{" "}
                        {item.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="justification">{d.justification}</Label>
          <textarea
            id="justification"
            {...form.getInputProps("justification")}
            rows={2}
            placeholder={d.justificationPlaceholder}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "..." : d.submitRequest}
        </Button>
        <Button variant="outline" type="submit" name="saveDraft" value="1" disabled={isPending}>
          {d.saveDraft}
        </Button>
      </div>
    </form>
  );
}
