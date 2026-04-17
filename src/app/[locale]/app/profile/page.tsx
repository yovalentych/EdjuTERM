import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { updateProfile } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
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

      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">
          {dictionary.account.profileTitle}
        </h2>
        {saved ? (
          <p className="mt-3 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {dictionary.account.profileSaved}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {dictionary.auth.invalidError}
          </p>
        ) : null}
        <form action={updateProfile} className="mt-5 grid gap-3 md:grid-cols-2">
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
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">
              {dictionary.account.profileBio}
            </span>
            <textarea
              name="profileBio"
              defaultValue={user.profileBio}
              className="min-h-28 w-full resize-y border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            {dictionary.account.saveProfile}
          </button>
        </form>
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
        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        required={!["orcid", "position"].includes(name)}
      />
    </label>
  );
}
