"use client";

import { useState, useTransition } from "react";
import { BookOpen, Plus, X, Loader2, ExternalLink, Search } from "lucide-react";
import {
  addItemPublicationAction,
  deleteItemPublicationAction,
  updateItemPublicationStatusAction,
} from "@/app/item-publication-actions";

type Pub = {
  _id?: string;
  title: string;
  authors?: string;
  doi?: string;
  journal?: string;
  url?: string;
  type: string;
  status: string;
  expectedYear?: number | null;
};

const STATUS_COLORS: Record<string, [string, string]> = {
  planned:      ["bg-stone-100",   "text-stone-600"],
  submitted:    ["bg-blue-100",    "text-blue-700"],
  under_review: ["bg-amber-100",   "text-amber-700"],
  accepted:     ["bg-indigo-100",  "text-indigo-700"],
  published:    ["bg-emerald-100", "text-emerald-700"],
  rejected:     ["bg-rose-100",    "text-rose-700"],
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Заплановано", submitted: "Подано", under_review: "На рецензії",
  accepted: "Прийнято", published: "Опубліковано", rejected: "Відхилено",
};

const PUB_TYPES = [
  { value: "article", label: "Стаття" },
  { value: "conference", label: "Конференція" },
  { value: "book_chapter", label: "Розділ книги" },
  { value: "monograph", label: "Монографія" },
  { value: "patent", label: "Патент" },
  { value: "report", label: "Звіт" },
  { value: "dataset", label: "Датасет" },
  { value: "other", label: "Інше" },
];

const STATUSES = Object.keys(STATUS_LABELS);

const EMPTY_FORM = { title: "", authors: "", doi: "", journal: "", url: "", type: "article", status: "planned", expectedYear: "" };

async function lookupDoi(doi: string): Promise<Partial<typeof EMPTY_FORM>> {
  const clean = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(clean)}`);
  if (!res.ok) return {};
  const { message } = await res.json();
  const title = message.title?.[0] ?? "";
  const authors = (message.author ?? [])
    .map((a: any) => `${a.family ?? ""} ${a.given ?? ""}`.trim())
    .filter(Boolean)
    .join(", ");
  const journal = message["container-title"]?.[0] ?? message["publisher"] ?? "";
  const year = message.published?.["date-parts"]?.[0]?.[0] ?? null;
  const url = `https://doi.org/${clean}`;
  return { title, authors, journal, doi: clean, url, expectedYear: year ? String(year) : "" };
}

export function ItemPublicationsBlock({
  projectId,
  itemId,
  wsId,
  locale,
  initialPubs,
}: {
  projectId: string;
  itemId: string;
  wsId: string;
  locale: string;
  initialPubs: Pub[];
}) {
  const [pubs, setPubs] = useState<Pub[]>(initialPubs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [doiInput, setDoiInput] = useState("");
  const [doiLoading, setDoiLoading] = useState(false);
  const [doiError, setDoiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField(k: keyof typeof EMPTY_FORM, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleDoiLookup() {
    if (!doiInput.trim()) return;
    setDoiLoading(true);
    setDoiError(null);
    try {
      const data = await lookupDoi(doiInput.trim());
      if (!data.title) { setDoiError("DOI не знайдено"); return; }
      setForm((f) => ({ ...f, ...data, expectedYear: data.expectedYear ? String(data.expectedYear) : "" }));
    } catch {
      setDoiError("Помилка пошуку");
    } finally {
      setDoiLoading(false);
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    startTransition(async () => {
      const res = await addItemPublicationAction(
        projectId,
        {
          title: form.title,
          doi: form.doi || undefined,
          authors: form.authors || undefined,
          journal: form.journal || undefined,
          url: form.url || undefined,
          type: form.type,
          status: form.status,
          expectedYear: form.expectedYear ? parseInt(form.expectedYear) : null,
        },
        locale, wsId, itemId,
      );
      if (res.ok) {
        setPubs((prev) => [...prev, {
          title: form.title, authors: form.authors || undefined,
          doi: form.doi || undefined, journal: form.journal || undefined,
          url: form.url || undefined, type: form.type, status: form.status,
          expectedYear: form.expectedYear ? parseInt(form.expectedYear) : null,
        }]);
        setForm(EMPTY_FORM);
        setDoiInput("");
        setShowForm(false);
      }
    });
  }

  function handleDelete(idx: number, pubId?: string) {
    if (!pubId) { setPubs((p) => p.filter((_, i) => i !== idx)); return; }
    startTransition(async () => {
      const res = await deleteItemPublicationAction(pubId, locale, wsId, itemId);
      if (res.ok) setPubs((p) => p.filter((_, i) => i !== idx));
    });
  }

  function handleStatusChange(idx: number, pubId: string | undefined, status: string) {
    setPubs((p) => p.map((pub, i) => i === idx ? { ...pub, status } : pub));
    if (pubId) {
      startTransition(async () => { await updateItemPublicationStatusAction(pubId, status, locale, wsId, itemId); });
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-blue-500" />
        <h2 className="liquid-eyebrow">ПУБЛІКАЦІЇ</h2>
        <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">{pubs.length}</span>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Додати
        </button>
      </div>

      {/* DOI lookup + form */}
      {showForm && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          {/* DOI lookup */}
          <div className="flex gap-2">
            <input
              value={doiInput}
              onChange={(e) => setDoiInput(e.target.value)}
              placeholder="DOI або URL (напр. 10.1000/xyz123)"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleDoiLookup())}
            />
            <button
              type="button"
              onClick={handleDoiLookup}
              disabled={doiLoading}
              className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {doiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              Знайти
            </button>
          </div>
          {doiError && <p className="text-[11px] text-red-600">{doiError}</p>}

          <form onSubmit={handleAdd} className="space-y-2">
            <input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Назва *" required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <input value={form.authors} onChange={(e) => setField("authors", e.target.value)} placeholder="Автори"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.journal} onChange={(e) => setField("journal", e.target.value)} placeholder="Журнал / видання"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <input value={form.expectedYear} onChange={(e) => setField("expectedYear", e.target.value)} placeholder="Рік" type="number" min="2000" max="2040"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.type} onChange={(e) => setField("type", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                {PUB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select value={form.status} onChange={(e) => setField("status", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <input value={form.doi} onChange={(e) => setField("doi", e.target.value)} placeholder="DOI"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setDoiInput(""); }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                Скасувати
              </button>
              <button type="submit" disabled={isPending || !form.title.trim()}
                className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Зберегти
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publications list */}
      {pubs.length === 0 && !showForm && (
        <p className="text-xs text-slate-400 italic">Публікацій ще немає</p>
      )}
      <div className="space-y-2">
        {pubs.map((pub, idx) => {
          const [bg, text] = STATUS_COLORS[pub.status] ?? STATUS_COLORS.planned;
          return (
            <div key={pub._id ?? idx} className="group rounded-lg border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug">{pub.title}</p>
                  {pub.authors && <p className="mt-0.5 text-[11px] text-slate-500 truncate">{pub.authors}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bg} ${text}`}>{STATUS_LABELS[pub.status] ?? pub.status}</span>
                    {pub.journal && <span className="text-[10px] text-slate-500">{pub.journal}</span>}
                    {pub.expectedYear && <span className="text-[10px] text-slate-400">{pub.expectedYear}</span>}
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline">
                        <ExternalLink className="h-2.5 w-2.5" />
                        DOI
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    value={pub.status}
                    onChange={(e) => handleStatusChange(idx, pub._id, e.target.value)}
                    className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-600 focus:outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  <button onClick={() => handleDelete(idx, pub._id)} disabled={isPending}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
