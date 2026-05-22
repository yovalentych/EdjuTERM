import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { isLocale } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/current-user";
import { findMemberByInviteToken, getInstitution, acceptMemberInvite } from "@/lib/institutions-db";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();

  const member = await findMemberByInviteToken(token).catch(() => null);
  const isUk = locale === "uk";

  if (!member) {
    return <InviteErrorPage isUk={isUk} reason="not_found" locale={locale} />;
  }
  if (member.inviteStatus === "accepted") {
    return <InviteErrorPage isUk={isUk} reason="already_accepted" locale={locale} />;
  }
  if (
    member.inviteStatus === "expired" ||
    (member.inviteTokenExpires && new Date(member.inviteTokenExpires) < new Date())
  ) {
    return <InviteErrorPage isUk={isUk} reason="expired" locale={locale} />;
  }

  const institution = await getInstitution(member.institutionId).catch(() => null);

  // Якщо вже залогінений — можна прийняти напряму без реєстрації.
  const currentUser = await getCurrentUser().catch(() => null);

  if (currentUser) {
    // Перевіримо чи не вже приєднаний.
    if ((currentUser as any).institutionId === member.institutionId) {
      redirect(`/${locale}/app/institution`);
    }
    // Auto-accept — прив'язуємо до цього user.
    await acceptMemberInvite(member._id!, currentUser._id!);
    redirect(`/${locale}/app/space?welcome_institution=1`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50/30 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {/* Institution card */}
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {isUk ? "Запрошення від закладу" : "Institution invitation"}
              </p>
              <h1 className="mt-1 text-lg font-bold leading-tight text-slate-900">
                {institution?.name ?? member.institutionId}
              </h1>
              {institution?.shortName && (
                <p className="font-mono text-xs text-slate-500">{institution.shortName}</p>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50/70 px-4 py-3">
            <p className="text-sm text-slate-700">
              {isUk
                ? <>Вас запрошено як <strong>{member.fullName}</strong> ({member.role}).</>
                : <>You've been invited as <strong>{member.fullName}</strong> ({member.role}).</>}
            </p>
          </div>
        </div>

        {/* Registration / login form */}
        <AcceptInviteForm
          locale={locale}
          token={token}
          memberId={member._id!}
          prefillEmail={member.email}
          prefillName={member.fullName}
        />

        <p className="text-center text-xs text-slate-400">
          {isUk ? "Вже є акаунт?" : "Already have an account?"}{" "}
          <Link href={`/${locale}/login`} className="text-emerald-700 underline hover:no-underline">
            {isUk ? "Увійти" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function InviteErrorPage({
  isUk,
  reason,
  locale,
}: {
  isUk: boolean;
  reason: "not_found" | "already_accepted" | "expired";
  locale: string;
}) {
  const msgs = {
    not_found: {
      icon: <XCircle className="h-10 w-10 text-rose-500" />,
      title: isUk ? "Запрошення не знайдено" : "Invitation not found",
      desc: isUk
        ? "Посилання недійсне або вже використане."
        : "The link is invalid or has already been used.",
    },
    already_accepted: {
      icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
      title: isUk ? "Вже прийнято" : "Already accepted",
      desc: isUk
        ? "Це запрошення вже було прийнято. Увійдіть у свій акаунт."
        : "This invitation has already been accepted. Sign in to your account.",
    },
    expired: {
      icon: <Clock className="h-10 w-10 text-amber-500" />,
      title: isUk ? "Посилання застаріло" : "Link expired",
      desc: isUk
        ? "Термін дії запрошення минув. Попросіть адміністратора надіслати нове."
        : "The invitation has expired. Ask the admin to send a new one.",
    },
  };
  const m = msgs[reason];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/20 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">{m.icon}</div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">{m.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{m.desc}</p>
        <Link
          href={`/${locale}/login`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700"
        >
          {isUk ? "Перейти до входу" : "Go to sign in"}
        </Link>
      </div>
    </div>
  );
}
