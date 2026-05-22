import { ObjectId } from "mongodb";
import { z } from "zod";
import { getMongoDb, hasMongoConfig } from "./mongodb";
import type { SafeUser } from "./schemas";

// ─── Schemas ───────────────────────────────────────────────────────────────

// Розширені шаблони простору — кожен має свою специфіку
// (журнал/гранти/дедлайни/будж.). Конфігурація в `workspace-template-config.ts`.
export const workspaceTemplates = [
  // Академічні ступені — мають журнал, розклад, оцінки, кваліфікаційну роботу
  "bachelor",
  "master",
  "phd",
  // Дослідницькі контексти
  "grant",
  "research",
  // Загальні
  "work",
  "personal",
  "empty",
  // Backward-compat: старі простори зі значенням "education" (мігруємо на phd за замовч.)
  "education",
] as const;

// `.nullish()` приймає string | null | undefined — Mongo часто зберігає
// явний null для опціональних рядків. Це нормалізується до undefined у Workspace.
const nullishString = (max: number) =>
  z.string().max(max).nullish().transform((v) => v ?? undefined);

export const workspaceInputSchema = z.object({
  name: z.string().min(1).max(80),
  emoji: nullishString(8),
  color: nullishString(16),
  template: z.enum(workspaceTemplates).nullish().transform((v) => v ?? undefined),
  description: nullishString(500),
  // Template-specific метаполя: для bachelor — university/faculty/year;
  // для grant — funder/amount/dates; тощо. Конкретний shape визначається
  // у `workspace-template-config.ts`, тут — довільний JSON.
  fields: z.record(z.string(), z.any()).nullish().transform((v) => v ?? {}),
});

export const workspaceSchema = workspaceInputSchema.extend({
  _id: z.string().optional(),
  ownerId: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: nullishString(40),
});

export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceInput = z.infer<typeof workspaceInputSchema>;

export const itemTypes = [
  "bachelor", "master", "phd", "individual_research",
  "laboratory", "course", "grant",
  "collaboration", "study_group", "seminar", "open_science", "idea",
] as const;

export const itemVisibilities = ["private", "institutional", "public"] as const;
export const itemStatuses = ["draft", "active", "paused", "completed", "archived"] as const;

export const itemInputSchema = z.object({
  type: z.enum(itemTypes),
  title: z.string().min(1).max(200),
  description: nullishString(2000),
  emoji: nullishString(8),
  status: z.enum(itemStatuses).default("active"),
  visibility: z.enum(itemVisibilities).default("private"),
  workspaceIds: z.array(z.string()).min(1),
  parentItemId: nullishString(40),
  // Зв'язок проєкту з навчальним записом (bachelor/master/phd item)
  learningItemId: nullishString(40),
  supervisor: nullishString(200),
  startDate: nullishString(40),
  plannedEndDate: nullishString(40),
  tags: z.array(z.string()).default([]),
  fields: z.record(z.string(), z.any()).default({}),
});

export const itemMemberSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  role: z.string().default("member"),
  joinedAt: z.string(),
});
export type ItemMember = z.infer<typeof itemMemberSchema>;

export const itemSchema = itemInputSchema.extend({
  _id: z.string().optional(),
  ownerId: z.string(),
  ownerName: z.string(),
  legacyProjectId: nullishString(40),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: nullishString(40),
  members: z.array(itemMemberSchema).default([]),
});

export type WorkspaceItem = z.infer<typeof itemSchema>;
export type WorkspaceItemInput = z.infer<typeof itemInputSchema>;

// ─── Local fallback (no Mongo) ─────────────────────────────────────────────
// Простий in-memory fallback щоб працювало навіть без БД.
const localWorkspaces: Workspace[] = [];
const localItems: WorkspaceItem[] = [];

const WS_COLLECTION = "workspaces";
const ITEMS_COLLECTION = "workspace_items";

// ─── Workspaces ────────────────────────────────────────────────────────────

