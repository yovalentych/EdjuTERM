import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function PublicHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-[#f3f4ef] text-stone-950">
      <header className="border-b border-stone-200 bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">{dictionary.shell.appName}</p>
            <p className="font-semibold">{dictionary.shell.projectShortName}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/${dictionary.alternateLocale}`}
              className="border border-stone-300 bg-white px-3 py-2 text-stone-700 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              {dictionary.shell.languageSwitch}
            </Link>
            {user ? (
              <Link
                href={`/${localeParam}/app`}
                className="bg-stone-950 px-4 py-2 font-semibold text-white transition hover:bg-stone-800"
              >
                {dictionary.public.privateArea}
              </Link>
            ) : (
              <>
                <Link
                  href={`/${localeParam}/login`}
                  className="border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-800 transition hover:border-emerald-700 hover:text-emerald-800"
                >
                  {dictionary.public.login}
                </Link>
                <Link
                  href={`/${localeParam}/register`}
                  className="bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800"
                >
                  {dictionary.public.register}
                </Link>
              </>
            )}
            <Link
              href={`/${localeParam}/open-science`}
              target="_blank"
              className="border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-800 transition hover:border-emerald-700 hover:text-emerald-800"
            >
              {dictionary.openScience.publicPage}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            {dictionary.public.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
            {dictionary.public.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            {dictionary.public.summary}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
              FAIR
            </span>
            <span className="border border-cyan-200 bg-cyan-50 px-2 py-1 text-cyan-800">
              DOI-ready
            </span>
            <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
              DMP
            </span>
          </div>
        </div>

        <div className="border border-stone-200 bg-[#f8fbf7] p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{dictionary.public.rolesTitle}</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
            <p>{dictionary.public.admin}</p>
            <p>{dictionary.public.supervisor}</p>
            <p>{dictionary.public.member}</p>
            <p>{dictionary.public.user}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            {dictionary.public.privateArea}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            {dictionary.public.privateText}
          </p>
        </div>
      </section>
      <SiteFooter dictionary={dictionary} />
    </main>
  );
}
