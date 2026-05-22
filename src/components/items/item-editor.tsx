"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Calendar, CheckCircle2, FileText, Hash, Loader2, Plus, Save, Smile,
  Sparkles, Tag, User, X, Clock,
} from "lucide-react";
import { LiquidCard } from "@/components/ui/liquid";
import { resolveItemFieldSpec, type FieldSpec } from "@/lib/item-field-specs";

type Item = {
  _id?: string;
  type: string;
  title: string;
  description?: string;
  emoji?: string;
  status: string;
  visibility: string;
  supervisor?: string;
  startDate?: string;
  plannedEndDate?: string;
  tags: string[];
  fields?: Record<string, any>;
};

const STATUSES = [
  { value: "active",    uk: "Активний",   en: "Active" },
  { value: "draft",     uk: "Чернетка",   en: "Draft" },
  { value: "paused",    uk: "Пауза",      en: "Paused" },
  { value: "completed", uk: "Завершено",  en: "Completed" },
  { value: "archived",  uk: "Архів",      en: "Archived" },
];

const VISIBILITIES = [
  { value: "private",       uk: "Приватний",      en: "Private" },
  { value: "institutional", uk: "Інституційний",  en: "Institutional" },
  { value: "public",        uk: "Публічний",      en: "Public" },
];

const LEARNING_ITEM_TYPES = new Set(["bachelor", "master", "phd", "course"]);

function defaultAcademicSettings(type: string, existing?: Record<string, any>) {
  const years = Number(existing?.years || (type === "phd" ? 4 : type === "master" ? 2 : 4));
  const semestersPerYear = Number(existing?.semestersPerYear || 2);
  const totalSemesters = years * semestersPerYear;
  const semesterDates = Array.from({ length: totalSemesters }, (_, index) => {
    const semester = index + 1;
    const year = Math.ceil(semester / semestersPerYear);
    const found = Array.isArray(existing?.semesterDates)
      ? existing.semesterDates.find((item: any) => Number(item.semester) === semester)
      : null;
    return {
      year,
      semester,
      startsAt: found?.startsAt ?? "",
      endsAt: found?.endsAt ?? "",
    };
  });
  return {
    years,
    semestersPerYear,
    semesterDates,
    holidays: Array.isArray(existing?.holidays) ? existing.holidays : [],
    weekends: Array.isArray(existing?.weekends) ? existing.weekends : [0, 6],
  };
}

