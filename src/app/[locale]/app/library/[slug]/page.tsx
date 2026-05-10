import { ArrowLeft, Clock3, ExternalLink, Tag } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import type { Components } from "react-markdown";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";
import {
  extractArticleHeadings,
  getKnowledgeBaseArticleBySlug,
  listKnowledgeBaseArticles,
  slugifyHeading,
} from "@/lib/knowledge-base";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const markdownComponents: Components = {
  h2: ({ children, ...props }) => {
    const text = String(children);
    return (
      <h2 id={slugifyHeading(text)} className="mt-12 scroll-mt-24 text-2xl font-bold tracking-tight text-slate-950 first:mt-0" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => (
    <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mt-4 leading-8 text-slate-700 first:mt-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mt-4 list-disc space-y-2.5 pl-6 text-slate-700" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mt-4 list-decimal space-y-2.5 pl-6 text-slate-700" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="mt-6 rounded-2xl border-l-4 border-blue-500 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 px-6 py-4 italic text-slate-700 shadow-sm shadow-blue-100" {...props}>
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="my-8 overflow-x-auto rounded-xl border border-slate-200">
      <table className="kb-table min-w-full" {...props}>
        {children}
      </table>
    </div>
  ),
  code: ({
    inline,
    children,
    ...props
  }: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) =>
    inline ? (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-slate-800" {...props}>
        {children}
      </code>
    ) : (
      <div className="group relative mt-6 first:mt-0">
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 opacity-0 transition group-hover:opacity-100">
          <Tag className="h-3 w-3" />
        </div>
        <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 font-mono text-[13px] leading-6 text-slate-300 shadow-xl">
          <code {...props}>{children}</code>
        </pre>
      </div>
    ),
};

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/${localeParam}/login`);

  const dictionary = getDictionary(localeParam);
  const article = await getKnowledgeBaseArticleBySlug(slug);
  if (!article) notFound();

  const headings = extractArticleHeadings(article.markdown);
  const related = (await listKnowledgeBaseArticles())
    .filter((item) => item.slug !== article.slug && (item.category === article.category || item.tags.some((tag) => article.tags.includes(tag))))
    .slice(0, 3);
  const isUk = localeParam === "uk";

  return (
    <AppShell dictionary={dictionary} locale={localeParam} user={user}>
      <PageHeader
        eyebrow={isUk ? "Довідка" : "Library"}
        title={article.title}
        description={article.summary}
        breadcrumb={
          <Link href={`/${localeParam}/app/library`} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            {isUk ? "Назад до каталогу" : "Back to library"}
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="surface overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                {article.readingTimeMinutes} {isUk ? "хв читання" : "min read"}
              </span>
              <span>{isUk ? "Опубліковано" : "Published"}: {formatDate(article.publishedAt)}</span>
              <span>{isUk ? "Оновлено" : "Updated"}: {formatDate(article.updatedAt)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="kb-prose px-5 py-6 md:px-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {article.markdown}
            </ReactMarkdown>
          </div>
        </article>

        <aside className="space-y-4">
          <section className="surface sticky top-24 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">{isUk ? "Зміст" : "Contents"}</h2>
            </div>
            <div className="p-4">
              <nav className="space-y-2">
                {headings.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-lg px-2 py-1.5 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </section>

          {related.length > 0 && (
            <section className="surface overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">{isUk ? "Пов'язані матеріали" : "Related articles"}</h2>
              </div>
              <div className="space-y-3 p-4">
                {related.map((item) => (
                  <Link key={item.slug} href={`/${localeParam}/app/library/${item.slug}`} className="block rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">{isUk ? "Джерело матеріалу" : "Source"}</h2>
            </div>
            <div className="p-4 text-sm leading-6 text-slate-600">
              {isUk
                ? "Матеріал адаптовано з внутрішнього deep research report та переоформлено для швидкого використання в knowledge base."
                : "Adapted from an internal deep research report and reformatted for practical knowledge base use."}
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {article.sourceName || "content/knowledge-base"}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
