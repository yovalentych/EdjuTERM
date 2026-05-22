import { notFound, redirect } from "next/navigation";
import { LiquidAppShell } from "@/components/liquid-app-shell";
import { LibraryHub } from "@/components/library/library-hub";
import { Breadcrumb, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listKnowledgeBaseArticles } from "@/lib/knowledge-base";

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);
  const articles = await listKnowledgeBaseArticles();

  return (
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
      <PageHeader
        eyebrow={localeParam === "uk" ? "База знань" : "Knowledge Base"}
        title={localeParam === "uk" ? "Бібліотека" : "Library"}
        breadcrumb={
          <Breadcrumb
            items={[{ label: localeParam === "uk" ? "Бібліотека" : "Library" }]}
            homeHref={`/${localeParam}/app`}
          />
        }
        description={
          localeParam === "uk"
            ? "Статті, настанови та ресурси для роботи з платформою."
            : "Articles, guides and resources for working with the platform."
        }
      />
      <LibraryHub locale={localeParam} articles={articles} />
    </LiquidAppShell>
  );
}
