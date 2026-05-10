import {
  BookOpen,
  Captions,
  Database,
  ExternalLink,
  Megaphone,
  Newspaper,
  Presentation,
  Rss,
  ScrollText,
  Search,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LicenseBadge, LicenseBlock } from "@/components/license-badge";
import { AccessibilityToolbar } from "@/components/open-science/accessibility-toolbar";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary, isLocale, type Dictionary } from "@/lib/i18n";
import { listPublishedOpenScienceUpdates } from "@/lib/open-science";
import { listPublicProjectRecords } from "@/lib/repositories";
import type { OpenScienceUpdate, ProjectRecord } from "@/lib/schemas";

const rubricIcons = {
  data_repository: Database,
  updates: Rss,
  news: Newspaper,
  conferences: Presentation,
  publications: BookOpen,
  protocols: ScrollText,
  outreach: Megaphone,
} as const;

const rubricOrder = [
  "data_repository",
  "updates",
  "news",
  "conferences",
  "publications",
  "protocols",
  "outreach",
] as const;

export default async function PublicOpenSciencePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale: localeParam }, { q }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!isLocale(localeParam)) {
    notFound();
  }

  const dictionary = getDictionary(localeParam);
  const [allUpdates, allRecords] = await Promise.all([
    listPublishedOpenScienceUpdates(),
    listPublicProjectRecords(),
  ]);

  // Server-side search filter
  const query = q?.trim().toLowerCase() ?? "";
  const updates = query
    ? allUpdates.filter(
        (u) =>
          u.title.toLowerCase().includes(query) ||
          u.summary?.toLowerCase().includes(query) ||
          u.content?.toLowerCase().includes(query),
      )
    : allUpdates;
  const records = query
    ? allRecords.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.summary?.toLowerCase().includes(query),
      )
    : allRecords;

  const groupedUpdates = groupUpdates(updates);
  const totalResults = updates.length + records.length;
  const latestDate =
    allUpdates[0]?.publishedAt ?? allUpdates[0]?.updatedAt;

  return (
    <div className="open-science-public min-h-screen bg-background text-stone-950">
      {/* ── Multiple skip links ─────────────────────────────────────────── */}
      <nav aria-label="Навігація по сторінці" className="sr-only sr-only-focusable">
        <ul role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          <li>
            <a href="#search-form" className="skip-to-content">
              Перейти до пошуку
            </a>
          </li>
          <li>
            <a href="#main-content" className="skip-to-content">
              Перейти до матеріалів
            </a>
          </li>
          <li>
            <a href="#category-nav" className="skip-to-content">
              Перейти до рубрик
            </a>
          </li>
        </ul>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <header className="page-hero p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-blue-600">
                {dictionary.public.eyebrow}
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
                {dictionary.openScience.publicTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                {dictionary.openScience.publicSummary}
              </p>
            </div>

            <div
              className="grid grid-cols-3 gap-2 lg:min-w-[380px]"
              aria-label="Статистика публікацій"
            >
              <HeroStat label="Матеріали" value={allUpdates.length} />
              <HeroStat label="Дані" value={allRecords.length} />
              <HeroStat
                label="Оновлено"
                value={latestDate ? formatDate(latestDate) : "—"}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/${localeParam}`}
              className="control px-3 py-2 text-sm font-semibold"
            >
              {dictionary.shell.appName}
            </Link>
            <Link
              href={`/${localeParam}/login`}
              className="control-primary px-3 py-2 text-sm font-semibold"
            >
              Кабінет дослідника
            </Link>
          </div>
        </header>

        {/* ── Accessibility toolbar ───────────────────────────────────── */}
        <div className="mt-4">
          <AccessibilityToolbar />
        </div>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <search
          id="search-form"
          aria-label="Пошук матеріалів відкритої науки"
          className="surface mt-4 p-4"
        >
          <form method="get" action={`/${localeParam}/open-science`}>
            <label
              htmlFor="q"
              className="mb-2 block text-sm font-semibold text-stone-700"
            >
              <Search className="mr-1 inline h-4 w-4 text-blue-600" aria-hidden="true" />
              Пошук матеріалів
            </label>
            <div className="os-search-form">
              <input
                id="q"
                name="q"
                type="search"
                className="os-search-input"
                defaultValue={q ?? ""}
                placeholder="Назва, опис або ключові слова…"
                aria-label="Пошуковий запит"
                autoComplete="off"
              />
              <button type="submit" className="os-search-btn">
                <Search className="h-4 w-4" aria-hidden="true" />
                Знайти
              </button>
              {q && (
                <a
                  href={`/${localeParam}/open-science`}
                  className="control inline-flex items-center px-3 py-2 text-sm font-semibold"
                >
                  Скинути
                </a>
              )}
            </div>
          </form>

          {/* Live result count for screen readers */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={query ? "os-result-status mt-3" : "sr-only"}
          >
            {query
              ? `Знайдено ${totalResults} ${pluralMaterials(totalResults)} за запитом «${q}»`
              : `Усього ${totalResults} матеріалів`}
          </div>
        </search>

        {/* ── Category navigation ─────────────────────────────────────── */}
        <nav
          id="category-nav"
          aria-label="Рубрики відкритої науки"
          className="mt-4"
        >
          <p className="sr-only">Перейти до рубрики:</p>
          <ul
            role="list"
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {rubricOrder.map((category) => {
              const Icon = rubricIcons[category];
              const count = getRubricCount(category, groupedUpdates, records);
              return (
                <li key={category}>
                  <a
                    href={`#section-${category}`}
                    className="os-cat-chip"
                  >
                    <Icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    {dictionary.openScience.categories[category]}
                    <span aria-label={`${count} матеріалів`} className="font-mono text-xs text-stone-400">
                      {count}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main id="main-content" className="mt-6 grid gap-6">
          {/* Data repository section */}
          <section aria-labelledby="h-data_repository" id="section-data_repository" className="scroll-mt-24">
            <SectionHeader
              id="h-data_repository"
              category="data_repository"
              count={records.length}
              dictionary={dictionary}
            />
            {records.length === 0 ? (
              <EmptySection text="Відкриті набори даних ще не опубліковані." />
            ) : (
              <ol
                role="list"
                className="grid gap-3 md:grid-cols-2"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
                aria-label={`${dictionary.openScience.categories.data_repository}: ${records.length} записів`}
              >
                {records.map((record) => (
                  <li key={record._id ?? record.localId}>
                    <RecordCard record={record} />
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* All other rubric sections */}
          {rubricOrder
            .filter((cat) => cat !== "data_repository")
            .map((category) => (
              <section
                key={category}
                id={`section-${category}`}
                aria-labelledby={`h-${category}`}
                className="scroll-mt-24"
              >
                <SectionHeader
                  id={`h-${category}`}
                  category={category}
                  count={groupedUpdates[category].length}
                  dictionary={dictionary}
                />
                {groupedUpdates[category].length === 0 ? (
                  <EmptySection text="У цій рубриці поки немає опублікованих матеріалів." />
                ) : (
                  <ol
                    role="list"
                    className="grid gap-3 md:grid-cols-2"
                    style={{ listStyle: "none", margin: 0, padding: 0 }}
                    aria-label={`${dictionary.openScience.categories[category]}: ${groupedUpdates[category].length} матеріалів`}
                  >
                    {groupedUpdates[category].map((update) => (
                      <li key={update._id}>
                        <UpdateCard dictionary={dictionary} update={update} />
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
        </main>
      </div>

      <SiteFooter dictionary={dictionary} />
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────────────── */

function SectionHeader({
  id,
  category,
  count,
  dictionary,
}: {
  id: string;
  category: keyof typeof rubricIcons;
  count: number;
  dictionary: Dictionary;
}) {
  const Icon = rubricIcons[category];
  return (
    <div className="mb-3 flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 shadow-sm"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 id={id} className="text-xl font-semibold text-stone-950">
          {dictionary.openScience.categories[category]}
        </h2>
        <p className="text-sm text-stone-500">
          <span aria-hidden="true">{count}</span>
          <span className="sr-only">{count}</span>{" "}
          {count === 1 ? "опублікований матеріал" : "опублікованих матеріалів"}
        </p>
      </div>
    </div>
  );
}

/* ── Update card ─────────────────────────────────────────────────────────── */

function UpdateCard({
  dictionary,
  update,
}: {
  dictionary: Dictionary;
  update: OpenScienceUpdate;
}) {
  const articleId = `update-title-${update._id}`;
  const dateStr = isoDate(update.publishedAt ?? update.updatedAt);

  return (
    <article
      aria-labelledby={articleId}
      className="os-article flex flex-col gap-3"
    >
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-blue-600">
            {dictionary.openScience.categories[update.category]}
          </span>
          {update.license && <LicenseBadge licenseId={update.license} showLink={false} />}
        </div>
        <div className="mt-1 flex items-start justify-between gap-2">
          <h3 id={articleId} className="text-lg font-semibold text-stone-950">
            {update.title}
          </h3>
          <time
            dateTime={dateStr}
            className="shrink-0 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
            aria-label={`Дата публікації: ${formatDate(update.publishedAt ?? update.updatedAt)}`}
          >
            {formatDate(update.publishedAt ?? update.updatedAt)}
          </time>
        </div>
      </header>

      {update.summary && (
        <p className="text-sm leading-6 text-stone-600">{update.summary}</p>
      )}
      {update.content && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">
          {update.content}
        </p>
      )}

      {(update.publicUrl || update.accessibilityNotes) && (
        <div className="flex flex-wrap gap-2">
          {update.publicUrl && (
            <a
              href={update.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="control-primary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
            >
              {dictionary.openScience.openMaterial}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">(відкривається у новій вкладці)</span>
            </a>
          )}
          {update.accessibilityNotes && (
            <details className="os-details">
              <summary>
                <Captions className="h-4 w-4" aria-hidden="true" />
                Інклюзивний опис
              </summary>
              <p className="os-details-body">{update.accessibilityNotes}</p>
            </details>
          )}
        </div>
      )}

      {update.license && <LicenseBlock licenseId={update.license} />}
    </article>
  );
}

/* ── Record card ─────────────────────────────────────────────────────────── */

function RecordCard({ record }: { record: ProjectRecord }) {
  const articleId = `record-title-${record._id ?? record.localId}`;

  return (
    <article
      aria-labelledby={articleId}
      className="os-article flex flex-col gap-3"
    >
      <header>
        <p className="font-mono text-xs text-stone-400">
          <span className="sr-only">Ідентифікатор:</span>
          {record.localId}
        </p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <h3 id={articleId} className="text-lg font-semibold text-stone-950">
            {record.title}
          </h3>
          <Database className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
        </div>
      </header>

      <p className="text-sm leading-6 text-stone-600">
        {record.summary || "Опис набору даних готується."}
      </p>

      {/* Metadata as definition list */}
      <dl className="os-meta" aria-label="Характеристики набору даних">
        <div className="flex gap-1.5">
          <dt>Формат:</dt>
          <dd>
            <span className="border border-stone-200 bg-white/60 px-2 py-0.5 text-stone-600">
              {record.dataFormat || "mixed"}
            </span>
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Файлів:</dt>
          <dd>
            <span className="border border-stone-200 bg-white/60 px-2 py-0.5 text-stone-600">
              {record.rawDataFiles.length}
            </span>
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Доступ:</dt>
          <dd>
            <span className="border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
              Відкритий
            </span>
          </dd>
        </div>
        {record.license && (
          <div className="flex gap-1.5">
            <dt>Ліцензія:</dt>
            <dd>
              <LicenseBadge licenseId={record.license} />
            </dd>
          </div>
        )}
        {(record.zenodoDoi || record.zenodoConceptDoi) && (
          <div className="flex gap-1.5">
            <dt>DOI:</dt>
            <dd>
              <span className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-xs text-indigo-700">
                {record.zenodoDoi || record.zenodoConceptDoi}
              </span>
            </dd>
          </div>
        )}
      </dl>

      {(record.zenodoUrl || record.doi) && (
        <div>
          <a
            href={
              record.zenodoUrl ||
              (record.doi.startsWith("http")
                ? record.doi
                : `https://doi.org/${record.doi}`)
            }
            target="_blank"
            rel="noreferrer"
            className="control-primary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
          >
            Zenodo / DOI
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">(відкривається у новій вкладці)</span>
          </a>
        </div>
      )}

      {record.usageNotes && (
        <details className="os-details">
          <summary>
            <Captions className="h-4 w-4" aria-hidden="true" />
            Примітки до використання
          </summary>
          <p className="os-details-body">{record.usageNotes}</p>
        </details>
      )}

      {record.license && <LicenseBlock licenseId={record.license} />}
    </article>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

function EmptySection({ text }: { text: string }) {
  return (
    <p className="surface-muted border-dashed p-4 text-sm text-stone-500">
      {text}
    </p>
  );
}

/* ── Hero stat ───────────────────────────────────────────────────────────── */

function HeroStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className="text-lg font-semibold text-stone-950" aria-hidden="true">
        {value}
      </p>
      <p className="text-xs text-stone-500">
        <span className="sr-only">{label}: {value}</span>
        <span aria-hidden="true">{label}</span>
      </p>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function groupUpdates(updates: OpenScienceUpdate[]) {
  return rubricOrder
    .filter((category) => category !== "data_repository")
    .reduce(
      (acc, category) => {
        acc[category] = updates.filter((u) => u.category === category);
        return acc;
      },
      {} as Record<
        Exclude<(typeof rubricOrder)[number], "data_repository">,
        OpenScienceUpdate[]
      >,
    );
}

function getRubricCount(
  category: (typeof rubricOrder)[number],
  groupedUpdates: Record<
    Exclude<(typeof rubricOrder)[number], "data_repository">,
    OpenScienceUpdate[]
  >,
  records: ProjectRecord[],
) {
  if (category === "data_repository") return records.length;
  return groupedUpdates[category].length;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function isoDate(value: Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : "";
}

function pluralMaterials(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "матеріал";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100))
    return "матеріали";
  return "матеріалів";
}
