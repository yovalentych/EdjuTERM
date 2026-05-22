"use client";

import { useState } from "react";
import {
  BookOpen, Edit3, ExternalLink, Globe,
  Loader2, Plus, Save, X, Sparkles, Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AcademicLinks = {
  googleScholar?: string;
  researchGate?: string;
  scopus?: string;
  webOfScience?: string;
  academia?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  telegram?: string;
};

// ── Platform metadata ─────────────────────────────────────────────────────────

type LinkMeta = {
  key: keyof AcademicLinks;
  label: string;
  description: string;
  placeholder: string;
  color: string;
  bgGradient: string;
  iconText?: string;
  iconSvg?: React.ReactNode;
  baseUrl?: string;
  category: "academic" | "social" | "code";
};

const LINK_META: LinkMeta[] = [
  {
    key: "googleScholar",
    label: "Google Scholar",
    description: "Публікації, цитування, h-index",
    placeholder: "user=XXXXXXXXX",
    color: "#4285f4",
    bgGradient: "from-blue-500/10 to-blue-400/5",
    iconText: "GS",
    baseUrl: "https://scholar.google.com/citations?user=",
    category: "academic",
  },
  {
    key: "scopus",
    label: "Scopus",
    description: "Бібліографічна база Elsevier · Author ID",
    placeholder: "57XXXXXXXXXX",
    color: "#e8630a",
    bgGradient: "from-orange-500/10 to-orange-400/5",
    iconText: "SC",
    baseUrl: "https://www.scopus.com/authid/detail.uri?authorId=",
    category: "academic",
  },
  {
    key: "webOfScience",
    label: "Web of Science",
    description: "Індексація Clarivate · ResearcherID",
    placeholder: "A-XXXX-XXXX",
    color: "#c0101f",
    bgGradient: "from-red-600/10 to-red-500/5",
    iconText: "WoS",
    baseUrl: "https://www.webofscience.com/wos/author/record/",
    category: "academic",
  },
  {
    key: "researchGate",
    label: "ResearchGate",
    description: "Наукова мережа, повні тексти статей",
    placeholder: "ProfileName",
    color: "#00b09b",
    bgGradient: "from-teal-500/10 to-teal-400/5",
    iconText: "RG",
    baseUrl: "https://www.researchgate.net/profile/",
    category: "academic",
  },
  {
    key: "academia",
    label: "Academia.edu",
    description: "Репозиторій препринтів та робіт",
    placeholder: "https://university.academia.edu/Name",
    color: "#3d3d3d",
    bgGradient: "from-slate-500/10 to-slate-400/5",
    iconSvg: <BookOpen className="h-4 w-4" />,
    category: "academic",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    description: "Академічна та професійна мережа",
    placeholder: "in/username",
    color: "#0077b5",
    bgGradient: "from-sky-600/10 to-sky-500/5",
    iconText: "in",
    baseUrl: "https://linkedin.com/in/",
    category: "social",
  },
  {
    key: "github",
    label: "GitHub",
    description: "Відкритий код, датасети, notebook",
    placeholder: "username",
    color: "#24292e",
    bgGradient: "from-slate-700/10 to-slate-600/5",
    iconText: "GH",
    baseUrl: "https://github.com/",
    category: "code",
  },
  {
    key: "website",
    label: "Особистий сайт",
    description: "Академічна або лабораторна сторінка",
    placeholder: "https://mylab.university.ua",
    color: "#7c3aed",
    bgGradient: "from-violet-500/10 to-violet-400/5",
    iconSvg: <Globe className="h-4 w-4" />,
    category: "social",
  },
  {
    key: "telegram",
    label: "Telegram",
    description: "Науковий канал або чат",
    placeholder: "@username",
    color: "#0088cc",
    bgGradient: "from-cyan-500/10 to-cyan-400/5",
    iconText: "TG",
    baseUrl: "https://t.me/",
    category: "social",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Академічні бази",
  social:   "Мережі та сайти",
  code:     "Код та дані",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUrl(meta: LinkMeta, value: string): string {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return meta.baseUrl ? `${meta.baseUrl}${value}` : value;
}

function PlatformIcon({ meta, size = "md" }: { meta: LinkMeta; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-12 w-12 rounded-2xl text-base" : size === "sm" ? "h-7 w-7 rounded-lg text-[10px]" : "h-10 w-10 rounded-xl text-[11px]";
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-black text-white shadow-sm ${dim}`}
      style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)` }}
    >
      {meta.iconSvg ?? meta.iconText}
    </span>
  );
}

// ── AcademicLinksPanel ────────────────────────────────────────────────────────

export function AcademicLinksPanel({ initial }: { initial: AcademicLinks }) {
  const [links, setLinks]     = useState<AcademicLinks>(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState<AcademicLinks>(initial);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [saved, setSaved]     = useState(false);

  const filledMeta  = LINK_META.filter((m) => links[m.key]);
  const emptyMeta   = LINK_META.filter((m) => !links[m.key]);
  const hasAny      = filledMeta.length > 0;

  // Group filled by category
  const byCategory = filledMeta.reduce<Record<string, LinkMeta[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  async function save() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicLinks: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Помилка збереження");
      setLinks(draft);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Помилка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          {filledMeta.length > 0
            ? `${filledMeta.length} з ${LINK_META.length} платформ підключено`
            : "Підключіть ваші академічні та соціальні профілі"}
        </p>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              <Check className="h-3 w-3" /> Збережено
            </span>
          )}
          <button
            type="button"
            onClick={() => { setDraft(links); setEditing((s) => !s); }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {editing ? "Скасувати" : "Редагувати"}
          </button>
        </div>
      </div>

      {/* ── View mode ── */}
      {!editing && (
        <div className="space-y-5">
          {hasAny ? (
            <>
              {Object.entries(byCategory).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((m) => {
                      const val  = links[m.key]!;
                      const href = buildUrl(m, val);
                      return (
                        <a
                          key={m.key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br ${m.bgGradient} p-4 transition-all duration-200 hover:scale-[1.015] hover:border-slate-300 hover:shadow-md`}
                        >
                          {/* Colored left accent */}
                          <div
                            className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                            style={{ background: `linear-gradient(180deg, ${m.color}, ${m.color}88)` }}
                          />
                          <div className="flex items-start gap-3 pl-2">
                            <PlatformIcon meta={m} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <p className="text-sm font-bold text-slate-900 leading-tight">{m.label}</p>
                                  <p className="mt-0.5 text-[11px] text-slate-400 leading-tight">{m.description}</p>
                                </div>
                                <ExternalLink
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 transition-opacity duration-150 opacity-0 group-hover:opacity-100"
                                  style={{ color: m.color }}
                                />
                              </div>
                              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/60 px-2 py-1 backdrop-blur-sm">
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: m.color }}
                                />
                                <p className="truncate font-mono text-[11px] font-medium text-slate-600">{val}</p>
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Empty platform hints */}
              {emptyMeta.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    Ще не підключено
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {emptyMeta.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => { setDraft(links); setEditing(true); }}
                        className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-white/50 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                      >
                        <PlatformIcon meta={m} size="sm" />
                        {m.label}
                        <Plus className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="rounded-2xl border-2 border-dashed border-slate-200 py-8 text-center">
              <div className="mx-auto mb-4 flex justify-center gap-2">
                {LINK_META.slice(0, 5).map((m) => (
                  <PlatformIcon key={m.key} meta={m} size="sm" />
                ))}
              </div>
              <p className="text-sm font-semibold text-slate-500">Немає підключених профілів</p>
              <p className="mt-1 text-xs text-slate-400">Google Scholar, Scopus, ResearchGate та ін.</p>
              <button
                type="button"
                onClick={() => { setDraft(links); setEditing(true); }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Додати профілі
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Edit mode ── */}
      {editing && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          {(["academic", "social", "code"] as const).map((cat) => {
            const items = LINK_META.filter((m) => m.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((m) => (
                    <div key={m.key} className="space-y-1">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <PlatformIcon meta={m} size="sm" />
                        {m.label}
                      </label>
                      <input
                        value={draft[m.key] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [m.key]: e.target.value || undefined }))}
                        placeholder={m.placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{err}</p>}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Зберегти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ResearchInterestsPanel ────────────────────────────────────────────────────

const TAG_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", hover: "hover:bg-violet-200" },
  { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200",   hover: "hover:bg-blue-200" },
  { bg: "bg-teal-100",   text: "text-teal-700",   border: "border-teal-200",   hover: "hover:bg-teal-200" },
  { bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-200",hover: "hover:bg-emerald-200" },
  { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200",  hover: "hover:bg-amber-200" },
  { bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200",   hover: "hover:bg-rose-200" },
  { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", hover: "hover:bg-indigo-200" },
];

function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

const SUGGESTED_INTERESTS = [
  "Молекулярна біологія", "Нейронауки", "Машинне навчання", "Кліматологія",
  "Матеріалознавство", "Генетика", "Штучний інтелект", "Біоінформатика",
  "Хімія полімерів", "Екологія", "Квантова фізика", "Геноміка",
];

export function ResearchInterestsPanel({ initial }: { initial: string[] }) {
  const [interests, setInterests] = useState<string[]>(initial);
  const [input, setInput]         = useState("");
  const [busy, setBusy]           = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = SUGGESTED_INTERESTS.filter(
    (s) => !interests.includes(s) && s.toLowerCase().includes(input.toLowerCase()),
  ).slice(0, 8);

  async function saveToServer(next: string[]) {
    setBusy(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchInterests: next }),
      });
    } finally {
      setBusy(false);
    }
  }

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || interests.includes(tag) || interests.length >= 20) return;
    const next = [...interests, tag];
    setInterests(next);
    setInput("");
    setShowSuggestions(false);
    saveToServer(next);
  }

  function removeTag(tag: string) {
    const next = interests.filter((t) => t !== tag);
    setInterests(next);
    saveToServer(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-400">
        {interests.length > 0
          ? `${interests.length}/20 тегів · автозбереження`
          : "Ключові теми та напрями вашої наукової діяльності"}
      </p>

      {/* Tags cloud */}
      {interests.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {interests.map((tag) => {
            const c = tagColor(tag);
            return (
              <span
                key={tag}
                className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${c.bg} ${c.text} ${c.border}`}
              >
                <span className="h-1.5 w-1.5 rounded-full opacity-60" style={{ backgroundColor: "currentColor" }} />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className={`ml-0.5 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${c.hover}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-5 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm font-semibold text-slate-400">Додайте наукові інтереси</p>
          <p className="mt-0.5 text-xs text-slate-300">Вони використовуються для рекомендацій і портфоліо</p>
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <form
          onSubmit={(e) => { e.preventDefault(); addTag(input); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => { if (e.key === ",") { e.preventDefault(); addTag(input); } }}
              placeholder="Нейробіологія, ML, Органічна хімія… (Enter або кома)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              disabled={busy || interests.length >= 20}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && input.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => addTag(s)}
                    className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-violet-50"
                  >
                    <Plus className="h-3.5 w-3.5 text-violet-400" />
                    <span className="font-medium text-slate-700">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || busy || interests.length >= 20}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>

        {/* Suggested tags when input is empty */}
        {showSuggestions && input.length === 0 && interests.length < 20 && (
          <div className="mt-2">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Популярні теги</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_INTERESTS.filter((s) => !interests.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  className="rounded-full border border-dashed border-violet-300 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-600 transition hover:bg-violet-100"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
