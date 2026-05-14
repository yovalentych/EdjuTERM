"use client";

import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookText,
  FileText,
  Layers,
  LibraryBig,
  PenLine,
  Plus,
  ScrollText,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Manuscript, ManuscriptStatus, ManuscriptType, ProjectRecord, SafeUser } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import { deleteManuscriptAction } from "@/app/actions";
import { ManuscriptCreateModal } from "./manuscript-create-modal";
import { ManuscriptEditor } from "./manuscript-editor";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<ManuscriptType, React.ReactNode> = {
  article: <FileText className="h-4 w-4" />,
  dissertation: <BookOpen className="h-4 w-4" />,
  monograph: <BookText className="h-4 w-4" />,
  thesis: <ScrollText className="h-4 w-4" />,
  guide: <BookMarked className="h-4 w-4" />,
  other: <Layers className="h-4 w-4" />,
};

const TYPE_LABEL_UK: Record<ManuscriptType, string> = {
  article: "Стаття",
  dissertation: "Дисертація",
  monograph: "Монографія",
  thesis: "Тези",
  guide: "Посібник",
  other: "Інше",
};
const TYPE_LABEL_EN: Record<ManuscriptType, string> = {
  article: "Article",
  dissertation: "Dissertation",
  monograph: "Monograph",
  thesis: "Thesis",
  guide: "Guide",
  other: "Other",
};

const STATUS_LABEL_UK: Record<ManuscriptStatus, string> = {
  draft: "Чернетка",
  review: "Рецензування",
  submitted: "Подано",
  revision: "Ревізія",
  published: "Опубліковано",
};
const STATUS_LABEL_EN: Record<ManuscriptStatus, string> = {
  draft: "Draft",
  review: "Review",
  submitted: "Submitted",
  revision: "Revision",
  published: "Published",
};

const STATUS_DOT: Record<ManuscriptStatus, string> = {
  draft: "bg-slate-300",
  review: "bg-amber-400",
  submitted: "bg-blue-500",
  revision: "bg-orange-400",
  published: "bg-emerald-500",
};

