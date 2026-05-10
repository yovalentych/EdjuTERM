"use client";

import {
  BookMarked,
  BookOpen,
  BookText,
  FileText,
  Layers,
  Plus,
  ScrollText,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Manuscript, ManuscriptStatus, ManuscriptType, SafeUser } from "@/lib/schemas";
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
  records: any[];
}) {
  const isUk = locale === "uk";
  const [manuscripts, setManuscripts] = useState(initialManuscripts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ManuscriptStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selected = manuscripts.find((m) => m._id === selectedId) ?? null;

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

      {/* Two-panel layout */}
      <div className="flex items-start gap-0">

        {/* ── Left panel (list) ────────────────────────────────────────────── */}
        <aside
          className={`
            sticky top-[80px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm
            max-h-[calc(100vh-100px)] w-full lg:w-64 xl:w-72 lg:mr-5
            ${selected ? "hidden lg:flex" : "flex"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isUk ? "Рукописи" : "Manuscripts"}
              </h2>
              <p className="text-[10px] text-slate-400">
                {manuscripts.length} {isUk ? "документів" : "documents"}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-3 w-3" />
              {isUk ? "Новий" : "New"}
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-slate-100 px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <Search className="h-3 w-3 shrink-0 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isUk ? "Пошук рукопису..." : "Search manuscripts..."}
                className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
            {filterTabs.map(({ key, label }) => {
              const count = statusCounts[key];
              if (key !== "all" && count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                    statusFilter === key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {label}
                  <span className={`rounded-full px-1 text-[9px] ${statusFilter === key ? "bg-blue-500 text-white" : "bg-white text-slate-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <FileText className="h-10 w-10 text-slate-200" />
                <p className="mt-3 text-sm font-medium text-slate-400">
                  {manuscripts.length === 0
                    ? isUk ? "Ще немає рукописів" : "No manuscripts yet"
                    : isUk ? "Немає результатів" : "No results"}
                </p>
                {manuscripts.length === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {isUk ? "Створити перший" : "Create first one"}
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
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
              </ul>
            )}
          </div>
        </aside>

        {/* ── Right panel (editor / empty state) ───────────────────────── */}
        <div
          className={`min-w-0 flex-1 ${selected ? "block" : "hidden lg:block"}`}
        >
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
            /* Empty state */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-12 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <FileText className="h-8 w-8 text-blue-300" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-700">
                {isUk ? "Оберіть рукопис" : "Select a manuscript"}
              </h3>
              <p className="mt-1.5 max-w-xs text-sm text-slate-400">
                {isUk
                  ? "Оберіть документ зі списку зліва або створіть новий"
                  : "Select a document from the list or create a new one"}
              </p>
              {manuscripts.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  {isUk ? "Перший рукопис" : "Create first manuscript"}
                </button>
              )}
            </div>
          )}
        </div>
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
  const wordCount = ms.blocks
    .map((b) => b.content)
    .join(" ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const updatedAt = new Date(ms.updatedAt);
  const dateLabel = updatedAt.toLocaleDateString(isUk ? "uk-UA" : "en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <li
      onClick={onClick}
      className={`group relative cursor-pointer px-4 py-3 transition ${
        isSelected ? "bg-blue-50" : "hover:bg-slate-50"
      }`}
    >
      {/* Selected indicator stripe */}
      {isSelected && (
        <div className="absolute inset-y-0 left-0 w-[3px] rounded-r bg-blue-600" />
      )}

      {/* Type + status row */}
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex items-center gap-1.5 ${
            isSelected ? "text-blue-600" : "text-slate-400"
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
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_BADGE[ms.status]}`}
          >
            {isUk ? STATUS_LABEL_UK[ms.status] : STATUS_LABEL_EN[ms.status]}
          </span>
        </div>
      </div>

      {/* Title */}
      <p
        className={`mt-1.5 line-clamp-2 text-sm font-semibold leading-snug ${
          isSelected ? "text-blue-800" : "text-slate-800"
        }`}
      >
        {ms.title}
      </p>

      {/* Meta row */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-mono">
            {wordCount.toLocaleString()} {isUk ? "сл." : "w."}
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
        className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  );
}
