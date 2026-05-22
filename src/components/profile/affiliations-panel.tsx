"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  BookOpen, Building2, ChevronDown, Clock, GraduationCap,
  History, Layers, Loader2, Plus, Trash2, X,
} from "lucide-react";
import type { UserAffiliation } from "@/lib/schemas";

// ── Constants ─────────────────────────────────────────────────────────────────

const PARENT_UNIT_LABELS: Record<string, string> = {
  faculty:   "Факультет",
  institute: "Інститут",
  college:   "Коледж",
  division:  "Відділення",
  center:    "Центр",
  school:    "Школа",
  other:     "Інше",
};

const CHILD_UNIT_LABELS: Record<string, string> = {
  department: "Кафедра",
  lab:        "Лабораторія",
  division:   "Відділ",
  center:     "Центр",
  group:      "Група",
  section:    "Секція",
  other:      "Інше",
};

const ROLE_OPTIONS = [
  { value: "Студент (бакалавр)", label: "Студент (бакалавр)" },
  { value: "Студент (магістр)", label: "Студент (магістр)" },
  { value: "Аспірант", label: "Аспірант / PhD student" },
  { value: "Докторант", label: "Докторант / Postdoc" },
  { value: "Стажист-дослідник", label: "Стажист-дослідник" },
  { value: "Асистент", label: "Асистент" },
  { value: "Викладач", label: "Викладач" },
  { value: "Доцент", label: "Доцент" },
  { value: "Професор", label: "Професор" },
  { value: "Молодший науковий співробітник", label: "Молодший науковий співробітник" },
  { value: "Науковий співробітник", label: "Науковий співробітник" },
  { value: "Старший науковий співробітник", label: "Старший науковий співробітник" },
  { value: "Провідний науковий співробітник", label: "Провідний науковий співробітник" },
  { value: "Головний науковий співробітник", label: "Головний науковий співробітник" },
  { value: "Завідувач кафедри / відділу", label: "Завідувач кафедри / відділу" },
  { value: "Директор / Декан", label: "Директор / Декан" },
  { value: "Інше", label: "Інше (вкажіть вручну)" },
];

// ── Debounce ──────────────────────────────────────────────────────────────────

function useDebounce<T>(fn: (v: T) => void, ms: number) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (v: T) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(v), ms);
  };
}

// ── Generic autocomplete ──────────────────────────────────────────────────────

type DropdownItem = { label: string; sublabel?: string; badge?: string; official?: boolean };

