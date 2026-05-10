"use client";

import { useState, useTransition } from "react";
import {
  BookOpen,
  Calendar,
  Check,
  Database,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  deleteOpenScienceUpdate,
  saveOpenScienceUpdate,
} from "@/app/actions";
import { openScienceCategories } from "@/lib/schemas";
import type { Dictionary } from "@/lib/i18n";
import type { OpenScienceUpdate, ProjectRecord, SafeUser } from "@/lib/schemas";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Tab = "published" | "draft";

const CATEGORY_COLORS: Record<string, string> = {
  data_repository: "bg-blue-50 text-blue-700 border-blue-200",
  updates: "bg-emerald-50 text-emerald-700 border-emerald-200",
  news: "bg-amber-50 text-amber-700 border-amber-200",
  conferences: "bg-violet-50 text-violet-700 border-violet-200",
  publications: "bg-rose-50 text-rose-700 border-rose-200",
  protocols: "bg-sky-50 text-sky-700 border-sky-200",
  outreach: "bg-orange-50 text-orange-700 border-orange-200",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  data_repository: <Database className="h-3 w-3" />,
  updates: <Globe className="h-3 w-3" />,
  news: <FileText className="h-3 w-3" />,
  conferences: <Calendar className="h-3 w-3" />,
  publications: <BookOpen className="h-3 w-3" />,
  protocols: <FileText className="h-3 w-3" />,
  outreach: <Globe className="h-3 w-3" />,
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getAuthorName(userId: string, members: SafeUser[]): string {
  const m = members.find((u) => u._id === userId);
  if (!m) return "—";
  return [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
}

function getAuthorInitials(userId: string, members: SafeUser[]): string {
  const m = members.find((u) => u._id === userId);
  if (!m) return "?";
  if (m.firstName || m.lastName) {
    return `${(m.firstName?.[0] ?? "")}${(m.lastName?.[0] ?? "")}`.toUpperCase();
  }
  return m.email[0].toUpperCase();
}

// ── Inline edit form ──────────────────────────────────────────────────────────

function InlineEditForm({
  update,
  records,
  dictionary,
  locale,
  returnTo,
  onCancel,
}: {
  update: OpenScienceUpdate;
  records: ProjectRecord[];
  dictionary: Dictionary;
  locale: string;
  returnTo?: string;
  onCancel: () => void;
}) {
  const fieldClass = "input-control w-full px-3 py-2 text-sm outline-none";

  return (
    <div className="border-b border-amber-200 bg-amber-50/60 px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-200 text-amber-800">
            <Pencil className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-amber-900">
            Редагування допису
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-amber-200 text-amber-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={saveOpenScienceUpdate} className="grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <input type="hidden" name="updateId" value={update._id} />
        <input type="hidden" name="projectId" value={update.projectId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-stone-600">Рубрика</span>
            <select name="category" className={fieldClass} defaultValue={update.category}>
              {openScienceCategories.map((c) => (
                <option key={c} value={c}>
                  {dictionary.openScience.categories[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-stone-600">
              {dictionary.openScience.title}
            </span>
            <input
              name="title"
              className={fieldClass}
              required
              defaultValue={update.title}
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-xs font-medium text-stone-600">
            {dictionary.openScience.summary}
          </span>
          <textarea
            name="summary"
            className={`${fieldClass} min-h-16 resize-y`}
            defaultValue={update.summary}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-stone-600">
            {dictionary.openScience.content}
          </span>
          <textarea
            name="content"
            className={`${fieldClass} min-h-28 resize-y`}
            defaultValue={update.content}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-stone-600">
              {dictionary.openScience.publicUrl}
            </span>
            <input
              name="publicUrl"
              type="url"
              className={fieldClass}
              placeholder="https://..."
              defaultValue={update.publicUrl}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-stone-600">
              {dictionary.openScience.accessibilityNotes}
            </span>
            <textarea
              name="accessibilityNotes"
              className={`${fieldClass} min-h-[42px] resize-y`}
              defaultValue={update.accessibilityNotes}
            />
          </label>
        </div>

        {/* Linked records */}
        {records.length > 0 && (
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium text-stone-600">
              Прив&apos;язані записи
            </legend>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {records.map((record) => (
                <label
                  key={record._id}
                  className="flex cursor-pointer items-start gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs hover:border-amber-300"
                >
                  <input
                    type="checkbox"
                    name="linkedRecordIds"
                    value={record._id}
                    defaultChecked={update.linkedRecordIds?.includes(record._id ?? "")}
                    className="mt-0.5 shrink-0 accent-amber-600"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-stone-800">
                      {record.title}
                    </span>
                    <span className="font-mono text-stone-400">{record.localId}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="control px-3 py-1.5 text-xs"
          >
            Скасувати
          </button>
          <button
            type="submit"
            name="status"
            value="draft"
            className="control px-3 py-1.5 text-xs font-semibold"
          >
            {dictionary.openScience.saveDraft}
          </button>
          <button
            type="submit"
            name="status"
            value="published"
            className="control-primary px-3 py-1.5 text-xs font-semibold"
          >
            {dictionary.openScience.publish}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Update card ───────────────────────────────────────────────────────────────

function UpdateCard({
  update,
  dictionary,
  members,
  records,
  locale,
  returnTo,
  onEdit,
}: {
  update: OpenScienceUpdate;
  dictionary: Dictionary;
  members: SafeUser[];
  records: ProjectRecord[];
  locale: string;
  returnTo?: string;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const categoryColor = CATEGORY_COLORS[update.category] ?? "bg-slate-50 text-slate-600 border-slate-200";
  const categoryIcon = CATEGORY_ICONS[update.category];

  const linkedRecords = records.filter((r) =>
    update.linkedRecordIds?.includes(r._id ?? ""),
  );

  function handleDelete() {
    if (!update._id) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("updateId", update._id!);
      fd.set("projectId", update.projectId);
      fd.set("locale", locale);
      if (returnTo) fd.set("returnTo", returnTo);
      await deleteOpenScienceUpdate(fd);
    });
  }

  return (
    <article className="group relative px-5 py-4 transition-colors hover:bg-slate-50/50">
      <div className="flex items-start gap-3">
        {/* Category indicator */}
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border ${categoryColor}`}
        >
          {categoryIcon}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryColor}`}
                >
                  {categoryIcon}
                  {dictionary.openScience.categories[update.category]}
                </span>
                {update.status === "published" && update.publicUrl && (
                  <a
                    href={update.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-blue-200 hover:text-blue-600"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    URL
                  </a>
                )}
              </div>
              <h3 className="mt-1.5 text-sm font-semibold leading-snug text-stone-950">
                {update.title}
              </h3>
            </div>

            {/* Action buttons — visible on hover */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={onEdit}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-amber-300 hover:text-amber-700"
                title="Редагувати"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={isPending}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                title="Видалити"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Summary */}
          {update.summary && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
              {update.summary}
            </p>
          )}

          {/* Content preview (if no summary) */}
          {!update.summary && update.content && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
              {update.content}
            </p>
          )}

          {/* Linked records */}
          {linkedRecords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <Link2 className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" />
              {linkedRecords.map((r) => (
                <span
                  key={r._id}
                  className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                >
                  {r.localId}
                </span>
              ))}
            </div>
          )}

          {/* Accessibility notes */}
          {update.accessibilityNotes && (
            <p className="mt-2 border-l-2 border-cyan-300 bg-cyan-50/60 px-2 py-1 text-[10px] leading-4 text-cyan-800 line-clamp-2">
              {update.accessibilityNotes}
            </p>
          )}

          {/* Footer: author + date */}
          <div className="mt-2.5 flex items-center gap-3 text-[10px] text-stone-400">
            <span className="flex items-center gap-1">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 font-semibold text-[9px] text-stone-600">
                {getAuthorInitials(update.createdBy, members)}
              </span>
              {getAuthorName(update.createdBy, members)}
            </span>
            {update.publishedAt && update.status === "published" ? (
              <span className="flex items-center gap-1">
                <Check className="h-2.5 w-2.5 text-emerald-500" />
                {formatDate(update.publishedAt)}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {formatDate(update.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={`Видалити "${update.title}"?`}
        message="Запис буде видалено безповоротно."
        onConfirm={() => { setConfirmOpen(false); handleDelete(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OpenScienceList({
  updates,
  dictionary,
  members = [],
  records = [],
  locale = "uk",
  returnTo,
}: {
  updates: OpenScienceUpdate[];
  dictionary: Dictionary;
  members?: SafeUser[];
  records?: ProjectRecord[];
  locale?: string;
  returnTo?: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("published");
  const [editingUpdate, setEditingUpdate] = useState<OpenScienceUpdate | null>(null);

  const published = updates.filter((u) => u.status === "published");
  const drafts = updates.filter((u) => u.status === "draft");
  const visible = activeTab === "published" ? published : drafts;

  function startEdit(update: OpenScienceUpdate) {
    setEditingUpdate(update);
    // If the item is a draft and we're on published tab, switch
    if (update.status === "draft") setActiveTab("draft");
    else setActiveTab("published");
  }

  return (
    <div className="surface overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50/60">
        <button
          type="button"
          onClick={() => { setActiveTab("published"); setEditingUpdate(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "published"
              ? "border-b-2 border-emerald-500 bg-white text-emerald-700"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {dictionary.openScience.published}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === "published"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {published.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("draft"); setEditingUpdate(null); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "draft"
              ? "border-b-2 border-amber-500 bg-white text-amber-700"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Pencil className="h-3.5 w-3.5" />
          {dictionary.openScience.draft}
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === "draft"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {drafts.length}
          </span>
        </button>
      </div>

      {/* Inline edit panel */}
      {editingUpdate && (
        <InlineEditForm
          update={editingUpdate}
          records={records}
          dictionary={dictionary}
          locale={locale}
          returnTo={returnTo}
          onCancel={() => setEditingUpdate(null)}
        />
      )}

      {/* List */}
      {visible.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            {activeTab === "published" ? (
              <Globe className="h-5 w-5 text-slate-400" />
            ) : (
              <Pencil className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <p className="text-sm font-medium text-stone-500">
            {activeTab === "published"
              ? dictionary.openScience.noPublished
              : dictionary.openScience.noUpdates}
          </p>
          {activeTab === "draft" && (
            <p className="mt-1 text-xs text-stone-400">
              Збережіть чернетку, щоб повернутися до неї пізніше.
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visible.map((update) => (
            <UpdateCard
              key={update._id}
              update={update}
              dictionary={dictionary}
              members={members}
              records={records}
              locale={locale}
              returnTo={returnTo}
              onEdit={() => startEdit(update)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
