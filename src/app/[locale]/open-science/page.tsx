import Link from "next/link";
import { notFound } from "next/navigation";
import { OpenScienceList } from "@/components/open-science/open-science-list";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listPublishedOpenScienceUpdates } from "@/lib/open-science";

export default async function PublicOpenSciencePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);
  const updates = await listPublishedOpenScienceUpdates();

  return (
    <main className="min-h-screen bg-[#f3f4ef] text-stone-950">
      <section className="mx-auto max-w-5xl px-5 py-8">
        <div className="border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {dictionary.public.eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                {dictionary.openScience.publicTitle}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
                {dictionary.openScience.publicSummary}
              </p>
            </div>
            <Link
              href={`/${localeParam}`}
              className="border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              {dictionary.shell.appName}
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <OpenScienceList
            updates={updates}
            dictionary={dictionary}
            publicOnly
          />
        </div>
      </section>
      <SiteFooter dictionary={dictionary} />
    </main>
  );
}
