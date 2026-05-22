"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, ChevronDown, ChevronUp, Copy, GraduationCap, Loader2,
  Pencil, Plus, Trash2, X,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import type { InstitutionProgram, InstitutionUnit, ProgramLevel } from "@/lib/schemas";
import {
  ALL_SPECIALTIES,
  CLASSIFICATION_1021,
  type Specialty,
} from "@/lib/classification-1021";

// ── Meta ──────────────────────────────────────────────────────────────────────

const LEVEL_META: Record<ProgramLevel, { uk: string; en: string; color: string; defaultEcts: number; defaultYears: number }> = {
  bachelor:    { uk: "Бакалавр",   en: "Bachelor",     color: "emerald", defaultEcts: 240, defaultYears: 4 },
  master:      { uk: "Магістр",    en: "Master",       color: "blue",    defaultEcts: 90,  defaultYears: 1.5 },
  phd:         { uk: "PhD",        en: "PhD",          color: "violet",  defaultEcts: 60,  defaultYears: 4 },
  post_doc:    { uk: "Post-doc",   en: "Post-doc",     color: "amber",   defaultEcts: 0,   defaultYears: 2 },
  certificate: { uk: "Сертифікат", en: "Certificate",  color: "rose",    defaultEcts: 30,  defaultYears: 1 },
  other:       { uk: "Інше",       en: "Other",        color: "slate",   defaultEcts: 0,   defaultYears: 1 },
};

const LANGUAGES = [
  { value: "uk", label: "Українська" },
  { value: "en", label: "English" },
  { value: "pl", label: "Polski" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "other", label: "Інша / Other" },
];

const LEVEL_COLOR_MAP: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue:    "border-blue-200   bg-blue-50   text-blue-700",
  violet:  "border-violet-200 bg-violet-50 text-violet-700",
  amber:   "border-amber-200  bg-amber-50  text-amber-700",
  rose:    "border-rose-200   bg-rose-50   text-rose-700",
};

function nextAcademicYear(year: string): string {
  const m = year.match(/^(\d{4})-(\d{4})$/);
  if (m) return `${+m[1] + 1}-${+m[2] + 1}`;
  return "";
}

// ── SpecialtyAutocomplete ─────────────────────────────────────────────────────

function searchSpecialties(q: string): Specialty[] {
  const lq = q.toLowerCase().trim();
  if (!lq) return [];
  return ALL_SPECIALTIES.filter(
    (s) => s.code.toLowerCase().startsWith(lq) || s.name.toLowerCase().includes(lq)
  ).slice(0, 12);
}

