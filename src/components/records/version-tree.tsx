"use client";

import { GitBranch, GitCommit, Plus, X } from "lucide-react";
import { useState } from "react";
import { createRecordVariant, createRecordVersion } from "@/app/actions";
import type { ProjectRecord } from "@/lib/schemas";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TreeNode {
  record: ProjectRecord;
  children: TreeNode[];
}

interface VersionTreeProps {
  record: ProjectRecord;
  allRecords: ProjectRecord[];
  locale: string;
  returnTo: string;
  onSelectRecord: (r: ProjectRecord) => void;
}

// ── Tree builder ──────────────────────────────────────────────────────────────

function buildFamilyTree(record: ProjectRecord, all: ProjectRecord[]): { root: ProjectRecord; tree: TreeNode } | null {
  const familyRootId = record.rootRecordId || record._id || "";
  if (!familyRootId) return null;

  const family = all.filter(
    (r) => r._id === familyRootId || r.rootRecordId === familyRootId,
  );
  if (family.length === 0) return null;

  const root = family.find((r) => r._id === familyRootId);
  if (!root) return null;

  function buildNode(r: ProjectRecord): TreeNode {
    const children = family
      .filter((c) => c.parentVersionId === r._id)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    return { record: r, children: children.map(buildNode) };
  }

  return { root, tree: buildNode(root) };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RecordNode({
  node,
  currentId,
  depth,
  onSelect,
}: {
  node: TreeNode;
  currentId: string | undefined;
  depth: number;
  onSelect: (r: ProjectRecord) => void;
}) {
  const { record, children } = node;
  const isCurrent = record._id === currentId;
  const isRoot = !record.parentVersionId;
  const isVariant = !!record.variantLabel;

  return (
    <div className="relative">
      {/* Connector line from parent */}
      {depth > 0 && (
        <span className="absolute -top-2 left-3.5 h-4 w-px bg-slate-200" aria-hidden />
      )}

      <button
        type="button"
        onClick={() => onSelect(record)}
        className={`group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
          isCurrent
            ? "bg-indigo-50 ring-1 ring-indigo-200"
            : "hover:bg-slate-50"
        }`}
      >
        {/* Icon */}
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          isVariant
            ? "bg-violet-100 text-violet-600"
            : isRoot
            ? "bg-emerald-100 text-emerald-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {isVariant ? "⑂" : isRoot ? "●" : "○"}
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-medium leading-4 ${isCurrent ? "text-indigo-900" : "text-slate-800"}`}>
            {record.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {record.variantLabel && (
              <span className="rounded-sm bg-violet-100 px-1.5 py-px text-[10px] font-semibold text-violet-700">
                {record.variantLabel}
              </span>
            )}
            {record.version && (
              <span className="rounded-sm bg-slate-100 px-1.5 py-px text-[10px] text-slate-500">
                {record.version}
              </span>
            )}
            {record.versionNote && (
              <span className="truncate text-[10px] text-slate-400">{record.versionNote}</span>
            )}
          </div>
        </div>

        {isCurrent && (
          <span className="mt-0.5 shrink-0 rounded bg-indigo-100 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-indigo-600">
            {locale_current}
          </span>
        )}
      </button>

      {/* Children */}
      {children.length > 0 && (
        <div className={`relative ml-3.5 border-l border-slate-200 pl-4 ${depth === 0 ? "mt-1" : ""}`}>
          <div className="space-y-1">
            {children.map((child) => (
              <RecordNode
                key={child.record._id}
                node={child}
                currentId={currentId}
                depth={depth + 1}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Workaround: locale-aware "current" label passed via closure since component can't accept extra prop cleanly
let locale_current = "поточний";

// ── Create-version modal ──────────────────────────────────────────────────────

function CreateVersionModal({
  sourceRecord,
  returnTo,
  onClose,
}: {
  sourceRecord: ProjectRecord;
  returnTo: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Нова версія</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-500">
          Копіює всі дані з{" "}
          <span className="font-medium text-slate-700">{sourceRecord.title}</span>{" "}
          у новий запис. Ви зможете редагувати його незалежно.
        </p>

        <form action={createRecordVersion}>
          <input type="hidden" name="sourceRecordId" value={sourceRecord._id ?? ""} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="locale" value={returnTo.startsWith("/uk") ? "uk" : "en"} />

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Назва нової версії (необов&apos;язково)
              </label>
              <input
                name="title"
                className="input-control w-full"
                placeholder={sourceRecord.title}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Номер версії
              </label>
              <input name="version" className="input-control w-full" placeholder="v2.0" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Опис змін
              </label>
              <textarea
                name="versionNote"
                rows={3}
                className="input-control w-full resize-none"
                placeholder="Що змінилося в цій версії…"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              Скасувати
            </button>
            <button
              type="submit"
              className="control-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
            >
              <GitCommit className="h-3.5 w-3.5" />
              Створити версію
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create-variant modal ──────────────────────────────────────────────────────

function CreateVariantModal({
  sourceRecord,
  returnTo,
  onClose,
}: {
  sourceRecord: ProjectRecord;
  returnTo: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-900">Новий варіант</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-500">
          Варіант — це альтернативний підхід на основі{" "}
          <span className="font-medium text-slate-700">{sourceRecord.title}</span>.
          Дані копіюються, далі редагуєте незалежно.
        </p>

        <form action={createRecordVariant}>
          <input type="hidden" name="sourceRecordId" value={sourceRecord._id ?? ""} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="locale" value={returnTo.startsWith("/uk") ? "uk" : "en"} />

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Назва варіанту <span className="text-rose-500">*</span>
              </label>
              <input
                name="variantLabel"
                required
                className="input-control w-full"
                placeholder="наприклад: Фенол-хлороформ, CTAB, швидкий протокол…"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Назва запису (необов&apos;язково)
              </label>
              <input
                name="title"
                className="input-control w-full"
                placeholder={sourceRecord.title}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Обґрунтування / примітка
              </label>
              <textarea
                name="versionNote"
                rows={3}
                className="input-control w-full resize-none"
                placeholder="Чому цей варіант, у чому відмінність…"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              Скасувати
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Створити варіант
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function VersionTree({ record, allRecords, locale, returnTo, onSelectRecord }: VersionTreeProps) {
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);

  locale_current = locale === "uk" ? "поточний" : "current";

  // Records in this family (record itself is root OR shares rootRecordId)
  const isRoot = !record.rootRecordId;
  const familyRootId = record.rootRecordId || record._id || "";

  const familySize = allRecords.filter(
    (r) => r._id === familyRootId || r.rootRecordId === familyRootId,
  ).length;

  const result = buildFamilyTree(record, allRecords);

  // No tree yet — this is a standalone record with no family
  if (!result || familySize <= 1) {
    return (
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Версії та варіанти
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setShowVersionModal(true)}
              className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100"
              title="Нова версія"
            >
              <GitCommit className="h-3 w-3" /> Версія
            </button>
            <button
              type="button"
              onClick={() => setShowVariantModal(true)}
              className="flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
              title="Новий варіант"
            >
              <GitBranch className="h-3 w-3" /> Варіант
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center">
          <GitCommit className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-xs text-slate-400">Цей запис ще не має версій або варіантів.</p>
          <p className="mt-1 text-[10px] text-slate-400">
            Створіть <span className="font-medium text-blue-600">версію</span> для покращення методики або{" "}
            <span className="font-medium text-violet-600">варіант</span> для альтернативного підходу.
          </p>
        </div>

        {showVersionModal && (
          <CreateVersionModal sourceRecord={record} returnTo={returnTo} onClose={() => setShowVersionModal(false)} />
        )}
        {showVariantModal && (
          <CreateVariantModal sourceRecord={record} returnTo={returnTo} onClose={() => setShowVariantModal(false)} />
        )}
      </div>
    );
  }

  const { tree } = result;
  const variantCount = allRecords.filter(
    (r) => (r._id === familyRootId || r.rootRecordId === familyRootId) && !!r.variantLabel,
  ).length;

  return (
    <div className="px-5 py-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Версії та варіанти
          </p>
          <span className="rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-500">
            {familySize}
          </span>
          {variantCount > 0 && (
            <span className="rounded-full bg-violet-100 px-1.5 py-px text-[10px] font-semibold text-violet-600">
              {variantCount} {variantCount === 1 ? "варіант" : "варіанти"}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setShowVersionModal(true)}
            className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Plus className="h-3 w-3" /> Версія
          </button>
          <button
            type="button"
            onClick={() => setShowVariantModal(true)}
            className="flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            <Plus className="h-3 w-3" /> Варіант
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-bold text-emerald-700">●</span>
          Оригінал
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-700">○</span>
          Версія
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-violet-100 text-[8px] font-bold text-violet-700">⑂</span>
          Варіант
        </span>
      </div>

      {/* Tree */}
      <div className="rounded-lg border border-slate-100 bg-white p-2">
        <RecordNode
          node={tree}
          currentId={record._id}
          depth={0}
          onSelect={onSelectRecord}
        />
      </div>

      {/* Modals */}
      {showVersionModal && (
        <CreateVersionModal sourceRecord={record} returnTo={returnTo} onClose={() => setShowVersionModal(false)} />
      )}
      {showVariantModal && (
        <CreateVariantModal sourceRecord={record} returnTo={returnTo} onClose={() => setShowVariantModal(false)} />
      )}
    </div>
  );
}
