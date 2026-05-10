"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  PenLine, Users2, FilePlus, MessageSquare, Inbox,
  CheckCircle2, CalendarCheck, Plus, Pencil, Trash2, X,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { saveDiaryEntry, deleteDiaryEntry } from "@/app/actions";
import type { DiaryEntry, DiaryEntryType } from "@/lib/schemas";

// ── Entry type config ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<DiaryEntryType, {
  label: string;
  icon: React.ElementType;
  color: string;       // tailwind bg class for dot
  badge: string;       // tailwind classes for badge
}> = {
  note:             { label: "Нотатка",              icon: PenLine,      color: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
  meeting:          { label: "Зустріч",              icon: Users2,       color: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  application:      { label: "Заява / документ",     icon: FilePlus,     color: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  info_received:    { label: "Отримана інформація",  icon: MessageSquare, color: "bg-violet-500", badge: "bg-violet-50 text-violet-700 border-violet-200" },
  request_received: { label: "Запит / прохання",     icon: Inbox,        color: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  task_done:        { label: "Виконано",             icon: CheckCircle2, color: "bg-teal-500",   badge: "bg-teal-50 text-teal-700 border-teal-200" },
  event:            { label: "Подія / захід",        icon: CalendarCheck, color: "bg-rose-500",  badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

const TYPE_EXTRA_FIELDS: Record<DiaryEntryType, Array<{ name: string; label: string; placeholder: string }>> = {
  note:             [],
  meeting:          [
    { name: "person",    label: "Особа / установа",     placeholder: "Ім'я, посада або назва організації" },
    { name: "place",     label: "Місце",                placeholder: "Кабінет, адреса, платформа…" },
    { name: "outcome",   label: "Підсумок зустрічі",    placeholder: "Що вирішили, про що домовились…" },
  ],
  application:      [
    { name: "recipient", label: "Куди подано",          placeholder: "Назва установи / відділу" },
    { name: "docRef",    label: "Номер / реєстр",       placeholder: "Реєстраційний номер або індекс" },
    { name: "outcome",   label: "Статус / результат",   placeholder: "Прийнято, відмовлено, на розгляді…" },
  ],
  info_received:    [
    { name: "person",    label: "Від кого",             placeholder: "Ім'я або посада" },
    { name: "outcome",   label: "Що зроблено з цим",    placeholder: "Передано далі, враховано, ігноровано…" },
  ],
  request_received: [
    { name: "person",    label: "Хто попросив",         placeholder: "Ім'я або посада" },
    { name: "outcome",   label: "Статус виконання",     placeholder: "Виконано / в процесі / відхилено…" },
  ],
  task_done:        [
    { name: "outcome",   label: "Результат",            placeholder: "Що вийшло, якого ефекту досягли…" },
  ],
  event:            [
    { name: "place",     label: "Місце проведення",     placeholder: "Місто, майданчик, онлайн-посилання" },
    { name: "person",    label: "Організатор / учасники", placeholder: "Хто організовував або хто брав участь" },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateHeader(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function groupByDate(entries: DiaryEntry[]): Map<string, DiaryEntry[]> {
  const map = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}

// ── Entry card ────────────────────────────────────────────────────────────────

function EntryCard({
  entry, canManage, onEdit, onDelete,
}: {
  entry: DiaryEntry; canManage: boolean;
  onEdit: (e: DiaryEntry) => void; onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[entry.type];
  const Icon = cfg.icon;
  const extras = [
    entry.person && { label: "Особа", value: entry.person },
    entry.place && { label: "Місце", value: entry.place },
    entry.recipient && { label: "Адресат", value: entry.recipient },
    entry.docRef && { label: "Реєстр. №", value: entry.docRef },
    entry.outcome && { label: "Результат", value: entry.outcome },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const hasMore = Boolean(entry.body || extras.length > 0);

  return (
    <article className="relative flex gap-3">
      {/* Timeline dot */}
      <div className="mt-1 flex-shrink-0">
        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white shadow-sm ${cfg.color}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
                <Icon className="h-2.5 w-2.5" />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{entry.title}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
                title={expanded ? "Згорнути" : "Розгорнути"}
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="text-slate-400 hover:text-blue-600 p-1 rounded transition"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry._id!)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {hasMore && expanded && (
          <div className="border-t border-slate-100 px-4 py-3 space-y-2">
            {extras.map(({ label, value }) => (
              <div key={label} className="flex gap-2 text-xs">
                <span className="w-24 flex-shrink-0 font-medium text-slate-400">{label}</span>
                <span className="text-slate-700">{value}</span>
              </div>
            ))}
            {entry.body && (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pt-1 border-t border-slate-100">
                {entry.body}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Entry form (modal) ────────────────────────────────────────────────────────

function EntryForm({
  projectId, entry, onClose, onSaved,
}: {
  projectId: string; entry: DiaryEntry | null;
  onClose: () => void; onSaved: (e: DiaryEntry) => void;
}) {
  const [type, setType] = useState<DiaryEntryType>(entry?.type ?? "note");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const extraFields = TYPE_EXTRA_FIELDS[type];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.set("type", type);
    fd.set("projectId", projectId);
    if (entry?._id) fd.set("_id", entry._id);

    setError("");
    startTransition(async () => {
      const result = await saveDiaryEntry(fd);
      if (result.ok && result.entry) {
        onSaved(result.entry as DiaryEntry);
      } else {
        setError("Помилка збереження. Перевірте поля.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {entry ? "Редагувати запис" : "Новий запис"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Type chips */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Тип запису
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(TYPE_CONFIG) as [DiaryEntryType, typeof TYPE_CONFIG[DiaryEntryType]][]).map(([code, cfg]) => {
                const Icon = cfg.icon;
                const active = type === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setType(code)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ${
                      active
                        ? `${cfg.badge} border-current shadow-sm`
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + Title */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Дата</span>
              <input
                type="date"
                name="date"
                defaultValue={entry?.date ?? todayIso()}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
              />
            </label>
            <div className="sm:col-span-1 col-span-full">
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-600">Заголовок *</span>
                <input
                  type="text"
                  name="title"
                  defaultValue={entry?.title}
                  required
                  maxLength={300}
                  placeholder="Стисло про що запис…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
                />
              </label>
            </div>
          </div>

          {/* Type-specific extra fields */}
          {extraFields.length > 0 && (
            <div className="space-y-3 rounded-xl bg-slate-50 px-4 py-3">
              {extraFields.map((f) => (
                <label key={f.name} className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-500">{f.label}</span>
                  <input
                    type="text"
                    name={f.name}
                    defaultValue={(entry as Record<string, string> | null)?.[f.name] ?? ""}
                    maxLength={300}
                    placeholder={f.placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                </label>
              ))}
            </div>
          )}

          {/* Body */}
          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-600">Детальні нотатки</span>
            <textarea
              name="body"
              defaultValue={entry?.body}
              rows={4}
              maxLength={4000}
              placeholder="Довільний текст: деталі, думки, посилання…"
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </label>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-[#1a3564] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d55] transition disabled:opacity-50"
            >
              {isPending ? "Збереження…" : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function ActivityDiary({
  projectId, canManage, initialEntries,
}: {
  projectId: string; canManage: boolean; initialEntries: DiaryEntry[];
}) {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries);
  const [editEntry, setEditEntry] = useState<DiaryEntry | null | "new">(null);
  const [, startTransition] = useTransition();

  const groups = groupByDate([...entries].sort((a, b) => b.date.localeCompare(a.date)));
  const sortedDates = [...groups.keys()].sort((a, b) => b.localeCompare(a));

  function handleSaved(saved: DiaryEntry) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditEntry(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Видалити цей запис?")) return;
    startTransition(async () => {
      await deleteDiaryEntry(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Щоденник діяльності</h2>
          <p className="text-xs text-slate-400 mt-0.5">Хронологічний альманах ваших дій та подій</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setEditEntry("new")}
            className="flex items-center gap-2 rounded-xl bg-[#1a3564] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#162d55] transition"
          >
            <Plus className="h-4 w-4" /> Додати запис
          </button>
        )}
      </div>

      {/* Type legend */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(TYPE_CONFIG) as [DiaryEntryType, typeof TYPE_CONFIG[DiaryEntryType]][]).map(([, cfg]) => {
          const Icon = cfg.icon;
          return (
            <span
              key={cfg.label}
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
            >
              <Icon className="h-2.5 w-2.5" />{cfg.label}
            </span>
          );
        })}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <PenLine className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">Щоденник порожній</p>
          <p className="text-xs text-slate-400 mt-1">Додайте перший запис — зустріч, заяву, нотатку…</p>
          {canManage && (
            <button
              type="button"
              onClick={() => setEditEntry("new")}
              className="mt-4 rounded-xl bg-[#1a3564] px-5 py-2 text-sm font-semibold text-white hover:bg-[#162d55] transition"
            >
              Додати запис
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {sortedDates.map((date) => {
        const dayEntries = groups.get(date)!;
        return (
          <section key={date}>
            {/* Date header */}
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="flex-shrink-0 rounded-full border border-slate-200 bg-white px-3 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm">
                {fmtDateHeader(date)}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Entries with vertical line */}
            <div className="relative ml-3.5">
              {/* Vertical connector line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-3 pl-2">
                {dayEntries.map((entry) => (
                  <EntryCard
                    key={entry._id}
                    entry={entry}
                    canManage={canManage}
                    onEdit={(e) => setEditEntry(e)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Modal */}
      {editEntry !== null && (
        <EntryForm
          projectId={projectId}
          entry={editEntry === "new" ? null : editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
