"use client";

import { Moon, SunMedium } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type PrivateTheme = "light" | "soft";

const storageKey = "grant-manager-private-theme";
const changeEvent = "grant-manager-private-theme-change";

function readTheme(): PrivateTheme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(storageKey) === "soft" ? "soft" : "light";
}

function getServerSnapshot(): PrivateTheme {
  return "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}

export function PrivateThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const isSoft = theme === "soft";

  useEffect(() => {
    document.documentElement.dataset.privateTheme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme: PrivateTheme = isSoft ? "light" : "soft";
    window.localStorage.setItem(storageKey, nextTheme);
    document.documentElement.dataset.privateTheme = nextTheme;
    window.dispatchEvent(new Event(changeEvent));
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      aria-label={isSoft ? "Увімкнути світлу тему" : "Увімкнути м'яку темну тему"}
      title={isSoft ? "Світла тема" : "М'яка темна тема"}
      onClick={toggleTheme}
      className="shell-chip inline-flex h-9 items-center gap-2 border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
    >
      {isSoft ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{isSoft ? "Light" : "Soft"}</span>
    </button>
  );
}

