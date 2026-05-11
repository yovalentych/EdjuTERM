import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Microscope,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { LanguageToggle } from "@/components/language-toggle";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/current-user";
import { getDictionary, isLocale } from "@/lib/i18n";

// ── Inline CSS for landing-page animations ────────────────────────────────────

const LANDING_CSS = `
@keyframes lp-up {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes lp-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes lp-float {
  0%, 100% { transform: translateY(0);    }
  50%       { transform: translateY(-9px); }
}
@keyframes lp-pulse-ring {
  0%   { box-shadow: 0 0 0 0   rgba(32,107,196,0.36); }
  70%  { box-shadow: 0 0 0 14px rgba(32,107,196,0);   }
  100% { box-shadow: 0 0 0 0   rgba(32,107,196,0);    }
}
@keyframes lp-draw {
  from { stroke-dashoffset: 320; opacity: 0; }
  to   { stroke-dashoffset: 0;   opacity: 1; }
}
@keyframes lp-node {
  from { opacity: 0; transform: scale(0.3); }
  to   { opacity: 1; transform: scale(1);   }
}
@keyframes lp-ticker {
  from { transform: translateX(0);    }
  to   { transform: translateX(-50%); }
}
@keyframes lp-hue {
  0%, 100% { background-position: 0%   50%; }
  50%       { background-position: 100% 50%; }
}
@keyframes lp-border-glow {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1;   }
}

/* ── Hero text stagger ───────────────────────────────────────────────── */
.lp-h1  { animation: lp-up 0.7s cubic-bezier(0.22,1,0.36,1)       both; }
.lp-h2  { animation: lp-up 0.7s 0.08s cubic-bezier(0.22,1,0.36,1) both; }
.lp-h3  { animation: lp-up 0.7s 0.16s cubic-bezier(0.22,1,0.36,1) both; }
.lp-h4  { animation: lp-up 0.7s 0.24s cubic-bezier(0.22,1,0.36,1) both; }
.lp-h5  { animation: lp-up 0.7s 0.32s cubic-bezier(0.22,1,0.36,1) both; }
.lp-vis { animation: lp-in 1.1s 0.25s ease both; }
.lp-flt { animation: lp-float 6s 1s ease-in-out infinite; }

/* ── Feature cards stagger ───────────────────────────────────────────── */
.lp-f1 { animation: lp-up 0.55s 0.05s ease both; }
.lp-f2 { animation: lp-up 0.55s 0.12s ease both; }
.lp-f3 { animation: lp-up 0.55s 0.19s ease both; }
.lp-f4 { animation: lp-up 0.55s 0.26s ease both; }
.lp-f5 { animation: lp-up 0.55s 0.33s ease both; }
.lp-f6 { animation: lp-up 0.55s 0.40s ease both; }

/* ── SVG graph animations ────────────────────────────────────────────── */
.lp-n1 { animation: lp-node 0.45s 0.55s ease both; transform-origin: center; }
.lp-n2 { animation: lp-node 0.45s 0.70s ease both; transform-origin: center; }
.lp-n3 { animation: lp-node 0.45s 0.85s ease both; transform-origin: center; }
.lp-n4 { animation: lp-node 0.45s 1.00s ease both; transform-origin: center; }
.lp-n5 { animation: lp-node 0.45s 1.15s ease both; transform-origin: center; }
.lp-n6 { animation: lp-node 0.45s 1.30s ease both; transform-origin: center; }
.lp-n7 { animation: lp-node 0.45s 1.45s ease both; transform-origin: center; }
.lp-l1 { animation: lp-draw 0.9s 0.65s ease both; stroke-dasharray: 320; }
.lp-l2 { animation: lp-draw 0.9s 0.80s ease both; stroke-dasharray: 320; }
.lp-l3 { animation: lp-draw 0.9s 0.95s ease both; stroke-dasharray: 320; }
.lp-l4 { animation: lp-draw 0.9s 1.10s ease both; stroke-dasharray: 320; }
.lp-l5 { animation: lp-draw 0.9s 1.25s ease both; stroke-dasharray: 320; }
.lp-l6 { animation: lp-draw 0.9s 1.40s ease both; stroke-dasharray: 320; }

/* ── Module ticker ───────────────────────────────────────────────────── */
.lp-tk { animation: lp-ticker 28s linear infinite; }
.lp-ticker:hover .lp-tk { animation-play-state: paused; }

/* ── Gradient text ───────────────────────────────────────────────────── */
.lp-grad {
  background: linear-gradient(135deg,#1a5bac 0%,#206bc4 40%,#4f5ef0 70%,#7c3aed 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: lp-hue 5s ease infinite;
}

/* ── Card hover ──────────────────────────────────────────────────────── */
.lp-card {
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}
.lp-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 0 0 1px #bfdbfe, 0 10px 36px -8px rgba(32,107,196,0.13);
  transform: translateY(-2px);
}
.lp-card:hover .lp-icon { animation: lp-pulse-ring 0.8s ease; }

/* ── Ambient hero glow ───────────────────────────────────────────────── */
.lp-hero-card {
  background: linear-gradient(135deg,#ffffff 0%,rgba(247,250,255,0.98) 100%);
  box-shadow:
    0 1px 2px rgba(24,36,51,0.04),
    0 40px 100px -24px rgba(32,107,196,0.14),
    inset 0 0 0 1px rgba(32,107,196,0.06);
}
.lp-hero-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg,rgba(32,107,196,0.12),rgba(79,94,240,0.06),transparent 60%);
  z-index: -1;
  animation: lp-border-glow 4s ease infinite;
}

/* ── Background ──────────────────────────────────────────────────────── */
.lp-bg {
  background:
    radial-gradient(ellipse 90% 60% at 50% -10%, rgba(32,107,196,0.08), transparent),
    radial-gradient(ellipse 50% 40% at 90% 70%,  rgba(79,94,240,0.05), transparent),
    linear-gradient(180deg,#f0f4f9 0%,#f5f7fb 55%,#edf1f8 100%);
}

/* ── Dot grid ────────────────────────────────────────────────────────── */
.lp-dots {
  background-image: radial-gradient(circle,rgba(32,107,196,0.14) 1px,transparent 1px);
  background-size: 26px 26px;
}

/* ── Step connector line ─────────────────────────────────────────────── */
.lp-step-line::after {
  content: '';
  position: absolute;
  left: 1.875rem;
  top: 3.5rem;
  bottom: -1.5rem;
  width: 2px;
  background: linear-gradient(180deg,#206bc4 0%,rgba(32,107,196,0.08) 100%);
}

/* ── CTA shimmer ─────────────────────────────────────────────────────── */
.lp-cta {
  background: linear-gradient(135deg,#1a5bac 0%,#206bc4 50%,#1a5bac 100%);
  background-size: 200% 100%;
  transition: background-position 400ms ease, box-shadow 200ms ease, transform 150ms ease;
}
.lp-cta:hover {
  background-position: right center;
  box-shadow: 0 10px 28px rgba(32,107,196,0.30), 0 0 0 4px rgba(32,107,196,0.10);
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .lp-h1,.lp-h2,.lp-h3,.lp-h4,.lp-h5,
  .lp-vis,.lp-flt,.lp-f1,.lp-f2,.lp-f3,.lp-f4,.lp-f5,.lp-f6,
  .lp-n1,.lp-n2,.lp-n3,.lp-n4,.lp-n5,.lp-n6,.lp-n7,
  .lp-l1,.lp-l2,.lp-l3,.lp-l4,.lp-l5,.lp-l6,
  .lp-tk,.lp-grad {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    stroke-dashoffset: 0 !important;
    -webkit-text-fill-color: #206bc4;
  }
}
`;

