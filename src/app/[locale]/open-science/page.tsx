import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Captions,
  Database,
  ExternalLink,
  Globe,
  KeyRound,
  LockKeyhole,
  Mail,
  Newspaper,
  Presentation,
  Rss,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LicenseBadge, LicenseBlock } from "@/components/license-badge";
import { AccessibilityToolbar } from "@/components/open-science/accessibility-toolbar";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary, isLocale, type Dictionary } from "@/lib/i18n";
import { listPublishedOpenScienceUpdates } from "@/lib/open-science";
import { listAllProjects } from "@/lib/projects";
import { listPublicProjectRecords } from "@/lib/repositories";
import type { OpenScienceUpdate, Project, ProjectRecord } from "@/lib/schemas";

const rubricIcons = {
  data_repository: Database,
  updates: Rss,
  news: Newspaper,
  conferences: Presentation,
  publications: BookOpen,
  protocols: ScrollText,
  outreach: Globe,
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

type CatalogProject = {
  project: Project | null;
  projectId: string;
  title: string;
  acronym: string;
  summary: string;
  type: string;
  visibility: string;
  updates: OpenScienceUpdate[];
  records: ProjectRecord[];
};

export default async function PublicOpenSciencePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; code?: string }>;
}) {
  const [{ locale: localeParam }, { q, code }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!isLocale(localeParam)) notFound();

  const dictionary = getDictionary(localeParam);
  const isUk = localeParam === "uk";
  const [allProjects, allUpdates, allRecords] = await Promise.all([
    listAllProjects(),
    listPublishedOpenScienceUpdates(),
    listPublicProjectRecords(),
  ]);

  const query = q?.trim().toLowerCase() ?? "";
  const accessCode = code?.trim() ?? "";
  const catalog = buildCatalog(allProjects, allUpdates, allRecords)
    .filter((item) => item.updates.length > 0 || item.records.length > 0 || item.project?.openScienceEnabled)
    .filter((item) => {
      if (!query) return true;
      return [
        item.title,
        item.acronym,
        item.summary,
        ...item.updates.flatMap((u) => [u.title, u.summary, u.content]),
        ...item.records.flatMap((r) => [r.title, r.summary]),
      ].some((value) => value?.toLowerCase().includes(query));
    });

  const openItemCount = allUpdates.length + allRecords.length;
  const publicProjectCount = catalog.length;
  const featuredProject = catalog[0] ?? null;
  const latestDate = allUpdates[0]?.publishedAt ?? allUpdates[0]?.updatedAt ?? allRecords[0]?.updatedAt;
  const groupedUpdates = groupUpdates(allUpdates.filter((u) => matchesQuery(u, query)));
  const records = query
    ? allRecords.filter((r) => r.title.toLowerCase().includes(query) || r.summary.toLowerCase().includes(query))
    : allRecords;

  return (
    <div className="open-science-public min-h-screen bg-white text-[#0A2640]">
      <nav aria-label="Навігація по сторінці" className="sr-only sr-only-focusable">
        <a href="#catalog" className="skip-to-content">{isUk ? "Перейти до каталогу" : "Skip to catalog"}</a>
        <a href="#access" className="skip-to-content">{isUk ? "Перейти до доступу" : "Skip to access"}</a>
        <a href="#materials" className="skip-to-content">{isUk ? "Перейти до матеріалів" : "Skip to materials"}</a>
      </nav>

      <header className="relative overflow-hidden bg-[#0A2640] px-5 pb-16 pt-8 text-white">
        <div className="absolute right-0 top-0 h-[420px] w-[58vw] rounded-bl-[180px] bg-[#1C3D5B]" />
        <Image src="/landing/science-blueprint.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-18" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0A2640_0%,rgba(10,38,64,0.92)_48%,rgba(10,38,64,0.72)_100%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <Link href={`/${localeParam}`} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <Image src="/logo.svg" alt="Logo" width={26} height={26} />
              </span>
              <span className="text-xl font-bold">{dictionary.shell.projectShortName}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href={`/${localeParam}/login`} className="hidden rounded-full border border-white px-5 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-[#0A2640] sm:inline-flex">
                {dictionary.public.login}
              </Link>
              <Link href={`/${localeParam}/register`} className="rounded-full bg-[#65E4A3] px-5 py-2 text-sm font-bold text-[#0A2640] transition hover:bg-white">
                {dictionary.public.register}
              </Link>
            </div>
          </div>

          <div className="grid gap-12 pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#65E4A3]">
                <Sparkles className="h-4 w-4" />
                Open Science Portal
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] md:text-6xl">
                {isUk ? "Каталог публічних сторінок досліджень" : "Catalog of public research pages"}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                {isUk
                  ? "Кожен дослідник може створити публічну сторінку свого проєкту: частина матеріалів відкрита одразу, а розширені секції доступні за кодом."
                  : "Each researcher can create a public page for a project: some content is open immediately, while extended sections can be protected by an access code."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#catalog" className="inline-flex items-center gap-2 rounded-full bg-[#65E4A3] px-7 py-3 text-base font-bold text-[#0A2640] transition hover:bg-white">
                  {isUk ? "Переглянути каталог" : "Browse catalog"}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#access" className="inline-flex items-center gap-2 rounded-full border border-white px-7 py-3 text-base font-bold text-white transition hover:bg-white hover:text-[#0A2640]">
                  <KeyRound className="h-4 w-4" />
                  {isUk ? "Маю код доступу" : "I have a code"}
                </a>
              </div>
            </div>

            <div className="rounded-[8px] border border-white/12 bg-white/8 p-4 shadow-[0_34px_90px_-36px_rgba(0,0,0,0.9)] backdrop-blur">
              <div className="relative h-[360px] overflow-hidden rounded-[6px]">
                <Image src="/landing/hero-lab.jpg" alt={isUk ? "Науковці у лабораторії" : "Scientists in a laboratory"} fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A2640] via-[#0A2640]/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
                  <HeroStat label={isUk ? "Сторінки" : "Pages"} value={publicProjectCount} />
                  <HeroStat label={isUk ? "Матеріали" : "Items"} value={openItemCount} />
                  <HeroStat label={isUk ? "Оновлено" : "Updated"} value={latestDate ? formatDate(latestDate) : "—"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white px-5 py-5">
          <div className="mx-auto max-w-6xl">
            <AccessibilityToolbar />
          </div>
        </section>

        <section id="access" className="px-5 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-lg text-slate-500">{isUk ? "Контрольований доступ" : "Controlled access"}</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">
                {isUk ? "Відкрита сторінка може мати закриті секції" : "A public page can include protected sections"}
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                {isUk
                  ? "Публічний шар показує опис, оновлення, відкриті дані й контакти. Закритий шар може містити розширені результати, чернетки, додаткові файли або матеріали для партнерів."
                  : "The public layer shows the description, updates, open data, and contacts. The protected layer can hold extended results, drafts, additional files, or partner-only materials."}
              </p>
            </div>

            <div className="rounded-[8px] bg-[#0A2640] p-6 text-white">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#65E4A3] text-[#0A2640]">
                  <LockKeyhole className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-2xl font-semibold">{isUk ? "Ввести або запросити код" : "Enter or request a code"}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {isUk
                      ? "У наступному кроці цей код буде перевірятися для конкретної публічної сторінки проєкту. Зараз форма вже показує майбутній сценарій доступу."
                      : "In the next step, this code will be validated for a specific project public page. The form already shows the intended access flow."}
                  </p>
                </div>
              </div>

              <form method="get" action={`/${localeParam}/open-science`} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  name="code"
                  defaultValue={accessCode}
                  placeholder={isUk ? "Код доступу до сторінки" : "Project page access code"}
                  className="min-h-12 rounded-full border border-white/20 bg-white px-5 text-[#0A2640] outline-none"
                />
                <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#65E4A3] px-6 text-sm font-bold text-[#0A2640] transition hover:bg-white">
                  <KeyRound className="h-4 w-4" />
                  {isUk ? "Перевірити" : "Check"}
                </button>
              </form>

              {accessCode ? (
                <p className="mt-3 rounded-[8px] border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  {isUk
                    ? "Код прийнято у форму. Повну перевірку й розблокування секцій додамо після введення моделі public page access."
                    : "The code is captured. Full validation and section unlocking will be added with the public page access model."}
                </p>
              ) : null}

              <div className="mt-5 rounded-[8px] border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#65E4A3]">
                  <Mail className="h-4 w-4" />
                  {isUk ? "Немає коду?" : "No code?"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {isUk
                    ? "Відкрийте картку проєкту нижче та надішліть запит автору сторінки. Пізніше це буде окремий workflow із заявками."
                    : "Open a project card below and request access from the page owner. Later this will become a dedicated request workflow."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="catalog" className="bg-slate-50 px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-lg text-slate-500">{isUk ? "Каталог сторінок" : "Page catalog"}</p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight">
                  {isUk ? "Доступні публічні сторінки проєктів" : "Available public project pages"}
                </h2>
              </div>
              <form method="get" action={`/${localeParam}/open-science`} className="flex w-full gap-2 lg:max-w-md">
                <input
                  name="q"
                  type="search"
                  defaultValue={q ?? ""}
                  placeholder={isUk ? "Пошук за назвою, темою, матеріалом…" : "Search by title, topic, material…"}
                  className="min-h-12 flex-1 rounded-full border border-slate-300 px-5 outline-none focus:border-[#0A2640]"
                />
                <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0A2640] px-5 text-white">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {catalog.length === 0 ? (
              <div className="mt-10 rounded-[8px] border border-dashed border-slate-300 bg-white p-8 text-slate-600">
                {isUk ? "Публічні сторінки ще не створені або не відповідають пошуку." : "No public pages have been created yet or matched your search."}
              </div>
            ) : (
              <div className="mt-10 grid gap-6 lg:grid-cols-3">
                {catalog.map((item, index) => (
                  <ProjectPublicCard
                    key={item.projectId}
                    item={item}
                    locale={localeParam}
                    featured={featuredProject?.projectId === item.projectId || index === 0}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[8px] bg-[#0A2640] p-8 text-white md:p-12">
              <Image src="/landing/knowledge-library.jpg" alt="" fill sizes="100vw" className="object-cover opacity-20" />
              <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <p className="text-[#65E4A3]">{isUk ? "Нова універсальна модель" : "New universal model"}</p>
                  <h2 className="mt-3 text-4xl font-semibold leading-tight">
                    {isUk ? "Open Science більше не прив'язана до одного гранта" : "Open Science is no longer tied to one grant"}
                  </h2>
                  <p className="mt-5 text-base leading-7 text-slate-200">
                    {isUk
                      ? "Кожен проєкт зможе мати власну публічну сторінку, свої секції, свої відкриті матеріали й власну політику доступу."
                      : "Each project can have its own public page, sections, open materials, and access policy."}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Globe, label: isUk ? "Відкрите прев'ю" : "Open preview" },
                    { icon: KeyRound, label: isUk ? "Доступ за кодом" : "Code access" },
                    { icon: ShieldCheck, label: isUk ? "Контроль автора" : "Owner control" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[8px] border border-white/10 bg-white/8 p-5 backdrop-blur">
                      <item.icon className="h-6 w-6 text-[#65E4A3]" />
                      <p className="mt-4 font-semibold">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="materials" className="px-5 pb-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-lg text-slate-500">{isUk ? "Відкриті матеріали" : "Open materials"}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              {isUk ? "Останні відкриті оновлення та дані" : "Latest open updates and data"}
            </h2>

            <nav aria-label={isUk ? "Рубрики відкритої науки" : "Open science categories"} className="mt-8 flex gap-2 overflow-x-auto pb-2">
              {rubricOrder.map((category) => {
                const Icon = rubricIcons[category];
                return (
                  <a key={category} href={`#section-${category}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2640] hover:border-[#0A2640]">
                    <Icon className="h-4 w-4" />
                    {dictionary.openScience.categories[category]}
                  </a>
                );
              })}
            </nav>

            <div className="mt-8 grid gap-8">
              <section id="section-data_repository" className="scroll-mt-24">
                <SectionHeader title={dictionary.openScience.categories.data_repository} count={records.length} icon={Database} />
                {records.length === 0 ? (
                  <EmptySection text={isUk ? "Відкриті набори даних ще не опубліковані." : "No open datasets have been published yet."} />
                ) : (
                  <ol role="list" className="grid gap-4 md:grid-cols-2" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {records.slice(0, 8).map((record) => (
                      <li key={record._id ?? record.localId}>
                        <RecordCard record={record} />
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {rubricOrder.filter((cat) => cat !== "data_repository").map((category) => (
                <section key={category} id={`section-${category}`} className="scroll-mt-24">
                  <SectionHeader title={dictionary.openScience.categories[category]} count={groupedUpdates[category].length} icon={rubricIcons[category]} />
                  {groupedUpdates[category].length === 0 ? (
                    <EmptySection text={isUk ? "У цій рубриці поки немає опублікованих матеріалів." : "No published materials in this category yet."} />
                  ) : (
                    <ol role="list" className="grid gap-4 md:grid-cols-2" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {groupedUpdates[category].slice(0, 8).map((update) => (
                        <li key={update._id}>
                          <UpdateCard dictionary={dictionary} update={update} />
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter dictionary={dictionary} />
    </div>
  );
}

function ProjectPublicCard({
  item,
  locale,
  featured,
}: {
  item: CatalogProject;
  locale: string;
  featured: boolean;
}) {
  const isUk = locale === "uk";
  const publicCount = item.updates.length + item.records.length;
  const lockedSections = [
    isUk ? "Розширені результати" : "Extended results",
    isUk ? "Додаткові файли" : "Additional files",
    isUk ? "Партнерські нотатки" : "Partner notes",
  ];

  return (
    <article className={`overflow-hidden rounded-[8px] bg-white shadow-sm ring-1 ring-slate-200 ${featured ? "lg:col-span-2" : ""}`}>
      <div className="relative h-56">
        <Image
          src={featured ? "/landing/hero-lab.jpg" : "/landing/research-management.jpg"}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A2640] via-[#0A2640]/35 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#65E4A3]">
            {item.acronym || item.type || "Research page"}
          </p>
          <h3 className="mt-1 text-2xl font-semibold leading-tight text-white">{item.title}</h3>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm leading-6 text-slate-600">
          {item.summary || (isUk ? "Опис публічної сторінки буде додано автором проєкту." : "The public page description will be added by the project owner.")}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniMetric label={isUk ? "Відкрито" : "Open"} value={publicCount} />
          <MiniMetric label={isUk ? "Дані" : "Data"} value={item.records.length} />
          <MiniMetric label={isUk ? "Оновлення" : "Updates"} value={item.updates.length} />
        </div>

        <div className="mt-5 rounded-[8px] border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0A2640]">
            <LockKeyhole className="h-4 w-4" />
            {isUk ? "Секції за кодом" : "Code-protected sections"}
          </p>
          <div className="flex flex-wrap gap-2">
            {lockedSections.map((section) => (
              <span key={section} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                {section}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href="#materials" className="inline-flex items-center gap-2 rounded-full bg-[#0A2640] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#12385c]">
            {isUk ? "Відкриті матеріали" : "Open materials"}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#access" className="inline-flex items-center gap-2 rounded-full border border-[#0A2640] px-5 py-2.5 text-sm font-bold text-[#0A2640] transition hover:bg-[#0A2640] hover:text-white">
            <Mail className="h-4 w-4" />
            {isUk ? "Запросити код" : "Request code"}
          </a>
        </div>
      </div>
    </article>
  );
}

function SectionHeader({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A2640] text-[#65E4A3]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-slate-500">{count} materials</p>
      </div>
    </div>
  );
}

function UpdateCard({
  dictionary,
  update,
}: {
  dictionary: Dictionary;
  update: OpenScienceUpdate;
}) {
  const dateStr = isoDate((update.publishedAt ?? update.updatedAt) as Date);

  return (
    <article className="flex h-full flex-col gap-3 rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#65E4A3]/20 px-3 py-1 text-xs font-bold uppercase text-[#0A2640]">
            {dictionary.openScience.categories[update.category as keyof typeof dictionary.openScience.categories] ?? update.category}
          </span>
          {update.license && <LicenseBadge licenseId={update.license} showLink={false} />}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold text-[#0A2640]">{update.title}</h3>
          <time dateTime={dateStr} className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
            {formatDate((update.publishedAt ?? update.updatedAt) as Date)}
          </time>
        </div>
      </header>

      {update.summary && <p className="text-sm leading-6 text-slate-600">{update.summary}</p>}
      {update.content && <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{update.content}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        {update.publicUrl && (
          <a href={update.publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0A2640] px-4 py-2 text-sm font-bold text-white">
            {dictionary.openScience.openMaterial}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {update.accessibilityNotes && (
          <details className="w-full rounded-[8px] border border-slate-200 bg-slate-50 p-3">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <Captions className="h-4 w-4" />
              Інклюзивний опис
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate-600">{update.accessibilityNotes}</p>
          </details>
        )}
      </div>

      {update.license && <LicenseBlock licenseId={update.license} />}
    </article>
  );
}

function RecordCard({ record }: { record: ProjectRecord }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <header>
        <p className="font-mono text-xs text-slate-400">{record.localId}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold text-[#0A2640]">{record.title}</h3>
          <Database className="h-5 w-5 shrink-0 text-[#0A2640]" />
        </div>
      </header>

      <p className="text-sm leading-6 text-slate-600">{record.summary || "Опис набору даних готується."}</p>

      <dl className="mt-auto grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <Meta label="Формат" value={record.dataFormat || "mixed"} />
        <Meta label="Файлів" value={String(record.rawDataFiles.length)} />
        <Meta label="Доступ" value="open" />
        {record.license && <Meta label="Ліцензія" value={record.license} />}
      </dl>

      {(record.zenodoUrl || record.doi) && (
        <a
          href={record.zenodoUrl || (record.doi.startsWith("http") ? record.doi : `https://doi.org/${record.doi}`)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0A2640] px-4 py-2 text-sm font-bold text-white"
        >
          Zenodo / DOI
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </article>
  );
}

function EmptySection({ text }: { text: string }) {
  return <p className="rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{text}</p>;
}

function HeroStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[8px] bg-white px-4 py-3 text-[#0A2640] shadow-lg">
      <p className="font-mono text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="font-mono text-lg font-bold text-[#0A2640]">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-mono text-[#0A2640]">{value}</dd>
    </div>
  );
}

function buildCatalog(
  projects: Project[],
  updates: OpenScienceUpdate[],
  records: ProjectRecord[],
): CatalogProject[] {
  const projectById = new Map(projects.map((project) => [project._id ?? "", project]));
  const ids = new Set<string>([
    ...projects.filter((project) => project.openScienceEnabled).map((project) => project._id ?? ""),
    ...updates.map((update) => update.projectId),
    ...records.map((record) => record.projectId),
  ].filter(Boolean));

  return Array.from(ids).map((projectId) => {
    const project = projectById.get(projectId) ?? null;
    const projectUpdates = updates.filter((update) => update.projectId === projectId);
    const projectRecords = records.filter((record) => record.projectId === projectId);
    return {
      project,
      projectId,
      title: project?.title ?? projectUpdates[0]?.title ?? projectRecords[0]?.title ?? "Open science project",
      acronym: project?.acronym ?? "",
      summary: project?.summary ?? projectUpdates[0]?.summary ?? projectRecords[0]?.summary ?? "",
      type: project?.projectType ?? "",
      visibility: project?.visibility ?? "public_profile",
      updates: projectUpdates,
      records: projectRecords,
    };
  });
}

function groupUpdates(updates: OpenScienceUpdate[]) {
  return rubricOrder
    .filter((category) => category !== "data_repository")
    .reduce(
      (acc, category) => {
        acc[category] = updates.filter((u) => u.category === category);
        return acc;
      },
      {} as Record<Exclude<(typeof rubricOrder)[number], "data_repository">, OpenScienceUpdate[]>,
    );
}

function matchesQuery(update: OpenScienceUpdate, query: string) {
  if (!query) return true;
  return [update.title, update.summary, update.content].some((value) => value?.toLowerCase().includes(query));
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
