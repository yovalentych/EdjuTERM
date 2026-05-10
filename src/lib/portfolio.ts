import { ObjectId } from "mongodb";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";
import {
  portfolioSchema,
  portfolioPublicationSchema,
  portfolioConferenceSchema,
  portfolioAwardSchema,
  type Portfolio,
  type PortfolioMeta,
  type PortfolioPublication,
  type PortfolioConference,
  type PortfolioAward,
  type SafeUser,
} from "@/lib/schemas";

// ── In-memory fallback ────────────────────────────────────────────────────────

const localPortfolios: Portfolio[] = [];

function blank(projectId: string, userId: string): Portfolio {
  return portfolioSchema.parse({ projectId, createdBy: userId });
}

async function ensureIndex() {
  if (!hasMongoConfig()) return;
  const db = await getMongoDb();
  await db.collection("portfolios").createIndex({ projectId: 1 }, { unique: true });
}

function parseDoc(doc: Record<string, unknown>): Portfolio {
  const { _id, ...rest } = doc;
  return portfolioSchema.parse({ ...rest, _id: _id?.toString() });
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getPortfolio(projectId: string): Promise<Portfolio | null> {
  if (!hasMongoConfig()) {
    return localPortfolios.find((p) => p.projectId === projectId) ?? null;
  }
  const db = await getMongoDb();
  const doc = await db.collection("portfolios").findOne({ projectId });
  if (!doc) return null;
  return parseDoc(doc as Record<string, unknown>);
}

// ── Meta ──────────────────────────────────────────────────────────────────────

export async function savePortfolioMeta(
  projectId: string,
  meta: Omit<PortfolioMeta, "projectId">,
  user: SafeUser,
): Promise<Portfolio> {
  const now = new Date();
  if (!hasMongoConfig()) {
    let p = localPortfolios.find((x) => x.projectId === projectId);
    if (!p) { p = blank(projectId, user._id ?? ""); localPortfolios.push(p); }
    Object.assign(p, { ...meta, updatedAt: now });
    return p;
  }
  await ensureIndex();
  const db = await getMongoDb();
  await db.collection("portfolios").updateOne(
    { projectId },
    {
      $set: { ...meta, updatedAt: now },
      $setOnInsert: {
        projectId,
        createdBy: user._id ?? "",
        createdAt: now,
        publications: [],
        conferences: [],
        awards: [],
      },
    },
    { upsert: true },
  );
  return (await getPortfolio(projectId))!;
}

// ── Publications ──────────────────────────────────────────────────────────────

export async function upsertPublication(
  projectId: string,
  pub: PortfolioPublication,
  user: SafeUser,
): Promise<void> {
  const v = portfolioPublicationSchema.parse(pub);
  const now = new Date();
  if (!hasMongoConfig()) {
    let p = localPortfolios.find((x) => x.projectId === projectId);
    if (!p) { p = blank(projectId, user._id ?? ""); localPortfolios.push(p); }
    const idx = p.publications.findIndex((x) => x.pubid === v.pubid);
    if (idx >= 0) p.publications[idx] = v; else p.publications.push(v);
    p.updatedAt = now;
    return;
  }
  await ensureIndex();
  const db = await getMongoDb();
  const exists = await db.collection("portfolios").findOne({ projectId, "publications.pubid": v.pubid });
  if (exists) {
    await db.collection("portfolios").updateOne(
      { projectId, "publications.pubid": v.pubid },
      { $set: { "publications.$": v, updatedAt: now } },
    );
  } else {
    await db.collection("portfolios").updateOne(
      { projectId },
      { $push: { publications: v } as any, $set: { updatedAt: now }, $setOnInsert: { projectId, createdBy: user._id ?? "", createdAt: now, conferences: [], awards: [] } },
      { upsert: true },
    );
  }
}

export async function deletePublication(projectId: string, pubid: string): Promise<void> {
  if (!hasMongoConfig()) {
    const p = localPortfolios.find((x) => x.projectId === projectId);
    if (p) p.publications = p.publications.filter((x) => x.pubid !== pubid);
    return;
  }
  const db = await getMongoDb();
  await db.collection("portfolios").updateOne(
    { projectId },
    { $pull: { publications: { pubid } } as any },
  );
}

// ── Conferences ───────────────────────────────────────────────────────────────

export async function upsertConference(
  projectId: string,
  conf: PortfolioConference,
  user: SafeUser,
): Promise<void> {
  const v = portfolioConferenceSchema.parse(conf);
  const now = new Date();
  if (!hasMongoConfig()) {
    let p = localPortfolios.find((x) => x.projectId === projectId);
    if (!p) { p = blank(projectId, user._id ?? ""); localPortfolios.push(p); }
    const idx = p.conferences.findIndex((x) => x.confid === v.confid);
    if (idx >= 0) p.conferences[idx] = v; else p.conferences.push(v);
    p.updatedAt = now;
    return;
  }
  await ensureIndex();
  const db = await getMongoDb();
  const exists = await db.collection("portfolios").findOne({ projectId, "conferences.confid": v.confid });
  if (exists) {
    await db.collection("portfolios").updateOne(
      { projectId, "conferences.confid": v.confid },
      { $set: { "conferences.$": v, updatedAt: now } },
    );
  } else {
    await db.collection("portfolios").updateOne(
      { projectId },
      { $push: { conferences: v } as any, $set: { updatedAt: now }, $setOnInsert: { projectId, createdBy: user._id ?? "", createdAt: now, publications: [], awards: [] } },
      { upsert: true },
    );
  }
}

export async function deleteConference(projectId: string, confid: string): Promise<void> {
  if (!hasMongoConfig()) {
    const p = localPortfolios.find((x) => x.projectId === projectId);
    if (p) p.conferences = p.conferences.filter((x) => x.confid !== confid);
    return;
  }
  const db = await getMongoDb();
  await db.collection("portfolios").updateOne(
    { projectId },
    { $pull: { conferences: { confid } } as any },
  );
}

// ── Awards ────────────────────────────────────────────────────────────────────

export async function upsertAward(
  projectId: string,
  award: PortfolioAward,
  user: SafeUser,
): Promise<void> {
  const v = portfolioAwardSchema.parse(award);
  const now = new Date();
  if (!hasMongoConfig()) {
    let p = localPortfolios.find((x) => x.projectId === projectId);
    if (!p) { p = blank(projectId, user._id ?? ""); localPortfolios.push(p); }
    const idx = p.awards.findIndex((x) => x.awid === v.awid);
    if (idx >= 0) p.awards[idx] = v; else p.awards.push(v);
    p.updatedAt = now;
    return;
  }
  await ensureIndex();
  const db = await getMongoDb();
  const exists = await db.collection("portfolios").findOne({ projectId, "awards.awid": v.awid });
  if (exists) {
    await db.collection("portfolios").updateOne(
      { projectId, "awards.awid": v.awid },
      { $set: { "awards.$": v, updatedAt: now } },
    );
  } else {
    await db.collection("portfolios").updateOne(
      { projectId },
      { $push: { awards: v } as any, $set: { updatedAt: now }, $setOnInsert: { projectId, createdBy: user._id ?? "", createdAt: now, publications: [], conferences: [] } },
      { upsert: true },
    );
  }
}

export async function deleteAward(projectId: string, awid: string): Promise<void> {
  if (!hasMongoConfig()) {
    const p = localPortfolios.find((x) => x.projectId === projectId);
    if (p) p.awards = p.awards.filter((x) => x.awid !== awid);
    return;
  }
  const db = await getMongoDb();
  await db.collection("portfolios").updateOne(
    { projectId },
    { $pull: { awards: { awid } } as any },
  );
}
