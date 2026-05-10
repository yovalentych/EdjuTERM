import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProjectWizard } from "@/components/projects/project-wizard";
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

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <section className="page-hero p-5">
        <h1 className="text-3xl font-semibold tracking-normal text-stone-950">
          {dictionary.projects.newTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          {dictionary.projects.newSummary}
        </p>
      </section>
      <div className="p-5">
        <ProjectWizard dictionary={dictionary} locale={localeParam} />
      </div>
    </AppShell>
  );
}
