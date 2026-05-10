"use client";

import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe,
  Microscope,
  Search,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AuditEvent } from "@/lib/schemas";

// ── Category config ───────────────────────────────────────────────────────────

type Category =
  | "project"
  | "record"
  | "budget"
  | "planning"
  | "research"
  | "experiment"
  | "event"
  | "report"
  | "zenodo"
  | "open_science"
  | "user";

const CATEGORY_META: Record<
  Category,
  { label: string; icon: React.ReactNode; pill: string; row: string; dot: string }
> = {
  project: {
    label: "Проєкт",
    icon: <FolderOpen className="h-3.5 w-3.5" />,
    pill: "border-blue-200 bg-blue-50 text-blue-700",
    row: "border-l-blue-400",
    dot: "bg-blue-500",
  },
  record: {
    label: "Запис даних",
    icon: <Database className="h-3.5 w-3.5" />,
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    row: "border-l-emerald-400",
    dot: "bg-emerald-500",
  },
  budget: {
    label: "Бюджет",
    icon: <Wallet className="h-3.5 w-3.5" />,
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    row: "border-l-amber-400",
    dot: "bg-amber-500",
  },
  planning: {
    label: "Планування",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    pill: "border-violet-200 bg-violet-50 text-violet-700",
    row: "border-l-violet-400",
    dot: "bg-violet-500",
  },
  research: {
    label: "Дослідження",
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    pill: "border-indigo-200 bg-indigo-50 text-indigo-700",
    row: "border-l-indigo-400",
    dot: "bg-indigo-500",
  },
  experiment: {
    label: "Експеримент",
    icon: <Microscope className="h-3.5 w-3.5" />,
    pill: "border-cyan-200 bg-cyan-50 text-cyan-700",
    row: "border-l-cyan-400",
    dot: "bg-cyan-500",
  },
  event: {
    label: "Наукова подія",
    icon: <CalendarDays className="h-3.5 w-3.5" />,
    pill: "border-orange-200 bg-orange-50 text-orange-700",
    row: "border-l-orange-400",
    dot: "bg-orange-500",
  },
  report: {
    label: "Звіт",
    icon: <FileText className="h-3.5 w-3.5" />,
    pill: "border-slate-200 bg-slate-100 text-slate-600",
    row: "border-l-slate-300",
    dot: "bg-slate-400",
  },
  zenodo: {
    label: "Zenodo",
    icon: <Globe className="h-3.5 w-3.5" />,
    pill: "border-teal-200 bg-teal-50 text-teal-700",
    row: "border-l-teal-400",
    dot: "bg-teal-500",
  },
  open_science: {
    label: "Відкрита наука",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    pill: "border-rose-200 bg-rose-50 text-rose-700",
    row: "border-l-rose-400",
    dot: "bg-rose-500",
  },
  user: {
    label: "Користувач",
    icon: <UserRound className="h-3.5 w-3.5" />,
    pill: "border-stone-200 bg-stone-100 text-stone-600",
    row: "border-l-stone-300",
    dot: "bg-stone-400",
  },
};

