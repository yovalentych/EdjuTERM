"use client";

import {
  BookOpen,
  Clock3,
  Filter,
  Pin,
  Search,
  Sparkles,
  Tags,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { LiquidCard, LiquidPill, LiquidStatTile } from "@/components/ui/liquid";
import type { KnowledgeBaseArticle, KnowledgeCategory } from "@/lib/knowledge-base";

type Tint = "blue" | "emerald" | "violet" | "amber" | "teal" | "rose";

const categoryMeta: Record<KnowledgeCategory, { uk: string; en: string; tint: Tint }> = {
  "ai-policy":     { uk: "Політики і правила",   en: "Policies",      tint: "blue" },
  disclosure:      { uk: "Декларації",            en: "Disclosures",   tint: "emerald" },
  citation:        { uk: "Цитування",             en: "Citation",      tint: "violet" },
  ethics:          { uk: "Етика і безпека",       en: "Ethics",        tint: "amber" },
  methodology:     { uk: "Методологія",           en: "Methodology",   tint: "teal" },
  "open-science":  { uk: "Відкрита наука",        en: "Open Science",  tint: "emerald" },
  "grant-writing": { uk: "Грантове письмо",       en: "Grant Writing", tint: "rose" },
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
      Array.from(new Set(articles.map((a) => a.publishedAt.slice(0, 4)))).sort(
        (a, b) => Number(b) - Number(a),
      ),
    [articles],
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return [...articles]
      .filter((article) => {
        if (category !== "all" && article.category !== category) return false;
        if (year !== "all" && article.publishedAt.slice(0, 4) !== year) return false;
        if (!q) return true;
        const haystack = [
          article.title,
          article.summary,
          article.tags.join(" "),
          categoryMeta[article.category].uk,
          categoryMeta[article.category].en,
        ].join(" ").toLowerCase();
        return haystack.includes(q);
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
    <div className="space-y-5">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50/50 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
              <Sparkles className="h-3 w-3" />
              {isUk ? "Довідка · Knowledge Base" : "Knowledge Base"}
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-slate-950 md:text-4xl">
              {isUk
                ? "Матеріали для досліджень і публікацій"
                : "Knowledge hub for research and publishing"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              {isUk
                ? "Інструкції, шаблони, правила й практичні статті для роботи з ШІ, науковими текстами, етикою та цитуванням."
                : "Guides, templates, policies and practical notes for AI use, scientific writing, ethics and citation."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 xl:w-auto xl:min-w-[440px]">
            <LiquidStatTile
              icon={<BookOpen className="h-4 w-4" />}
              label={isUk ? "Матеріалів" : "Articles"}
              value={articles.length}
              tint="emerald"
            />
            <LiquidStatTile
              icon={<Tags className="h-4 w-4" />}
              label={isUk ? "Рубрик" : "Categories"}
              value={Object.keys(categoryMeta).length}
              tint="blue"
            />
            <LiquidStatTile
              icon={<TrendingUp className="h-4 w-4" />}
              label={isUk ? "Оновлено" : "Updated"}
              value={formatDate(articles[0]?.updatedAt ?? new Date().toISOString())}
              tint="violet"
            />
          </div>
        </div>
      </section>

      {/* ── FILTERS ──────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isUk ? "Пошук за назвою, тегами, темою..." : "Search by title, tags, topic..."}
              className="input-control w-full rounded-xl py-2.5 pl-10 pr-3 text-sm"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
            className="input-control rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="newest">{isUk ? "Спочатку нові" : "Newest first"}</option>
            <option value="oldest">{isUk ? "Спочатку старі" : "Oldest first"}</option>
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="input-control rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="all">{isUk ? "Усі роки" : "All years"}</option>
            {years.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        {/* Category chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Filter className="h-3 w-3" />
            {isUk ? "Рубрика" : "Category"}
          </span>
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`liquid-pill ${category === "all" ? "liquid-pill--filled" : ""}`}
          >
            {isUk ? "Усі" : "All"}
          </button>
          {(Object.keys(categoryMeta) as KnowledgeCategory[]).map((item) => {
            const meta = categoryMeta[item];
            return (
              <button
                key={item}
                type="button"
                data-liquid-tint={meta.tint}
                onClick={() => setCategory(item)}
                className={`liquid-pill ${category === item ? "liquid-pill--tinted" : ""}`}
              >
                {isUk ? meta.uk : meta.en}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── FEATURED + PINNED ────────────────────────────────────── */}
      {featured && (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <LiquidCard tint={categoryMeta[featured.category].tint} accent>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span data-liquid-tint={categoryMeta[featured.category].tint} className="liquid-pill liquid-pill--tinted">
                {isUk ? categoryMeta[featured.category].uk : categoryMeta[featured.category].en}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">{formatDate(featured.publishedAt)}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <Sparkles className="h-3 w-3" />
                {isUk ? "На замовлення" : "Featured"}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950">{featured.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{featured.summary}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {featured.readingTimeMinutes} {isUk ? "хв" : "min"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Tags className="h-3.5 w-3.5" />
                {featured.tags.slice(0, 3).join(" · ")}
              </span>
            </div>

            <Link
              href={`/${locale}/app/library/${featured.slug}`}
              className="liquid-cta mt-5 inline-flex"
            >
              <BookOpen className="h-4 w-4" />
              {isUk ? "Читати статтю" : "Read article"}
            </Link>
          </LiquidCard>

          <LiquidCard>
            <div className="mb-3 flex items-center gap-2">
              <Pin className="h-4 w-4 text-amber-600" />
              <span className="liquid-eyebrow">{isUk ? "Закріплені" : "Pinned"}</span>
            </div>
            {pinned.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {pinned.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/app/library/${article.slug}`}
                    data-liquid-tint={categoryMeta[article.category].tint}
                    className="liquid-card hover:-translate-y-0.5 hover:shadow-md p-3 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="liquid-pill liquid-pill--tinted text-[10px]">
                        {isUk ? categoryMeta[article.category].uk : categoryMeta[article.category].en}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(article.publishedAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold leading-snug text-slate-900">{article.title}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {isUk ? "Немає закріплених матеріалів." : "No pinned articles."}
              </p>
            )}
          </LiquidCard>
        </section>
      )}

      {/* ── LIST + TIMELINE ──────────────────────────────────────── */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3">
          {filtered.length > 0 ? (
            filtered.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/app/library/${article.slug}`}
                data-liquid-tint={categoryMeta[article.category].tint}
                className="liquid-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="grid gap-4 lg:grid-cols-[100px_minmax(0,1fr)_140px] lg:items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {article.publishedAt.slice(0, 4)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(article.publishedAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="liquid-pill liquid-pill--tinted text-[10px]">
                        {isUk ? categoryMeta[article.category].uk : categoryMeta[article.category].en}
                      </span>
                      {article.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
                          <Sparkles className="h-2.5 w-2.5" />
                          {isUk ? "Топ" : "Featured"}
                        </span>
                      )}
                      {article.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700">
                          <Pin className="h-2.5 w-2.5" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-slate-950">
                      {article.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{article.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-start gap-3 text-xs font-medium text-slate-500 lg:justify-end">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {article.readingTimeMinutes} {isUk ? "хв" : "min"}
                    </span>
                    <span className="font-bold text-[color:var(--liquid-accent)]">
                      {isUk ? "Читати →" : "Read →"}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <LiquidCard className="py-16 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">
                {isUk ? "Нічого не знайдено" : "No articles found"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isUk ? "Спробуйте змінити пошуковий запит або скинути фільтри." : "Try adjusting your search query or filters."}
              </p>
            </LiquidCard>
          )}
        </div>

        <aside>
          <LiquidCard className="sticky top-24">
            <div className="mb-4 flex items-center gap-2">
              <span className="liquid-eyebrow">{isUk ? "Хронологія" : "Timeline"}</span>
            </div>
            <div className="space-y-5">
              {timeline.map(([timelineYear, yearArticles]) => (
                <div key={timelineYear}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{timelineYear}</p>
                  <div className="mt-2 space-y-1.5 border-l-2 border-slate-200 pl-4">
                    {yearArticles.map((article) => (
                      <Link
                        key={article.slug}
                        href={`/${locale}/app/library/${article.slug}`}
                        className="group block rounded-lg py-1.5 transition"
                      >
                        <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-emerald-700">
                          {article.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{formatDate(article.publishedAt)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </LiquidCard>
        </aside>
      </section>
    </div>
  );
}