const STATUS_BADGE: Record<ManuscriptStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  review: "bg-amber-50 text-amber-700",
  submitted: "bg-blue-50 text-blue-700",
  revision: "bg-orange-50 text-orange-700",
  published: "bg-emerald-50 text-emerald-700",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ManuscriptsExplorer({
  manuscripts: initialManuscripts,
  projectId,
  user,
  members,
  dictionary,
  locale,
  records,
}: {
  manuscripts: Manuscript[];
  projectId: string;
  user: SafeUser;
  members: SafeUser[];
  dictionary: Dictionary;
  locale: string;
  records: ProjectRecord[];
}) {
  const isUk = locale === "uk";
  const [manuscripts, setManuscripts] = useState(initialManuscripts);
  const [selectedId, setSelectedId] = useState<string | null>(initialManuscripts[0]?._id ?? null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ManuscriptStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selected = manuscripts.find((m) => m._id === selectedId) ?? null;
  const totalWords = manuscripts.reduce((sum, item) => sum + wordCount(item), 0);
  const activeCount = manuscripts.filter((item) => item.status === "draft" || item.status === "revision").length;

  const filtered = manuscripts.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = {
    all: manuscripts.length,
    draft: manuscripts.filter((m) => m.status === "draft").length,
    review: manuscripts.filter((m) => m.status === "review").length,
    submitted: manuscripts.filter((m) => m.status === "submitted").length,
    revision: manuscripts.filter((m) => m.status === "revision").length,
    published: manuscripts.filter((m) => m.status === "published").length,
  };

  const handleCreated = (manuscript: Manuscript) => {
    setManuscripts([manuscript, ...manuscripts]);
    setSelectedId(manuscript._id ?? null);
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(isUk ? "Ви впевнені, що хочете видалити цей рукопис?" : "Are you sure you want to delete this manuscript?")) return;
    setDeletingId(id);
    const result = await deleteManuscriptAction(id, projectId);
    if (result.ok) {
      setManuscripts(manuscripts.filter((m) => m._id !== id));
      if (selectedId === id) setSelectedId(null);
    }
    setDeletingId(null);
  };

  const filterTabs: Array<{ key: ManuscriptStatus | "all"; label: string }> = [
    { key: "all", label: isUk ? "Всі" : "All" },
    { key: "draft", label: isUk ? "Чернетки" : "Drafts" },
    { key: "review", label: isUk ? "Рецензування" : "Review" },
    { key: "submitted", label: isUk ? "Подано" : "Submitted" },
    { key: "revision", label: isUk ? "Ревізія" : "Revision" },
    { key: "published", label: isUk ? "Опубліковано" : "Published" },
  ];

  return (
    <>
      {showCreateModal && (
        <ManuscriptCreateModal
          projectId={projectId}
          members={members}
          currentUser={user}
          locale={locale}
          onCreated={handleCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[8px] border border-slate-200 bg-[#0A2640] p-6 text-white shadow-sm">
          <div className="absolute right-0 top-0 h-44 w-1/2 rounded-bl-[120px] bg-[#1C3D5B]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(101,228,163,0.18),transparent_20rem)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#65E4A3]">
                <Sparkles className="h-3.5 w-3.5" />
                {isUk ? "Рукописи і наукові тексти" : "Manuscripts and scientific writing"}
              </p>
              <h2 className="text-3xl font-semibold leading-tight">
                {isUk ? "Робочий простір для дисертацій, статей і тез" : "Workspace for dissertations, articles, and theses"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {isUk
                  ? "Пишіть текст, ведіть авторів, перевіряйте структуру, прив'язуйте записи та експортуйте документ без переходів між різними інструментами."
                  : "Write text, manage authors, check structure, attach records, and export documents without jumping between tools."}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#65E4A3] px-5 py-2.5 text-sm font-bold text-[#0A2640] transition hover:bg-white"
            >
              <Plus className="h-4 w-4" />
              {isUk ? "Новий рукопис" : "New manuscript"}
            </button>
          </div>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-4">
            <WorkspaceMetric icon={LibraryBig} label={isUk ? "Документів" : "Documents"} value={manuscripts.length} />
            <WorkspaceMetric icon={PenLine} label={isUk ? "Активні" : "Active"} value={activeCount} />
            <WorkspaceMetric icon={BarChart3} label={isUk ? "Слів" : "Words"} value={totalWords.toLocaleString()} />
            <WorkspaceMetric icon={FileText} label={isUk ? "Джерел" : "Sources"} value={records.length} />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className={`${selected ? "hidden xl:block" : "block"} overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-sm`}>
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isUk ? "Пошук за назвою..." : "Search by title..."}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {filterTabs.map(({ key, label }) => {
                  const count = statusCounts[key];
                  if (key !== "all" && count === 0) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        statusFilter === key ? "bg-[#0A2640] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                      <span className={statusFilter === key ? "text-[#65E4A3]" : "text-slate-400"}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[calc(100vh-360px)] min-h-[360px] overflow-y-auto">
              {filtered.length === 0 ? (
                <EmptyManuscriptState
                  isUk={isUk}
                  hasAny={manuscripts.length > 0}
                  onCreate={() => setShowCreateModal(true)}
                />
              ) : (
                <div className="grid gap-3 p-3">
                  {filtered.map((ms) => (
                    <ManuscriptListItem
                      key={ms._id}
                      manuscript={ms}
                      locale={locale}
                      isSelected={ms._id === selectedId}
                      isDeleting={deletingId === ms._id}
                      onClick={() => setSelectedId(ms._id ?? null)}
                      onDelete={(e) => handleDelete(ms._id!, e)}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className={`min-w-0 ${selected ? "block" : "hidden xl:block"}`}>
          {selected ? (
            <ManuscriptEditor
              manuscript={selected}
              records={records}
              members={members}
              projectId={projectId}
              onBack={() => setSelectedId(null)}
              onUpdate={(updated) => {
                setManuscripts((prev) =>
                  prev.map((m) => (m._id === updated._id ? updated : m)),
                );
              }}
              dictionary={dictionary}
              locale={locale}
              user={user}
            />
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[8px] border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0A2640] text-[#65E4A3]">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">
                {isUk ? "Оберіть рукопис для редагування" : "Select a manuscript to edit"}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {isUk
                  ? "Ліворуч показані всі рукописи проєкту. Створіть новий документ або відкрийте наявний."
                  : "All project manuscripts are listed on the left. Create a new document or open an existing one."}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0A2640] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#12385c]"
              >
                <Plus className="h-4 w-4" />
                {isUk ? "Створити рукопис" : "Create manuscript"}
              </button>
            </div>
          )}
          </div>
        </section>
      </div>
    </>
  );
}

// ── Compact list item ─────────────────────────────────────────────────────────

function ManuscriptListItem({
  manuscript: ms,
  locale,
  isSelected,
  isDeleting,
  onClick,
  onDelete,
}: {
  manuscript: Manuscript;
  locale: string;
  isSelected: boolean;
  isDeleting: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const isUk = locale === "uk";
  const words = wordCount(ms);
  const updatedAt = new Date(ms.updatedAt);
  const dateLabel = updatedAt.toLocaleDateString(isUk ? "uk-UA" : "en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <article
      onClick={onClick}
      className={`group relative cursor-pointer rounded-[8px] border p-4 transition ${
        isSelected ? "border-[#0A2640] bg-[#0A2640] text-white shadow-md" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex items-center gap-1.5 ${
            isSelected ? "text-[#65E4A3]" : "text-slate-400"
          }`}
        >
          {TYPE_ICON[ms.type]}
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {isUk ? TYPE_LABEL_UK[ms.type] : TYPE_LABEL_EN[ms.type]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[ms.status]}`} />
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isSelected ? "bg-white/10 text-white" : STATUS_BADGE[ms.status]}`}
          >
            {isUk ? STATUS_LABEL_UK[ms.status] : STATUS_LABEL_EN[ms.status]}
          </span>
        </div>
      </div>

      <p
        className={`mt-3 line-clamp-2 text-base font-bold leading-snug ${
          isSelected ? "text-white" : "text-slate-900"
        }`}
      >
        {ms.title}
      </p>

      <div className={`mt-4 flex items-center justify-between text-[11px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
        <div className="flex items-center gap-2">
          <span className="font-mono">
            {words.toLocaleString()} {isUk ? "сл." : "w."}
          </span>
          {ms.authors.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Users className="h-2.5 w-2.5" />
              {ms.authors[0].name.split(" ")[0]}
              {ms.authors.length > 1 && ` +${ms.authors.length - 1}`}
            </span>
          )}
        </div>
        <span>{dateLabel}</span>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className={`absolute right-3 top-12 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100 disabled:opacity-50 ${
          isSelected ? "text-white/45 hover:bg-white/10 hover:text-white" : "text-slate-300 hover:bg-rose-50 hover:text-rose-500"
        }`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </article>
  );
}

function WorkspaceMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/8 p-4 backdrop-blur">
      <Icon className="h-4 w-4 text-[#65E4A3]" />
      <p className="mt-3 font-mono text-2xl font-bold text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-300">{label}</p>
    </div>
  );
}

function EmptyManuscriptState({
  isUk,
  hasAny,
  onCreate,
}: {
  isUk: boolean;
  hasAny: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FileText className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-700">
        {hasAny ? (isUk ? "Нічого не знайдено" : "No matches") : (isUk ? "Ще немає рукописів" : "No manuscripts yet")}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        {hasAny
          ? isUk ? "Спробуйте інший пошук або фільтр." : "Try another search or filter."
          : isUk ? "Створіть перший документ для статті, тез чи дисертації." : "Create the first document for an article, thesis, or dissertation."}
      </p>
      {!hasAny && (
        <button
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0A2640] px-4 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {isUk ? "Створити" : "Create"}
        </button>
      )}
    </div>
  );
}

function wordCount(manuscript: Manuscript) {
  return manuscript.blocks
    .map((block) => block.content)
    .join(" ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
