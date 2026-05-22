import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentInstitution } from "@/lib/institution-guard";
import { createMember } from "@/lib/institutions-db";
import { sendEmail, buildInviteEmail } from "@/lib/email";
import { institutionMemberRoles } from "@/lib/schemas";
import { z } from "zod";

const inviteInputSchema = z.object({
  fullName:  z.string().min(1).max(300),
  email:     z.string().email().max(240),
  role:      z.enum(institutionMemberRoles).default("lecturer"),
  unitId:    z.string().default(""),
  title:     z.string().max(200).default(""),
  locale:    z.enum(["uk", "en"]).default("uk"),
});

const ROLE_LABELS: Record<string, { uk: string; en: string }> = {
  rector:      { uk: "ректор",                  en: "rector" },
  vice_rector: { uk: "проректор",               en: "vice-rector" },
  dean:        { uk: "декан",                   en: "dean" },
  vice_dean:   { uk: "заступник декана",         en: "vice-dean" },
  head:        { uk: "завідувач кафедри",        en: "head of department" },
  professor:   { uk: "профессор",               en: "professor" },
  associate:   { uk: "доцент",                  en: "associate professor" },
  lecturer:    { uk: "викладач",                en: "lecturer" },
  assistant:   { uk: "асистент",               en: "assistant" },
  researcher:  { uk: "науковий співробітник",   en: "researcher" },
  staff:       { uk: "персонал",               en: "staff" },
  admin:       { uk: "адміністратор",           en: "admin" },
};

export async function POST(req: Request) {
  const auth = await getCurrentInstitution();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = inviteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { fullName, email, role, unitId, title, locale } = parsed.data;
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 днів
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const member = await createMember({
    institutionId: auth.institution._id!,
    fullName,
    email,
    role,
    unitId,
    title,
    phone: "",
    position: "",
    orcid: "",
    isActive: false, // стає true після accept
    hiredAt: "",
    userId: "",
    // invite fields через any (institutionMemberInputSchema ще не включає їх)
    ...({ inviteStatus: "pending", inviteToken: token, inviteTokenExpires: expires } as any),
  });

  const roleLabel = ROLE_LABELS[role];
  const inviteUrl = `${baseUrl}/${locale}/invite/${token}`;

  const emailTpl = buildInviteEmail({
    url: inviteUrl,
    inviteeName: fullName.split(" ")[0],
    institutionName: auth.institution.name,
    role: locale === "uk" ? (roleLabel?.uk ?? role) : (roleLabel?.en ?? role),
    locale,
  });

  await sendEmail({ to: email, subject: emailTpl.subject, html: emailTpl.html, text: emailTpl.text })
    .catch((e) => console.error("[invite] sendEmail failed:", e));

  return NextResponse.json({ ok: true, member });
}
