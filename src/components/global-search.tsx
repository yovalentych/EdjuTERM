"use client";

import {
  Calendar,
  Database,
  FolderOpen,
  Layers,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SearchResult } from "@/app/api/search/route";

const TYPE_ICON: Record<SearchResult["type"], React.ReactNode> = {
  project: <FolderOpen className="h-3.5 w-3.5" />,
  record: <Database className="h-3.5 w-3.5" />,
  task: <Layers className="h-3.5 w-3.5" />,
  milestone: <Calendar className="h-3.5 w-3.5" />,
  stage: <Layers className="h-3.5 w-3.5" />,
  message: <MessageSquare className="h-3.5 w-3.5" />,
};

const TYPE_COLOR: Record<SearchResult["type"], string> = {
  project: "bg-blue-50 text-blue-600 border-blue-100",
  record: "bg-emerald-50 text-emerald-600 border-emerald-100",
  task: "bg-amber-50 text-amber-600 border-amber-100",
  milestone: "bg-violet-50 text-violet-600 border-violet-100",
  stage: "bg-indigo-50 text-indigo-600 border-indigo-100",
  message: "bg-slate-50 text-slate-500 border-slate-100",
};

const TYPE_LABEL_UK: Record<SearchResult["type"], string> = {
  project: "Проєкт",
  record: "Запис",
  task: "Задача",
  milestone: "Milestone",
  stage: "Етап",
  message: "Повідомлення",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function GlobalSearch({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResults(data.results ?? []);
          setActive(0);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery, locale]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
      if (e.key === "Escape") closeSearch();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function openSearch() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((v) => Math.min(v + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      window.location.href = results[active].href;
      closeSearch();
    }
  }

  const isUk = locale === "uk";

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={openSearch}
        className="shell-chip flex items-center gap-1.5 border border-stone-200 bg-white/70 px-2 py-1 text-xs text-stone-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        aria-label={isUk ? "Пошук" : "Search"}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{isUk ? "Пошук" : "Search"}</span>
        <kbd className="hidden rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono text-[10px] text-stone-400 sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Overlay + panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-16 z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-2xl">
            {/* Input */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isUk ? "Пошук по проєктах, задачах, записах…" : "Search projects, tasks, records…"}
                className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
              {loading && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              )}
              <button
                type="button"
                onClick={closeSearch}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto py-2">
              {results.length === 0 && query.length >= 2 && !loading && (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  {isUk ? "Нічого не знайдено" : "No results found"}
                </p>
              )}
              {results.length === 0 && query.length < 2 && (
                <p className="px-4 py-4 text-center text-xs text-slate-400">
                  {isUk ? "Введіть мінімум 2 символи" : "Type at least 2 characters"}
                </p>
              )}
              {results.map((result, idx) => (
                <a
                  key={result.id}
                  href={result.href}
                  onClick={closeSearch}
                  className={`flex items-center gap-3 px-4 py-2.5 transition ${
                    idx === active ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setActive(idx)}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${TYPE_COLOR[result.type]}`}>
                    {TYPE_ICON[result.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">{result.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400">
                      <span>{TYPE_LABEL_UK[result.type]}</span>
                      {result.excerpt && <span>· {result.excerpt}</span>}
                      {result.projectName && (
                        <>
                          <span>·</span>
                          <span className="font-mono font-semibold text-blue-500">{result.projectName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
              <span>↑↓ {isUk ? "навігація" : "navigate"}</span>
              <span>↵ {isUk ? "перейти" : "open"}</span>
              <span>Esc {isUk ? "закрити" : "close"}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
