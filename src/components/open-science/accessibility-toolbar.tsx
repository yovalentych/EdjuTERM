"use client";

import { Captions, Eye, Hand, Moon, Sun, Type } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE = {
  theme:        "grant-manager-private-theme",
  largeText:    "os-large-text",
  highContrast: "os-high-contrast",
  assistive:    "os-assistive",
} as const;

function readStorage(key: string, fallback = "false") {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function AccessibilityToolbar() {
  const [darkMode,     setDarkMode]     = useState(false);
  const [largeText,    setLargeText]    = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [assistive,    setAssistive]    = useState(false);

  // Restore from localStorage on mount and apply to DOM
  useEffect(() => {
    const dm = readStorage(STORAGE.theme)     === "soft";
    const lt = readStorage(STORAGE.largeText) === "true";
    const hc = readStorage(STORAGE.highContrast) === "true";
    const as = readStorage(STORAGE.assistive) === "true";

    setDarkMode(dm);
    setLargeText(lt);
    setHighContrast(hc);
    setAssistive(as);

    document.documentElement.dataset.privateTheme          = dm ? "soft" : "light";
    document.documentElement.dataset.openScienceLargeText  = String(lt);
    document.documentElement.dataset.openScienceContrast   = String(hc);
    document.documentElement.dataset.openScienceAssistive  = String(as);
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    const theme = next ? "soft" : "light";
    document.documentElement.dataset.privateTheme = theme;
    localStorage.setItem(STORAGE.theme, theme);
    // Keep in sync with private shell toggle
    window.dispatchEvent(
      new CustomEvent("grant-manager-private-theme-change", { detail: theme }),
    );
  }

  function toggleLargeText() {
    const next = !largeText;
    setLargeText(next);
    document.documentElement.dataset.openScienceLargeText = String(next);
    localStorage.setItem(STORAGE.largeText, String(next));
  }

  function toggleHighContrast() {
    const next = !highContrast;
    setHighContrast(next);
    document.documentElement.dataset.openScienceContrast = String(next);
    localStorage.setItem(STORAGE.highContrast, String(next));
  }

  function toggleAssistive() {
    const next = !assistive;
    setAssistive(next);
    document.documentElement.dataset.openScienceAssistive = String(next);
    localStorage.setItem(STORAGE.assistive, String(next));
  }

  return (
    <section
      aria-label="Панель інклюзивного доступу"
      className="surface open-science-accessibility p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Інклюзивний режим
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-950">
            Тифло- та сурдодоступність матеріалів
          </h2>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Параметри відображення">
          <button
            type="button"
            aria-pressed={darkMode}
            onClick={toggleDarkMode}
            className="control inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
          >
            {darkMode
              ? <Sun  className="h-4 w-4" aria-hidden="true" />
              : <Moon className="h-4 w-4" aria-hidden="true" />}
            {darkMode ? "Світла тема" : "Темна тема"}
          </button>

          <button
            type="button"
            aria-pressed={largeText}
            onClick={toggleLargeText}
            className="control inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
          >
            <Type className="h-4 w-4" aria-hidden="true" />
            Більший текст
          </button>

          <button
            type="button"
            aria-pressed={highContrast}
            onClick={toggleHighContrast}
            className="control inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Контраст
          </button>

          <button
            type="button"
            aria-pressed={assistive}
            onClick={toggleAssistive}
            className="control inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
          >
            <Captions className="h-4 w-4" aria-hidden="true" />
            Текстові описи
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="surface-muted p-3">
          <Eye className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-stone-900">
            Для screen reader
          </p>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Рубрики мають семантичні секції, матеріали мають короткі описи,
            посилання й текстові нотатки.
          </p>
        </div>
        <div className="surface-muted p-3">
          <Captions className="h-4 w-4 text-cyan-700" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-stone-900">
            Субтитри й транскрипти
          </p>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Для відео, конференцій і доповідей можна додавати нотатку про
            субтитри, стенограму або текстову версію.
          </p>
        </div>
        <div className="surface-muted p-3">
          <Hand className="h-4 w-4 text-amber-700" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-stone-900">
            Сурдодоступність
          </p>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Окремий інклюзивний опис фіксує наявність сурдоперекладу,
            субтитрів або альтернативного текстового матеріалу.
          </p>
        </div>
      </div>
    </section>
  );
}