export function ItemEditor({
  item,
  locale,
  onClose,
}: {
  item: Item;
  locale: "uk" | "en";
  onClose: () => void;
}) {
  const isUk = locale === "uk";
  const spec = resolveItemFieldSpec(item.type);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── State ──────────────────────────────────────────────────────────
  const [title, setTitle]               = useState(item.title || "");
  const [description, setDescription]   = useState(item.description || "");
  const [emoji, setEmoji]               = useState(item.emoji || "");
  const [status, setStatus]             = useState(item.status || "active");
  const [visibility, setVisibility]     = useState(item.visibility || "private");
  const [supervisor, setSupervisor]     = useState(item.supervisor || "");
  const [startDate, setStartDate]       = useState(item.startDate || "");
  const [plannedEndDate, setEndDate]    = useState(item.plannedEndDate || "");
  const [tags, setTags]                 = useState<string[]>(item.tags || []);
  const [tagInput, setTagInput]         = useState("");
  const [fields, setFields]             = useState<Record<string, any>>(item.fields || {});

  function setField(key: string, value: any) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  }
  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function handleSave() {
    if (!item._id) return;
    if (!title.trim()) {
      setErrorMsg(isUk ? "Назва обов'язкова" : "Title is required");
      return;
    }
    setErrorMsg(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      emoji: emoji.trim() || undefined,
      status,
      visibility,
      supervisor: supervisor.trim() || undefined,
      startDate: startDate || undefined,
      plannedEndDate: plannedEndDate || undefined,
      tags,
      fields: cleanFields(fields),
    };

    try {
      const res = await fetch(`/api/workspace-items/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (isUk ? "Помилка збереження" : "Save failed"));
      }
      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (e: any) {
      setErrorMsg(e?.message || (isUk ? "Помилка мережі" : "Network error"));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <LiquidCard className="overflow-hidden p-0">
          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                {isUk ? "Редагування проєкту" : "Edit project"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Body ─────────────────────────────────────────────────── */}
          <div className="space-y-4 p-5">
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title + emoji */}
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <FieldGroup label={isUk ? "Емодзі" : "Emoji"} icon={<Smile className="h-3 w-3" />}>
                <input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
                  className="input-control rounded-xl py-2.5 pl-3 pr-3 text-2xl text-center"
                  placeholder="🧪"
                />
              </FieldGroup>
              <FieldGroup label={isUk ? "Назва" : "Title"} icon={<Hash className="h-3 w-3" />} required>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-control rounded-xl py-2.5 pl-3 pr-3 text-sm"
                  required
                />
              </FieldGroup>
            </div>

            {/* Description */}
            <FieldGroup label={isUk ? "Опис" : "Description"} icon={<FileText className="h-3 w-3" />}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-control rounded-xl py-2.5 pl-3 pr-3 text-sm leading-6"
                placeholder={isUk ? "Короткий опис проєкту..." : "Short project description..."}
              />
            </FieldGroup>

            {/* Status + visibility */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldGroup label={isUk ? "Статус" : "Status"} icon={<CheckCircle2 className="h-3 w-3" />}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-control rounded-xl px-3 py-2.5 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{isUk ? s.uk : s.en}</option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label={isUk ? "Видимість" : "Visibility"} icon={<User className="h-3 w-3" />}>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="input-control rounded-xl px-3 py-2.5 text-sm"
                >
                  {VISIBILITIES.map((v) => (
                    <option key={v.value} value={v.value}>{isUk ? v.uk : v.en}</option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {/* Supervisor */}
            <FieldGroup label={isUk ? "Науковий керівник" : "Supervisor"} icon={<User className="h-3 w-3" />}>
              <input
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="input-control rounded-xl py-2.5 pl-3 pr-3 text-sm"
                placeholder={isUk ? "Прізвище І. Б." : "Last F. M."}
              />
            </FieldGroup>

            {/* Start + end dates */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FieldGroup label={isUk ? "Старт" : "Start"} icon={<Calendar className="h-3 w-3" />}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-control rounded-xl px-3 py-2.5 text-sm"
                />
              </FieldGroup>
              <FieldGroup label={isUk ? "Плановане завершення" : "Planned end"} icon={<Calendar className="h-3 w-3" />}>
                <input
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-control rounded-xl px-3 py-2.5 text-sm"
                />
              </FieldGroup>
            </div>

            {/* Tags */}
            <FieldGroup label={isUk ? "Теги" : "Tags"} icon={<Tag className="h-3 w-3" />}>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="rounded p-0.5 hover:bg-emerald-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <div className="inline-flex items-center gap-1">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addTag(); }
                    }}
                    placeholder={isUk ? "+ тег" : "+ tag"}
                    className="input-control rounded-md py-1 pl-2 pr-2 text-[11px] w-24"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </FieldGroup>

            {/* ── Type-specific fields ──────────────────────────────── */}
            {LEARNING_ITEM_TYPES.has(item.type) && (
              <AcademicSettingsEditor
                type={item.type}
                value={fields.academicSettings}
                onChange={(value) => setField("academicSettings", value)}
                isUk={isUk}
              />
            )}

            {spec && spec.groups.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-t border-slate-200/60 pt-3">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    {isUk ? "Деталі типу" : "Type-specific fields"}
                  </h3>
                </div>
                {spec.groups.map((group, gi) => (
                  <details key={gi} open className="rounded-xl border border-slate-200 bg-white/60 p-3">
                    <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {isUk ? group.titleUk : group.titleEn}
                    </summary>
                    <div className="mt-3 space-y-3">
                      {group.fields.map((fs) => (
                        <DynamicField
                          key={fs.key}
                          spec={fs}
                          value={fields[fs.key]}
                          onChange={(v) => setField(fs.key, v)}
                          isUk={isUk}
                        />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200/60 bg-slate-50/60 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {isUk ? "Скасувати" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || !title.trim()}
              className="liquid-cta disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isUk ? "Зберегти" : "Save"}
            </button>
          </div>
        </LiquidCard>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {icon}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function AcademicSettingsEditor({
  type,
  value,
  onChange,
  isUk,
}: {
  type: string;
  value: any;
  onChange: (value: any) => void;
  isUk: boolean;
}) {
  const settings = defaultAcademicSettings(type, value);
  const [holidayInput, setHolidayInput] = useState("");
  const weekDays = [
    { value: 1, uk: "Пн", en: "Mon" },
    { value: 2, uk: "Вт", en: "Tue" },
    { value: 3, uk: "Ср", en: "Wed" },
    { value: 4, uk: "Чт", en: "Thu" },
    { value: 5, uk: "Пт", en: "Fri" },
    { value: 6, uk: "Сб", en: "Sat" },
    { value: 0, uk: "Нд", en: "Sun" },
  ];

  function commit(patch: Partial<typeof settings>) {
    const nextBase = { ...settings, ...patch };
    onChange(defaultAcademicSettings(type, nextBase));
  }

  function setSemesterDate(semester: number, key: "startsAt" | "endsAt", nextValue: string) {
    commit({
      semesterDates: settings.semesterDates.map((item) =>
        item.semester === semester ? { ...item, [key]: nextValue } : item,
      ),
    });
  }

  function toggleWeekend(day: number) {
    const next = settings.weekends.includes(day)
      ? settings.weekends.filter((item: number) => item !== day)
      : [...settings.weekends, day].sort((a: number, b: number) => a - b);
    commit({ weekends: next });
  }

  function addHoliday() {
    const valueToAdd = holidayInput.trim();
    if (!valueToAdd || settings.holidays.includes(valueToAdd)) return;
    commit({ holidays: [...settings.holidays, valueToAdd].sort() });
    setHolidayInput("");
  }

  return (
    <details open className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
      <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-indigo-700">
        {isUk ? "Академічна структура" : "Academic structure"}
      </summary>
      <div className="mt-3 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldGroup label={isUk ? "Років навчання" : "Study years"} icon={<GraduationIcon />}>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.years}
              onChange={(e) => commit({ years: Number(e.target.value) })}
              className="input-control rounded-xl px-3 py-2.5 text-sm"
            />
          </FieldGroup>
          <FieldGroup label={isUk ? "Семестрів у році" : "Semesters per year"} icon={<Clock className="h-3 w-3" />}>
            <input
              type="number"
              min={1}
              max={4}
              value={settings.semestersPerYear}
              onChange={(e) => commit({ semestersPerYear: Number(e.target.value) })}
              className="input-control rounded-xl px-3 py-2.5 text-sm"
            />
          </FieldGroup>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {isUk ? "Дати семестрів" : "Semester dates"}
          </p>
          <div className="grid gap-2">
            {settings.semesterDates.map((item: any) => (
              <div key={item.semester} className="grid grid-cols-[74px_1fr_1fr] items-center gap-2 rounded-lg bg-white/80 p-2 ring-1 ring-indigo-100">
                <span className="text-[11px] font-black text-indigo-700">
                  {isUk ? `Сем. ${item.semester}` : `Sem. ${item.semester}`}
                </span>
                <input
                  type="date"
                  value={item.startsAt}
                  onChange={(e) => setSemesterDate(item.semester, "startsAt", e.target.value)}
                  className="input-control rounded-lg px-2 py-1.5 text-xs"
                  aria-label={isUk ? "Початок семестру" : "Semester start"}
                />
                <input
                  type="date"
                  value={item.endsAt}
                  onChange={(e) => setSemesterDate(item.semester, "endsAt", e.target.value)}
                  className="input-control rounded-lg px-2 py-1.5 text-xs"
                  aria-label={isUk ? "Кінець семестру" : "Semester end"}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {isUk ? "Вихідні дні" : "Weekends"}
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekend(day.value)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition ${
                  settings.weekends.includes(day.value)
                    ? "border-indigo-400 bg-indigo-100 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {isUk ? day.uk : day.en}
              </button>
            ))}
          </div>
        </div>

        <FieldGroup label={isUk ? "Канікули / свята" : "Breaks / holidays"} icon={<Calendar className="h-3 w-3" />}>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="date"
                value={holidayInput}
                onChange={(e) => setHolidayInput(e.target.value)}
                className="input-control rounded-xl px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={addHoliday}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
              >
                {isUk ? "Додати" : "Add"}
              </button>
            </div>
            {settings.holidays.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {settings.holidays.map((date: string) => (
                  <span key={date} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-indigo-100">
                    {date}
                    <button type="button" onClick={() => commit({ holidays: settings.holidays.filter((item: string) => item !== date) })}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </FieldGroup>
      </div>
    </details>
  );
}

function GraduationIcon() {
  return <Sparkles className="h-3 w-3" />;
}

function DynamicField({
  spec,
  value,
  onChange,
  isUk,
}: {
  spec: FieldSpec;
  value: any;
  onChange: (v: any) => void;
  isUk: boolean;
}) {
  const Icon = spec.icon;
  const label = isUk ? spec.label.uk : spec.label.en;
  const t = spec.type ?? "text";

  if (t === "longtext") {
    return (
      <FieldGroup label={label} icon={<Icon className="h-3 w-3" />}>
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="input-control rounded-xl py-2 pl-3 pr-3 text-sm leading-6"
          placeholder={spec.placeholder}
        />
      </FieldGroup>
    );
  }

  if (t === "list") {
    return <ListField label={label} icon={<Icon className="h-3 w-3" />} value={value} onChange={onChange} isUk={isUk} />;
  }

  if (t === "enum" && spec.enum) {
    return (
      <FieldGroup label={label} icon={<Icon className="h-3 w-3" />}>
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="input-control rounded-xl px-3 py-2 text-sm"
        >
          <option value="">— {isUk ? "не обрано" : "not set"} —</option>
          {spec.enum.map((opt) => (
            <option key={opt.value} value={opt.value}>{isUk ? opt.label.uk : opt.label.en}</option>
          ))}
        </select>
      </FieldGroup>
    );
  }

  const inputType = t === "date" ? "date" : t === "number" || t === "money" ? "number" : t === "url" ? "url" : "text";

  return (
    <FieldGroup label={label} icon={<Icon className="h-3 w-3" />}>
      <input
        type={inputType}
        value={value ?? ""}
        onChange={(e) => onChange(
          inputType === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value
        )}
        className="input-control rounded-xl py-2 pl-3 pr-3 text-sm"
        placeholder={spec.placeholder}
      />
    </FieldGroup>
  );
}

function ListField({
  label,
  icon,
  value,
  onChange,
  isUk,
}: {
  label: string;
  icon: React.ReactNode;
  value: any;
  onChange: (v: any) => void;
  isUk: boolean;
}) {
  const arr: string[] = Array.isArray(value) ? value.map((v) => (typeof v === "object" ? v?.title || JSON.stringify(v) : String(v))) : [];
  const [input, setInput] = useState("");

  function add() {
    const t = input.trim();
    if (!t || arr.includes(t)) return;
    onChange([...arr, t]);
    setInput("");
  }
  function remove(t: string) {
    onChange(arr.filter((x) => x !== t));
  }

  return (
    <FieldGroup label={label} icon={icon}>
      <div className="flex flex-wrap gap-1.5">
        {arr.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="rounded p-0.5 hover:bg-blue-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <div className="inline-flex items-center gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); add(); }
            }}
            placeholder={isUk ? "+ елемент" : "+ item"}
            className="input-control rounded-md py-1 pl-2 pr-2 text-[11px] w-32"
          />
          <button
            type="button"
            onClick={add}
            className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-blue-100 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </FieldGroup>
  );
}

function cleanFields(f: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v == null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