// ── Page component ────────────────────────────────────────────────────────────

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

  const modules = [
    { icon: Database,      label: isUk ? "Реєстр даних"         : "Data Registry",     color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"   },
    { icon: FlaskConical,  label: isUk ? "Експерименти"          : "Experiments",       color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
    { icon: ClipboardList, label: isUk ? "Дослідницький план"    : "Research Plan",     color: "text-cyan-700",   bg: "bg-cyan-50 border-cyan-200"   },
    { icon: Wallet,        label: isUk ? "Кошторис"              : "Budget",            color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200"},
    { icon: CalendarDays,  label: isUk ? "Планування"            : "Planning",          color: "text-amber-700",  bg: "bg-amber-50 border-amber-200"  },
    { icon: GraduationCap, label: isUk ? "Інд. план аспіранта"   : "PhD Plan",          color: "text-rose-700",   bg: "bg-rose-50 border-rose-200"   },
    { icon: BookOpen,      label: isUk ? "Журнал навчання"        : "Learning Journal",  color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
    { icon: Globe,         label: "Open Science",                                        color: "text-teal-700",   bg: "bg-teal-50 border-teal-200"   },
    { icon: FileText,      label: isUk ? "Звіти"                 : "Reports",           color: "text-slate-600",  bg: "bg-slate-50 border-slate-200"  },
    { icon: Microscope,    label: isUk ? "Події"                 : "Events",            color: "text-fuchsia-700",bg: "bg-fuchsia-50 border-fuchsia-200"},
    { icon: BarChart3,     label: isUk ? "Аналітика"             : "Analytics",         color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    { icon: Users,         label: isUk ? "Команда"               : "Team",              color: "text-sky-700",    bg: "bg-sky-50 border-sky-200"     },
  ];

  const features = [
    {
      cls: "lp-f1",
      icon: Database,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
      badge: "FAIR",
      badgeCls: "bg-blue-100 text-blue-700",
      title: isUk ? "Реєстр наукових даних" : "Scientific Data Registry",
      desc: isUk
        ? "FAIR-сумісний каталог датасетів, протоколів, зразків і вихідних матеріалів. Zenodo-інтеграція для DOI."
        : "FAIR-compliant catalog of datasets, protocols, samples and outputs. Zenodo integration for DOI.",
    },
    {
      cls: "lp-f2",
      icon: FlaskConical,
      color: "text-violet-600",
      bg: "bg-violet-50 border-violet-100",
      badge: "Lab",
      badgeCls: "bg-violet-100 text-violet-700",
      title: isUk ? "Журнал експериментів" : "Experiment Journal",
      desc: isUk
        ? "Повний трекінг in silico, in vitro та in vivo досліджень: гіпотези, методи, результати, висновки."
        : "Full tracking of in silico, in vitro and in vivo experiments: hypotheses, methods, results, conclusions.",
    },
    {
      cls: "lp-f3",
      icon: GraduationCap,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-100",
      badge: "PhD",
      badgeCls: "bg-rose-100 text-rose-700",
      title: isUk ? "Індивідуальний план аспіранта" : "PhD Individual Plan",
      desc: isUk
        ? "Структурований планувальник для аспірантури: навчальний план, наукова робота, щорічні робочі плани."
        : "Structured planner for PhD: curriculum, scientific work plan, annual working plans and attestation.",
    },
    {
      cls: "lp-f4",
      icon: Wallet,
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-100",
      badge: "Finance",
      badgeCls: "bg-emerald-100 text-emerald-700",
      title: isUk ? "Кошторис та закупівлі" : "Budget & Procurement",
      desc: isUk
        ? "Бюджетні періоди, позиції витрат і заявки на закупівлю з workflow затвердження та мультивалютною аналітикою."
        : "Budget periods, expense lines and purchase requests with approval workflow and multi-currency analytics.",
    },
    {
      cls: "lp-f5",
      icon: Globe,
      color: "text-teal-700",
      bg: "bg-teal-50 border-teal-100",
      badge: "Open",
      badgeCls: "bg-teal-100 text-teal-700",
      title: isUk ? "Відкрита наука" : "Open Science",
      desc: isUk
        ? "Публічна сторінка проєкту з оновленнями для спільноти. WCAG 2.2-сумісний доступний інтерфейс."
        : "Public project page with community updates. WCAG 2.2 compliant accessible interface.",
    },
    {
      cls: "lp-f6",
      icon: ShieldCheck,
      color: "text-slate-600",
      bg: "bg-slate-50 border-slate-100",
      badge: "Audit",
      badgeCls: "bg-slate-100 text-slate-700",
      title: isUk ? "Аудит та безпека" : "Audit & Security",
      desc: isUk
        ? "Повний журнал аудиту дій, рольова модель доступу, система запрошень та верифікований onboarding."
        : "Full audit log of actions, role-based access control, invitation system and verified onboarding.",
    },
  ];

  const steps = [
    {
      num: "01",
      color: "text-blue-600",
      title: isUk ? "Створіть проєкт" : "Create a project",
      desc: isUk
        ? "Оберіть тип (грант, дисертація, фундаментальний), налаштуйте модулі та запросіть команду."
        : "Choose type (grant, dissertation, fundamental), configure modules and invite your team.",
    },
    {
      num: "02",
      color: "text-violet-600",
      title: isUk ? "Ведіть дослідження" : "Manage research",
      desc: isUk
        ? "Реєструйте дані й протоколи, ведіть журнал експериментів, плануйте задачі й витрати."
        : "Register data and protocols, maintain an experiment journal, plan tasks and expenses.",
    },
    {
      num: "03",
      color: "text-emerald-700",
      title: isUk ? "Публікуйте й звітуйте" : "Publish & report",
      desc: isUk
        ? "Розміщуйте відкриті оновлення, надсилайте дані до Zenodo, генеруйте звіти для фінансуючих органів."
        : "Post open science updates, push data to Zenodo, generate reports for funding bodies.",
    },
  ];

  const stats = [
    { label: "FAIR principles", sub: isUk ? "Findable · Accessible · Interoperable · Reusable" : "Findable · Accessible · Interoperable · Reusable", color: "border-blue-200 bg-blue-50" },
    { label: isUk ? "12 модулів" : "12 modules", sub: isUk ? "Все для наукового проєкту в одному просторі" : "Everything for a research project in one space", color: "border-violet-200 bg-violet-50" },
    { label: "Zenodo · DOI", sub: isUk ? "Пряма інтеграція для відкритого доступу до даних" : "Direct integration for open access to research data", color: "border-emerald-200 bg-emerald-50" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

      <div className="lp-bg min-h-screen text-stone-950">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header className="private-shell-header sticky top-0 z-50 border-b border-slate-200/70 px-5 py-3.5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-blue-200 bg-blue-50 p-1">
                <Image src="/logo.svg" alt="Logo" width={26} height={26} priority />
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  {dictionary.shell.eyebrow.split(" ")[0]}
                </p>
                <p className="text-sm font-semibold leading-tight text-stone-900">
                  {dictionary.shell.projectShortName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <LanguageToggle locale={localeParam} alternateLocale={dictionary.alternateLocale} />
              <Link
                href={`/${localeParam}/open-science`}
                className="control hidden rounded px-3 py-1.5 text-sm font-medium md:inline-flex"
              >
                {dictionary.openScience.publicPage}
              </Link>
              {user ? (
                <Link
                  href={`/${localeParam}/app`}
                  className="control-primary inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-semibold"
                >
                  {dictionary.public.privateArea}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link href={`/${localeParam}/login`} className="control rounded px-4 py-1.5 text-sm font-medium">
                    {dictionary.public.login}
                  </Link>
                  <Link href={`/${localeParam}/register`} className="control-primary inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-semibold">
                    {dictionary.public.register}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-6xl items-center gap-6 px-5 py-12 lg:min-h-[calc(100vh-200px)] lg:grid-cols-[1.05fr_0.95fr] lg:py-16">

          {/* Left: text */}
          <div className="space-y-6">
            <div className="lp-h1">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                {dictionary.public.eyebrow}
              </span>
            </div>

            <h1 className="lp-h2 text-4xl font-bold leading-[1.13] tracking-tight text-stone-950 md:text-5xl">
              <span className="lp-grad">{isUk ? "Наукові проєкти" : "Research projects"}</span>
              <br />
              {isUk ? "під повним контролем" : "fully under control"}
            </h1>

            <p className="lp-h3 max-w-lg text-base leading-8 text-stone-600">
              {isUk
                ? "Інтегрована платформа для управління грантами, дисертаціями й науковими командами. Від реєстрації даних до відкритого доступу."
                : "Integrated platform for managing grants, dissertations and research teams. From data registration to open access."}
            </p>

            <div className="lp-h4 flex flex-wrap gap-3">
              <Link
                href={user ? `/${localeParam}/app` : `/${localeParam}/register`}
                className="lp-cta inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold text-white"
              >
                {user ? dictionary.public.privateArea : (isUk ? "Розпочати безкоштовно" : "Get started free")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${localeParam}/open-science`}
                className="control inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold"
              >
                {dictionary.openScience.publicPage}
              </Link>
            </div>

            <div className="lp-h5 flex flex-wrap gap-2">
              {[
                { label: "FAIR data",   cls: "border-blue-200   bg-blue-50   text-blue-700"   },
                { label: "DOI-ready",   cls: "border-cyan-200   bg-cyan-50   text-cyan-800"   },
                { label: "Zenodo",      cls: "border-violet-200 bg-violet-50 text-violet-700" },
                { label: "WCAG 2.2",    cls: "border-slate-200  bg-slate-50  text-slate-600"  },
                { label: "MongoDB",     cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
              ].map((t) => (
                <span key={t.label} className={`shell-chip rounded border px-2.5 py-1 font-mono text-[11px] font-semibold ${t.cls}`}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: animated research graph */}
          <div className="lp-vis lp-flt relative flex items-center justify-center">
            <div className="relative w-full max-w-[480px]">
              {/* Dots grid backdrop */}
              <div className="lp-dots absolute inset-0 rounded-2xl opacity-60" />

              {/* Glow layer */}
              <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-blue-400/10 to-violet-400/5 blur-2xl" />

              <svg
                viewBox="0 0 480 440"
                className="relative w-full drop-shadow-xl"
                aria-hidden="true"
              >
                {/* ── Connecting lines ── */}
                <line className="lp-l1" x1="240" y1="200" x2="100" y2="80"  stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <line className="lp-l2" x1="240" y1="200" x2="380" y2="80"  stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <line className="lp-l3" x1="240" y1="200" x2="70"  y2="220" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <line className="lp-l4" x1="240" y1="200" x2="410" y2="220" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <line className="lp-l5" x1="240" y1="200" x2="120" y2="350" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <line className="lp-l6" x1="240" y1="200" x2="370" y2="350" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />

                {/* Faint secondary lines */}
                <line x1="100" y1="80" x2="380" y2="80"  stroke="#bfdbfe" strokeWidth="0.75" strokeDasharray="4 6" opacity="0.5" />
                <line x1="70"  y1="220" x2="120" y2="350" stroke="#bfdbfe" strokeWidth="0.75" strokeDasharray="4 6" opacity="0.5" />
                <line x1="410" y1="220" x2="370" y2="350" stroke="#bfdbfe" strokeWidth="0.75" strokeDasharray="4 6" opacity="0.5" />

                {/* ── Central hub node ── */}
                <g className="lp-n1">
                  <circle cx="240" cy="200" r="42" fill="url(#hub-grad)" />
                  <circle cx="240" cy="200" r="42" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
                  <circle cx="240" cy="200" r="50" fill="none" stroke="#93c5fd" strokeWidth="1" opacity="0.2" />
                  <text x="240" y="196" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="monospace">RESEARCH</text>
                  <text x="240" y="210" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9.5" fontFamily="monospace">HUB</text>
                </g>

                {/* ── Satellite nodes ── */}
                {/* Records — top left */}
                <g className="lp-n2">
                  <circle cx="100" cy="80" r="28" fill="white" stroke="#93c5fd" strokeWidth="1.5" />
                  <circle cx="100" cy="80" r="28" fill="rgba(219,234,254,0.5)" />
                  <text x="100" y="76" textAnchor="middle" fill="#1e40af" fontSize="8.5" fontWeight="700">DATA</text>
                  <text x="100" y="88" textAnchor="middle" fill="#3b82f6" fontSize="8" opacity="0.8">Registry</text>
                </g>

                {/* Budget — top right */}
                <g className="lp-n3">
                  <circle cx="380" cy="80" r="28" fill="white" stroke="#6ee7b7" strokeWidth="1.5" />
                  <circle cx="380" cy="80" r="28" fill="rgba(209,250,229,0.5)" />
                  <text x="380" y="76" textAnchor="middle" fill="#065f46" fontSize="8.5" fontWeight="700">BUDGET</text>
                  <text x="380" y="88" textAnchor="middle" fill="#10b981" fontSize="8" opacity="0.8">Finance</text>
                </g>

                {/* Experiments — left */}
                <g className="lp-n4">
                  <circle cx="70" cy="220" r="28" fill="white" stroke="#c4b5fd" strokeWidth="1.5" />
                  <circle cx="70" cy="220" r="28" fill="rgba(237,233,254,0.5)" />
                  <text x="70" y="216" textAnchor="middle" fill="#4c1d95" fontSize="8.5" fontWeight="700">LAB</text>
                  <text x="70" y="228" textAnchor="middle" fill="#7c3aed" fontSize="8" opacity="0.8">Experiments</text>
                </g>

                {/* Open Science — right */}
                <g className="lp-n5">
                  <circle cx="410" cy="220" r="28" fill="white" stroke="#5eead4" strokeWidth="1.5" />
                  <circle cx="410" cy="220" r="28" fill="rgba(204,251,241,0.5)" />
                  <text x="410" y="216" textAnchor="middle" fill="#134e4a" fontSize="8.5" fontWeight="700">OPEN</text>
                  <text x="410" y="228" textAnchor="middle" fill="#0d9488" fontSize="8" opacity="0.8">Science</text>
                </g>

                {/* PhD Plan — bottom left */}
                <g className="lp-n6">
                  <circle cx="120" cy="350" r="28" fill="white" stroke="#fca5a5" strokeWidth="1.5" />
                  <circle cx="120" cy="350" r="28" fill="rgba(254,226,226,0.5)" />
                  <text x="120" y="346" textAnchor="middle" fill="#7f1d1d" fontSize="8.5" fontWeight="700">PhD</text>
                  <text x="120" y="358" textAnchor="middle" fill="#dc2626" fontSize="8" opacity="0.8">Plan</text>
                </g>

                {/* Reports — bottom right */}
                <g className="lp-n7">
                  <circle cx="370" cy="350" r="28" fill="white" stroke="#fcd34d" strokeWidth="1.5" />
                  <circle cx="370" cy="350" r="28" fill="rgba(254,249,195,0.5)" />
                  <text x="370" y="346" textAnchor="middle" fill="#713f12" fontSize="8.5" fontWeight="700">AUDIT</text>
                  <text x="370" y="358" textAnchor="middle" fill="#d97706" fontSize="8" opacity="0.8">Reports</text>
                </g>

                {/* Hub gradient definition */}
                <defs>
                  <radialGradient id="hub-grad" cx="40%" cy="35%" r="60%">
                    <stop offset="0%"   stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Feature badges below diagram */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {isUk ? "Гранти та дисертації" : "Grants & dissertations"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {isUk ? "DOI через Zenodo" : "DOI via Zenodo"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  FAIR data
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── MODULE TICKER ──────────────────────────────────────────────── */}
        <div className="lp-ticker relative overflow-hidden border-y border-slate-200/70 bg-white/60 py-3 backdrop-blur">
          <div className="lp-tk flex w-max gap-3">
            {[...modules, ...modules].map((m, i) => (
              <span
                key={i}
                className={`inline-flex shrink-0 items-center gap-2 rounded border px-3 py-1.5 text-xs font-semibold ${m.bg} ${m.color}`}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="mb-10 text-center">
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-blue-600">
              {isUk ? "Можливості платформи" : "Platform capabilities"}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-stone-950">
              {isUk ? "Всі інструменти наукового проєкту" : "All research project tools"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-500">
              {isUk
                ? "Модульна архітектура дає змогу задіяти лише потрібні інструменти залежно від типу проєкту."
                : "Modular architecture lets you enable only the tools you need based on project type."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`lp-card lp-feat-card surface relative overflow-hidden rounded-xl border p-5 ${f.cls}`}
              >
                {/* Subtle corner gradient */}
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-[3rem] bg-gradient-to-bl opacity-40" style={{ background: `radial-gradient(circle at top right, var(--color-${f.bg.split('-')[1] ?? 'blue'}-100, rgba(219,234,254,0.6)), transparent 70%)` }} />

                <div className="flex items-start gap-3">
                  <div className={`lp-icon icon-tile h-10 w-10 shrink-0 rounded-lg border ${f.bg} ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-900">{f.title}</h3>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${f.badgeCls}`}>
                        {f.badge}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-stone-500">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS STRIP ────────────────────────────────────────────────── */}
        <div className="border-y border-slate-200/70 bg-white/70">
          <div className="mx-auto grid max-w-6xl divide-y divide-slate-100 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className={`flex flex-col items-center px-8 py-8 text-center`}>
                <span className={`mb-2 rounded-full border px-4 py-1.5 font-mono text-sm font-bold ${s.color}`}>
                  {s.label}
                </span>
                <p className="text-xs leading-5 text-slate-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="mb-10">
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-blue-600">
              {isUk ? "Як це працює" : "How it works"}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-stone-950">
              {isUk ? "Три кроки до відтворюваної науки" : "Three steps to reproducible science"}
            </h2>
          </div>

          <div className="grid gap-0 lg:grid-cols-3 lg:gap-6">
            {steps.map((s, i) => (
              <div
                key={s.num}
                className={`relative pb-8 lg:pb-0 ${i < steps.length - 1 ? "lp-step-line lg:lp-step-line-none" : ""}`}
              >
                {/* Connector for desktop */}
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-5 hidden h-0.5 w-full translate-x-1/2 bg-gradient-to-r from-slate-200 to-transparent lg:block" style={{ width: "calc(100% - 4rem)" }} />
                )}

                <div className="flex gap-4 lg:flex-col lg:gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-mono font-bold text-slate-500 shadow-sm">
                    {s.num}
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${s.color}`}>{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ROLES ──────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_16px_48px_-12px_rgba(24,36,51,0.08)]">
            {/* Decorative corner */}
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-[5rem] bg-gradient-to-bl from-blue-100/60 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-tr-[4rem] bg-gradient-to-tr from-violet-100/40 to-transparent" />

            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="icon-tile h-11 w-11 shrink-0 rounded-xl">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">{dictionary.public.rolesTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isUk ? "Чотири рівні доступу для різних учасників наукової роботи" : "Four access levels for different research stakeholders"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { text: dictionary.public.admin,      icon: "⚙", cls: "border-rose-100   bg-rose-50/60   text-rose-900"   },
                  { text: dictionary.public.supervisor,  icon: "🎓", cls: "border-blue-100   bg-blue-50/60   text-blue-900"   },
                  { text: dictionary.public.member,      icon: "🔬", cls: "border-violet-100 bg-violet-50/60 text-violet-900" },
                  { text: dictionary.public.user,        icon: "👤", cls: "border-slate-200  bg-slate-50/60  text-slate-700"  },
                ].map((r) => (
                  <div key={r.text} className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-sm leading-6 ${r.cls}`}>
                    <span className="text-base">{r.icon}</span>
                    <p>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a4fa8] via-[#206bc4] to-[#1d5eb8] p-10 text-center text-white shadow-[0_24px_64px_-16px_rgba(32,107,196,0.45)]">
            {/* Dot grid overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.7) 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
            {/* Glow orbs */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-blue-200">
                {isUk ? "Почніть сьогодні" : "Start today"}
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {isUk ? "Науковий проєкт — під контролем" : "Your research project — in control"}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-blue-100">
                {isUk
                  ? "Зареєструйтесь і створіть перший проєкт за кілька хвилин. Безкоштовно, без обмежень."
                  : "Register and create your first project in minutes. Free, no limitations."}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={user ? `/${localeParam}/app` : `/${localeParam}/register`}
                  className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {user ? dictionary.public.privateArea : (isUk ? "Створити акаунт" : "Create account")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${localeParam}/open-science`}
                  className="inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {dictionary.openScience.publicPage}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter dictionary={dictionary} />
      </div>
    </>
  );
}
