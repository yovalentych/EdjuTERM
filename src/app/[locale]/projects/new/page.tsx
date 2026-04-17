import { notFound, redirect } from "next/navigation";
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
    <main className="min-h-screen bg-[#f3f4ef] px-5 py-10 text-stone-950">
      <section className="mx-auto max-w-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">
          {dictionary.projects.newTitle}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {dictionary.projects.createHint}
        </p>
        <div className="mt-5">
          <ProjectCreateForm
            dictionary={dictionary}
            locale={localeParam}
            error={error}
          />
        </div>
      </section>
    </main>
  );
}