// ── Action → human label ──────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  "project.created": "Проєкт створено",
  "project.settings.updated": "Налаштування проєкту оновлено",
  "project.member.added": "Учасника додано до проєкту",
  "project.member.removed": "Учасника видалено з проєкту",
  "project.supervisor.changed": "Наукового керівника змінено",
  "project.invitation.created": "Надіслано запрошення",
  "project.join_code.generated": "Код для приєднання згенеровано",
  "project.joined_by_code": "Приєднання за кодом",

  "user.profile.updated": "Профіль оновлено",
  "admin.viewed": "Адмін-панель переглянуто",

  "budget.period.created": "Бюджетний період створено",
  "budget.line_item.created": "Рядок бюджету додано",
  "budget.request.submitted": "Запит на закупівлю подано",
  "budget.request.approved": "Запит на закупівлю схвалено",
  "budget.request.rejected": "Запит на закупівлю відхилено",
  "budget.request.purchased": "Закупівлю виконано",

  "planning.task.created": "Задачу створено",
  "planning.task.status_changed": "Статус задачі змінено",
  "planning.milestone.created": "Контрольну точку створено",
  "planning.milestone.reached": "Контрольну точку досягнуто",
  "planning.time.logged": "Час роботи зафіксовано",

  "research.stage.created": "Науковий етап створено",
  "research.stage.updated": "Науковий етап оновлено",
  "research.stage.deleted": "Науковий етап видалено",
  "research.stage.status_changed": "Статус етапу змінено",
  "research.stage.progress_updated": "Прогрес етапу оновлено",
  "research.publication.created": "Публікацію додано",
  "research.deliverable.created": "Результат (deliverable) додано",

  "experiment.created": "Експеримент створено",
  "experiment.updated": "Експеримент оновлено",
  "experiment.methodology_linked": "Методологію прив'язано до експерименту",
  "experiment.record_generated": "Запис даних згенеровано з експерименту",

  "report.created": "Звіт створено",
  "report.updated": "Звіт оновлено",
  "report.status_changed": "Статус звіту змінено",

  "record.created": "Запис даних створено",
  "record.updated": "Запис даних оновлено",
  "record.versioned": "Нову версію запису створено",
  "record.variant_created": "Варіант запису створено",
  "record.processing_status.changed": "Статус обробки запису змінено",
  "record.archived": "Запис архівовано",
  "record.restored": "Запис відновлено з архіву",
  "record.deleted": "Запис видалено",

  "zenodo.draft.synced": "Чернетку синхронізовано з Zenodo",
  "zenodo.draft.sync_failed": "Помилка синхронізації чернетки з Zenodo",
  "zenodo.files.synced": "Файли синхронізовано з Zenodo",
  "zenodo.files.sync_failed": "Помилка синхронізації файлів з Zenodo",
  "zenodo.record.published": "Запис опубліковано на Zenodo",
  "zenodo.record.publish_failed": "Помилка публікації на Zenodo",
  "zenodo.status.checked": "Статус Zenodo перевірено",
  "zenodo.status.deleted": "Запис Zenodo видалено",

  "open_science.created": "Допис відкритої науки створено",
  "open_science.updated": "Допис відкритої науки оновлено",
  "open_science.deleted": "Допис відкритої науки видалено",

  "event.created": "Наукову подію додано",
  "event.updated": "Наукову подію оновлено",
  "event.deleted": "Наукову подію видалено",
  "event.participation.added": "Учасника додано до події",
  "event.participation.updated": "Участь у події оновлено",
  "event.participation.removed": "Учасника видалено з події",
  "event.submission.added": "Подання / матеріал додано",
  "event.submission.updated": "Подання оновлено",
  "event.submission.removed": "Подання видалено",
};

// ── Action → category ─────────────────────────────────────────────────────────

function getCategory(action: string): Category {
  if (action.startsWith("project.")) return "project";
  if (action.startsWith("record.")) return "record";
  if (action.startsWith("budget.")) return "budget";
  if (action.startsWith("planning.")) return "planning";
  if (action.startsWith("research.")) return "research";
  if (action.startsWith("experiment.")) return "experiment";
  if (action.startsWith("event.")) return "event";
  if (action.startsWith("report.")) return "report";
  if (action.startsWith("zenodo.")) return "zenodo";
  if (action.startsWith("open_science.")) return "open_science";
  return "user";
}

// ── Metadata renderer ─────────────────────────────────────────────────────────

const HIDDEN_KEYS = new Set(["recordId", "updateId", "sourceId"]);

const META_LABEL: Record<string, string> = {
  title: "Назва",
  localId: "ID",
  status: "Статус",
  variantLabel: "Варіант",
  updateType: "Тип",
  hours: "Годин",
  taskTitle: "Задача",
  milestoneTitle: "Контрольна точка",
  stageNumber: "Етап №",
  progress: "Прогрес",
  amount: "Сума",
  category: "Категорія",
  period: "Період",
  email: "Email",
  role: "Роль",
  doi: "DOI",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Чернетка",
  ready: "Готово",
  submitted: "Подано",
  approved: "Схвалено",
  rejected: "Відхилено",
  purchased: "Куплено",
  active: "Активний",
  completed: "Завершено",
  reported: "Звітовано",
  planned: "Заплановано",
  reached: "Досягнуто",
  missed: "Пропущено",
  upcoming: "Очікується",
  todo: "Заплановано",
  in_progress: "В роботі",
  review: "На перевірці",
  done: "Готово",
  cancelled: "Скасовано",
  published: "Опубліковано",
  under_review: "На рецензії",
  delayed: "Затримка",
};

