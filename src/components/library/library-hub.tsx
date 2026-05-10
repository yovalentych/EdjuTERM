"use client";

import { BookOpen, Clock3, Filter, Search, Sparkles, Tags } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { DashboardLayout, DashboardSection } from "@/components/dashboard/dashboard-layout";
import type { KnowledgeBaseArticle, KnowledgeCategory } from "@/lib/knowledge-base";

const categoryMeta: Record<KnowledgeCategory, { uk: string; en: string; tone: string }> = {
  "ai-policy": {
    uk: "Політики і правила",
    en: "Policies",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  disclosure: {
    uk: "Декларації",
    en: "Disclosures",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  citation: {
    uk: "Цитування",
    en: "Citation",
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  ethics: {
    uk: "Етика і безпека",
    en: "Ethics",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  methodology: {
    uk: "Методологія",
    en: "Methodology",
    tone: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  "open-science": {
    uk: "Відкрита наука",
    en: "Open Science",
    tone: "border-teal-200 bg-teal-50 text-teal-700",
  },
  "grant-writing": {
    uk: "Грантове письмо",
    en: "Grant Writing",
    tone: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function LibraryHub({
  locale,
  articles,
}: {
  locale: "uk" | "en";
  articles: KnowledgeBaseArticle[];
}) {
  const isUk = locale === "uk";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory | "all">("all");
  const [year, setYear] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const deferredQuery = useDeferredValue(query);

  const years = useMemo(
    () =>
      Array.from(new Set(articles.map((article) => article.publishedAt.slice(0, 4)))).sort(
        (a, b) => Number(b) - Number(a),
      ),
    [articles],
  );

  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return [...articles]
      .filter((article) => {
        if (category !== "all" && article.category !== category) return false;
        if (year !== "all" && article.publishedAt.slice(0, 4) !== year) return false;
        if (!normalized) return true;
        const haystack = [
          article.title,
          article.summary,
          article.tags.join(" "),
          categoryMeta[article.category].uk,
          categoryMeta[article.category].en,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      })
      .sort((a, b) =>
        sort === "newest"
          ? b.publishedAt.localeCompare(a.publishedAt)
          : a.publishedAt.localeCompare(b.publishedAt),
      );
  }, [articles, category, deferredQuery, sort, year]);

  const featured = filtered.find((article) => article.featured) ?? filtered[0];
  const pinned = filtered.filter((article) => article.pinned).slice(0, 3);
  const timeline = useMemo(() => {
    const map = new Map<string, KnowledgeBaseArticle[]>();
    for (const article of filtered) {
      const key = article.publishedAt.slice(0, 4);
      const arr = map.get(key) ?? [];
      arr.push(article);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [filtered]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardSection className="page-hero overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isUk ? "Довідка" : "Knowledge Base"}
                </div>
                <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
                  {isUk ? "Матеріали для досліджень і публікацій" : "Knowledge hub for research and publishing"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {isUk
                    ? "Зібрані інструкції, шаблони, правила і практичні статті для роботи з ШІ, науковими текстами, етикою і цитуванням."
                    : "Guides, templates, policies and practical notes for AI use, scientific writing, ethics and citation."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
                <Metric label={isUk ? "Матеріалів" : "Articles"} value={String(articles.length)} />
                <Metric label={isUk ? "Рубрик" : "Categories"} value={String(Object.keys(categoryMeta).length)} />
                <Metric label={isUk ? "Останнє оновлення" : "Updated"} value={formatDate(articles[0]?.updatedAt ?? articles[0]?.publishedAt ?? new Date().toISOString())} compact />
              </div>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection className="surface overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md">
          <div className="grid gap-4 border-b border-slate-100 bg-white/50 p-5 lg:grid-cols-[minmax(0,1fr)_180px_170px] xl:grid-cols-[minmax(0,1fr)_200px_180px_160px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isUk ? "Пошук за назвою, тегами, темою..." : "Search by title, tags, topic..."}
                className="input-control w-full rounded-xl py-2.5 pl-10 pr-4 text-sm shadow-sm"
              />
            </label>

            <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")} className="input-control rounded-xl py-2.5 text-sm shadow-sm">
              <option value="newest">{isUk ? "Спочатку нові" : "Newest first"}</option>
              <option value="oldest">{isUk ? "Спочатку старі" : "Oldest first"}</option>
            </select>

            <select value={year} onChange={(e) => setYear(e.target.value)} className="input-control rounded-xl py-2.5 text-sm shadow-sm">
              <option value="all">{isUk ? "Усі роки" : "All years"}</option>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="hidden xl:flex items-center gap-2 px-2 text-xs font-semibold text-slate-400">
              <Filter className="h-4 w-4" />
              {isUk ? "Фільтри" : "Filters"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-5 py-4">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${category === "all" ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white"}`}
            >
              {isUk ? "Усі рубрики" : "All categories"}
            </button>
            {(Object.keys(categoryMeta) as KnowledgeCategory[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm transition ${
                  category === item ? categoryMeta[item].tone : "border-slate-200 bg-white/80 text-slate-600 hover:bg-white"
                }`}
              >
                {isUk ? categoryMeta[item].uk : categoryMeta[item].en}
              </button>
            ))}
          </div>
        </DashboardSection>

        {featured && (
          <DashboardSection className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <div className="surface overflow-hidden rounded-2xl bg-white/80 backdrop-blur-md">
              <div className="flex h-full flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${categoryMeta[featured.category].tone}`}>
                      {isUk ? categoryMeta[featured.category].uk : categoryMeta[featured.category].en}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{formatDate(featured.publishedAt)}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-bold text-slate-950">{featured.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{featured.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      {featured.readingTimeMinutes} хв
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Tags className="h-4 w-4" />
                      {featured.tags.slice(0, 3).join(" • ")}
                    </span>
                  </div>
                </div>
                <div className="mt-4 shrink-0 lg:mt-0 lg:pl-6">
                  <Link
                    href={`/${locale}/app/library/${featured.slug}`}
                    className="control-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:shadow-md lg:w-auto"
                  >
                    <BookOpen className="h-4 w-4" />
                    {isUk ? "Читати статтю" : "Read article"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="surface overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md">
              <div className="border-b border-slate-100 bg-white/50 px-5 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{isUk ? "Закріплені" : "Pinned"}</h2>
              </div>
              <div className="space-y-3 p-5">
                {pinned.length > 0 ? pinned.map((article) => (
                  <Link key={article.slug} href={`/${locale}/app/library/${article.slug}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryMeta[article.category].tone}`}>
                        {isUk ? categoryMeta[article.category].uk : categoryMeta[article.category].en}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">{formatDate(article.publishedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{article.title}</p>
                  </Link>
                )) : (
                  <p className="text-sm text-slate-500">{isUk ? "Немає закріплених матеріалів." : "No pinned articles."}</p>
                )}
              </div>
            </div>
          </DashboardSection>
        )}

        <DashboardSection className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-4">
            {filtered.length > 0 ? (
              filtered.map((article) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/app/library/${article.slug}`}
                  className="surface block overflow-hidden rounded-2xl bg-white/80 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="grid gap-4 p-6 lg:grid-cols-[120px_minmax(0,1fr)_160px] lg:items-start">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{article.publishedAt.slice(0, 4)}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(article.publishedAt)}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${categoryMeta[article.category].tone}`}>
                          {isUk ? categoryMeta[article.category].uk : categoryMeta[article.category].en}
                        </span>
                        {article.featured && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-blue-700">
                            Featured
                          </span>
                        )}
                        {article.pinned && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-700">
                            Pinned
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-serif text-lg font-bold text-slate-950">{article.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">{article.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-start gap-4 text-xs font-medium text-slate-500 lg:justify-end">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5"/> {article.readingTimeMinutes} хв</span>
                      <span className="font-semibold text-blue-600 group-hover:text-blue-800">{isUk ? "Читати" : "Read"} &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="surface rounded-2xl bg-white/60 px-6 py-16 text-center backdrop-blur-md">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {isUk ? "Нічого не знайдено" : "No articles found"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {isUk ? "Спробуйте змінити пошуковий запит або скинути фільтри." : "Try adjusting your search query or filters."}
                </p>
              </div>
            )}
          </div>

          <aside className="surface h-fit overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md">
            <div className="border-b border-slate-100 bg-white/50 px-5 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">{isUk ? "Хронологія" : "Timeline"}</h2>
            </div>
            <div className="space-y-5 p-5">
              {timeline.map(([timelineYear, yearArticles]) => (
                <div key={timelineYear}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{timelineYear}</p>
                  <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
                    {yearArticles.map((article) => (
                      <Link key={article.slug} href={`/${locale}/app/library/${article.slug}`} className="group block rounded-lg py-1 transition">
                        <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{article.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{formatDate(article.publishedAt)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}

function Metric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 font-serif font-bold text-slate-950 ${compact ? "text-lg" : "text-3xl"}`}>{value}</p>
    </div>
  );
}
