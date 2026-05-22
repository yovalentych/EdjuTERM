import { NextResponse } from "next/server";
import { verifyVerificationToken } from "@/lib/verification-token";
import { markEmailVerified } from "@/lib/users";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale } from "@/lib/i18n";
import { sendVerificationEmailForUser } from "@/lib/auth-email";

/**
 * GET /api/auth/verify-email?token=<token>&locale=uk
 *   → 302 redirect на /<locale>/login?notice=verified (success)
 *     або /<locale>/login?error=verify_failed
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const localeParam = url.searchParams.get("locale") ?? "uk";
  const locale = isLocale(localeParam) ? localeParam : "uk";
  const base = url.origin;

  const decoded = verifyVerificationToken(token, "email");
  if (!decoded) {
    return NextResponse.redirect(`${base}/${locale}/login?error=verify_failed`, 302);
  }
  const ok = await markEmailVerified(decoded.userId).catch(() => false);
  if (!ok) {
    return NextResponse.redirect(`${base}/${locale}/login?error=verify_failed`, 302);
  }
  return NextResponse.redirect(`${base}/${locale}/app?notice=verified`, 302);
}

/**
 * POST /api/auth/verify-email
 *   → Re-send verification email до поточного користувача.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user._id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ already: true });
  }

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "uk";

  try {
    await sendVerificationEmailForUser(user, { locale, request: req });
  } catch (e) {
    console.error("[verify-email] sendEmail failed", e);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
