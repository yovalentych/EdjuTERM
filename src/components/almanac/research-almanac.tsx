"use client";

import { useState, useTransition, useMemo } from "react";
import {
  CheckSquare, Flag, Layers, FlaskConical, CalendarDays,
  BookOpen, Package, ChevronLeft, ChevronRight,
  ExternalLink, CheckCircle2, Circle, AlertCircle,
  LayoutList, Calendar, CalendarRange, TrendingUp, SlidersHorizontal,
  Clock, Zap,
} from "lucide-react";
import { patchTaskStatus, patchExperimentStatusAlmanac } from "@/app/actions";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SourceType =
  | "task" | "milestone" | "stage" | "experiment"
  | "event" | "publication" | "deliverable";

export type AlmanacItem = {
  id: string;
  source: SourceType;
  date: string;       // YYYY-MM-DD primary date (empty = undated)
  endDate?: string;
  title: string;
  status: string;
  priority?: string;
  meta?: string;
  href?: string;
  projectId?: string;
  deadlines?: Array<{ label: string; date: string }>;
};

type ViewMode = "day" | "week" | "month" | "quarter" | "tasks";

// ── Source config ─────────────────────────────────────────────────────────────

const SOURCE_CFG: Record<SourceType, {
  label: string;
  icon: React.ElementType;
  dot: string;       // bg-* class
  badge: string;     // text+bg+border classes
}> = {
  task:        { label: "Задача",      icon: CheckSquare,  dot: "bg-indigo-500",  badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  milestone:   { label: "Ключова дата", icon: Flag,        dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  stage:       { label: "Етап НДР",    icon: Layers,       dot: "bg-blue-600",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  experiment:  { label: "Експеримент", icon: FlaskConical, dot: "bg-violet-500",  badge: "bg-violet-50 text-violet-700 border-violet-200" },
  event:       { label: "Подія",       icon: CalendarDays, dot: "bg-rose-500",    badge: "bg-rose-50 text-rose-700 border-rose-200" },
  publication: { label: "Публікація",  icon: BookOpen,     dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  deliverable: { label: "Результат",   icon: Package,      dot: "bg-teal-500",    badge: "bg-teal-50 text-teal-700 border-teal-200" },
};

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  todo: "До виконання", in_progress: "В роботі", done: "Виконано", cancelled: "Скасовано",
  upcoming: "Очікується", reached: "Досягнуто", missed: "Пропущено",
  planned: "Заплановано", active: "Активний", completed: "Завершено",
  reported: "Задокументовано", overdue: "Прострочено",
  submitted: "Подано", under_review: "На рецензії", accepted: "Прийнято",
  published: "Опубліковано", rejected: "Відхилено",
  in_silico: "In silico", in_vitro: "In vitro", in_vivo: "In vivo", on_hold: "Призупинено",
  delayed: "Затримка", abstract_submitted: "Тези подано", attended: "Відвідано",
};

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  reached: "bg-emerald-100 text-emerald-700",
  accepted: "bg-emerald-100 text-emerald-700",
  published: "bg-emerald-100 text-emerald-700",
  attended: "bg-emerald-100 text-emerald-700",
  active: "bg-blue-100 text-blue-700",
  submitted: "bg-blue-100 text-blue-700",
  abstract_submitted: "bg-blue-100 text-blue-700",
  planned: "bg-slate-100 text-slate-600",
  upcoming: "bg-slate-100 text-slate-600",
  reported: "bg-purple-100 text-purple-700",
  under_review: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  missed: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
  overdue: "bg-red-100 text-red-700",
  delayed: "bg-amber-100 text-amber-700",
  on_hold: "bg-amber-100 text-amber-700",
};

const PRIORITY_ICON: Record<string, string> = {
  low: "text-slate-400", medium: "text-amber-500", high: "text-orange-500", critical: "text-red-600",
};

// ── Date utilities ─────────────────────────────────────────────────────────────

function todayIso(): string { return new Date().toISOString().slice(0, 10); }

function isoWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function addMonths(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("uk-UA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("uk-UA", {
    day: "numeric", month: "short",
  });
}

function fmtMonth(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
}

function quarterLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

function quarterStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return `${d.getFullYear()}-${String(qMonth + 1).padStart(2, "0")}-01`;
}

function nextQuarterStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const qMonth = Math.floor(d.getMonth() / 3) * 3 + 3;
  if (qMonth >= 12) return `${d.getFullYear() + 1}-01-01`;
  return `${d.getFullYear()}-${String(qMonth + 1).padStart(2, "0")}-01`;
}

function monthStart(iso: string): string {
  return iso.slice(0, 7) + "-01";
}

