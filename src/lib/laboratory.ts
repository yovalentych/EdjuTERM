import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  labInventoryItemSchema,
  labEquipmentSchema,
  equipmentLogSchema,
  type LabInventoryItem,
  type LabInventoryItemInput,
  type LabEquipment,
  type LabEquipmentInput,
  type EquipmentLog,
  type EquipmentLogInput,
} from "@/lib/schemas";
import { toObjectId } from "@/lib/object-id";

const INVENTORY_COLLECTION = "lab_inventory";
const EQUIPMENT_COLLECTION = "lab_equipment";
const EQUIPMENT_LOGS_COLLECTION = "lab_equipment_logs";
const EXPERIMENTS_COLLECTION = "lab_experiments";

// --- Inventory ───────────────────────────────────────────────────────────────

export async function listInventoryItems(projectIds: string | string[]): Promise<LabInventoryItem[]> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();
  
  const query = Array.isArray(projectIds) 
    ? { projectId: { $in: projectIds } }
    : { projectId: projectIds };

  const docs = await db.collection(INVENTORY_COLLECTION)
    .find(query)
    .sort({ name: 1 })
    .toArray();
  
  return docs.map(doc => labInventoryItemSchema.parse({ ...doc, _id: doc._id.toString() }));
}

export async function insertInventoryItem(input: LabInventoryItemInput, userId: string): Promise<LabInventoryItem> {
  const db = await getMongoDb();
  const now = new Date();
  const item = {
    ...input,
    status: "in_stock" as const,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(INVENTORY_COLLECTION).insertOne(item);
  return { ...item, _id: result.insertedId.toString() };
}

export async function updateInventoryItem(id: string, patch: Partial<LabInventoryItemInput> & { status?: any }): Promise<LabInventoryItem | null> {
  const db = await getMongoDb();
  const objectId = toObjectId(id);
  if (!objectId) return null;

  const result = await db.collection(INVENTORY_COLLECTION).findOneAndUpdate(
    { _id: objectId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result ? labInventoryItemSchema.parse({ ...result, _id: result._id.toString() }) : null;
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const objectId = toObjectId(id);
  if (!objectId) return false;
  const result = await db.collection(INVENTORY_COLLECTION).deleteOne({ _id: objectId });
  return result.deletedCount === 1;
}

// --- Equipment ───────────────────────────────────────────────────────────────

export async function listEquipment(projectIds: string | string[]): Promise<LabEquipment[]> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();

  const query = Array.isArray(projectIds) 
    ? { projectId: { $in: projectIds } }
    : { projectId: projectIds };

  const docs = await db.collection(EQUIPMENT_COLLECTION)
    .find(query)
    .sort({ name: 1 })
    .toArray();
  
  return docs.map(doc => labEquipmentSchema.parse({ ...doc, _id: doc._id.toString() }));
}

export async function insertEquipment(input: LabEquipmentInput, userId: string): Promise<LabEquipment> {
  const db = await getMongoDb();
  const now = new Date();
  const equipment = {
    ...input,
    status: "operational" as const,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await db.collection(EQUIPMENT_COLLECTION).insertOne(equipment);
  return { ...equipment, _id: result.insertedId.toString() };
}

export async function updateEquipment(id: string, patch: Partial<LabEquipmentInput> & { status?: any }): Promise<LabEquipment | null> {
  const db = await getMongoDb();
  const objectId = toObjectId(id);
  if (!objectId) return null;

  const result = await db.collection(EQUIPMENT_COLLECTION).findOneAndUpdate(
    { _id: objectId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  return result ? labEquipmentSchema.parse({ ...result, _id: result._id.toString() }) : null;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const objectId = toObjectId(id);
  if (!objectId) return false;
  const result = await db.collection(EQUIPMENT_COLLECTION).deleteOne({ _id: objectId });
  return result.deletedCount === 1;
}

// --- Equipment Logs ─────────────────────────────────────────────────────────

export async function listEquipmentLogs(equipmentId: string): Promise<EquipmentLog[]> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();
  const docs = await db.collection(EQUIPMENT_LOGS_COLLECTION)
    .find({ equipmentId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  
  return docs.map(doc => equipmentLogSchema.parse({ ...doc, _id: doc._id.toString() }));
}

export async function insertEquipmentLog(input: EquipmentLogInput, userId: string): Promise<EquipmentLog> {
  const db = await getMongoDb();
  const log = {
    ...input,
    userId,
    createdAt: new Date(),
  };
  
  const result = await db.collection(EQUIPMENT_LOGS_COLLECTION).insertOne(log);
  return { ...log, _id: result.insertedId.toString() };
}

// --- Experiments ─────────────────────────────────────────────────────────────

export type LabExperimentStep = {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
};

export type LabExperimentStatus = "planned" | "active" | "completed" | "failed" | "paused";

export type LabExperiment = {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  hypothesis: string;
  status: LabExperimentStatus;
  type: string;
  startDate: string;
  endDate: string;
  steps: LabExperimentStep[];
  linkedEquipmentIds: string[];
  linkedInventoryIds: string[];
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listExperiments(projectId: string): Promise<LabExperiment[]> {
  if (!hasMongoConfig()) return [];
  const db = await getMongoDb();
  const docs = await db.collection(EXPERIMENTS_COLLECTION)
    .find({ projectId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(doc => ({ ...doc, _id: doc._id.toString() } as LabExperiment));
}

export async function insertExperiment(input: Omit<LabExperiment, "_id" | "createdAt" | "updatedAt">, userId: string): Promise<LabExperiment> {
  const db = await getMongoDb();
  const now = new Date();
  const doc = { ...input, createdBy: userId, createdAt: now, updatedAt: now };
  const result = await db.collection(EXPERIMENTS_COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId.toString() };
}

export async function updateExperiment(id: string, patch: Partial<LabExperiment>): Promise<LabExperiment | null> {
  const db = await getMongoDb();
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const result = await db.collection(EXPERIMENTS_COLLECTION).findOneAndUpdate(
    { _id: objectId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? ({ ...result, _id: result._id.toString() } as LabExperiment) : null;
}

export async function deleteExperiment(id: string): Promise<boolean> {
  const db = await getMongoDb();
  const objectId = toObjectId(id);
  if (!objectId) return false;
  const result = await db.collection(EXPERIMENTS_COLLECTION).deleteOne({ _id: objectId });
  return result.deletedCount === 1;
}

// --- Initial Indexes ─────────────────────────────────────────────────────────

export async function ensureLabIndexes() {
  const db = await getMongoDb();
  await Promise.all([
    db.collection(INVENTORY_COLLECTION).createIndexes([
      { key: { projectId: 1 } },
      { key: { category: 1 } },
      { key: { status: 1 } },
      { key: { name: "text" } },
    ]),
    db.collection(EQUIPMENT_COLLECTION).createIndexes([
      { key: { projectId: 1 } },
      { key: { status: 1 } },
    ]),
    db.collection(EQUIPMENT_LOGS_COLLECTION).createIndexes([
      { key: { equipmentId: 1, createdAt: -1 } },
      { key: { projectId: 1 } },
    ]),
  ]);
}
