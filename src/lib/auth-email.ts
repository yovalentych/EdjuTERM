import "server-only";

import { headers } from "next/headers";
import { buildVerificationEmail, sendEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/verification-token";
import { type Locale, isLocale } from "@/lib/i18n";

type VerificationUser = {
  _id?: string;
  email: string;
  firstName?: string;
};

export async function getRequestBaseUrl(request?: Request): Promise<string> {
  if (request) {
    const url = new URL(request.url);
    return url.origin;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

export async function sendVerificationEmailForUser(
  user: VerificationUser,
  options: { locale?: string; request?: Request } = {},
) {
  if (!user._id) {
    throw new Error("USER_ID_REQUIRED");
  }

  const locale: Locale = options.locale && isLocale(options.locale) ? options.locale : "uk";
  const baseUrl = await getRequestBaseUrl(options.request);
  const token = createVerificationToken(user._id, "email");
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}&locale=${locale}`;
  const tpl = buildVerificationEmail({
    url: verifyUrl,
    userFirstName: user.firstName,
    locale,
  });

  await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
}
