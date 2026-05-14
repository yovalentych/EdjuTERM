import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Microscope,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

const LANDING_CSS = `
@keyframes public-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.public-marquee-track { animation: public-marquee 30s linear infinite; }
.public-marquee:hover .public-marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .public-marquee-track { animation: none; }
}
`;

export default async function PublicHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const dictionary = getDictionary(localeParam);
  const user = await getCurrentUser();
  const isUk = localeParam === "uk";
  const appHref = user ? `/${localeParam}/app` : `/${localeParam}/register`;

  const modules = [
    { icon: Database, label: isUk ? "Дані" : "Data" },
    { icon: FlaskConical, label: isUk ? "Експерименти" : "Experiments" },
    { icon: ClipboardList, label: isUk ? "План" : "Plan" },
    { icon: Wallet, label: isUk ? "Бюджет" : "Budget" },
    { icon: FileText, label: isUk ? "Звіти" : "Reports" },
    { icon: Globe, label: "Open Science" },
    { icon: GraduationCap, label: isUk ? "PhD план" : "PhD plan" },
    { icon: Users, label: isUk ? "Команда" : "Team" },
  ];

  const services = [
    {
      image: "/landing/science-blueprint.jpg",
      icon: Database,
      title: isUk ? "Дані та протоколи" : "Data and protocols",
      text: isUk
        ? "Каталогізуйте датасети, SOP, рецепти середовищ, методики й матеріали так, щоб їх можна було повторити та опублікувати."
        : "Catalog datasets, SOPs, media recipes, methods, and materials so they can be reproduced and published.",
    },
    {
      image: "/landing/microscopy-work.jpg",
      icon: FlaskConical,
      title: isUk ? "Експерименти й журнал" : "Experiments and journal",
      text: isUk
        ? "Ведіть експеримент як доказовий ланцюжок: гіпотеза, метод, журнал, QC, результат, висновок."
        : "Run experiments as an evidence chain: hypothesis, method, journal, QC, result, conclusion.",
    },
    {
      image: "/landing/research-management.jpg",
      icon: FileText,
      title: isUk ? "Звіти й публікації" : "Reports and outputs",
      text: isUk
        ? "Формуйте звіти, манускрипти, відкриті оновлення й експорт у документи без ручного збирання з різних місць."
        : "Prepare reports, manuscripts, open updates, and document exports without manually stitching work together.",
    },
  ];

  const checks = [
    isUk ? "FAIR-реєстр записів, файлів і версій" : "FAIR registry for records, files, and versions",
    isUk ? "Експериментальний журнал із результатами та QC" : "Experiment journal with results and QC",
    isUk ? "Звіти, DOCX-експорт і відкриті сторінки" : "Reports, DOCX export, and public pages",
  ];

  const workflows = [
    {
      icon: Network,
      title: isUk ? "Зв'язати докази" : "Connect evidence",
      text: isUk ? "Протокол, журнал, файл і результат залишаються пов'язаними." : "Protocol, journal, file, and result remain connected.",
    },
    {
      icon: BarChart3,
      title: isUk ? "Бачити стан" : "See status",
      text: isUk ? "Прогрес, бюджет, задачі й публікації видно в одному контексті." : "Progress, budget, tasks, and publications stay in one context.",
    },
    {
      icon: ShieldCheck,
      title: isUk ? "Контролювати доступ" : "Control access",
      text: isUk ? "Ролі, аудит і командна робота без втрати відповідальності." : "Roles, audit, and teamwork without losing accountability.",
    },
  ];

  const cases = [
    {
      title: isUk ? "Грантовий проєкт" : "Grant project",
      text: isUk
        ? "Команда бачить етапи, витрати, закупівлі, записи, звіти й дедлайни в одному робочому просторі."
        : "The team sees stages, expenses, procurement, records, reports, and deadlines in one workspace.",
      role: isUk ? "PI / керівник" : "PI / supervisor",
    },
    {
      title: isUk ? "Лабораторна серія" : "Lab series",
      text: isUk
        ? "Вимірювання, спектрофотометрія, рецептури середовищ, QC та інтерпретації не губляться між файлами."
        : "Measurements, spectrophotometry, media recipes, QC, and interpretations do not disappear between files.",
      role: isUk ? "Дослідник" : "Researcher",
    },
    {
      title: isUk ? "Дисертація" : "Dissertation",
      text: isUk
        ? "Індивідуальний план, публікації, навчання, експерименти й рукописи збираються у послідовний трек."
        : "Individual plan, publications, learning, experiments, and manuscripts form one coherent track.",
      role: isUk ? "Аспірант" : "PhD student",
    },
  ];

  const faq = [
    {
      q: isUk ? "Чи це тільки для грантів?" : "Is it only for grants?",
      a: isUk ? "Ні. Платформа покриває гранти, дисертації, лабораторні серії, відкриту науку й командне планування." : "No. It covers grants, dissertations, lab series, open science, and team planning.",
    },
    {
      q: isUk ? "Що з документами?" : "What about documents?",
      a: isUk ? "Звіти вже мають експорт, а редактор великих текстів поступово переводимо на Quill." : "Reports already have export, and long-form text editing is being moved to Quill step by step.",
    },
    {
      q: isUk ? "Чи можна публікувати дані?" : "Can data be published?",
      a: isUk ? "Так, закладена логіка Open Science та інтеграція з Zenodo/DOI для відкритих результатів." : "Yes, Open Science and Zenodo/DOI workflows are part of the system.",
    },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <main className="min-h-screen bg-white text-[#0A2640]">
        <header className="absolute left-0 right-0 top-0 z-50 px-5 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <Link href={`/${localeParam}`} className="flex items-center gap-3 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <Image src="/logo.svg" alt="Logo" width={26} height={26} priority />
              </span>
              <span className="text-xl font-bold">{dictionary.shell.projectShortName}</span>
            </Link>

            <div className="flex items-center justify-end gap-2">
              <div className="hidden md:block">
                <LanguageToggle locale={localeParam} alternateLocale={dictionary.alternateLocale} />
              </div>
              <Link href={`/${localeParam}/open-science`} className="hidden px-3 py-2 text-sm font-semibold text-white/90 hover:text-white md:inline-flex">
                Open Science
              </Link>
              {user ? (
                <Link href={`/${localeParam}/app`} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0A2640] transition hover:bg-[#65E4A3]">
                  {dictionary.public.privateArea}
                </Link>
              ) : (
                <>
                  <Link href={`/${localeParam}/login`} className="hidden px-3 py-2 text-sm font-semibold text-white/90 hover:text-white sm:inline-flex">
                    {dictionary.public.login}
                  </Link>
                  <Link href={`/${localeParam}/register`} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0A2640] transition hover:bg-[#65E4A3]">
                    {dictionary.public.register}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden bg-[#0A2640] px-5 pb-12 pt-28 text-white md:pb-20 md:pt-36">
          <div className="absolute right-0 top-0 h-[420px] w-[58vw] rounded-bl-[180px] bg-[#1C3D5B]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(101,228,163,0.18),transparent_24rem)]" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#65E4A3]">
                <Sparkles className="h-4 w-4" />
                {dictionary.public.eyebrow}
              </p>
              <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] md:text-6xl">
                {isUk ? "Науковий проєкт без хаосу в документах" : "Research projects without document chaos"}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
                {isUk
                  ? "Research Navigator збирає лабораторні записи, протоколи, експерименти, бюджет, звіти та відкриту науку в один керований простір."
                  : "Research Navigator brings lab records, protocols, experiments, budget, reports, and open science into one controlled workspace."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={appHref} className="inline-flex items-center gap-2 rounded-full bg-[#65E4A3] px-7 py-3 text-base font-bold text-[#0A2640] transition hover:bg-white">
                  {user ? dictionary.public.privateArea : (isUk ? "Почати роботу" : "Start now")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={`/${localeParam}/open-science`} className="inline-flex items-center gap-2 rounded-full border border-white px-7 py-3 text-base font-bold text-white transition hover:bg-white hover:text-[#0A2640]">
                  {isUk ? "Дивитись публічну сторінку" : "Explore public page"}
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-[8px] border border-white/10 bg-white/8 p-3 shadow-[0_34px_90px_-36px_rgba(0,0,0,0.9)] backdrop-blur">
                <div className="relative h-[330px] overflow-hidden rounded-[6px] md:h-[430px]">
                  <Image
                    src="/landing/hero-lab.jpg"
                    alt={isUk ? "Науковці у лабораторії" : "Scientists in a laboratory"}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2640] via-[#0A2640]/20 to-transparent" />
                </div>
                <div className="absolute bottom-7 left-7 right-7 grid gap-3 sm:grid-cols-3">
                  {[
                    ["128", isUk ? "записів" : "records"],
                    ["24", isUk ? "досліди" : "experiments"],
                    ["91%", "QC pass"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[8px] bg-white px-4 py-3 text-[#0A2640] shadow-lg">
                      <p className="font-mono text-2xl font-bold">{value}</p>
                      <p className="text-xs font-semibold text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="public-marquee relative mx-auto mt-12 max-w-6xl overflow-hidden border-y border-white/12 py-5">
            <div className="public-marquee-track flex w-max gap-10">
              {[...modules, ...modules].map((module, index) => (
                <div key={`${module.label}-${index}`} className="flex shrink-0 items-center gap-2 text-white/76">
                  <module.icon className="h-5 w-5 text-[#65E4A3]" />
                  <span className="text-lg font-bold">{module.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-lg text-slate-500">{isUk ? "Основні можливості" : "Core services"}</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-center text-4xl font-semibold leading-tight md:text-5xl">
              {isUk ? "Платформа покриває повний цикл дослідження" : "A platform for the full research cycle"}
            </h2>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {services.map((service) => (
                <article key={service.title} className="group">
                  <div className="relative h-64 overflow-hidden rounded-[8px] bg-slate-100">
                    <Image src={service.image} alt="" fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#0A2640] text-[#65E4A3]">
                      <service.icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-2xl font-semibold">{service.title}</h3>
                  </div>
                  <p className="mt-3 text-base leading-7 text-slate-600">{service.text}</p>
                  <Link href={appHref} className="mt-5 inline-flex items-center gap-2 border-b-2 border-[#0A2640] pb-1 text-base font-bold text-[#0A2640]">
                    {isUk ? "Перейти" : "Explore"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
            <div className="relative">
              <div className="relative h-[520px] overflow-hidden rounded-[8px]">
                <Image src="/landing/microscopy-work.jpg" alt={isUk ? "Мікроскопічна лабораторна робота" : "Microscopy lab work"} fill sizes="(max-width: 1024px) 100vw, 540px" className="object-cover" />
              </div>
              <div className="absolute -bottom-10 left-10 w-72 rounded-[8px] bg-[#0A2640] p-6 text-white shadow-2xl">
                <p className="text-sm font-semibold text-[#65E4A3]">{isUk ? "Живий статус" : "Live status"}</p>
                <div className="mt-5 flex h-28 items-end gap-2">
                  {[35, 46, 64, 52, 78, 70, 92].map((height, index) => (
                    <div key={index} className="flex-1 rounded-t bg-[#65E4A3]" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-semibold leading-tight">
                {isUk ? "З'єднуємо лабораторну роботу з управлінням проєктом" : "Connect lab work with project management"}
              </h2>
              <div className="mt-8 space-y-5">
                {checks.map((item) => (
                  <div key={item} className="flex items-center gap-4 text-lg">
                    <CheckCircle2 className="h-8 w-8 shrink-0 text-[#0A2640]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href={appHref} className="mt-9 inline-flex rounded-full bg-[#0A2640] px-7 py-3 text-base font-bold text-white transition hover:bg-[#12385c]">
                {isUk ? "Відкрити систему" : "Open system"}
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-4xl font-semibold leading-tight">
                {isUk ? "Робочі фічі, а не просто красиві сторінки" : "Operational features, not just good-looking pages"}
              </h2>
              <div className="mt-8 space-y-5">
                {workflows.map((item, index) => (
                  <div key={item.title} className={`flex items-start gap-4 rounded-[8px] p-5 shadow-sm ${index === 0 ? "bg-[#0A2640] text-white" : "bg-white text-[#0A2640] ring-1 ring-slate-200"}`}>
                    <item.icon className={`mt-1 h-7 w-7 shrink-0 ${index === 0 ? "text-[#65E4A3]" : "text-[#0A2640]"}`} />
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <p className={`mt-1 text-sm leading-6 ${index === 0 ? "text-slate-200" : "text-slate-600"}`}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[8px]">
              <Image src="/landing/research-management.jpg" alt={isUk ? "Керування дослідженням" : "Research management"} fill sizes="(max-width: 1024px) 100vw, 540px" className="object-cover" />
              <div className="absolute inset-x-8 bottom-8 rounded-[8px] bg-white p-5 shadow-xl">
                <p className="text-sm font-semibold text-slate-500">{isUk ? "Контур роботи" : "Workflow loop"}</p>
                <p className="mt-1 text-xl font-bold text-[#0A2640]">{isUk ? "План → дослід → дані → звіт" : "Plan → experiment → data → report"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0A2640] px-5 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h2 className="max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
                {isUk ? "Сценарії, для яких система реально корисна" : "Use cases where the system is actually useful"}
              </h2>
              <div className="flex gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0A2640]">←</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0A2640]">→</span>
              </div>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {cases.map((item) => (
                <article key={item.title} className="rounded-[8px] bg-white p-8 text-[#0A2640]">
                  <h3 className="text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-5 text-lg leading-8 text-slate-700">{item.text}</p>
                  <div className="mt-8 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A2640] text-[#65E4A3]">
                      <Microscope className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold">{item.role}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="relative h-[360px] overflow-hidden rounded-[8px] md:h-[430px]">
              <Image src="/landing/knowledge-library.jpg" alt={isUk ? "Наукова бібліотека і знання" : "Scientific knowledge library"} fill sizes="100vw" className="object-cover" />
            </div>
            <div className="mt-12 grid gap-10 lg:grid-cols-2">
              <h2 className="text-4xl font-semibold leading-tight">
                {isUk ? "Публічна наука, внутрішня дисципліна й документи в одному продукті" : "Public science, internal discipline, and documents in one product"}
              </h2>
              <div className="space-y-3">
                {faq.map((item) => (
                  <details key={item.q} className="group border-b border-slate-200 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-semibold">
                      {item.q}
                      <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-base leading-7 text-slate-600">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[8px] bg-[#0A2640] px-6 py-14 text-center text-white md:px-16">
            <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
              {isUk ? "Почніть збирати дослідження як систему" : "Start treating research as a system"}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              {isUk
                ? "Створіть робочий простір і поступово підключайте модулі: записи, експерименти, звіти, манускрипти та відкриту науку."
                : "Create a workspace and progressively connect records, experiments, reports, manuscripts, and open science."}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href={appHref} className="inline-flex items-center gap-2 rounded-full bg-[#65E4A3] px-7 py-3 text-base font-bold text-[#0A2640] transition hover:bg-white">
                {user ? dictionary.public.privateArea : dictionary.public.register}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/${localeParam}/login`} className="inline-flex rounded-full border border-white px-7 py-3 text-base font-bold text-white transition hover:bg-white hover:text-[#0A2640]">
                {dictionary.public.login}
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter dictionary={dictionary} />
      </main>
    </>
  );
}
