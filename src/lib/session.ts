import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const cookieName = "grant_session";
const SESSION_SHORT_S = 60 * 60 * 24;       // 1 day  (no remember-me)
const SESSION_LONG_S  = 60 * 60 * 24 * 30;  // 30 days (remember-me)
const sameSite = process.env.AUTH_COOKIE_SAMESITE === "strict" ? "strict" : "lax";

type SessionPayload = {
  userId: string;
  role: string;
  sessionVersion: number;
  exp: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV !== "development") {
    throw new Error("AUTH_SECRET is required outside development.");
  }

  if (secret && secret.length < 32 && process.env.NODE_ENV !== "development") {
    throw new Error("AUTH_SECRET must be at least 32 characters outside development.");
  }

  return secret ?? "dev-only-change-this-secret";
}

const sessionSecret = getSecret();

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

export async function createSession(
  userId: string,
  role: string,
  remember = false,
  sessionVersion = 1,
) {
  const maxAge = remember ? SESSION_LONG_S : SESSION_SHORT_S;
  const payload: SessionPayload = {
    userId,
    role,
    sessionVersion,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  };
  const body = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(body);
  const cookieStore = await cookies();

  cookieStore.set(cookieName, `${body}.${signature}`, {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function readSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signPayload(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(body)) as SessionPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