export async function listWorkspacesForUser(user: SafeUser): Promise<Workspace[]> {
  if (!user._id) return [];

  if (!hasMongoConfig()) {
    // Жодного auto-bootstrap default — порожньо, поки користувач сам не створить.
    const mine = localWorkspaces.filter((w) => w.ownerId === user._id && !w.deletedAt);
    return dedupWorkspaces(mine);
  }

  const db = await getMongoDb();
  const docs = await db.collection(WS_COLLECTION)
    .find({ ownerId: user._id, deletedAt: null })
    .sort({ isDefault: -1, createdAt: 1 })
    .toArray();

  if (docs.length === 0) {
    return [];
  }

  const parsed = docs.map((d) => workspaceSchema.parse({ ...d, _id: d._id.toString() }));
  const cleaned = dedupWorkspaces(parsed);

  // Soft-delete дублі у БД — щоб наступні запити були чистими.
  const keptIds = new Set(cleaned.map((w) => w._id));
  const toDelete = parsed.filter((w) => !keptIds.has(w._id));
  if (toDelete.length > 0) {
    const now = new Date().toISOString();
    const deletedIds = toDelete.map((w) => w._id!).filter(Boolean);

    // Перенести items: workspaceIds[видалений] → keeper-default. Уникаємо orphans.
    const keeperDefault = cleaned.find((w) => w.isDefault) || cleaned[0];
    if (keeperDefault?._id) {
      const items = await db.collection(ITEMS_COLLECTION)
        .find({ ownerId: user._id, workspaceIds: { $in: deletedIds } })
        .toArray();
      for (const it of items) {
        const next = (it.workspaceIds as string[] || [])
          .filter((wid: string) => !deletedIds.includes(wid));
        if (!next.includes(keeperDefault._id!)) next.push(keeperDefault._id!);
        await db.collection(ITEMS_COLLECTION).updateOne(
          { _id: it._id },
          { $set: { workspaceIds: next, updatedAt: now } },
        );
      }
    }

    // Soft-delete самих workspaces.
    await db.collection(WS_COLLECTION).updateMany(
      { _id: { $in: toDelete.map((w) => new ObjectId(w._id!)) } },
      { $set: { deletedAt: now } },
    );
  }

  return cleaned;
}

/**
 * Дедуплікація workspaces:
 *  • Лишаємо лише ОДИН isDefault (найстаріший).
 *  • Видаляємо повторні workspaces за (name + template) — лишаємо найстаріший.
 * Не зачіпає workspaces з унікальними іменами/шаблонами.
 */
