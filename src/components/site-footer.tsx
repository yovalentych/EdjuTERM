import {
  BookOpen,
  ExternalLink,
  FlaskConical,
  GitBranch,
  Globe,
  Landmark,
  Scale,
} from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

const instituteUrl =
  "https://biph.kiev.ua/uk/%D0%93%D0%BE%D0%BB%D0%BE%D0%B2%D0%BD%D0%B0_%D1%81%D1%82%D0%BE%D1%80%D1%96%D0%BD%D0%BA%D0%B0";

const fairLinks = [
  {
    label: "FAIR · МОН України",
    sublabel: "nauka.gov.ua",
    href: "https://nauka.gov.ua/information/pryntsypy-fair-dlia-doslidnytskykh-danykh/",
    accent: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100",
    dot: "bg-blue-500",
  },
  {
    label: "GO FAIR · Principles",
    sublabel: "go-fair.org",
    href: "https://www.go-fair.org/fair-principles/",
    accent: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100",
    dot: "bg-violet-500",
  },
];

export function SiteFooter({ dictionary }: { dictionary: Dictionary }) {
  const d = dictionary.footer;

  return (
    <footer className="site-footer border-t border-slate-200 bg-white text-slate-600">
      {/* Main grid */}
      <div className="relative mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_1fr]">

          {/* ── Col 1: Institute ─────────────────────────────────────────── */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-blue-200 bg-blue-50 font-mono text-xs font-bold text-blue-700">
                {d.instituteMark}
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {d.instituteMark}
              </p>
            </div>
            <p className="mb-1 text-sm font-semibold text-slate-900">
              {d.instituteName}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {d.affiliation}
            </p>
            <Link
              href={instituteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {d.instituteLink}
            </Link>
          </div>

          {/* ── Col 2: Open Science + FAIR links ─────────────────────────── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Open Science
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {d.openScience}
            </p>

            {/* FAIR links */}
            <div className="mt-4 space-y-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                FAIR Principles
              </p>
              {fairLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 border px-3 py-2.5 text-xs transition hover:-translate-y-0.5 ${link.accent}`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${link.dot}`} />
                  <span className="flex-1 font-semibold">{link.label}</span>
                  <span className="shrink-0 font-mono text-[10px] opacity-60">
                    {link.sublabel}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                </a>
              ))}
            </div>
          </div>

          {/* ── Col 3: Open Source + standards ───────────────────────────── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Open Source
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {d.openSource}
            </p>

            {/* Standard badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: <BookOpen className="h-3 w-3" />, label: "FAIR data" },
                { icon: <FlaskConical className="h-3 w-3" />, label: "DMP-ready" },
                { icon: <Landmark className="h-3 w-3" />, label: "DOI-ready" },
                { icon: <Scale className="h-3 w-3" />, label: "Open Access" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                >
                  {b.icon}
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>{d.builtFor}</span>
          <span className="font-mono tracking-wide text-slate-500">
            Findable · Accessible · Interoperable · Reusable
          </span>
        </div>
      </div>
    </footer>
  );
}
