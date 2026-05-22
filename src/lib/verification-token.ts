import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET ?? "dev-only-change-this-secret";

export type VerificationPurpose = "email" | "password_reset";

type Payload = {
  userId: string;
  purpose: VerificationPurpose;
  exp: number; // unix seconds
};

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}
function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

/**
 * Створює одноразовий verification token (JWT-стиль HMAC).
 * Стандартний TTL — 24 години для email, 1 година для password reset.
 */
export function createVerificationToken(
  userId: string,
  purpose: VerificationPurpose,
  ttlSeconds?: number,
): string {
  const ttl = ttlSeconds ?? (purpose === "password_reset" ? 60 * 60 : 60 * 60 * 24);
  const payload: Payload = {
    userId,
    purpose,
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const body = toBase64Url(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifyVerificationToken(
  token: string,
  expectedPurpose: VerificationPurpose,
): { userId: string } | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(body)) as Payload;
    if (payload.purpose !== expectedPurpose) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.userId) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
