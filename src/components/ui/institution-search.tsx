"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Loader2, MapPin } from "lucide-react";
import type { Institution } from "@/lib/institutions";

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

const inputCls =
  "w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200";

interface InstitutionSearchProps {
  /** Required for uncontrolled / FormData usage */
  name?: string;
  defaultValue?: string;
  /** Controlled mode */
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function InstitutionSearch({
  name,
  defaultValue = "",
  value: controlledValue,
  onChange,
  placeholder = "Назва установи / університету",
  className = "",
}: InstitutionSearchProps) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = isControlled ? controlledValue : uncontrolled;
  function setValue(v: string) {
    if (isControlled) onChange?.(v);
    else setUncontrolled(v);
  }
  const [results, setResults] = useState<Institution[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const debouncedQuery = useDebounce(value, 280);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/institutions?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data.results ?? []);
        setOpen((data.results?.length ?? 0) > 0);
        setActive(0);
      })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectItem(inst: Institution) {
    setValue(inst.name);
    setOpen(false);
    setResults([]);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) return;
    const total = results.length + 1; // +1 for "Інше"
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, total - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (active < results.length && results[active]) selectItem(results[active]);
      else setOpen(false); // "Інше" — just close, keep typed value
    }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          {...(name ? { name } : {})}
          value={value}
          onChange={(e) => { setValue(e.target.value); }}
          onFocus={() => { if (value.length >= 2) setOpen(true); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          autoComplete="off"
          className={`${inputCls} pl-8 pr-7`}
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {open && (results.length > 0 || debouncedQuery.length >= 2) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.14)]">
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.map((inst, i) => (
              <li
                key={`${inst.name}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); selectItem(inst); }}
                className={`flex cursor-pointer flex-col gap-0 px-3 py-2 text-sm transition-colors ${
                  i === active ? "bg-blue-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="font-medium text-slate-900 leading-snug">{inst.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  {inst.shortName && <span>{inst.shortName}</span>}
                  {inst.shortName && inst.city && <span>·</span>}
                  {inst.city && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />{inst.city}
                    </span>
                  )}
                  {inst.type && (
                    <span className="ml-auto rounded bg-slate-100 px-1.5 py-px text-[10px] text-slate-500">{inst.type}</span>
                  )}
                </span>
              </li>
            ))}
            {/* "Інше" — always shown as last option so user can confirm free text */}
            <li
              role="option"
              aria-selected={active === results.length}
              onMouseEnter={() => setActive(results.length)}
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); inputRef.current?.focus(); }}
              className={`flex cursor-pointer items-center gap-2 border-t border-slate-100 px-3 py-2 text-sm transition-colors ${
                active === results.length ? "bg-slate-50" : "hover:bg-slate-50"
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px] font-bold text-slate-400">?</span>
              <span className="text-slate-500">Інше — ввести вручну</span>
              {value && results.length === 0 && (
                <span className="ml-auto max-w-[140px] truncate text-[11px] text-slate-400 italic">«{value}»</span>
              )}
            </li>
          </ul>
          <div className="border-t border-slate-100 px-3 py-1.5">
            <p className="text-[10px] text-slate-400">Джерело: ЄДЕБО · Реєстр НАН України</p>
          </div>
        </div>
      )}
    </div>
  );
}
