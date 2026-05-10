import { randomBytes } from "crypto";
import { getMongoDb, hasMongoConfig } from "@/lib/mongodb";

const COLLECTION = "password_reset_tokens";
const TTL_MS = 60 * 60 * 1000; // 1 hour

type TokenDoc = {
  email: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

// In-memory fallback for local dev without MongoDB
const localTokens: TokenDoc[] = [];

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);

  const doc: TokenDoc = { email, token, expiresAt, usedAt: null, createdAt: now };

  if (!hasMongoConfig()) {
    localTokens.push(doc);
  } else {
    const db = await getMongoDb();
    await db.collection(COLLECTION).createIndexes([
      { key: { token: 1 }, unique: true },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ]);
    // Invalidate previous tokens for this email
    await db.collection(COLLECTION).updateMany(
      { email, usedAt: null },
      { $set: { usedAt: now } },
    );
    await db.collection(COLLECTION).insertOne(doc);
  }

  // ── DEV MODE: print reset link to terminal ────────────────────────────────
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${base}/uk/reset-password?token=${token}`;

  console.log("\n" + "═".repeat(62));
  console.log("  🔑  PASSWORD RESET TOKEN  [DEV MODE — no email sent]");
  console.log("═".repeat(62));
  console.log(`  Email  : ${email}`);
  console.log(`  Token  : ${token}`);
  console.log(`  Link   : ${link}`);
  console.log(`  Expires: ${expiresAt.toISOString()}  (1 hour)`);
  console.log("═".repeat(62) + "\n");
  // ─────────────────────────────────────────────────────────────────────────

  return token;
}

export async function findValidToken(token: string): Promise<TokenDoc | null> {
  const now = new Date();

  if (!hasMongoConfig()) {
    return (
      localTokens.find(
        (t) => t.token === token && t.expiresAt > now && t.usedAt === null,
      ) ?? null
    );
  }

  const db = await getMongoDb();
  const doc = await db.collection<TokenDoc>(COLLECTION).findOne({
    token,
    expiresAt: { $gt: now },
    usedAt: null,
  });

  return doc ?? null;
}

export async function consumeToken(token: string): Promise<string | null> {
  const doc = await findValidToken(token);
  if (!doc) return null;

  const now = new Date();

  if (!hasMongoConfig()) {
    const local = localTokens.find((t) => t.token === token);
    if (local) local.usedAt = now;
  } else {
    const db = await getMongoDb();
    await db.collection(COLLECTION).updateOne({ token }, { $set: { usedAt: now } });
  }

  return doc.email;
}
