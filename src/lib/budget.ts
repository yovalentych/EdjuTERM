import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  type BudgetLineItem,
  type BudgetLineItemInput,
  type BudgetPeriod,
  type BudgetPeriodInput,
  type PurchaseRequest,
  type PurchaseRequestInput,
  type PurchaseRequestStatus,
  type SafeUser,
  budgetLineItemSchema,
  budgetPeriodSchema,
  purchaseRequestSchema,
} from "@/lib/schemas";

// ── in-memory fallback ────────────────────────────────────────────────────────

const localPeriods: BudgetPeriod[] = [];
const localLineItems: BudgetLineItem[] = [];
const localRequests: PurchaseRequest[] = [];

// ── Budget Periods ────────────────────────────────────────────────────────────

export async function createBudgetPeriod(
  input: BudgetPeriodInput,
  user: SafeUser,
): Promise<BudgetPeriod> {
  const now = new Date();
  const period: BudgetPeriod = {
    ...input,
    status: "active",
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local = {
      ...period,
      _id: `local-period-${localPeriods.length + 1}`,
    };
    localPeriods.push(local);
    return local;
  }

  const db = await getMongoDb();
  await ensureBudgetIndexes(db);
  const { _id, ...insert } = period;
  void _id;
  const result = await db.collection("budget_periods").insertOne(insert);
  return { ...period, _id: result.insertedId.toString() };
}