function SpecialtyAutocomplete({ value, onChange, locale }: { value: string; onChange: (v: string) => void; locale: "uk" | "en" }) {
  const isUk = locale === "uk";
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [justPicked, setJustPicked] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = open && query.trim().length >= 1 && !justPicked ? searchSpecialties(query) : [];
  const grouped = results.reduce<Record<string, Specialty[]>>((acc, s) => {
    const field = CLASSIFICATION_1021.find((f) => f.code === s.fieldCode);
    const key = field ? `${field.code} — ${field.name}` : s.fieldCode;
    (acc[key] = acc[key] ?? []).push(s);
    return acc;
  }, {});

  function pick(s: Specialty) {
    const label = `${s.code} — ${s.name}`;
    setQuery(label);
    onChange(label);
    setJustPicked(true);
    setOpen(false);
    setTimeout(() => setJustPicked(false), 300);
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setJustPicked(false); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 200); }}
        placeholder={isUk ? "Введіть код або назву (напр. 091)" : "Type code or name (e.g. 091)"}
        className="input-control w-full rounded-lg px-3 py-2 text-sm"
      />
      {open && Object.keys(grouped).length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {Object.entries(grouped).map(([fieldKey, specs]) => (
            <div key={fieldKey}>
              <p className="sticky top-0 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{fieldKey}</p>
              {specs.map((s) => (
                <button key={s.code} type="button" onMouseDown={() => { if (blurTimer.current) clearTimeout(blurTimer.current); pick(s); }}
                  className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-violet-50/60">
                  <span className="w-8 shrink-0 font-mono text-[11px] font-bold text-violet-700">{s.code}</span>
                  <span className="text-sm text-slate-800">{s.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FormLabel ─────────────────────────────────────────────────────────────────

function FormLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </label>
  );
}

// ── ProgramsClient ────────────────────────────────────────────────────────────

export function ProgramsClient({
  locale,
  institutionName,
  initialPrograms,
  units,
}: {
  locale: "uk" | "en";
  institutionName: string;
  initialPrograms: InstitutionProgram[];
  units: InstitutionUnit[];
}) {
  const isUk = locale === "uk";
  const router = useRouter();
  const [programs, setPrograms] = useState<InstitutionProgram[]>(initialPrograms);
  const [formMode, setFormMode] = useState<"hidden" | "add" | "edit">("hidden");
  const [formBase, setFormBase] = useState<InstitutionProgram | null>(null); // pre-fill source

  function openAdd() { setFormBase(null); setFormMode("add"); }
  function openNewVersion(base: InstitutionProgram) { setFormBase(base); setFormMode("add"); }
  function openEdit(p: InstitutionProgram) { setFormBase(p); setFormMode("edit"); }
  function closeForm() { setFormMode("hidden"); setFormBase(null); }

  return (
    <div className="space-y-4">
      {/* Header */}
      <LiquidCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-violet-50/70 via-white to-emerald-50/40 px-5 py-4">
          <div>
            <p className="liquid-eyebrow text-violet-700">
              {isUk ? "Освітні програми" : "Academic programs"}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{institutionName}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {programs.length} {isUk ? "програм у каталозі" : "programs in catalog"}
            </p>
          </div>
          <button type="button" onClick={formMode === "add" && !formBase ? closeForm : openAdd} className="liquid-cta text-sm">
            <Plus className="h-4 w-4" />
            {formMode === "add" && !formBase ? (isUk ? "Сховати" : "Hide") : (isUk ? "Нова програма" : "New program")}
          </button>
        </div>
      </LiquidCard>

      {/* Add / New version form */}
      {formMode === "add" && (
        <ProgramForm
          locale={locale}
          units={units}
          base={formBase ?? undefined}
          onCancel={closeForm}
          onSaved={(p) => {
            setPrograms((prev) => [...prev, p]);
            closeForm();
            router.refresh();
          }}
        />
      )}

      {/* Edit form — shown at top when editing */}
      {formMode === "edit" && formBase && (
        <ProgramForm
          locale={locale}
          units={units}
          initial={formBase}
          onCancel={closeForm}
          onSaved={(updated) => {
            setPrograms((prev) => prev.map((x) => x._id === updated._id ? updated : x));
            closeForm();
          }}
        />
      )}

      {/* Empty state */}
      {programs.length === 0 && formMode === "hidden" && (
        <LiquidCard tint="amber" className="text-center" accent>
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            {isUk ? "Програм ще немає" : "No programs yet"}
          </h2>
          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500 mx-auto">
            {isUk
              ? "Створіть першу освітню програму — бакалаврат, магістратуру чи PhD."
              : "Create your first program — bachelor, master or PhD."}
          </p>
        </LiquidCard>
      )}

      {/* Program groups */}
      {programs.length > 0 && (
        <ProgramGroups
          programs={programs}
          units={units}
          locale={locale}
          editingId={formMode === "edit" ? formBase?._id ?? null : null}
          onEdit={openEdit}
          onNewVersion={openNewVersion}
          onDelete={(id) => setPrograms((prev) => prev.filter((x) => x._id !== id))}
        />
      )}
    </div>
  );
}

// ── ProgramGroups ─────────────────────────────────────────────────────────────

function ProgramGroups({
  programs, units, locale, editingId, onEdit, onNewVersion, onDelete,
}: {
  programs: InstitutionProgram[];
  units: InstitutionUnit[];
  locale: "uk" | "en";
  editingId: string | null;
  onEdit: (p: InstitutionProgram) => void;
  onNewVersion: (base: InstitutionProgram) => void;
  onDelete: (id: string) => void;
}) {
  // Group by title (trimmed)
  const groups = new Map<string, InstitutionProgram[]>();
  for (const p of programs) {
    const key = p.title.trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return (
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([, versions]) => {
        const sorted = [...versions].sort((a, b) =>
          (b.academicYear ?? "").localeCompare(a.academicYear ?? "")
        );
        return (
          <ProgramGroupBlock
            key={sorted[0]._id}
            versions={sorted}
            units={units}
            locale={locale}
            editingId={editingId}
            onEdit={onEdit}
            onNewVersion={onNewVersion}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}

// ── ProgramGroupBlock ─────────────────────────────────────────────────────────

function ProgramGroupBlock({
  versions, units, locale, editingId, onEdit, onNewVersion, onDelete,
}: {
  versions: InstitutionProgram[];
  units: InstitutionUnit[];
  locale: "uk" | "en";
  editingId: string | null;
  onEdit: (p: InstitutionProgram) => void;
  onNewVersion: (base: InstitutionProgram) => void;
  onDelete: (id: string) => void;
}) {
  const isUk = locale === "uk";
  const [activeIdx, setActiveIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const current = versions[activeIdx] ?? versions[0];
  const meta = LEVEL_META[current.level] ?? LEVEL_META.bachelor;
  const unit = units.find((u) => u._id === current.unitId);
  const colorCls = LEVEL_COLOR_MAP[meta.color] ?? LEVEL_COLOR_MAP.blue;
  const multiYear = versions.length > 1;

  const latest = versions[0]; // sorted newest first
  const suggestedNextYear = latest.academicYear ? nextAcademicYear(latest.academicYear) : "";

  async function handleDelete() {
    if (!confirm(isUk
      ? `Видалити версію${current.academicYear ? ` ${current.academicYear}` : ""}?`
      : `Delete version${current.academicYear ? ` ${current.academicYear}` : ""}?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/institution/programs/${current._id}`, { method: "DELETE" });
      // if we deleted the active tab, switch to idx 0
      if (activeIdx >= versions.length - 1) setActiveIdx(Math.max(0, activeIdx - 1));
      onDelete(current._id!);
    } finally { setDeleting(false); }
  }

  const isBeingEdited = editingId === current._id;

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${isBeingEdited ? "ring-2 ring-violet-400" : "border-slate-200/70"}`}>
      {/* Group header */}
      <div className={`flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3 ${colorCls}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${colorCls}`}>
              <GraduationCap className="h-2.5 w-2.5" />
              {isUk ? meta.uk : meta.en}
            </span>
            {current.code && (
              <span className="font-mono text-[10px] text-slate-500">{current.code}</span>
            )}
          </div>
          <h3 className="mt-1 text-base font-bold leading-tight text-slate-900">{current.title}</h3>
          {current.specialty && (
            <p className="mt-0.5 text-[11px] text-slate-500">{current.specialty}</p>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(current)}
            title={isUk ? "Редагувати цю версію" : "Edit this version"}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white/60"
          >
            <Pencil className="h-3 w-3" />
            {isUk ? "Редаг." : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => onNewVersion(latest)}
            title={isUk ? `Нова версія на основі ${latest.academicYear ?? "останньої"}` : "New year version"}
            className="flex items-center gap-1 rounded-lg bg-white/50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-white/80"
          >
            <Copy className="h-3 w-3" />
            {isUk ? (suggestedNextYear ? `${suggestedNextYear}→` : "Нова версія") : (suggestedNextYear ? `→ ${suggestedNextYear}` : "New version")}
          </button>
        </div>
      </div>

      {/* Year tabs (only if multiple versions) */}
      {multiYear && (
        <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50/60 px-4 py-2">
          {versions.map((v, idx) => (
            <button
              key={v._id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                idx === activeIdx
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-100"
              }`}
            >
              {v.academicYear || (isUk ? "Без року" : "No year")}
            </button>
          ))}
        </div>
      )}

      {/* Version details */}
      <div className="bg-white px-4 py-3">
        {/* Single-version year badge */}
        {!multiYear && current.academicYear && (
          <div className="mb-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600">
            {current.academicYear}
          </div>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold">
            {current.ects} ECTS
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
            {current.durationYears} {isUk ? "р." : "yr."}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 uppercase">
            {current.language}
          </span>
          {unit && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
              <BookOpen className="h-3 w-3" />{unit.shortName || unit.name}
            </span>
          )}
        </div>

        {/* Description (collapsible) */}
        {current.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{current.description}</p>
        )}

        {/* Delete */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
          {multiYear ? (
            <p className="text-[10px] text-slate-400">
              {isUk ? `${versions.length} версії по роках` : `${versions.length} year versions`}
            </p>
          ) : <span />}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-rose-500 hover:bg-rose-50 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            {isUk ? "Видалити версію" : "Delete version"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProgramForm (Add + Edit) ──────────────────────────────────────────────────

/**
 * Unified form:
 *   - no `initial` prop  → Add mode (POST)
 *   - `initial` prop     → Edit mode (PATCH)
 *   - `base` prop        → Add mode, pre-filled from base (clone to new year version)
 */
function ProgramForm({
  locale, units, initial, base, onCancel, onSaved,
}: {
  locale: "uk" | "en";
  units: InstitutionUnit[];
  initial?: InstitutionProgram;  // Edit mode
  base?: InstitutionProgram;     // Clone / new-version mode
  onCancel: () => void;
  onSaved: (p: InstitutionProgram) => void;
}) {
  const isUk = locale === "uk";
  const isEdit = !!initial;
  const source = initial ?? base;

  const [title,       setTitle]       = useState(source?.title ?? "");
  const [code,        setCode]        = useState(source?.code ?? "");
  const [specialty,   setSpecialty]   = useState(source?.specialty ?? "");
  const [level,       setLevel]       = useState<ProgramLevel>(source?.level ?? "bachelor");
  const [unitId,      setUnitId]      = useState(source?.unitId ?? "");
  const [ects,        setEcts]        = useState(source?.ects ?? LEVEL_META.bachelor.defaultEcts);
  const [years,       setYears]       = useState(source?.durationYears ?? LEVEL_META.bachelor.defaultYears);
  const [language,    setLanguage]    = useState(source?.language ?? "uk");
  const [academicYear,setAcademicYear]= useState(
    isEdit
      ? (initial?.academicYear ?? "")
      : (base?.academicYear ? nextAcademicYear(base.academicYear) : "")
  );
  const [description, setDescription] = useState(source?.description ?? "");
  const [showDesc,    setShowDesc]    = useState(!!(source?.description));
  const [busy,        setBusy]        = useState(false);
  const [err,         setErr]         = useState<string | null>(null);

  function changeLevel(l: ProgramLevel) {
    setLevel(l);
    if (!source) {
      setEcts(LEVEL_META[l].defaultEcts);
      setYears(LEVEL_META[l].defaultYears);
    }
  }

  async function submit() {
    if (!title.trim()) return;
    setBusy(true); setErr(null);
    const payload = {
      title: title.trim(), code, specialty, level, unitId,
      ects: Number(ects), durationYears: Number(years), language,
      academicYear, description,
    };
    try {
      if (isEdit && initial?._id) {
        const res = await fetch(`/api/institution/programs/${initial._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json())?.error ?? "save_failed");
        onSaved({ ...initial, ...payload });
      } else {
        const res = await fetch("/api/institution/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "save_failed");
        onSaved(data.program);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const meta = LEVEL_META[level];

  return (
    <LiquidCard tint="violet" accent>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
            {isEdit
              ? (isUk ? "Редагувати версію" : "Edit version")
              : base
                ? (isUk ? `Нова версія · на основі ${base.academicYear || base.title}` : `New version · based on ${base.academicYear || base.title}`)
                : (isUk ? "Нова програма" : "New program")}
          </span>
          {!isEdit && base && academicYear && (
            <p className="mt-0.5 text-[10px] text-slate-500">
              {isUk ? `Навчальний рік: ${academicYear}` : `Academic year: ${academicYear}`}
            </p>
          )}
        </div>
        <button type="button" onClick={onCancel} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Row 1: Title + Code */}
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <div>
          <FormLabel>{isUk ? "Назва програми *" : "Program title *"}</FormLabel>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={isUk ? "Наприклад: Молекулярна біологія та біохімія" : "e.g. Molecular Biology"}
            className="input-control w-full rounded-lg px-3 py-2 text-sm" autoFocus={!isEdit && !base} />
        </div>
        <div>
          <FormLabel>{isUk ? "Внутрішній код" : "Code"}</FormLabel>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="091-PhD"
            className="input-control w-full rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
      </div>

      {/* Row 2: Specialty + Unit */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <FormLabel>{isUk ? "Спеціальність (КМУ 1021)" : "Specialty"}</FormLabel>
          <SpecialtyAutocomplete value={specialty} onChange={setSpecialty} locale={locale} />
        </div>
        <div>
          <FormLabel>{isUk ? "Підрозділ" : "Unit"}</FormLabel>
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="input-control w-full rounded-lg px-3 py-2 text-sm">
            <option value="">— {isUk ? "без підрозділу" : "no unit"} —</option>
            {units.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3: Level / ECTS / Years / Language */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <FormLabel>{isUk ? "Рівень" : "Level"}</FormLabel>
          <select value={level} onChange={(e) => changeLevel(e.target.value as ProgramLevel)}
            className="input-control w-full rounded-lg px-3 py-2 text-sm">
            {Object.entries(LEVEL_META).map(([k, v]) => (
              <option key={k} value={k}>{isUk ? v.uk : v.en}</option>
            ))}
          </select>
        </div>
        <div>
          <FormLabel>ECTS</FormLabel>
          <input type="number" min={0} max={360} value={ects} onChange={(e) => setEcts(Number(e.target.value))}
            className="input-control w-full rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <FormLabel>{isUk ? "Тривалість (р.)" : "Duration (yr)"}</FormLabel>
          <input type="number" min={0.5} max={10} step={0.5} value={years} onChange={(e) => setYears(Number(e.target.value))}
            className="input-control w-full rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <FormLabel>{isUk ? "Мова" : "Language"}</FormLabel>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-control w-full rounded-lg px-3 py-2 text-sm">
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* Row 4: Academic year */}
      <div className="mt-3">
        <FormLabel>
          {isUk ? "Навчальний рік" : "Academic year"}
          {!isEdit && base && <span className="ml-1 text-violet-600">(нова версія)</span>}
        </FormLabel>
        <div className="flex items-center gap-2">
          <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="2024-2025"
            className="input-control w-40 rounded-lg px-3 py-2 text-sm font-mono" maxLength={20} />
          {!isEdit && base?.academicYear && (
            <p className="text-[11px] text-slate-400">
              ← {isUk ? `авто на основі ${base.academicYear}` : `auto from ${base.academicYear}`}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {showDesc ? (
        <div className="mt-3">
          <FormLabel>{isUk ? "Короткий опис" : "Description"}</FormLabel>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} placeholder={isUk ? "Мета, зміст, форма навчання…" : "Goals, content, study format…"}
            className="input-control w-full resize-none rounded-lg px-3 py-2 text-sm" />
        </div>
      ) : (
        <button type="button" onClick={() => setShowDesc(true)}
          className="mt-3 text-[11px] font-semibold text-violet-600 hover:text-violet-800">
          + {isUk ? "Додати опис" : "Add description"}
        </button>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-3">
        <div>
          {err && <p className="text-xs text-rose-700">{err}</p>}
          {!err && <p className="text-[11px] text-slate-400">* {isUk ? "обов'язкове поле" : "required"}</p>}
        </div>
        <button type="button" onClick={submit} disabled={busy || !title.trim()} className="liquid-cta text-sm disabled:opacity-60">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isEdit ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isEdit
            ? (isUk ? "Зберегти зміни" : "Save changes")
            : (isUk ? "Створити програму" : "Create program")}
        </button>
      </div>
    </LiquidCard>
  );
}
