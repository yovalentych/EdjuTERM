"use client";

import { useEffect, useState } from "react";
import {
  Building2, Check, CheckCircle2, ExternalLink, Globe2, Loader2, Search, Sparkles, X,
} from "lucide-react";

type RegisteredResult = {
  id: string;
  name: string;
  shortName: string;
  type: string;
  city: string;
  country: string;
  isVerified: boolean;
};

type EdboResult = {
  name: string;
  shortName: string;
  city: string;
  type: string;
};

type SearchResponse = {
  registered: RegisteredResult[];
  edbo: EdboResult[];
};

export type InstitutionPickerValue = {
  id: string;        // empty якщо тільки name (з ЄДЕБО або вручну)
  name: string;
  shortName?: string;
} | null;

export function InstitutionPicker({
  value,
  valueName,
  onChange,
  locale,
}: {
  value: string;          // institutionId (із workspace.fields.institutionId)
  valueName: string;      // name fallback
  onChange: (institution: InstitutionPickerValue) => void;
  locale: "uk" | "en";
}) {
  const isUk = locale === "uk";
  const [query, setQuery] = useState("");
  const [registered, setRegistered] = useState<RegisteredResult[]>([]);
  const [edbo, setEdbo] = useState<EdboResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<{ id: string; name: string; shortName?: string; isVerified?: boolean } | null>(
    value || valueName
      ? { id: value, name: valueName || "—", shortName: "", isVerified: false }
      : null,
  );

  useEffect(() => {
    if (query.trim().length < 2) {
      setRegistered([]);
      setEdbo([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/institutions/search?q=${encodeURIComponent(query)}`);
        const data: SearchResponse = await res.json();
        setRegistered(data?.registered ?? []);
        setEdbo(data?.edbo ?? []);
      } catch {
        setRegistered([]);
        setEdbo([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function pickRegistered(i: RegisteredResult) {
    setPicked({ id: i.id, name: i.name, shortName: i.shortName, isVerified: i.isVerified });
    setQuery(""); setRegistered([]); setEdbo([]);
    onChange({ id: i.id, name: i.name, shortName: i.shortName });
  }

  function pickEdbo(e: EdboResult) {
    // Reference-only: лінкуємо за name (без institutionId).
    setPicked({ id: "", name: e.name, shortName: e.shortName, isVerified: false });
    setQuery(""); setRegistered([]); setEdbo([]);
    onChange({ id: "", name: e.name, shortName: e.shortName });
  }

  function clear() {
    setPicked(null);
    setQuery("");
    onChange(null);
  }

  if (picked) {
    const isLinked = !!picked.id;
    return (
      <div className={`rounded-xl border p-3 ${isLinked ? "border-emerald-200 bg-emerald-50/60" : "border-blue-200 bg-blue-50/50"}`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isLinked ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
            {isLinked ? <Building2 className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold text-slate-900">{picked.name}</p>
              {picked.isVerified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-700/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {isUk ? "верифіковано" : "verified"}
                </span>
              )}
            </div>
            {picked.shortName && (
              <p className="font-mono text-[10px] text-slate-400">{picked.shortName}</p>
            )}
            <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${isLinked ? "text-emerald-700" : "text-blue-700"}`}>
              {isLinked
                ? <><Sparkles className="mr-1 inline h-2.5 w-2.5" />{isUk ? "Ви приєднані до закладу" : "Linked to institution"}</>
                : <><Globe2 className="mr-1 inline h-2.5 w-2.5" />{isUk ? "Заклад з реєстру (без linking)" : "From registry (not linked)"}</>}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            title={isUk ? "Прибрати" : "Clear"}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const noResults = query.trim().length >= 2 && !searching && registered.length === 0 && edbo.length === 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isUk
            ? "Пошук вашого закладу (КНУ, КПІ, ЛНУ…)"
            : "Search your institution (KNU, KPI, LNU…)"}
          className="input-control w-full rounded-xl py-2 pl-9 pr-3 text-sm"
        />
        {searching && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {/* Registered (наші) */}
      {registered.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-white shadow-sm">
          <div className="border-b border-emerald-100 bg-emerald-50/40 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles className="mr-1 inline h-2.5 w-2.5" />
              {isUk ? "Зареєстровані в системі" : "Registered in system"}
            </p>
          </div>
          {registered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => pickRegistered(i)}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-0 hover:bg-emerald-50/40"
            >
              <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-slate-900">{i.name}</p>
                  {i.isVerified && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />}
                </div>
                <p className="truncate text-[11px] text-slate-500">
                  {[i.shortName, i.city, i.country].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Check className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      )}

      {/* EDBO (реєстр МОН) */}
      {edbo.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white shadow-sm">
          <div className="border-b border-blue-100 bg-blue-50/40 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              <Globe2 className="mr-1 inline h-2.5 w-2.5" />
              {isUk ? "Реєстр ЄДЕБО (МОН України)" : "EDBO Registry (Ministry of Education)"}
            </p>
          </div>
          {edbo.map((e, idx) => (
            <button
              key={`${e.name}-${idx}`}
              type="button"
              onClick={() => pickEdbo(e)}
              className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-0 hover:bg-blue-50/40"
            >
              <Globe2 className="h-4 w-4 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {[e.shortName, e.city, e.type].filter(Boolean).join(" · ")}
                </p>
              </div>
              <ExternalLink className="h-3 w-3 shrink-0 text-slate-300" />
            </button>
          ))}
          <p className="border-t border-slate-100 bg-slate-50/40 px-3 py-1.5 text-[10px] text-slate-500">
            {isUk
              ? "Ці заклади ще не зареєстровані як акаунт у системі — буде збережено лише назва."
              : "These institutions are not registered as accounts yet — only the name will be saved."}
          </p>
        </div>
      )}

      {noResults && (
        <p className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
          {isUk
            ? "Заклад не знайдено. Введіть назву вручну у полі «Університет» нижче."
            : "Institution not found. Enter the name manually below."}
        </p>
      )}
    </div>
  );
}
