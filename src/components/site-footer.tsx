import { ExternalLink, GitBranch, Landmark, Microscope } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

const instituteUrl =
  "https://biph.kiev.ua/uk/%D0%93%D0%BE%D0%BB%D0%BE%D0%B2%D0%BD%D0%B0_%D1%81%D1%82%D0%BE%D1%80%D1%96%D0%BD%D0%BA%D0%B0";

export function SiteFooter({ dictionary }: { dictionary: Dictionary }) {
  return (
    <footer className="border-t border-stone-800 bg-stone-950 px-5 py-8 text-stone-200">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-emerald-400 bg-emerald-500 text-sm font-bold text-stone-950">
            {dictionary.footer.instituteMark}
          </div>
          <div>
            <p className="font-semibold text-white">
              {dictionary.footer.instituteName}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
              {dictionary.footer.affiliation}
            </p>
            <Link
              href={instituteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              {dictionary.footer.instituteLink}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="border border-stone-800 bg-stone-900 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Microscope className="h-4 w-4 text-emerald-300" />
              Open science
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              {dictionary.footer.openScience}
            </p>
          </div>
          <div className="border border-stone-800 bg-stone-900 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <GitBranch className="h-4 w-4 text-cyan-300" />
              Open source
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              {dictionary.footer.openSource}
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-2 border-t border-stone-800 pt-4 text-xs text-stone-500 md:flex-row md:items-center md:justify-between">
        <span>{dictionary.footer.builtFor}</span>
        <span className="inline-flex items-center gap-2">
          <Landmark className="h-3.5 w-3.5" />
          FAIR · DMP · DOI-ready
        </span>
      </div>
    </footer>
  );
}
