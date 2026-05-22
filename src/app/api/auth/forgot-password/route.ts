import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isLocale } from "@/lib/i18n";
import { findUserByEmail } from "@/lib/users";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";

/**
 * POST /api/auth/forgot-password
 *   body: { email: string, locale?: "uk"|"en" }
 *
 * Завжди повертає { ok: true } незалежно від того, чи знайдено user,
 * щоб уникнути enumeration. У dev-режимі лист логується в консоль.
 */
export async function POST(req: Request) {
  let body: { email?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const locale = isLocale(body.locale ?? "uk") ? (body.locale as "uk" | "en") : "uk";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const user = await findUserByEmail(email);
    if (user && user._id) {
      const h = await headers();
      const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
      const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
      const baseUrl = `${proto}://${host}`;

      const token = await createPasswordResetToken(email);
      const url = `${baseUrl}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
      const tpl = buildPasswordResetEmail({ url, userFirstName: user.firstName, locale });
      await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text }).catch(() => undefined);
    }
  } catch (e) {
    console.error("[forgot-password api] failed", e);
  }

  // No user enumeration: завжди 200.
  return NextResponse.json({ ok: true });
}