function MetaChips({ metadata }: { metadata: Record<string, string | number | boolean | null> }) {
  const entries = Object.entries(metadata).filter(
    ([k]) => !HIDDEN_KEYS.has(k),
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => {
        const label = META_LABEL[key] ?? key;
        const rawValue = value === null ? "" : String(value);
        const display = key === "status" ? (STATUS_LABEL[rawValue] ?? rawValue) : rawValue;
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600"
          >
            <span className="text-slate-400">{label}:</span>
            <span className="font-semibold text-slate-800">{display}</span>
          </span>
        );
      })}
    </div>
  );
}

// ── Date formatter ────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "щойно";
  if (m < 60) return `${m} хв тому`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} год тому`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} дн тому`;
  return formatDate(date);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const ALL_CATEGORIES = Object.keys(CATEGORY_META) as Category[];

// ── Main component ────────────────────────────────────────────────────────────

export function AuditLog({ events }: { events: AuditEvent[] }) {
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set());
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      const cat = getCategory(e.action);
      if (activeCategories.size > 0 && !activeCategories.has(cat)) return false;
      if (!q) return true;
      const label = (ACTION_LABEL[e.action] ?? e.action).toLowerCase();
      const actor = (e.actorEmail ?? e.actorId ?? "").toLowerCase();
      const metaStr = Object.values(e.metadata ?? {}).join(" ").toLowerCase();
      return label.includes(q) || actor.includes(q) || metaStr.includes(q);
    });
  }, [events, search, activeCategories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageEvents = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function toggleCategory(cat: Category) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setPage(0);
  }

  function clearFilters() {
    setActiveCategories(new Set());
    setSearch("");
    setPage(0);
  }

  const hasFilters = activeCategories.size > 0 || search.trim().length > 0;

  // Which categories actually appear in the data
  const presentCategories = useMemo(
    () => ALL_CATEGORIES.filter((c) => events.some((e) => getCategory(e.action) === c)),
    [events],
  );

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Пошук по події, учаснику…"
            className="h-8 rounded border border-slate-200 bg-white pl-8 pr-8 text-sm text-stone-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(0); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Stats + clear */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{filtered.length} з {events.length} подій</span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <X className="h-3 w-3" />
              Скинути
            </button>
          )}
        </div>
      </div>

      {/* ── Category filter chips ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {presentCategories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = activeCategories.has(cat);
          const count = events.filter((e) => getCategory(e.action) === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                isActive
                  ? meta.pill + " shadow-sm ring-1 ring-current/20"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {meta.icon}
              {meta.label}
              <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                isActive ? "bg-white/60" : "bg-slate-100 text-slate-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Event list ──────────────────────────────────────────────────── */}
      {pageEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
          {hasFilters ? "Жодної події не знайдено за вашим запитом." : "Подій ще немає."}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {pageEvents.map((event) => {
            const cat = getCategory(event.action);
            const meta = CATEGORY_META[cat];
            const label = ACTION_LABEL[event.action] ?? event.action;
            const title = event.metadata?.title ?? event.metadata?.taskTitle ?? event.metadata?.milestoneTitle ?? null;

            return (
              <div
                key={event._id ?? `${event.action}-${event.createdAt.toISOString()}`}
                className={`grid grid-cols-[auto_1fr_auto] items-start gap-3 border-l-[3px] px-4 py-3 transition hover:bg-slate-50/70 ${meta.row}`}
              >
                {/* Icon */}
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${meta.pill}`}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900">{label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.pill}`}>
                      {meta.label}
                    </span>
                  </div>

                  {title && (
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                      {title}
                    </p>
                  )}

                  <MetaChips metadata={
                    Object.fromEntries(
                      Object.entries(event.metadata ?? {}).filter(
                        ([k]) => k !== "title" && k !== "taskTitle" && k !== "milestoneTitle"
                      )
                    )
                  } />

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500">
                      {event.actorEmail ?? event.actorId}
                    </span>
                  </p>
                </div>

                {/* Time */}
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium text-slate-500" title={formatDate(event.createdAt)}>
                    {timeAgo(event.createdAt)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "short" }).format(event.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Назад
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`h-7 w-7 rounded text-xs font-semibold transition ${
                  i === safePage
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {i + 1}
              </button>
            )).slice(
              Math.max(0, safePage - 2),
              Math.min(totalPages, safePage + 3),
            )}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
            className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Далі
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
