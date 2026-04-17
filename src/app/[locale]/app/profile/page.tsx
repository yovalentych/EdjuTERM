import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${localeParam}/login`);
  }

  const dictionary = getDictionary(localeParam);

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center bg-emerald-50 text-emerald-700">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
              {dictionary.account.profileTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              {dictionary.account.profileSummary}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ProfileField
          icon={<UserRound className="h-5 w-5" />}
          label={dictionary.auth.firstName}
          value={`${user.firstName} ${user.lastName}`}
        />
        <ProfileField
          icon={<Mail className="h-5 w-5" />}
          label={dictionary.account.email}
          value={user.email}
        />
        <ProfileField
          icon={<ShieldCheck className="h-5 w-5" />}
          label={dictionary.account.role}
          value={dictionary.roles[user.role]}
        />
        <ProfileField
          icon={<UserRound className="h-5 w-5" />}
          label={dictionary.account.latinName}
          value={`${user.firstNameLatin} ${user.lastNameLatin}`}
        />
      </section>
    </AppShell>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-emerald-700">{icon}</div>
      <p className="mt-3 text-sm text-stone-500">{label}</p>
      <p className="mt-1 font-semibold text-stone-950">{value}</p>
    </article>
  );
}