function dedupWorkspaces(list: Workspace[]): Workspace[] {
  if (list.length < 2) return list;

  const sorted = list.slice().sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  // Step 1: rule "лиш один default" — keeper = найстаріший default.
  const defaults = sorted.filter((w) => w.isDefault);
  const keeperDefaultId = defaults[0]?._id;
  const normalized = sorted.map((w) =>
    w.isDefault && w._id !== keeperDefaultId
      ? { ...w, isDefault: false }
      : w,
  );

  // Step 2: dedup за (name|template) — лишаємо найстаріший у групі.
  const seen = new Set<string>();
  const kept: Workspace[] = [];
  for (const w of normalized) {
    const key = `${w.name}|${w.template ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(w);
  }
  return kept;
}

export async function ensureDefaultWorkspace(user: SafeUser): Promise<Workspace> {
  if (!user._id) throw new Error("No user");
  const now = new Date().toISOString();
  const ws: Workspace = {
    _id: hasMongoConfig() ? new ObjectId().toString() : `ws_${Date.now()}`,
    name: "Мій простір",
    emoji: "🏠",
    color: "#0f766e",
    description: undefined,
    fields: {},
    ownerId: user._id,
    isDefault: true,
    template: "personal",
    deletedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    localWorkspaces.push(ws);
    return ws;
  }

  const db = await getMongoDb();
  const id = new ObjectId(ws._id);
  await db.collection(WS_COLLECTION).insertOne({ ...ws, _id: id });
  return ws;
}

export async function createWorkspaceForUser(input: WorkspaceInput, user: SafeUser): Promise<Workspace> {
  if (!user._id) throw new Error("No user");
  const parsed = workspaceInputSchema.parse(input);
  const now = new Date().toISOString();
  const ws: Workspace = {
    _id: hasMongoConfig() ? new ObjectId().toString() : `ws_${Date.now()}`,
    name: parsed.name,
    emoji: parsed.emoji ?? "📋",
    color: parsed.color ?? "#0f766e",
    template: parsed.template,
    description: parsed.description,
    fields: parsed.fields ?? {},
    ownerId: user._id,
    isDefault: false,
    deletedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasMongoConfig()) {
    localWorkspaces.push(ws);
    return ws;
  }

  const db = await getMongoDb();
  const id = new ObjectId(ws._id);
  await db.collection(WS_COLLECTION).insertOne({ ...ws, _id: id });
  return ws;
}

export async function updateWorkspaceForUser(id: string, patch: Partial<WorkspaceInput>, user: SafeUser): Promise<Workspace | null> {
  if (!user._id) return null;
  const now = new Date().toISOString();

  if (!hasMongoConfig()) {
    const idx = localWorkspaces.findIndex((w) => w._id === id && w.ownerId === user._id);
    if (idx < 0) return null;
    localWorkspaces[idx] = { ...localWorkspaces[idx], ...patch, updatedAt: now };
    return localWorkspaces[idx];
  }

  const db = await getMongoDb();
  const _id = new ObjectId(id);
  const result = await db.collection(WS_COLLECTION).findOneAndUpdate(
    { _id, ownerId: user._id, deletedAt: null },
    { $set: { ...patch, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return workspaceSchema.parse({ ...result, _id: result._id.toString() });
}

export async function deleteWorkspaceForUser(id: string, user: SafeUser): Promise<boolean> {
  if (!user._id) return false;
  const now = new Date().toISOString();

  if (!hasMongoConfig()) {
    const ws = localWorkspaces.find((w) => w._id === id && w.ownerId === user._id);
    if (!ws || ws.isDefault) return false;
    ws.deletedAt = now;
    // переносим items у default
    const defaultWs = localWorkspaces.find((w) => w.isDefault && w.ownerId === user._id);
    if (defaultWs) {
      for (const item of localItems) {
        if (item.workspaceIds.includes(id)) {
          item.workspaceIds = item.workspaceIds.filter((w) => w !== id);
          if (item.workspaceIds.length === 0) item.workspaceIds.push(defaultWs._id!);
        }
      }
    }
    return true;
  }

  const db = await getMongoDb();
  const _id = new ObjectId(id);
  const ws = await db.collection(WS_COLLECTION).findOne({ _id, ownerId: user._id });
  if (!ws || ws.isDefault) return false;
  await db.collection(WS_COLLECTION).updateOne({ _id }, { $set: { deletedAt: now, updatedAt: now } });
  // items без workspace → default
  const defaultWs = await db.collection(WS_COLLECTION).findOne({ ownerId: user._id, isDefault: true, deletedAt: null });
  if (defaultWs) {
    await db.collection(ITEMS_COLLECTION).updateMany(
      { ownerId: user._id, workspaceIds: id },
      { $pull: { workspaceIds: id } } as any,
    );
    await db.collection(ITEMS_COLLECTION).updateMany(
      { ownerId: user._id, workspaceIds: { $size: 0 } },
      { $set: { workspaceIds: [defaultWs._id.toString()] } },
    );
  }
  return true;
}

// ─── Items ────────────────────────────────────────────────────────────────

export async function listItemsForUser(user: SafeUser, workspaceId?: string): Promise<WorkspaceItem[]> {
  if (!user._id) return [];

  if (!hasMongoConfig()) {
    let mine = localItems.filter((it) => it.ownerId === user._id && !it.deletedAt);
    if (workspaceId) mine = mine.filter((it) => it.workspaceIds.includes(workspaceId));
    return mine;
  }

  const db = await getMongoDb();
  const filter: Record<string, unknown> = {
    ownerId: user._id,
    deletedAt: null,
  };
  if (workspaceId) filter.workspaceIds = workspaceId;
  const docs = await db.collection(ITEMS_COLLECTION)
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => itemSchema.parse({ ...d, _id: d._id.toString() }));
}

export async function getItemForUser(id: string, user: SafeUser): Promise<WorkspaceItem | null> {
  if (!user._id || !id) return null;

  if (!hasMongoConfig()) {
    return localItems.find((it) => it._id === id && it.ownerId === user._id && !it.deletedAt) ?? null;
  }

  const db = await getMongoDb();
  const _id = new ObjectId(id);
  const doc = await db.collection(ITEMS_COLLECTION).findOne({ _id, ownerId: user._id, deletedAt: null });
  if (!doc) return null;
  return itemSchema.parse({ ...doc, _id: doc._id.toString() });
}

export async function createItemForUser(input: WorkspaceItemInput, user: SafeUser): Promise<WorkspaceItem> {
  if (!user._id) throw new Error("No user");
  const parsed = itemInputSchema.parse(input);
  const now = new Date().toISOString();
  const item: WorkspaceItem = {
    _id: hasMongoConfig() ? new ObjectId().toString() : `it_${Date.now()}`,
    ...parsed,
    ownerId: user._id,
    ownerName: `${user.firstName} ${user.lastName}`,
    legacyProjectId: undefined,
    deletedAt: undefined,
    createdAt: now,
    updatedAt: now,
    members: [],
  };

  if (!hasMongoConfig()) {
    localItems.push(item);
    return item;
  }

  const db = await getMongoDb();
  const id = new ObjectId(item._id);
  await db.collection(ITEMS_COLLECTION).insertOne({ ...item, _id: id });
  return item;
}

export async function updateItemForUser(id: string, patch: Partial<WorkspaceItemInput>, user: SafeUser): Promise<WorkspaceItem | null> {
  if (!user._id) return null;
  const now = new Date().toISOString();

  if (!hasMongoConfig()) {
    const idx = localItems.findIndex((it) => it._id === id && it.ownerId === user._id);
    if (idx < 0) return null;
    localItems[idx] = { ...localItems[idx], ...patch, updatedAt: now };
    return localItems[idx];
  }

  const db = await getMongoDb();
  const _id = new ObjectId(id);
  const result = await db.collection(ITEMS_COLLECTION).findOneAndUpdate(
    { _id, ownerId: user._id, deletedAt: null },
    { $set: { ...patch, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return itemSchema.parse({ ...result, _id: result._id.toString() });
}

// ─── Orphan repair ────────────────────────────────────────────────────────
// Items created before workspace bootstrap had workspaceIds: [""].
// This fixes them to point to the default workspace — idempotent.
export async function repairOrphanedItems(user: SafeUser, defaultWorkspaceId: string): Promise<void> {
  if (!user._id || !defaultWorkspaceId) return;

  if (!hasMongoConfig()) {
    const now = new Date().toISOString();
    for (const it of localItems) {
      if (it.ownerId === user._id && it.workspaceIds.every((id) => !id)) {
        it.workspaceIds = [defaultWorkspaceId];
        it.updatedAt = now;
      }
    }
    return;
  }

  const db = await getMongoDb();
  const now = new Date().toISOString();
  // Find items owned by user that have empty/falsy workspace IDs
  await db.collection(ITEMS_COLLECTION).updateMany(
    {
      ownerId: user._id,
      deletedAt: null,
      workspaceIds: { $elemMatch: { $in: ["", null] } },
    },
    { $set: { workspaceIds: [defaultWorkspaceId], updatedAt: now } },
  );
}

// ─── Legacy migration ──────────────────────────────────────────────────────
// На льоту створює items для legacy projects, які ще не мають linked item.
// Викликається при відкритті Space — ідемпотентна.
export async function syncLegacyProjectsToItems(
  projects: { _id?: string; title: string; acronym?: string; projectType?: string }[],
  defaultWorkspaceId: string,
  user: SafeUser,
): Promise<number> {
  if (!user._id || !defaultWorkspaceId || projects.length === 0) return 0;

  const PROJECT_TYPE_TO_ITEM_TYPE: Record<string, typeof itemTypes[number]> = {
    laboratory: "laboratory",
    grant: "grant",
    training: "course",
    dissertation: "phd",
    fundamental: "individual_research",
    applied: "individual_research",
    experimental: "individual_research",
    internship: "individual_research",
    infrastructure: "laboratory",
  };

  const TYPE_EMOJI: Record<string, string> = {
    laboratory: "🧪", grant: "💰", course: "📚", phd: "🎓",
    individual_research: "🔬",
  };

  if (!hasMongoConfig()) {
    // local fallback
    const existing = new Set(localItems.filter((it) => it.legacyProjectId).map((it) => it.legacyProjectId));
    let created = 0;
    for (const p of projects) {
      const pid = String(p._id ?? "");
      if (!pid || existing.has(pid)) continue;
      const itemType = PROJECT_TYPE_TO_ITEM_TYPE[p.projectType ?? "fundamental"] ?? "individual_research";
      const now = new Date().toISOString();
      localItems.push({
        _id: `it_legacy_${pid}`,
        type: itemType,
        title: p.title,
        description: undefined,
        emoji: TYPE_EMOJI[itemType] ?? "📋",
        status: "active",
        visibility: itemType === "laboratory" ? "institutional" : "private",
        workspaceIds: [defaultWorkspaceId],
        parentItemId: undefined,
        learningItemId: undefined,
        supervisor: undefined,
        startDate: undefined,
        plannedEndDate: undefined,
        tags: p.acronym ? [p.acronym] : [],
        fields: {},
        members: [],
        ownerId: user._id,
        ownerName: `${user.firstName} ${user.lastName}`,
        legacyProjectId: pid,
        deletedAt: undefined,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }
    return created;
  }

  const db = await getMongoDb();
  const existingDocs = await db.collection(ITEMS_COLLECTION)
    .find({ ownerId: user._id, legacyProjectId: { $exists: true } })
    .project({ legacyProjectId: 1 })
    .toArray();
  const existing = new Set(existingDocs.map((d) => d.legacyProjectId));

  const now = new Date().toISOString();
  const toInsert = projects
    .filter((p) => p._id && !existing.has(String(p._id)))
    .map((p) => {
      const itemType = PROJECT_TYPE_TO_ITEM_TYPE[p.projectType ?? "fundamental"] ?? "individual_research";
      return {
        _id: new ObjectId(),
        type: itemType,
        title: p.title,
        emoji: TYPE_EMOJI[itemType] ?? "📋",
        status: "active" as const,
        visibility: itemType === "laboratory" ? "institutional" as const : "private" as const,
        workspaceIds: [defaultWorkspaceId],
        tags: p.acronym ? [p.acronym] : [],
        fields: {},
        ownerId: user._id,
        ownerName: `${user.firstName} ${user.lastName}`,
        legacyProjectId: String(p._id),
        createdAt: now,
        updatedAt: now,
      };
    });

  if (toInsert.length === 0) return 0;
  await db.collection(ITEMS_COLLECTION).insertMany(toInsert as any);
  return toInsert.length;
}

export async function deleteItemForUser(id: string, user: SafeUser): Promise<boolean> {
  if (!user._id) return false;
  const now = new Date().toISOString();

  if (!hasMongoConfig()) {
    const it = localItems.find((it) => it._id === id && it.ownerId === user._id);
    if (!it) return false;
    it.deletedAt = now;
    return true;
  }

  const db = await getMongoDb();
  const _id = new ObjectId(id);
  const result = await db.collection(ITEMS_COLLECTION).updateOne(
    { _id, ownerId: user._id },
    { $set: { deletedAt: now, updatedAt: now } },
  );
  return result.modifiedCount > 0;
}
