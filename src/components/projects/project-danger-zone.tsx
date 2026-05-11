"use client";

import { AlertTriangle, Archive, Trash2, RotateCcw, ShieldAlert } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import {
  softDeleteProjectAction,
  hardDeleteProjectAction,
  restoreProjectAction,
} from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Project } from "@/lib/schemas";

const GRACE_DAYS = 30;

function daysLeft(deletedAt: Date): number {
  const ms = deletedAt.getTime() + GRACE_DAYS * 86_400_000 - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function ProjectDangerZone({
  project,
  locale,
  dictionary,
}: {
  project: Project;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const d = dictionary.projects;
  const isDeleted = !!project.deletedAt;

  if (isDeleted) {
    return <RestorePanel project={project} locale={locale} d={d} />;
  }

  return (
    <section className="overflow-hidden rounded-xl border-2 border-rose-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50/60 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-rose-900">{d.dangerZone}</h2>
          <p className="text-xs text-rose-500">{d.dangerZoneDesc}</p>
        </div>
      </div>

      <div className="divide-y divide-rose-100">
        {/* Soft delete */}
        <SoftDeleteRow project={project} locale={locale} d={d} />

        {/* Hard delete */}
        <HardDeleteRow project={project} locale={locale} d={d} />
      </div>
    </section>
  );
}

// ── Soft delete row ─────────────────────────────────────────────────────────

function SoftDeleteRow({
  project,
  locale,
  d,
}: {
  project: Project;
  locale: Locale;
  d: Dictionary["projects"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Archive className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{d.softDeleteTitle}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{d.softDeleteDesc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
        >
          <Archive className="h-3.5 w-3.5" />
          {d.softDeleteBtn}
        </button>
      </div>

      {open && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-sm font-semibold text-amber-900">{d.softDeleteConfirmTitle}</p>
          <p className="mb-4 text-xs text-amber-700">{d.softDeleteConfirmDesc}</p>
          <div className="flex items-center gap-3">
            <form action={softDeleteProjectAction}>
              <input type="hidden" name="projectId" value={project._id} />
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                <Archive className="h-3.5 w-3.5" />
                {d.softDeleteBtn}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              {locale === "uk" ? "Скасувати" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hard delete row ─────────────────────────────────────────────────────────

function HardDeleteRow({
  project,
  locale,
  d,
}: {
  project: Project;
  locale: Locale;
  d: Dictionary["projects"];
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const matches = value === project.acronym;

  return (
    <div className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{d.hardDeleteTitle}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{d.hardDeleteDesc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {d.hardDeleteBtn}
        </button>
      </div>

      {open && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <p className="text-xs font-medium text-rose-800">{d.hardDeleteDesc}</p>
          </div>
          <label className="mb-1 block text-xs font-semibold text-rose-800">
            {d.hardDeleteConfirmLabel}:{" "}
            <span className="font-mono font-bold">{project.acronym}</span>
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={d.hardDeleteConfirmPlaceholder}
            className="mb-4 block w-full rounded-lg border border-rose-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300"
            autoComplete="off"
          />
          <div className="flex items-center gap-3">
            <form action={hardDeleteProjectAction}>
              <input type="hidden" name="projectId" value={project._id} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="confirmation" value={value} />
              <button
                type="submit"
                disabled={!matches}
                className="flex items-center gap-2 rounded-lg border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {d.hardDeleteBtn}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setOpen(false); setValue(""); }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              {locale === "uk" ? "Скасувати" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Restore panel (shown if project is already soft-deleted) ────────────────

function RestorePanel({
  project,
  locale,
  d,
}: {
  project: Project;
  locale: Locale;
  d: Dictionary["projects"];
}) {
  const remaining = project.deletedAt ? daysLeft(project.deletedAt) : 0;

  return (
    <section className="overflow-hidden rounded-xl border-2 border-rose-200 bg-white">
      <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50/60 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-rose-900">{d.dangerZone}</h2>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
              {d.deletedBadge}
            </span>
          </div>
          <p className="text-xs text-rose-500">
            {d.expiresIn} <strong>{remaining}</strong> {d.days}
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{d.restoreTitle}</p>
              <p className="mt-0.5 text-xs text-slate-500">{d.restoreDesc}</p>
            </div>
          </div>
          <form action={restoreProjectAction}>
            <input type="hidden" name="projectId" value={project._id} />
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {d.restoreBtn}
            </button>
          </form>
        </div>

        {/* Hard delete still available even when in trash */}
        <div className="mt-4 border-t border-rose-100 pt-4">
          <HardDeleteRow project={project} locale={locale} d={d} />
        </div>
      </div>
    </section>
  );
}