function nextMonthStart(iso: string): string {
  return addMonths(monthStart(iso), 1);
}

// Filter items that fall within [from, to) (inclusive from)
function itemsInRange(items: AlmanacItem[], from: string, to: string): AlmanacItem[] {
  return items.filter((item) => {
    if (!item.date) return false;
    const start = item.date;
    const end = item.endDate ?? item.date;
    return start < to && end >= from;
  });
}

// Effective date to display for an item within a range
function itemDisplayDate(item: AlmanacItem, rangeFrom: string): string {
  return item.date >= rangeFrom ? item.date : rangeFrom;
}

// Group items by date string
function groupByDate(items: AlmanacItem[], rangeFrom: string): Map<string, AlmanacItem[]> {
  const map = new Map<string, AlmanacItem[]>();
  for (const item of items) {
    const key = itemDisplayDate(item, rangeFrom);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

// ── Item card ──────────────────────────────────────────────────────────────────

function ItemCard({
  item, canManage, onTaskToggle, onExpStatusChange,
}: {
  item: AlmanacItem; canManage: boolean;
  onTaskToggle?: (id: string, newStatus: string) => void;
  onExpStatusChange?: (id: string, newStatus: string) => void;
}) {
  const cfg = SOURCE_CFG[item.source];
  const Icon = cfg.icon;
  const isDone = item.status === "done" || item.status === "completed" || item.status === "reached" || item.status === "published";
  const isTask = item.source === "task";
  const isExp = item.source === "experiment";
  const isOverdue = item.date && item.date < todayIso() && !isDone;

  function nextTaskStatus(cur: string): string {
    if (cur === "todo") return "in_progress";
    if (cur === "in_progress") return "done";
    return "todo";
  }

  const expStatuses = ["planned", "in_progress", "completed", "on_hold", "cancelled"];

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md ${
      isOverdue ? "border-red-200" : "border-slate-200"
    }`}>
      {/* Source dot */}
      <div className={`mt-0.5 h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center text-white shadow-sm ${cfg.dot}`}>
        <Icon className="h-3 w-3" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[item.status] ?? "bg-slate-100 text-slate-600"}`}>
            {STATUS_LABEL[item.status] ?? item.status}
          </span>
          {item.priority && item.priority !== "medium" && (
            <Zap className={`h-3 w-3 flex-shrink-0 ${PRIORITY_ICON[item.priority] ?? ""}`} />
          )}
          {isOverdue && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-600">
              <AlertCircle className="h-3 w-3" /> прострочено
            </span>
          )}
          {item.endDate && item.endDate !== item.date && (
            <span className="text-[10px] text-slate-400">
              → {fmtShortDate(item.endDate)}
            </span>
          )}
        </div>

        <p className={`text-sm font-medium leading-snug ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
          {item.title}
        </p>

        {item.meta && (
          <p className="mt-0.5 text-[11px] text-slate-400">{item.meta}</p>
        )}

        {/* Event deadlines */}
        {item.deadlines && item.deadlines.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {item.deadlines.map((dl) => (
              <span key={dl.label} className={`text-[10px] rounded px-1.5 py-0.5 ${
                dl.date < todayIso() ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"
              }`}>
                <Clock className="inline h-2.5 w-2.5 mr-0.5" />{dl.label}: {dl.date}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {canManage && isTask && onTaskToggle && (
          <button
            type="button"
            onClick={() => onTaskToggle(item.id, nextTaskStatus(item.status))}
            title={`Змінити статус → ${STATUS_LABEL[nextTaskStatus(item.status)]}`}
            className="rounded p-1 text-slate-400 hover:text-indigo-600 transition"
          >
            {isDone
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              : <Circle className="h-4 w-4" />
            }
          </button>
        )}
        {canManage && isExp && onExpStatusChange && (
          <select
            value={item.status}
            onChange={(e) => onExpStatusChange(item.id, e.target.value)}
            className="rounded border border-slate-200 px-1 py-0.5 text-[10px] text-slate-600 focus:outline-none"
          >
            {expStatuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
            ))}
          </select>
        )}
        {item.href && (
          <a
            href={item.href}
            title="Відкрити у модулі"
            className="rounded p-1 text-slate-400 hover:text-slate-700 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Date group ─────────────────────────────────────────────────────────────────

function DateGroup({
  date, items, canManage, onTaskToggle, onExpStatusChange, isToday,
}: {
  date: string; items: AlmanacItem[]; canManage: boolean; isToday?: boolean;
  onTaskToggle: (id: string, s: string) => void;
  onExpStatusChange: (id: string, s: string) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className={`flex-shrink-0 rounded-full border px-3 py-0.5 text-[11px] font-semibold shadow-sm ${
          isToday
            ? "border-indigo-300 bg-indigo-600 text-white"
            : "border-slate-200 bg-white text-slate-500"
        }`}>
          {isToday ? "Сьогодні · " : ""}{fmtDay(date)}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ItemCard key={`${item.source}-${item.id}`} item={item} canManage={canManage}
            onTaskToggle={onTaskToggle} onExpStatusChange={onExpStatusChange} />
        ))}
      </div>
    </section>
  );
}

// ── Views ──────────────────────────────────────────────────────────────────────

function TimelineView({
  items, from, to, canManage, onTaskToggle, onExpStatusChange,
}: {
  items: AlmanacItem[]; from: string; to: string; canManage: boolean;
  onTaskToggle: (id: string, s: string) => void;
  onExpStatusChange: (id: string, s: string) => void;
}) {
  const ranged = itemsInRange(items, from, to);
  const grouped = groupByDate(ranged, from);
  const today = todayIso();
  const sortedDates = [...grouped.keys()].sort();

  if (sortedDates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">Немає подій за цей період</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sortedDates.map((date) => (
        <DateGroup key={date} date={date} items={grouped.get(date)!}
          canManage={canManage} isToday={date === today}
          onTaskToggle={onTaskToggle} onExpStatusChange={onExpStatusChange} />
      ))}
    </div>
  );
}

function TasksView({
  items, canManage, onTaskToggle, onExpStatusChange,
}: {
  items: AlmanacItem[]; canManage: boolean;
  onTaskToggle: (id: string, s: string) => void;
  onExpStatusChange: (id: string, s: string) => void;
}) {
  const sources = Object.keys(SOURCE_CFG) as SourceType[];

  return (
    <div className="space-y-6">
      {sources.map((source) => {
        const group = items.filter((i) => i.source === source);
        if (group.length === 0) return null;
        const cfg = SOURCE_CFG[source];
        const Icon = cfg.icon;
        const sorted = [...group].sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.localeCompare(b.date);
        });
        return (
          <section key={source}>
            <div className="mb-2 flex items-center gap-2">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white ${cfg.dot}`}>
                <Icon className="h-2.5 w-2.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">{cfg.label}</h3>
              <span className="text-xs text-slate-400">({group.length})</span>
            </div>
            <div className="space-y-2 pl-7">
              {sorted.map((item) => (
                <ItemCard key={`${item.source}-${item.id}`} item={item} canManage={canManage}
                  onTaskToggle={onTaskToggle} onExpStatusChange={onExpStatusChange} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Nav header ─────────────────────────────────────────────────────────────────

function NavHeader({
  label, onPrev, onNext, onToday,
}: {
  label: string; onPrev: () => void; onNext: () => void; onToday: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev}
        className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50 transition">
        <ChevronLeft className="h-4 w-4 text-slate-500" />
      </button>
      <button type="button" onClick={onToday}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
        Сьогодні
      </button>
      <span className="min-w-32 text-center text-sm font-semibold text-slate-800 capitalize">{label}</span>
      <button type="button" onClick={onNext}
        className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50 transition">
        <ChevronRight className="h-4 w-4 text-slate-500" />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ResearchAlmanac({
  items: initialItems, projectId, locale, canManage,
}: {
  items: AlmanacItem[]; projectId: string; locale: string; canManage: boolean;
}) {
  const [items, setItems] = useState<AlmanacItem[]>(initialItems);
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(todayIso()); // anchor date for navigation
  const [activeFilters, setActiveFilters] = useState<Set<SourceType>>(
    new Set(Object.keys(SOURCE_CFG) as SourceType[]),
  );
  const [showFilters, setShowFilters] = useState(false);
  const [, startTransition] = useTransition();

  // ── Filter ──────────────────────────────────────────────────────────────────

  const filteredItems = useMemo(
    () => items.filter((i) => activeFilters.has(i.source)),
    [items, activeFilters],
  );

  function toggleFilter(source: SourceType) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(source) ? next.delete(source) : next.add(source);
      return next;
    });
  }

  // ── Quick status updates ────────────────────────────────────────────────────

  function handleTaskToggle(taskId: string, newStatus: string) {
    setItems((prev) => prev.map((i) =>
      i.id === taskId ? { ...i, status: newStatus } : i,
    ));
    startTransition(() => { void patchTaskStatus(taskId, newStatus, projectId); });
  }

  function handleExpStatus(expId: string, newStatus: string) {
    setItems((prev) => prev.map((i) =>
      i.id === expId ? { ...i, status: newStatus } : i,
    ));
    startTransition(() => { void patchExperimentStatusAlmanac(expId, newStatus, projectId); });
  }

  // ── Navigation bounds ───────────────────────────────────────────────────────

  const { from, to, navLabel } = useMemo(() => {
    if (view === "day") {
      return { from: cursor, to: addDays(cursor, 1), navLabel: fmtDay(cursor) };
    }
    if (view === "week") {
      const ws = isoWeekStart(new Date(`${cursor}T00:00:00`)).toISOString().slice(0, 10);
      const we = addDays(ws, 7);
      return { from: ws, to: we, navLabel: `${fmtShortDate(ws)} – ${fmtShortDate(addDays(ws, 6))}` };
    }
    if (view === "month") {
      const ms = monthStart(cursor);
      return { from: ms, to: nextMonthStart(cursor), navLabel: fmtMonth(cursor) };
    }
    if (view === "quarter") {
      const qs = quarterStart(cursor);
      return { from: qs, to: nextQuarterStart(cursor), navLabel: quarterLabel(cursor) };
    }
    return { from: "", to: "", navLabel: "" };
  }, [view, cursor]);

  function navigatePrev() {
    if (view === "day") setCursor((c) => addDays(c, -1));
    else if (view === "week") setCursor((c) => addDays(c, -7));
    else if (view === "month") setCursor((c) => addMonths(c, -1));
    else if (view === "quarter") setCursor((c) => addMonths(c, -3));
  }
  function navigateNext() {
    if (view === "day") setCursor((c) => addDays(c, 1));
    else if (view === "week") setCursor((c) => addDays(c, 7));
    else if (view === "month") setCursor((c) => addMonths(c, 1));
    else if (view === "quarter") setCursor((c) => addMonths(c, 3));
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: items.length,
    done: items.filter((i) => ["done", "completed", "reached", "published", "attended"].includes(i.status)).length,
    overdue: items.filter((i) => i.date && i.date < todayIso() && !["done", "completed", "reached", "published", "cancelled", "attended"].includes(i.status)).length,
    today: items.filter((i) => i.date === todayIso()).length,
  }), [items]);

  const viewTabs: Array<{ id: ViewMode; label: string; icon: React.ElementType }> = [
    { id: "day",     label: "День",    icon: Clock },
    { id: "week",    label: "Тиждень", icon: Calendar },
    { id: "month",   label: "Місяць",  icon: CalendarRange },
    { id: "quarter", label: "Квартал", icon: TrendingUp },
    { id: "tasks",   label: "По типах", icon: LayoutList },
  ];

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Усього", value: stats.total, color: "text-slate-700" },
          { label: "Сьогодні", value: stats.today, color: "text-indigo-700" },
          { label: "Виконано", value: stats.done, color: "text-emerald-700" },
          { label: "Прострочено", value: stats.overdue, color: "text-red-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View switcher */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-0.5">
          {viewTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                view === id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Nav arrows (only for time-based views) */}
          {view !== "tasks" && (
            <NavHeader
              label={navLabel}
              onPrev={navigatePrev}
              onNext={navigateNext}
              onToday={() => setCursor(todayIso())}
            />
          )}

          {/* Filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              showFilters ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Фільтр
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Типи об'єктів</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SOURCE_CFG) as [SourceType, typeof SOURCE_CFG[SourceType]][]).map(([src, cfg]) => {
              const Icon = cfg.icon;
              const active = activeFilters.has(src);
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => toggleFilter(src)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active ? `${cfg.badge} border-current` : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  <Icon className="h-3 w-3" />{cfg.label}
                  {active && <span className="text-[10px] opacity-60">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main view */}
      {view === "tasks" ? (
        <TasksView
          items={filteredItems}
          canManage={canManage}
          onTaskToggle={handleTaskToggle}
          onExpStatusChange={handleExpStatus}
        />
      ) : (
        <TimelineView
          items={filteredItems}
          from={from}
          to={to}
          canManage={canManage}
          onTaskToggle={handleTaskToggle}
          onExpStatusChange={handleExpStatus}
        />
      )}

      {/* Undated items (always shown at bottom in time views) */}
      {view !== "tasks" && (() => {
        const undated = filteredItems.filter((i) => !i.date);
        if (undated.length === 0) return null;
        return (
          <section className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Без дати ({undated.length})</p>
            <div className="space-y-2">
              {undated.map((item) => (
                <ItemCard key={`${item.source}-${item.id}`} item={item} canManage={canManage}
                  onTaskToggle={handleTaskToggle} onExpStatusChange={handleExpStatus} />
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
