import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  listBudgetLineItems,
  listBudgetPeriods,
  listPurchaseRequests,
} from "@/lib/budget";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectForUser } from "@/lib/projects";
import { budgetCategories } from "@/lib/schemas";
import type { BudgetLineItem, BudgetPeriod, PurchaseRequest } from "@/lib/schemas";

type ExportFormat = "csv" | "xlsx";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRows(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function amount(value: number) {
  return Math.round(value * 100) / 100;
}

function buildBudgetRows({
  lineItems,
  periods,
  requests,
}: {
  lineItems: BudgetLineItem[];
  periods: BudgetPeriod[];
  requests: PurchaseRequest[];
}) {
  const periodsById = new Map(periods.map((period) => [period._id ?? "", period]));
  const lineItemsById = new Map(lineItems.map((item) => [item._id ?? "", item]));
  const actualRequests = requests.filter((request) => request.status === "purchased" || request.status === "delivered");
  const warningRows = [
    ["Type", "Count"],
    ["Unlinked requests", requests.filter((request) => !request.linkedLineItemId).length],
    ["Actual expenses without exact amount", actualRequests.filter((request) => request.actualAmount === undefined).length],
    ["Actual expenses without documents", actualRequests.filter((request) => request.documents.length === 0).length],
  ];

  const lineItemRows = [
    ["Category", "Name", "Period", "Planned", "Currency", "Vendor", "Notes"],
    ...lineItems.map((item) => [
      item.category,
      item.name,
      item.periodId ? periodsById.get(item.periodId)?.label ?? "" : "",
      amount(item.plannedAmount),
      item.currency,
      item.vendor,
      item.notes,
    ]),
  ];

  const requestRows = [
    ["Title", "Category", "Status", "Period", "Budget line", "Estimated", "Actual", "Currency", "Vendor", "Documents"],
    ...requests.map((request) => [
      request.title,
      request.category,
      request.status,
      request.linkedPeriodId ? periodsById.get(request.linkedPeriodId)?.label ?? "" : "",
      request.linkedLineItemId ? lineItemsById.get(request.linkedLineItemId)?.name ?? "" : "",
      request.estimatedAmount === undefined ? "" : amount(request.estimatedAmount),
      request.actualAmount === undefined ? "" : amount(request.actualAmount),
      request.currency,
      request.vendor,
      request.documents.length,
    ]),
  ];

  const actualRows = [
    ["Date", "Title", "Category", "Budget line", "Estimated", "Actual", "Currency", "Vendor", "Documents"],
    ...actualRequests.map((request) => [
      new Date(request.purchasedAt ?? request.updatedAt).toISOString().slice(0, 10),
      request.title,
      request.category,
      request.linkedLineItemId ? lineItemsById.get(request.linkedLineItemId)?.name ?? "" : "",
      request.estimatedAmount === undefined ? "" : amount(request.estimatedAmount),
      amount(request.actualAmount ?? request.estimatedAmount ?? 0),
      request.currency,
      request.vendor,
      request.documents.length,
    ]),
  ];

  return { actualRows, lineItemRows, requestRows, warningRows };
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

function buildSummary(lineItems: BudgetLineItem[], requests: PurchaseRequest[]) {
  const totalPlanned = lineItems.reduce((sum, item) => sum + item.plannedAmount, 0);
  const totalCommitted = requests
    .filter((request) => request.status === "submitted" || request.status === "approved")
    .reduce((sum, request) => sum + (request.estimatedAmount ?? 0), 0);
  const totalSpent = requests
    .filter((request) => request.status === "purchased" || request.status === "delivered")
    .reduce((sum, request) => sum + (request.actualAmount ?? request.estimatedAmount ?? 0), 0);
  const categoryMap = new Map<string, { committed: number; planned: number; spent: number }>();

  for (const category of budgetCategories) {
    categoryMap.set(category, { committed: 0, planned: 0, spent: 0 });
  }

  for (const item of lineItems) {
    const entry = categoryMap.get(item.category);
    if (entry) entry.planned += item.plannedAmount;
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

  return {
    byCategory: [...categoryMap.entries()].map(([category, value]) => {
      const used = value.committed + value.spent;
      const remaining = value.planned - used;
      return {
        category,
        committed: value.committed,
        planned: value.planned,
        remaining,
        spent: value.spent,
        utilizationPct: value.planned > 0 ? Math.round((used / value.planned) * 100) : used > 0 ? 100 : 0,
        isOverBudget: value.planned > 0 && remaining < 0,
      };
    }),
    pendingRequests: requests.filter((request) => request.status === "submitted").length,
    approvedRequests: requests.filter((request) => request.status === "approved").length,
    paidRequests: requests.filter((request) => request.status === "purchased" || request.status === "delivered").length,
    totalCommitted,
    totalPlanned,
    totalRemaining: totalPlanned - totalCommitted - totalSpent,
    totalSpent,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const formatParam = searchParams.get("format");
  const format: ExportFormat = formatParam === "xlsx" ? "xlsx" : "csv";
  const filters = {
    category: searchParams.get("reportCategory") ?? "",
    issue: searchParams.get("reportIssue") ?? "",
    period: searchParams.get("reportPeriod") ?? "",
    status: searchParams.get("reportStatus") ?? "",
  };

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectForUser(projectId, user);
  if (!project?._id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [periods, rawLineItems, rawRequests] = await Promise.all([
    listBudgetPeriods(project._id),
    listBudgetLineItems(project._id),
    listPurchaseRequests(project._id),
  ]);
  const lineItems = filterLineItems(rawLineItems, filters);
  const requests = filterRequests(rawRequests, filters);
  const summary = buildSummary(lineItems, requests);

  const summaryRows = [
    ["Metric", "Value", "Currency"],
    ["Planned", amount(summary.totalPlanned), "UAH"],
    ["Committed", amount(summary.totalCommitted), "UAH"],
    ["Spent", amount(summary.totalSpent), "UAH"],
    ["Remaining", amount(summary.totalRemaining), "UAH"],
    ["Pending requests", summary.pendingRequests, ""],
    ["Approved requests", summary.approvedRequests, ""],
    ["Paid requests", summary.paidRequests, ""],
  ];

  const categoryRows = [
    ["Category", "Planned", "Committed", "Spent", "Remaining", "Utilization %", "Over budget"],
    ...summary.byCategory.map((category) => [
      category.category,
      amount(category.planned),
      amount(category.committed),
      amount(category.spent),
      amount(category.remaining),
      category.utilizationPct,
      category.isOverBudget ? "yes" : "no",
    ]),
  ];

  const { actualRows, lineItemRows, requestRows, warningRows } = buildBudgetRows({
    lineItems,
    periods,
    requests,
  });

  const safeName = (project.acronym || project.title || "project")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "project";
  const filename = `${safeName}-budget-report.${format}`;

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(categoryRows), "Categories");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(actualRows), "Actual Expenses");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(lineItemRows), "Budget Items");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(requestRows), "Purchase Requests");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(warningRows), "Warnings");
    const body = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
    const arrayBuffer = body.buffer.slice(
      body.byteOffset,
      body.byteOffset + body.byteLength,
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  }

  const csv = [
    "### Summary",
    csvRows(summaryRows),
    "",
    "### Categories",
    csvRows(categoryRows),
    "",
    "### Actual Expenses",
    csvRows(actualRows),
    "",
    "### Budget Items",
    csvRows(lineItemRows),
    "",
    "### Purchase Requests",
    csvRows(requestRows),
    "",
    "### Warnings",
    csvRows(warningRows),
  ].join("\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
