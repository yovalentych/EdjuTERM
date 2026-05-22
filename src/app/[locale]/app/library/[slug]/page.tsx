import { ArrowLeft, Clock3, ExternalLink, Tag } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import type { Components } from "react-markdown";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound, redirect } from "next/navigation";
import { LiquidAppShell } from "@/components/liquid-app-shell";
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
      <h2 id={slugifyHeading(text)} className="mt-10 scroll-mt-24 text-2xl font-bold leading-tight tracking-tight text-slate-950 first:mt-0" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => (
    <h3 className="mt-7 text-lg font-bold tracking-tight text-slate-900" {...props}>
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
    <LiquidAppShell dictionary={dictionary} locale={localeParam} user={user}>
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
        <article className="liquid-card p-0 overflow-hidden">
          <div className="border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/60 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1">
                <Clock3 className="h-3.5 w-3.5" />
                {article.readingTimeMinutes} {isUk ? "хв читання" : "min read"}
              </span>
              <span className="text-slate-400">·</span>
              <span>{isUk ? "Опубліковано" : "Published"}: {formatDate(article.publishedAt)}</span>
              <span className="text-slate-400">·</span>
              <span>{isUk ? "Оновлено" : "Updated"}: {formatDate(article.updatedAt)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="kb-prose px-6 py-7 md:px-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {article.markdown}
            </ReactMarkdown>
          </div>
        </article>

        <aside className="space-y-4">
          <section className="liquid-card sticky top-24">
            <div className="mb-3">
              <span className="liquid-eyebrow">{isUk ? "Зміст" : "Contents"}</span>
            </div>
            <nav className="space-y-1">
              {headings.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </section>

          {related.length > 0 && (
            <section className="liquid-card">
              <div className="mb-3">
                <span className="liquid-eyebrow">
                  {isUk ? "Пов'язані матеріали" : "Related articles"}
                </span>
              </div>
              <div className="space-y-2">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/${localeParam}/app/library/${item.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/60"
                  >
                    <p className="text-sm font-bold leading-snug text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="liquid-card">
            <div className="mb-2">
              <span className="liquid-eyebrow">{isUk ? "Джерело матеріалу" : "Source"}</span>
            </div>
            <p className="text-xs leading-6 text-slate-600">
              {isUk
                ? "Матеріал адаптовано з внутрішнього deep research report та переоформлено для швидкого використання у knowledge base."
                : "Adapted from an internal deep research report and reformatted for practical knowledge base use."}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
              <ExternalLink className="h-3 w-3" />
              {article.sourceName || "content/knowledge-base"}
            </div>
          </section>
        </aside>
      </div>
    </LiquidAppShell>
  );
}
