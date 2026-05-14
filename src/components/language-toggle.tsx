"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import type { Locale } from "@/lib/i18n";

const locales: Locale[] = ["uk", "en"];

export function LanguageToggle({
  alternateLocale,
  className = "",
  locale,
}: {
  alternateLocale: Locale;
  className?: string;
  locale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const cleanupTimer = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.removeAttribute("data-language-transition");
    if (cleanupTimer.current) {
      clearTimeout(cleanupTimer.current);
      cleanupTimer.current = null;
    }
  }, [pathname, query]);

  function hrefFor(targetLocale: Locale) {
    const parts = pathname.split("/");
    if (parts[1] === "uk" || parts[1] === "en") {
      parts[1] = targetLocale;
    } else {
      parts.splice(1, 0, targetLocale);
    }
    const nextPath = parts.join("/") || `/${targetLocale}`;
    return query ? `${nextPath}?${query}` : nextPath;
  }

  void alternateLocale;

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>, targetLocale: Locale, href: string) {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    document.documentElement.setAttribute("data-language-transition", "true");

    window.setTimeout(() => {
      router.push(href);
      cleanupTimer.current = window.setTimeout(() => {
        document.documentElement.removeAttribute("data-language-transition");
        cleanupTimer.current = null;
      }, 1300);
    }, 120);
  }

  return (
    <nav aria-label="Language switcher" className={`inline-flex ${className}`}>
      <div className="inline-grid h-9 grid-cols-2 overflow-hidden rounded-full border border-slate-200 bg-white/92 p-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 shadow-sm backdrop-blur-md">
        {locales.map((item) => {
          const isActive = item === locale;
          const label = item === "uk" ? "UK" : "EN";
          const href = hrefFor(item);
          if (isActive) {
            return (
              <span
                key={item}
                aria-current="true"
                className="flex min-w-10 items-center justify-center rounded-full bg-[#0A2640] px-2.5 text-white shadow-sm"
              >
                {label}
              </span>
            );
          }

          return (
            <Link
              key={item}
              href={href}
              hrefLang={item}
              onClick={(event) => handleNavigate(event, item, href)}
              className="flex min-w-10 items-center justify-center rounded-full px-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#0A2640] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65E4A3]"
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
