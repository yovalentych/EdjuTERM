import "server-only";

import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import { OPENAI_SYLLABUS_MODELS, type AiSystemSettings, type OpenAiSyllabusModel } from "@/lib/ai-models";

const SETTINGS_COLLECTION = "systemSettings";
const SETTINGS_KEY = "ai";
const DEFAULT_MODEL: OpenAiSyllabusModel = "gpt-5.4-mini";
let localSettings: AiSystemSettings = { openAiSyllabusModel: DEFAULT_MODEL };

export function normalizeOpenAiSyllabusModel(value: unknown): OpenAiSyllabusModel {
  const raw = typeof value === "string" ? value : process.env.OPENAI_SYLLABUS_MODEL;
  return OPENAI_SYLLABUS_MODELS.some((model) => model.id === raw)
    ? raw as OpenAiSyllabusModel
    : DEFAULT_MODEL;
}

export async function getAiSystemSettings(): Promise<AiSystemSettings> {
  if (!hasMongoConfig()) return localSettings;

  const db = await getMongoDb();
  const doc = await db.collection<Record<string, unknown>>(SETTINGS_COLLECTION).findOne({ key: SETTINGS_KEY });
  return {
    openAiSyllabusModel: normalizeOpenAiSyllabusModel(doc?.openAiSyllabusModel),
  };
}

export async function updateAiSystemSettings(input: { openAiSyllabusModel?: unknown }): Promise<AiSystemSettings> {
  const next: AiSystemSettings = {
    openAiSyllabusModel: normalizeOpenAiSyllabusModel(input.openAiSyllabusModel),
  };

  if (!hasMongoConfig()) {
    localSettings = next;
    return next;
  }

  const db = await getMongoDb();
  await db.collection<Record<string, unknown>>(SETTINGS_COLLECTION).updateOne(
    { key: SETTINGS_KEY },
    { $set: { ...next, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  return next;
}