function Autocomplete({
  value, onChange, onSelect, placeholder, fetchItems, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (item: DropdownItem) => void;
  placeholder: string;
  fetchItems: (q: string) => Promise<DropdownItem[]>;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [dropStyle, setDropStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateDropStyle() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropStyle({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }

  const fetchDebounced = useDebounce(async (q: string) => {
    const result = await fetchItems(q).catch(() => []);
    setItems(result);
  }, 250);

  return (
    <div>
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.value); fetchDebounced(e.target.value); }}
        onFocus={() => { updateDropStyle(); setOpen(true); fetchDebounced(value); }}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 200); }}
        placeholder={placeholder}
        autoComplete="off"
        className="input-control w-full rounded-lg px-3 py-2 text-sm disabled:opacity-40"
      />
      {open && items.length > 0 && (
        <div
          style={{ position: "fixed", top: dropStyle.top, left: dropStyle.left, width: dropStyle.width, zIndex: 9999 }}
          className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {items.map((item, i) => (
            <button key={i} type="button"
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                onSelect(item);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50/60"
            >
              {item.official !== false
                ? <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                : <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
                {item.sublabel && <p className="text-[10px] text-slate-400">{item.sublabel}</p>}
              </div>
              {item.badge && (
                <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

function Select({ value, onChange, options, placeholder, disabled }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="input-control w-full rounded-lg px-3 py-2 text-sm disabled:opacity-40"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── AddAffiliationForm ────────────────────────────────────────────────────────

function AddAffiliationForm({ onCancel, onSaved }: {
  onCancel: () => void;
  onSaved: (aff: UserAffiliation) => void;
}) {
  const [institutionName, setInstitutionName] = useState("");
  const [parentUnitType, setParentUnitType] = useState("");
  const [parentUnitName, setParentUnitName] = useState("");
  const [unitType, setUnitType] = useState("");
  const [unitName, setUnitName] = useState("");
  const [programName, setProgramName] = useState("");
  const [roleSelect, setRoleSelect] = useState("");
  const [roleCustom, setRoleCustom] = useState("");
  const [position, setPosition] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const role = roleSelect === "Інше" ? roleCustom : roleSelect;

  async function fetchInstitutions(q: string): Promise<DropdownItem[]> {
    if (q.trim().length < 2) return [];
    const res = await fetch(`/api/institutions/search?q=${encodeURIComponent(q)}`).catch(() => null);
    if (!res?.ok) return [];
    const data = await res.json();
    const reg = (data.registered ?? []).map((s: { name: string; city?: string; isVerified?: boolean }) => ({
      label: s.name, sublabel: s.city, badge: s.isVerified ? "✓" : undefined, official: true,
    }));
    const edbo = (data.edbo ?? []).map((s: { name: string; city?: string }) => ({
      label: s.name, sublabel: s.city, official: false,
    }));
    return [...reg, ...edbo];
  }

  async function fetchUnits(q: string): Promise<DropdownItem[]> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=unit`).catch(() => null);
    if (!res?.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((u: { name: string }) => ({ label: u.name, official: true }));
  }

  async function fetchPrograms(q: string): Promise<DropdownItem[]> {
    if (q.trim().length < 2) return [];
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=program`).catch(() => null);
    if (!res?.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((p: { name: string; level?: string }) => ({
      label: p.name, badge: p.level || undefined, official: true,
    }));
  }

  async function submit() {
    if (!institutionName.trim()) return;
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/affiliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: institutionName.trim(),
          parentUnitType,
          parentUnitName: parentUnitName.trim(),
          unitType,
          unitName: unitName.trim(),
          programName: programName.trim(),
          role: role.trim(),
          position: position.trim(),
          startYear: startYear ? parseInt(startYear) : null,
          endYear: (!isCurrent && endYear) ? parseInt(endYear) : null,
          isCurrent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Помилка збереження");
      onSaved(data.affiliation);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Помилка");
    } finally {
      setBusy(false);
    }
  }

  const parentUnitTypeOptions = Object.entries(PARENT_UNIT_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const childUnitTypeOptions = Object.entries(CHILD_UNIT_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const currentYear = new Date().getFullYear();

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          Нова приналежність
        </span>
        <button type="button" onClick={onCancel}
          className="rounded p-0.5 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Institution */}
      <div>
        <FieldLabel required>Заклад</FieldLabel>
        <Autocomplete
          value={institutionName}
          onChange={setInstitutionName}
          onSelect={(s) => setInstitutionName(s.label)}
          placeholder="Інститут фізіології ім. Богомольця…"
          fetchItems={fetchInstitutions}
        />
      </div>

      {/* Parent unit — type + name */}
      <div>
        <FieldLabel>Підрозділ 1-го рівня (факультет, інститут…)</FieldLabel>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <Select
            value={parentUnitType}
            onChange={setParentUnitType}
            options={parentUnitTypeOptions}
            placeholder="Тип…"
          />
          <Autocomplete
            value={parentUnitName}
            onChange={setParentUnitName}
            onSelect={(s) => setParentUnitName(s.label)}
            placeholder={parentUnitType ? `Назва ${PARENT_UNIT_LABELS[parentUnitType]?.toLowerCase() ?? ""}…` : "Назва підрозділу…"}
            fetchItems={fetchUnits}
          />
        </div>
      </div>

      {/* Child unit — type + name */}
      <div>
        <FieldLabel>Підрозділ 2-го рівня (кафедра, відділ, лабораторія…)</FieldLabel>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <Select
            value={unitType}
            onChange={setUnitType}
            options={childUnitTypeOptions}
            placeholder="Тип…"
          />
          <Autocomplete
            value={unitName}
            onChange={setUnitName}
            onSelect={(s) => setUnitName(s.label)}
            placeholder={unitType ? `Назва ${CHILD_UNIT_LABELS[unitType]?.toLowerCase() ?? ""}…` : "Назва підрозділу…"}
            fetchItems={fetchUnits}
          />
        </div>
      </div>

      {/* Program */}
      <div>
        <FieldLabel>Освітня програма / спеціальність</FieldLabel>
        <Autocomplete
          value={programName}
          onChange={setProgramName}
          onSelect={(s) => setProgramName(s.label)}
          placeholder="Молекулярна біологія та біохімія (PhD)…"
          fetchItems={fetchPrograms}
        />
      </div>

      {/* Role — select with custom fallback */}
      <div>
        <FieldLabel>Роль</FieldLabel>
        <Select
          value={roleSelect}
          onChange={setRoleSelect}
          options={ROLE_OPTIONS}
          placeholder="Оберіть роль…"
        />
        {roleSelect === "Інше" && (
          <input
            value={roleCustom}
            onChange={(e) => setRoleCustom(e.target.value)}
            placeholder="Введіть свою роль…"
            className="input-control mt-2 w-full rounded-lg px-3 py-2 text-sm"
          />
        )}
      </div>

      {/* Position */}
      <div>
        <FieldLabel>Посада</FieldLabel>
        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Молодший науковий співробітник, ст. лаборант…"
          className="input-control w-full rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Years + isCurrent */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Рік початку</FieldLabel>
          <input
            type="number"
            min={1950}
            max={currentYear + 1}
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder={String(currentYear)}
            className="input-control w-full rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <FieldLabel>Рік завершення</FieldLabel>
          <input
            type="number"
            min={1950}
            max={currentYear + 10}
            value={isCurrent ? "" : endYear}
            onChange={(e) => setEndYear(e.target.value)}
            disabled={isCurrent}
            placeholder={isCurrent ? "донині" : String(currentYear)}
            className="input-control w-full rounded-lg px-3 py-2 text-sm disabled:opacity-40"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => { setIsCurrent(e.target.checked); if (e.target.checked) setEndYear(""); }}
          className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
        />
        <span className="font-medium">Я тут зараз</span>
      </label>

      {err && <p className="text-xs text-rose-600">{err}</p>}

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !institutionName.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Додати
        </button>
      </div>
    </div>
  );
}

// ── AffiliationCard ───────────────────────────────────────────────────────────

function AffiliationCard({ aff, onEnd, onDelete }: {
  aff: UserAffiliation;
  onEnd: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const parentLabel = aff.parentUnitType
    ? `${PARENT_UNIT_LABELS[aff.parentUnitType] ?? aff.parentUnitType}: ${aff.parentUnitName}`
    : aff.parentUnitName;
  const childLabel = aff.unitType
    ? `${CHILD_UNIT_LABELS[aff.unitType] ?? aff.unitType}: ${aff.unitName}`
    : aff.unitName;
  const structurePath = [parentLabel, childLabel].filter(Boolean).join(" › ");

  return (
    <div className={`group relative overflow-hidden rounded-xl border p-3.5 transition ${
      aff.isCurrent
        ? "border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm"
        : "border-slate-200 bg-slate-50/40"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          aff.isCurrent ? "bg-emerald-100" : "bg-slate-100"
        }`}>
          <Building2 className={`h-[18px] w-[18px] ${aff.isCurrent ? "text-emerald-600" : "text-slate-400"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{aff.institutionName}</p>
            {aff.isCurrent && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">зараз</span>
            )}
          </div>
          {structurePath && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Layers className="h-2.5 w-2.5 shrink-0 text-slate-400" />
              <span>{structurePath}</span>
            </div>
          )}
          {aff.programName && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-blue-600">
              <GraduationCap className="h-2.5 w-2.5 shrink-0" />
              <span>{aff.programName}</span>
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-400">
            {aff.role && <span className="font-medium text-slate-600">{aff.role}</span>}
            {aff.position && <span>· {aff.position}</span>}
            {aff.startYear && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {aff.startYear}{aff.endYear ? `–${aff.endYear}` : aff.isCurrent ? "–донині" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-30 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {aff.isCurrent && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onEnd(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Clock className="h-3.5 w-3.5" />Завершити
                </button>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); if (confirm("Видалити?")) onDelete(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />Видалити
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AffiliationsPanel ─────────────────────────────────────────────────────────

export function AffiliationsPanel({ initial }: { initial: UserAffiliation[] }) {
  const [affiliations, setAffiliations] = useState<UserAffiliation[]>(initial);
  const [showForm, setShowForm] = useState(false);

  const current = affiliations.filter((a) => a.isCurrent);
  const past = affiliations.filter((a) => !a.isCurrent);

  async function endAff(aff: UserAffiliation) {
    const res = await fetch(`/api/affiliations/${aff._id}`, { method: "PATCH" });
    if (res.ok) setAffiliations((prev) => prev.map((a) => a._id === aff._id ? { ...a, isCurrent: false } : a));
  }

  async function deleteAff(aff: UserAffiliation) {
    const res = await fetch(`/api/affiliations/${aff._id}`, { method: "DELETE" });
    if (res.ok) setAffiliations((prev) => prev.filter((a) => a._id !== aff._id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          Заклади, де ти навчаєшся або працюєш — ти будуєш їхню спільноту
        </p>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Додати
        </button>
      </div>

      {showForm && (
        <AddAffiliationForm
          onCancel={() => setShowForm(false)}
          onSaved={(aff) => { setAffiliations((prev) => [aff, ...prev]); setShowForm(false); }}
        />
      )}

      {affiliations.length === 0 && !showForm && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
          <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Ти ще не додав заклад</p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
            Додай свій інститут — і ти стаєш першою цеглинкою його спільноти в системі
          </p>
        </div>
      )}

      {current.length > 0 && (
        <div className="space-y-2">
          {current.map((a) => (
            <AffiliationCard key={a._id} aff={a} onEnd={() => endAff(a)} onDelete={() => deleteAff(a)} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="pt-2">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-bold text-slate-700">Хроніка дослідника</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">
              {past.length}
            </span>
          </div>
          <div className="relative space-y-0 pl-4">
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gradient-to-b from-violet-200 via-slate-200 to-transparent" />
            {past.map((a) => (
              <div key={a._id} className="relative pb-4 last:pb-0">
                <div className="absolute -left-4 top-3 h-2.5 w-2.5 rounded-full border-2 border-violet-300 bg-white" />
                <AffiliationCard aff={a} onEnd={() => {}} onDelete={() => deleteAff(a)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
