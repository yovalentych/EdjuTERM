import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function NewProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
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
  const { error } = await searchParams;

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="border border-stone-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
          {dictionary.projects.newTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          {dictionary.projects.newSummary}
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
          {dictionary.projects.createHint}
        </p>
      </section>
      <ProjectCreateForm
        dictionary={dictionary}
        locale={localeParam}
        error={error}
      />
    </AppShell>
  );
}
