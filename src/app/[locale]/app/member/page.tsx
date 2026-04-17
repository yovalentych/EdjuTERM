import { BriefcaseBusiness, Building2, Fingerprint, Mail, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getProjectForUser } from "@/lib/projects";
import { getSafeUserById } from "@/lib/users";

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ projectId?: string; userId?: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${localeParam}/login`);
  }

  const { projectId, userId } = await searchParams;

  if (!userId) {
    redirect(`/${localeParam}/app`);
  }

  if (projectId) {
    const project = await getProjectForUser(projectId, currentUser);

    if (!project) {
      notFound();
    }
  } else if (currentUser.role !== "admin" && currentUser._id !== userId) {
    redirect(`/${localeParam}/app`);
  }

  const member = await getSafeUserById(userId);

  if (!member) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={currentUser}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center bg-emerald-50 text-emerald-700">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
              {dictionary.account.publicProfile}
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              {member.firstName} {member.lastName}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfileItem
          icon={<Mail className="h-5 w-5" />}
          label={dictionary.account.email}
          value={member.email}
        />
        <ProfileItem
          icon={<Fingerprint className="h-5 w-5" />}
          label={dictionary.account.orcid}
          value={member.orcid || "-"}
        />
        <ProfileItem
          icon={<BriefcaseBusiness className="h-5 w-5" />}
          label={dictionary.account.position}
          value={member.position || "-"}
        />
        <ProfileItem
          icon={<Building2 className="h-5 w-5" />}
          label={dictionary.account.affiliation}
          value={member.affiliation || "-"}
        />
      </section>

      {member.profileBio ? (
        <section className="border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">
            {dictionary.account.profileBio}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            {member.profileBio}
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}

function ProfileItem({
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
