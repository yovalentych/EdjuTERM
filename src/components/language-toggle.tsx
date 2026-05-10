import { Languages } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function LanguageToggle({
  alternateLocale,
  className = "",
  locale,
}: {
  alternateLocale: Locale;
  className?: string;
  locale: Locale;
}) {
  const currentLabel = locale.toUpperCase();
  const alternateLabel = alternateLocale.toUpperCase();

  return (
    <div
      className={`inline-flex items-center gap-1 border border-emerald-100 bg-white/75 p-1 text-xs font-semibold shadow-sm backdrop-blur ${className}`}
      aria-label="Language switcher"
    >
      <span className="flex h-7 items-center gap-1 bg-gradient-to-r from-emerald-100 to-cyan-100 px-2 text-emerald-900">
        <Languages className="h-3.5 w-3.5" />
        {currentLabel}
      </span>
      <Link
        href={`/${alternateLocale}`}
        hrefLang={alternateLocale}
        className="flex h-7 items-center px-2 text-stone-500 transition hover:bg-stone-50 hover:text-emerald-800"
      >
        {alternateLabel}
      </Link>
    </div>
  );
}
