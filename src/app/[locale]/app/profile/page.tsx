import { BookOpen, Mail, ShieldCheck, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { updateProfile } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Avatar, Badge, Card } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
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
  const { error, saved } = await searchParams;

  const isUk = localeParam === "uk";

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      {/* Sneat-style profile card */}
      <section className="surface overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-end">
          <div className="-mt-12 shrink-0">
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              size="xl"
              colorClass="bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-4 ring-white shadow-md"
              className="text-2xl"
            />
          </div>
          <div className="min-w-0 flex-1 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h1>
              <Badge tone="blue">{dictionary.roles[user.role]}</Badge>
            </div>
            {(user.position || user.affiliation) && (
              <p className="mt-0.5 text-sm text-slate-500">
                {[user.position, user.affiliation].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
              {user.orcid && (
                <a
                  href={`https://orcid.org/${user.orcid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-600 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {user.orcid}
                </a>
              )}
            </div>
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
        <ProfileField
          icon={<UserRound className="h-5 w-5" />}
          label={dictionary.account.orcid}
          value={user.orcid || "-"}
        />
        <ProfileField
          icon={<UserRound className="h-5 w-5" />}
          label={dictionary.account.position}
          value={user.position || "-"}
        />
        <ProfileField
          icon={<UserRound className="h-5 w-5" />}
          label={dictionary.account.affiliation}
          value={user.affiliation || "-"}
        />
      </section>

      <Card title={isUk ? "Редагування профілю" : "Edit Profile"} description={isUk ? "Оновіть свої персональні дані" : "Update your personal information"}>
        {saved ? (
          <p className="status-note mt-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {dictionary.account.profileSaved}
          </p>
        ) : null}
        {error ? (
          <p className="status-note mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {dictionary.auth.invalidError}
          </p>
        ) : null}
        <form action={updateProfile} className="mt-5 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="locale" value={localeParam} />
          <TextInput label={dictionary.auth.firstName} name="firstName" defaultValue={user.firstName} />
          <TextInput label={dictionary.auth.lastName} name="lastName" defaultValue={user.lastName} />
          <TextInput label={dictionary.auth.firstNameLatin} name="firstNameLatin" defaultValue={user.firstNameLatin} />
          <TextInput label={dictionary.auth.lastNameLatin} name="lastNameLatin" defaultValue={user.lastNameLatin} />
          <TextInput label={dictionary.account.orcid} name="orcid" defaultValue={user.orcid} placeholder="0000-0000-0000-0000" />
          <TextInput label={dictionary.account.position} name="position" defaultValue={user.position} />
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">
              {dictionary.account.affiliation}
            </span>
            <input
              name="affiliation"
              defaultValue={user.affiliation}
              className="input-control px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">
              {dictionary.account.profileBio}
            </span>
            <textarea
              name="profileBio"
              defaultValue={user.profileBio}
              className="input-control min-h-32 resize-y px-3 py-2 text-sm outline-none"
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="control-primary px-4 py-2 text-sm font-semibold">
              {dictionary.account.saveProfile}
            </button>
          </div>
        </form>
      </Card>
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
    <article className="metric-card p-5">
      <div className="flex items-center gap-2 text-blue-600">{icon}</div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-stone-950">{value}</p>
    </article>
  );
}

function TextInput({
  defaultValue,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input-control px-3 py-2 text-sm outline-none"
        required={!["orcid", "position"].includes(name)}
      />
    </label>
  );
}