export async function listBudgetPeriods(
  projectId: string,
): Promise<BudgetPeriod[]> {
  if (!hasMongoConfig()) {
    return localPeriods.filter((p) => p.projectId === projectId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("budget_periods")
    .find({ projectId })
    .sort({ startDate: 1 })
    .toArray();

  return docs.map((doc) =>
    budgetPeriodSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

// ── Budget Line Items ─────────────────────────────────────────────────────────

export async function createBudgetLineItem(
  input: BudgetLineItemInput,
  user: SafeUser,
): Promise<BudgetLineItem> {
  const now = new Date();
  const item: BudgetLineItem = {
    ...input,
    createdBy: user._id ?? "",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local = {
      ...item,
      _id: `local-item-${localLineItems.length + 1}`,
    };
    localLineItems.push(local);
    return local;
  }

  const db = await getMongoDb();
  const { _id, ...insert } = item;
  void _id;
  const result = await db.collection("budget_line_items").insertOne(insert);
  return { ...item, _id: result.insertedId.toString() };
}

export async function listBudgetLineItems(
  projectId: string,
  periodId?: string,
): Promise<BudgetLineItem[]> {
  const filter: Record<string, string> = { projectId };
  if (periodId) {
    filter.periodId = periodId;
  }

  if (!hasMongoConfig()) {
    return localLineItems.filter(
      (item) =>
        item.projectId === projectId &&
        (periodId === undefined || item.periodId === periodId),
    );
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("budget_line_items")
    .find(filter)
    .sort({ category: 1, createdAt: 1 })
    .toArray();

  return docs.map((doc) =>
    budgetLineItemSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

// ── Purchase Requests ─────────────────────────────────────────────────────────

export async function createPurchaseRequest(
  input: PurchaseRequestInput,
  user: SafeUser,
  status: "draft" | "submitted" = "submitted",
): Promise<PurchaseRequest> {
  const now = new Date();
  const request: PurchaseRequest = {
    ...input,
    requesterId: user._id ?? "",
    status,
    reviewNote: "",
    purchasedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    const local = {
      ...request,
      _id: `local-req-${localRequests.length + 1}`,
    };
    localRequests.push(local);
    return local;
  }

  const db = await getMongoDb();
  const { _id, ...insert } = request;
  void _id;
  const result = await db.collection("purchase_requests").insertOne(insert);
  return { ...request, _id: result.insertedId.toString() };
}

export async function listPurchaseRequests(
  projectId: string,
): Promise<PurchaseRequest[]> {
  if (!hasMongoConfig()) {
    return localRequests.filter((r) => r.projectId === projectId);
  }

  const db = await getMongoDb();
  const docs = await db
    .collection("purchase_requests")
    .find({ projectId })
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((doc) =>
    purchaseRequestSchema.parse({ ...doc, _id: doc._id.toString() }),
  );
}

export async function getPurchaseRequestById(
  requestId: string,
): Promise<PurchaseRequest | null> {
  if (!hasMongoConfig()) {
    return localRequests.find((r) => r._id === requestId) ?? null;
  }
  if (!ObjectId.isValid(requestId)) return null;
  const db = await getMongoDb();
  const doc = await db
    .collection("purchase_requests")
    .findOne({ _id: new ObjectId(requestId) });
  if (!doc) return null;
  return purchaseRequestSchema.parse({ ...doc, _id: doc._id.toString() });
}

export async function reviewPurchaseRequest(
  requestId: string,
  newStatus: "approved" | "rejected",
  reviewNote: string,
  reviewer: SafeUser,
): Promise<void> {
  const update = {
    status: newStatus,
    reviewedBy: reviewer._id ?? "",
    reviewNote,
    updatedAt: new Date(),
  };

  if (!hasMongoConfig()) {
    const req = localRequests.find((r) => r._id === requestId);
    if (req) {
      Object.assign(req, update);
    }
    return;
  }

  if (!ObjectId.isValid(requestId)) {
    throw new Error("INVALID_ID");
  }

  const db = await getMongoDb();
  await db
    .collection("purchase_requests")
    .updateOne({ _id: new ObjectId(requestId) }, { $set: update });
}

export async function markRequestPurchased(
  requestId: string,
  actualAmount: number,
  user: SafeUser,
): Promise<void> {
  const update: Partial<PurchaseRequest> & { updatedAt: Date } = {
    status: "purchased" as PurchaseRequestStatus,
    actualAmount,
    purchasedAt: new Date(),
    reviewedBy: user._id ?? "",
    updatedAt: new Date(),
  };

  if (!hasMongoConfig()) {
    const req = localRequests.find((r) => r._id === requestId);
    if (req) {
      Object.assign(req, update);
    }
    return;
  }

  if (!ObjectId.isValid(requestId)) {
    throw new Error("INVALID_ID");
  }

  const db = await getMongoDb();
  await db
    .collection("purchase_requests")
    .updateOne({ _id: new ObjectId(requestId) }, { $set: update });
}

// ── Budget Summary ────────────────────────────────────────────────────────────

export type BudgetSummary = {
  totalPlanned: number;
  totalCommitted: number;
  totalSpent: number;
  currency: string;
  byCategory: {
    category: string;
    planned: number;
    spent: number;
  }[];
};

export async function getBudgetSummary(
  projectId: string,
): Promise<BudgetSummary> {
  const [lineItems, requests] = await Promise.all([
    listBudgetLineItems(projectId),
    listPurchaseRequests(projectId),
  ]);

  const totalPlanned = lineItems.reduce((sum, item) => sum + item.plannedAmount, 0);

  const totalCommitted = requests
    .filter((r) => r.status === "submitted" || r.status === "approved")
    .reduce((sum, r) => sum + r.estimatedAmount, 0);

  const totalSpent = requests
    .filter((r) => r.status === "purchased" || r.status === "delivered")
    .reduce((sum, r) => sum + (r.actualAmount ?? r.estimatedAmount), 0);

  const categoryMap = new Map<string, { planned: number; spent: number }>();

  for (const item of lineItems) {
    const entry = categoryMap.get(item.category) ?? { planned: 0, spent: 0 };
    entry.planned += item.plannedAmount;
    categoryMap.set(item.category, entry);
  }

  for (const req of requests) {
    if (req.status === "purchased" || req.status === "delivered") {
      const entry = categoryMap.get(req.category) ?? { planned: 0, spent: 0 };
      entry.spent += req.actualAmount ?? req.estimatedAmount;
      categoryMap.set(req.category, entry);
    }
  }

  const byCategory = Array.from(categoryMap.entries()).map(
    ([category, vals]) => ({ category, ...vals }),
  );

  return { totalPlanned, totalCommitted, totalSpent, currency: "UAH", byCategory };
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function ensureBudgetIndexes(
  db: Awaited<ReturnType<typeof getMongoDb>>,
) {
  await Promise.all([
    db
      .collection("budget_periods")
      .createIndexes([{ key: { projectId: 1 } }, { key: { startDate: 1 } }]),
    db
      .collection("budget_line_items")
      .createIndexes([
        { key: { projectId: 1 } },
        { key: { periodId: 1 } },
        { key: { category: 1 } },
      ]),
    db
      .collection("purchase_requests")
      .createIndexes([
        { key: { projectId: 1 } },
        { key: { requesterId: 1 } },
        { key: { status: 1 } },
      ]),
  ]);
}
