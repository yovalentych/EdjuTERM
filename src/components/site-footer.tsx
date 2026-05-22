import {
  ArrowRight,
  Atom,
  BookOpen,
  Code2,
  Compass,
  ExternalLink,
  FlaskConical,
  Globe,
  GraduationCap,
  Heart,
  Landmark,
  Mail,
  MessageSquare,
  Scale,
  Send,
  Share2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Dictionary } from "@/lib/i18n";

const APP_VERSION = "v1.0.4 · Build 42";

export function SiteFooter({ dictionary }: { dictionary: Dictionary }) {
  const isUk = dictionary.alternateLocale === "en";
  const year = new Date().getFullYear();

  const productLinks = [
    { label: isUk ? "Можливості" : "Features",        href: "/#features",      Icon: Sparkles },
    { label: isUk ? "Простори"   : "Workspaces",      href: "/#workspace",     Icon: Compass },
    { label: isUk ? "Лабораторія": "Laboratory",      href: "/#laboratory",    Icon: FlaskConical },
    { label: isUk ? "Дорожня карта": "Roadmap",       href: "/#roadmap",       Icon: ArrowRight },
  ];

  const resourceLinks = [
    { label: isUk ? "Документація" : "Documentation",  href: "/docs",       Icon: BookOpen },
    { label: isUk ? "Open Science" : "Open Science",   href: "/open-science", Icon: Globe },
    { label: "API",                                    href: "/docs/api",   Icon: Atom },
    { label: isUk ? "Для викладачів": "For teachers",  href: "/for-teachers", Icon: GraduationCap },
  ];

  const legalLinks = [
    { label: isUk ? "Умови використання" : "Terms",       href: "/terms" },
    { label: isUk ? "Конфіденційність"   : "Privacy",     href: "/privacy" },
    { label: isUk ? "Cookies"            : "Cookies",     href: "/cookies" },
    { label: isUk ? "Контакти"           : "Contact",     href: "/contact" },
  ];

  const socials = [
    { label: "GitHub",        href: "https://github.com/",                Icon: Code2 },
    { label: "X / Twitter",   href: "https://x.com/",                     Icon: MessageSquare },
    { label: isUk ? "Поділитись" : "Share", href: "https://linkedin.com/", Icon: Share2 },
    { label: "Email",         href: "mailto:hello@researchnavigator.app", Icon: Mail },
  ];

  return (
    <footer className="site-footer mt-auto bg-[#0A2640] text-slate-200">
      {/* ── Hero strip ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
                <Image src="/logo.svg" alt="Research Navigator" width={24} height={24} />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">Research Navigator</span>
            </div>
            <h3 className="max-w-xl text-2xl font-bold leading-tight text-white">
              {isUk
                ? "Один простір — для лабораторій, дисертацій, грантів і освітніх програм."
                : "One workspace — for labs, dissertations, grants, and academic programs."}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              {isUk
                ? "Сучасний інструмент для наукових команд: FAIR-дані, GLP-журнали, відкритий код. Synсхронізовано між веб і мобільним."
                : "A modern tool for research teams: FAIR data, GLP journals, open source. Synced between web and mobile."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A2640] transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                <Sparkles className="h-4 w-4" />
                {isUk ? "Спробувати безкоштовно" : "Try for free"}
              </Link>
              <Link
                href="/open-science"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {isUk ? "Дізнатись більше" : "Learn more"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <form
            action="/api/newsletter/subscribe"
            method="POST"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <Send className="h-3 w-3" />
              Newsletter
            </div>
            <h4 className="text-base font-bold text-white">
              {isUk ? "Оновлення продукту, раз на місяць" : "Product updates, once a month"}
            </h4>
            <p className="mt-1.5 text-xs leading-5 text-slate-300">
              {isUk
                ? "Нові фічі, кейси з лабораторій, поради з open science."
                : "New features, lab case studies, open science tips."}
            </p>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder={isUk ? "ваш@email.com" : "your@email.com"}
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#0A2640] transition hover:bg-emerald-100"
              >
                <Send className="h-3.5 w-3.5" />
                {isUk ? "Підписка" : "Subscribe"}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              {isUk ? "Без спаму. Відписка одним кліком." : "No spam. One-click unsubscribe."}
            </p>
          </form>
        </div>
      </div>

      {/* ── Link grid ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Product */}
          <FooterColumn title={isUk ? "Продукт" : "Product"}>
            {productLinks.map((l) => (
              <FooterLink key={l.href} href={l.href} Icon={l.Icon}>{l.label}</FooterLink>
            ))}
          </FooterColumn>

          {/* Resources */}
          <FooterColumn title={isUk ? "Ресурси" : "Resources"}>
            {resourceLinks.map((l) => (
              <FooterLink key={l.href} href={l.href} Icon={l.Icon}>{l.label}</FooterLink>
            ))}
          </FooterColumn>

          {/* Legal */}
          <FooterColumn title={isUk ? "Юридичне" : "Legal"}>
            {legalLinks.map((l) => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterColumn>

          {/* Mobile app */}
          <FooterColumn title={isUk ? "Мобільний застосунок" : "Mobile app"}>
            <p className="mb-3 text-xs leading-5 text-slate-400">
              {isUk
                ? "Доступ до простору з телефону: лабораторія, навчання, проєкти."
                : "Access your workspace from anywhere: laboratory, learning, projects."}
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://apps.apple.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold text-white transition hover:border-emerald-400/40 hover:bg-black/60"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Download</span>
                  <span className="block">App Store</span>
                </span>
              </a>
              <a
                href="https://play.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold text-white transition hover:border-emerald-400/40 hover:bg-black/60"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Get on</span>
                  <span className="block">Google Play</span>
                </span>
              </a>
            </div>
          </FooterColumn>
        </div>

        {/* Standards badges */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isUk ? "Стандарти" : "Standards"}
          </span>
          {[
            { icon: <BookOpen className="h-3 w-3" />, label: "FAIR data" },
            { icon: <FlaskConical className="h-3 w-3" />, label: "GLP/GMP-ready" },
            { icon: <Landmark className="h-3 w-3" />, label: "DOI · ORCID" },
            { icon: <Scale className="h-3 w-3" />, label: "Open Access" },
            { icon: <Atom className="h-3 w-3" />, label: "Open Source" },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200"
            >
              {b.icon}
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────── */}
      <div className="border-t border-white/10 bg-[#06192B]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {year} Research Navigator</span>
            <span className="hidden h-3 w-px bg-slate-700 md:inline-block" />
            <span className="font-mono tracking-wide text-slate-500">{APP_VERSION}</span>
            <span className="hidden h-3 w-px bg-slate-700 md:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              {isUk ? "Зроблено з" : "Made with"}
              <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
              {isUk ? "в Україні" : "in Ukraine"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-400/40 hover:bg-white/10 hover:text-white"
              >
                <s.Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
  Icon,
  external,
}: {
  href: string;
  children: React.ReactNode;
  Icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}) {
  const isExternal = external || href.startsWith("http");
  const className =
    "group inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white";

  const content = (
    <>
      {Icon ? <Icon className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-emerald-400" /> : null}
      <span>{children}</span>
      {isExternal && <ExternalLink className="h-3 w-3 text-slate-500 opacity-0 transition group-hover:opacity-100" />}
    </>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
